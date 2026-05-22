const express = require("express");
const router = express.Router();

const TeamController = require("../controllers/teams");
const authMiddleware = require("../middleware/auth")

// CREATE TEAM
router.post("/teams", authMiddleware, TeamController.createTeam);

// GET ALL TEAMS
router.get("/teams", authMiddleware, TeamController.getAllTeams);

// GET SINGLE TEAM
router.get("/teams/:teamId", authMiddleware, TeamController.getTeamById);

// UPDATE TEAM
router.put("/teams/:teamId", authMiddleware, TeamController.updateTeam);

// DELETE TEAM
router.delete("/teams/:teamId", authMiddleware, TeamController.deleteTeam);

// GET TEAM MEMBERS
router.get("/teams/:teamId/members", authMiddleware, TeamController.getTeamMembers);

module.exports = router;