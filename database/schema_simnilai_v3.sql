-- ============================================================================
-- SKEMA BASIS DATA SIMNILAI v3.0 (MySQL 8.0+)
-- Sesuai PRD SIMNILAI v3.0 Bagian 8 (13 Tabel, 85 Atribut, 22 Relasi)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `simnilai`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `simnilai`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `notifikasi_email`;
DROP TABLE IF EXISTS `rapor`;
DROP TABLE IF EXISTS `nilai`;
DROP TABLE IF EXISTS `absensi`;
DROP TABLE IF EXISTS `detail_kelas`;
DROP TABLE IF EXISTS `komponen_nilai`;
DROP TABLE IF EXISTS `semester`;
DROP TABLE IF EXISTS `mata_pelajaran`;
DROP TABLE IF EXISTS `siswa`;
DROP TABLE IF EXISTS `orang_tua`;
DROP TABLE IF EXISTS `kelas`;
DROP TABLE IF EXISTS `guru`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel users (7 atribut)
CREATE TABLE `users` (
  `id_users` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'guru', 'siswa', 'orang_tua') NOT NULL,
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_users`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel guru (8 atribut)
CREATE TABLE `guru` (
  `id_guru` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_users` BIGINT UNSIGNED NOT NULL,
  `nuptk` CHAR(16) NULL DEFAULT NULL,
  `nip` VARCHAR(30) NULL DEFAULT NULL,
  `bidang_keahlian` VARCHAR(100) NULL DEFAULT NULL,
  `status_kepegawaian` ENUM('PNS', 'PPPK', 'GTT', 'GTY') NULL DEFAULT NULL,
  `tanggal_masuk` DATE NULL DEFAULT NULL,
  `no_hp` VARCHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id_guru`),
  UNIQUE KEY `uq_guru_id_users` (`id_users`),
  UNIQUE KEY `uq_guru_nuptk` (`nuptk`),
  CONSTRAINT `fk_guru_users` FOREIGN KEY (`id_users`) REFERENCES `users` (`id_users`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel kelas (4 atribut)
CREATE TABLE `kelas` (
  `id_kelas` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(50) NOT NULL,
  `tingkat` TINYINT NOT NULL,
  `id_wali_kelas` BIGINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id_kelas`),
  UNIQUE KEY `uq_kelas_nama` (`nama`),
  CONSTRAINT `fk_kelas_wali_kelas` FOREIGN KEY (`id_wali_kelas`) REFERENCES `guru` (`id_guru`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel orang_tua (4 atribut - dibuat sebelum siswa karena FK)
CREATE TABLE `orang_tua` (
  `id_orang_tua` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `no_hp` VARCHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id_orang_tua`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel siswa (9 atribut)
CREATE TABLE `siswa` (
  `id_siswa` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nis` VARCHAR(20) NOT NULL,
  `nisn` CHAR(10) NULL DEFAULT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `jenis_kelamin` ENUM('L', 'P') NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `id_kelas` BIGINT UNSIGNED NOT NULL,
  `id_orang_tua` BIGINT UNSIGNED NULL DEFAULT NULL,
  `status` ENUM('aktif', 'lulus', 'pindah', 'keluar') NOT NULL DEFAULT 'aktif',
  PRIMARY KEY (`id_siswa`),
  UNIQUE KEY `uq_siswa_nis` (`nis`),
  UNIQUE KEY `uq_siswa_nisn` (`nisn`),
  CONSTRAINT `fk_siswa_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_siswa_orang_tua` FOREIGN KEY (`id_orang_tua`) REFERENCES `orang_tua` (`id_orang_tua`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel mata_pelajaran (4 atribut)
CREATE TABLE `mata_pelajaran` (
  `id_mata_pelajaran` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` VARCHAR(15) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `kelompok` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`id_mata_pelajaran`),
  UNIQUE KEY `uq_mata_pelajaran_kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel semester (6 atribut)
CREATE TABLE `semester` (
  `id_semester` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tahun_ajaran` VARCHAR(9) NOT NULL,
  `semester` ENUM('Ganjil', 'Genap') NOT NULL,
  `mulai` DATE NULL DEFAULT NULL,
  `selesai` DATE NULL DEFAULT NULL,
  `aktif` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel komponen_nilai (5 atribut)
CREATE TABLE `komponen_nilai` (
  `id_komponen_nilai` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_mata_pelajaran` BIGINT UNSIGNED NOT NULL,
  `id_semester` BIGINT UNSIGNED NOT NULL,
  `nama` VARCHAR(50) NOT NULL,
  `bobot` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id_komponen_nilai`),
  CONSTRAINT `fk_komponen_mapel` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_komponen_semester` FOREIGN KEY (`id_semester`) REFERENCES `semester` (`id_semester`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel detail_kelas (5 atribut)
CREATE TABLE `detail_kelas` (
  `id_detail_kelas` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_guru` BIGINT UNSIGNED NOT NULL,
  `id_kelas` BIGINT UNSIGNED NOT NULL,
  `id_mata_pelajaran` BIGINT UNSIGNED NOT NULL,
  `id_semester` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_detail_kelas`),
  UNIQUE KEY `uq_penugasan_kelas_mapel_semester` (`id_kelas`, `id_mata_pelajaran`, `id_semester`),
  CONSTRAINT `fk_detail_kelas_guru` FOREIGN KEY (`id_guru`) REFERENCES `guru` (`id_guru`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_kelas_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_kelas_mapel` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_kelas_semester` FOREIGN KEY (`id_semester`) REFERENCES `semester` (`id_semester`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel absensi (8 atribut)
CREATE TABLE `absensi` (
  `id_absensi` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_siswa` BIGINT UNSIGNED NOT NULL,
  `id_kelas` BIGINT UNSIGNED NOT NULL,
  `id_wali_kelas` BIGINT UNSIGNED NOT NULL,
  `tanggal` DATE NOT NULL,
  `status` ENUM('hadir', 'tidak_hadir') NOT NULL,
  `keterangan` ENUM('sakit', 'izin', 'alpa') NULL DEFAULT NULL,
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_absensi`),
  UNIQUE KEY `uq_absensi_siswa_tanggal` (`id_siswa`, `tanggal`),
  KEY `idx_absensi_kelas_tanggal` (`id_kelas`, `tanggal`),
  CONSTRAINT `fk_absensi_siswa` FOREIGN KEY (`id_siswa`) REFERENCES `siswa` (`id_siswa`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_absensi_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_absensi_wali_kelas` FOREIGN KEY (`id_wali_kelas`) REFERENCES `guru` (`id_guru`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_absensi_keterangan` CHECK (
    (`status` = 'hadir' AND `keterangan` IS NULL) OR
    (`status` = 'tidak_hadir' AND `keterangan` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel nilai (6 atribut)
CREATE TABLE `nilai` (
  `id_nilai` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_siswa` BIGINT UNSIGNED NOT NULL,
  `id_komponen_nilai` BIGINT UNSIGNED NOT NULL,
  `nilai` DECIMAL(5,2) NOT NULL,
  `id_guru` BIGINT UNSIGNED NOT NULL,
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nilai`),
  UNIQUE KEY `uq_nilai_siswa_komponen` (`id_siswa`, `id_komponen_nilai`),
  KEY `idx_nilai_siswa` (`id_siswa`),
  CONSTRAINT `fk_nilai_siswa` FOREIGN KEY (`id_siswa`) REFERENCES `siswa` (`id_siswa`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_komponen` FOREIGN KEY (`id_komponen_nilai`) REFERENCES `komponen_nilai` (`id_komponen_nilai`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_guru` FOREIGN KEY (`id_guru`) REFERENCES `guru` (`id_guru`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_nilai_rentang` CHECK (`nilai` >= 0 AND `nilai` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel rapor (7 atribut)
CREATE TABLE `rapor` (
  `id_rapor` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_siswa` BIGINT UNSIGNED NOT NULL,
  `id_semester` BIGINT UNSIGNED NOT NULL,
  `id_guru` BIGINT UNSIGNED NOT NULL,
  `file_pdf` VARCHAR(255) NOT NULL,
  `diunggah_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `keterangan` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id_rapor`),
  UNIQUE KEY `uq_rapor_siswa_semester` (`id_siswa`, `id_semester`),
  KEY `idx_rapor_siswa_semester` (`id_siswa`, `id_semester`),
  CONSTRAINT `fk_rapor_siswa` FOREIGN KEY (`id_siswa`) REFERENCES `siswa` (`id_siswa`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rapor_semester` FOREIGN KEY (`id_semester`) REFERENCES `semester` (`id_semester`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rapor_guru` FOREIGN KEY (`id_guru`) REFERENCES `guru` (`id_guru`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel notifikasi_email (12 atribut)
CREATE TABLE `notifikasi_email` (
  `id_notifikasi_email` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipe` ENUM('absensi', 'rapor') NOT NULL,
  `id_siswa` BIGINT UNSIGNED NOT NULL,
  `id_absensi` BIGINT UNSIGNED NULL DEFAULT NULL,
  `id_rapor` BIGINT UNSIGNED NULL DEFAULT NULL,
  `penerima` VARCHAR(150) NOT NULL,
  `subjek` VARCHAR(150) NOT NULL,
  `status` ENUM('antre', 'terkirim', 'gagal') NOT NULL DEFAULT 'antre',
  `percobaan` TINYINT NOT NULL DEFAULT 0,
  `pesan_error` TEXT NULL DEFAULT NULL,
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dikirim_pada` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id_notifikasi_email`),
  KEY `idx_notifikasi_status_dibuat` (`status`, `dibuat_pada`),
  CONSTRAINT `fk_notifikasi_siswa` FOREIGN KEY (`id_siswa`) REFERENCES `siswa` (`id_siswa`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notifikasi_absensi` FOREIGN KEY (`id_absensi`) REFERENCES `absensi` (`id_absensi`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notifikasi_rapor` FOREIGN KEY (`id_rapor`) REFERENCES `rapor` (`id_rapor`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
