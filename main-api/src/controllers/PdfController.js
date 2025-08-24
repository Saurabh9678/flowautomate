const PdfService = require('../services/PdfService');
const { successResponse } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/CustomError');
const { parseAndSavePDFJSON } = require('../utils/pdfParser');
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
    successResponse(res, 201, null, 'PDF uploaded and created successfully', null);

    // Start PDF parsing process asynchronously (after response is sent)
    this.processPdfAsync(pdf.id, uploadedFile.path, userId);
  }

  /**
   * Process PDF asynchronously after response is sent
   */
  async processPdfAsync(pdfId, pdfFilePath, userId) {
    try {
      console.log(`Starting async PDF processing for PDF ID: ${pdfId}`);

      // Update PDF status to 'parsing'
      await this.pdfService.updatePdfStatus(pdfId, 'parsing');

      // Get the directory where the PDF is stored
      const pdfDir = path.dirname(pdfFilePath);
      
      // Parse PDF and save JSON results
      const parsingResult = await parseAndSavePDFJSON(pdfFilePath, pdfDir, `pdf_${pdfId}`);

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
        console.log(`Message sent to RabbitMQ queue for PDF ID: ${pdfId}`);
      } catch (rabbitError) {
        console.warn(`Failed to send RabbitMQ message for PDF ID ${pdfId}:`, rabbitError.message);
        console.log('PDF processing completed successfully, but RabbitMQ messaging failed');
        
        // If RabbitMQ fails, update status to 'ready' directly
        await this.pdfService.updatePdfStatus(pdfId, 'failed', rabbitError.message);
        console.log(`Database status updated to 'failed' for PDF ID: ${pdfId} (direct update)`);
      }

    } catch (error) {
      console.error(`PDF processing failed for PDF ID: ${pdfId}:`, error.message);
      
      // Update PDF status to 'failed' with error message
      await this.pdfService.updatePdfStatus(pdfId, 'failed', error.message);
    }
  }

  
}

module.exports = PdfController;
