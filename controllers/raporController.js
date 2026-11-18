const path = require('path');
const fs = require('fs');
const RaporService = require('../services/RaporService');
const { Rapor, Siswa, Kelas, Semester, Guru } = require('../models');
const { storageDir } = require('../config/upload');

// POST /rapor (Wali Kelas) — FR-10, AC-06, AC-07
exports.uploadRapor = async (req, res) => {
  try {
    const id_siswa = Number(req.body.id_siswa);
    const id_semester = Number(req.body.id_semester);
    const keterangan = req.body.keterangan || null;
    const id_guru = req.user.id_guru;

    const record = await RaporService.uploadRapor({
      id_siswa,
      id_semester,
      id_guru,
      file: req.file,
      keterangan
    });

    return res.status(200).json({
      sukses: true,
      pesan: 'Dokumen raport PDF berhasil diunggah.',
      data: record
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      sukses: false,
      pesan: err.message
    });
  }
};

// GET /rapor?siswa=&semester= (Sesuai peran) — FR-11
exports.listRapor = async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.semester) whereClause.id_semester = Number(req.query.semester);

    if (req.user.role === 'siswa') {
      whereClause.id_siswa = Number(req.user.id_siswa);
    } else if (req.user.role === 'orang_tua') {
      const anakList = await Siswa.findAll({ where: { id_orang_tua: req.user.id_orang_tua } });
      const allowedIds = anakList.map((a) => Number(a.id_siswa));
      if (req.query.siswa) {
        if (!allowedIds.includes(Number(req.query.siswa))) {
          return res.status(403).json({
            sukses: false,
            pesan: 'Akses Ditolak: Anda hanya dapat melihat raport anak yang terhubung.'
          });
        }
        whereClause.id_siswa = Number(req.query.siswa);
      } else {
        whereClause.id_siswa = allowedIds;
      }
    } else if (req.query.siswa) {
      whereClause.id_siswa = Number(req.query.siswa);
    }

    const data = await Rapor.findAll({
      where: whereClause,
      include: [
        { model: Siswa, as: 'siswa', include: [{ model: Kelas, as: 'kelas' }] },
        { model: Semester, as: 'semester' },
        { model: Guru, as: 'guruPengunggah' }
      ],
      order: [['diunggah_pada', 'DESC']]
    });

    return res.json({ sukses: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ sukses: false, pesan: err.message });
  }
};

// GET /rapor/:id/unduh (Sesuai peran) — FR-11 & AC-08
exports.downloadRapor = async (req, res) => {
  try {
    const rapor = await RaporService.authorizeAndGetRapor(req.params.id, req.user);
    const filePath = path.join(storageDir, path.basename(rapor.file_pdf));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Berkas PDF raport tidak ditemukan pada penyimpanan server.'
      });
    }

    const downloadName = `Raport_${rapor.siswa.nis}_${rapor.siswa.nama.replace(/\s+/g, '_')}.pdf`;
    return res.download(filePath, downloadName);
  } catch (err) {
    return res.status(err.status || 403).json({
      sukses: false,
      pesan: err.message
    });
  }
};

// DELETE /rapor/:id (Admin)
exports.deleteRapor = async (req, res) => {
  try {
    const rapor = await Rapor.findByPk(req.params.id);
    if (!rapor) {
      return res.status(404).json({ sukses: false, pesan: 'Dokumen raport tidak ditemukan.' });
    }
    const filePath = path.join(storageDir, path.basename(rapor.file_pdf));
    await rapor.destroy();
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
    return res.json({ sukses: true, pesan: 'Dokumen raport berhasil dihapus.' });
  } catch (err) {
    return res.status(400).json({ sukses: false, pesan: err.message });
  }
};

// GET /rapor/monitoring?kelas=&semester= (Admin, Wali Kelas) — FR-12 & AC-09
exports.monitoringRapor = async (req, res) => {
  try {
    const semAktif = await Semester.findOne({ where: { aktif: 1 } });
    const id_semester = Number(req.query.semester || (semAktif ? semAktif.id_semester : 1));
    let id_kelas = Number(req.query.kelas || 0);

    if (req.user.role === 'guru') {
      const kelasBinaan = await Kelas.findAll({ where: { id_wali_kelas: req.user.id_guru } });
      if (!id_kelas && kelasBinaan.length > 0) {
        id_kelas = kelasBinaan[0].id_kelas;
      }
      const isWali = kelasBinaan.some((k) => Number(k.id_kelas) === Number(id_kelas));
      if (!isWali) {
        return res.status(403).json({
          sukses: false,
          pesan: 'Akses Ditolak: Anda hanya dapat memantau kelengkapan raport kelas binaan Anda.'
        });
      }
    }

    const result = await RaporService.getMonitoringKelengkapan({
      id_kelas,
      id_semester
    });

    return res.json({
      sukses: true,
      data: result
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      sukses: false,
      pesan: err.message
    });
  }
};
