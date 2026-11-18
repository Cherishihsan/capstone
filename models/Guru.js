const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.2 — guru (8 atribut)
const Guru = sequelize.define('Guru', {
  id_guru: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_users: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id_users'
    }
  },
  nuptk: {
    type: DataTypes.CHAR(16),
    allowNull: true,
    unique: true
  },
  nip: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  bidang_keahlian: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status_kepegawaian: {
    type: DataTypes.ENUM('PNS', 'PPPK', 'GTT', 'GTY'),
    allowNull: true
  },
  tanggal_masuk: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'guru'
});

module.exports = Guru;
