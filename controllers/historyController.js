const { Absensi, Murid, Kelas, MataPelajaran, Guru } = require('../models');

exports.guruHistory = async (req, res) => {
  try {
    const guruId = req.session.guruId;
    const history = await Absensi.findAll({
      where: { guru_id: guruId },
      include: ['Murid', 'Kelas', 'MataPelajaran'],
      order: [['tanggal', 'DESC']],
      limit: 50
    });
    res.render('guru/riwayat/index', { title: 'Riwayat Absensi', history });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.adminHistory = async (req, res) => {
  try {
    const history = await Absensi.findAll({
      include: ['Murid', 'Guru', 'Kelas', 'MataPelajaran'],
      order: [['tanggal', 'DESC']],
      limit: 100
    });
    res.render('admin/riwayat/index', { title: 'Riwayat Absensi Semua', history });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.detail = async (req, res) => {
  try {
    const absensi = await Absensi.findByPk(req.params.id, {
      include: ['Murid', 'Guru', 'Kelas', 'MataPelajaran', 'WhatsappNotification']
    });
    if (!absensi) return res.status(404).send('Tidak ditemukan');
    const role = req.session.userRole;
    res.render(`${role}/riwayat/detail`, { title: 'Detail Riwayat', absensi });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
