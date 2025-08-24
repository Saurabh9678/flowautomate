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

  async findByFilename(filename, userId) {
    return await this.findOne({
      where: {
        filename,
        user_id: userId
      }
    });
  }

}

module.exports = PdfRepository;
