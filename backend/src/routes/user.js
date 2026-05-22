const express = require("express")
const UserController = require("../controllers/users")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

router.get('/users', authMiddleware, UserController.getAllUsers);
router.get('/me', authMiddleware, UserController.getUserProfile);
router.get('/users/team/:teamId', authMiddleware, UserController.getTeamMembers);
router.put('/update-me', authMiddleware, UserController.updateUserProfile);
router.delete('/delete-me', authMiddleware, UserController.deleteUserProfile);


module.exports = router;