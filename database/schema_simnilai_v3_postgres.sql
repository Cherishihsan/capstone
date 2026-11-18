-- ============================================================================
-- SKEMA BASIS DATA SIMNILAI v3.0 (PostgreSQL 16+)
-- Sesuai PRD SIMNILAI v3.0 Bagian 8 & Tabel 10.2 (13 Tabel, 85 Atribut, 22 Relasi)
-- ============================================================================

DROP TABLE IF EXISTS notifikasi_email CASCADE;
DROP TABLE IF EXISTS rapor CASCADE;
DROP TABLE IF EXISTS nilai CASCADE;
DROP TABLE IF EXISTS absensi CASCADE;
DROP TABLE IF EXISTS detail_kelas CASCADE;
DROP TABLE IF EXISTS komponen_nilai CASCADE;
DROP TABLE IF EXISTS semester CASCADE;
DROP TABLE IF EXISTS mata_pelajaran CASCADE;
DROP TABLE IF EXISTS siswa CASCADE;
DROP TABLE IF EXISTS orang_tua CASCADE;
DROP TABLE IF EXISTS kelas CASCADE;
DROP TABLE IF EXISTS guru CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Tabel users (7 atribut)
CREATE TABLE users (
  id_users BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru', 'siswa', 'orang_tua')),
  status_aktif SMALLINT NOT NULL DEFAULT 1 CHECK (status_aktif IN (0, 1)),
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel guru (8 atribut)
CREATE TABLE guru (
  id_guru BIGSERIAL PRIMARY KEY,
  id_users BIGINT NOT NULL UNIQUE REFERENCES users (id_users) ON DELETE CASCADE ON UPDATE CASCADE,
  nuptk CHAR(16) NULL UNIQUE,
  nip VARCHAR(30) NULL,
  bidang_keahlian VARCHAR(100) NULL,
  status_kepegawaian VARCHAR(10) NULL CHECK (status_kepegawaian IN ('PNS', 'PPPK', 'GTT', 'GTY') OR status_kepegawaian IS NULL),
  tanggal_masuk DATE NULL,
  no_hp VARCHAR(20) NULL
);

-- 3. Tabel kelas (4 atribut)
CREATE TABLE kelas (
  id_kelas BIGSERIAL PRIMARY KEY,
  nama VARCHAR(50) NOT NULL UNIQUE,
  tingkat SMALLINT NOT NULL CHECK (tingkat IN (10, 11, 12)),
  id_wali_kelas BIGINT NULL REFERENCES guru (id_guru) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Tabel orang_tua (4 atribut)
CREATE TABLE orang_tua (
  id_orang_tua BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL,
  no_hp VARCHAR(20) NULL
);

-- 4. Tabel siswa (9 atribut)
CREATE TABLE siswa (
  id_siswa BIGSERIAL PRIMARY KEY,
  nis VARCHAR(20) NOT NULL UNIQUE,
  nisn CHAR(10) NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir DATE NOT NULL,
  id_kelas BIGINT NOT NULL REFERENCES kelas (id_kelas) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_orang_tua BIGINT NULL REFERENCES orang_tua (id_orang_tua) ON DELETE SET NULL ON UPDATE CASCADE,
  status VARCHAR(15) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'lulus', 'pindah', 'keluar'))
);

-- 6. Tabel mata_pelajaran (4 atribut)
CREATE TABLE mata_pelajaran (
  id_mata_pelajaran BIGSERIAL PRIMARY KEY,
  kode VARCHAR(15) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  kelompok VARCHAR(50) NULL
);

-- 7. Tabel semester (6 atribut)
CREATE TABLE semester (
  id_semester BIGSERIAL PRIMARY KEY,
  tahun_ajaran VARCHAR(9) NOT NULL,
  semester VARCHAR(10) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
  mulai DATE NULL,
  selesai DATE NULL,
  aktif SMALLINT NOT NULL DEFAULT 0 CHECK (aktif IN (0, 1))
);

-- Indeks unik parsial PostgreSQL: menjamin hanya 1 baris semester yang bernilai aktif = 1
CREATE UNIQUE INDEX uq_semester_hanya_satu_aktif ON semester (aktif) WHERE aktif = 1;

-- 8. Tabel komponen_nilai (5 atribut)
CREATE TABLE komponen_nilai (
  id_komponen_nilai BIGSERIAL PRIMARY KEY,
  id_mata_pelajaran BIGINT NOT NULL REFERENCES mata_pelajaran (id_mata_pelajaran) ON DELETE CASCADE ON UPDATE CASCADE,
  id_semester BIGINT NOT NULL REFERENCES semester (id_semester) ON DELETE CASCADE ON UPDATE CASCADE,
  nama VARCHAR(50) NOT NULL,
  bobot NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (bobot >= 0 AND bobot <= 100)
);

-- 9. Tabel detail_kelas (5 atribut)
CREATE TABLE detail_kelas (
  id_detail_kelas BIGSERIAL PRIMARY KEY,
  id_guru BIGINT NOT NULL REFERENCES guru (id_guru) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_kelas BIGINT NOT NULL REFERENCES kelas (id_kelas) ON DELETE CASCADE ON UPDATE CASCADE,
  id_mata_pelajaran BIGINT NOT NULL REFERENCES mata_pelajaran (id_mata_pelajaran) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_semester BIGINT NOT NULL REFERENCES semester (id_semester) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_penugasan_kelas_mapel_semester UNIQUE (id_kelas, id_mata_pelajaran, id_semester)
);

-- 10. Tabel absensi (8 atribut)
CREATE TABLE absensi (
  id_absensi BIGSERIAL PRIMARY KEY,
  id_siswa BIGINT NOT NULL REFERENCES siswa (id_siswa) ON DELETE CASCADE ON UPDATE CASCADE,
  id_kelas BIGINT NOT NULL REFERENCES kelas (id_kelas) ON DELETE CASCADE ON UPDATE CASCADE,
  id_wali_kelas BIGINT NOT NULL REFERENCES guru (id_guru) ON DELETE RESTRICT ON UPDATE CASCADE,
  tanggal DATE NOT NULL,
  status VARCHAR(15) NOT NULL CHECK (status IN ('hadir', 'tidak_hadir')),
  keterangan VARCHAR(10) NULL CHECK (keterangan IN ('sakit', 'izin', 'alpa') OR keterangan IS NULL),
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_absensi_siswa_tanggal UNIQUE (id_siswa, tanggal),
  CONSTRAINT chk_absensi_keterangan CHECK (
    (status = 'hadir' AND keterangan IS NULL) OR
    (status = 'tidak_hadir' AND keterangan IS NOT NULL)
  )
);

CREATE INDEX idx_absensi_kelas_tanggal ON absensi (id_kelas, tanggal);

-- 11. Tabel nilai (6 atribut)
CREATE TABLE nilai (
  id_nilai BIGSERIAL PRIMARY KEY,
  id_siswa BIGINT NOT NULL REFERENCES siswa (id_siswa) ON DELETE CASCADE ON UPDATE CASCADE,
  id_komponen_nilai BIGINT NOT NULL REFERENCES komponen_nilai (id_komponen_nilai) ON DELETE CASCADE ON UPDATE CASCADE,
  nilai NUMERIC(5,2) NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
  id_guru BIGINT NOT NULL REFERENCES guru (id_guru) ON DELETE RESTRICT ON UPDATE CASCADE,
  diperbarui_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_nilai_siswa_komponen UNIQUE (id_siswa, id_komponen_nilai)
);

CREATE INDEX idx_nilai_siswa ON nilai (id_siswa);

-- 12. Tabel rapor (7 atribut)
CREATE TABLE rapor (
  id_rapor BIGSERIAL PRIMARY KEY,
  id_siswa BIGINT NOT NULL REFERENCES siswa (id_siswa) ON DELETE CASCADE ON UPDATE CASCADE,
  id_semester BIGINT NOT NULL REFERENCES semester (id_semester) ON DELETE CASCADE ON UPDATE CASCADE,
  id_guru BIGINT NOT NULL REFERENCES guru (id_guru) ON DELETE RESTRICT ON UPDATE CASCADE,
  file_pdf VARCHAR(255) NOT NULL,
  diunggah_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  keterangan VARCHAR(255) NULL,
  CONSTRAINT uq_rapor_siswa_semester UNIQUE (id_siswa, id_semester)
);

CREATE INDEX idx_rapor_siswa_semester ON rapor (id_siswa, id_semester);

-- 13. Tabel notifikasi_email (12 atribut)
CREATE TABLE notifikasi_email (
  id_notifikasi_email BIGSERIAL PRIMARY KEY,
  tipe VARCHAR(15) NOT NULL CHECK (tipe IN ('absensi', 'rapor')),
  id_siswa BIGINT NOT NULL REFERENCES siswa (id_siswa) ON DELETE CASCADE ON UPDATE CASCADE,
  id_absensi BIGINT NULL REFERENCES absensi (id_absensi) ON DELETE SET NULL ON UPDATE CASCADE,
  id_rapor BIGINT NULL REFERENCES rapor (id_rapor) ON DELETE SET NULL ON UPDATE CASCADE,
  penerima VARCHAR(150) NOT NULL,
  subjek VARCHAR(150) NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'antre' CHECK (status IN ('antre', 'terkirim', 'gagal')),
  percobaan SMALLINT NOT NULL DEFAULT 0,
  pesan_error TEXT NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dikirim_pada TIMESTAMP NULL
);

CREATE INDEX idx_notifikasi_status_dibuat ON notifikasi_email (status, dibuat_pada);
