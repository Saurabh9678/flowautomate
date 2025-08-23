const PdfService = require('../services/PdfService');

class PdfController {
  constructor() {
    this.pdfService = new PdfService();
  }

  async createPdf(req, res) {
    try {
      const { userId, pdfPath } = req.body;
      const pdf = await this.pdfService.createPdf(userId, pdfPath);
      res.status(201).json({
        success: true,
        data: pdf
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPdfById(req, res) {
    try {
      const pdf = await this.pdfService.getPdfById(req.params.id);
      res.status(200).json({
        success: true,
        data: pdf
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPdfsByUserId(req, res) {
    try {
      const pdfs = await this.pdfService.getPdfsByUserId(req.params.userId);
      res.status(200).json({
        success: true,
        data: pdfs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updatePdfStatus(req, res) {
    try {
      const { status, error } = req.body;
      const pdf = await this.pdfService.updatePdfStatus(req.params.id, status, error);
      res.status(200).json({
        success: true,
        data: pdf
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deletePdf(req, res) {
    try {
      await this.pdfService.deletePdf(req.params.id);
      res.status(200).json({
        success: true,
        message: 'PDF deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getQueuedPdfs(req, res) {
    try {
      const pdfs = await this.pdfService.getQueuedPdfs();
      res.status(200).json({
        success: true,
        data: pdfs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getReadyPdfs(req, res) {
    try {
      const pdfs = await this.pdfService.getReadyPdfs();
      res.status(200).json({
        success: true,
        data: pdfs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFailedPdfs(req, res) {
    try {
      const pdfs = await this.pdfService.getFailedPdfs();
      res.status(200).json({
        success: true,
        data: pdfs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllPdfs(req, res) {
    try {
      const pdfs = await this.pdfService.getAllPdfs();
      res.status(200).json({
        success: true,
        data: pdfs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = PdfController;
