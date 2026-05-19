require("dotenv").config();
const express = require("express");
const cors = require("cors")

const tasksRoutes = require("./src/routes/tasks");
const authRoutes = require("./src/routes/auth")

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
app.use('', authRoutes)
app.use("/api/tasks", tasksRoutes);

const port = 4000;
app.listen(port,()=>{
    console.log(`Server running on ${port}`)
})