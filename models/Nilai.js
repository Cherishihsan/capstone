const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.11 — nilai (6 atribut)
const Nilai = sequelize.define('Nilai', {
  id_nilai: {
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
  id_komponen_nilai: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'komponen_nilai',
      key: 'id_komponen_nilai'
    }
  },
  nilai: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Nilai harus berupa angka yang valid.'
      },
      min: {
        args: [0],
        msg: 'Nilai tidak boleh kurang dari 0.'
      },
      max: {
        args: [100],
        msg: 'Nilai tidak boleh lebih dari 100.'
      }
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
  diperbarui_pada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'nilai',
  indexes: [
    {
      unique: true,
      name: 'uq_nilai_siswa_komponen',
      fields: ['id_siswa', 'id_komponen_nilai']
    },
    {
      name: 'idx_nilai_siswa',
      fields: ['id_siswa']
    }
  ]
});

module.exports = Nilai;
