const ExcelJS = require('exceljs');
const AttendanceService = require('./AttendanceService');
const GradeService = require('./GradeService');

class ReportService {
  /**
   * FR-15: Mengekspor rekap absensi ke format Excel (.xlsx)
   */
  static async exportAttendanceExcel({ id_kelas, bulan, tanggal_mulai, tanggal_selesai }) {
    const { rekapSiswa, ringkasanKelas } = await AttendanceService.getAttendanceRecap({
      id_kelas,
      bulan,
      tanggal_mulai,
      tanggal_selesai
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIMNILAI v3.0';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Rekap Absensi');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama Siswa', key: 'nama', width: 30 },
      { header: 'Kelas', key: 'kelas', width: 22 },
      { header: 'Total Hari', key: 'total_hari', width: 12 },
      { header: 'Hadir', key: 'hadir', width: 10 },
      { header: 'Sakit', key: 'sakit', width: 10 },
      { header: 'Izin', key: 'izin', width: 10 },
      { header: 'Alpa', key: 'alpa', width: 10 },
      { header: 'Persentase Hadir (%)', key: 'persentase_hadir', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true };

    rekapSiswa.forEach((row, idx) => {
      sheet.addRow({
        no: idx + 1,
        nis: row.nis,
        nama: row.nama,
        kelas: row.kelas,
        total_hari: row.total_hari,
        hadir: row.hadir,
        sakit: row.sakit,
        izin: row.izin,
        alpa: row.alpa,
        persentase_hadir: row.persentase_hadir
      });
    });

    sheet.addRow({});
    sheet.addRow({
      nama: 'Rata-rata Kehadiran Kelas (%)',
      persentase_hadir: ringkasanKelas.persentase_kehadiran_kelas
    });

    return workbook;
  }

  /**
   * FR-15: Mengekspor rekap nilai kelas & mata pelajaran ke format Excel (.xlsx)
   */
  static async exportGradesExcel({ id_kelas, id_mata_pelajaran, id_semester }) {
    const { komponenList, rows } = await GradeService.getClassGradeGrid({
      id_kelas,
      id_mata_pelajaran,
      id_semester
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIMNILAI v3.0';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Rekap Nilai');

    const columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama Siswa', key: 'nama', width: 30 }
    ];

    for (const k of komponenList) {
      columns.push({
        header: `${k.nama} (${k.bobot}%)`,
        key: `komp_${k.id_komponen_nilai}`,
        width: 16
      });
    }

    columns.push({ header: 'Nilai Akhir (Informatif)', key: 'nilai_akhir', width: 24 });
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };

    rows.forEach((r, idx) => {
      const rowData = {
        no: idx + 1,
        nis: r.nis,
        nama: r.nama,
        nilai_akhir: r.nilai_akhir !== null ? r.nilai_akhir : '-'
      };
      for (const k of komponenList) {
        const val = r.nilai_komponen[k.id_komponen_nilai];
        rowData[`komp_${k.id_komponen_nilai}`] = val !== null && val !== undefined ? val : '-';
      }
      sheet.addRow(rowData);
    });

    return workbook;
  }
}

module.exports = ReportService;
