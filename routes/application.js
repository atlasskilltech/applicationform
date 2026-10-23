// routes/application.js
// Paths mirror the URLs the client JS (application-form.js) posts to, so the
// cascading selects, uploads and submission all resolve to this Node app.
const express = require('express');
const router = express.Router();

const { uploaders } = require('../config/upload');
const c = require('../controllers/applicationController');

// Run a per-endpoint multer uploader, turning upload errors into {status:0,error} JSON.
function uploadRoute(uploader, handler) {
  return (req, res, next) =>
    uploader(req, res, (err) => {
      if (err) return res.json({ status: 0, error: err.message });
      handler(req, res, next);
    });
}

// ---- pages ----
router.get('/', c.index);
router.get('/Payments', c.showPayments);

// ---- cascading-select AJAX (isme/applications/*) ----
router.post('/isme/applications/getStateCity', c.getStateCity);
router.post('/isme/applications/getSchoolList', c.getSchoolList);
router.post('/isme/applications/getCerticiate', c.getCerticiate);
router.post('/isme/applications/getAbbrivation', c.getAbbrivation);
router.post('/isme/applications/getAbbrivation1', c.getAbbrivation1);
router.post('/isme/applications/getSpecialisation', c.getSpecialisation);
router.post('/isme/applications/getAcedemic', c.getAcedemic);
router.post('/isme/applications/getAcedemic2', c.getAcedemic2);
// The client calls this one under /applications/ (not /isme/applications/).
router.post('/applications/getStateCitySchool', c.getStateCitySchool);
router.post('/isme/applications/getStateCitySchool', c.getStateCitySchool);

// ---- uploads ----
router.post('/isme/applications/uploadFile', uploadRoute(uploaders.userfile, c.uploadFile));
router.post('/isme/applications/uploadFile1', uploadRoute(uploaders.tenmarksheet, c.uploadFile1));
router.post('/isme/applications/uploadFile2', uploadRoute(uploaders.xiimarksheet, c.uploadFile2));
router.post('/isme/applications/uploadFile3', uploadRoute(uploaders.special_assistance_doc, c.uploadFile3));
router.post('/isme/applications/uploadFile4', uploadRoute(uploaders.gap_year_certificate, c.uploadFile4));
router.post('/isme/applications/uploadURLCerticate', uploadRoute(uploaders.isdi_summer_certifate, c.uploadURLCerticate));

// ---- submission ----
router.post('/isme/applications/doAdmission', c.doAdmission);
router.post('/isme/applications/doAdmissionTesting', c.doAdmissionTesting);
router.post('/isme/applications/doAdmissionAcm', c.doAdmissionAcm);
router.post('/isme/applications/doAdmission3', c.doAdmission3);
router.post('/isme/applications/formSubmit', c.formSubmit);

// ---- agent capture (base_url()/<agentCode>), kept last so it doesn't shadow the above ----
router.get('/admissions/:agent', c.index);
router.get('/:agent', c.index);

module.exports = router;
