require("dotenv").config();
const express = require("express");
const cors = require("cors")

const tasksRoutes = require("./src/routes/tasks");
const authRoutes = require("./src/routes/auth")
const projectsRoutes = require("./src/routes/projects");
const commentsRoutes = require("./src/routes/comments");

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
app.use('', authRoutes)
app.use("/api/tasks", tasksRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/comments", commentsRoutes);

const port = 4000;
app.listen(port,()=>{
    console.log(`Server running on ${port}`)
})