const express = require('express');
const PdfController = require('../controllers/PdfController');

const router = express.Router();
const pdfController = new PdfController();

// PDF routes
router.post('/', pdfController.createPdf.bind(pdfController));
router.get('/', pdfController.getAllPdfs.bind(pdfController));
router.get('/queued', pdfController.getQueuedPdfs.bind(pdfController));
router.get('/ready', pdfController.getReadyPdfs.bind(pdfController));
router.get('/failed', pdfController.getFailedPdfs.bind(pdfController));
router.get('/user/:userId', pdfController.getPdfsByUserId.bind(pdfController));
router.get('/:id', pdfController.getPdfById.bind(pdfController));
router.put('/:id/status', pdfController.updatePdfStatus.bind(pdfController));
router.delete('/:id', pdfController.deletePdf.bind(pdfController));

module.exports = router;
