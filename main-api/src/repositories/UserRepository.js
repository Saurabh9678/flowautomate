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
      where: { isActive: true }
    });
  }

  async findInactiveUsers() {
    return await this.findAll({
      where: { isActive: false }
    });
  }

  async updateActiveStatus(id, isActive) {
    return await this.update(id, { isActive });
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
    return await this.count({ isActive: true });
  }

  async countInactiveUsers() {
    return await this.count({ isActive: false });
  }

  async countDeletedUsers() {
    return await this.countDeleted();
  }

  // User-specific UTC timestamp methods
  async findUsersDeletedAfter(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deletedAt: {
          [this.model.sequelize.Op.gte]: utcTimestamp
        }
      }
    });
  }

  async findUsersDeletedBefore(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findDeleted({
      where: {
        deletedAt: {
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
        deletedAt: {
          [this.model.sequelize.Op.between]: [startUTC, endUTC]
        }
      }
    });
  }

  // Get user deletion statistics with UTC timestamps
  async getUserDeletionStats() {
    const deletedUsers = await this.findDeleted();
    const stats = {
      totalDeleted: deletedUsers.length,
      deletedToday: 0,
      deletedThisWeek: 0,
      deletedThisMonth: 0
    };

    const startOfDay = moment.utc().startOf('day');
    const startOfWeek = moment.utc().startOf('week');
    const startOfMonth = moment.utc().startOf('month');

    deletedUsers.forEach(user => {
      const deletedAt = moment.utc(user.deletedAt);
      
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

  // Find users who have been inactive for a certain period
  async findInactiveUsersSince(timestamp) {
    const utcTimestamp = moment.utc(timestamp).toDate();
    return await this.findAll({
      where: {
        isActive: false,
        createdAt: {
          [this.model.sequelize.Op.lte]: utcTimestamp
        }
      }
    });
  }
}

module.exports = UserRepository;
