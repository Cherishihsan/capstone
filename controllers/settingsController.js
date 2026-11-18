const config = require('../config/whatsapp');

exports.index = (req, res) => {
  res.render('admin/settings/index', { title: 'Pengaturan Sistem', config });
};

exports.updateWhatsApp = (req, res) => {
  req.session.flash = { type: 'info', message: 'Fitur update konfigurasi di file statis belum didukung secara penuh (hanya demo)' };
  res.redirect('/admin/settings');
};

exports.updateSchool = (req, res) => {
  req.session.flash = { type: 'info', message: 'Fitur update profil sekolah belum didukung secara penuh (hanya demo)' };
  res.redirect('/admin/settings');
};
