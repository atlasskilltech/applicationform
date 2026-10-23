// config/upload.js — multer setup for file fields (profile image + marksheets)
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
const MAX_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;

// Make sure the upload folder exists.
fs.mkdirSync(path.resolve(UPLOAD_DIR), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(UPLOAD_DIR)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, safe);
  },
});

const allowed = {
  profile_image: ['.jpg', '.jpeg', '.png'],
  class_x_marksheet: ['.pdf', '.jpg', '.jpeg', '.png'],
  class_xii_marksheet: ['.pdf', '.jpg', '.jpeg', '.png'],
};

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = (allowed[file.fieldname] || []).includes(ext);
  if (ok) return cb(null, true);
  cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${(allowed[file.fieldname] || []).join(', ')}`));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

// The three file inputs on the form.
const applicationUpload = upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'class_x_marksheet', maxCount: 1 },
  { name: 'class_xii_marksheet', maxCount: 1 },
]);

module.exports = { applicationUpload };
