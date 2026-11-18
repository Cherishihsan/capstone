const { Kelas } = require('../models');

exports.index = async (req, res) => {
  try {
    const kelas = await Kelas.findAll();
    res.render('admin/kelas/index', { title: 'Data Kelas', kelas });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan server');
  }
};

exports.create = (req, res) => {
  res.render('admin/kelas/create', { title: 'Tambah Kelas' });
};

exports.store = async (req, res) => {
  try {
    await Kelas.create({ nama_kelas: req.body.nama_kelas || req.body.nama });
    req.session.flash = { type: 'success', message: 'Kelas berhasil ditambahkan' };
    res.redirect('/admin/kelas');
  } catch (error) {
    res.redirect('/admin/kelas/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return res.status(404).send('Tidak ditemukan');
    res.render('admin/kelas/edit', { title: 'Edit Kelas', kelas });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.update = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (kelas) {
      await kelas.update({ nama_kelas: req.body.nama_kelas || req.body.nama });
      req.session.flash = { type: 'success', message: 'Kelas berhasil diperbarui' };
    }
    res.redirect('/admin/kelas');
  } catch (error) {
    res.redirect(`/admin/kelas/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (kelas) await kelas.destroy();
    req.session.flash = { type: 'success', message: 'Kelas berhasil dihapus' };
    res.redirect('/admin/kelas');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
