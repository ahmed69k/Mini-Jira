require("dotenv").config();

const express = require("express");
const {DynamoDBCLient, DynamoDBClient} = require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand} = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient({region: "eu-north-1"});
const dynamo = DynamoDBDocumentClient.from(client);

const tasksRoutes = require("./src/routes/tasks");

const app = express();
app.use(express.json());

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Register routes
app.use("/api/tasks", tasksRoutes);

const port = process.env.PORT || 4000;
app.listen(port,()=>{
    console.log(`Server running on ${port}`)
})