const fs = require('fs');
const path = require('path');
const { sequelize, Rapor, Siswa, Kelas, Semester, Guru, DetailKelas } = require('../models');
const { storageDir, MAX_FILE_SIZE_BYTES } = require('../config/upload');
const EmailService = require('./EmailService');

class RaporService {
  /**
   * Validasi berkas PDF raport (ekstensi .pdf, MIME application/pdf, maks 10 MB) — FR-10 & AC-06
   */
  static validateUploadedPdf(file) {
    if (!file) {
      const err = new Error('Berkas PDF raport wajib dipilih untuk diunggah.');
      err.status = 400;
      throw err;
    }

    const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (ext !== '.pdf' || mime !== 'application/pdf') {
      // Hapus file jika telanjur tersimpan di disk
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const err = new Error(
        `Berkas "${file.originalname}" ditolak: Sistem hanya menerima dokumen berformat PDF (.pdf) dengan tipe MIME application/pdf.`
      );
      err.status = 400;
      throw err;
    }

    if (Number(file.size) > MAX_FILE_SIZE_BYTES) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const err = new Error('Ukuran berkas PDF melebihi batas maksimal 10 MB.');
      err.status = 400;
      throw err;
    }
  }

  /**
   * FR-10, AC-06, AC-07:
   * Mengunggah PDF raport per siswa per semester oleh Wali Kelas.
   * Unggahan ulang pada (id_siswa, id_semester) yang sama menggantikan berkas lama dan memperbarui diunggah_pada.
   */
  static async uploadRapor({
    id_siswa,
    id_semester,
    id_guru,
    file,
    keterangan = null,
    customTransport = null
  }) {
    RaporService.validateUploadedPdf(file);

    const siswa = await Siswa.findByPk(id_siswa, {
      include: [{ model: Kelas, as: 'kelas' }]
    });
    if (!siswa) {
      const err = new Error('Siswa tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    const semester = await Semester.findByPk(id_semester);
    if (!semester) {
      const err = new Error('Data semester tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    // Pastikan pengunggah adalah wali kelas dari siswa tersebut
    if (!siswa.kelas || Number(siswa.kelas.id_wali_kelas) !== Number(id_guru)) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const err = new Error('Akses Ditolak: Hanya Wali Kelas dari kelas siswa tersebut yang dapat mengunggah raport.');
      err.status = 403;
      throw err;
    }

    const storedFilename = file.filename || path.basename(file.path);
    let record;
    let oldFileToDelete = null;

    await sequelize.transaction(async (t) => {
      const existing = await Rapor.findOne({
        where: {
          id_siswa: Number(id_siswa),
          id_semester: Number(id_semester)
        },
        transaction: t
      });

      if (existing) {
        // AC-07: Unggah ulang menggantikan berkas lama dan memperbarui waktu unggah tanpa membuat baris baru
        if (existing.file_pdf && existing.file_pdf !== storedFilename) {
          oldFileToDelete = path.join(storageDir, path.basename(existing.file_pdf));
        }
        record = await existing.update(
          {
            id_guru: Number(id_guru),
            file_pdf: storedFilename,
            diunggah_pada: new Date(),
            keterangan: keterangan || existing.keterangan
          },
          { transaction: t }
        );
      } else {
        record = await Rapor.create(
          {
            id_siswa: Number(id_siswa),
            id_semester: Number(id_semester),
            id_guru: Number(id_guru),
            file_pdf: storedFilename,
            diunggah_pada: new Date(),
            keterangan: keterangan || null
          },
          { transaction: t }
        );
      }
    });

    if (oldFileToDelete && fs.existsSync(oldFileToDelete)) {
      try {
        fs.unlinkSync(oldFileToDelete);
      } catch (_) {
        // Abaikan jika gagal hapus berkas lama
      }
    }

    // Kirim notifikasi email opsional (FR-16) tanpa mengganggu transaksi utama
    await EmailService.queueRaporNotification({
      rapor: record,
      siswa,
      customTransport
    });

    return record;
  }

  /**
   * FR-11 & AC-08:
   * Memeriksa hak akses pengguna terhadap dokumen raport tertentu sebelum diunduh.
   */
  static async authorizeAndGetRapor(id_rapor, userContext) {
    const rapor = await Rapor.findByPk(id_rapor, {
      include: [
        {
          model: Siswa,
          as: 'siswa',
          include: [{ model: Kelas, as: 'kelas' }]
        },
        { model: Semester, as: 'semester' },
        { model: Guru, as: 'guruPengunggah' }
      ]
    });

    if (!rapor || !rapor.siswa) {
      const err = new Error('Dokumen raport tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    const siswa = rapor.siswa;

    if (userContext.role === 'admin') {
      return rapor;
    }

    if (userContext.role === 'siswa') {
      if (Number(userContext.id_siswa) !== Number(siswa.id_siswa)) {
        const err = new Error('Akses Ditolak (403): Siswa hanya berhak mengunduh dokumen raport miliknya sendiri.');
        err.status = 403;
        throw err;
      }
      return rapor;
    }

    if (userContext.role === 'orang_tua') {
      if (!userContext.id_orang_tua || Number(siswa.id_orang_tua) !== Number(userContext.id_orang_tua)) {
        const err = new Error(
          'Akses Ditolak (403): Orang tua hanya berhak mengunduh dokumen raport anak yang terhubung dengan akunnya.'
        );
        err.status = 403;
        throw err;
      }
      return rapor;
    }

    if (userContext.role === 'guru') {
      const isWaliKelas =
        siswa.kelas && Number(siswa.kelas.id_wali_kelas) === Number(userContext.id_guru);
      const isGuruMapel = await DetailKelas.findOne({
        where: {
          id_guru: Number(userContext.id_guru),
          id_kelas: Number(siswa.id_kelas)
        }
      });

      if (!isWaliKelas && !isGuruMapel) {
        const err = new Error('Akses Ditolak (403): Anda tidak memiliki hak akses terhadap dokumen raport siswa ini.');
        err.status = 403;
        throw err;
      }
      return rapor;
    }

    const err = new Error('Akses Ditolak (403).');
    err.status = 403;
    throw err;
  }

  /**
   * FR-12 & AC-09:
   * Monitoring kelengkapan dokumen raport per siswa, kelas, dan semester.
   * Status ini hanya menyatakan sudah/belum ada dokumen PDF, bukan persetujuan.
   */
  static async getMonitoringKelengkapan({ id_kelas, id_semester }) {
    if (!id_kelas || !id_semester) {
      const err = new Error('Parameter id_kelas dan id_semester wajib diisi untuk monitoring raport.');
      err.status = 400;
      throw err;
    }

    const siswaList = await Siswa.findAll({
      where: { id_kelas: Number(id_kelas), status: 'aktif' },
      include: [{ model: Kelas, as: 'kelas' }],
      order: [['nama', 'ASC']]
    });

    const raporList = await Rapor.findAll({
      where: {
        id_semester: Number(id_semester),
        id_siswa: siswaList.map((s) => s.id_siswa)
      },
      include: [{ model: Guru, as: 'guruPengunggah' }]
    });

    const raporBySiswa = new Map();
    for (const r of raporList) {
      raporBySiswa.set(Number(r.id_siswa), r);
    }

    const daftarMonitoring = siswaList.map((s) => {
      const dok = raporBySiswa.get(Number(s.id_siswa));
      return {
        id_siswa: s.id_siswa,
        nis: s.nis,
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelas ? s.kelas.nama : '-',
        sudah_ada_dokumen: Boolean(dok),
        status_kelengkapan: dok ? 'Sudah Diunggah' : 'Belum Ada Dokumen',
        id_rapor: dok ? dok.id_rapor : null,
        file_pdf: dok ? dok.file_pdf : null,
        diunggah_pada: dok ? dok.diunggah_pada : null,
        keterangan: dok ? dok.keterangan : null
      };
    });

    const sudahUnggah = daftarMonitoring.filter((d) => d.sudah_ada_dokumen).length;
    const belumUnggah = daftarMonitoring.length - sudahUnggah;

    return {
      total_siswa: daftarMonitoring.length,
      sudah_unggah: sudahUnggah,
      belum_unggah: belumUnggah,
      persentase_lengkap:
        daftarMonitoring.length > 0
          ? Number(((sudahUnggah / daftarMonitoring.length) * 100).toFixed(2))
          : 0,
      daftarSiswa: daftarMonitoring,
      siswaBelumLengkap: daftarMonitoring.filter((d) => !d.sudah_ada_dokumen)
    };
  }
}

module.exports = RaporService;
