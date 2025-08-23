const { sequelize } = require('../models');

class Database {
  static async connect() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error);
      throw error;
    }
  }

  static async sync(force = false) {
    try {
      await sequelize.sync({ force });
      console.log('✅ Database synchronized successfully.');
    } catch (error) {
      console.error('❌ Error synchronizing database:', error);
      throw error;
    }
  }

  static async close() {
    try {
      await sequelize.close();
      console.log('✅ Database connection closed.');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  }
}

module.exports = Database;
