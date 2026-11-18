const {
  sequelize,
  Nilai,
  KomponenNilai,
  DetailKelas,
  Siswa,
  MataPelajaran,
  Kelas,
  Semester
} = require('../models');

class GradeService {
  /**
   * FR-08: Mengatur komponen penilaian & bobot per mata pelajaran per semester.
   * Jika bobot digunakan (> 0), total bobot seluruh komponen pada mapel & semester tersebut wajib 100%.
   */
  static async saveComponents({ id_mata_pelajaran, id_semester, components }) {
    if (!id_mata_pelajaran || !id_semester || !Array.isArray(components) || components.length === 0) {
      const err = new Error('Mata pelajaran, semester, dan daftar komponen nilai wajib diisi.');
      err.status = 400;
      throw err;
    }

    let totalBobot = 0;
    for (const comp of components) {
      const bobot = Number(comp.bobot || 0);
      if (Number.isNaN(bobot) || bobot < 0 || bobot > 100) {
        const err = new Error(`Bobot komponen "${comp.nama}" harus berada pada rentang 0–100.`);
        err.status = 400;
        throw err;
      }
      totalBobot += bobot;
    }

    if (totalBobot > 0 && Math.abs(totalBobot - 100) > 0.01) {
      const err = new Error(
        `Total bobot komponen nilai per mata pelajaran dan semester harus tepat 100% (saat ini: ${totalBobot.toFixed(2)}%).`
      );
      err.status = 400;
      throw err;
    }

    const result = [];
    await sequelize.transaction(async (t) => {
      for (const comp of components) {
        if (comp.id_komponen_nilai) {
          const existing = await KomponenNilai.findByPk(comp.id_komponen_nilai, { transaction: t });
          if (existing) {
            await existing.update(
              {
                nama: String(comp.nama).trim(),
                bobot: Number(comp.bobot || 0)
              },
              { transaction: t }
            );
            result.push(existing);
            continue;
          }
        }
        const created = await KomponenNilai.create(
          {
            id_mata_pelajaran: Number(id_mata_pelajaran),
            id_semester: Number(id_semester),
            nama: String(comp.nama).trim(),
            bobot: Number(comp.bobot || 0)
          },
          { transaction: t }
        );
        result.push(created);
      }
    });

    return result;
  }

  /**
   * Memeriksa apakah guru ditugaskan pada detail_kelas untuk (id_kelas, id_mata_pelajaran, id_semester) (AC-05)
   */
  static async verifyTeacherAssignment({ id_guru, id_kelas, id_mata_pelajaran, id_semester }) {
    const whereClause = {
      id_guru: Number(id_guru),
      id_kelas: Number(id_kelas),
      id_mata_pelajaran: Number(id_mata_pelajaran)
    };
    if (id_semester) {
      whereClause.id_semester = Number(id_semester);
    }

    const assignment = await DetailKelas.findOne({ where: whereClause });
    if (!assignment) {
      const err = new Error(
        'Akses Ditolak (403): Guru mata pelajaran hanya dapat mengakses dan menginput nilai untuk kelas dan mata pelajaran yang ditugaskan pada detail_kelas.'
      );
      err.status = 403;
      throw err;
    }
    return assignment;
  }

  /**
   * Validasi nilai tunggal 0–100 (AC-04)
   */
  static validateScore(rawScore, label = '') {
    if (
      rawScore === null ||
      rawScore === undefined ||
      rawScore === '' ||
      typeof rawScore === 'boolean'
    ) {
      const err = new Error(`Nilai tidak boleh kosong${label ? ` (${label})` : ''}.`);
      err.status = 400;
      throw err;
    }

    const strVal = String(rawScore).trim();
    if (!/^-?\d+(\.\d+)?$/.test(strVal)) {
      const err = new Error(
        `Input nilai "${rawScore}" ditolak: Nilai harus berupa angka murni (bukan teks)${label ? ` (${label})` : ''}.`
      );
      err.status = 400;
      throw err;
    }

    const numericVal = Number(strVal);
    if (Number.isNaN(numericVal) || numericVal < 0 || numericVal > 100) {
      const err = new Error(
        `Input nilai ${numericVal} ditolak: Nilai wajib berada pada rentang 0 sampai 100${label ? ` (${label})` : ''}.`
      );
      err.status = 400;
      throw err;
    }

    return Number(numericVal.toFixed(2));
  }

  /**
   * FR-07, AC-04, AC-05:
   * Menyimpan/memperbarui (upsert) nilai siswa per komponen penilaian oleh Guru Mapel yang berwenang.
   */
  static async saveGrades({ id_guru, id_kelas, id_mata_pelajaran, id_semester, entries }) {
    if (!id_guru || !id_kelas || !id_mata_pelajaran || !id_semester || !Array.isArray(entries)) {
      const err = new Error('Parameter guru, kelas, mata pelajaran, semester, dan daftar nilai wajib lengkap.');
      err.status = 400;
      throw err;
    }

    // AC-05: Pastikan guru pengampu sah pada detail_kelas
    await GradeService.verifyTeacherAssignment({
      id_guru,
      id_kelas,
      id_mata_pelajaran,
      id_semester
    });

    // AC-04: Validasi seluruh input nilai terlebih dahulu (0-100, tolak teks & >100)
    const validatedEntries = entries.map((item) => {
      const skor = GradeService.validateScore(
        item.nilai,
        `Siswa #${item.id_siswa}, Komponen #${item.id_komponen_nilai}`
      );
      return {
        id_siswa: Number(item.id_siswa),
        id_komponen_nilai: Number(item.id_komponen_nilai),
        nilai: skor
      };
    });

    const saved = [];
    await sequelize.transaction(async (t) => {
      for (const item of validatedEntries) {
        const existing = await Nilai.findOne({
          where: {
            id_siswa: item.id_siswa,
            id_komponen_nilai: item.id_komponen_nilai
          },
          transaction: t
        });

        if (existing) {
          await existing.update(
            {
              nilai: item.nilai,
              id_guru: Number(id_guru),
              diperbarui_pada: new Date()
            },
            { transaction: t }
          );
          saved.push(existing);
        } else {
          const created = await Nilai.create(
            {
              id_siswa: item.id_siswa,
              id_komponen_nilai: item.id_komponen_nilai,
              nilai: item.nilai,
              id_guru: Number(id_guru),
              diperbarui_pada: new Date()
            },
            { transaction: t }
          );
          saved.push(created);
        }
      }
    });

    return saved;
  }

  /**
   * Mengambil data grid input nilai untuk satu kelas, mata pelajaran, dan semester
   */
  static async getClassGradeGrid({ id_kelas, id_mata_pelajaran, id_semester }) {
    const siswaList = await Siswa.findAll({
      where: { id_kelas: Number(id_kelas), status: 'aktif' },
      order: [['nama', 'ASC']]
    });

    const komponenList = await KomponenNilai.findAll({
      where: {
        id_mata_pelajaran: Number(id_mata_pelajaran),
        id_semester: Number(id_semester)
      },
      order: [['id_komponen_nilai', 'ASC']]
    });

    const komponenIds = komponenList.map((k) => k.id_komponen_nilai);
    const siswaIds = siswaList.map((s) => s.id_siswa);

    const nilaiList =
      komponenIds.length && siswaIds.length
        ? await Nilai.findAll({
            where: {
              id_siswa: siswaIds,
              id_komponen_nilai: komponenIds
            }
          })
        : [];

    const nilaiMap = new Map();
    for (const n of nilaiList) {
      nilaiMap.set(`${n.id_siswa}_${n.id_komponen_nilai}`, Number(n.nilai));
    }

    const totalBobot = komponenList.reduce((acc, k) => acc + Number(k.bobot || 0), 0);

    const rows = siswaList.map((s) => {
      const nilaiPerKomponen = {};
      let sumWeighted = 0;
      let sumSimple = 0;
      let countFilled = 0;

      for (const k of komponenList) {
        const key = `${s.id_siswa}_${k.id_komponen_nilai}`;
        const val = nilaiMap.has(key) ? nilaiMap.get(key) : null;
        nilaiPerKomponen[k.id_komponen_nilai] = val;

        if (val !== null) {
          countFilled += 1;
          sumSimple += val;
          sumWeighted += (val * Number(k.bobot || 0)) / 100;
        }
      }

      let nilaiAkhir = null;
      if (countFilled > 0) {
        nilaiAkhir =
          totalBobot > 0
            ? Number(sumWeighted.toFixed(2))
            : Number((sumSimple / countFilled).toFixed(2));
      }

      return {
        id_siswa: s.id_siswa,
        nis: s.nis,
        nama: s.nama,
        nilai_komponen: nilaiPerKomponen,
        nilai_akhir: nilaiAkhir,
        lengkap: countFilled === komponenList.length && komponenList.length > 0
      };
    });

    return {
      komponenList,
      totalBobot,
      rows
    };
  }

  /**
   * FR-09: Rekap nilai seorang siswa pada semester tertentu di seluruh mata pelajaran
   * (Bersifat informatif dan tidak menggantikan raport resmi)
   */
  static async getStudentGradeRecap({ id_siswa, id_semester }) {
    const siswa = await Siswa.findByPk(id_siswa, {
      include: [{ model: Kelas, as: 'kelas' }]
    });
    if (!siswa) {
      const err = new Error('Siswa tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    const komponenList = await KomponenNilai.findAll({
      where: { id_semester: Number(id_semester) },
      include: [{ model: MataPelajaran, as: 'mataPelajaran' }],
      order: [['id_mata_pelajaran', 'ASC'], ['id_komponen_nilai', 'ASC']]
    });

    const nilaiSiswa = await Nilai.findAll({
      where: { id_siswa: Number(id_siswa) }
    });

    const nilaiMap = new Map();
    for (const n of nilaiSiswa) {
      nilaiMap.set(Number(n.id_komponen_nilai), Number(n.nilai));
    }

    const mapelGroup = new Map();
    for (const k of komponenList) {
      const mapel = k.mataPelajaran;
      if (!mapel) continue;
      if (!mapelGroup.has(mapel.id_mata_pelajaran)) {
        mapelGroup.set(mapel.id_mata_pelajaran, {
          id_mata_pelajaran: mapel.id_mata_pelajaran,
          kode: mapel.kode,
          nama: mapel.nama,
          kelompok: mapel.kelompok,
          komponen: [],
          total_bobot: 0,
          nilai_akhir: null
        });
      }
      const group = mapelGroup.get(mapel.id_mata_pelajaran);
      const skor = nilaiMap.has(Number(k.id_komponen_nilai))
        ? nilaiMap.get(Number(k.id_komponen_nilai))
        : null;
      group.komponen.push({
        id_komponen_nilai: k.id_komponen_nilai,
        nama: k.nama,
        bobot: Number(k.bobot),
        nilai: skor
      });
      group.total_bobot += Number(k.bobot || 0);
    }

    const rekapMapel = Array.from(mapelGroup.values()).map((m) => {
      const filled = m.komponen.filter((c) => c.nilai !== null);
      if (filled.length > 0) {
        if (m.total_bobot > 0) {
          const weighted = filled.reduce((acc, c) => acc + (c.nilai * c.bobot) / 100, 0);
          m.nilai_akhir = Number(weighted.toFixed(2));
        } else {
          const avg = filled.reduce((acc, c) => acc + c.nilai, 0) / filled.length;
          m.nilai_akhir = Number(avg.toFixed(2));
        }
      }
      return m;
    });

    return {
      siswa,
      rekapMapel,
      catatan: 'Rekap nilai ini bersifat informatif dan tidak menggantikan dokumen raport resmi.'
    };
  }
}

module.exports = GradeService;
