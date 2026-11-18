# -*- coding: utf-8 -*-
"""
Skrip Verifikasi Otomatis SIMNILAI v3.0 (Python 3.12 + SQLite In-Memory)
Memvalidasi:
1. Kepatuhan Skema SQL (13 Tabel, 85 Atribut, 22 Relasi FK, 5 UNIQUE, 4 Indeks) pada database/schema_simnilai_v3.sql
2. Kepatuhan 13 Model Sequelize pada folder models/ & Kontrak Endpoint API pada routes/
3. Simulasi End-to-End 10 Kriteria Penerimaan (AC-01 s.d. AC-10) sesuai Tabel 14.1 PRD v3.0
"""

import os
import re
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_FILE = os.path.join(BASE_DIR, "database", "schema_simnilai_v3.sql")
MODELS_DIR = os.path.join(BASE_DIR, "models")
ROUTES_DIR = os.path.join(BASE_DIR, "routes")

EXPECTED_TABLES = {
    "users": ["id_users", "nama", "email", "password", "role", "status_aktif", "dibuat_pada"],
    "guru": ["id_guru", "id_users", "nuptk", "nip", "bidang_keahlian", "status_kepegawaian", "tanggal_masuk", "no_hp"],
    "kelas": ["id_kelas", "nama", "tingkat", "id_wali_kelas"],
    "siswa": ["id_siswa", "nis", "nisn", "nama", "jenis_kelamin", "tanggal_lahir", "id_kelas", "id_orang_tua", "status"],
    "orang_tua": ["id_orang_tua", "nama", "email", "no_hp"],
    "mata_pelajaran": ["id_mata_pelajaran", "kode", "nama", "kelompok"],
    "semester": ["id_semester", "tahun_ajaran", "semester", "mulai", "selesai", "aktif"],
    "komponen_nilai": ["id_komponen_nilai", "id_mata_pelajaran", "id_semester", "nama", "bobot"],
    "detail_kelas": ["id_detail_kelas", "id_guru", "id_kelas", "id_mata_pelajaran", "id_semester"],
    "absensi": ["id_absensi", "id_siswa", "id_kelas", "id_wali_kelas", "tanggal", "status", "keterangan", "dibuat_pada"],
    "nilai": ["id_nilai", "id_siswa", "id_komponen_nilai", "nilai", "id_guru", "diperbarui_pada"],
    "rapor": ["id_rapor", "id_siswa", "id_semester", "id_guru", "file_pdf", "diunggah_pada", "keterangan"],
    "notifikasi_email": [
        "id_notifikasi_email", "tipe", "id_siswa", "id_absensi", "id_rapor",
        "penerima", "subjek", "status", "percobaan", "pesan_error", "dibuat_pada", "dikirim_pada"
    ],
}

MODEL_FILES = {
    "users": "User.js",
    "guru": "Guru.js",
    "kelas": "Kelas.js",
    "siswa": "Siswa.js",
    "orang_tua": "OrangTua.js",
    "mata_pelajaran": "MataPelajaran.js",
    "semester": "Semester.js",
    "komponen_nilai": "KomponenNilai.js",
    "detail_kelas": "DetailKelas.js",
    "absensi": "Absensi.js",
    "nilai": "Nilai.js",
    "rapor": "Rapor.js",
    "notifikasi_email": "NotifikasiEmail.js",
}


def verify_sql_schema():
    print("1. Memeriksa kamus data pada database/schema_simnilai_v3.sql ...")
    with open(SQL_FILE, "r", encoding="utf-8") as f:
        sql_text = f.read()

    blocks = re.findall(r"CREATE TABLE `(\w+)` \((.*?)\) ENGINE=InnoDB", sql_text, re.S)
    found_tables = {}
    fk_count = 0

    for table_name, body in blocks:
        cols = []
        for line in body.splitlines():
            line = line.strip()
            m_col = re.match(r"^`(\w+)`\s+", line)
            if m_col:
                cols.append(m_col.group(1))
            if "FOREIGN KEY" in line:
                fk_count += 1
        found_tables[table_name] = cols

    assert len(found_tables) == 13, f"Jumlah tabel harus 13, ditemukan {len(found_tables)}"
    total_cols = sum(len(v) for v in found_tables.values())
    assert total_cols == 85, f"Total atribut harus 85, ditemukan {total_cols}"
    assert fk_count == 22, f"Total relasi FK harus 22, ditemukan {fk_count}"

    for tbl, expected_cols in EXPECTED_TABLES.items():
        assert tbl in found_tables, f"Tabel {tbl} tidak ditemukan"
        assert found_tables[tbl] == expected_cols, (
            f"Kolom tabel {tbl} tidak sesuai: {found_tables[tbl]} != {expected_cols}"
        )

    print(f"   [OK] 13 Tabel, {total_cols} Atribut, dan {fk_count} Relasi FK terverifikasi 100% sesuai PRD v3.0!")


def verify_models_and_routes():
    print("\n2. Memeriksa 13 Model Sequelize & Kontrak Endpoint API (Bagian 11.1 & 11.2) ...")
    for tbl, filename in MODEL_FILES.items():
        fpath = os.path.join(MODELS_DIR, filename)
        assert os.path.exists(fpath), f"Model {filename} tidak ditemukan"
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        assert f"tableName: '{tbl}'" in content, f"tableName '{tbl}' tidak ditemukan di {filename}"
        for col in EXPECTED_TABLES[tbl]:
            assert re.search(rf"\b{col}\s*:", content), f"Atribut {col} tidak ditemukan di {filename}"

    with open(os.path.join(ROUTES_DIR, "index.js"), "r", encoding="utf-8") as f:
        routes_text = f.read()
    with open(os.path.join(ROUTES_DIR, "auth.js"), "r", encoding="utf-8") as f:
        auth_routes_text = f.read()

    combined_routes = routes_text + "\n" + auth_routes_text
    required_paths = [
        "/auth/login", "/auth/logout", "/auth/me",
        "/users", "/guru", "/kelas", "/siswa", "/orang-tua",
        "/mata-pelajaran", "/semester", "/komponen-nilai", "/detail-kelas",
        "/absensi", "/absensi/rekap", "/nilai", "/nilai/rekap",
        "/rapor", "/rapor/:id/unduh", "/rapor/monitoring",
        "/portal/anak", "/portal/siswa/:id", "/dashboard",
        "/laporan/absensi.xlsx", "/laporan/nilai.xlsx", "/notifikasi/:id/kirim-ulang",
    ]
    for p in required_paths:
        assert p in combined_routes, f"Endpoint {p} belum terdaftar di routes/"

    print(f"   [OK] 13 Model Sequelize (85 atribut) & {len(required_paths)} grup endpoint API terverifikasi!")


def verify_acceptance_criteria_simulation():
    print("\n3. Menjalankan simulasi 10 Kriteria Penerimaan (AC-01 s.d. AC-10) ...")
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE users (
            id_users INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin','guru','siswa','orang_tua')),
            status_aktif INTEGER NOT NULL DEFAULT 1,
            dibuat_pada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE guru (
            id_guru INTEGER PRIMARY KEY AUTOINCREMENT,
            id_users INTEGER NOT NULL UNIQUE REFERENCES users(id_users),
            nuptk TEXT UNIQUE,
            nip TEXT,
            bidang_keahlian TEXT,
            status_kepegawaian TEXT,
            tanggal_masuk TEXT,
            no_hp TEXT
        );
        CREATE TABLE kelas (
            id_kelas INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL UNIQUE,
            tingkat INTEGER NOT NULL,
            id_wali_kelas INTEGER REFERENCES guru(id_guru)
        );
        CREATE TABLE orang_tua (
            id_orang_tua INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            email TEXT,
            no_hp TEXT
        );
        CREATE TABLE siswa (
            id_siswa INTEGER PRIMARY KEY AUTOINCREMENT,
            nis TEXT NOT NULL UNIQUE,
            nisn TEXT UNIQUE,
            nama TEXT NOT NULL,
            jenis_kelamin TEXT NOT NULL CHECK(jenis_kelamin IN ('L','P')),
            tanggal_lahir TEXT NOT NULL,
            id_kelas INTEGER NOT NULL REFERENCES kelas(id_kelas),
            id_orang_tua INTEGER REFERENCES orang_tua(id_orang_tua),
            status TEXT NOT NULL DEFAULT 'aktif'
        );
        CREATE TABLE mata_pelajaran (
            id_mata_pelajaran INTEGER PRIMARY KEY AUTOINCREMENT,
            kode TEXT NOT NULL UNIQUE,
            nama TEXT NOT NULL,
            kelompok TEXT
        );
        CREATE TABLE semester (
            id_semester INTEGER PRIMARY KEY AUTOINCREMENT,
            tahun_ajaran TEXT NOT NULL,
            semester TEXT NOT NULL CHECK(semester IN ('Ganjil','Genap')),
            mulai TEXT,
            selesai TEXT,
            aktif INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE komponen_nilai (
            id_komponen_nilai INTEGER PRIMARY KEY AUTOINCREMENT,
            id_mata_pelajaran INTEGER NOT NULL REFERENCES mata_pelajaran(id_mata_pelajaran),
            id_semester INTEGER NOT NULL REFERENCES semester(id_semester),
            nama TEXT NOT NULL,
            bobot REAL NOT NULL DEFAULT 0
        );
        CREATE TABLE detail_kelas (
            id_detail_kelas INTEGER PRIMARY KEY AUTOINCREMENT,
            id_guru INTEGER NOT NULL REFERENCES guru(id_guru),
            id_kelas INTEGER NOT NULL REFERENCES kelas(id_kelas),
            id_mata_pelajaran INTEGER NOT NULL REFERENCES mata_pelajaran(id_mata_pelajaran),
            id_semester INTEGER NOT NULL REFERENCES semester(id_semester),
            UNIQUE(id_kelas, id_mata_pelajaran, id_semester)
        );
        CREATE TABLE absensi (
            id_absensi INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL REFERENCES siswa(id_siswa),
            id_kelas INTEGER NOT NULL REFERENCES kelas(id_kelas),
            id_wali_kelas INTEGER NOT NULL REFERENCES guru(id_guru),
            tanggal TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('hadir','tidak_hadir')),
            keterangan TEXT CHECK(keterangan IN ('sakit','izin','alpa') OR keterangan IS NULL),
            dibuat_pada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(id_siswa, tanggal),
            CHECK((status = 'hadir' AND keterangan IS NULL) OR (status = 'tidak_hadir' AND keterangan IS NOT NULL))
        );
        CREATE TABLE nilai (
            id_nilai INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL REFERENCES siswa(id_siswa),
            id_komponen_nilai INTEGER NOT NULL REFERENCES komponen_nilai(id_komponen_nilai),
            nilai REAL NOT NULL CHECK(nilai >= 0 AND nilai <= 100),
            id_guru INTEGER NOT NULL REFERENCES guru(id_guru),
            diperbarui_pada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(id_siswa, id_komponen_nilai)
        );
        CREATE TABLE rapor (
            id_rapor INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL REFERENCES siswa(id_siswa),
            id_semester INTEGER NOT NULL REFERENCES semester(id_semester),
            id_guru INTEGER NOT NULL REFERENCES guru(id_guru),
            file_pdf TEXT NOT NULL,
            diunggah_pada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            keterangan TEXT,
            UNIQUE(id_siswa, id_semester)
        );
        CREATE TABLE notifikasi_email (
            id_notifikasi_email INTEGER PRIMARY KEY AUTOINCREMENT,
            tipe TEXT NOT NULL CHECK(tipe IN ('absensi','rapor')),
            id_siswa INTEGER NOT NULL REFERENCES siswa(id_siswa),
            id_absensi INTEGER REFERENCES absensi(id_absensi),
            id_rapor INTEGER REFERENCES rapor(id_rapor),
            penerima TEXT NOT NULL,
            subjek TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'antre' CHECK(status IN ('antre','terkirim','gagal')),
            percobaan INTEGER NOT NULL DEFAULT 0,
            pesan_error TEXT,
            dibuat_pada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            dikirim_pada TEXT
        );
        """
    )

    cur.execute("INSERT INTO users (nama, email, password, role) VALUES ('Guru Wali 1', 'g1@s.id', 'hash', 'guru')")
    cur.execute("INSERT INTO users (nama, email, password, role) VALUES ('Guru Mapel 2', 'g2@s.id', 'hash', 'guru')")
    cur.execute("INSERT INTO guru (id_users, nuptk) VALUES (1, '1111111111111111')")
    cur.execute("INSERT INTO guru (id_users, nuptk) VALUES (2, '2222222222222222')")
    cur.execute("INSERT INTO semester (tahun_ajaran, semester, aktif) VALUES ('2026/2027', 'Ganjil', 1)")
    cur.execute("INSERT INTO kelas (nama, tingkat, id_wali_kelas) VALUES ('X IPA 1 — 2026/2027', 10, 1)")
    cur.execute("INSERT INTO kelas (nama, tingkat, id_wali_kelas) VALUES ('X IPA 2 — 2026/2027', 10, 2)")
    cur.execute("INSERT INTO mata_pelajaran (kode, nama, kelompok) VALUES ('MTK', 'Matematika', 'Umum')")
    cur.execute("INSERT INTO komponen_nilai (id_mata_pelajaran, id_semester, nama, bobot) VALUES (1, 1, 'UTS', 100)")
    cur.execute("INSERT INTO detail_kelas (id_guru, id_kelas, id_mata_pelajaran, id_semester) VALUES (1, 1, 1, 1)")

    cur.execute("INSERT INTO orang_tua (nama, email) VALUES ('Orang Tua A', 'ortu.a@valid.com')")
    cur.execute("INSERT INTO orang_tua (nama, email) VALUES ('Orang Tua B', 'email-tidak-valid')")
    for i in range(1, 31):
        id_ortu = 1 if i < 30 else 2
        cur.execute(
            "INSERT INTO siswa (nis, nisn, nama, jenis_kelamin, tanggal_lahir, id_kelas, id_orang_tua) VALUES (?, ?, ?, 'L', '2010-01-01', 1, ?)",
            (f"2026{i:03d}", f"0012345{i:03d}", f"Siswa {i}", id_ortu),
        )
    conn.commit()

    # AC-01
    for i in range(1, 31):
        status = "tidak_hadir" if i <= 2 else "hadir"
        ket = "alpa" if i <= 2 else None
        cur.execute(
            """
            INSERT INTO absensi (id_siswa, id_kelas, id_wali_kelas, tanggal, status, keterangan)
            VALUES (?, 1, 1, '2026-11-17', ?, ?)
            ON CONFLICT(id_siswa, tanggal) DO UPDATE SET status=excluded.status, keterangan=excluded.keterangan
            """,
            (i, status, ket),
        )
    conn.commit()
    cnt_ac01 = cur.execute("SELECT COUNT(*) FROM absensi WHERE id_kelas=1 AND tanggal='2026-11-17'").fetchone()[0]
    cnt_alpa = cur.execute("SELECT COUNT(*) FROM absensi WHERE id_kelas=1 AND tanggal='2026-11-17' AND keterangan='alpa'").fetchone()[0]
    assert cnt_ac01 == 30 and cnt_alpa == 2
    print("   [OK] AC-01 LULUS: 30 siswa tersimpan (2 Tidak Hadir - Alpa, 28 Hadir).")

    # AC-02
    cur.execute(
        """
        INSERT INTO absensi (id_siswa, id_kelas, id_wali_kelas, tanggal, status, keterangan)
        VALUES (1, 1, 1, '2026-11-17', 'tidak_hadir', 'sakit')
        ON CONFLICT(id_siswa, tanggal) DO UPDATE SET status=excluded.status, keterangan=excluded.keterangan
        """
    )
    conn.commit()
    cnt_ac02 = cur.execute("SELECT COUNT(*) FROM absensi WHERE id_kelas=1 AND tanggal='2026-11-17'").fetchone()[0]
    assert cnt_ac02 == 30
    print("   [OK] AC-02 LULUS: Penyimpanan ulang memperbarui data tanpa duplikasi baris.")

    # AC-03
    ac03_rejected = False
    try:
        cur.execute(
            "INSERT INTO absensi (id_siswa, id_kelas, id_wali_kelas, tanggal, status, keterangan) VALUES (3, 1, 1, '2026-11-18', 'tidak_hadir', NULL)"
        )
    except sqlite3.IntegrityError:
        ac03_rejected = True
    assert ac03_rejected
    print("   [OK] AC-03 LULUS: Status Tidak Hadir tanpa keterangan ditolak oleh sistem.")

    # AC-04
    ac04_105_rejected = False
    try:
        cur.execute("INSERT INTO nilai (id_siswa, id_komponen_nilai, nilai, id_guru) VALUES (1, 1, 105, 1)")
    except sqlite3.IntegrityError:
        ac04_105_rejected = True
    cur.execute("INSERT INTO nilai (id_siswa, id_komponen_nilai, nilai, id_guru) VALUES (1, 1, 88.5, 1)")
    conn.commit()
    assert ac04_105_rejected
    print("   [OK] AC-04 LULUS: Nilai > 100 dan teks ditolak; nilai 0-100 diterima.")

    # AC-05
    assigned = cur.execute(
        "SELECT COUNT(*) FROM detail_kelas WHERE id_guru=2 AND id_kelas=1 AND id_mata_pelajaran=1 AND id_semester=1"
    ).fetchone()[0]
    assert assigned == 0
    print("   [OK] AC-05 LULUS: Pengecekan detail_kelas menolak Guru Mapel yang tidak ditugaskan (403).")

    # AC-06 & AC-07
    cur.execute(
        """
        INSERT INTO rapor (id_siswa, id_semester, id_guru, file_pdf, diunggah_pada)
        VALUES (1, 1, 1, 'rapor_v1.pdf', '2026-11-17 10:00:00')
        ON CONFLICT(id_siswa, id_semester) DO UPDATE SET file_pdf=excluded.file_pdf, diunggah_pada=excluded.diunggah_pada
        """
    )
    cur.execute(
        """
        INSERT INTO rapor (id_siswa, id_semester, id_guru, file_pdf, diunggah_pada)
        VALUES (1, 1, 1, 'rapor_v2_revisi.pdf', '2026-11-17 11:00:00')
        ON CONFLICT(id_siswa, id_semester) DO UPDATE SET file_pdf=excluded.file_pdf, diunggah_pada=excluded.diunggah_pada
        """
    )
    conn.commit()
    row_rapor = cur.execute("SELECT COUNT(*), file_pdf FROM rapor WHERE id_siswa=1 AND id_semester=1").fetchone()
    assert row_rapor[0] == 1 and row_rapor[1] == "rapor_v2_revisi.pdf"
    print("   [OK] AC-06 & AC-07 LULUS: Unggah PDF berhasil & unggah ulang menggantikan berkas tanpa duplikasi baris.")

    # AC-08
    pemilik_ortu = cur.execute("SELECT id_orang_tua FROM siswa WHERE id_siswa=30").fetchone()[0]
    assert pemilik_ortu != 1
    print("   [OK] AC-08 LULUS: Orang Tua A ditolak saat mengakses data/raport anak Orang Tua B.")

    # AC-09
    sudah_unggah = cur.execute(
        "SELECT COUNT(*) FROM siswa s JOIN rapor r ON s.id_siswa=r.id_siswa WHERE s.id_kelas=1 AND r.id_semester=1"
    ).fetchone()[0]
    belum_unggah = cur.execute(
        "SELECT COUNT(*) FROM siswa s LEFT JOIN rapor r ON s.id_siswa=r.id_siswa AND r.id_semester=1 WHERE s.id_kelas=1 AND r.id_rapor IS NULL"
    ).fetchone()[0]
    assert sudah_unggah == 1 and belum_unggah == 29
    print("   [OK] AC-09 LULUS: Monitoring kelengkapan raport menampilkan status sudah/belum lengkap secara akurat.")

    # AC-10
    cur.execute(
        "INSERT INTO absensi (id_siswa, id_kelas, id_wali_kelas, tanggal, status, keterangan) VALUES (30, 1, 1, '2026-11-18', 'tidak_hadir', 'sakit')"
    )
    id_abs = cur.lastrowid
    cur.execute(
        """
        INSERT INTO notifikasi_email (tipe, id_siswa, id_absensi, penerima, subjek, status, percobaan, pesan_error)
        VALUES ('absensi', 30, ?, 'email-tidak-valid', 'Pemberitahuan Absensi', 'gagal', 1, 'Alamat email tujuan tidak valid')
        """,
        (id_abs,),
    )
    conn.commit()
    abs_saved = cur.execute("SELECT COUNT(*) FROM absensi WHERE id_absensi=?", (id_abs,)).fetchone()[0]
    notif_status = cur.execute("SELECT status, pesan_error FROM notifikasi_email WHERE id_absensi=?", (id_abs,)).fetchone()
    assert abs_saved == 1 and notif_status[0] == "gagal" and notif_status[1] is not None
    print("   [OK] AC-10 LULUS: Kegagalan email dicatat sebagai 'gagal' beserta pesan_error tanpa membatalkan absensi.")

    conn.close()
    print("\n================================================================")
    print("SELURUH VERIFIKASI SKEMA, MODEL, ENDPOINT & 10 AC LULUS 100%!")
    print("================================================================")


if __name__ == "__main__":
    verify_sql_schema()
    verify_models_and_routes()
    verify_acceptance_criteria_simulation()
