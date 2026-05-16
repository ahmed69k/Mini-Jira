const express = require("express");
const {DynamoDBCLient, DynamoDBClient} = require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand} = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient({region: "eu-north-1"});
const dynamo = DynamoDBDocumentClient.from(client);

const tasksRoutes = require("./src/routes/tasks");

const app = express();
app.use(express.json());

// Register routes
app.use("/api/tasks", tasksRoutes);

const port = 4000;
app.listen(port,()=>{
    console.log(`Server running on ${port}`)
})