const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.12 — rapor (7 atribut)
const Rapor = sequelize.define('Rapor', {
  id_rapor: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_siswa: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'siswa',
      key: 'id_siswa'
    }
  },
  id_semester: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'semester',
      key: 'id_semester'
    }
  },
  id_guru: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'guru',
      key: 'id_guru'
    }
  },
  file_pdf: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  diunggah_pada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  keterangan: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'rapor',
  indexes: [
    {
      unique: true,
      name: 'uq_rapor_siswa_semester',
      fields: ['id_siswa', 'id_semester']
    },
    {
      name: 'idx_rapor_siswa_semester',
      fields: ['id_siswa', 'id_semester']
    }
  ]
});

module.exports = Rapor;
