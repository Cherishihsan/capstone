const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.3 — kelas (4 atribut)
const Kelas = sequelize.define('Kelas', {
  id_kelas: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  tingkat: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: {
      isIn: [[10, 11, 12]]
    }
  },
  id_wali_kelas: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'guru',
      key: 'id_guru'
    }
  }
}, {
  timestamps: false,
  tableName: 'kelas'
});

module.exports = Kelas;
