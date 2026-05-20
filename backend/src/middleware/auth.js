const { CognitoJwtVerifier } = require("aws-jwt-verify");
const dynamodb = require('../config/dynamodb');
const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID
});

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifier.verify(token);

        // Fetch user from database to get role
        const userId = payload.sub;
        const command = new GetCommand({
            TableName: "users",
            Key: {
                userId
            }
        });
        const result = await dynamodb.send(command);

        // Merge Cognito payload with database user data
        req.user = {
            ...payload,
            role: result.Item?.role,
            teamId: result.Item?.teamId
        };

        next();

    } catch (e) {
        // Cognito token errors should be treated as 401
        return res.status(401).json({
            message: "Invalid or expired token",
            error: e.message
        });
    }
}

module.exports = authMiddleware;
