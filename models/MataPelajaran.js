const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.6 — mata_pelajaran (4 atribut)
const MataPelajaran = sequelize.define('MataPelajaran', {
  id_mata_pelajaran: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  kode: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  kelompok: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'mata_pelajaran'
});

module.exports = MataPelajaran;
