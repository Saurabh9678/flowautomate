const moment = require('moment');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    // Ensure we only get non-deleted records by default
    const defaultWhere = { deletedAt: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findAll(finalOptions);
  }

  async findById(id, options = {}) {
    // Ensure we only get non-deleted records by default
    const defaultWhere = { deletedAt: null };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findOne({ where: { id, ...defaultWhere }, ...finalOptions });
  }

  async findOne(where, options = {}) {
    // Ensure we only get non-deleted records by default
    const defaultWhere = { deletedAt: null };
    const finalWhere = { ...defaultWhere, ...where };
    const finalOptions = {
      ...options,
      where: finalWhere
    };
    return await this.model.findOne(finalOptions);
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const instance = await this.findById(id);
    if (!instance) {
      throw new Error('Record not found');
    }
    return await instance.update(data);
  }

  // Soft delete - sets deletedAt timestamp in UTC instead of removing record
  async delete(id) {
    const instance = await this.findById(id);
    if (!instance) {
      throw new Error('Record not found');
    }
    const utcTimestamp = moment.utc().toDate();
    return await instance.update({ deletedAt: utcTimestamp });
  }

  // Hard delete - permanently removes the record
  async hardDelete(id) {
    const instance = await this.model.findByPk(id);
    if (!instance) {
      throw new Error('Record not found');
    }
    return await instance.destroy({ force: true });
  }

  // Restore a soft-deleted record
  async restore(id) {
    const instance = await this.model.findOne({ 
      where: { id, deletedAt: { [this.model.sequelize.Op.ne]: null } }
    });
    if (!instance) {
      throw new Error('Record not found or not deleted');
    }
    return await instance.update({ deletedAt: null });
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
    const defaultWhere = { deletedAt: { [this.model.sequelize.Op.ne]: null } };
    const finalOptions = {
      ...options,
      where: { ...defaultWhere, ...options.where }
    };
    return await this.model.findAll(finalOptions);
  }

  async count(where = {}) {
    // Ensure we only count non-deleted records by default
    const defaultWhere = { deletedAt: null };
    const finalWhere = { ...defaultWhere, ...where };
    return await this.model.count({ where: finalWhere });
  }

  // Count deleted records
  async countDeleted(where = {}) {
    const defaultWhere = { deletedAt: { [this.model.sequelize.Op.ne]: null } };
    const finalWhere = { ...defaultWhere, ...where };
    return await this.model.count({ where: finalWhere });
  }

  // Utility method to get current UTC timestamp
  getCurrentUTCTimestamp() {
    return moment.utc().toDate();
  }

  // Utility method to format UTC timestamp
  formatUTCTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm:ss UTC') {
    return moment.utc(timestamp).format(format);
  }

  // Utility method to check if a timestamp is in UTC
  isUTCTimestamp(timestamp) {
    return moment.utc(timestamp).isValid();
  }
}

module.exports = BaseRepository;
