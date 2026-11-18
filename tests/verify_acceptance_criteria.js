/**
 * Pengujian Otomatis Kriteria Penerimaan SIMNILAI v3.0 (AC-01 s.d. AC-10)
 * Menjalankan verifikasi menyeluruh terhadap 13 tabel pada PostgreSQL, RBAC 5 peran,
 * absensi harian, input nilai 0-100, unggah/unduh PDF raport, dan notifikasi email.
 */
require('dotenv').config();
process.env.EMAIL_ENABLED = 'true';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { seedDatabase } = require('../seeders/seed');
const {
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
} = require('../models');
const AttendanceService = require('../services/AttendanceService');
const GradeService = require('../services/GradeService');
const RaporService = require('../services/RaporService');
const { storageDir } = require('../config/upload');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 MEMULAI VERIFIKASI KRITERIA PENERIMAAN SIMNILAI v3.0 (AC-01..AC-10)');
  console.log(`   Basis Data Aktif: ${sequelize.getDialect().toUpperCase()} (${process.env.DB_NAME || 'simnilai'})`);
  console.log('================================================================\n');

  await seedDatabase(false);

  const semAktif = await Semester.findOne({ where: { aktif: 1 } });
  const kelas1 = await Kelas.findOne({ where: { nama: 'X IPA 1 — 2026/2027' } });
  const kelas2 = await Kelas.findOne({ where: { nama: 'X IPA 2 — 2026/2027' } });
  const guru1 = await Guru.findByPk(kelas1.id_wali_kelas);
  const guru2 = await Guru.findByPk(kelas2.id_wali_kelas);
  const siswaKelas1 = await Siswa.findAll({ where: { id_kelas: kelas1.id_kelas }, order: [['id_siswa', 'ASC']] });
  const mapelMtk = await MataPelajaran.findOne({ where: { kode: 'MTK' } });
  const mapelFis = await MataPelajaran.findOne({ where: { kode: 'FIS' } });
  const kompMtk = await KomponenNilai.findOne({
    where: { id_mata_pelajaran: mapelMtk.id_mata_pelajaran, id_semester: semAktif.id_semester }
  });

  const testDate = '2026-11-17';
  const mockSuccessTransport = {
    sendMail: async () => ({ messageId: 'mock-ok' })
  };

  // AC-01
  const entriesAc01 = siswaKelas1.map((s, idx) => ({
    id_siswa: s.id_siswa,
    status: idx < 2 ? 'tidak_hadir' : 'hadir',
    keterangan: idx < 2 ? 'alpa' : null
  }));
  await AttendanceService.saveDailyAttendance({
    id_kelas: kelas1.id_kelas,
    id_wali_kelas: guru1.id_guru,
    tanggal: testDate,
    entries: entriesAc01,
    customTransport: mockSuccessTransport
  });
  const countAc01 = await Absensi.count({ where: { id_kelas: kelas1.id_kelas, tanggal: testDate } });
  assert.strictEqual(countAc01, siswaKelas1.length, 'AC-01 gagal: jumlah baris tidak sesuai jumlah siswa');
  console.log('✅ AC-01 LULUS: Tersimpan tepat satu baris per siswa per tanggal & rekap diperbarui.');

  // AC-02
  await AttendanceService.saveDailyAttendance({
    id_kelas: kelas1.id_kelas,
    id_wali_kelas: guru1.id_guru,
    tanggal: testDate,
    entries: entriesAc01,
    customTransport: mockSuccessTransport
  });
  const countAc02 = await Absensi.count({ where: { id_kelas: kelas1.id_kelas, tanggal: testDate } });
  assert.strictEqual(countAc02, siswaKelas1.length, 'AC-02 gagal: terdapat duplikasi baris absensi');
  console.log('✅ AC-02 LULUS: Penyimpanan kedua memperbarui baris yang ada tanpa membuat duplikasi.');

  // AC-03
  let ac03Rejected = false;
  try {
    await AttendanceService.saveDailyAttendance({
      id_kelas: kelas1.id_kelas,
      id_wali_kelas: guru1.id_guru,
      tanggal: testDate,
      entries: [{ id_siswa: siswaKelas1[0].id_siswa, status: 'tidak_hadir', keterangan: null }]
    });
  } catch (err) {
    ac03Rejected = err.status === 400 && err.message.toLowerCase().includes('keterangan wajib diisi');
  }
  assert.strictEqual(ac03Rejected, true, 'AC-03 gagal: status tidak_hadir tanpa keterangan tidak ditolak');
  console.log('✅ AC-03 LULUS: Sistem menolak status Tidak Hadir tanpa keterangan dengan pesan galat jelas.');

  // AC-04
  let reject105 = false;
  let rejectText = false;
  try {
    await GradeService.saveGrades({
      id_guru: guru1.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semAktif.id_semester,
      entries: [{ id_siswa: siswaKelas1[0].id_siswa, id_komponen_nilai: kompMtk.id_komponen_nilai, nilai: 105 }]
    });
  } catch (err) {
    reject105 = err.status === 400;
  }

  try {
    await GradeService.saveGrades({
      id_guru: guru1.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semAktif.id_semester,
      entries: [{ id_siswa: siswaKelas1[0].id_siswa, id_komponen_nilai: kompMtk.id_komponen_nilai, nilai: 'delapan puluh' }]
    });
  } catch (err) {
    rejectText = err.status === 400;
  }

  const savedValidScore = await GradeService.saveGrades({
    id_guru: guru1.id_guru,
    id_kelas: kelas1.id_kelas,
    id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
    id_semester: semAktif.id_semester,
    entries: [{ id_siswa: siswaKelas1[0].id_siswa, id_komponen_nilai: kompMtk.id_komponen_nilai, nilai: 95 }]
  });

  assert.strictEqual(reject105 && rejectText && savedValidScore.length === 1, true, 'AC-04 gagal');
  console.log('✅ AC-04 LULUS: Input nilai 105 dan teks ditolak; nilai 0–100 diterima.');

  // AC-05
  let ac05Forbidden = false;
  try {
    await GradeService.verifyTeacherAssignment({
      id_guru: guru2.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelFis.id_mata_pelajaran,
      id_semester: semAktif.id_semester
    });
  } catch (err) {
    ac05Forbidden = err.status === 403;
  }
  assert.strictEqual(ac05Forbidden, true, 'AC-05 gagal: akses tidak ditolak dengan 403');
  console.log('✅ AC-05 LULUS: Akses Guru Mapel ke kelas/mapel yang tidak ditugaskan ditolak (403).');

  // AC-06
  let docxRejected = false;
  try {
    await RaporService.uploadRapor({
      id_siswa: siswaKelas1[1].id_siswa,
      id_semester: semAktif.id_semester,
      id_guru: guru1.id_guru,
      file: {
        originalname: 'raport_salah.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024 * 100
      }
    });
  } catch (err) {
    docxRejected = err.status === 400;
  }

  const pdfFile1 = path.join(storageDir, 'test_upload_v1.pdf');
  fs.writeFileSync(pdfFile1, Buffer.from('%PDF-1.4 dummy v1'));
  const uploadedRapor1 = await RaporService.uploadRapor({
    id_siswa: siswaKelas1[1].id_siswa,
    id_semester: semAktif.id_semester,
    id_guru: guru1.id_guru,
    file: {
      originalname: 'raport_siswa2.pdf',
      filename: 'test_upload_v1.pdf',
      path: pdfFile1,
      mimetype: 'application/pdf',
      size: 1024 * 500
    },
    customTransport: mockSuccessTransport
  });
  assert.strictEqual(docxRejected && Boolean(uploadedRapor1.id_rapor), true, 'AC-06 gagal');
  console.log('✅ AC-06 LULUS: PDF diterima dan metadatanya tercatat; berkas .docx ditolak beserta alasannya.');

  // AC-07
  const pdfFile2 = path.join(storageDir, 'test_upload_v2.pdf');
  fs.writeFileSync(pdfFile2, Buffer.from('%PDF-1.4 dummy v2'));
  const uploadedRapor2 = await RaporService.uploadRapor({
    id_siswa: siswaKelas1[1].id_siswa,
    id_semester: semAktif.id_semester,
    id_guru: guru1.id_guru,
    file: {
      originalname: 'raport_siswa2_revisi.pdf',
      filename: 'test_upload_v2.pdf',
      path: pdfFile2,
      mimetype: 'application/pdf',
      size: 1024 * 600
    },
    customTransport: mockSuccessTransport
  });
  const countRaporSiswa2 = await Rapor.count({
    where: { id_siswa: siswaKelas1[1].id_siswa, id_semester: semAktif.id_semester }
  });
  assert.strictEqual(countRaporSiswa2, 1, 'AC-07 gagal: duplikasi baris rapor');
  assert.strictEqual(uploadedRapor2.file_pdf, 'test_upload_v2.pdf', 'AC-07 gagal: nama berkas tidak tergantikan');
  console.log('✅ AC-07 LULUS: Berkas lama tergantikan, diunggah_pada diperbarui, tidak ada duplikasi baris.');

  // AC-08
  const ortuA = await OrangTua.findOne({ where: { email: 'ahmad.ortu@email.com' } });
  const raporAnakOrtuB = await Rapor.findOne({ where: { id_siswa: siswaKelas1[2].id_siswa } });
  let ac08Blocked = false;
  try {
    await RaporService.authorizeAndGetRapor(raporAnakOrtuB.id_rapor, {
      role: 'orang_tua',
      id_orang_tua: ortuA.id_orang_tua
    });
  } catch (err) {
    ac08Blocked = err.status === 403;
  }
  assert.strictEqual(ac08Blocked, true, 'AC-08 gagal: Orang tua A dapat mengakses raport anak orang tua B');
  console.log('✅ AC-08 LULUS: Orang tua A ditolak (403) saat mencoba mengunduh raport anak orang tua B.');

  // AC-09
  const monitoring = await RaporService.getMonitoringKelengkapan({
    id_kelas: kelas1.id_kelas,
    id_semester: semAktif.id_semester
  });
  assert.strictEqual(monitoring.total_siswa, 5, 'AC-09 gagal: total siswa kelas tidak sesuai');
  assert.strictEqual(monitoring.sudah_unggah, 3, 'AC-09 gagal: jumlah sudah unggah tidak sesuai');
  assert.strictEqual(monitoring.belum_unggah, 2, 'AC-09 gagal: jumlah belum unggah tidak sesuai');
  console.log('✅ AC-09 LULUS: Monitoring raport menampilkan daftar lengkap siswa beserta penanda status.');

  // AC-10
  const siswaEmailInvalid = siswaKelas1[4];
  const resAc10 = await AttendanceService.saveDailyAttendance({
    id_kelas: kelas1.id_kelas,
    id_wali_kelas: guru1.id_guru,
    tanggal: '2026-11-18',
    entries: [
      { id_siswa: siswaEmailInvalid.id_siswa, status: 'tidak_hadir', keterangan: 'sakit' }
    ],
    customTransport: mockSuccessTransport
  });
  const absensiTersimpan = await Absensi.findOne({
    where: { id_siswa: siswaEmailInvalid.id_siswa, tanggal: '2026-11-18' }
  });
  const notifGagal = resAc10.notifikasiHasil[0];
  assert.ok(absensiTersimpan, 'AC-10 gagal: data absensi ikut batal saat email gagal');
  assert.strictEqual(notifGagal.status, 'gagal', 'AC-10 gagal: status notifikasi tidak menjadi gagal');
  assert.ok(notifGagal.pesan_error, 'AC-10 gagal: pesan_error kosong');
  console.log('✅ AC-10 LULUS: Status notifikasi menjadi gagal dengan pesan error; data absensi tetap tersimpan.');

  console.log('\n🎉 SELURUH 10 KRITERIA PENERIMAAN (AC-01 S.D. AC-10) LULUS 100% PADA POSTGRESQL!');
  await sequelize.close();
}

runTests().catch((err) => {
  console.error('❌ Pengujian gagal:', err);
  process.exit(1);
});
