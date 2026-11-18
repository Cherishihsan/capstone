const { WaliMurid } = require('../models');

exports.index = async (req, res) => {
  try {
    const wali = await WaliMurid.findAll();
    res.render('admin/wali/index', { title: 'Data Wali Murid', wali });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.create = (req, res) => {
  res.render('admin/wali/create', { title: 'Tambah Wali Murid' });
};

exports.store = async (req, res) => {
  try {
    await WaliMurid.create(req.body);
    req.session.flash = { type: 'success', message: 'Wali Murid berhasil ditambahkan' };
    res.redirect('/admin/wali');
  } catch (error) {
    res.redirect('/admin/wali/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const wali = await WaliMurid.findByPk(req.params.id);
    if (!wali) return res.status(404).send('Tidak ditemukan');
    res.render('admin/wali/edit', { title: 'Edit Wali Murid', wali });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.update = async (req, res) => {
  try {
    const wali = await WaliMurid.findByPk(req.params.id);
    if (wali) {
      await wali.update(req.body);
      req.session.flash = { type: 'success', message: 'Wali Murid berhasil diperbarui' };
    }
    res.redirect('/admin/wali');
  } catch (error) {
    res.redirect(`/admin/wali/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const wali = await WaliMurid.findByPk(req.params.id);
    if (wali) await wali.destroy();
    req.session.flash = { type: 'success', message: 'Wali Murid berhasil dihapus' };
    res.redirect('/admin/wali');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
