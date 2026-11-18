const { Op } = require('sequelize');
const { sequelize, Absensi, Siswa, Kelas, Guru, OrangTua } = require('../models');
const EmailService = require('./EmailService');

const VALID_STATUS = ['hadir', 'tidak_hadir'];
const VALID_KETERANGAN = ['sakit', 'izin', 'alpa'];

class AttendanceService {
  /**
   * FR-05, AC-01, AC-02, AC-03, AC-10:
   * Menyimpan/memperbarui (upsert) absensi harian satu kelas oleh Wali Kelas.
   * Satu baris per siswa per tanggal (UNIQUE id_siswa + tanggal).
   */
  static async saveDailyAttendance({ id_kelas, id_wali_kelas, tanggal, entries, customTransport = null }) {
    if (!id_kelas || !id_wali_kelas || !tanggal || !Array.isArray(entries) || entries.length === 0) {
      const err = new Error('Data kelas, wali kelas, tanggal, dan daftar kehadiran siswa wajib diisi.');
      err.status = 400;
      throw err;
    }

    const kelas = await Kelas.findByPk(id_kelas);
    if (!kelas) {
      const err = new Error('Kelas tidak ditemukan.');
      err.status = 404;
      throw err;
    }
    if (Number(kelas.id_wali_kelas) !== Number(id_wali_kelas)) {
      const err = new Error('Akses Ditolak: Hanya wali kelas yang berwenang mencatat absensi kelas ini.');
      err.status = 403;
      throw err;
    }

    // Validasi seluruh baris terlebih dahulu sebelum membuka transaksi (AC-03)
    for (const item of entries) {
      const status = String(item.status || '').trim();
      const keterangan = item.keterangan ? String(item.keterangan).trim().toLowerCase() : null;

      if (!VALID_STATUS.includes(status)) {
        const err = new Error(`Status kehadiran "${status}" tidak valid. Gunakan 'hadir' atau 'tidak_hadir'.`);
        err.status = 400;
        throw err;
      }

      if (status === 'tidak_hadir') {
        if (!keterangan || !VALID_KETERANGAN.includes(keterangan)) {
          const err = new Error(
            `Keterangan wajib diisi dengan 'sakit', 'izin', atau 'alpa' untuk siswa berstatus Tidak Hadir (ID Siswa: ${item.id_siswa}).`
          );
          err.status = 400;
          throw err;
        }
      }
    }

    const savedRecords = [];
    const tidakHadirList = [];

    // Transaksi database (NFR-06)
    await sequelize.transaction(async (t) => {
      for (const item of entries) {
        const idSiswa = Number(item.id_siswa);
        const status = String(item.status).trim();
        const keterangan = status === 'tidak_hadir' ? String(item.keterangan).trim().toLowerCase() : null;

        const existing = await Absensi.findOne({
          where: { id_siswa: idSiswa, tanggal },
          transaction: t
        });

        let record;
        if (existing) {
          // AC-02: Perbarui baris yang ada, jangan buat baris kedua
          record = await existing.update(
            {
              id_kelas: Number(id_kelas),
              id_wali_kelas: Number(id_wali_kelas),
              status,
              keterangan
            },
            { transaction: t }
          );
        } else {
          // AC-01: Simpan tepat satu baris per siswa per tanggal
          record = await Absensi.create(
            {
              id_siswa: idSiswa,
              id_kelas: Number(id_kelas),
              id_wali_kelas: Number(id_wali_kelas),
              tanggal,
              status,
              keterangan,
              dibuat_pada: new Date()
            },
            { transaction: t }
          );
        }

        savedRecords.push(record);
        if (status === 'tidak_hadir') {
          tidakHadirList.push(record);
        }
      }
    });

    // AC-10: Pengiriman email dijalankan di luar transaksi utama agar kegagalan email
    // tidak pernah membatalkan penyimpanan data absensi.
    const notifikasiHasil = [];
    for (const abs of tidakHadirList) {
      const notif = await EmailService.queueAbsensiNotification({
        absensi: abs,
        customTransport
      });
      if (notif) notifikasiHasil.push(notif);
    }

    return {
      savedRecords,
      notifikasiHasil
    };
  }

  /**
   * Mengambil daftar siswa kelas beserta status absensi pada tanggal tertentu (default: hadir)
   */
  static async getClassAttendanceByDate(id_kelas, tanggal) {
    const siswaList = await Siswa.findAll({
      where: { id_kelas, status: 'aktif' },
      include: [{ model: OrangTua, as: 'orangTua' }],
      order: [['nama', 'ASC']]
    });

    const absensiRecords = await Absensi.findAll({
      where: { id_kelas, tanggal }
    });

    const mapBySiswa = new Map();
    for (const rec of absensiRecords) {
      mapBySiswa.set(Number(rec.id_siswa), rec);
    }

    return siswaList.map((s) => {
      const existing = mapBySiswa.get(Number(s.id_siswa));
      return {
        id_siswa: s.id_siswa,
        nis: s.nis,
        nisn: s.nisn,
        nama: s.nama,
        jenis_kelamin: s.jenis_kelamin,
        orang_tua: s.orangTua ? s.orangTua.nama : '-',
        sudah_dicatat: Boolean(existing),
        status: existing ? existing.status : 'hadir',
        keterangan: existing ? existing.keterangan : null,
        id_absensi: existing ? existing.id_absensi : null
      };
    });
  }

  /**
   * FR-06: Rekap kehadiran per siswa, kelas, bulan, atau rentang tanggal beserta persentase kehadiran
   */
  static async getAttendanceRecap({ id_kelas, id_siswa, bulan, tanggal_mulai, tanggal_selesai }) {
    const whereAbsensi = {};
    if (id_kelas) whereAbsensi.id_kelas = Number(id_kelas);
    if (id_siswa) whereAbsensi.id_siswa = Number(id_siswa);

    if (bulan) {
      // Format YYYY-MM
      const [year, month] = String(bulan).split('-').map(Number);
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        whereAbsensi.tanggal = { [Op.between]: [startDate, endDate] };
      }
    } else if (tanggal_mulai && tanggal_selesai) {
      whereAbsensi.tanggal = { [Op.between]: [tanggal_mulai, tanggal_selesai] };
    }

    const whereSiswa = { status: 'aktif' };
    if (id_kelas) whereSiswa.id_kelas = Number(id_kelas);
    if (id_siswa) whereSiswa.id_siswa = Number(id_siswa);

    const siswaList = await Siswa.findAll({
      where: whereSiswa,
      include: [{ model: Kelas, as: 'kelas' }],
      order: [['nama', 'ASC']]
    });

    const absensiList = await Absensi.findAll({
      where: whereAbsensi,
      order: [['tanggal', 'ASC']]
    });

    const statsBySiswa = new Map();
    for (const s of siswaList) {
      statsBySiswa.set(Number(s.id_siswa), {
        id_siswa: s.id_siswa,
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas ? s.kelas.nama : '-',
        total_hari: 0,
        hadir: 0,
        tidak_hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        persentase_hadir: 100
      });
    }

    for (const rec of absensiList) {
      const st = statsBySiswa.get(Number(rec.id_siswa));
      if (!st) continue;
      st.total_hari += 1;
      if (rec.status === 'hadir') {
        st.hadir += 1;
      } else {
        st.tidak_hadir += 1;
        if (rec.keterangan === 'sakit') st.sakit += 1;
        else if (rec.keterangan === 'izin') st.izin += 1;
        else if (rec.keterangan === 'alpa') st.alpa += 1;
      }
    }

    const rekapSiswa = Array.from(statsBySiswa.values()).map((item) => {
      item.persentase_hadir =
        item.total_hari > 0
          ? Number(((item.hadir / item.total_hari) * 100).toFixed(2))
          : 100;
      return item;
    });

    const ringkasanKelas = rekapSiswa.reduce(
      (acc, cur) => {
        acc.total_siswa += 1;
        acc.total_hadir += cur.hadir;
        acc.total_tidak_hadir += cur.tidak_hadir;
        acc.total_sakit += cur.sakit;
        acc.total_izin += cur.izin;
        acc.total_alpa += cur.alpa;
        acc.total_catatan += cur.total_hari;
        return acc;
      },
      {
        total_siswa: 0,
        total_catatan: 0,
        total_hadir: 0,
        total_tidak_hadir: 0,
        total_sakit: 0,
        total_izin: 0,
        total_alpa: 0
      }
    );

    ringkasanKelas.persentase_kehadiran_kelas =
      ringkasanKelas.total_catatan > 0
        ? Number(((ringkasanKelas.total_hadir / ringkasanKelas.total_catatan) * 100).toFixed(2))
        : 100;

    return {
      rekapSiswa,
      ringkasanKelas
    };
  }
}

module.exports = AttendanceService;
