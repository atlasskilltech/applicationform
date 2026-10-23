// server.js — app entry point
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

const applicationRoutes = require('./routes/application');
const trackerRoutes = require('./routes/tracker');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- View engine (EJS + layouts) ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout'); // standalone pages pass { layout: false }

// ---- Body parsing (multipart is handled per-route by multer) ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---- Session (the upload endpoints stash filenames here; doAdmission reads them) ----
app.use(session({
  secret: process.env.SESSION_SECRET || 'atlas-application-form-dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 4 },
}));

// ---- Static assets ----
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

// ---- Routes ----
// Tracker is mounted first so the application router's catch-all /:agent
// (which would otherwise swallow /tracker/*) does not shadow it.
app.use('/tracker', trackerRoutes);
app.use('/', applicationRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', message: 'The page you are looking for does not exist.', layout: false });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error('[error]', err);
  const isMulter = err && err.code && String(err.code).startsWith('LIMIT_');
  res.status(isMulter ? 400 : 500).render('error', {
    title: 'Error',
    message: isMulter ? err.message : 'Something went wrong. Please try again.',
    layout: false,
  });
});

app.listen(PORT, () => {
  console.log(`[server] ATLAS application form running on http://localhost:${PORT}`);
});
