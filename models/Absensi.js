const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel 8.10 — absensi (8 atribut)
const Absensi = sequelize.define('Absensi', {
  id_absensi: {
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
  id_kelas: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'kelas',
      key: 'id_kelas'
    }
  },
  id_wali_kelas: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'guru',
      key: 'id_guru'
    }
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('hadir', 'tidak_hadir'),
    allowNull: false
  },
  keterangan: {
    type: DataTypes.ENUM('sakit', 'izin', 'alpa'),
    allowNull: true
  },
  dibuat_pada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'absensi',
  indexes: [
    {
      unique: true,
      name: 'uq_absensi_siswa_tanggal',
      fields: ['id_siswa', 'tanggal']
    },
    {
      name: 'idx_absensi_kelas_tanggal',
      fields: ['id_kelas', 'tanggal']
    }
  ],
  validate: {
    keteranganSesuaiStatus() {
      if (this.status === 'tidak_hadir' && !this.keterangan) {
        throw new Error('Keterangan (sakit, izin, atau alpa) wajib diisi apabila status siswa Tidak Hadir.');
      }
      if (this.status === 'hadir' && this.keterangan !== null && this.keterangan !== undefined && this.keterangan !== '') {
        this.keterangan = null;
      }
    }
  }
});

module.exports = Absensi;
