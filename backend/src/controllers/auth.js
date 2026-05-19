const {SignUpCommand, ConfirmSignUpCommand, AdminInitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = require("../config/cognito");
const dynamodb = require('../config/dynamodb');
const {GetCommand, PutCommand, UpdateCommand} = require("@aws-sdk/lib-dynamodb")
const table_name = "users";

const AuthController = {
    register: async(req,res)=>{
        try{
            const {email, password, name, role, teamId} = req.body;

            if (!email || !password || !name || !role || !teamId) {
                return res.status(400).json({
                    message: "Missing required fields",
                });
            }

            const signUpResult = await cognito.send(new SignUpCommand({
                ClientId: process.env.COGNITO_CLIENT_ID,
                Username: email,
                Password: password,
                UserAttributes:[
                    {
                        Name: "email",
                        Value: email
                    },
                    {
                        Name: "name",
                        Value: name
                    }
                ]
            }))
            const userId = signUpResult.UserSub;
            const newUser = {
                userId,
                email,
                name,
                role,
                teamId,
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
            console.log(e)
            if(e.name === "UsernameExistsException"){
                return res.status(409).json({message: "User already exists."});
            }
            return res.status(500).json({message: e.message})
        }
    },
    confirm: async(req, res)=>{
        try{
            const{email, code} = req.body;
            if(!email || !code){
                return res.status(400).json({message: "Missing required fields."})
            }
            await cognito.send(
                new ConfirmSignUpCommand({
                    ClientId: process.env.COGNITO_CLIENT_ID,
                    Username: email,
                    ConfirmationCode: code
                })
            )
            return res.status(200).json({message: "Confirmed successfully."});
        }
        catch(e){
            console.log(e);
            return res.status(500).json({message: e.message})
        }
    },
    login: async(req, res)=>{
        try{
            const {email, password} = req.body;
            if(!email || !password){
                return res.status(409).json({message: "Missing required fields."});
            }
            const result = await cognito.send(
                new AdminInitiateAuthCommand({
                    AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                    ClientId: process.env.COGNITO_CLIENT_ID,
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    AuthParameters:{
                        USERNAME: email,
                        PASSWORD: password
                    }
                })
            )
            const auth = result.AuthenticationResult;
            return res.status(200).json({
                accessToken: auth.AccessToken,
                idToken: auth.IdToken,
                refreshToken: auth.RefreshToken,
                expiresIn: auth.ExpiresIn
            })
        }
        catch(e){
            console.log(e);
            if (e.name === "NotAuthorizedException") {
                return res.status(401).json({
                message: "Invalid credentials",
                });
      }

            if (e.name === "UserNotConfirmedException") {
                return res.status(403).json({
                message: "User not confirmed. Please verify your email.",
                });
            }
            return res.status(500).json({message: e.message})
        }
    }

}
module.exports = AuthController;