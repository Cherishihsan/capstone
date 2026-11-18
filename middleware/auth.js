const { Guru, Siswa, OrangTua, Kelas, DetailKelas } = require('../models');

/**
 * Helper untuk merespons error otentikasi/otorisasi baik untuk JSON (API) maupun HTML (Web)
 */
function denyAccess(req, res, statusCode, message) {
  if (
    req.path.startsWith('/api/') ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'))
  ) {
    return res.status(statusCode).json({
      sukses: false,
      pesan: message
    });
  }
  if (statusCode === 401) {
    if (req.session) {
      req.session.flash = { error: message };
    }
    return res.redirect('/login');
  }
  return res.status(statusCode).render('errors/403', {
    title: 'Akses Ditolak (403)',
    message
  });
}

/**
 * Menyelesaikan identitas profil (id_guru, id_siswa, id_orang_tua) dari sesi user aktif
 * Tanpa menambah kolom di luar 85 atribut Kamus Data PRD v3.0
 */
async function resolveUserContext(sessionUser) {
  if (!sessionUser) return null;
  const context = { ...sessionUser };

  if (sessionUser.role === 'guru' && !context.id_guru) {
    const guru = await Guru.findOne({ where: { id_users: sessionUser.id_users } });
    if (guru) context.id_guru = guru.id_guru;
  } else if (sessionUser.role === 'orang_tua' && !context.id_orang_tua) {
    const ortu = await OrangTua.findOne({ where: { email: sessionUser.email } });
    if (ortu) context.id_orang_tua = ortu.id_orang_tua;
  } else if (sessionUser.role === 'siswa' && !context.id_siswa) {
    // Pencocokan berdasarkan prefix email <nis>@... atau nama lengkap siswa
    const emailPrefix = (sessionUser.email || '').split('@')[0];
    let siswa = await Siswa.findOne({ where: { nis: emailPrefix } });
    if (!siswa) {
      siswa = await Siswa.findOne({ where: { nama: sessionUser.nama } });
    }
    if (siswa) {
      context.id_siswa = siswa.id_siswa;
      context.id_kelas = siswa.id_kelas;
    }
  }

  return context;
}

module.exports = {
  resolveUserContext,
  denyAccess,

  // FR-01: Pastikan pengguna sudah login dan berstatus aktif
  isAuthenticated: async (req, res, next) => {
    try {
      if (!req.session || !req.session.user || !req.session.user.status_aktif) {
        return denyAccess(req, res, 401, 'Silakan login terlebih dahulu dengan akun yang aktif.');
      }
      req.user = await resolveUserContext(req.session.user);
      req.session.user = req.user;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  // FR-02: Pembatasan akses berbasis peran (admin, guru, siswa, orang_tua)
  requireRole: (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return denyAccess(
          req,
          res,
          403,
          'Akses Ditolak: Peran akun Anda tidak memiliki izin untuk mengakses halaman atau fitur ini.'
        );
      }
      return next();
    };
  },

  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return denyAccess(req, res, 403, 'Akses Ditolak: Fitur ini hanya dapat diakses oleh Admin Sekolah.');
  },

  isGuru: (req, res, next) => {
    if (req.user && req.user.role === 'guru') {
      return next();
    }
    return denyAccess(req, res, 403, 'Akses Ditolak: Fitur ini hanya dapat diakses oleh Guru.');
  },

  // Memastikan guru adalah Wali Kelas dari kelas yang diminta (atau Admin untuk lihat)
  requireWaliKelas: (allowAdminRead = false) => {
    return async (req, res, next) => {
      try {
        if (allowAdminRead && req.user && req.user.role === 'admin' && req.method === 'GET') {
          return next();
        }
        if (!req.user || req.user.role !== 'guru' || !req.user.id_guru) {
          return denyAccess(req, res, 403, 'Akses Ditolak: Hanya Wali Kelas yang berwenang melakukan aksi ini.');
        }

        const idKelas = Number(req.query.kelas || req.body.id_kelas || req.params.id_kelas);
        if (idKelas) {
          const kelas = await Kelas.findByPk(idKelas);
          if (!kelas || Number(kelas.id_wali_kelas) !== Number(req.user.id_guru)) {
            return denyAccess(
              req,
              res,
              403,
              'Akses Ditolak: Anda bukan Wali Kelas yang ditugaskan pada kelas tersebut.'
            );
          }
          req.kelasBinaan = kelas;
        } else {
          const daftarKelas = await Kelas.findAll({ where: { id_wali_kelas: req.user.id_guru } });
          if (!daftarKelas.length) {
            return denyAccess(
              req,
              res,
              403,
              'Akses Ditolak: Anda belum memiliki penugasan sebagai Wali Kelas.'
            );
          }
          req.daftarKelasBinaan = daftarKelas;
        }
        return next();
      } catch (err) {
        return next(err);
      }
    };
  },

  // AC-05: Memastikan Guru Mapel hanya mengakses kelas & mapel yang ditugaskan pada detail_kelas
  requireGuruMapelAssignment: (allowWaliOrAdminRead = false) => {
    return async (req, res, next) => {
      try {
        const idKelas = Number(req.query.kelas || req.body.id_kelas || req.params.id_kelas);
        const idMapel = Number(req.query.mapel || req.body.id_mata_pelajaran || req.params.id_mata_pelajaran);
        const idSemester = Number(req.query.semester || req.body.id_semester || req.params.id_semester);

        if (allowWaliOrAdminRead && req.method === 'GET') {
          if (req.user && req.user.role === 'admin') {
            return next();
          }
          if (req.user && req.user.role === 'guru' && idKelas) {
            const kelas = await Kelas.findByPk(idKelas);
            if (kelas && Number(kelas.id_wali_kelas) === Number(req.user.id_guru)) {
              return next();
            }
          }
        }

        if (!req.user || req.user.role !== 'guru' || !req.user.id_guru) {
          return denyAccess(req, res, 403, 'Akses Ditolak: Hanya Guru Mata Pelajaran pengampu yang berwenang.');
        }

        if (idKelas && idMapel) {
          const whereClause = {
            id_guru: req.user.id_guru,
            id_kelas: idKelas,
            id_mata_pelajaran: idMapel
          };
          if (idSemester) {
            whereClause.id_semester = idSemester;
          }
          const penugasan = await DetailKelas.findOne({ where: whereClause });
          if (!penugasan) {
            return denyAccess(
              req,
              res,
              403,
              'Akses Ditolak (403): Anda tidak ditugaskan mengampu mata pelajaran pada kelas tersebut.'
            );
          }
          req.penugasanMapel = penugasan;
        }
        return next();
      } catch (err) {
        return next(err);
      }
    };
  },

  // AC-08: Siswa hanya melihat data sendiri; Orang Tua hanya melihat anak yang terhubung
  requireStudentAccess: async (req, res, next) => {
    try {
      const targetSiswaId = Number(req.params.id || req.query.siswa || req.body.id_siswa);
      if (!targetSiswaId) {
        return denyAccess(req, res, 400, 'ID Siswa wajib disertakan.');
      }

      const siswa = await Siswa.findByPk(targetSiswaId);
      if (!siswa) {
        return denyAccess(req, res, 404, 'Data siswa tidak ditemukan.');
      }

      if (req.user.role === 'admin') {
        req.targetSiswa = siswa;
        return next();
      }

      if (req.user.role === 'siswa') {
        if (Number(req.user.id_siswa) !== Number(siswa.id_siswa)) {
          return denyAccess(req, res, 403, 'Akses Ditolak: Siswa hanya dapat melihat data miliknya sendiri.');
        }
        req.targetSiswa = siswa;
        return next();
      }

      if (req.user.role === 'orang_tua') {
        if (!req.user.id_orang_tua || Number(siswa.id_orang_tua) !== Number(req.user.id_orang_tua)) {
          return denyAccess(
            req,
            res,
            403,
            'Akses Ditolak: Anda hanya dapat mengakses data anak yang terhubung dengan akun Anda.'
          );
        }
        req.targetSiswa = siswa;
        return next();
      }

      if (req.user.role === 'guru') {
        const kelas = await Kelas.findByPk(siswa.id_kelas);
        const isWali = kelas && Number(kelas.id_wali_kelas) === Number(req.user.id_guru);
        const isPengampu = await DetailKelas.findOne({
          where: { id_guru: req.user.id_guru, id_kelas: siswa.id_kelas }
        });
        if (!isWali && !isPengampu) {
          return denyAccess(req, res, 403, 'Akses Ditolak: Siswa tidak berada di kelas yang Anda ampu.');
        }
        req.targetSiswa = siswa;
        return next();
      }

      return denyAccess(req, res, 403, 'Akses Ditolak.');
    } catch (err) {
      return next(err);
    }
  }
};
