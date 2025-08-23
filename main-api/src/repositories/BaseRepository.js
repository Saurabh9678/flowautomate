const moment = require('moment');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    const defaultWhere = { deleted_at: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findAll(finalOptions);
  }

  async findById(id, options = {}) {
    const defaultWhere = { deleted_at: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findByPk(id, finalOptions);
  }

  async findOne(options = {}) {
    const defaultWhere = { deleted_at: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findOne(finalOptions);
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const instance = await this.model.findByPk(id);
    if (!instance) {
      throw new Error(`${this.model.name} not found`);
    }
    return await instance.update(data);
  }

  // Soft delete - sets deleted_at timestamp in UTC instead of removing record
  async delete(id) {
    const instance = await this.model.findByPk(id);
    if (!instance) {
      throw new Error(`${this.model.name} not found`);
    }
    const utcTimestamp = moment.utc().toDate();
    return await instance.update({ deleted_at: utcTimestamp });
  }

  // Hard delete - permanently removes the record
  async hardDelete(id) {
    const instance = await this.model.findByPk(id);
    if (!instance) {
      throw new Error(`${this.model.name} not found`);
    }
    return await instance.destroy({ force: true });
  }

  // Restore soft deleted record
  async restore(id) {
    const instance = await this.model.findOne({
      where: { id, deleted_at: { [this.model.sequelize.Op.ne]: null } }
    });
    if (!instance) {
      throw new Error(`${this.model.name} not found or not deleted`);
    }
    return await instance.update({ deleted_at: null });
  }

  // Find all records including deleted ones
  async findAllWithDeleted(options = {}) {
    return await this.model.findAll(options);
  }

  // Find by ID including deleted records
  async findByIdWithDeleted(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  // Find only deleted records
  async findDeleted(options = {}) {
    const defaultWhere = { deleted_at: { [this.model.sequelize.Op.ne]: null } };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findAll(finalOptions);
  }

  // Count all records (excluding deleted)
  async count(options = {}) {
    const defaultWhere = { deleted_at: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.count(finalOptions);
  }

  // Count only deleted records
  async countDeleted(options = {}) {
    const defaultWhere = { deleted_at: { [this.model.sequelize.Op.ne]: null } };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.count(finalOptions);
  }

  // Utility methods for UTC timestamps
  getCurrentUTCTimestamp() {
    return moment.utc().toDate();
  }

  formatUTCTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm:ss UTC') {
    return moment.utc(timestamp).format(format);
  }

  isUTCTimestamp(timestamp) {
    return moment.utc(timestamp).isValid();
  }
}

module.exports = BaseRepository;
