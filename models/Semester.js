const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.7 — semester (6 atribut)
const Semester = sequelize.define('Semester', {
  id_semester: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  tahun_ajaran: {
    type: DataTypes.STRING(9),
    allowNull: false
  },
  semester: {
    type: DataTypes.ENUM('Ganjil', 'Genap'),
    allowNull: false
  },
  mulai: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  selesai: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  aktif: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false,
  tableName: 'semester'
});

module.exports = Semester;
