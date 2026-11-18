require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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
const { storageDir } = require('../config/upload');

/**
 * Seeder Data Contoh SIMNILAI v3.0
 * Sesuai Lampiran A.3: 1 semester aktif, 2 kelas, 10 siswa, 3 mapel, 2 guru,
 * dilengkapi orang tua (termasuk 1 orang tua -> 2 siswa), komponen nilai (total bobot 100%),
 * detail_kelas, absensi harian, nilai, dokumen PDF raport contoh, dan notifikasi_email.
 */
async function seedDatabase(closeConnection = true) {
  console.log('🌱 Memulai seeder SIMNILAI v3.0 (13 Tabel)...');

  await sequelize.sync({ force: true });
  console.log('✅ 13 Tabel basis data berhasil disinkronisasi.');

  const defaultPassHash = bcrypt.hashSync('password123', 10);

  // 1. Users (Admin, 2 Guru, 2 Orang Tua, 2 Siswa untuk uji login 5 peran)
  const adminUser = await User.create({
    nama: 'Administrator Tata Usaha',
    email: 'admin@sekolah.sch.id',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    status_aktif: 1
  });

  const guruUser1 = await User.create({
    nama: 'Budi Santoso, S.Pd.',
    email: 'budi.guru@sekolah.sch.id',
    password: bcrypt.hashSync('guru123', 10),
    role: 'guru',
    status_aktif: 1
  });

  const guruUser2 = await User.create({
    nama: 'Siti Rahayu, M.Pd.',
    email: 'siti.guru@sekolah.sch.id',
    password: bcrypt.hashSync('guru123', 10),
    role: 'guru',
    status_aktif: 1
  });

  // 2. Guru (1:1 dengan users)
  const guru1 = await Guru.create({
    id_users: guruUser1.id_users,
    nuptk: '1234567890123451',
    nip: '198501012010011001',
    bidang_keahlian: 'Matematika & Fisika',
    status_kepegawaian: 'PNS',
    tanggal_masuk: '2015-07-15',
    no_hp: '081234567801'
  });

  const guru2 = await Guru.create({
    id_users: guruUser2.id_users,
    nuptk: '1234567890123452',
    nip: '199002022015022002',
    bidang_keahlian: 'Bahasa Indonesia',
    status_kepegawaian: 'GTY',
    tanggal_masuk: '2018-07-15',
    no_hp: '081234567802'
  });

  // 3. Semester (1 semester aktif)
  const semesterAktif = await Semester.create({
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil',
    mulai: '2026-07-13',
    selesai: '2026-12-18',
    aktif: 1
  });

  // 4. Kelas (2 kelas, masing-masing dengan Wali Kelas)
  const kelas1 = await Kelas.create({
    nama: 'X IPA 1 — 2026/2027',
    tingkat: 10,
    id_wali_kelas: guru1.id_guru
  });

  const kelas2 = await Kelas.create({
    nama: 'X IPA 2 — 2026/2027',
    tingkat: 10,
    id_wali_kelas: guru2.id_guru
  });

  // 5. Mata Pelajaran (3 mapel)
  const mapelMtk = await MataPelajaran.create({
    kode: 'MTK',
    nama: 'Matematika Wajib',
    kelompok: 'Umum'
  });

  const mapelBin = await MataPelajaran.create({
    kode: 'BIN',
    nama: 'Bahasa Indonesia',
    kelompok: 'Umum'
  });

  const mapelFis = await MataPelajaran.create({
    kode: 'FIS',
    nama: 'Fisika',
    kelompok: 'MIPA'
  });

  // 6. Detail Kelas (Penugasan Guru Mapel per kelas, mapel, semester)
  await DetailKelas.bulkCreate([
    {
      id_guru: guru1.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester
    },
    {
      id_guru: guru1.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelFis.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester
    },
    {
      id_guru: guru2.id_guru,
      id_kelas: kelas1.id_kelas,
      id_mata_pelajaran: mapelBin.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester
    },
    {
      id_guru: guru2.id_guru,
      id_kelas: kelas2.id_kelas,
      id_mata_pelajaran: mapelBin.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester
    },
    {
      id_guru: guru1.id_guru,
      id_kelas: kelas2.id_kelas,
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester
    }
  ]);

  // 7. Komponen Nilai (Total bobot = 100% per mapel per semester)
  const kompMtk = await KomponenNilai.bulkCreate([
    {
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'Tugas',
      bobot: 20.0
    },
    {
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'UTS',
      bobot: 35.0
    },
    {
      id_mata_pelajaran: mapelMtk.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'PAS',
      bobot: 45.0
    }
  ]);

  await KomponenNilai.bulkCreate([
    {
      id_mata_pelajaran: mapelBin.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'Tugas',
      bobot: 30.0
    },
    {
      id_mata_pelajaran: mapelBin.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'UTS',
      bobot: 30.0
    },
    {
      id_mata_pelajaran: mapelBin.id_mata_pelajaran,
      id_semester: semesterAktif.id_semester,
      nama: 'PAS',
      bobot: 40.0
    }
  ]);

  // 8. Orang Tua (9 orang tua untuk 10 siswa — Orang Tua 1 memiliki 2 anak)
  const daftarOrtuData = [
    { nama: 'Ahmad Hidayat', email: 'ahmad.ortu@email.com', no_hp: '081200000001' },
    { nama: 'Dewi Lestari', email: 'dewi.ortu@email.com', no_hp: '081200000002' },
    { nama: 'Eko Prasetyo', email: 'eko.ortu@email.com', no_hp: '081200000003' },
    { nama: 'Fitri Handayani', email: 'fitri.ortu@email.com', no_hp: '081200000004' },
    { nama: 'Gunawan Wibowo', email: 'gunawan.ortu@email.com', no_hp: '081200000005' },
    { nama: 'Heni Susanti', email: 'heni.ortu@email.com', no_hp: '081200000006' },
    { nama: 'Irfan Hakim', email: 'irfan.ortu@email.com', no_hp: '081200000007' },
    { nama: 'Jamilah Putri', email: 'jamilah.ortu@email.com', no_hp: '081200000008' },
    { nama: 'Kurniawan Adi', email: 'email-tidak-valid', no_hp: '081200000009' }
  ];
  const orangTuaList = await OrangTua.bulkCreate(daftarOrtuData);

  // Buat akun login untuk Orang Tua 1 & Orang Tua 2
  await User.bulkCreate([
    {
      nama: orangTuaList[0].nama,
      email: orangTuaList[0].email,
      password: defaultPassHash,
      role: 'orang_tua',
      status_aktif: 1
    },
    {
      nama: orangTuaList[1].nama,
      email: orangTuaList[1].email,
      password: defaultPassHash,
      role: 'orang_tua',
      status_aktif: 1
    }
  ]);

  // 9. Siswa (10 siswa: 5 di Kelas 1, 5 di Kelas 2)
  const dataSiswa = [
    { nis: '2026001', nisn: '0012345001', nama: 'Aditya Pratama', jenis_kelamin: 'L', tanggal_lahir: '2010-03-12', id_kelas: kelas1.id_kelas, id_orang_tua: orangTuaList[0].id_orang_tua },
    { nis: '2026002', nisn: '0012345002', nama: 'Aisyah Pratama', jenis_kelamin: 'P', tanggal_lahir: '2011-05-19', id_kelas: kelas1.id_kelas, id_orang_tua: orangTuaList[0].id_orang_tua }, // Anak ke-2 dari Ahmad Hidayat
    { nis: '2026003', nisn: '0012345003', nama: 'Bagas Saputra', jenis_kelamin: 'L', tanggal_lahir: '2010-08-21', id_kelas: kelas1.id_kelas, id_orang_tua: orangTuaList[1].id_orang_tua },
    { nis: '2026004', nisn: '0012345004', nama: 'Citra Dewi', jenis_kelamin: 'P', tanggal_lahir: '2010-11-04', id_kelas: kelas1.id_kelas, id_orang_tua: orangTuaList[2].id_orang_tua },
    { nis: '2026005', nisn: '0012345005', nama: 'Dimas Nugroho', jenis_kelamin: 'L', tanggal_lahir: '2010-01-30', id_kelas: kelas1.id_kelas, id_orang_tua: orangTuaList[8].id_orang_tua },
    { nis: '2026006', nisn: '0012345006', nama: 'Fira Rahayu', jenis_kelamin: 'P', tanggal_lahir: '2010-04-15', id_kelas: kelas2.id_kelas, id_orang_tua: orangTuaList[3].id_orang_tua },
    { nis: '2026007', nisn: '0012345007', nama: 'Gilang Ramadhan', jenis_kelamin: 'L', tanggal_lahir: '2010-09-10', id_kelas: kelas2.id_kelas, id_orang_tua: orangTuaList[4].id_orang_tua },
    { nis: '2026008', nisn: '0012345008', nama: 'Hana Permata', jenis_kelamin: 'P', tanggal_lahir: '2010-12-22', id_kelas: kelas2.id_kelas, id_orang_tua: orangTuaList[5].id_orang_tua },
    { nis: '2026009', nisn: '0012345009', nama: 'Imam Santoso', jenis_kelamin: 'L', tanggal_lahir: '2010-06-17', id_kelas: kelas2.id_kelas, id_orang_tua: orangTuaList[6].id_orang_tua },
    { nis: '2026010', nisn: '0012345010', nama: 'Jasmine Putri', jenis_kelamin: 'P', tanggal_lahir: '2010-02-28', id_kelas: kelas2.id_kelas, id_orang_tua: orangTuaList[7].id_orang_tua }
  ];
  const siswaList = await Siswa.bulkCreate(dataSiswa);

  // Buat akun login untuk Siswa 1 & Siswa 3
  await User.bulkCreate([
    {
      nama: siswaList[0].nama,
      email: `${siswaList[0].nis}@siswa.sekolah.sch.id`,
      password: defaultPassHash,
      role: 'siswa',
      status_aktif: 1
    },
    {
      nama: siswaList[2].nama,
      email: `${siswaList[2].nis}@siswa.sekolah.sch.id`,
      password: defaultPassHash,
      role: 'siswa',
      status_aktif: 1
    }
  ]);

  // 10. Sample Absensi Harian untuk Kelas 1
  const today = new Date().toISOString().split('T')[0];
  await Absensi.bulkCreate([
    { id_siswa: siswaList[0].id_siswa, id_kelas: kelas1.id_kelas, id_wali_kelas: guru1.id_guru, tanggal: today, status: 'hadir', keterangan: null },
    { id_siswa: siswaList[1].id_siswa, id_kelas: kelas1.id_kelas, id_wali_kelas: guru1.id_guru, tanggal: today, status: 'hadir', keterangan: null },
    { id_siswa: siswaList[2].id_siswa, id_kelas: kelas1.id_kelas, id_wali_kelas: guru1.id_guru, tanggal: today, status: 'tidak_hadir', keterangan: 'sakit' },
    { id_siswa: siswaList[3].id_siswa, id_kelas: kelas1.id_kelas, id_wali_kelas: guru1.id_guru, tanggal: today, status: 'hadir', keterangan: null },
    { id_siswa: siswaList[4].id_siswa, id_kelas: kelas1.id_kelas, id_wali_kelas: guru1.id_guru, tanggal: today, status: 'tidak_hadir', keterangan: 'alpa' }
  ]);

  // 11. Sample Nilai Matematika untuk Siswa 1 & 2
  await Nilai.bulkCreate([
    { id_siswa: siswaList[0].id_siswa, id_komponen_nilai: kompMtk[0].id_komponen_nilai, nilai: 88.0, id_guru: guru1.id_guru },
    { id_siswa: siswaList[0].id_siswa, id_komponen_nilai: kompMtk[1].id_komponen_nilai, nilai: 85.0, id_guru: guru1.id_guru },
    { id_siswa: siswaList[0].id_siswa, id_komponen_nilai: kompMtk[2].id_komponen_nilai, nilai: 90.0, id_guru: guru1.id_guru },
    { id_siswa: siswaList[1].id_siswa, id_komponen_nilai: kompMtk[0].id_komponen_nilai, nilai: 92.0, id_guru: guru1.id_guru }
  ]);

  // 12. Sample Berkas PDF Raport untuk Siswa 1 & Siswa 3
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  const samplePdfContent = Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\nxref\n0 3\n0000000000 65535 f \ntrailer << /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF\n'
  );
  const fileSiswa1 = `rapor_siswa_${siswaList[0].id_siswa}_sem_${semesterAktif.id_semester}_seed.pdf`;
  const fileSiswa3 = `rapor_siswa_${siswaList[2].id_siswa}_sem_${semesterAktif.id_semester}_seed.pdf`;
  fs.writeFileSync(path.join(storageDir, fileSiswa1), samplePdfContent);
  fs.writeFileSync(path.join(storageDir, fileSiswa3), samplePdfContent);

  const rapor1 = await Rapor.create({
    id_siswa: siswaList[0].id_siswa,
    id_semester: semesterAktif.id_semester,
    id_guru: guru1.id_guru,
    file_pdf: fileSiswa1,
    keterangan: 'Raport Semester Ganjil 2026/2027'
  });

  await Rapor.create({
    id_siswa: siswaList[2].id_siswa,
    id_semester: semesterAktif.id_semester,
    id_guru: guru1.id_guru,
    file_pdf: fileSiswa3,
    keterangan: 'Raport Semester Ganjil 2026/2027'
  });

  // 13. Sample Notifikasi Email
  await NotifikasiEmail.create({
    tipe: 'rapor',
    id_siswa: siswaList[0].id_siswa,
    id_rapor: rapor1.id_rapor,
    penerima: orangTuaList[0].email,
    subjek: `[SIMNILAI] Dokumen Raport Tersedia - ${siswaList[0].nama}`,
    status: 'terkirim',
    percobaan: 1,
    dikirim_pada: new Date()
  });

  console.log('🎉 Seeder SIMNILAI v3.0 selesai tanpa galat!');
  console.log('📋 Akun Uji 5 Peran:');
  console.log('   - Admin      : admin@sekolah.sch.id / admin123');
  console.log('   - Wali/Guru 1: budi.guru@sekolah.sch.id / guru123');
  console.log('   - Wali/Guru 2: siti.guru@sekolah.sch.id / guru123');
  console.log('   - Orang Tua 1: ahmad.ortu@email.com / password123');
  console.log('   - Siswa 1    : 2026001@siswa.sekolah.sch.id / password123');

  if (closeConnection) {
    await sequelize.close();
  }
}

if (require.main === module) {
  seedDatabase(true).catch((err) => {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
