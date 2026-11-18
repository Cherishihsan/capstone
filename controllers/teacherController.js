const { Guru, User, Kelas, MataPelajaran, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = search ? { nama: { [Op.like]: `%${search}%` } } : {};
    
    const { count, rows } = await Guru.findAndCountAll({
      where,
      include: ['User'],
      limit,
      offset
    });

    res.render('admin/guru/index', {
      title: 'Data Guru',
      guru: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      search
    });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.create = async (req, res) => {
  try {
    const kelas = await Kelas.findAll();
    const mapel = await MataPelajaran.findAll();
    res.render('admin/guru/create', { title: 'Tambah Guru', kelas, mapel });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.store = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, password, email, nip, nama, nomor_hp, kelasIds, mapelIds } = req.body;
    
    const user = await User.create({
      username,
      password: bcrypt.hashSync(password, 10),
      role: 'guru',
      nama,
      email
    }, { transaction: t });

    const guru = await Guru.create({
      user_id: user.id,
      nip,
      nama,
      nomor_hp
    }, { transaction: t });

    if (kelasIds && kelasIds.length) await guru.setKelas(kelasIds, { transaction: t });
    if (mapelIds && mapelIds.length) await guru.setMataPelajaran(mapelIds, { transaction: t });

    await t.commit();
    req.session.flash = { type: 'success', message: 'Guru berhasil ditambahkan' };
    res.redirect('/admin/guru');
  } catch (error) {
    await t.rollback();
    res.redirect('/admin/guru/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id, {
      include: ['User', 'Kelas', 'MataPelajaran']
    });
    const kelas = await Kelas.findAll();
    const mapel = await MataPelajaran.findAll();
    res.render('admin/guru/edit', { title: 'Edit Guru', guru, kelas, mapel });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const guru = await Guru.findByPk(req.params.id, { include: ['User'] });
    const { username, password, email, nip, nama, nomor_hp, kelasIds, mapelIds } = req.body;
    
    if (guru) {
      await guru.update({ nip, nama, nomor_hp }, { transaction: t });
      
      const userUpdate = { username, nama, email };
      if (password) userUpdate.password = bcrypt.hashSync(password, 10);
      await guru.User.update(userUpdate, { transaction: t });

      await guru.setKelas(kelasIds || [], { transaction: t });
      await guru.setMataPelajaran(mapelIds || [], { transaction: t });
      
      await t.commit();
      req.session.flash = { type: 'success', message: 'Guru berhasil diperbarui' };
    }
    res.redirect('/admin/guru');
  } catch (error) {
    await t.rollback();
    res.redirect(`/admin/guru/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (guru) {
      const user = await User.findByPk(guru.user_id);
      await guru.destroy();
      if (user) await user.destroy();
    }
    req.session.flash = { type: 'success', message: 'Guru berhasil dihapus' };
    res.redirect('/admin/guru');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
