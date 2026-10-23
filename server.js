// server.js — app entry point
require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const applicationRoutes = require('./routes/application');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- View engine (EJS + layouts) ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout'); // views/partials/layout.ejs wraps every page

// ---- Body parsing (multipart is handled per-route by multer) ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---- Static assets ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Routes ----
app.use('/', applicationRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error('[error]', err);
  const isMulter = err && err.code && String(err.code).startsWith('LIMIT_');
  res.status(isMulter ? 400 : 500).render('error', {
    title: 'Error',
    message: isMulter ? err.message : 'Something went wrong. Please try again.',
  });
});

app.listen(PORT, () => {
  console.log(`[server] ATLAS application form running on http://localhost:${PORT}`);
});
