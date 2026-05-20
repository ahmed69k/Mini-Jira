const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  getPresignedUrl,
  deleteImage,
  linkImageToTask,
} = require("../controllers/uploads");

// All routes require authentication
router.use(authMiddleware);

// POST /api/uploads/presigned-url - Generate presigned URL for upload
router.post("/presigned-url", getPresignedUrl);

// PUT /api/uploads/link - Link image to task
router.put("/link", linkImageToTask);

// DELETE /api/uploads/delete - Delete image from S3
// Pass key in request body instead of URL to handle slashes
router.delete("/delete", deleteImage);

module.exports = router;
