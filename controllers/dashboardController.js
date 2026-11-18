const { Murid, Guru, Kelas, Absensi, WhatsappNotification, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.adminDashboard = async (req, res) => {
  try {
    const totalGuru = await Guru.count();
    const totalMurid = await Murid.count();
    const totalKelas = await Kelas.count();

    const today = new Date().toISOString().split('T')[0];
    
    const kehadiranHariIni = await Absensi.findAll({
      where: { tanggal: today },
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status']
    });

    const summaryKehadiran = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    kehadiranHariIni.forEach(item => {
      summaryKehadiran[item.status] = parseInt(item.get('count'), 10);
    });

    const waStats = await WhatsappNotification.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status']
    });

    const summaryWa = { sent: 0, failed: 0, pending: 0 };
    waStats.forEach(item => {
      summaryWa[item.status] = parseInt(item.get('count'), 10);
    });

    res.render('admin/dashboard', {
      title: 'Dashboard Admin',
      totalGuru,
      totalMurid,
      totalKelas,
      summaryKehadiran,
      summaryWa
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan server');
  }
};

exports.guruDashboard = async (req, res) => {
  try {
    const guruId = req.session.guruId;
    const guru = await Guru.findByPk(guruId, {
      include: [{ model: Kelas, as: 'Kelas' }]
    });

    const myClasses = guru.Kelas;
    const today = new Date().toISOString().split('T')[0];

    const todayAbsensi = await Absensi.findAll({
      where: {
        guru_id: guruId,
        tanggal: today
      },
      include: [
        { model: Murid, as: 'Murid' },
        { model: Kelas, as: 'Kelas' }
      ]
    });

    res.render('guru/dashboard', {
      title: 'Dashboard Guru',
      myClasses,
      todayAbsensi,
      userName: req.session.userName
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan server');
  }
};
