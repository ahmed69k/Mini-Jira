const dynamodb = require('../config/dynamodb');
const { 
    GetCommand, 
    PutCommand, 
    UpdateCommand, 
    DeleteCommand, 
    ScanCommand 
} = require("@aws-sdk/lib-dynamodb");

const { v4: uuidv4 } = require("uuid");

const table_name = "teams";

const TeamController = {

    // GET ALL TEAMS
    getAllTeams: async (req, res) => { 
        try {
            const command = new ScanCommand({
                TableName: table_name
            });

            const result = await dynamodb.send(command);

            return res.status(200).json(result.Items || []);
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    },

    // GET SINGLE TEAM
    getTeamById: async (req, res) => {
        try {
            const { teamId } = req.params;

            const command = new GetCommand({
                TableName: table_name,
                Key: { teamId }
            });

            const result = await dynamodb.send(command);

            if (!result.Item) {
                return res.status(404).json({ message: "Team not found" });
            }

            return res.status(200).json(result.Item);

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    },

    // CREATE TEAM
    createTeam: async (req, res) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ message: "Team name is required" });
            }

            const team = {
                teamId: uuidv4(),
                name,
                createdAt: new Date().toISOString()
            };

            await dynamodb.send(
                new PutCommand({
                    TableName: table_name,
                    Item: team
                })
            );

            return res.status(201).json({
                message: "Team created successfully",
                team
            });

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    },

    // UPDATE TEAM
    updateTeam: async (req, res) => {
        try {
            const { teamId } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ message: "Nothing to update" });
            }

            const command = new UpdateCommand({
                TableName: table_name,
                Key: { teamId },
                UpdateExpression: "SET #name = :name, #updatedAt = :updatedAt",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#updatedAt": "updatedAt"
                },
                ExpressionAttributeValues: {
                    ":name": name,
                    ":updatedAt": new Date().toISOString()
                },
                ReturnValues: "ALL_NEW"
            });

            const result = await dynamodb.send(command);

            return res.status(200).json({
                message: "Team updated successfully",
                team: result.Attributes
            });

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    },

    // DELETE TEAM
    deleteTeam: async (req, res) => {
        try {
            const { teamId } = req.params;

            await dynamodb.send(
                new DeleteCommand({
                    TableName: table_name,
                    Key: { teamId }
                })
            );

            return res.status(200).json({
                message: "Team deleted successfully"
            });

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    },

    // GET TEAM MEMBERS (SCAN VERSION since your schema isn't optimized yet)
    getTeamMembers: async (req, res) => {
        try {
            const { teamId } = req.params;

            if (!teamId) {
                return res.status(400).json({ message: "Team ID not provided" });
            }

            const command = new ScanCommand({
                TableName: "users",
                FilterExpression: "teamId = :teamId",
                ExpressionAttributeValues: {
                    ":teamId": teamId
                }
            });

            const result = await dynamodb.send(command);

            return res.status(200).json({
                message: "Team members fetched successfully",
                members: result.Items || []
            });

        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: e.message });
        }
    }
};

module.exports = TeamController;