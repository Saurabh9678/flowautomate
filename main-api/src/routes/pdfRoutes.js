const express = require('express');
const PdfController = require('../controllers/PdfController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
const pdfController = new PdfController();

// PDF routes with asyncHandler for automatic error handling
router.post('/', asyncHandler(pdfController.createPdf.bind(pdfController)));
router.get('/', asyncHandler(pdfController.getAllPdfs.bind(pdfController)));
router.get('/queued', asyncHandler(pdfController.getQueuedPdfs.bind(pdfController)));
router.get('/ready', asyncHandler(pdfController.getReadyPdfs.bind(pdfController)));
router.get('/failed', asyncHandler(pdfController.getFailedPdfs.bind(pdfController)));
router.get('/user/:userId', asyncHandler(pdfController.getPdfsByUserId.bind(pdfController)));
router.get('/:id', asyncHandler(pdfController.getPdfById.bind(pdfController)));
router.put('/:id/status', asyncHandler(pdfController.updatePdfStatus.bind(pdfController)));
router.delete('/:id', asyncHandler(pdfController.deletePdf.bind(pdfController)));

module.exports = router;
