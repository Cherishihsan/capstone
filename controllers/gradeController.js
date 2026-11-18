const GradeService = require('../services/GradeService');
const { Kelas, Semester, DetailKelas, Siswa, MataPelajaran } = require('../models');

function wantsJson(req) {
  return (
    req.path.startsWith('/api/') ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'))
  );
}

// GET /nilai?kelas=&mapel=&semester= (Guru Mapel, Wali Kelas, Admin) — FR-07 & AC-05
exports.getNilaiGrid = async (req, res) => {
  try {
    const semAktif = await Semester.findOne({ where: { aktif: 1 } });
    const id_semester = Number(req.query.semester || (semAktif ? semAktif.id_semester : 1));
    let id_kelas = Number(req.query.kelas || 0);
    let id_mata_pelajaran = Number(req.query.mapel || 0);

    const daftarPenugasan =
      req.user.role === 'guru'
        ? await DetailKelas.findAll({
            where: { id_guru: req.user.id_guru, id_semester },
            include: [
              { model: Kelas, as: 'kelas' },
              { model: MataPelajaran, as: 'mataPelajaran' }
            ]
          })
        : await DetailKelas.findAll({
            where: { id_semester },
            include: [
              { model: Kelas, as: 'kelas' },
              { model: MataPelajaran, as: 'mataPelajaran' }
            ]
          });

    // Jika dibuka dari browser tanpa parameter query, pilihkan penugasan pertama secara otomatis
    if (!wantsJson(req) && (!id_kelas || !id_mata_pelajaran) && daftarPenugasan.length > 0) {
      id_kelas = daftarPenugasan[0].id_kelas;
      id_mata_pelajaran = daftarPenugasan[0].id_mata_pelajaran;
    }

    if (req.user.role === 'guru' && id_kelas && id_mata_pelajaran) {
      const kelas = await Kelas.findByPk(id_kelas);
      const isWaliKelas = kelas && Number(kelas.id_wali_kelas) === Number(req.user.id_guru);

      if (!isWaliKelas) {
        // AC-05: Jika bukan wali kelas tersebut, guru wajib memiliki penugasan di detail_kelas
        await GradeService.verifyTeacherAssignment({
          id_guru: req.user.id_guru,
          id_kelas,
          id_mata_pelajaran,
          id_semester
        });
      }
    }

    if (!id_kelas || !id_mata_pelajaran) {
      if (wantsJson(req)) {
        return res.json({
          sukses: true,
          data: {
            id_semester,
            daftarPenugasan,
            komponenList: [],
            rows: []
          }
        });
      }
      return res.render('guru/nilai/index', {
        title: 'Buku & Grid Input Nilai — SIMNILAI',
        id_kelas: 0,
        id_mata_pelajaran: 0,
        id_semester,
        daftarPenugasan,
        komponenList: [],
        totalBobot: 0,
        rows: []
      });
    }

    const grid = await GradeService.getClassGradeGrid({
      id_kelas,
      id_mata_pelajaran,
      id_semester
    });

    if (wantsJson(req)) {
      return res.json({
        sukses: true,
        data: {
          id_kelas,
          id_mata_pelajaran,
          id_semester,
          ...grid
        }
      });
    }

    return res.render('guru/nilai/index', {
      title: 'Buku & Grid Input Nilai — SIMNILAI',
      id_kelas,
      id_mata_pelajaran,
      id_semester,
      daftarPenugasan,
      ...grid
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      sukses: false,
      pesan: err.message
    });
  }
};

// POST /nilai (Guru Mapel) — FR-07, AC-04, AC-05
exports.postNilai = async (req, res) => {
  try {
    const id_guru = req.user.id_guru;
    const id_kelas = Number(req.body.id_kelas);
    const id_mata_pelajaran = Number(req.body.id_mata_pelajaran);
    const id_semester = Number(req.body.id_semester);
    const entries = req.body.entries;

    const saved = await GradeService.saveGrades({
      id_guru,
      id_kelas,
      id_mata_pelajaran,
      id_semester,
      entries
    });

    if (wantsJson(req)) {
      return res.status(200).json({
        sukses: true,
        pesan: 'Data nilai siswa berhasil disimpan.',
        data: saved
      });
    }

    req.session.flash = { success: 'Data nilai siswa berhasil disimpan.' };
    return res.redirect(`/nilai?kelas=${id_kelas}&mapel=${id_mata_pelajaran}&semester=${id_semester}`);
  } catch (err) {
    if (wantsJson(req)) {
      return res.status(err.status || 400).json({
        sukses: false,
        pesan: err.message
      });
    }
    req.session.flash = { error: err.message };
    return res.redirect('back');
  }
};

// GET /nilai/rekap?siswa=&semester= (Sesuai peran) — FR-09
exports.getRekapNilai = async (req, res) => {
  try {
    const semAktif = await Semester.findOne({ where: { aktif: 1 } });
    const id_semester = Number(req.query.semester || (semAktif ? semAktif.id_semester : 1));
    let id_siswa = Number(req.query.siswa || 0);

    if (req.user.role === 'siswa') {
      if (id_siswa && Number(id_siswa) !== Number(req.user.id_siswa)) {
        return res.status(403).json({
          sukses: false,
          pesan: 'Akses Ditolak: Siswa hanya dapat melihat rekap nilainya sendiri.'
        });
      }
      id_siswa = req.user.id_siswa;
    } else if (req.user.role === 'orang_tua') {
      const anak = await Siswa.findByPk(id_siswa);
      if (!anak || Number(anak.id_orang_tua) !== Number(req.user.id_orang_tua)) {
        return res.status(403).json({
          sukses: false,
          pesan: 'Akses Ditolak: Anda hanya dapat melihat rekap nilai anak yang terhubung.'
        });
      }
    }

    if (!id_siswa && req.query.kelas && req.query.mapel) {
      const grid = await GradeService.getClassGradeGrid({
        id_kelas: Number(req.query.kelas),
        id_mata_pelajaran: Number(req.query.mapel),
        id_semester
      });
      return res.json({ sukses: true, data: grid });
    }

    const recap = await GradeService.getStudentGradeRecap({
      id_siswa,
      id_semester
    });

    return res.json({
      sukses: true,
      data: recap
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      sukses: false,
      pesan: err.message
    });
  }
};
