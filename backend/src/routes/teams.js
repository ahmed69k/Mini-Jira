const express = require("express");
const router = express.Router();

const TeamController = require("../controllers/teams");
const authMiddleware = require("../middleware/auth")

// CREATE TEAM
router.post("/", authMiddleware, TeamController.createTeam);

// GET ALL TEAMS
router.get("/", TeamController.getAllTeams);

// GET SINGLE TEAM
router.get("/:teamId", authMiddleware, TeamController.getTeamById);

// UPDATE TEAM
router.put("/:teamId", authMiddleware, TeamController.updateTeam);

// DELETE TEAM
router.delete("/:teamId", authMiddleware, TeamController.deleteTeam);

// GET TEAM MEMBERS
router.get("/:teamId/members", authMiddleware, TeamController.getTeamMembers);

module.exports = router;