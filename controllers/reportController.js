const ReportService = require('../services/ReportService');
const { Kelas, MataPelajaran, Guru } = require('../models');

exports.guruReport = async (req, res) => {
  try {
    const guruId = req.session.guruId;
    const filters = { guruId, ...req.query };
    const data = await ReportService.getAttendanceStats(filters);
    
    const kelas = await Kelas.findAll();
    const mapel = await MataPelajaran.findAll();
    
    res.render('guru/laporan', { title: 'Laporan Absensi', data, kelas, mapel, filters });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.adminReport = async (req, res) => {
  try {
    const filters = req.query;
    const data = await ReportService.getAttendanceStats(filters);
    
    const kelas = await Kelas.findAll();
    const mapel = await MataPelajaran.findAll();
    const guru = await Guru.findAll();
    
    res.render('admin/laporan', { title: 'Laporan Absensi', data, kelas, mapel, guru, filters });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const filters = req.query;
    if (req.session.userRole === 'guru') filters.guruId = req.session.guruId;
    
    const data = await ReportService.getAttendanceStats(filters);
    const workbook = await ReportService.generateExcel(data, filters);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'laporan-absensi.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).send('Gagal export excel');
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const filters = req.query;
    if (req.session.userRole === 'guru') filters.guruId = req.session.guruId;
    
    const data = await ReportService.getAttendanceStats(filters);
    const pdfBuffer = await ReportService.generatePDF(data, filters);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'laporan-absensi.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send('Gagal export PDF');
  }
};
