const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createComment,
  getCommentsByTaskId,
} = require("../controllers/comments");

// All routes require authentication
router.use(authMiddleware);

// POST /api/comments - Create new comment (employees and managers)
router.post("/", createComment);

// GET /api/comments/:taskId - Get all comments for a task
router.get("/:taskId", getCommentsByTaskId);

// DELETE /api/comments/:id - Delete comment by id
router.delete("/comments/:id", commentsController.deleteComment);

module.exports = router;
