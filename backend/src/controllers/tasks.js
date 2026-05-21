const { v4: uuidv4 } = require("uuid");
const dynamodb = require("../config/dynamodb");
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand, SubscribeCommand, GetSubscriptionAttributesCommand, SetSubscriptionAttributesCommand, ListSubscriptionsByTopicCommand } = require("@aws-sdk/client-sns");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sns = require("../config/sns");

const TASKS_TABLE = "tasks";
const S3_ORIGINALS_BUCKET = process.env.S3_ORIGINALS_BUCKET;

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// Helper function to generate presigned GET URL for image
async function generatePresignedImageUrl(imageKey) {
  if (!imageKey) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: S3_ORIGINALS_BUCKET,
      Key: imageKey,
    });

    // Generate presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return null;
  }
}

// Helper function to get assignee name from userId
async function getAssigneeName(assigneeId) {
  if (!assigneeId) return null;

  try {
    const command = new GetCommand({
      TableName: "users",
      Key: { userId: assigneeId },
    });

    const result = await dynamodb.send(command);
    return result.Item?.name || null;
  } catch (error) {
    console.error("Error getting assignee name:", error);
    return null;
  }
}

// Helper function to ensure user is subscribed to SNS topic
async function ensureUserSubscribed(assigneeId) {
  try {
    // Step 1: Get assignee from DynamoDB users table
    const getUserCommand = new GetCommand({
      TableName: "users",
      Key: { userId: assigneeId },
    });

    const userResult = await dynamodb.send(getUserCommand);
    const assignee = userResult.Item;

    if (!assignee || !assignee.email) {
      console.warn(`No user or email found for assignee: ${assigneeId}`);
      return null;
    }

    let subscriptionStatus = assignee.subscriptionStatus;
    let subscriptionArn = assignee.subscriptionArn;

    // Step 2: Check if already subscribed
    // If subscription is confirmed or pending, check actual SNS status
    if (subscriptionArn && (subscriptionStatus === 'confirmed' || subscriptionStatus === 'pending')) {
      try {
        const getSubCommand = new GetSubscriptionAttributesCommand({
          SubscriptionArn: subscriptionArn
        });
        const subAttributes = await sns.send(getSubCommand);
        const actualStatus = subAttributes.Attributes.PendingConfirmation === 'false' ? 'confirmed' : 'pending';
        const currentFilterPolicy = subAttributes.Attributes.FilterPolicy;
        const expectedFilterPolicy = JSON.stringify({ assigneeEmail: [assignee.email] });

        // Check if filter policy needs to be updated
        if (currentFilterPolicy !== expectedFilterPolicy) {
          console.log(`🔄 Updating filter policy for ${assignee.email}`);
          await sns.send(new SetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn,
            AttributeName: 'FilterPolicy',
            AttributeValue: expectedFilterPolicy
          }));
          console.log(`✅ Filter policy updated for ${assignee.email}`);
        }

        // If confirmed in SNS but pending in DB, sync it
        if (actualStatus === 'confirmed' && subscriptionStatus !== 'confirmed') {
          console.log(`🔄 Syncing subscription status for ${assignee.email}: pending → confirmed`);
          await dynamodb.send(new UpdateCommand({
            TableName: "users",
            Key: { userId: assigneeId },
            UpdateExpression: "SET subscriptionStatus = :status, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":status": "confirmed",
              ":updatedAt": new Date().toISOString()
            }
          }));
          subscriptionStatus = 'confirmed';
          console.log(`✅ Subscription status updated to confirmed for ${assignee.email}`);
        }

        // If subscription is confirmed or pending, return email
        if (actualStatus === 'confirmed') {
          console.log(`✅ User ${assignee.email} already subscribed and confirmed`);
          return assignee.email;
        } else if (actualStatus === 'pending') {
          console.log(`ℹ️  User ${assignee.email} subscription pending confirmation`);
          return assignee.email;
        }
      } catch (err) {
        // If subscription ARN is invalid or doesn't exist, we need to resubscribe
        if (err.name === 'NotFoundException' || err.message.includes('not found')) {
          console.warn(`⚠️  Subscription ARN no longer valid for ${assignee.email}, will re-subscribe`);
          subscriptionArn = null;
          subscriptionStatus = null;
        } else {
          console.warn('Could not check subscription status:', err.message);
          // If we can't verify but have a confirmed status, trust it
          if (subscriptionStatus === 'confirmed') {
            return assignee.email;
          }
        }
      }
    }

    // Step 2.5: Check if email already has a subscription (without saved ARN)
    // This handles the case where subscription exists in SNS but not in our DB
    if (!subscriptionArn) {
      try {
        const listSubs = await sns.send(new ListSubscriptionsByTopicCommand({
          TopicArn: process.env.SNS_TOPIC_ARN
        }));

        const existingSub = listSubs.Subscriptions.find(
          sub => sub.Protocol === 'email' && sub.Endpoint === assignee.email
        );

        if (existingSub && existingSub.SubscriptionArn !== 'PendingConfirmation') {
          console.log(`🔍 Found existing subscription for ${assignee.email}`);
          subscriptionArn = existingSub.SubscriptionArn;

          // Update filter policy if needed
          const getSubCommand = new GetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn
          });
          const subAttributes = await sns.send(getSubCommand);
          const currentFilterPolicy = subAttributes.Attributes.FilterPolicy;
          const expectedFilterPolicy = JSON.stringify({ assigneeEmail: [assignee.email] });

          if (currentFilterPolicy !== expectedFilterPolicy) {
            console.log(`🔄 Updating filter policy for ${assignee.email}`);
            await sns.send(new SetSubscriptionAttributesCommand({
              SubscriptionArn: subscriptionArn,
              AttributeName: 'FilterPolicy',
              AttributeValue: expectedFilterPolicy
            }));
            console.log(`✅ Filter policy updated for ${assignee.email}`);
          }

          // Save to DB
          const isPending = subAttributes.Attributes.PendingConfirmation === 'true';
          await dynamodb.send(new UpdateCommand({
            TableName: "users",
            Key: { userId: assigneeId },
            UpdateExpression: "SET subscriptionArn = :subArn, subscriptionStatus = :status, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":subArn": subscriptionArn,
              ":status": isPending ? "pending" : "confirmed",
              ":updatedAt": new Date().toISOString()
            }
          }));

          console.log(`✅ Subscription synced for ${assignee.email}`);
          return assignee.email;
        }
      } catch (err) {
        console.warn('Could not check existing subscriptions:', err.message);
      }
    }

    // If already confirmed, return immediately
    if (subscriptionStatus === 'confirmed') {
      console.log(`✅ User ${assignee.email} already confirmed (no ARN check needed)`);
      return assignee.email;
    }

    // If pending without ARN check, return (they already got confirmation email)
    if (subscriptionStatus === 'pending' && subscriptionArn) {
      console.log(`ℹ️  User ${assignee.email} subscription pending confirmation`);
      return assignee.email;
    }

    // Step 3: User needs to be subscribed
    console.log(`📧 Subscribing ${assignee.email} to SNS topic with filter policy...`);

    const subscribeCommand = new SubscribeCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Protocol: "email",
      Endpoint: assignee.email,
      Attributes: {
        FilterPolicy: JSON.stringify({
          assigneeEmail: [assignee.email]
        })
      },
      ReturnSubscriptionArn: true
    });

    const subscribeResult = await sns.send(subscribeCommand);
    const newSubscriptionArn = subscribeResult.SubscriptionArn;

    // Step 4: Update user in DynamoDB
    const updateUserCommand = new UpdateCommand({
      TableName: "users",
      Key: { userId: assigneeId },
      UpdateExpression: "SET subscriptionArn = :subArn, subscriptionStatus = :status, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":subArn": newSubscriptionArn,
        ":status": "pending", // User must confirm email
        ":updatedAt": new Date().toISOString()
      }
    });

    await dynamodb.send(updateUserCommand);
    console.log(`✅ Subscription created for ${assignee.email} (status: pending confirmation)`);
    console.log(`⚠️  User must confirm subscription email from AWS SNS`);

    // Step 5: Return assignee email
    return assignee.email;

  } catch (error) {
    console.error(`❌ Error ensuring subscription for assignee ${assigneeId}:`, error.message);
    // If error is "already subscribed", try to get email anyway
    if (error.message.includes('already') || error.message.includes('duplicate')) {
      try {
        const getUserCommand = new GetCommand({
          TableName: "users",
          Key: { userId: assigneeId },
        });
        const userResult = await dynamodb.send(getUserCommand);
        return userResult.Item?.email || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

// POST /api/tasks - Create new task (manager only)
exports.createTask = async (req, res) => {
  try {
    // Check if user is manager
    const userRole = req.user["custom:role"];
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only managers can create tasks" });
    }

    const { title, description, priority, deadline, assigneeId, teamId, projectId, imageUrl } = req.body;

    // Validate required fields
    if (!title || !description || !priority || !deadline || !assigneeId || !teamId || !projectId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate priority
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority. Must be LOW, MEDIUM, or HIGH" });
    }

    const taskId = uuidv4();
    const now = new Date().toISOString();

    const task = {
      taskId,
      title,
      description,
      status: "TODO",
      priority,
      deadline,
      assigneeId,
      teamId,
      projectId,
      ...(imageUrl && { imageUrl }),
      createdBy: req.user.sub,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TASKS_TABLE,
      Item: task,
    });

    await dynamodb.send(command);

    // Send email notification to assigned employee only
    try {
      // Get assignee email and ensure subscribed
      const assigneeEmail = await ensureUserSubscribed(task.assigneeId);

      if (assigneeEmail) {
        // Publish task notification to SNS
        await sns.send(new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: "New Task Assigned: " + task.title,
          Message: `You have been assigned a new task.

Task Details:
- Title: ${task.title}
- Priority: ${task.priority}
- Deadline: ${task.deadline}
- Team: ${task.teamId}
- Description: ${task.description}

Please log in to Mini-Jira to view your task.`,
          MessageAttributes: {
            assigneeEmail: {
              DataType: "String",
              StringValue: assigneeEmail
            }
          }
        }));

        console.log(`📬 Task notification published to SNS topic`);
        console.log(`📧 Email notification will be sent to: ${assigneeEmail}`);
      }
    } catch (snsError) {
      console.error("Error sending SNS notification:", snsError);
      // Don't fail task creation if SNS fails
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
};

// GET /api/tasks - Get all tasks (filtered by role)
exports.getTasks = async (req, res) => {
  try {
    const { teamId } = req.query;
    const userRole = req.user["custom:role"];
    const userId = req.user.sub;

    // If user is employee, get their teamId from database and filter tasks
    if (userRole === "employee") {
      // Get user's teamId from database
      const userCommand = new GetCommand({
        TableName: "users",
        Key: { userId }
      });
      const userResult = await dynamodb.send(userCommand);
      const userTeamId = userResult.Item?.teamId;

      console.log('Employee fetching tasks:', {
        userId,
        userTeamId,
        userRole,
        userItem: userResult.Item
      });

      if (!userTeamId) {
        return res.status(400).json({ error: "User team not found" });
      }

      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": userTeamId,
        },
      });

      const result = await dynamodb.send(command);
      console.log('Filtered tasks for employee:', result.Items?.length, 'tasks');

      // Generate presigned URLs for images and get assignee names
      const tasksWithDetails = await Promise.all(
        (result.Items || []).map(async (task) => {
          if (task.imageKey) {
            task.imageUrl = await generatePresignedImageUrl(task.imageKey);
          }
          if (task.assigneeId) {
            task.assigneeName = await getAssigneeName(task.assigneeId);
          }
          return task;
        })
      );

      return res.status(200).json(tasksWithDetails);
    }

    // If user is manager
    let result;
    if (teamId) {
      // Filter by teamId if provided
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": teamId,
        },
      });

      result = await dynamodb.send(command);
    } else {
      // Scan entire table
      const command = new ScanCommand({
        TableName: TASKS_TABLE,
      });

      result = await dynamodb.send(command);
    }

    // Generate presigned URLs for images and get assignee names
    const tasksWithDetails = await Promise.all(
      (result.Items || []).map(async (task) => {
        if (task.imageKey) {
          task.imageUrl = await generatePresignedImageUrl(task.imageKey);
        }
        if (task.assigneeId) {
          task.assigneeName = await getAssigneeName(task.assigneeId);
        }
        return task;
      })
    );

    return res.status(200).json(tasksWithDetails);
  } catch (error) {
    console.error("Error getting tasks:", error);
    return res.status(500).json({ error: "Failed to get tasks" });
  }
};

// GET /api/tasks/:id - Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const command = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const result = await dynamodb.send(command);

    if (!result.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = result.Item;

    // If employee, check if task belongs to their team
    const userRole = req.user["custom:role"];
    const userTeamId = req.user["custom:teamId"];
    if (userRole === "employee" && task.teamId !== userTeamId) {
      return res.status(403).json({ error: "Forbidden: Task does not belong to your team" });
    }

    // Generate presigned URL for image if exists
    if (task.imageKey) {
      task.imageUrl = await generatePresignedImageUrl(task.imageKey);
    }

    // Get assignee name
    if (task.assigneeId) {
      task.assigneeName = await getAssigneeName(task.assigneeId);
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error getting task by ID:", error);
    return res.status(500).json({ error: "Failed to get task" });
  }
};

// PUT /api/tasks/:id - Update task (manager only)
exports.updateTask = async (req, res) => {
  try {
    // Check if user is manager
    const userRole = req.user["custom:role"];
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only managers can update tasks" });
    }

    const { id } = req.params;
    const { title, description, priority, deadline, assigneeId, teamId, projectId, imageUrl } = req.body;

    // Check if task exists
    const getCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const getResult = await dynamodb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldTask = getResult.Item;
    const isReassigned = assigneeId !== undefined && assigneeId !== oldTask.assigneeId;

    // Validate priority if provided
    if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority. Must be LOW, MEDIUM, or HIGH" });
    }

    const now = new Date().toISOString();

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (title !== undefined) {
      updateExpressions.push("#title = :title");
      expressionAttributeNames["#title"] = "title";
      expressionAttributeValues[":title"] = title;
    }
    if (description !== undefined) {
      updateExpressions.push("#description = :description");
      expressionAttributeNames["#description"] = "description";
      expressionAttributeValues[":description"] = description;
    }
    if (priority !== undefined) {
      updateExpressions.push("#priority = :priority");
      expressionAttributeNames["#priority"] = "priority";
      expressionAttributeValues[":priority"] = priority;
    }
    if (deadline !== undefined) {
      updateExpressions.push("#deadline = :deadline");
      expressionAttributeNames["#deadline"] = "deadline";
      expressionAttributeValues[":deadline"] = deadline;
    }
    if (assigneeId !== undefined) {
      updateExpressions.push("#assigneeId = :assigneeId");
      expressionAttributeNames["#assigneeId"] = "assigneeId";
      expressionAttributeValues[":assigneeId"] = assigneeId;
    }
    if (teamId !== undefined) {
      updateExpressions.push("#teamId = :teamId");
      expressionAttributeNames["#teamId"] = "teamId";
      expressionAttributeValues[":teamId"] = teamId;
    }
    if (projectId !== undefined) {
      updateExpressions.push("#projectId = :projectId");
      expressionAttributeNames["#projectId"] = "projectId";
      expressionAttributeValues[":projectId"] = projectId;
    }
    if (imageUrl !== undefined) {
      updateExpressions.push("#imageUrl = :imageUrl");
      expressionAttributeNames["#imageUrl"] = "imageUrl";
      expressionAttributeValues[":imageUrl"] = imageUrl;
    }

    // Always update updatedAt
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = now;

    const updateCommand = new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await dynamodb.send(updateCommand);

    // Send email notification if task was reassigned
    if (isReassigned) {
      try {
        // Ensure new assignee is subscribed
        const newAssigneeEmail = await ensureUserSubscribed(assigneeId);

        if (newAssigneeEmail) {
          // Publish reassignment notification
          await sns.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: "Task Reassigned To You: " + updateResult.Attributes.title,
            Message: `A task has been assigned to you.

Task Details:
- Title: ${updateResult.Attributes.title}
- Priority: ${updateResult.Attributes.priority}
- Deadline: ${updateResult.Attributes.deadline}
- Team: ${updateResult.Attributes.teamId}
- Description: ${updateResult.Attributes.description}

Please log in to Mini-Jira to view your task.`,
            MessageAttributes: {
              assigneeEmail: {
                DataType: "String",
                StringValue: newAssigneeEmail
              }
            }
          }));

          console.log(`📬 Task reassignment notification published to SNS topic`);
          console.log(`📧 Email notification will be sent to: ${newAssigneeEmail}`);
        }
      } catch (snsError) {
        console.error("Error sending SNS notification:", snsError);
        // Don't fail task update if SNS fails
      }
    }

    return res.status(200).json(updateResult.Attributes);
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
};

// DELETE /api/tasks/:id - Delete task (manager only)
exports.deleteTask = async (req, res) => {
  try {
    // Check if user is manager
    const userRole = req.user["custom:role"];
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only managers can delete tasks" });
    }

    const { id } = req.params;

    // Check if task exists
    const getCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const getResult = await dynamodb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = getResult.Item;

    // Delete images from S3 if task has an image
    if (task.imageKey) {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

      try {
        // Delete from originals bucket
        const deleteOriginalCommand = new DeleteObjectCommand({
          Bucket: S3_ORIGINALS_BUCKET,
          Key: task.imageKey,
        });
        await s3Client.send(deleteOriginalCommand);
        console.log(`Deleted image from originals bucket: ${task.imageKey}`);

        // Delete from resized bucket (same key, not prefixed)
        const deleteResizedCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_RESIZED_BUCKET,
          Key: task.imageKey,
        });
        await s3Client.send(deleteResizedCommand);
        console.log(`Deleted image from resized bucket: ${task.imageKey}`);
      } catch (s3Error) {
        // Log error but don't fail task deletion if S3 delete fails
        console.error("Error deleting images from S3:", s3Error);
      }
    }

    // Delete task from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    await dynamodb.send(deleteCommand);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
};

// PUT /api/tasks/:id/status - Update task status (employee and manager)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be TODO, IN_PROGRESS, IN_REVIEW, or DONE" });
    }

    // Get current task
    const getCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const getResult = await dynamodb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = getResult.Item;

    // If employee, check if task is assigned to them
    const userRole = req.user["custom:role"];
    const userId = req.user.sub;

    if (userRole === "employee") {
      if (task.assigneeId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only update tasks assigned to you" });
      }
    }

    const oldStatus = task.status;
    const now = new Date().toISOString();

    // Create audit log entry
    const auditLog = {
      changedBy: req.user.sub,
      changedAt: now,
      oldStatus,
      newStatus: status,
    };

    // Prepare audit logs array
    const auditLogs = task.auditLogs || [];
    auditLogs.push(auditLog);

    const updateCommand = new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #auditLogs = :auditLogs",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#auditLogs": "auditLogs",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": now,
        ":auditLogs": auditLogs,
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await dynamodb.send(updateCommand);

    return res.status(200).json(updateResult.Attributes);
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ error: "Failed to update task status" });
  }
};
