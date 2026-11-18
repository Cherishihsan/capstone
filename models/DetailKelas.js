const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.9 — detail_kelas (5 atribut)
const DetailKelas = sequelize.define('DetailKelas', {
  id_detail_kelas: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_guru: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'guru',
      key: 'id_guru'
    }
  },
  id_kelas: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'kelas',
      key: 'id_kelas'
    }
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
  }
}, {
  timestamps: false,
  tableName: 'detail_kelas',
  indexes: [
    {
      unique: true,
      name: 'uq_penugasan_kelas_mapel_semester',
      fields: ['id_kelas', 'id_mata_pelajaran', 'id_semester']
    }
  ]
});

module.exports = DetailKelas;
