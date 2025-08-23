const PdfRepository = require('../repositories/PdfRepository');

class PdfService {
  constructor() {
    this.pdfRepository = new PdfRepository();
  }

  async createPdf(userId, pdfPath) {
    return await this.pdfRepository.create({
      userId,
      pdfPath,
      status: 'queued'
    });
  }

  async getPdfById(id) {
    const pdf = await this.pdfRepository.findByPdfId(id);
    if (!pdf) {
      throw new Error('PDF not found');
    }
    return pdf;
  }

  async getPdfsByUserId(userId) {
    return await this.pdfRepository.findByUserId(userId);
  }

  async updatePdfStatus(id, status, error = null) {
    const pdf = await this.pdfRepository.updateStatus(id, status, error);
    if (!pdf) {
      throw new Error('PDF not found');
    }
    return pdf;
  }

  async deletePdf(id) {
    return await this.pdfRepository.delete(id);
  }

  async getQueuedPdfs() {
    return await this.pdfRepository.findQueuedPdfs();
  }

  async getReadyPdfs() {
    return await this.pdfRepository.findReadyPdfs();
  }

  async getFailedPdfs() {
    return await this.pdfRepository.findFailedPdfs();
  }

  async getAllPdfs() {
    return await this.pdfRepository.findAll();
  }
}

module.exports = PdfService;
