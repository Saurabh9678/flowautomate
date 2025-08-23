const BaseRepository = require('./BaseRepository');
const { Pdf } = require('../models');
const moment = require('moment');

class PdfRepository extends BaseRepository {
  constructor() {
    super(Pdf);
  }

  async findByUserId(userId) {
    return await this.findAll({
      where: { userId }
    });
  }

  async findByStatus(status) {
    return await this.findAll({
      where: { status } 
    });
  }

  async findQueuedPdfs() {
    return await this.findByStatus('queued');
  }

  async findReadyPdfs() {
    return await this.findByStatus('ready');
  }

  async findFailedPdfs() {
    return await this.findByStatus('failed');
  }

  async updateStatus(id, status, error = null) {
    const updateData = { status };
    if (error) {
      updateData.error = error;
    }
    return await this.update(id, updateData);
  }

  // PDF-specific soft delete methods
  async deletePdfByUserId(userId) {
    const pdfs = await this.findByUserId(userId);
    const deletePromises = pdfs.map(pdf => this.delete(pdf.id));
    return await Promise.all(deletePromises);
  }

  async deletePdfsByStatus(status) {
    const pdfs = await this.findByStatus(status);
    const deletePromises = pdfs.map(pdf => this.delete(pdf.id));
    return await Promise.all(deletePromises);
  }

  async restorePdfByUserId(userId) {
    const pdfs = await this.findDeleted({ where: { userId } });
    const restorePromises = pdfs.map(pdf => this.restore(pdf.id));
    return await Promise.all(restorePromises);
  }

  async findDeletedPdfsByUserId(userId) {
    return await this.findDeleted({ where: { userId } });
  }

  async findDeletedPdfsByStatus(status) {
    return await this.findDeleted({ where: { status } });
  }

  // PDF-specific UTC timestamp methods
  async findPdfsDeletedAfter(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deletedAt: {
          [this.model.sequelize.Op.gte]: utcTimestamp
        }
      }
    });
  }

  async findPdfsDeletedBefore(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deletedAt: {
          [this.model.sequelize.Op.lte]: utcTimestamp
        }
      }
    });
  }

  async findPdfsDeletedBetween(startTimestamp, endTimestamp) {
    const startUTC = moment.utc(startTimestamp).toDate();
    const endUTC = moment.utc(endTimestamp).toDate();
    return await this.findDeleted({
      where: {
        deletedAt: {
          [this.model.sequelize.Op.between]: [startUTC, endUTC]
        }
      }
    });
  }

  // Get deletion statistics with UTC timestamps
  async getDeletionStats() {
    const deletedPdfs = await this.findDeleted();
    const stats = {
      totalDeleted: deletedPdfs.length,
      deletedToday: 0,
      deletedThisWeek: 0,
      deletedThisMonth: 0
    };

    const now = moment.utc();
    const startOfDay = moment.utc().startOf('day');
    const startOfWeek = moment.utc().startOf('week');
    const startOfMonth = moment.utc().startOf('month');

    deletedPdfs.forEach(pdf => {
      const deletedAt = moment.utc(pdf.deletedAt);
      
      if (deletedAt.isSameOrAfter(startOfDay)) {
        stats.deletedToday++;
      }
      if (deletedAt.isSameOrAfter(startOfWeek)) {
        stats.deletedThisWeek++;
      }
      if (deletedAt.isSameOrAfter(startOfMonth)) {
        stats.deletedThisMonth++;
      }
    });

    return stats;
  }
}

module.exports = PdfRepository;
