const bcrypt = require('bcryptjs');
const { User, Guru, Siswa, OrangTua, Kelas, DetailKelas } = require('../models');
const { resolveUserContext } = require('../middleware/auth');

function wantsJson(req) {
  const accept = String(req.headers.accept || '');
  if (accept.includes('text/html')) {
    return false;
  }
  return (
    req.path.startsWith('/api/') ||
    req.xhr ||
    accept.includes('application/json')
  );
}

exports.showLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.render('auth/login', {
    title: 'Masuk SIMNILAI v3.0 • SMA Negeri 1 Nusantara',
    layout: false
  });
};

// POST /auth/login & POST /login (FR-01 — Mendukung Email, NIP, NUPTK, atau NIS)
exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.email || req.body.identifier || req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!identifier || !password) {
      const msg = 'Identitas akun (Email/NIP/NUPTK) dan kata sandi wajib diisi.';
      if (wantsJson(req)) return res.status(400).json({ sukses: false, pesan: msg });
      req.session.flash = { error: msg };
      return res.redirect('/login');
    }

    let user = await User.findOne({ where: { email: identifier } });

    // Jika input bukan email langsung, cek apakah berupa NIP/NUPTK Guru atau NIS Siswa
    if (!user) {
      const cleanId = identifier.replace(/\s+/g, '');
      const guruByNip =
        (await Guru.findOne({ where: { nip: cleanId } })) ||
        (await Guru.findOne({ where: { nuptk: cleanId } }));
      if (guruByNip) {
        user = await User.findByPk(guruByNip.id_users);
      }
    }

    if (!user) {
      const siswaByNis = await Siswa.findOne({ where: { nis: identifier } });
      if (siswaByNis) {
        user = await User.findOne({ where: { email: `${siswaByNis.nis}@siswa.sekolah.sch.id` } });
      }
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      const msg = 'Email/NIP/NUPTK atau kata sandi yang Anda masukkan salah.';
      if (wantsJson(req)) return res.status(401).json({ sukses: false, pesan: msg });
      req.session.flash = { error: msg };
      return res.redirect('/login');
    }

    if (!user.status_aktif) {
      const msg = 'Akun Anda telah dinonaktifkan. Silakan hubungi Admin Tata Usaha.';
      if (wantsJson(req)) return res.status(403).json({ sukses: false, pesan: msg });
      req.session.flash = { error: msg };
      return res.redirect('/login');
    }

    const sessionPayload = await resolveUserContext({
      id_users: user.id_users,
      nama: user.nama,
      email: user.email,
      role: user.role,
      status_aktif: user.status_aktif
    });

    req.session.user = sessionPayload;

    if (wantsJson(req)) {
      return res.json({
        sukses: true,
        pesan: 'Berhasil masuk.',
        data: sessionPayload
      });
    }

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('[authController.login]', err);
    if (wantsJson(req)) {
      return res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan pada server.' });
    }
    req.session.flash = { error: 'Terjadi kesalahan saat memproses login.' };
    return res.redirect('/login');
  }
};

// POST /auth/logout & GET /logout (FR-01)
exports.logout = (req, res) => {
  const isJson = wantsJson(req);
  if (req.session) {
    req.session.destroy(() => {
      if (isJson) {
        return res.json({ sukses: true, pesan: 'Sesi berhasil diakhiri.' });
      }
      return res.redirect('/login');
    });
  } else {
    if (isJson) return res.json({ sukses: true, pesan: 'Sesi berhasil diakhiri.' });
    return res.redirect('/login');
  }
};

// GET /auth/me (FR-01 & FR-02)
exports.me = async (req, res) => {
  try {
    const context = req.user || (await resolveUserContext(req.session.user));
    let peranFungsional = [context.role];

    if (context.role === 'guru' && context.id_guru) {
      const kelasWali = await Kelas.count({ where: { id_wali_kelas: context.id_guru } });
      const kelasMapel = await DetailKelas.count({ where: { id_guru: context.id_guru } });
      peranFungsional = [];
      if (kelasWali > 0) peranFungsional.push('wali_kelas');
      if (kelasMapel > 0) peranFungsional.push('guru_mapel');
      if (peranFungsional.length === 0) peranFungsional.push('guru');
    }

    return res.json({
      sukses: true,
      data: {
        ...context,
        peran_fungsional: peranFungsional
      }
    });
  } catch (err) {
    return res.status(500).json({ sukses: false, pesan: err.message });
  }
};
