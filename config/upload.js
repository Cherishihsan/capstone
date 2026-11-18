const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Penyimpanan di luar webroot (public/) sesuai NFR-04 & Bagian 10.1
const storageDir = path.resolve(
  __dirname,
  '..',
  process.env.RAPOR_STORAGE_DIR || 'storage/rapor'
);

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const MAX_FILE_SIZE_BYTES = (Number(process.env.RAPOR_MAX_SIZE_MB) || 10) * 1024 * 1024; // Default 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const idSiswa = req.body.id_siswa || 'siswa';
    const idSemester = req.body.id_semester || 'sem';
    const timestamp = Date.now();
    const safeName = `rapor_siswa_${idSiswa}_sem_${idSemester}_${timestamp}.pdf`;
    cb(null, safeName);
  }
});

// Validasi tipe MIME & ekstensi PDF sesuai FR-10, NFR-04, dan AC-06
function pdfFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (ext !== '.pdf' || mime !== 'application/pdf') {
    const err = new Error('Berkas ditolak: Hanya dokumen berformat PDF (.pdf) dengan tipe MIME application/pdf yang diperbolehkan.');
    err.status = 400;
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }
  cb(null, true);
}

const uploadRaporPdf = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: pdfFileFilter
});

module.exports = {
  storageDir,
  MAX_FILE_SIZE_BYTES,
  pdfFileFilter,
  uploadRaporPdf
};
