const { v4: uuidv4 } = require("uuid");
const { dynamoDb } = require("../config/dynamodb");
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const TASKS_TABLE = "Tasks";

// POST /api/tasks - Create new task (manager only)
exports.createTask = async (req, res) => {
  try {
    // Check if user is manager
    if (req.user.role !== "manager") {
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
      createdBy: req.user.userId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TASKS_TABLE,
      Item: task,
    });

    await dynamoDb.send(command);

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

    // If user is employee, only return tasks from their team
    if (req.user.role === "employee") {
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": req.user.teamId,
        },
      });

      const result = await dynamoDb.send(command);
      return res.status(200).json(result.Items || []);
    }

    // If user is manager
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

      const result = await dynamoDb.send(command);
      return res.status(200).json(result.Items || []);
    } else {
      // Scan entire table
      const command = new ScanCommand({
        TableName: TASKS_TABLE,
      });

      const result = await dynamoDb.send(command);
      return res.status(200).json(result.Items || []);
    }
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

    const result = await dynamoDb.send(command);

    if (!result.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = result.Item;

    // If employee, check if task belongs to their team
    if (req.user.role === "employee" && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: "Forbidden: Task does not belong to your team" });
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
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can update tasks" });
    }

    const { id } = req.params;
    const { title, description, priority, deadline, assigneeId, teamId, projectId, imageUrl } = req.body;

    // Check if task exists
    const getCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const getResult = await dynamoDb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

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

    const updateResult = await dynamoDb.send(updateCommand);

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
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can delete tasks" });
    }

    const { id } = req.params;

    // Check if task exists
    const getCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    const getResult = await dynamoDb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const deleteCommand = new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { taskId: id },
    });

    await dynamoDb.send(deleteCommand);

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

    const getResult = await dynamoDb.send(getCommand);

    if (!getResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = getResult.Item;

    // If employee, check if task belongs to their team
    if (req.user.role === "employee" && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: "Forbidden: You can only update tasks in your team" });
    }

    const oldStatus = task.status;
    const now = new Date().toISOString();

    // Create audit log entry
    const auditLog = {
      changedBy: req.user.userId,
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

    const updateResult = await dynamoDb.send(updateCommand);

    return res.status(200).json(updateResult.Attributes);
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ error: "Failed to update task status" });
  }
};
