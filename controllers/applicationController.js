// controllers/applicationController.js
// Node port of the CodeIgniter isme/Applications controller: renders the form,
// serves the dropdown-cascade + upload AJAX endpoints, and runs the full
// doAdmission() submission pipeline.
const M = require('../models/applicationModel');
const { validateAdmission } = require('./validation');
const recaptcha = require('../services/recaptcha');
const s3 = require('../services/s3');
const sms = require('../services/sms');
const mailer = require('../services/mailer');

const BASE_ASSET_URL = process.env.BASE_ASSET_URL || 'https://www.atlasuniversity.edu.in/applicationform/';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// ---- small helpers for the {option} JSON the client injects into selects ----
function opt(value, text) { return `<option value='${value}'>${text}</option>`; }
function optionsFrom(rows, valueKey, textKey) {
  let s = "<option value=''>Please Select</option>";
  (rows || []).forEach((r) => { s += opt(r[valueKey], r[textKey]); });
  return s;
}
function extOf(name) { const i = String(name || '').lastIndexOf('.'); return i >= 0 ? String(name).slice(i + 1) : ''; }
function ucwords(s) { return String(s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }

// ============================ PAGE ============================
exports.index = async (req, res, next) => {
  try {
    // Agent capture (…/<agentCode>): store in session, or bounce home if unknown.
    const agentCode = req.params.agent;
    if (agentCode) {
      const agent = await M.getAgent(agentCode);
      if (agent) req.session.agent = agent;
      else return res.redirect('/');
    }

    req.session.userfile = undefined; // CI unsets userfile on page load
    const agent = req.session.agent || null;

    const [countries, schools, certification, acedmic, state] = await Promise.all([
      M.getCountries(),
      M.getSchoolForUni(0, agent),
      M.getCertificationForUni(agent),
      M.getAcedmicYear(),
      M.getStateCity(99, 'state'),
    ]);

    res.render('application-form', {
      layout: false,
      baseUrl: BASE_ASSET_URL,
      agent,
      countries, schools, certification, acedmic, state,
      abrivation: [], specialisations: [],
    });
  } catch (err) { next(err); }
};

exports.showPayments = (req, res) => {
  res.render('success', { title: 'Application Submitted', layout: false, applnID: req.session.applnID || '' });
};

// ====================== AJAX: cascading selects ======================
exports.getStateCity = async (req, res, next) => {
  try {
    const { value, type } = req.body;
    const rows = await M.getStateCity(value, type);
    let option = "<option value=''>Please Select</option>";
    if (rows && rows.length) rows.forEach((r) => { option += opt(r.id, r.name); });
    else option += "<option value='-1'>Others</option>";
    res.json({ option });
  } catch (err) { next(err); }
};

exports.getStateCitySchool = async (req, res, next) => {
  try {
    const rows = await M.getStateCitySchool(req.body.value);
    res.json({ option: optionsFrom(rows, 'id', 'name') });
  } catch (err) { next(err); }
};

exports.getAcedemic = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value && Number(value) !== 0) req.session.ac_year = value; // mirror getSchoolForUni session side-effect
    const rows = await M.getSchoolForUni(value, req.session.agent || null);
    res.json({ option: optionsFrom(rows, 'school_id', 'school_full_name') });
  } catch (err) { next(err); }
};

exports.getAcedemic2 = async (req, res, next) => {
  try {
    const rows = await M.getSpecialisationsForUni2(req.body.certification, req.body.school);
    res.json({ option: optionsFrom(rows, 'specialisation_id', 'specialisation_name') });
  } catch (err) { next(err); }
};

exports.getAbbrivation = async (req, res, next) => {
  try {
    const value = req.body.value;     // certification id
    const school = req.body.school;
    const acYear = req.session.ac_year || 0;
    const rows = await M.getAbrivationForUni(value, school, acYear, req.session.agent || null);

    let option = "<option value=''>Please Select</option>";
    (rows || []).forEach((r) => {
      let label = r.abbrivation;
      if (label === 'BBA' && String(school) === '8') label = 'BBA / BBA (Hons)';
      if (label === 'B.Sc (Hons)' && String(school) === '8') label = 'B.Sc / B.Sc (Hons)';
      option += opt(r.id, label);
    });
    if (String(school) === '8' && String(value) === '1') {
      option += opt('396', 'BBA International Accounting & Finance');
    }
    res.json({ option });
  } catch (err) { next(err); }
};

exports.getAbbrivation1 = async (req, res, next) => {
  try {
    const { value, school } = req.body;
    const rows = await M.getAbrivationForUni(value, school, req.session.ac_year || 0, req.session.agent || null);
    let option = optionsFrom(rows, 'id', 'abbrivation');

    const appData = req.session.applicantData;
    if (appData) {
      const schoool = Number(appData.appln_school);
      const applnId = Number(appData.appln_id);
      const spec = Number(appData.appln_specialisation);
      if (schoool === 1) {
        option = "<option value=''>Please Select</option>";
        if (applnId >= 800000 && applnId < 900000) option += opt('2', 'B.Voc');
        if (applnId >= 900000 && applnId < 1000000) option += opt('1', 'B.Des');
      }
      if (schoool === 2 && (spec === 33 || spec === 34)) {
        option = "<option value=''>Please Select</option>";
        if (applnId >= 900000 && applnId <= 1000000) option += opt('5', 'MBA');
      }
      if (schoool === 6) {
        option = "<option value=''>Please Select</option>";
        if (spec === 30) option += opt('6', 'B.A (Hons.)');
        if (spec === 29) option += opt('2', 'B.Voc');
      }
    }
    res.json({ option });
  } catch (err) { next(err); }
};

exports.getSpecialisation = async (req, res, next) => {
  try {
    const { value, school, certification } = req.body; // value = abbrivation
    const rows = await M.getSpecialisationsForUni(value, certification, school);
    res.json({ option: optionsFrom(rows, 'specialisation_id', 'specialisation_name') });
  } catch (err) { next(err); }
};

exports.getCerticiate = async (req, res, next) => {
  try {
    const { value } = req.body; // value = school id
    const rows = await M.getCerticiateForUni(value, req.session.agent || null);
    res.json({ option: optionsFrom(rows, 'certification_id', 'certification_name') });
  } catch (err) { next(err); }
};

exports.getSchoolList = async (req, res, next) => {
  try {
    const rows = await M.getSchoolListForUni(req.body.value, req.session.agent || null);
    res.json({ option: optionsFrom(rows, 'school_id', 'school_name') });
  } catch (err) { next(err); }
};

// ====================== AJAX: uploads ======================
// (multer runs in the route; here we just stash the saved filename in the session.)
function makeUploadHandler(sessionKey) {
  return (req, res) => {
    if (req.file) {
      req.session[sessionKey] = req.file.filename;
      return res.json({ status: 1, file_name: req.file.filename, [sessionKey]: req.file.filename });
    }
    res.json({ status: 0, error: 'The file you are attempting to upload could not be saved.' });
  };
}
exports.uploadFile = makeUploadHandler('userfile');
exports.uploadFile1 = makeUploadHandler('tenmarksheet');
exports.uploadFile2 = makeUploadHandler('xiimarksheet');
exports.uploadFile3 = makeUploadHandler('special_assistance_doc');
exports.uploadFile4 = makeUploadHandler('gap_year_certificate');
exports.uploadURLCerticate = makeUploadHandler('isdi_summer_certifate');

// ====================== SUBMISSION ======================
exports.doAdmission = async (req, res, next) => {
  try {
    const b = req.body;
    const session = req.session;

    // 1) Validation (CI form_validation parity).
    const errors = await validateAdmission(b, session);
    if (Object.keys(errors).length > 0) {
      return res.json({ status: 0, error: errors });
    }

    // 2) reCAPTCHA (bypassed by default to match the original).
    const ok = await recaptcha.verify(b.captcha);
    if (!ok) return res.json({ status: 0, error: { captcha: 'Please verify the captcha.' } });

    // 3) Build insertData by reflecting isdi_admsn_appln columns (strip appln_ prefix).
    const diceCols = await M.listFields(M.pools.diceapp, 'isdi_admsn_appln');
    const insertData = {};
    for (const col of diceCols) {
      const bodyField = col.replace(/^appln_/, '');
      const v = b[bodyField];
      if (v !== undefined && v !== null && String(v) !== '') insertData[col] = v;
    }

    // school / certification / degree special cases.
    const appln_school = insertData.appln_school;
    const appln_certification = insertData.appln_certification;
    const degree = insertData.appln_abbrivation;
    if (String(appln_school) === '8' && String(appln_certification) === '1' && String(degree) === '4') {
      insertData.appln_specialisation = 101; insertData.appln_abbrivation = 4;
    }
    if (String(appln_school) === '8' && String(appln_certification) === '1' && String(degree) === '396') {
      insertData.appln_specialisation = 396; insertData.appln_abbrivation = 4;
    }

    insertData.appln_DateTime = new Date();

    // 4) Insert into the default (per-year) table, filtered to that table's columns.
    const academicYear = insertData.appln_academicYear;
    let perYearTable = null;
    if (String(academicYear) === '10') perYearTable = 'isdi_admsn_appln_uni';
    else if (String(academicYear) === '11') perYearTable = 'isdi_admsn_appln_ay_11';

    // Filter against the per-year table's OWN columns (it has a reduced schema
    // compared with the master isdi_admsn_appln), otherwise master-only columns
    // like appln_school leak into the INSERT and MySQL throws ER_BAD_FIELD_ERROR.
    const insertData1 = {};
    if (perYearTable) {
      const defaultCols = await M.listFields(M.pools.defaultDb, perYearTable);
      for (const k of Object.keys(insertData)) if (defaultCols.includes(k)) insertData1[k] = insertData[k];
    }

    // agent referral.
    const agent = session.agent;
    if (agent) {
      insertData1.appln_refName = agent.name; insertData1.appln_refEmail = agent.email; insertData1.appln_refPhone = agent.phone;
      insertData.appln_refName = agent.name; insertData.appln_refEmail = agent.email; insertData.appln_refPhone = agent.phone;
    }
    session.agent = undefined;

    insertData1.appln_userfile = session.userfile;

    let applnID;
    if (perYearTable) applnID = await M.insert(M.pools.defaultDb, perYearTable, insertData1);

    // 5) Insert master row into diceapp with the same appln_id.
    insertData.appln_masterID = applnID;
    insertData.appln_id = applnID;
    insertData.appln_firstName = ucwords(insertData.appln_firstName);
    insertData.appln_lastName = ucwords(insertData.appln_lastName);

    if (session.isdi_summer_certifate) {
      insertData.appln_summer_doc = 'summer_v1.' + extOf(session.isdi_summer_certifate);
    }
    await M.insert(M.pools.diceapp, 'isdi_admsn_appln', insertData);

    // 6) Document rows + S3 uploads.
    const docDir = UPLOAD_DIR;
    async function saveDoc(docId, baseName, sessionKey) {
      const stored = session[sessionKey];
      if (!stored) return;
      const fileName = `${baseName}.${extOf(stored)}`;
      await M.insert(M.pools.diceapp, 'isdi_admsn_documents_uploads', {
        doc_upload_appln_id: applnID, doc_upload_doc_id: docId, doc_upload_file_name: fileName,
        doc_upload_version: 1, doc_upload_datetime: new Date(),
      });
      await s3.uploadToAmazonS3(applnID, fileName, `${docDir}/${stored}`);
    }
    await saveDoc(1, 'photo_v1', 'userfile');
    if (String(insertData.appln_certification) === '1' || session.tenmarksheet) await saveDoc(2, 'marklist_10', 'tenmarksheet');
    if (session.xiimarksheet) await saveDoc(3, 'marklist_12', 'xiimarksheet');
    if (session.special_assistance_doc) await saveDoc(110, 'special_assistance_doc', 'special_assistance_doc');
    if (session.gap_year_certificate) await saveDoc(55, 'gap_certificate', 'gap_year_certificate');
    if (session.isdi_summer_certifate) {
      await s3.uploadToAmazonS3(applnID, 'summer_v1.' + extOf(session.isdi_summer_certifate), `${docDir}/${session.isdi_summer_certifate}`);
    }

    // 7) SMS + email + status.
    await sms.sendSMSToApplication(applnID);
    await mailer.sendApplicationEmail(applnID);

    session.userfile = undefined;
    session.applnID = applnID;

    await M.setStatus(applnID, 1);

    res.json({ status: 1, applnID });
  } catch (err) { next(err); }
};

// Secondary submit variants in the original JS. The ATLAS form submits via
// doAdmission2 -> doAdmission; these mirrors keep the other buttons working.
exports.doAdmissionTesting = exports.doAdmission;
exports.doAdmissionAcm = exports.doAdmission;
exports.doAdmission3 = exports.doAdmission;

// Footer enquiry form (submitFooter -> formSubmit). The client ignores the body
// and redirects to the thank-you page; we send the enquiry email best-effort.
exports.formSubmit = async (req, res) => {
  try {
    const b = req.body;
    if (mailer.sendEnquiry) await mailer.sendEnquiry(b);
  } catch (err) { console.error('[formSubmit]', err.message); }
  res.json({ status: 1 });
};
