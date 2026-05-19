const express = require("express")
const router = express.Router();
const AuthController = require("../controllers/auth.js")

router.post('/register', AuthController.register)
router.post('/auth/confirm', AuthController.confirm);
router.post('/login', AuthController.login)

module.exports = router;