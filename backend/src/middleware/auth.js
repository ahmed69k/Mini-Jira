const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// AWS Cognito JWKS endpoint
const COGNITO_REGION = process.env.AWS_REGION || "us-east-1";
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_JWKS_URI = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

// Create JWKS client to fetch Cognito's public keys
const client = jwksClient({
  jwksUri: COGNITO_JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
});

// Function to get the signing key
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
};

// Auth middleware
module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token using Cognito's public keys
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        console.error("Token verification failed:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Extract user info from Cognito token claims
      // Cognito tokens have claims like: sub, cognito:username, cognito:groups, etc.
      req.user = {
        userId: decoded.sub, // Cognito's user ID (sub claim)
        username: decoded["cognito:username"],
        role: decoded["custom:role"] || "employee", // Custom attribute
        teamId: decoded["custom:teamId"], // Custom attribute
        email: decoded.email,
      };

      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
