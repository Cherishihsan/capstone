const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Guru,
  Kelas,
  Siswa,
  OrangTua,
  MataPelajaran,
  Semester,
  KomponenNilai,
  DetailKelas
} = require('../models');
const GradeService = require('../services/GradeService');

function sendResponse(req, res, statusCode, payload, redirectUrl = null) {
  const accept = String(req.headers.accept || '');
  const isBrowserHtml = accept.includes('text/html') && !req.xhr && !req.path.startsWith('/api/');
  if (!isBrowserHtml || !redirectUrl) {
    return res.status(statusCode).json(payload);
  }
  if (req.session) {
    req.session.flash = payload.sukses
      ? { success: payload.pesan }
      : { error: payload.pesan };
  }
  return res.redirect(redirectUrl);
}

// ============================================================================
// GET /admin/master (Halaman UI Stitch: Manajemen Data Master Sekolah)
// ============================================================================
exports.renderMasterPage = async (req, res) => {
  try {
    const tab = req.query.tab || 'guru';
    const [guru, siswa, kelas, mapel, orangTua, semester, detailKelas, users] = await Promise.all([
      Guru.findAll({
        include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
        order: [['id_guru', 'ASC']]
      }),
      Siswa.findAll({
        include: [
          { model: Kelas, as: 'kelas' },
          { model: OrangTua, as: 'orangTua' }
        ],
        order: [['nama', 'ASC']]
      }),
      Kelas.findAll({
        include: [
          {
            model: Guru,
            as: 'waliKelas',
            include: [{ model: User, as: 'user', attributes: ['nama', 'email'] }]
          }
        ],
        order: [['tingkat', 'ASC'], ['nama', 'ASC']]
      }),
      MataPelajaran.findAll({ order: [['kode', 'ASC']] }),
      OrangTua.findAll({
        include: [{ model: Siswa, as: 'anak' }],
        order: [['nama', 'ASC']]
      }),
      Semester.findAll({ order: [['id_semester', 'DESC']] }),
      DetailKelas.findAll({
        include: [
          { model: Guru, as: 'guru', include: [{ model: User, as: 'user', attributes: ['nama', 'email'] }] },
          { model: Kelas, as: 'kelas' },
          { model: MataPelajaran, as: 'mataPelajaran' },
          { model: Semester, as: 'semester' }
        ],
        order: [['id_kelas', 'ASC'], ['id_mata_pelajaran', 'ASC']]
      }),
      User.findAll({
        attributes: { exclude: ['password'] },
        order: [['id_users', 'ASC']]
      })
    ]);

    return res.render('admin/master/index', {
      title: 'Manajemen Data Master Sekolah — SIMNILAI',
      tab,
      master: {
        guru,
        siswa,
        kelas,
        mapel,
        orangTua,
        semester,
        detailKelas,
        users
      }
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// ============================================================================
// CRUD /users (Admin) — FR-03
// ============================================================================
exports.listUsers = async (req, res) => {
  const data = await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['id_users', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createUser = async (req, res) => {
  try {
    const { nama, email, password, role, status_aktif } = req.body;
    const created = await User.create({
      nama,
      email,
      password: bcrypt.hashSync(String(password || '123456'), 10),
      role,
      status_aktif: status_aktif !== undefined ? Number(status_aktif) : 1
    });
    const out = created.toJSON();
    delete out.password;
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Akun pengguna berhasil dibuat.', data: out }, '/admin/master');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(req, res, 404, { sukses: false, pesan: 'Akun tidak ditemukan.' });
    const updates = {
      nama: req.body.nama ?? user.nama,
      email: req.body.email ?? user.email,
      role: req.body.role ?? user.role,
      status_aktif: req.body.status_aktif !== undefined ? Number(req.body.status_aktif) : user.status_aktif
    };
    if (req.body.password) {
      updates.password = bcrypt.hashSync(String(req.body.password), 10);
    }
    await user.update(updates);
    const out = user.toJSON();
    delete out.password;
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Akun berhasil diperbarui.', data: out }, '/admin/master');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(req, res, 404, { sukses: false, pesan: 'Akun tidak ditemukan.' });
    await user.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Akun berhasil dihapus.' }, '/admin/master');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master');
  }
};

// ============================================================================
// CRUD /guru (Admin) — FR-03
// ============================================================================
exports.listGuru = async (req, res) => {
  const data = await Guru.findAll({
    include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    order: [['id_guru', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createGuru = async (req, res) => {
  try {
    const created = await Guru.create({
      id_users: Number(req.body.id_users),
      nuptk: req.body.nuptk || null,
      nip: req.body.nip || null,
      bidang_keahlian: req.body.bidang_keahlian || null,
      status_kepegawaian: req.body.status_kepegawaian || null,
      tanggal_masuk: req.body.tanggal_masuk || null,
      no_hp: req.body.no_hp || null
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Data guru berhasil ditambahkan.', data: created }, '/admin/guru');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/guru');
  }
};

exports.updateGuru = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data guru tidak ditemukan.' });
    await guru.update(req.body);
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data guru berhasil diperbarui.', data: guru }, '/admin/guru');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/guru');
  }
};

exports.deleteGuru = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data guru tidak ditemukan.' });
    await guru.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data guru berhasil dihapus.' }, '/admin/guru');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/guru');
  }
};

// ============================================================================
// CRUD /kelas (Admin) — FR-03 & FR-04 (Wali Kelas)
// ============================================================================
exports.listKelas = async (req, res) => {
  const data = await Kelas.findAll({
    include: [
      {
        model: Guru,
        as: 'waliKelas',
        include: [{ model: User, as: 'user', attributes: ['nama', 'email'] }]
      }
    ],
    order: [['tingkat', 'ASC'], ['nama', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createKelas = async (req, res) => {
  try {
    const created = await Kelas.create({
      nama: req.body.nama,
      tingkat: Number(req.body.tingkat),
      id_wali_kelas: req.body.id_wali_kelas ? Number(req.body.id_wali_kelas) : null
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Kelas berhasil ditambahkan.', data: created }, '/admin/master?tab=kelas');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master?tab=kelas');
  }
};

exports.updateKelas = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return sendResponse(req, res, 404, { sukses: false, pesan: 'Kelas tidak ditemukan.' });
    await kelas.update({
      nama: req.body.nama ?? kelas.nama,
      tingkat: req.body.tingkat !== undefined ? Number(req.body.tingkat) : kelas.tingkat,
      id_wali_kelas:
        req.body.id_wali_kelas !== undefined
          ? req.body.id_wali_kelas
            ? Number(req.body.id_wali_kelas)
            : null
          : kelas.id_wali_kelas
    });
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Kelas berhasil diperbarui.', data: kelas }, '/admin/kelas');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/kelas');
  }
};

exports.deleteKelas = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return sendResponse(req, res, 404, { sukses: false, pesan: 'Kelas tidak ditemukan.' });
    await kelas.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Kelas berhasil dihapus.' }, '/admin/kelas');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/kelas');
  }
};

// ============================================================================
// CRUD /siswa (Admin) — FR-03
// ============================================================================
exports.listSiswa = async (req, res) => {
  const whereClause = {};
  if (req.query.kelas) whereClause.id_kelas = Number(req.query.kelas);
  const data = await Siswa.findAll({
    where: whereClause,
    include: [
      { model: Kelas, as: 'kelas' },
      { model: OrangTua, as: 'orangTua' }
    ],
    order: [['nama', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createSiswa = async (req, res) => {
  try {
    const created = await Siswa.create({
      nis: req.body.nis,
      nisn: req.body.nisn || null,
      nama: req.body.nama,
      jenis_kelamin: req.body.jenis_kelamin,
      tanggal_lahir: req.body.tanggal_lahir,
      id_kelas: Number(req.body.id_kelas),
      id_orang_tua: req.body.id_orang_tua ? Number(req.body.id_orang_tua) : null,
      status: req.body.status || 'aktif'
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Data siswa berhasil ditambahkan.', data: created }, '/admin/siswa');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/siswa');
  }
};

exports.updateSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByPk(req.params.id);
    if (!siswa) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data siswa tidak ditemukan.' });
    await siswa.update(req.body);
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data siswa berhasil diperbarui.', data: siswa }, '/admin/siswa');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/siswa');
  }
};

exports.deleteSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByPk(req.params.id);
    if (!siswa) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data siswa tidak ditemukan.' });
    await siswa.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data siswa berhasil dihapus.' }, '/admin/siswa');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/siswa');
  }
};

// ============================================================================
// CRUD /orang-tua (Admin) — FR-03
// ============================================================================
exports.listOrangTua = async (req, res) => {
  const data = await OrangTua.findAll({
    include: [{ model: Siswa, as: 'anak' }],
    order: [['nama', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createOrangTua = async (req, res) => {
  try {
    const created = await OrangTua.create({
      nama: req.body.nama,
      email: req.body.email || null,
      no_hp: req.body.no_hp || null
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Data orang tua berhasil ditambahkan.', data: created }, '/admin/orang-tua');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/orang-tua');
  }
};

exports.updateOrangTua = async (req, res) => {
  try {
    const ortu = await OrangTua.findByPk(req.params.id);
    if (!ortu) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data orang tua tidak ditemukan.' });
    await ortu.update(req.body);
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data orang tua berhasil diperbarui.', data: ortu }, '/admin/orang-tua');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/orang-tua');
  }
};

exports.deleteOrangTua = async (req, res) => {
  try {
    const ortu = await OrangTua.findByPk(req.params.id);
    if (!ortu) return sendResponse(req, res, 404, { sukses: false, pesan: 'Data orang tua tidak ditemukan.' });
    await ortu.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Data orang tua berhasil dihapus.' }, '/admin/orang-tua');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/orang-tua');
  }
};

// ============================================================================
// CRUD /mata-pelajaran (Admin) — FR-03
// ============================================================================
exports.listMataPelajaran = async (req, res) => {
  const data = await MataPelajaran.findAll({ order: [['kode', 'ASC']] });
  return res.json({ sukses: true, data });
};

exports.createMataPelajaran = async (req, res) => {
  try {
    const created = await MataPelajaran.create({
      kode: req.body.kode,
      nama: req.body.nama,
      kelompok: req.body.kelompok || null
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Mata pelajaran berhasil ditambahkan.', data: created }, '/admin/master?tab=mapel');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master?tab=mapel');
  }
};

exports.updateMataPelajaran = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findByPk(req.params.id);
    if (!mapel) return sendResponse(req, res, 404, { sukses: false, pesan: 'Mata pelajaran tidak ditemukan.' });
    await mapel.update(req.body);
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Mata pelajaran berhasil diperbarui.', data: mapel }, '/admin/mapel');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/mapel');
  }
};

exports.deleteMataPelajaran = async (req, res) => {
  try {
    const mapel = await MataPelajaran.findByPk(req.params.id);
    if (!mapel) return sendResponse(req, res, 404, { sukses: false, pesan: 'Mata pelajaran tidak ditemukan.' });
    await mapel.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Mata pelajaran berhasil dihapus.' }, '/admin/mapel');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/mapel');
  }
};

// ============================================================================
// CRUD /semester (Admin) — FR-03 (Hanya satu baris aktif = 1)
// ============================================================================
exports.listSemester = async (req, res) => {
  const data = await Semester.findAll({ order: [['id_semester', 'DESC']] });
  return res.json({ sukses: true, data });
};

exports.createSemester = async (req, res) => {
  try {
    const isAktif = Number(req.body.aktif) === 1 ? 1 : 0;
    let created;
    await sequelize.transaction(async (t) => {
      if (isAktif === 1) {
        await Semester.update({ aktif: 0 }, { where: {}, transaction: t });
      }
      created = await Semester.create(
        {
          tahun_ajaran: req.body.tahun_ajaran,
          semester: req.body.semester,
          mulai: req.body.mulai || null,
          selesai: req.body.selesai || null,
          aktif: isAktif
        },
        { transaction: t }
      );
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Semester berhasil ditambahkan.', data: created }, '/admin/master?tab=semester');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/master?tab=semester');
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const sem = await Semester.findByPk(req.params.id);
    if (!sem) return sendResponse(req, res, 404, { sukses: false, pesan: 'Semester tidak ditemukan.' });

    const isAktif = req.body.aktif !== undefined ? (Number(req.body.aktif) === 1 ? 1 : 0) : sem.aktif;
    await sequelize.transaction(async (t) => {
      if (isAktif === 1) {
        await Semester.update({ aktif: 0 }, { where: {}, transaction: t });
      }
      await sem.update(
        {
          tahun_ajaran: req.body.tahun_ajaran ?? sem.tahun_ajaran,
          semester: req.body.semester ?? sem.semester,
          mulai: req.body.mulai !== undefined ? req.body.mulai : sem.mulai,
          selesai: req.body.selesai !== undefined ? req.body.selesai : sem.selesai,
          aktif: isAktif
        },
        { transaction: t }
      );
    });
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Semester berhasil diperbarui.', data: sem }, '/admin/semester');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/semester');
  }
};

exports.deleteSemester = async (req, res) => {
  try {
    const sem = await Semester.findByPk(req.params.id);
    if (!sem) return sendResponse(req, res, 404, { sukses: false, pesan: 'Semester tidak ditemukan.' });
    await sem.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Semester berhasil dihapus.' }, '/admin/semester');
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message }, '/admin/semester');
  }
};

// ============================================================================
// CRUD /komponen-nilai (Admin, Guru) — FR-08
// ============================================================================
exports.listKomponenNilai = async (req, res) => {
  const whereClause = {};
  if (req.query.mapel) whereClause.id_mata_pelajaran = Number(req.query.mapel);
  if (req.query.semester) whereClause.id_semester = Number(req.query.semester);

  const data = await KomponenNilai.findAll({
    where: whereClause,
    include: [
      { model: MataPelajaran, as: 'mataPelajaran' },
      { model: Semester, as: 'semester' }
    ],
    order: [['id_mata_pelajaran', 'ASC'], ['id_komponen_nilai', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.saveKomponenNilai = async (req, res) => {
  try {
    if (Array.isArray(req.body.components)) {
      const saved = await GradeService.saveComponents({
        id_mata_pelajaran: req.body.id_mata_pelajaran,
        id_semester: req.body.id_semester,
        components: req.body.components
      });
      return sendResponse(req, res, 200, { sukses: true, pesan: 'Komponen dan bobot nilai berhasil disimpan.', data: saved });
    }
    const created = await KomponenNilai.create({
      id_mata_pelajaran: Number(req.body.id_mata_pelajaran),
      id_semester: Number(req.body.id_semester),
      nama: req.body.nama,
      bobot: Number(req.body.bobot || 0)
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Komponen nilai berhasil dibuat.', data: created });
  } catch (err) {
    return sendResponse(req, res, err.status || 400, { sukses: false, pesan: err.message });
  }
};

exports.deleteKomponenNilai = async (req, res) => {
  try {
    const komp = await KomponenNilai.findByPk(req.params.id);
    if (!komp) return sendResponse(req, res, 404, { sukses: false, pesan: 'Komponen nilai tidak ditemukan.' });
    await komp.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Komponen nilai berhasil dihapus.' });
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message });
  }
};

// ============================================================================
// CRUD /detail-kelas (Admin) — FR-04 (Penugasan Guru Mapel)
// ============================================================================
exports.listDetailKelas = async (req, res) => {
  const whereClause = {};
  if (req.query.kelas) whereClause.id_kelas = Number(req.query.kelas);
  if (req.query.guru) whereClause.id_guru = Number(req.query.guru);
  if (req.query.semester) whereClause.id_semester = Number(req.query.semester);

  const data = await DetailKelas.findAll({
    where: whereClause,
    include: [
      { model: Guru, as: 'guru', include: [{ model: User, as: 'user', attributes: ['nama', 'email'] }] },
      { model: Kelas, as: 'kelas' },
      { model: MataPelajaran, as: 'mataPelajaran' },
      { model: Semester, as: 'semester' }
    ],
    order: [['id_kelas', 'ASC'], ['id_mata_pelajaran', 'ASC']]
  });
  return res.json({ sukses: true, data });
};

exports.createDetailKelas = async (req, res) => {
  try {
    const created = await DetailKelas.create({
      id_guru: Number(req.body.id_guru),
      id_kelas: Number(req.body.id_kelas),
      id_mata_pelajaran: Number(req.body.id_mata_pelajaran),
      id_semester: Number(req.body.id_semester)
    });
    return sendResponse(req, res, 201, { sukses: true, pesan: 'Penugasan guru mata pelajaran berhasil disimpan.', data: created });
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message });
  }
};

exports.updateDetailKelas = async (req, res) => {
  try {
    const dk = await DetailKelas.findByPk(req.params.id);
    if (!dk) return sendResponse(req, res, 404, { sukses: false, pesan: 'Penugasan tidak ditemukan.' });
    await dk.update({
      id_guru: req.body.id_guru !== undefined ? Number(req.body.id_guru) : dk.id_guru,
      id_kelas: req.body.id_kelas !== undefined ? Number(req.body.id_kelas) : dk.id_kelas,
      id_mata_pelajaran: req.body.id_mata_pelajaran !== undefined ? Number(req.body.id_mata_pelajaran) : dk.id_mata_pelajaran,
      id_semester: req.body.id_semester !== undefined ? Number(req.body.id_semester) : dk.id_semester
    });
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Penugasan berhasil diperbarui.', data: dk });
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message });
  }
};

exports.deleteDetailKelas = async (req, res) => {
  try {
    const dk = await DetailKelas.findByPk(req.params.id);
    if (!dk) return sendResponse(req, res, 404, { sukses: false, pesan: 'Penugasan tidak ditemukan.' });
    await dk.destroy();
    return sendResponse(req, res, 200, { sukses: true, pesan: 'Penugasan berhasil dihapus.' });
  } catch (err) {
    return sendResponse(req, res, 400, { sukses: false, pesan: err.message });
  }
};
