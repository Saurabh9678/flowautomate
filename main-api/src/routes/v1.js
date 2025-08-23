const express = require('express');
const userRoutes = require('./userRoutes');
const pdfRoutes = require('./pdfRoutes');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

// API Version 1 Routes
router.use('/user', userRoutes);
router.use('/pdf', pdfRoutes);

// Health check endpoint
router.get('/', (req, res) => {
  successResponse(res, 200, null, 'FlowAutomate API v1 is running', null);
});


module.exports = router;
