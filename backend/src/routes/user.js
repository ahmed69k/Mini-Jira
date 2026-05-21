const express = require("express")
const UserController = require("../controllers/users")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

router.get('/me',authMiddleware, UserController.getUserProfile);
router.put('/update-me', authMiddleware, UserController.updateUserProfile);
router.delete('/delete-me', authMiddleware, UserController.deleteUserProfile);

module.exports = router;