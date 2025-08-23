const BaseRepository = require('./BaseRepository');
const { User } = require('../models');
const moment = require('moment');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findActiveUsers() {
    return await this.findAll({
      where: { is_active: true }
    });
  }

  async findInactiveUsers() {
    return await this.findAll({
      where: { is_active: false }
    });
  }

  async updateActiveStatus(id, isActive) {
    return await this.update(id, { is_active: isActive });
  }

  // User-specific soft delete methods
  async deleteUserAndPdfs(userId) {
    // First soft delete all PDFs associated with the user
    const { PdfRepository } = require('./PdfRepository');
    const pdfRepo = new PdfRepository();
    await pdfRepo.deletePdfByUserId(userId);
    
    // Then soft delete the user
    return await this.delete(userId);
  }

  async restoreUserAndPdfs(userId) {
    // First restore the user
    const user = await this.restore(userId);
    
    // Then restore all PDFs associated with the user
    const { PdfRepository } = require('./PdfRepository');
    const pdfRepo = new PdfRepository();
    await pdfRepo.restorePdfByUserId(userId);
    
    return user;
  }

  async findDeletedUsers() {
    return await this.findDeleted();
  }

  async findDeletedUserByUsername(username) {
    return await this.findDeleted({ where: { username } });
  }

  async findDeletedUserByEmail(email) {
    return await this.findDeleted({ where: { email } });
  }

  async countActiveUsers() {
    return await this.count({ is_active: true });
  }

  async countInactiveUsers() {
    return await this.count({ is_active: false });
  }

  async countDeletedUsers() {
    return await this.countDeleted();
  }

  // User-specific UTC timestamp methods
  async findUsersDeletedAfter(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deleted_at: {
          [this.model.sequelize.Op.gte]: utcTimestamp
        }
      }
    });
  }

  async findUsersDeletedBefore(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deleted_at: {
          [this.model.sequelize.Op.lte]: utcTimestamp
        }
      }
    });
  }

  async findUsersDeletedBetween(startTimestamp, endTimestamp) {
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

  async getUserDeletionStats() {
    const totalUsers = await this.count();
    const deletedUsers = await this.countDeleted();
    const activeUsers = totalUsers - deletedUsers;
    
    return {
      total: totalUsers,
      active: activeUsers,
      deleted: deletedUsers,
      deletionRate: totalUsers > 0 ? (deletedUsers / totalUsers * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = UserRepository;
