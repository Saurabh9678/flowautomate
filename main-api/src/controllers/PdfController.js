const PdfService = require('../services/PdfService');
const { successResponse } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/CustomError');
const { parseAndSavePDF } = require('../utils/pdfParser');
const rabbitMQManager = require('../utils/rabbitmqManager');
const path = require('path');

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
    const pdf = await this.pdfService.createPdf(userId, uploadedFile.filename);
    
    // Send success response to client immediately
    successResponse(res, 201, {
      ...pdf,
      fileInfo: {
        originalName: uploadedFile.originalName,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }
    }, 'PDF uploaded and created successfully', null);

    // Start PDF parsing process asynchronously (after response is sent)
    this.processPdfAsync(pdf.id, uploadedFile.path, userId);
  }

  /**
   * Process PDF asynchronously after response is sent
   */
  async processPdfAsync(pdfId, pdfFilePath, userId) {
    try {
      console.log(`🔄 Starting async PDF processing for PDF ID: ${pdfId}`);

      // Update PDF status to 'parsing'
      await this.pdfService.updatePdfStatus(pdfId, 'parsing');

      // Get the directory where the PDF is stored
      const pdfDir = path.dirname(pdfFilePath);
      
      // Parse PDF and save JSON results
      const parsingResult = await parseAndSavePDF(pdfFilePath, pdfDir, `pdf_${pdfId}`);

      // Update PDF status to 'ready'
      await this.pdfService.updatePdfStatus(pdfId, 'ready');

      // Calculate JSON path dynamically (same directory as PDF)
      const pdfFileName = path.basename(pdfFilePath, '.pdf');
      const jsonPath = path.join(pdfDir, `${pdfFileName}.json`);

      // Send message to RabbitMQ queue (if available)
      try {
        await rabbitMQManager.sendPdfParsedMessage({
          pdfId: pdfId,
          userId: userId,
          filename: path.basename(pdfFilePath),
          jsonPath: jsonPath,
          pageCount: parsingResult.pageCount,
          textLength: parsingResult.textLength,
          tableCount: parsingResult.tableCount,
          parsedAt: new Date().toISOString()
        });
        console.log(`📤 Message sent to RabbitMQ queue for PDF ID: ${pdfId}`);
      } catch (rabbitError) {
        console.warn(`⚠️ Failed to send RabbitMQ message for PDF ID ${pdfId}:`, rabbitError.message);
        console.log('📋 PDF processing completed successfully, but RabbitMQ messaging failed');
      }

      console.log(`✅ PDF processing completed successfully for PDF ID: ${pdfId}`);
      console.log(`📁 JSON file saved at: ${jsonPath}`);

    } catch (error) {
      console.error(`❌ PDF processing failed for PDF ID: ${pdfId}:`, error.message);
      
      // Update PDF status to 'failed' with error message
      await this.pdfService.updatePdfStatus(pdfId, 'failed', error.message);
    }
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
