const express = require("express")
const UserController = require("../controllers/users")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

router.get('/me',authMiddleware, UserController.getUserProfile);

module.exports = router;