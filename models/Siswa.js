const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.4 — siswa (9 atribut)
const Siswa = sequelize.define('Siswa', {
  id_siswa: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  nis: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nisn: {
    type: DataTypes.CHAR(10),
    allowNull: true,
    unique: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('L', 'P'),
    allowNull: false
  },
  tanggal_lahir: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  id_kelas: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'kelas',
      key: 'id_kelas'
    }
  },
  id_orang_tua: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'orang_tua',
      key: 'id_orang_tua'
    }
  },
  status: {
    type: DataTypes.ENUM('aktif', 'lulus', 'pindah', 'keluar'),
    allowNull: false,
    defaultValue: 'aktif'
  }
}, {
  timestamps: false,
  tableName: 'siswa'
});

module.exports = Siswa;
