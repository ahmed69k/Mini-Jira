const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateStatus,
} = require("../controllers/tasks");

// All routes require authentication
router.use(authMiddleware);

// POST /api/tasks - Create new task (manager only)
router.post("/", createTask);

// GET /api/tasks - Get all tasks (filtered by role)
router.get("/", getTasks);

// PUT /api/tasks/:id/status - Update task status (employee and manager)
// IMPORTANT: This must come BEFORE /:id route
router.put("/:id/status", updateStatus);

// GET /api/tasks/:id - Get task by ID
router.get("/:id", getTaskById);

// PUT /api/tasks/:id - Update task (manager only)
router.put("/:id", updateTask);

// DELETE /api/tasks/:id - Delete task (manager only)
router.delete("/:id", deleteTask);

module.exports = router;
