const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.5 — orang_tua (4 atribut)
const OrangTua = sequelize.define('OrangTua', {
  id_orang_tua: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'orang_tua'
});

module.exports = OrangTua;
