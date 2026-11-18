const AttendanceService = require('../services/AttendanceService');
const { Kelas, Siswa } = require('../models');

function wantsJson(req) {
  return (
    req.path.startsWith('/api/') ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'))
  );
}

// GET /absensi?kelas=&tanggal= (Wali Kelas, Admin) — FR-05
exports.getAbsensi = async (req, res) => {
  try {
    const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
    let idKelas = Number(req.query.kelas || 0);

    let daftarKelas = [];
    if (req.user.role === 'admin') {
      daftarKelas = await Kelas.findAll({ order: [['nama', 'ASC']] });
    } else if (req.user.role === 'guru') {
      daftarKelas = await Kelas.findAll({
        where: { id_wali_kelas: req.user.id_guru },
        order: [['nama', 'ASC']]
      });
    }

    if (!idKelas && daftarKelas.length > 0) {
      idKelas = daftarKelas[0].id_kelas;
    }

    if (req.user.role === 'guru' && idKelas) {
      const allowed = daftarKelas.some((k) => Number(k.id_kelas) === Number(idKelas));
      if (!allowed) {
        return res.status(403).json({
          sukses: false,
          pesan: 'Akses Ditolak: Anda bukan Wali Kelas dari kelas tersebut.'
        });
      }
    }

    const daftarSiswa = idKelas
      ? await AttendanceService.getClassAttendanceByDate(idKelas, tanggal)
      : [];

    if (wantsJson(req)) {
      return res.json({
        sukses: true,
        data: {
          id_kelas: idKelas,
          tanggal,
          daftarSiswa
        }
      });
    }

    return res.render('guru/absensi/index', {
      title: 'Absensi Harian Kelas — SIMNILAI',
      daftarKelas,
      selectedKelas: idKelas,
      tanggal,
      daftarSiswa
    });
  } catch (err) {
    return res.status(err.status || 500).json({ sukses: false, pesan: err.message });
  }
};

// POST /absensi (Wali Kelas) — FR-05, AC-01, AC-02, AC-03
exports.postAbsensi = async (req, res) => {
  try {
    const id_kelas = Number(req.body.id_kelas);
    const tanggal = req.body.tanggal || new Date().toISOString().split('T')[0];
    const id_wali_kelas = req.user.id_guru;

    let entries = req.body.entries;
    if (!Array.isArray(entries) && req.body.status && typeof req.body.status === 'object') {
      // Transformasi dari form HTML (status[id_siswa], keterangan[id_siswa])
      entries = Object.keys(req.body.status).map((idSiswa) => ({
        id_siswa: Number(idSiswa),
        status: req.body.status[idSiswa],
        keterangan: req.body.keterangan ? req.body.keterangan[idSiswa] : null
      }));
    }

    const result = await AttendanceService.saveDailyAttendance({
      id_kelas,
      id_wali_kelas,
      tanggal,
      entries
    });

    if (wantsJson(req)) {
      return res.status(200).json({
        sukses: true,
        pesan: 'Absensi harian berhasil disimpan.',
        data: result.savedRecords
      });
    }

    req.session.flash = { success: 'Absensi harian berhasil disimpan.' };
    return res.redirect(`/absensi?kelas=${id_kelas}&tanggal=${tanggal}`);
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

// GET /absensi/rekap?kelas=&bulan= (Sesuai peran) — FR-06
exports.getRekapAbsensi = async (req, res) => {
  try {
    let id_kelas = req.query.kelas ? Number(req.query.kelas) : null;
    let id_siswa = req.query.siswa ? Number(req.query.siswa) : null;
    const bulan = req.query.bulan || null;

    if (req.user.role === 'siswa') {
      id_siswa = req.user.id_siswa;
    } else if (req.user.role === 'orang_tua') {
      if (id_siswa) {
        const anak = await Siswa.findByPk(id_siswa);
        if (!anak || Number(anak.id_orang_tua) !== Number(req.user.id_orang_tua)) {
          return res.status(403).json({
            sukses: false,
            pesan: 'Akses Ditolak: Siswa tidak terhubung dengan akun orang tua Anda.'
          });
        }
      } else {
        const anakList = await Siswa.findAll({ where: { id_orang_tua: req.user.id_orang_tua } });
        id_siswa = anakList.length ? anakList[0].id_siswa : -1;
      }
    } else if (req.user.role === 'guru') {
      const kelasWali = await Kelas.findAll({ where: { id_wali_kelas: req.user.id_guru } });
      if (id_kelas) {
        const isWali = kelasWali.some((k) => Number(k.id_kelas) === Number(id_kelas));
        if (!isWali) {
          return res.status(403).json({
            sukses: false,
            pesan: 'Akses Ditolak: Anda hanya dapat melihat rekap absensi kelas binaan Anda.'
          });
        }
      } else if (kelasWali.length > 0) {
        id_kelas = kelasWali[0].id_kelas;
      }
    }

    const recap = await AttendanceService.getAttendanceRecap({
      id_kelas,
      id_siswa,
      bulan,
      tanggal_mulai: req.query.tanggal_mulai,
      tanggal_selesai: req.query.tanggal_selesai
    });

    return res.json({
      sukses: true,
      data: recap
    });
  } catch (err) {
    return res.status(err.status || 500).json({ sukses: false, pesan: err.message });
  }
};
