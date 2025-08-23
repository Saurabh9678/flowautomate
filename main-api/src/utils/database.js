const { sequelize } = require('../models');
const { BadRequestError } = require('./CustomError');

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

  static async validateSchema() {
    try {
      console.log('🔍 Validating database schema against models...');
      
      // Get all models
      const models = sequelize.models;
      const validationErrors = [];

      for (const [modelName, model] of Object.entries(models)) {
        try {
          // Get table name
          const tableName = model.getTableName();
          
          // Check if table exists
          const tableExists = await sequelize.getQueryInterface().showAllTables();
          if (!tableExists.includes(tableName)) {
            validationErrors.push(`❌ Table '${tableName}' for model '${modelName}' does not exist in database`);
            continue;
          }

          // Get model attributes
          const modelAttributes = model.rawAttributes;
          
          // Get database columns
          const tableDescription = await sequelize.getQueryInterface().describeTable(tableName);
          
          // Check for missing columns in database
          for (const [attrName, attrDef] of Object.entries(modelAttributes)) {
            if (!tableDescription[attrName]) {
              validationErrors.push(`❌ Column '${attrName}' missing in table '${tableName}' for model '${modelName}'`);
            }
          }

          // Check for extra columns in database (optional - you can remove this if you want to allow extra columns)
          for (const [colName, colDef] of Object.entries(tableDescription)) {
            if (!modelAttributes[colName] && colName !== 'id') {
              validationErrors.push(`❌ Extra column '${colName}' found in table '${tableName}' not defined in model '${modelName}'`);
            }
          }

        } catch (error) {
          validationErrors.push(`❌ Error validating model '${modelName}': ${error.message}`);
        }
      }

      if (validationErrors.length > 0) {
        console.error('🚨 Schema validation failed:');
        validationErrors.forEach(error => console.error(error));
        throw new BadRequestError(`Database schema mismatch detected. Please update your database schema or models.\n${validationErrors.join('\n')}`);
      }

      console.log('✅ Database schema validation passed');
    } catch (error) {
      console.error('❌ Schema validation error:', error.message);
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
