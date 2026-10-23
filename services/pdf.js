// services/pdf.js — render an EJS view to a PDF file (replaces the CI mPDF step).
// Uses puppeteer-core driven at a system Chromium (the cloud image ships one at
// /opt/pw-browsers; override with CHROMIUM_PATH). Output mirrors the original:
//   pdf/applications/<applnID>.pdf
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const OUT_DIR = path.resolve('pdf/applications');

function resolveChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) {}
  }
  return null;
}

// Render a view to HTML, then to a PDF saved at pdf/applications/<applnID>.pdf.
// Returns the absolute pdf path, or null if PDF generation is unavailable.
async function createApplicationDetailsPDF(applnID, view, data) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer-core');
  } catch (_) {
    console.warn('[pdf] puppeteer-core not installed — skipping PDF for', applnID);
    return null;
  }

  const exe = resolveChromium();
  if (!exe) {
    console.warn('[pdf] no Chromium found (set CHROMIUM_PATH) — skipping PDF for', applnID);
    return null;
  }

  try {
    const html = await ejs.renderFile(path.resolve('views', view + '.ejs'), data, { async: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, applnID + '.pdf');

    const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: outPath, format: 'A4', printBackground: true });
    } finally {
      await browser.close();
    }
    return outPath;
  } catch (err) {
    console.error('[pdf] generation failed for', applnID, '-', err.message);
    return null;
  }
}

module.exports = { createApplicationDetailsPDF };
