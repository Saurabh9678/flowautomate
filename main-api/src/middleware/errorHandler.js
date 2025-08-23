const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error Handler:', {
    name: err.name,
    message: err.message,
    status: err.status,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Handle custom errors with status codes
  if (err.status) {
    return errorResponse(res, err.status, err.message, err.errors);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return errorResponse(res, 400, 'Validation error', err.errors);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 409, 'Duplicate entry', err.errors);
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 400, 'Foreign key constraint error', null);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token', null);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired', null);
  }

  // Default error
  return errorResponse(res, err.status || 500, err.message || 'Internal server error', null);
};

module.exports = errorHandler;
