const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.1 — users (7 atribut)
const User = sequelize.define('User', {
  id_users: {
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
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'guru', 'siswa', 'orang_tua'),
    allowNull: false
  },
  status_aktif: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 1
  },
  dibuat_pada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'users'
});

module.exports = User;
