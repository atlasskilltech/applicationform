// config/upload.js — multer handlers for the AJAX file endpoints.
//
// The client (application-form.js) uploads a single file under the field name "file"
// to each uploadFile* endpoint. Mirroring the CodeIgniter upload library, files are
// written to the top-level `uploads/` directory under a random ("encrypted") name
// that keeps the original extension; the controller then stashes that filename in the
// session (userfile / tenmarksheet / xiimarksheet / ...), exactly as the CI app did.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(path.resolve(UPLOAD_DIR), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(UPLOAD_DIR)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + ext); // encrypt_name = TRUE
  },
});

// Build a single-file ("file") multer middleware with the given allowed extensions
// and max size (in KB, as CI configured it).
function makeUploader(allowedExts, maxKB) {
  const allowed = allowedExts.map((e) => '.' + e.toLowerCase());
  return multer({
    storage,
    limits: { fileSize: maxKB * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) return cb(null, true);
      cb(new Error('The filetype you are attempting to upload is not allowed.'));
    },
  }).single('file');
}

// One uploader per endpoint, matching the CI allowed_types / max_size.
const uploaders = {
  userfile: makeUploader(['jpg', 'jpeg', 'png'], 20000),              // uploadFile  (profile photo)
  tenmarksheet: makeUploader(['jpg', 'jpeg', 'png', 'pdf'], 102400),  // uploadFile1
  xiimarksheet: makeUploader(['jpg', 'jpeg', 'png', 'pdf'], 102400),  // uploadFile2
  special_assistance_doc: makeUploader(['jpg', 'jpeg', 'png', 'pdf'], 102400), // uploadFile3
  gap_year_certificate: makeUploader(['jpg', 'jpeg', 'png', 'pdf'], 102400),   // uploadFile4
  isdi_summer_certifate: makeUploader(['jpg', 'jpeg', 'png', 'pdf'], 12048),   // uploadURLCerticate
};

module.exports = { uploaders, UPLOAD_DIR };
