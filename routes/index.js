
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const masterController = require('../controllers/masterController');
const attendanceController = require('../controllers/attendanceController');
const gradeController = require('../controllers/gradeController');
const raporController = require('../controllers/raporController');
const portalController = require('../controllers/portalController');
const { uploadRaporPdf } = require('../config/upload');

const {
  isAuthenticated,
  isAdmin,
  requireRole,
  requireWaliKelas,
  requireGuruMapelAssignment,
  requireStudentAccess
} = require('../middleware/auth');

// Autentikasi (/login, /auth/login, /auth/logout, /auth/me)
router.use('/', authRoutes);

// Root redirect
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

// ============================================================================
// Kontrak API Bagian 11.1 — Data Master & Penugasan (FR-03, FR-04, FR-08)
// ============================================================================

// Halaman UI Manajemen Data Master Sekolah
router.get(
  '/admin/master',
  isAuthenticated,
  isAdmin,
  masterController.renderMasterPage
);

// CRUD Guru pada halaman Data Master
router.post(
  '/admin/master/guru/update/:id',
  isAuthenticated,
  isAdmin,
  masterController.updateGuru
);

router.post(
  '/admin/master/guru/delete/:id',
  isAuthenticated,
  isAdmin,
  masterController.deleteGuru
);

// CRUD Orang Tua pada halaman Data Master
router.post(
  '/admin/master/orang-tua',
  isAuthenticated,
  isAdmin,
  masterController.createOrangTua
);

router.post(
  '/admin/master/orang-tua/update/:id',
  isAuthenticated,
  isAdmin,
  masterController.updateOrangTua
);

router.post(
  '/admin/master/orang-tua/delete/:id',
  isAuthenticated,
  isAdmin,
  masterController.deleteOrangTua
);

// CRUD /users (Admin)
router.get('/users', isAuthenticated, isAdmin, masterController.listUsers);
router.post('/users', isAuthenticated, isAdmin, masterController.createUser);
router.put('/users/:id', isAuthenticated, isAdmin, masterController.updateUser);
router.delete('/users/:id', isAuthenticated, isAdmin, masterController.deleteUser);

// CRUD /guru (Admin)
router.get('/guru', isAuthenticated, isAdmin, masterController.listGuru);
router.post('/guru', isAuthenticated, isAdmin, masterController.createGuru);
router.put('/guru/:id', isAuthenticated, isAdmin, masterController.updateGuru);
router.delete('/guru/:id', isAuthenticated, isAdmin, masterController.deleteGuru);

// CRUD /kelas (Admin; Guru boleh lihat daftar kelas)
router.get('/kelas', isAuthenticated, requireRole('admin', 'guru'), masterController.listKelas);
router.post('/kelas', isAuthenticated, isAdmin, masterController.createKelas);
router.put('/kelas/:id', isAuthenticated, isAdmin, masterController.updateKelas);
router.delete('/kelas/:id', isAuthenticated, isAdmin, masterController.deleteKelas);

// CRUD Siswa pada halaman Data Master
router.post(
  '/admin/master/siswa/update/:id',
  isAuthenticated,
  isAdmin,
  masterController.updateSiswa
);

router.post(
  '/admin/master/siswa/delete/:id',
  isAuthenticated,
  isAdmin,
  masterController.deleteSiswa
); 

// CRUD /siswa (Admin)
router.get('/siswa', isAuthenticated, isAdmin, masterController.listSiswa);
router.post('/siswa', isAuthenticated, isAdmin, masterController.createSiswa);
router.put('/siswa/:id', isAuthenticated, isAdmin, masterController.updateSiswa);
router.delete('/siswa/:id', isAuthenticated, isAdmin, masterController.deleteSiswa);

// CRUD /orang-tua (Admin)
router.get('/orang-tua', isAuthenticated, isAdmin, masterController.listOrangTua);
router.post('/orang-tua', isAuthenticated, isAdmin, masterController.createOrangTua);
router.put('/orang-tua/:id', isAuthenticated, isAdmin, masterController.updateOrangTua);
router.delete('/orang-tua/:id', isAuthenticated, isAdmin, masterController.deleteOrangTua);

// CRUD /mata-pelajaran (Admin)
router.get('/mata-pelajaran', isAuthenticated, isAdmin, masterController.listMataPelajaran);
router.post('/mata-pelajaran', isAuthenticated, isAdmin, masterController.createMataPelajaran);
router.put('/mata-pelajaran/:id', isAuthenticated, isAdmin, masterController.updateMataPelajaran);
router.delete('/mata-pelajaran/:id', isAuthenticated, isAdmin, masterController.deleteMataPelajaran);

// CRUD /semester (Admin)
router.get('/semester', isAuthenticated, isAdmin, masterController.listSemester);
router.post('/semester', isAuthenticated, isAdmin, masterController.createSemester);
router.put('/semester/:id', isAuthenticated, isAdmin, masterController.updateSemester);
router.delete('/semester/:id', isAuthenticated, isAdmin, masterController.deleteSemester);

// CRUD /komponen-nilai (Admin, Guru)
router.get(
  '/komponen-nilai',
  isAuthenticated,
  requireRole('admin', 'guru'),
  masterController.listKomponenNilai
);

router.post(
  '/komponen-nilai',
  isAuthenticated,
  requireRole('admin', 'guru'),
  masterController.saveKomponenNilai
);

router.put(
  '/komponen-nilai/:id',
  isAuthenticated,
  requireRole('admin', 'guru'),
  masterController.saveKomponenNilai
);

router.delete(
  '/komponen-nilai/:id',
  isAuthenticated,
  requireRole('admin', 'guru'),
  masterController.deleteKomponenNilai
);

// CRUD /detail-kelas (Admin; Guru boleh lihat penugasan)
router.get(
  '/detail-kelas',
  isAuthenticated,
  requireRole('admin', 'guru'),
  masterController.listDetailKelas
);

router.post(
  '/detail-kelas',
  isAuthenticated,
  isAdmin,
  masterController.createDetailKelas
);

router.put(
  '/detail-kelas/:id',
  isAuthenticated,
  isAdmin,
  masterController.updateDetailKelas
);

router.delete(
  '/detail-kelas/:id',
  isAuthenticated,
  isAdmin,
  masterController.deleteDetailKelas
);

// ============================================================================
// Kontrak API Bagian 11.2 — Absensi, Nilai, Raport, Portal, Dashboard & Laporan
// ============================================================================

// Absensi Harian & Rekap (FR-05, FR-06, AC-01..AC-03)
router.get(
  '/absensi',
  isAuthenticated,
  requireWaliKelas(true),
  attendanceController.getAbsensi
);

router.post(
  '/absensi',
  isAuthenticated,
  requireWaliKelas(false),
  attendanceController.postAbsensi
);

router.get(
  '/absensi/rekap',
  isAuthenticated,
  requireRole('admin', 'guru', 'siswa', 'orang_tua'),
  attendanceController.getRekapAbsensi
);

// Nilai & Rekap (FR-07, FR-09, AC-04, AC-05)
router.get(
  '/nilai',
  isAuthenticated,
  requireGuruMapelAssignment(true),
  gradeController.getNilaiGrid
);

router.post(
  '/nilai',
  isAuthenticated,
  requireGuruMapelAssignment(false),
  gradeController.postNilai
);

router.get(
  '/nilai/rekap',
  isAuthenticated,
  requireRole('admin', 'guru', 'siswa', 'orang_tua'),
  gradeController.getRekapNilai
);

// Dokumen Raport PDF & Monitoring (FR-10..FR-12, AC-06..AC-09)
router.get(
  '/rapor/monitoring',
  isAuthenticated,
  requireWaliKelas(true),
  raporController.monitoringRapor
);

router.post(
  '/rapor',
  isAuthenticated,
  requireWaliKelas(false),
  (req, res, next) => {
    uploadRaporPdf.single('file_pdf')(req, res, (err) => {
      if (err) {
        return res.status(err.status || 400).json({
          sukses: false,
          pesan: err.message
        });
      }
      return next();
    });
  },
  raporController.uploadRapor
);

router.get(
  '/rapor',
  isAuthenticated,
  requireRole('admin', 'guru', 'siswa', 'orang_tua'),
  raporController.listRapor
);

router.get(
  '/rapor/:id/unduh',
  isAuthenticated,
  requireRole('admin', 'guru', 'siswa', 'orang_tua'),
  raporController.downloadRapor
);

router.delete('/rapor/:id', isAuthenticated, isAdmin, raporController.deleteRapor);

// Portal Siswa & Orang Tua (FR-13, AC-08)
router.get(
  '/portal/anak',
  isAuthenticated,
  requireRole('orang_tua'),
  portalController.getDaftarAnak
);

router.get(
  '/portal/siswa/:id',
  isAuthenticated,
  requireRole('siswa', 'orang_tua', 'admin', 'guru'),
  requireStudentAccess,
  portalController.getRingkasanSiswa
);

// Dashboard Ringkas (FR-14)
router.get('/dashboard', isAuthenticated, portalController.getDashboard);

// Laporan & Ekspor Excel (FR-15)
router.get(
  '/laporan/absensi.xlsx',
  isAuthenticated,
  requireRole('admin', 'guru'),
  portalController.exportAbsensiExcel
);

router.get(
  '/laporan/nilai.xlsx',
  isAuthenticated,
  requireRole('admin', 'guru'),
  portalController.exportNilaiExcel
);

// Notifikasi Email — Kirim Ulang (FR-16)
router.get(
  '/notifikasi/:id/kirim-ulang',
  isAuthenticated,
  isAdmin,
  portalController.retryNotification
);

module.exports = router;
