const sequelize = require('../config/database');
const User = require('./User');
const Guru = require('./Guru');
const Kelas = require('./Kelas');
const Siswa = require('./Siswa');
const OrangTua = require('./OrangTua');
const MataPelajaran = require('./MataPelajaran');
const Semester = require('./Semester');
const KomponenNilai = require('./KomponenNilai');
const DetailKelas = require('./DetailKelas');
const Absensi = require('./Absensi');
const Nilai = require('./Nilai');
const Rapor = require('./Rapor');
const NotifikasiEmail = require('./NotifikasiEmail');

// ============================================================================
// 22 Relasi Antar Tabel sesuai PRD SIMNILAI v3.0 Bagian 8.3
// ============================================================================

// 1. users <-> guru (1 : 1)
User.hasOne(Guru, { foreignKey: 'id_users', as: 'guru' });
Guru.belongsTo(User, { foreignKey: 'id_users', as: 'user' });

// 2. guru <-> kelas (1 : M - Wali Kelas)
Guru.hasMany(Kelas, { foreignKey: 'id_wali_kelas', as: 'kelasBinaan' });
Kelas.belongsTo(Guru, { foreignKey: 'id_wali_kelas', as: 'waliKelas' });

// 3. guru <-> detail_kelas (1 : M)
Guru.hasMany(DetailKelas, { foreignKey: 'id_guru', as: 'penugasanKelas' });
DetailKelas.belongsTo(Guru, { foreignKey: 'id_guru', as: 'guru' });

// 4. guru <-> absensi (1 : M)
Guru.hasMany(Absensi, { foreignKey: 'id_wali_kelas', as: 'absensiDicatat' });
Absensi.belongsTo(Guru, { foreignKey: 'id_wali_kelas', as: 'waliKelas' });

// 5. guru <-> nilai (1 : M)
Guru.hasMany(Nilai, { foreignKey: 'id_guru', as: 'nilaiDiinput' });
Nilai.belongsTo(Guru, { foreignKey: 'id_guru', as: 'guru' });

// 6. guru <-> rapor (1 : M)
Guru.hasMany(Rapor, { foreignKey: 'id_guru', as: 'raporDiunggah' });
Rapor.belongsTo(Guru, { foreignKey: 'id_guru', as: 'guruPengunggah' });

// 7. kelas <-> siswa (1 : M)
Kelas.hasMany(Siswa, { foreignKey: 'id_kelas', as: 'siswa' });
Siswa.belongsTo(Kelas, { foreignKey: 'id_kelas', as: 'kelas' });

// 8. kelas <-> detail_kelas (1 : M)
Kelas.hasMany(DetailKelas, { foreignKey: 'id_kelas', as: 'detailKelas' });
DetailKelas.belongsTo(Kelas, { foreignKey: 'id_kelas', as: 'kelas' });

// 9. kelas <-> absensi (1 : M)
Kelas.hasMany(Absensi, { foreignKey: 'id_kelas', as: 'absensi' });
Absensi.belongsTo(Kelas, { foreignKey: 'id_kelas', as: 'kelas' });

// 10. mata_pelajaran <-> detail_kelas (1 : M)
MataPelajaran.hasMany(DetailKelas, { foreignKey: 'id_mata_pelajaran', as: 'detailKelas' });
DetailKelas.belongsTo(MataPelajaran, { foreignKey: 'id_mata_pelajaran', as: 'mataPelajaran' });

// 11. mata_pelajaran <-> komponen_nilai (1 : M)
MataPelajaran.hasMany(KomponenNilai, { foreignKey: 'id_mata_pelajaran', as: 'komponenNilai' });
KomponenNilai.belongsTo(MataPelajaran, { foreignKey: 'id_mata_pelajaran', as: 'mataPelajaran' });

// 12. semester <-> detail_kelas (1 : M)
Semester.hasMany(DetailKelas, { foreignKey: 'id_semester', as: 'detailKelas' });
DetailKelas.belongsTo(Semester, { foreignKey: 'id_semester', as: 'semester' });

// 13. semester <-> komponen_nilai (1 : M)
Semester.hasMany(KomponenNilai, { foreignKey: 'id_semester', as: 'komponenNilai' });
KomponenNilai.belongsTo(Semester, { foreignKey: 'id_semester', as: 'semester' });

// 14. semester <-> rapor (1 : M)
Semester.hasMany(Rapor, { foreignKey: 'id_semester', as: 'rapor' });
Rapor.belongsTo(Semester, { foreignKey: 'id_semester', as: 'semester' });

// 15. orang_tua <-> siswa (1 : M)
OrangTua.hasMany(Siswa, { foreignKey: 'id_orang_tua', as: 'anak' });
Siswa.belongsTo(OrangTua, { foreignKey: 'id_orang_tua', as: 'orangTua' });

// 16. siswa <-> absensi (1 : M)
Siswa.hasMany(Absensi, { foreignKey: 'id_siswa', as: 'absensi' });
Absensi.belongsTo(Siswa, { foreignKey: 'id_siswa', as: 'siswa' });

// 17. siswa <-> nilai (1 : M)
Siswa.hasMany(Nilai, { foreignKey: 'id_siswa', as: 'nilai' });
Nilai.belongsTo(Siswa, { foreignKey: 'id_siswa', as: 'siswa' });

// 18. siswa <-> rapor (1 : M)
Siswa.hasMany(Rapor, { foreignKey: 'id_siswa', as: 'rapor' });
Rapor.belongsTo(Siswa, { foreignKey: 'id_siswa', as: 'siswa' });

// 19. komponen_nilai <-> nilai (1 : M)
KomponenNilai.hasMany(Nilai, { foreignKey: 'id_komponen_nilai', as: 'nilaiSiswa' });
Nilai.belongsTo(KomponenNilai, { foreignKey: 'id_komponen_nilai', as: 'komponenNilai' });

// 20. siswa <-> notifikasi_email (1 : M)
Siswa.hasMany(NotifikasiEmail, { foreignKey: 'id_siswa', as: 'notifikasiEmail' });
NotifikasiEmail.belongsTo(Siswa, { foreignKey: 'id_siswa', as: 'siswa' });

// 21. absensi <-> notifikasi_email (1 : M)
Absensi.hasMany(NotifikasiEmail, { foreignKey: 'id_absensi', as: 'notifikasiEmail' });
NotifikasiEmail.belongsTo(Absensi, { foreignKey: 'id_absensi', as: 'absensi' });

// 22. rapor <-> notifikasi_email (1 : M)
Rapor.hasMany(NotifikasiEmail, { foreignKey: 'id_rapor', as: 'notifikasiEmail' });
NotifikasiEmail.belongsTo(Rapor, { foreignKey: 'id_rapor', as: 'rapor' });

module.exports = {
  sequelize,
  User,
  Guru,
  Kelas,
  Siswa,
  OrangTua,
  MataPelajaran,
  Semester,
  KomponenNilai,
  DetailKelas,
  Absensi,
  Nilai,
  Rapor,
  NotifikasiEmail
};
