const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pdf extends Model {
    static associate(models) {
      // Define associations here
      Pdf.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Pdf.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pdfPath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'pdf_path'
    },
    status: {
      type: DataTypes.ENUM('queued', 'parsing', 'transform', 'ready', 'failed'),
      defaultValue: 'queued'
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    modelName: 'Pdf',
    tableName: 'pdfs',
    timestamps: true,
    underscored: true,
    paranoid: true, // This enables soft deletes using deletedAt
    createdAt: 'created_at',
    updatedAt: false, // No updated_at field in your schema
    deletedAt: 'deleted_at'
  });

  return Pdf;
};
