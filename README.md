# ATLAS SkillTech University — Application Form

Admission application form rebuilt from the old CodeIgniter app as **Node.js + Express + EJS + MySQL**.

Multi-step form (Program & Profile → Student Details → Education → Parent Details → Declaration) with server-side validation, file uploads (profile photo + marksheets), and a MySQL store.

## Stack
- **Node.js + Express** — server & routing
- **EJS** (+ express-ejs-layouts) — server-rendered views
- **MySQL** via `mysql2` (promise pool)
- **multer** — file uploads

## Quick start

```bash
# 1. install
npm install

# 2. configure
copy .env.example .env        # Windows   (cp .env.example .env on mac/linux)
# then edit .env — point DB_HOST / DB_USER / DB_PASSWORD / DB_NAME at your
# EXISTING ATLAS database (the one that already has your tables)

# 3. run
npm run dev        # auto-reload (nodemon)
#   or
npm start

# open http://localhost:3000
```

## Project layout

```
applicationform/
├── server.js                      # app entry
├── config/
│   ├── db.js                      # MySQL pool  ← point .env at your DB
│   ├── formData.js                # dropdown option lists (swap for DB later)
│   └── upload.js                  # multer file-upload config
├── routes/application.js          # GET / , POST /submit , GET /success
├── controllers/applicationController.js  # validation + request handling
├── models/applicationModel.js     # ← THE INSERT. Edit this for your tables
├── views/                         # EJS: form, success, error, layout
└── public/                        # css, js, uploaded files
```

## Wiring in your EXISTING tables (the two edits that matter)

Everything else can stay as-is. When you share your CodeIgniter tables:

1. **`models/applicationModel.js`** — change the table name and column names in
   the `INSERT`, or switch to the `createAcrossTables()` transaction skeleton at
   the bottom if your data is split across `student` / `education` / `parents`
   tables. This is where the form maps to your schema.

2. **`config/formData.js` + `controller.loadFormData()`** — if your schools,
   programmes, boards, states, cities etc. come from master tables, replace the
   static arrays with `SELECT`s. The views already loop over these lists, so no
   view changes are needed.

The form field names (the `name="..."` attributes in `views/application-form.ejs`)
are the reference when you map the form to your existing columns. Share your table
structure + your CodeIgniter controller/model and I'll wire the INSERT to match.

## Notes
- Server-side validation lives in `controllers/applicationController.js`
  (`validate()`), mirroring the required fields. The client JS is UX only.
- Uploaded files are saved under `public/uploads/` and the DB stores the path.
  For production, move these to object storage (S3 / etc.) and store the URL.
- `.env` and `public/uploads/*` are git-ignored.
