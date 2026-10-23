// controllers/trackerController.js
// Node/Express port of the CodeIgniter Tracker controller. Same-origin with the
// application form, so no CORS is involved. JSON endpoints for the form
// (init/autosave/heartbeat/submitted) plus admin endpoints (live_data/live_tracker).

const crypto = require('crypto');
const M = require('../models/trackerModel');

const COOKIE_NAME = 'dice_app_token';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

// Real client IP (honours X-Forwarded-For when behind a reverse proxy / CDN).
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || req.ip || '';
}

// Minimal cookie read (the app doesn't use cookie-parser; the token is primarily
// carried in localStorage + the request body, so this is only a fallback).
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = header.match(new RegExp('(?:^|; )' + esc + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setTokenCookie(req, res, token) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(COOKIE_NAME, token, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });
}

function send(req, res, token, resumed, step) {
  setTokenCookie(req, res, token);
  res.json({
    ok: true,
    resumed,
    token,
    current_step: step || 'stud-info',
  });
}

// POST /tracker/init   body: token (from localStorage), s (from page URL ?s=atlas-9462)
exports.init = async (req, res, next) => {
  try {
    const ip = clientIp(req);
    const ua = req.headers['user-agent'] || '';

    // 1) ?s=atlas-9462 given and valid -> continue that session, no new row.
    const code = (req.body.s || '').trim();
    const id = code ? M.parsePublicCode(code) : null;
    if (id) {
      const target = await M.getSessionById(id);
      if (target && !M.isClosed(target)) {
        await M.resumeSession(target, ip, ua);
        return send(req, res, target.session_token, true, target.current_step);
      }
      // invalid / submitted / merged -> fall through
    }

    // 2) This browser's own session (localStorage token or cookie).
    const given = (req.body.token || '').trim() || readCookie(req, COOKIE_NAME) || '';
    if (given && /^[a-f0-9]{48}$/.test(given)) {
      const mine = await M.getSessionByToken(given);
      if (mine && !M.isClosed(mine)) {
        await M.resumeSession(mine, ip, ua);
        return send(req, res, mine.session_token, true, mine.current_step);
      }
    }

    // 3) Nothing valid -> create a new session.
    const token = crypto.randomBytes(24).toString('hex');
    await M.initSession(token, ip, ua);
    return send(req, res, token, false, 'stud-info');
  } catch (err) {
    next(err);
  }
};

// POST /tracker/autosave
exports.autosave = async (req, res, next) => {
  try {
    const token = (req.body.token || '').trim();
    if (!token) return res.json({ ok: false, reason: 'missing' });

    const data = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      mobile: req.body.mobile,
      email: req.body.email,
      school_id: req.body.school_id,
      certification_id: req.body.certification_id,
      abbrivation_id: req.body.abbrivation_id,
      specialisation_id: req.body.specialisation_id,
      current_step: req.body.current_step,
      progress_percent: parseInt(req.body.progress_percent, 10) || 0,
      step_changed: req.body.step_changed,
      form_data: req.body.form_data || {},
    };

    const r = await M.autosave(token, data);
    if (r.status !== 'ok') {
      return res.json({ ok: false, reason: r.status });
    }
    const merged = await M.mergeDuplicates(r.id, data.mobile, data.email);
    res.json({ ok: true, merged });
  } catch (err) {
    next(err);
  }
};

// POST /tracker/heartbeat
exports.heartbeat = async (req, res, next) => {
  try {
    const token = (req.body.token || '').trim();
    const step = (req.body.current_step || '').trim() || 'stud-info';
    if (token) await M.heartbeat(token, step);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// POST /tracker/submitted
exports.submitted = async (req, res, next) => {
  try {
    const token = (req.body.token || '').trim();
    const appId = (req.body.application_id || '').trim();
    if (token) await M.markSubmitted(token, appId);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: JSON data feed for the dashboard ----
exports.liveData = async (req, res, next) => {
  try {
    const [counts, sessions] = await Promise.all([M.getCounts(), M.getLiveSessions()]);
    res.json({ counts, sessions });
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: render the dashboard view ----
exports.liveTracker = (req, res) => {
  res.render('admin/live_tracker', { title: 'Live Application Tracker', layout: false });
};

// Admin guard placeholder — add your real auth here. Until it is filled in, the
// admin endpoints expose applicant PII, so protect them before going live.
// If TRACKER_ADMIN_TOKEN is set, require ?key=<token> (or x-admin-token header).
exports.requireAdmin = (req, res, next) => {
  const expected = process.env.TRACKER_ADMIN_TOKEN;
  if (!expected) {
    // TODO: replace with your session/login check (the PHP had the same TODO).
    return next();
  }
  const given = req.query.key || req.headers['x-admin-token'];
  if (given === expected) return next();
  return res.status(403).json({ ok: false, reason: 'forbidden' });
};
