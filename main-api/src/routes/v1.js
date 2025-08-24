const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const pdfRoutes = require('./pdfRoutes');
const searchRoutes = require('./searchRoutes');

// Mount routes
router.use('/user', userRoutes);
router.use('/pdf', pdfRoutes);
router.use('/search', searchRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'PDF Processing API v1',
    version: '1.0.0',
    endpoints: {
      users: '/v1/user',
      pdfs: '/v1/pdf',
      search: '/v1/search'
    }
  });
});

module.exports = router;
