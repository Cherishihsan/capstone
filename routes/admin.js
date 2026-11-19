const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const masterController = require('../controllers/masterController');
const teacherController = require('../controllers/teacherController');
const studentController = require('../controllers/studentController');
const classController = require('../controllers/classController');
const parentController = require('../controllers/parentController');
const subjectController = require('../controllers/subjectController');
const attendanceController = require('../controllers/attendanceController');
const reportController = require('../controllers/reportController');
const whatsappController = require('../controllers/whatsappController');
const settingsController = require('../controllers/settingsController');

router.get('/dashboard', dashboardController.adminDashboard);

// Master Page & Guru Edit/Delete
router.get('/master', masterController.renderMasterPage);
router.post('/master/guru/update/:id', masterController.updateGuru);
router.post('/master/guru/delete/:id', masterController.deleteGuru);

// Guru CRUD
router.get('/guru', teacherController.index);
router.get('/guru/create', teacherController.create);
router.post('/guru', teacherController.store);
router.get('/guru/:id/edit', teacherController.edit);
router.post('/guru/:id/update', teacherController.update);
router.post('/guru/:id/delete', teacherController.destroy);

// Murid CRUD
router.get('/murid', studentController.index);
router.get('/murid/create', studentController.create);
router.post('/murid', studentController.store);
router.get('/murid/:id/edit', studentController.edit);
router.post('/murid/:id/update', studentController.update);
router.post('/murid/:id/delete', studentController.destroy);

// Kelas CRUD
router.get('/kelas', classController.index);
router.get('/kelas/create', classController.create);
router.post('/kelas', classController.store);
router.get('/kelas/:id/edit', classController.edit);
router.post('/kelas/:id/update', classController.update);
router.post('/kelas/:id/delete', classController.destroy);

// Wali CRUD
router.get('/wali', parentController.index);
router.get('/wali/create', parentController.create);
router.post('/wali', parentController.store);
router.get('/wali/:id/edit', parentController.edit);
router.post('/wali/:id/update', parentController.update);
router.post('/wali/:id/delete', parentController.destroy);

// Mata Pelajaran CRUD
router.get('/mapel', subjectController.index);
router.get('/mapel/create', subjectController.create);
router.post('/mapel', subjectController.store);
router.get('/mapel/:id/edit', subjectController.edit);
router.post('/mapel/:id/update', subjectController.update);
router.post('/mapel/:id/delete', subjectController.destroy);

// Absensi
router.get('/absensi', attendanceController.adminIndex);
router.get('/absensi/:id', attendanceController.detail);

// Laporan
router.get('/laporan', reportController.adminReport);
router.get('/laporan/export/excel', reportController.exportExcel);
router.get('/laporan/export/pdf', reportController.exportPDF);

// WhatsApp
router.get('/whatsapp', whatsappController.index);
router.post('/whatsapp/resend/:id', whatsappController.resend);
router.post('/whatsapp/bulk-resend', whatsappController.bulkResend);
router.post('/whatsapp/test', whatsappController.testConnection);

// Settings
router.get('/settings', settingsController.index);
router.post('/settings/whatsapp', settingsController.updateWhatsApp);
router.post('/settings/school', settingsController.updateSchool);

module.exports = router;