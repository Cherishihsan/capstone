const { Murid, Kelas, WaliMurid } = require('../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = search ? { nama: { [Op.like]: `%${search}%` } } : {};
    
    const { count, rows } = await Murid.findAndCountAll({
      where,
      include: ['Kelas', 'wali'],
      limit,
      offset,
      order: [['nama', 'ASC']]
    });

    res.render('admin/murid/index', {
      title: 'Data Murid',
      murid: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      search
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan server');
  }
};

exports.create = async (req, res) => {
  try {
    const kelas = await Kelas.findAll();
    const wali = await WaliMurid.findAll();
    res.render('admin/murid/create', { title: 'Tambah Murid', kelas, wali });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.store = async (req, res) => {
  try {
    await Murid.create(req.body);
    req.session.flash = { type: 'success', message: 'Murid berhasil ditambahkan' };
    res.redirect('/admin/murid');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/murid/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const murid = await Murid.findByPk(req.params.id);
    const kelas = await Kelas.findAll();
    const wali = await WaliMurid.findAll();
    if (!murid) return res.status(404).send('Tidak ditemukan');
    res.render('admin/murid/edit', { title: 'Edit Murid', murid, kelas, wali });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.update = async (req, res) => {
  try {
    const murid = await Murid.findByPk(req.params.id);
    if (murid) {
      await murid.update(req.body);
      req.session.flash = { type: 'success', message: 'Murid berhasil diperbarui' };
    }
    res.redirect('/admin/murid');
  } catch (error) {
    res.redirect(`/admin/murid/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const murid = await Murid.findByPk(req.params.id);
    if (murid) await murid.destroy();
    req.session.flash = { type: 'success', message: 'Murid berhasil dihapus' };
    res.redirect('/admin/murid');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
