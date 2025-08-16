// This file handles checking if users are logged in

const jwt = require('jsonwebtoken');

// Get the secret key from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_TOKEN_MISSING', message: 'No token provided' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_TOKEN_INVALID', message: 'Invalid token' }
    });
  }
};

module.exports = authMiddleware;
