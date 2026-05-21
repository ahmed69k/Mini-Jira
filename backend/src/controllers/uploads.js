const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const dynamodb = require("../config/dynamodb");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const TASKS_TABLE = "tasks";
const ORIGINALS_BUCKET = process.env.S3_ORIGINALS_BUCKET;
const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;

// POST /api/uploads/presigned-url - Generate presigned URL for S3 upload
exports.getPresignedUrl = async (req, res) => {
  try {
    const { taskId, filename, contentType } = req.body;

    // Validate required fields
    if (!taskId || !filename || !contentType) {
      return res.status(400).json({ error: "Missing required fields: taskId, filename, contentType" });
    }

    // Validate content type (only images)
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    // Authorization: Check if user can upload to this task
    const userRole = req.user["custom:role"];
    const userId = req.user.sub;

    // If employee, verify task is assigned to them
    if (userRole === "employee") {
      const { GetCommand } = require("@aws-sdk/lib-dynamodb");

      // Get task to check assigneeId
      const getTaskCommand = new GetCommand({
        TableName: TASKS_TABLE,
        Key: { taskId },
      });

      const taskResult = await dynamodb.send(getTaskCommand);

      if (!taskResult.Item) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = taskResult.Item;

      // Check if task is assigned to this user
      if (task.assigneeId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only upload images to tasks assigned to you" });
      }
    }
    // Managers can upload to any task

    // Generate S3 key: tasks/{taskId}/{filename}
    const key = `tasks/${taskId}/${filename}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: ORIGINALS_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL (expires in 300 seconds = 5 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    return res.status(200).json({
      presignedUrl,
      key,
      bucket: ORIGINALS_BUCKET,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return res.status(500).json({ error: "Failed to generate presigned URL" });
  }
};

// DELETE /api/uploads/delete - Delete image from S3
exports.deleteImage = async (req, res) => {
  try {
    // Get key from request body instead of URL params to handle slashes
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Missing key in request body" });
    }

    // Extract taskId from key (format: tasks/{taskId}/{filename})
    const keyParts = key.split('/');
    if (keyParts.length < 3 || keyParts[0] !== 'tasks') {
      return res.status(400).json({ error: "Invalid key format" });
    }

    const taskId = keyParts[1];

    // Authorization: Check if user can delete this image
    const userRole = req.user["custom:role"];

    // If employee, verify task belongs to their team
    if (userRole === "employee") {
      const { GetCommand } = require("@aws-sdk/lib-dynamodb");

      // Get task to check teamId
      const getTaskCommand = new GetCommand({
        TableName: TASKS_TABLE,
        Key: { taskId },
      });

      const taskResult = await dynamodb.send(getTaskCommand);

      if (!taskResult.Item) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = taskResult.Item;

      // Check if task is assigned to this user
      const userId = req.user.sub;
      if (task.assigneeId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only delete images from tasks assigned to you" });
      }
    }
    // Managers can delete any image

    // Delete from originals bucket
    const deleteOriginalCommand = new DeleteObjectCommand({
      Bucket: ORIGINALS_BUCKET,
      Key: key,
    });

    await s3Client.send(deleteOriginalCommand);

    // Delete from resized bucket (thumbnail)
    const resizedKey = `resized/${key}`;
    const deleteResizedCommand = new DeleteObjectCommand({
      Bucket: RESIZED_BUCKET,
      Key: resizedKey,
    });

    try {
      await s3Client.send(deleteResizedCommand);
    } catch (err) {
      // If resized image doesn't exist, continue
      console.log("Resized image not found or already deleted:", err.message);
    }

    // Update task in DynamoDB to remove image references
    const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
    const updateCommand = new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: "REMOVE imageUrl, imageKey SET updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
      },
    });

    await dynamodb.send(updateCommand);

    return res.status(200).json({
      message: "Image deleted successfully",
      deletedKey: key,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({ error: "Failed to delete image" });
  }
};

// PUT /api/uploads/link - Link image to task in DynamoDB
exports.linkImageToTask = async (req, res) => {
  try {
    const { taskId, key } = req.body;

    // Validate required fields
    if (!taskId || !key) {
      return res.status(400).json({ error: "Missing required fields: taskId, key" });
    }

    // Authorization: Check if user can link image to this task
    const userRole = req.user["custom:role"];

    // If employee, verify task belongs to their team
    if (userRole === "employee") {
      const { GetCommand } = require("@aws-sdk/lib-dynamodb");

      // Get task to check teamId
      const getTaskCommand = new GetCommand({
        TableName: TASKS_TABLE,
        Key: { taskId },
      });

      const taskResult = await dynamodb.send(getTaskCommand);

      if (!taskResult.Item) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = taskResult.Item;

      // Check if task is assigned to this user
      const userId = req.user.sub;
      if (task.assigneeId !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only link images to tasks assigned to you" });
      }
    }
    // Managers can link images to any task

    const now = new Date().toISOString();

    // Generate CloudFront URL
    const imageUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;

    // Update task in DynamoDB
    const command = new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: "SET #imageUrl = :imageUrl, #imageKey = :imageKey, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#imageUrl": "imageUrl",
        "#imageKey": "imageKey",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":imageUrl": imageUrl,
        ":imageKey": key,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    });

    const result = await dynamodb.send(command);

    if (!result.Attributes) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json({
      imageUrl,
      imageKey: key,
    });
  } catch (error) {
    console.error("Error linking image to task:", error);
    return res.status(500).json({ error: "Failed to link image to task" });
  }
};
