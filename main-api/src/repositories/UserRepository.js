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

}

module.exports = UserRepository;
