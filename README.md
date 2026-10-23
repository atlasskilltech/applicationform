# ATLAS SkillTech University — Application Form

A **Node.js + Express + EJS + MySQL** port of the original CodeIgniter
`isme/application-form-atlas` admission form. The rendered page, field names and
client behaviour match the original exactly; the PHP controller/model were ported to
Express so the app runs standalone against the same existing MySQL databases.

## Stack
- **Node.js + Express** — server & routing
- **EJS** — the form is a standalone page (`views/application-form.ejs`, rendered with `layout:false`)
- **MySQL** via `mysql2` — **two** pools (`diceapp`, `defaultDb`) mirroring the old CI DB groups
- **multer** — AJAX file uploads (stored under `uploads/`, filenames kept in the session)
- **@aws-sdk/client-s3**, **nodemailer** (SendGrid), **axios** (MSG91 SMS, reCAPTCHA, ERP mailer), **puppeteer-core** (PDF)

## Quick start
```bash
npm install
cp .env.example .env      # then fill it in (see below)
npm run dev               # or: npm start
# open http://localhost:3000
```

## Configuration (`.env`)
- **Two databases** — point `DICEAPP_DB_*` (primary admissions DB: schools,
  certifications, specialisations, countries/states/cities, agents, academic years,
  the master `isdi_admsn_appln` + documents) and `DEFAULT_DB_*` (the per-year
  `isdi_admsn_appln_uni` / `isdi_admsn_appln_ay_11` table) at your existing databases.
- **Assets** — `BASE_ASSET_URL` is the base for the logos, hero images, jQuery and
  `script.js` the view pulls in; the production URL renders the page identically.
- **Services** — `AWS_*`/`S3_BUCKET`, `SENDGRID_API_KEY` (+ optional `ERP_MAIL_URL`/
  `ERP_MAIL_COOKIE`), `MSG91_AUTHKEY`/`MSG91_FLOW_ID`, `RECAPTCHA_SECRET`
  (`RECAPTCHA_STRICT=1` to enforce — off by default to match the original).
- `SESSION_SECRET`, `CHROMIUM_PATH` (for the PDF step).

> **Security:** the original PHP had live AWS / SendGrid / MSG91 / reCAPTCHA keys
> hard-coded. They were **not** copied here — put your own in `.env` and **rotate the
> exposed ones**.

## Project layout
```
server.js                         # app entry: sessions, static, routes
config/
  db.js                           # two mysql2 pools (diceapp + defaultDb)
  upload.js                       # per-endpoint multer handlers
controllers/
  applicationController.js        # index + AJAX cascades + uploads + doAdmission
  validation.js                   # CI form_validation + callbacks, ported
models/applicationModel.js        # M_applications getters, status, insert helpers
services/                         # s3, sms, mailer, pdf, recaptcha
routes/application.js             # routes matching the client JS URLs
views/
  application-form.ejs            # the form (ported 1:1 from application-form-atlas.php)
  success.ejs  error.ejs
  mailer/application_email.ejs    # confirmation email body
  pdf/application_details_ug_isme_atlas_view.ejs  # PDF rendered & emailed
public/js/application-form.js     # ported client JS (endpoint URLs repointed to this app)
```

## Routes (match the client JS)
- `GET /` and `GET /:agent` — the form (agent code captured into the session)
- `POST /isme/applications/getCerticiate | getAbbrivation | getSpecialisation | getStateCity | getSchoolList | getAcedemic | getAcedemic2` — cascading-select option JSON
- `POST /applications/getStateCitySchool` — 12th-school lookup
- `POST /isme/applications/uploadFile | uploadFile1..4 | uploadURLCerticate` — file uploads
- `POST /isme/applications/doAdmission` — submission (validation → reCAPTCHA → dual-DB
  insert → document rows + S3 → SMS → email+PDF → status), then the client redirects to `/Payments`
- `GET /Payments` — confirmation landing

## Notes
- No database is bundled; the app connects to your existing schema and does not create tables.
- reCAPTCHA is bypassed by default (as the original forced `success = 1`); set `RECAPTCHA_STRICT=1` to enforce.
- `doAdmissionTesting` / `doAdmissionAcm` / `doAdmission3` mirror `doAdmission`; the ATLAS form submits via `doAdmission`.
