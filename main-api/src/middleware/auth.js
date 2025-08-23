const jwt = require('jsonwebtoken');
const { UnauthorizedError, BadRequestError } = require('../utils/CustomError');

/**
 * Authenticate JWT token middleware
 * Validates the JWT token from Authorization header
 */
exports.authenticateToken = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required');
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header must start with Bearer');
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Token is required');
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      throw new BadRequestError('JWT_SECRET is not configured in environment variables');
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw new UnauthorizedError('Token has expired');
        } else if (err.name === 'JsonWebTokenError') {
          throw new UnauthorizedError('Invalid token');
        } else {
          throw new UnauthorizedError('Token verification failed');
        }
      }

      // Add user info to request object
      req.user = decoded;
      next();
    });

  } catch (error) {
    // If it's already a CustomError, pass it through
    if (error.status) {
      return next(error);
    }
    
    // If it's a JWT error, handle it appropriately
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    
    // For any other unexpected errors
    console.error('Authentication error:', error);
    return next(new UnauthorizedError('An unexpected error occurred during authentication'));
  }
};

