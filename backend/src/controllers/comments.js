const { v4: uuidv4 } = require("uuid");
const dynamodb = require("../config/dynamodb");
const { PutCommand, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const COMMENTS_TABLE = "comments";
const TASKS_TABLE = "tasks";

// POST /api/comments - Create new comment (employees and managers)
exports.createComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;

    // Validate required fields
    if (!taskId || !content) {
      return res.status(400).json({ error: "Missing required fields: taskId and content" });
    }

    // Check if task exists and user has access
    const getTaskCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
    });

    const taskResult = await dynamodb.send(getTaskCommand);

    if (!taskResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskResult.Item;

    // If employee, check if task belongs to their team
    if (req.user.role === "employee" && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: "Forbidden: Task does not belong to your team" });
    }

    const commentId = uuidv4();
    const now = new Date().toISOString();

    const comment = {
      commentId,
      taskId,
      content,
      createdBy: req.user.userId,
      createdAt: now,
    };

    const command = new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: comment,
    });

    await dynamodb.send(command);

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
};

// GET /api/comments/:taskId - Get all comments for a task
exports.getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists and user has access
    const getTaskCommand = new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
    });

    const taskResult = await dynamodb.send(getTaskCommand);

    if (!taskResult.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskResult.Item;

    // If employee, check if task belongs to their team
    if (req.user.role === "employee" && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: "Forbidden: Task does not belong to your team" });
    }

    // Query comments by taskId
    const command = new QueryCommand({
      TableName: COMMENTS_TABLE,
      IndexName: "taskId-index",
      KeyConditionExpression: "taskId = :taskId",
      ExpressionAttributeValues: {
        ":taskId": taskId,
      },
      ScanIndexForward: true, // Sort by createdAt in ascending order (oldest first)
    });

    const result = await dynamodb.send(command);

    return res.status(200).json(result.Items || []);
  } catch (error) {
    console.error("Error getting comments:", error);
    return res.status(500).json({ error: "Failed to get comments" });
  }
};
