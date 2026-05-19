const dynamodb = require('../config/dynamodb');
const {GetCommand, PutCommand, UpdateCommand} = require("@aws-sdk/lib-dynamodb")
const table_name = "users";

const UserController = {
    register: async(req,res)=>{
        try{
            const {email, password, name, role, teamId, createdAt, updatedAt} = req.body;
            const existingUser = await dynamodb.send(new GetCommand({
                TableName: table_name,
                Key: email
            }))

            if(existingUser) return res.status(500).json({message: "User already exists."})

            const newUser = {
                email: email,
                password: password,
                name: name,
                role: role,
                teamId: teamId, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await dynamodb.send(
                new PutCommand({
                    TableName: table_name,
                    Item: newUser
                })
            )
            return res.status(201).json({message: "User created.", newUser});
        }
        catch(e){
            return res.status(500).json({message: e})
        }
    },
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
            if(!result.Item){
                const newUser = {
                    userId,
                    email: req.user.email,
                    createdAt: new Date().toISOString
                }
                await dynamodb.send(
                    new PutCommand({
                        TableName: table_name,
                        Item: newUser
                    })
                )
                return res.status(201).json({message: "Login successful.", newUser})
            }
            return res.status(200).json({message: "Login successful.", newUser})

        }
        catch(e){
            return res.status(500).json(e);
        }
    }
}