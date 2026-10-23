// routes/tracker.js
// Same-origin session tracker, replacing the cross-origin PHP /index.php/tracker/*.
// Mounted at /tracker in server.js (BEFORE the application routes, so the
// application router's catch-all /:agent does not shadow these).
const express = require('express');
const router = express.Router();

const t = require('../controllers/trackerController');

// ---- form-facing JSON endpoints ----
router.post('/init', t.init);
router.post('/autosave', t.autosave);
router.post('/heartbeat', t.heartbeat);
router.post('/submitted', t.submitted);

// ---- admin ----
router.get('/live_data', t.requireAdmin, t.liveData);
router.get('/live_tracker', t.requireAdmin, t.liveTracker);

module.exports = router;
