# SIMNILAI v3.0 — Sistem Informasi Manajemen Nilai, Absensi, dan Dokumen Raport Sekolah

Aplikasi web responsif untuk pengelolaan data master akademik, absensi harian wali kelas, input nilai per komponen berbobot, arsip dokumen raport PDF, serta portal siswa dan orang tua sesuai **PRD SIMNILAI v3.0 (Final — 17 November 2026)**.

---

## 1. Fitur Utama (16 Kebutuhan Fungsional)

1. **Autentikasi & Hak Akses 5 Peran (`FR-01`, `FR-02`)**: Login berbasis email & kata sandi dengan pembatasan akses ketat untuk **Admin**, **Wali Kelas** (`kelas.id_wali_kelas`), **Guru Mata Pelajaran** (`detail_kelas`), **Siswa**, dan **Orang Tua/Wali** (`siswa.id_orang_tua`).
2. **Data Master & Penugasan (`FR-03`, `FR-04`)**: Pengelolaan 13 tabel terpusat meliputi `users`, `guru`, `kelas`, `siswa`, `orang_tua`, `mata_pelajaran`, `semester` (1 semester aktif), `komponen_nilai`, dan `detail_kelas`.
3. **Absensi Harian & Rekap (`FR-05`, `FR-06`)**: Satu baris kehadiran per siswa per tanggal (`UNIQUE(id_siswa, tanggal)`), status `hadir` / `tidak_hadir`, keterangan wajib `sakit` / `izin` / `alpa` bila tidak hadir, serta rekap persentase kehadiran per siswa, kelas, dan bulan.
4. **Manajemen Nilai & Komponen Bobot (`FR-07`, `FR-08`, `FR-09`)**: Komponen nilai per mapel & semester (total bobot 100%), input nilai `0–100` khusus Guru Mapel pengampu, dan rekap nilai informatif.
5. **Arsip Dokumen Raport PDF & Monitoring (`FR-10`, `FR-11`, `FR-12`)**: Unggah PDF (maks. 10 MB, disimpan di luar webroot pada `storage/rapor/`), unggah ulang menimpa berkas lama (`UNIQUE(id_siswa, id_semester)`), unduh terautentikasi sesuai hak akses, serta monitoring kelengkapan dokumen per kelas dan semester.
6. **Portal Siswa/Orang Tua, Dashboard, Ekspor Excel, & Email Opsional (`FR-13` s.d. `FR-16`)**: Portal mandiri (mendukung 1 orang tua untuk banyak anak), ekspor laporan `.xlsx`, dan antrean `notifikasi_email` asinkron yang tidak membatalkan transaksi utama bila pengiriman gagal.

---

## 2. Langkah Instalasi & Menjalankan dari Lingkungan Bersih

### Prasyarat
- **Node.js** v18+ dan **npm**
- **MySQL 8.0+** / **MariaDB 10.6+**
- **Python 3.10+** (opsional, untuk menjalankan skrip verifikasi skema cepat)

### Langkah demi Langkah

1. **Salin berkas konfigurasi environment**:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan pengaturan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASS` pada berkas `.env`.

2. **Impor skema SQL 13 tabel (opsional jika menggunakan Sequelize sync)**:
   ```bash
   mysql -u root -p < database/schema_simnilai_v3.sql
   ```

3. **Instal dependensi paket**:
   ```bash
   npm install
   ```

4. **Jalankan Seeder Data Contoh (Lampiran A.3)**:
   ```bash
   npm run seed
   ```
   Perintah ini akan membuat 1 semester aktif (`Ganjil 2026/2027`), 2 kelas (`X IPA 1` dan `X IPA 2`), 10 siswa, 3 mata pelajaran (`MTK`, `BIN`, `FIS`), komponen nilai berbobot 100%, 2 guru, orang tua (termasuk 1 orang tua dengan 2 anak), contoh absensi harian, contoh nilai, contoh PDF raport, dan antrean email.

5. **Jalankan Server Aplikasi**:
   ```bash
   npm start
   ```
   Buka `http://localhost:3000` pada peramban.

---

## 3. Akun Uji Bawaan Seeder (5 Peran)

| Peran | Email | Kata Sandi | Hak Akses Utama |
|---|---|---|---|
| **Admin Sekolah / TU** | `admin@sekolah.sch.id` | `admin123` | Akses penuh data master, penugasan, monitoring raport, dan laporan |
| **Wali Kelas X IPA 1 & Guru MTK/FIS** | `budi.guru@sekolah.sch.id` | `guru123` | Absensi harian & unggah raport X IPA 1; input nilai MTK & FIS |
| **Wali Kelas X IPA 2 & Guru BIN** | `siti.guru@sekolah.sch.id` | `guru123` | Absensi harian & unggah raport X IPA 2; input nilai BIN |
| **Orang Tua (2 Anak)** | `ahmad.ortu@email.com` | `password123` | Portal Orang Tua untuk Aditya Pratama & Aisyah Pratama |
| **Siswa** | `2026001@siswa.sekolah.sch.id` | `password123` | Portal Siswa untuk Aditya Pratama |

---

## 4. Menjalankan Pengujian Kriteria Penerimaan (`AC-01` s.d. `AC-10`)

- **Menggunakan Node.js**:
  ```bash
  npm test
  ```
- **Menggunakan Python 3**:
  ```bash
  python tests/verify_simnilai_v3.py
  ```
