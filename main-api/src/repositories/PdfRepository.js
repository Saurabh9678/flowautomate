const BaseRepository = require('./BaseRepository');
const { Pdf } = require('../models');
const moment = require('moment');

class PdfRepository extends BaseRepository {
  constructor() {
    super(Pdf);
  }

  async findByUserId(userId) {
    return await this.findAll({
      where: { user_id: userId }
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
    const pdfs = await this.findDeleted({ where: { user_id: userId } });
    const restorePromises = pdfs.map(pdf => this.restore(pdf.id));
    return await Promise.all(restorePromises);
  }

  async findDeletedPdfsByUserId(userId) {
    return await this.findDeleted({ where: { user_id: userId } });
  }

  async findDeletedPdfsByStatus(status) {
    return await this.findDeleted({ where: { status } });
  }

  // PDF-specific UTC timestamp methods
  async findPdfsDeletedAfter(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deleted_at: {
          [this.model.sequelize.Op.gte]: utcTimestamp
        }
      }
    });
  }

  async findPdfsDeletedBefore(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deleted_at: {
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
        deleted_at: {
          [this.model.sequelize.Op.between]: [startUTC, endUTC]
        }
      }
    });
  }

  async getDeletionStats() {
    const totalPdfs = await this.count();
    const deletedPdfs = await this.countDeleted();
    const activePdfs = totalPdfs - deletedPdfs;
    
    return {
      total: totalPdfs,
      active: activePdfs,
      deleted: deletedPdfs,
      deletionRate: totalPdfs > 0 ? (deletedPdfs / totalPdfs * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = PdfRepository;
