const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.8 — komponen_nilai (5 atribut)
const KomponenNilai = sequelize.define('KomponenNilai', {
  id_komponen_nilai: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_mata_pelajaran: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'mata_pelajaran',
      key: 'id_mata_pelajaran'
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
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  bobot: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: false,
  tableName: 'komponen_nilai'
});

module.exports = KomponenNilai;
