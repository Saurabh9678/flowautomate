const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter} = require('./middleware/rateLimiter');
require('dotenv').config();

const v1Routes = require('./routes/v1');
const errorHandler = require('./middleware/errorHandler');
const { successResponse } = require('./utils/apiResponse');
const { NotFoundError } = require('./utils/CustomError');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// API Version 1 Routes
app.use('/v1', v1Routes);


// Root endpoint
app.get('/', (req, res) => {
  successResponse(res, 200, {
    message: 'FlowAutomate API',
    version: '1.0.0',
    endpoints: {
      v1: '/v1',
      health: '/v1'
    }
  }, 'FlowAutomate API', null);
});

// 404 handler
app.use('*', (req, res) => {
  throw new NotFoundError('Route not found', 'Route');
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
