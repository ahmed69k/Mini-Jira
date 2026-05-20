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
    const { taskId, imageUrl, imageKey } = req.body;

    // Validate required fields
    if (!taskId || !imageUrl || !imageKey) {
      return res.status(400).json({ error: "Missing required fields: taskId, imageUrl, imageKey" });
    }

    const now = new Date().toISOString();

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
        ":imageKey": imageKey,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    });

    const result = await dynamodb.send(command);

    if (!result.Attributes) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(result.Attributes);
  } catch (error) {
    console.error("Error linking image to task:", error);
    return res.status(500).json({ error: "Failed to link image to task" });
  }
};
