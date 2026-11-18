const { Guru, User } = require('../models');
const bcrypt = require('bcryptjs');

exports.index = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.session.guruId, { include: ['User'] });
    res.render('guru/profil/index', { title: 'Profil Saya', guru });
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;
    const user = await User.findByPk(req.session.userId);
    
    if (!bcrypt.compareSync(password_lama, user.password)) {
      req.session.flash = { type: 'danger', message: 'Password lama salah' };
      return res.redirect('/guru/profil');
    }
    
    user.password = bcrypt.hashSync(password_baru, 10);
    await user.save();
    
    req.session.flash = { type: 'success', message: 'Password berhasil diubah' };
    res.redirect('/guru/profil');
  } catch (error) {
    res.status(500).send('Terjadi kesalahan');
  }
};
