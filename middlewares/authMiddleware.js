const jwt = require("jsonwebtoken"); // Ensure you import jwt
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (req, res, next) => {
  console.log("Auth middleware called");
  console.log("Headers:", req.headers);

  const authHeader = req.headers["authorization"];
  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    console.log("No authorization header found");
    return res.status(401).json({ message: "Token required" });
  }

  const parts = authHeader.split(" ");
  console.log("Auth parts:", parts);

  if (parts.length !== 2) {
    console.log("Invalid authorization header format");
    return res.status(401).json({ message: "Token error" });
  }

  const [scheme, token] = parts;
  console.log("Token:", token);

  if (!/^Bearer$/i.test(scheme)) {
    console.log("Invalid token scheme");
    return res.status(401).json({ message: "Token malformatted" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res.status(403).json({ message: "Invalid token" });
    }

    console.log("Token verified successfully. Decoded payload:", decoded);
    req.user = decoded; // Attach decoded user info to request object
    next();
  });
};

module.exports = authMiddleware;
