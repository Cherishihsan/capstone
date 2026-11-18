const { NotifikasiEmail, Siswa, OrangTua, Kelas, Semester } = require('../models');
const { isEmailEnabled, createTransporter, defaultFrom } = require('../config/email');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EmailService {
  /**
   * Mengirim satu baris notifikasi_email dan mencatat status antre/terkirim/gagal.
   * Sesuai Aturan Bisnis 10 & AC-10: Kegagalan email TIDAK PERNAH melempar error ke transaksi utama.
   */
  static async processNotification(idNotifikasi, customTransport = null) {
    const notif = await NotifikasiEmail.findByPk(idNotifikasi, {
      include: [{ model: Siswa, as: 'siswa' }]
    });
    if (!notif) return null;

    const percobaanBaru = Number(notif.percobaan || 0) + 1;

    // Validasi alamat email penerima (AC-10)
    if (!notif.penerima || !EMAIL_REGEX.test(String(notif.penerima).trim())) {
      await notif.update({
        status: 'gagal',
        percobaan: percobaanBaru,
        pesan_error: `Alamat email tujuan tidak valid: "${notif.penerima || ''}"`
      });
      return notif;
    }

    if (!isEmailEnabled() && !customTransport) {
      // Tetap berstatus 'antre' jika pengiriman email dimatikan pada environment
      return notif;
    }

    try {
      const transporter = customTransport || createTransporter();
      const namaSiswa = notif.siswa ? notif.siswa.nama : `Siswa #${notif.id_siswa}`;
      const isiPesan =
        notif.tipe === 'absensi'
          ? `Yth. Orang Tua/Wali,\n\nKami menginformasikan bahwa siswa atas nama ${namaSiswa} tercatat TIDAK HADIR pada hari ini. Silakan periksa detail kehadiran melalui Portal Orang Tua SIMNILAI.\n\nHormat kami,\nSekolah`
          : `Yth. Orang Tua/Wali,\n\nDokumen raport PDF terbaru untuk siswa atas nama ${namaSiswa} telah diunggah ke sistem SIMNILAI dan siap diunduh melalui Portal Orang Tua.\n\nHormat kami,\nSekolah`;

      await transporter.sendMail({
        from: defaultFrom,
        to: notif.penerima,
        subject: notif.subjek,
        text: isiPesan
      });

      await notif.update({
        status: 'terkirim',
        percobaan: percobaanBaru,
        pesan_error: null,
        dikirim_pada: new Date()
      });
    } catch (err) {
      await notif.update({
        status: 'gagal',
        percobaan: percobaanBaru,
        pesan_error: err.message || 'Gagal menghubungi server SMTP.'
      });
    }

    return notif;
  }

  /**
   * Membuat antrean notifikasi absensi Tidak Hadir (FR-16 & AC-10)
   */
  static async queueAbsensiNotification({ absensi, siswa, customTransport = null }) {
    try {
      const dataSiswa =
        siswa ||
        (await Siswa.findByPk(absensi.id_siswa, {
          include: [{ model: OrangTua, as: 'orangTua' }]
        }));
      if (!dataSiswa) return null;

      const ortu =
        dataSiswa.orangTua ||
        (dataSiswa.id_orang_tua ? await OrangTua.findByPk(dataSiswa.id_orang_tua) : null);

      const emailPenerima = ortu && ortu.email ? ortu.email : '';
      const ketLabel = (absensi.keterangan || 'tidak hadir').toUpperCase();
      const subjek = `[SIMNILAI] Pemberitahuan Ketidakhadiran (${ketLabel}) - ${dataSiswa.nama} (${absensi.tanggal})`;

      const notif = await NotifikasiEmail.create({
        tipe: 'absensi',
        id_siswa: dataSiswa.id_siswa,
        id_absensi: absensi.id_absensi,
        id_rapor: null,
        penerima: emailPenerima,
        subjek,
        status: 'antre',
        percobaan: 0,
        dibuat_pada: new Date()
      });

      return await EmailService.processNotification(notif.id_notifikasi_email, customTransport);
    } catch (err) {
      // Jangan pernah membatalkan transaksi absensi utama (AC-10)
      console.error('[EmailService] Gagal mencatat notifikasi absensi:', err.message);
      return null;
    }
  }

  /**
   * Membuat antrean notifikasi saat dokumen raport baru diunggah (FR-16)
   */
  static async queueRaporNotification({ rapor, siswa, customTransport = null }) {
    try {
      const dataSiswa =
        siswa ||
        (await Siswa.findByPk(rapor.id_siswa, {
          include: [{ model: OrangTua, as: 'orangTua' }]
        }));
      if (!dataSiswa) return null;

      const ortu =
        dataSiswa.orangTua ||
        (dataSiswa.id_orang_tua ? await OrangTua.findByPk(dataSiswa.id_orang_tua) : null);
      const sem = await Semester.findByPk(rapor.id_semester);

      const emailPenerima = ortu && ortu.email ? ortu.email : '';
      const labelSemester = sem ? `${sem.semester} ${sem.tahun_ajaran}` : `Semester #${rapor.id_semester}`;
      const subjek = `[SIMNILAI] Dokumen Raport Tersedia (${labelSemester}) - ${dataSiswa.nama}`;

      const notif = await NotifikasiEmail.create({
        tipe: 'rapor',
        id_siswa: dataSiswa.id_siswa,
        id_absensi: null,
        id_rapor: rapor.id_rapor,
        penerima: emailPenerima,
        subjek,
        status: 'antre',
        percobaan: 0,
        dibuat_pada: new Date()
      });

      return await EmailService.processNotification(notif.id_notifikasi_email, customTransport);
    } catch (err) {
      console.error('[EmailService] Gagal mencatat notifikasi rapor:', err.message);
      return null;
    }
  }
}

module.exports = EmailService;
