const dynamodb = require('../config/dynamodb');
const {GetCommand, PutCommand, UpdateCommand} = require("@aws-sdk/lib-dynamodb")
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
    }
}
module.exports = UserController