const { CognitoJwtVerifier } = require("aws-jwt-verify");

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
        req.user = payload;
        
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
