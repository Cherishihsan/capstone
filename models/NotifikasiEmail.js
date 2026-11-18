const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.13 — notifikasi_email (12 atribut)
const NotifikasiEmail = sequelize.define('NotifikasiEmail', {
  id_notifikasi_email: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  tipe: {
    type: DataTypes.ENUM('absensi', 'rapor'),
    allowNull: false
  },
  id_siswa: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'siswa',
      key: 'id_siswa'
    }
  },
  id_absensi: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'absensi',
      key: 'id_absensi'
    }
  },
  id_rapor: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'rapor',
      key: 'id_rapor'
    }
  },
  penerima: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  subjek: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('antre', 'terkirim', 'gagal'),
    allowNull: false,
    defaultValue: 'antre'
  },
  percobaan: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  pesan_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dibuat_pada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dikirim_pada: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'notifikasi_email',
  indexes: [
    {
      name: 'idx_notifikasi_status_dibuat',
      fields: ['status', 'dibuat_pada']
    }
  ]
});

module.exports = NotifikasiEmail;
