const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projects");

// All routes require authentication
router.use(authMiddleware);

// POST /api/projects - Create new project (manager only)
router.post("/", createProject);

// GET /api/projects - Get all projects (filtered by role)
router.get("/", getProjects);

// GET /api/projects/:id - Get project by ID
router.get("/:id", getProjectById);

// PUT /api/projects/:id - Update project (manager only)
router.put("/:id", updateProject);

// DELETE /api/projects/:id - Delete project (manager only)
router.delete("/:id", deleteProject);

module.exports = router;
