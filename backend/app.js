require("dotenv").config();
const express = require("express");
const cors = require("cors")

const tasksRoutes = require("./src/routes/tasks");
const authRoutes = require("./src/routes/auth");
const projectsRoutes = require("./src/routes/projects");
const commentsRoutes = require("./src/routes/comments");
const uploadsRoutes = require("./src/routes/uploads");
const userRoutes = require('./src/routes/user')

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Register routes
app.use('', authRoutes)
app.use('',userRoutes)
app.use("/api/tasks", tasksRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/uploads", uploadsRoutes);

const port = process.env.PORT || 4000;
app.listen(port,()=>{
    console.log(`Server running on ${port}`)
})