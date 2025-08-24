const express = require('express');
const PdfController = require('../controllers/PdfController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const { uploadSinglePDF } = require('../middleware/upload');

const router = express.Router();
const pdfController = new PdfController();


router.post('/', authenticateToken, uploadSinglePDF, asyncHandler(pdfController.createPdf.bind(pdfController)));


module.exports = router;
