const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const attendanceController = require('../controllers/attendanceController');
const historyController = require('../controllers/historyController');
const reportController = require('../controllers/reportController');
const profileController = require('../controllers/profileController');
const whatsappController = require('../controllers/whatsappController');

router.get('/dashboard', dashboardController.guruDashboard);

// Absensi
router.get('/absensi', attendanceController.index);
router.get('/absensi/students/:kelasId', attendanceController.getStudents);
router.post('/absensi/draft', attendanceController.saveDraft);
router.post('/absensi/confirm', attendanceController.confirm);

// Riwayat
router.get('/riwayat', historyController.guruHistory);
router.get('/riwayat/:id', historyController.detail);
router.post('/riwayat/resend/:id', whatsappController.resend);

// Laporan
router.get('/laporan', reportController.guruReport);
router.get('/laporan/export/excel', reportController.exportExcel);
router.get('/laporan/export/pdf', reportController.exportPDF);

// Profil
router.get('/profil', profileController.index);
router.post('/profil/password', profileController.updatePassword);

module.exports = router;
