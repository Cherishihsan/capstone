const { MataPelajaran } = require('../models');

exports.index = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findAll();
    res.render('admin/mapel/index', { title: 'Data Mata Pelajaran', mapel });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.create = (req, res) => {
  res.render('admin/mapel/create', { title: 'Tambah Mata Pelajaran' });
};

exports.store = async (req, res) => {
  try {
    await MataPelajaran.create({ nama_mata_pelajaran: req.body.nama_mata_pelajaran || req.body.nama });
    req.session.flash = { type: 'success', message: 'Mata Pelajaran berhasil ditambahkan' };
    res.redirect('/admin/mapel');
  } catch (error) {
    res.redirect('/admin/mapel/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findByPk(req.params.id);
    if (!mapel) return res.status(404).send('Tidak ditemukan');
    res.render('admin/mapel/edit', { title: 'Edit Mata Pelajaran', mapel });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.update = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findByPk(req.params.id);
    if (mapel) {
      await mapel.update({ nama_mata_pelajaran: req.body.nama_mata_pelajaran || req.body.nama });
      req.session.flash = { type: 'success', message: 'Mata Pelajaran berhasil diperbarui' };
    }
    res.redirect('/admin/mapel');
  } catch (error) {
    res.redirect(`/admin/mapel/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findByPk(req.params.id);
    if (mapel) await mapel.destroy();
    req.session.flash = { type: 'success', message: 'Mata Pelajaran berhasil dihapus' };
    res.redirect('/admin/mapel');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
