const PdfRepository = require('../repositories/PdfRepository');

class PdfService {
  constructor() {
    this.pdfRepository = new PdfRepository();
  }

  async createPdf(userId, pdfPath) {
    return await this.pdfRepository.create({
      user_id: userId,
      pdf_path: pdfPath,
      status: 'queued'
    });
  }

  async getAllPdfs() {
    return await this.pdfRepository.findAll();
  }

  async getPdfById(id) {
    return await this.pdfRepository.findById(id);
  }

  async updatePdf(id, data) {
    return await this.pdfRepository.update(id, data);
  }

  async deletePdf(id) {
    return await this.pdfRepository.delete(id);
  }

  async getPdfsByUserId(userId) {
    return await this.pdfRepository.findByUserId(userId);
  }

  async getPdfsByStatus(status) {
    return await this.pdfRepository.findByStatus(status);
  }

  async updatePdfStatus(id, status, error = null) {
    return await this.pdfRepository.updateStatus(id, status, error);
  }
}

module.exports = PdfService;
