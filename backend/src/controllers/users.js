const dynamodb = require('../config/dynamodb');
const cognito = require("../config/cognito");
const {GetCommand, PutCommand, UpdateCommand, DeleteCommand} = require("@aws-sdk/lib-dynamodb");
const { AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const table_name = "users";

const UserController = {
    getUserProfile: async (req, res) =>{
        try{
            const userId = req.user.sub;
            const command = new GetCommand({
                TableName: table_name,
                Key: {
                    userId
                }
            })
            const result = await dynamodb.send(command)
            return res.status(200).json({message: "User retrieved successfully,", user: result.Item})

        }
        catch(e){
            console.log(e)
            return res.status(500).json({message: e.message});
        }
    },
    updateUserProfile: async (req, res) =>{
        try{
            const userId = req.user.sub;
            const {name, role, teamId} = req.body;

            if(!name && !role && !teamId){
                return res.status(400).json({message: "Missing required fields. Nothing to update."})
            }
            let updateExpression = "SET #updatedAt = :updatedAt";
            let ExpressionAttributeNames = {
                "#updatedAt": "updatedAt"
            };
            let ExpressionAttributeValues = {
                ":updatedAt": new Date().toISOString()
            };

            if (name !== undefined) {
                updateExpression += ", #name = :name";
                ExpressionAttributeNames["#name"] = "name";
                ExpressionAttributeValues[":name"] = name;
            }

            if (role !== undefined) {
                updateExpression += ", #role = :role";
                ExpressionAttributeNames["#role"] = "role";
                ExpressionAttributeValues[":role"] = role;
            }

            if (teamId !== undefined) {
                updateExpression += ", #teamId = :teamId";
                ExpressionAttributeNames["#teamId"] = "teamId";
                ExpressionAttributeValues[":teamId"] = teamId;
            }

            const command = new UpdateCommand({
                TableName: table_name,
                Key: { userId },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                ReturnValues: "ALL_NEW"
            });
            const result = await dynamodb.send(command);
            
            return res.status(200).json({message: "User updated successfully.", user: result.Attributes});
        }
        catch(e){
            console.log(e);
            return res.status(500).json({
                message: e.message
            });
        }
    },
    deleteUserProfile: async(req, res)=>{
        try{
            const userId = req.user.sub;
            
            await dynamodb.send(
                new DeleteCommand({
                    TableName: table_name,
                    Key:{
                        userId
                    }
                })
            )
            await cognito.send(
                new AdminDeleteUserCommand({
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    Username: req.user.username || req.user.email
                })
            )
            return res.status(200).json({message: "User deleted successfully."})
        }
        catch(e){
            console.log(e);
            return res.status(500).json({message: e.message})
        }
    }
}
module.exports = UserController