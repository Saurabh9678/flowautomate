const express = require('express');
const PdfController = require('../controllers/PdfController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const { uploadSinglePDF } = require('../middleware/upload');

const router = express.Router();
const pdfController = new PdfController();

// PDF routes with authentication and asyncHandler for automatic error handling
router.post('/', authenticateToken, uploadSinglePDF, asyncHandler(pdfController.createPdf.bind(pdfController)));
// router.get('/', authenticateToken, asyncHandler(pdfController.getAllPdfs.bind(pdfController)));
// router.get('/queued', authenticateToken, asyncHandler(pdfController.getQueuedPdfs.bind(pdfController)));
// router.get('/ready', authenticateToken, asyncHandler(pdfController.getReadyPdfs.bind(pdfController)));
// router.get('/failed', authenticateToken, asyncHandler(pdfController.getFailedPdfs.bind(pdfController)));
// router.get('/user/:userId', authenticateToken, asyncHandler(pdfController.getPdfsByUserId.bind(pdfController)));
// router.get('/:id', authenticateToken, asyncHandler(pdfController.getPdfById.bind(pdfController)));
// router.put('/:id/status', authenticateToken, asyncHandler(pdfController.updatePdfStatus.bind(pdfController)));
// router.delete('/:id', authenticateToken, asyncHandler(pdfController.deletePdf.bind(pdfController)));

module.exports = router;
