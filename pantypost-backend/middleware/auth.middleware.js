// auth.middleware.js
// This file handles checking if users are logged in

const jwt = require('jsonwebtoken');

// Get the secret key from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// This is the authentication middleware function
const authMiddleware = (req, res, next) => {
  // Get the token from the Authorization header
  // The header looks like: "Bearer YOUR_TOKEN_HERE"
  const token = req.headers.authorization?.split(' ')[1];
  
  // If no token provided, send error
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  try {
    // Verify the token is valid
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to the request so routes can use it
    req.user = decoded;
    
    // Continue to the next function
    next();
  } catch (error) {
    // Token is invalid or expired
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Export so other files can use it
module.exports = authMiddleware;