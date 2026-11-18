# PRODUCT REQUIREMENTS DOCUMENT (PRD) & UI SPECIFICATION
## SIMNILAI v3.0
### Sistem Informasi Manajemen Nilai, Absensi, dan Dokumen Raport Sekolah
**Dokumen Acuan Implementasi & Spesifikasi Desain Antarmuka (Siap Unggah ke Google Stitch)**

| Informasi Dokumen | Keterangan |
|---|---|
| **Nama Produk** | SIMNILAI — Sistem Informasi Manajemen Nilai, Absensi, dan Dokumen Raport Sekolah |
| **Jenis Aplikasi** | Aplikasi web responsif (Desktop untuk Admin & Guru; Mobile-First untuk Portal Siswa & Orang Tua) |
| **Versi Dokumen** | 3.0 (Diperbarui dengan keputusan arsitektur Node.js + Express + EJS + PostgreSQL & detail UI Stitch) |
| **Tanggal** | 18 November 2026 |
| **Status** | Final — Acuan Tunggal Implementasi & Desain UI/UX |
| **Bahasa Antarmuka** | 100% Bahasa Indonesia |

---

## 1. Ringkasan Eksekutif

SIMNILAI menyatukan empat kebutuhan utama akademik sekolah dalam satu aplikasi web: **data master akademik, absensi harian, pengelolaan nilai berbobot, dan arsip dokumen raport PDF**.

**Batasan Kunci Produk (Penting untuk Desain UI):**
- Sistem **tidak menghitung atau mencetak format raport resmi secara otomatis**. Raport resmi tetap disusun di luar sistem sesuai format sekolah, lalu **diunggah sebagai berkas PDF** oleh Wali Kelas.
- Absensi bersifat **harian per siswa** (bukan per jam mata pelajaran): status hanya **Hadir** atau **Tidak Hadir**, dengan pilihan keterangan **Sakit**, **Izin**, atau **Alpa** (wajib diisi bila Tidak Hadir).
- Tidak ada fitur alur persetujuan (*approval*) raport oleh Kepala Sekolah, tidak ada *versioning* dokumen (unggah ulang langsung menggantikan berkas lama), dan tidak ada notifikasi WhatsApp/SMS (hanya antrean **Notifikasi Email** opsional).

---

## 2. Pengguna dan Hak Akses (5 Peran Fungsional)

Wali Kelas dan Guru Mata Pelajaran menggunakan satu jenis akun (`role = guru`) yang dibedakan secara dinamis berdasarkan penugasan di database (`kelas.id_wali_kelas` dan `detail_kelas`).

| ID | Peran Pengguna | Fokus Aktivitas Utama di UI | Perangkat Utama |
|---|---|---|---|
| **STK-01** | **Admin Sekolah / Tata Usaha** | Mengelola akun (`users`), data master (guru, kelas, siswa, orang tua, mapel, semester), penugasan wali kelas & guru mapel (`detail_kelas`), komponen nilai, monitoring kelengkapan raport, ekspor Excel, dan pantau antrean email. | Desktop / Laptop |
| **STK-02** | **Wali Kelas** *(Role: Guru)* | Mencatat absensi harian kelas binaan (maksimal 3 klik per siswa), melihat rekap kehadiran & nilai kelas, serta mengunggah berkas PDF raport siswa. | Desktop / Tablet / Ponsel |
| **STK-03** | **Guru Mata Pelajaran** *(Role: Guru)* | Menginput nilai siswa (`0–100`) per komponen penilaian (Tugas, UTS, PAS, dll.) dalam tampilan **grid menyerupai spreadsheet**, mengatur komponen/bobot (total 100%), dan melihat rekap nilai. | Desktop / Laptop |
| **STK-04** | **Siswa** | Melihat ringkasan kehadiran pribadi, rincian nilai per mata pelajaran, dan mengunduh dokumen PDF raport miliknya sendiri. | Ponsel / Desktop |
| **STK-05** | **Orang Tua / Wali** | Memilih anak (jika memiliki >1 anak di sekolah), memantau persentase kehadiran & riwayat ketidakhadiran anak, melihat rekap nilai, dan mengunduh PDF raport anak. | Ponsel (*Mobile-First*) |

---

## 3. Panduan Gaya Visual (Design System untuk Google Stitch)

- **Tema & Nuansa**: Modern, bersih (*clean academic dashboard*), profesional, kontras tinggi (mengacu WCAG 2.1 AA), mudah digunakan oleh guru segala usia.
- **Palet Warna yang Disarankan**:
  - **Primary (Utama)**: Indigo / Royal Blue (`#4F46E5` / `#3730A3`) untuk navigasi aktif dan tombol aksi utama.
  - **Background**: Slate lembut (`#F8FAFC` untuk mode terang atau `#0F172A` / `#1E293B` untuk permukaan kartu modern).
  - **Semantic Status Colors (Wajib Konsisten di Seluruh Layar)**:
    - **Hadir / Lengkap / Terkirim**: Emerald Green (`#10B981`)
    - **Izin / Informasi**: Sky Blue (`#3B82F6`)
    - **Sakit / Peringatan / Belum Diisi**: Amber Warning (`#F59E0B`)
    - **Alpa / Tidak Hadir / Gagal / Nilai < KKM**: Rose Red (`#EF4444`)
- **Tipografi**: `Inter` atau `Plus Jakarta Sans` — ukuran font dasar minimal `14px–16px`, angka pada tabel nilai menggunakan `tabular-nums` agar sejajar vertikal.
- **Pola Navigasi**:
  - **Desktop (Admin & Guru)**: Sidebar vertikal tetap di kiri (`260px`) + Header atas (`64px`) berisi indikator **Semester Aktif** (contoh: *Semester Ganjil 2026/2027*), nama pengguna, badge peran, dan tombol keluar.
  - **Mobile (Portal Orang Tua & Siswa)**: Header ringkas + *Bottom Navigation Bar* atau *Card Stack* satu kolom (lebar minimal `360px`).

---

## 4. Spesifikasi Detail 10 Halaman Utama (Untuk Di-generate di Stitch)

### Halaman 1: Halaman Login (`/login`)
- **Pengguna**: Semua peran (`Admin`, `Guru`, `Siswa`, `Orang Tua`).
- **Komponen Wajib**:
  - Kartu login terpusat dengan logo & judul **"SIMNILAI — Sistem Informasi Manajemen Nilai, Absensi, dan Dokumen Raport Sekolah"**.
  - Input **Alamat Email** dan **Kata Sandi** (dengan ikon tampilkan/sembunyikan sandi).
  - Banner peringatan (*alert*) berbahasa Indonesia jika kredensial salah atau akun tidak aktif.
  - Tautan bantuan *"Lupa kata sandi? Hubungi Admin Tata Usaha"*.
  - Tombol penuh **"Masuk ke SIMNILAI"**.

### Halaman 2: Dashboard Ringkas (`/dashboard`)
- **Varian A — Dashboard Admin**:
  - 5 Kartu KPI atas: **Total Siswa Aktif**, **Total Guru**, **Rombongan Kelas**, **Dokumen Raport Terunggah** (progress bar kelengkapan semester aktif), dan **Email Gagal Kirim**.
  - Tabel ringkas **Monitoring Kelengkapan Unggahan Raport per Kelas** (menampilkan kelas mana yang belum 100% mengunggah PDF raport).
  - Panel **Antrean Notifikasi Email Gagal** disertai tombol aksi cepat **"Kirim Ulang"**.
- **Varian B — Dashboard Guru (Gabungan Wali Kelas & Guru Mapel)**:
  - Kartu Peringatan Tugas Hari Ini: Status **Absensi Harian Kelas Binaan** (*"Sudah Diisi"* berwarna hijau atau *"Belum Diisi Hari Ini"* berwarna kuning disertai tombol langsung **"Isi Absensi Sekarang"**).
  - Daftar **Kelas & Mata Pelajaran yang Diampu** pada semester berjalan disertai indikator kelengkapan nilai dan tombol **"Buka Grid Input Nilai"**.

### Halaman 3: Manajemen Data Master & Penugasan (`/users`, `/siswa`, `/kelas`, `/detail-kelas`)
- **Pengguna**: Admin Sekolah.
- **Komponen Wajib**:
  - Tab atau sub-menu untuk berpindah antar-master: **Akun Pengguna**, **Data Guru**, **Kelas & Wali Kelas**, **Data Siswa**, **Data Orang Tua**, **Mata Pelajaran**, **Semester Aktif**, dan **Penugasan Guru Mapel (`detail_kelas`)**.
  - Bilah pencarian instan (berdasarkan NIS, NISN, Nama, atau Email), filter dropdown Kelas/Tingkat (`10`, `11`, `12`), dan tombol **"+ Tambah Data"**.
  - Tabel data dilengkapi badge status (`Aktif`, `Lulus`, `Pindah`, `Keluar`) dan tombol aksi Ubah/Hapus.
  - Pada tab **Semester**, terdapat penanda khusus **"Semester Aktif"** (hanya 1 baris yang boleh aktif pada satu waktu).

### Halaman 4: Formulir Absensi Harian Wali Kelas (`/absensi`)
- **Pengguna**: Wali Kelas.
- **Aturan UX (`NFR-07`)**: Maksimal **3 klik per siswa**, seluruh siswa secara bawaan (*default*) terpilih **Hadir**.
- **Komponen Wajib**:
  - Pemilih **Kelas Binaan** dan **Tanggal Absensi** (default hari ini).
  - Tombol aksi cepat **"Tandai Semua Hadir"** di bagian atas tabel.
  - Tabel daftar siswa kelas:
    - Kolom `No`, `NIS`, `Nama Siswa`, `Status Kehadiran` (*segmented toggle button*: **Hadir** | **Tidak Hadir**), dan `Keterangan Ketidakhadiran` (pilihan radio/pilihan cepat: **Sakit**, **Izin**, **Alpa**).
    - Kolom Keterangan otomatis nonaktif (*disabled*) jika status siswa **Hadir**, dan otomatis aktif serta **wajib dipilih** jika status diubah menjadi **Tidak Hadir** (`AC-03`).
  - Tombol sticky di bawah: **"Simpan Absensi Harian"** (menyimpan sekali klik untuk satu kelas).

### Halaman 5: Grid Input Nilai & Komponen Bobot (`/nilai` & `/komponen-nilai`)
- **Pengguna**: Guru Mata Pelajaran.
- **Komponen Wajib**:
  - Bar filter atas: Pilih **Kelas**, **Mata Pelajaran yang Diampu**, dan **Semester**, ditambah tombol **"Atur Komponen & Bobot Nilai"**.
  - Indikator total bobot komponen: Menampilkan pil komponen (contoh: *Tugas 20% + UTS 35% + PAS 45% = Total 100%*).
  - **Tabel Grid Mirip Spreadsheet**:
    - Kolom tetap di kiri: `No`, `NIS`, `Nama Siswa`.
    - Kolom dinamis untuk setiap komponen penilaian (`Tugas`, `UTS`, `PAS`, `Praktik`) berisi kotak input angka `0–100`.
    - Validasi langsung di sel: menolak angka `< 0`, `> 100`, atau teks dengan bingkai merah (`AC-04`), serta memberi penanda warna kuning/merah lembut untuk nilai di bawah ambang ketuntasan.
    - Kolom paling kanan (otomatis dihitung, *read-only*): **Nilai Akhir Terbobot (Informatif)**.
  - Catatan kaki informasi: *"Rekap nilai ini bersifat informatif dan tidak menggantikan dokumen raport resmi."*
  - Tombol **"Simpan Seluruh Nilai"** dan **"Ekspor ke Excel (.xlsx)"**.

### Halaman 6: Unggah & Kelola Dokumen Raport PDF (`/rapor`)
- **Pengguna**: Wali Kelas.
- **Aturan UX (`NFR-07`)**: Unggah raport maksimal **3 langkah**.
- **Komponen Wajib**:
  - Pemilih **Kelas Binaan** dan **Semester**.
  - Tabel daftar siswa di kelas tersebut dengan kolom: `No`, `NIS`, `Nama Siswa`, `Status Dokumen` (Badge hijau **"Sudah Diunggah"** beserta stempel waktu `diunggah_pada`, atau badge abu-abu/kuning **"Belum Ada Dokumen"**), `Catatan/Keterangan`, dan `Aksi`.
  - Di kolom Aksi setiap baris siswa:
    - Tombol **"Unggah PDF"** (atau **"Unggah Ulang PDF"** jika dokumen sudah ada — disertai keterangan bahwa unggahan baru akan menggantikan berkas lama tanpa duplikasi).
    - Ketentuan validasi berkas terlihat jelas: *Format wajib `.pdf` (`application/pdf`), ukuran maksimal `10 MB`* (`AC-06`, `AC-07`).
    - Tombol **"Pratinjau / Unduh PDF"** jika dokumen sudah tersedia.

### Halaman 7: Monitoring Kelengkapan Raport (`/rapor/monitoring`)
- **Pengguna**: Admin Sekolah & Wali Kelas.
- **Komponen Wajib**:
  - Filter **Kelas** dan **Semester**.
  - Kartu ringkasan progres: **Total Siswa Kelas**, **Sudah Ada Dokumen PDF**, **Belum Ada Dokumen PDF**, dan **Persentase Kelengkapan (%)**.
  - Toggle filter cepat: *"Tampilkan Hanya Siswa yang Belum Memiliki Raport"* (`AC-09`).
  - Tabel daftar siswa lengkap dengan nama guru pengunggah, waktu unggah terakhir, dan tombol unduh berkas.

### Halaman 8: Portal Siswa (`/portal/siswa/:id`)
- **Pengguna**: Siswa (hanya melihat data dirinya sendiri).
- **Komponen Wajib**:
  - Kartu profil siswa: Nama Lengkap, NIS / NISN, Kelas Aktif, dan Nama Wali Kelas.
  - Kartu **Ringkasan Kehadiran Semester Ini**: Persentase kehadiran (`%`), jumlah hari Hadir, Sakit, Izin, dan Alpa.
  - Tabel **Rincian Nilai Mata Pelajaran**: Menampilkan nilai per komponen (`Tugas`, `UTS`, `PAS`) dan Nilai Akhir Informatif untuk setiap mata pelajaran.
  - Kartu **Arsip Dokumen Raport Resmi**: Daftar raport per semester dengan tombol besar **"Unduh Raport PDF"**.

### Halaman 9: Portal Orang Tua — Mobile-First (`/portal/anak`)
- **Pengguna**: Orang Tua / Wali (dirancang khusus *mobile-first* lebar layar `360px–430px`).
- **Komponen Wajib**:
  - **Pemilih Anak (Child Switcher Pill/Dropdown)** di bagian paling atas: Memungkinkan orang tua yang memiliki lebih dari 1 anak di sekolah (relasi `1:M` melalui `siswa.id_orang_tua`) berpindah tampilan antar-anak dengan 1 sentuhan.
  - Kartu **Status Kehadiran Hari Ini** (contoh: *"Hari ini, Selasa 18 Nov 2026: HADIR"* berwarna hijau, atau *"TIDAK HADIR (Sakit)"* berwarna kuning/merah).
  - Kartu **Statistik Kehadiran & Riwayat Ketidakhadiran** bulanan/semester.
  - Kartu **Rekap Nilai Akademik Anak** per mata pelajaran (tampilan akordeon atau kartu ringkas yang nyaman dibaca di layar ponsel).
  - Kartu **Unduh Dokumen Raport Resmi (PDF)** per semester.

### Halaman 10: Pusat Laporan & Ekspor Data (`/laporan/absensi.xlsx` & `/laporan/nilai.xlsx`)
- **Pengguna**: Admin Sekolah & Guru.
- **Komponen Wajib**:
  - Panel filter laporan: Jenis Laporan (**Rekap Absensi** atau **Rekap Nilai**), **Kelas**, **Mata Pelajaran**, **Semester / Bulan Periode**.
  - Tabel pratinjau laporan di layar.
  - Tombol **"Ekspor Excel (.xlsx)"** dan **"Cetak Halaman Laporan"**.

---

## 5. Ringkasan Skema Data (13 Tabel Mengikat)

Seluruh komponen antarmuka di atas terhubung langsung dengan 13 tabel pada basis data **PostgreSQL 16/17**:
1. `users` (`id_users`, `nama`, `email`, `password`, `role`, `status_aktif`, `dibuat_pada`)
2. `guru` (`id_guru`, `id_users`, `nuptk`, `nip`, `bidang_keahlian`, `status_kepegawaian`, `tanggal_masuk`, `no_hp`)
3. `kelas` (`id_kelas`, `nama`, `tingkat`, `id_wali_kelas`)
4. `siswa` (`id_siswa`, `nis`, `nisn`, `nama`, `jenis_kelamin`, `tanggal_lahir`, `id_kelas`, `id_orang_tua`, `status`)
5. `orang_tua` (`id_orang_tua`, `nama`, `email`, `no_hp`)
6. `mata_pelajaran` (`id_mata_pelajaran`, `kode`, `nama`, `kelompok`)
7. `semester` (`id_semester`, `tahun_ajaran`, `semester`, `mulai`, `selesai`, `aktif`)
8. `komponen_nilai` (`id_komponen_nilai`, `id_mata_pelajaran`, `id_semester`, `nama`, `bobot`)
9. `detail_kelas` (`id_detail_kelas`, `id_guru`, `id_kelas`, `id_mata_pelajaran`, `id_semester`)
10. `absensi` (`id_absensi`, `id_siswa`, `id_kelas`, `id_wali_kelas`, `tanggal`, `status`, `keterangan`, `dibuat_pada`)
11. `nilai` (`id_nilai`, `id_siswa`, `id_komponen_nilai`, `nilai`, `id_guru`, `diperbarui_pada`)
12. `rapor` (`id_rapor`, `id_siswa`, `id_semester`, `id_guru`, `file_pdf`, `diunggah_pada`, `keterangan`)
13. `notifikasi_email` (`id_notifikasi_email`, `tipe`, `id_siswa`, `id_absensi`, `id_rapor`, `penerima`, `subjek`, `status`, `percobaan`, `pesan_error`, `dibuat_pada`, `dikirim_pada`)
