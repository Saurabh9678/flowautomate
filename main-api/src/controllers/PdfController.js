const PdfService = require('../services/PdfService');
const { successResponse } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/CustomError');

class PdfController {
  constructor() {
    this.pdfService = new PdfService();
  }

  async createPdf(req, res) {
    // Get user ID from authenticated user
    const userId = req.user.userId;
    
    if (!userId) {
      throw new NotFoundError('User ID not found', 'User');
    }

    // Get file information from upload middleware
    const uploadedFile = req.uploadedFile;
    
    if (!uploadedFile) {
      throw new NotFoundError('No file uploaded', 'File');
    }

    // Create PDF record with file path
    await this.pdfService.createPdf(userId, uploadedFile.filename);
    
    successResponse(res, 201, null, 'PDF uploaded and created successfully', null);
  }

  async getPdfById(req, res) {
    const pdf = await this.pdfService.getPdfById(req.params.id);
    successResponse(res, 200, pdf, 'PDF fetched successfully', null);
  }

  async getPdfsByUserId(req, res) {
    const pdfs = await this.pdfService.getPdfsByUserId(req.params.userId);
    successResponse(res, 200, pdfs, 'PDFs fetched successfully', null);
  }

  async updatePdfStatus(req, res) {
    const { status, error } = req.body;
    const pdf = await this.pdfService.updatePdfStatus(req.params.id, status, error);
    successResponse(res, 200, pdf, 'PDF status updated successfully', null);
  }

  async deletePdf(req, res) {
    await this.pdfService.deletePdf(req.params.id);
    successResponse(res, 200, null, 'PDF deleted successfully', null);
  }

  async getQueuedPdfs(req, res) {
    const pdfs = await this.pdfService.getQueuedPdfs();
    successResponse(res, 200, pdfs, 'Queued PDFs fetched successfully', null);
  }

  async getReadyPdfs(req, res) {
    const pdfs = await this.pdfService.getReadyPdfs();
    successResponse(res, 200, pdfs, 'Ready PDFs fetched successfully', null);
  }

  async getFailedPdfs(req, res) {
    const pdfs = await this.pdfService.getFailedPdfs();
    successResponse(res, 200, pdfs, 'Failed PDFs fetched successfully', null);
  }

  async getAllPdfs(req, res) {
    const pdfs = await this.pdfService.getAllPdfs();
    successResponse(res, 200, pdfs, 'All PDFs fetched successfully', null);
  }
}

module.exports = PdfController;
