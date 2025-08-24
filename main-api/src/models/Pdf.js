const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pdf extends Model {
    static associate(models) {
      // Define associations here
      Pdf.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Pdf.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pdf_path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('queued', 'parsing', 'transform', 'ready', 'failed'),
      defaultValue: 'queued'
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Pdf',
    tableName: 'pdfs',
    timestamps: true,
    underscored: true,
    paranoid: true, // This enables soft deletes using deleted_at
    createdAt: 'created_at',
    updatedAt: false,
    deletedAt: 'deleted_at'
  });

  return Pdf;
};
