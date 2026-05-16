const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Create Cognito JWT verifier for ID tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "id", // Using ID tokens (contains custom attributes)
  clientId: process.env.COGNITO_CLIENT_ID,
});

// Auth middleware
module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token using aws-jwt-verify
    const payload = await verifier.verify(token);

    // Extract user info from Cognito token claims
    req.user = {
      userId: payload.sub, // Cognito's user ID
      username: payload.username,
      role: payload["custom:role"] || "employee", // Custom attribute
      teamId: payload["custom:teamId"], // Custom attribute
      email: payload.email,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
