const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');
const { UnauthorizedError } = require('../utils/CustomError');

/**
 * Authenticate JWT token middleware
 * Validates the JWT token from Authorization header
 */
exports.authenticateToken = (req, res, next) => {
    try {
        // Check if Authorization header exists
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new UnauthorizedError('Access denied');
        }

        // Validate Authorization header format
        if (!authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Invalid token format');
        }

        // Extract token from Authorization header
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Access denied');
        }

        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured in environment variables');
            throw new Error('JWT_SECRET is not configured in environment variables');
        }

        // Verify JWT token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                // Handle different types of JWT errors
                let errorMessage = 'Invalid token';
                let statusCode = 401;

                switch (err.name) {
                    case 'TokenExpiredError':
                        errorMessage = 'Token has expired';
                        statusCode = 401;
                        break;
                    case 'JsonWebTokenError':
                        errorMessage = 'Invalid token signature';
                        statusCode = 401;
                        break;
                    case 'NotBeforeError':
                        errorMessage = 'Token not active yet';
                        statusCode = 401;
                        break;
                    default:
                        errorMessage = 'Token verification failed';
                        statusCode = 401;
                }

                throw new UnauthorizedError(errorMessage);
            }

            // Validate decoded token structure
            if (!decoded || typeof decoded !== 'object') {
                throw new UnauthorizedError('Invalid token payload');
            }

            // Add user information to request object
            req.user = decoded;

            next();
        });

    } catch (error) {
        // Handle any unexpected errors
        console.error('Authentication middleware error:', error);
        throw new Error('An unexpected error occurred during authentication');
    }
};

