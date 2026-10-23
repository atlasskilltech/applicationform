// models/trackerModel.js
// Node/Express port of the CodeIgniter Session_tracker_model. All reads/writes go
// to the `diceapp` pool (same database group the PHP model used), against the
// dice_application_sessions / dice_application_session_activity tables.
//
// Request-derived values are passed as bound parameters (?) to avoid SQL injection.
// Column lists used in dynamic UPDATEs come from fixed allowlists, never user input.

const axios = require('axios');
const { diceapp } = require('../config/db');

// Sessions in these states are never resumed or autosaved again.
const CLOSED = ['submitted', 'merged'];

// 'Y-m-d H:i:s' in server-local time (mirrors PHP date()).
function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function dateMinusDays(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));
}

// Resolve an IP to approximate city/region/country (best-effort, never throws).
async function geoLookup(ip) {
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip)
  ) {
    return { city: null, region: null, country: null };
  }
  try {
    const { data } = await axios.get('http://ip-api.com/json/' + encodeURIComponent(ip), {
      params: { fields: 'status,country,regionName,city' },
      timeout: 2000,
    });
    if (data && data.status === 'success') {
      return {
        city: data.city || null,
        region: data.regionName || null,
        country: data.country || null,
      };
    }
  } catch (e) {
    /* ignore — geo is non-critical */
  }
  return { city: null, region: null, country: null };
}

function isClosed(sess) {
  return CLOSED.includes(sess.status);
}

// ---------- lookups ----------
async function getSessionByToken(token) {
  const [rows] = await diceapp.query(
    'SELECT * FROM dice_application_sessions WHERE session_token = ? LIMIT 1',
    [token]
  );
  return rows[0] || null;
}

async function getSessionById(id) {
  const [rows] = await diceapp.query(
    'SELECT * FROM dice_application_sessions WHERE id = ? LIMIT 1',
    [parseInt(id, 10)]
  );
  return rows[0] || null;
}

// "atlas-9462" or "atlas-9462-c2f721" -> 9462, anything else -> null
function parsePublicCode(code) {
  const m = String(code || '').trim().match(/^atlas-(\d+)(?:-[a-f0-9]{6})?$/i);
  return m ? parseInt(m[1], 10) : null;
}

function makePublicCode(id) {
  return 'atlas-' + parseInt(id, 10);
}

// ---------- lifecycle ----------
async function initSession(token, ip, ua) {
  const existing = await getSessionByToken(token);
  if (existing) return existing.id;

  const geo = await geoLookup(ip);
  const [res] = await diceapp.query(
    `INSERT INTO dice_application_sessions
      (session_token, ip_address, user_agent, geo_city, geo_region, geo_country,
       started_at, last_activity_at, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      token,
      ip,
      String(ua || '').substring(0, 255),
      geo.city,
      geo.region,
      geo.country,
      now(),
      now(),
      'filling',
    ]
  );
  const id = res.insertId;
  await logActivity(id, 'FORM_OPEN', 'stud-info');
  return id;
}

// Continue an existing session (also revives 'abandoned' ones).
async function resumeSession(sess, ip, ua) {
  await diceapp.query(
    `UPDATE dice_application_sessions
       SET ip_address = ?, user_agent = ?, status = 'filling', last_activity_at = ?
     WHERE id = ?`,
    [ip, String(ua || '').substring(0, 255), now(), sess.id]
  );
  await logActivity(sess.id, 'RESUMED', sess.current_step);
}

// Returns { status: 'ok'|'missing'|'closed', id? }
async function autosave(token, data) {
  const sess = await getSessionByToken(token);
  if (!sess) return { status: 'missing' };
  if (isClosed(sess)) return { status: 'closed' };

  const update = { status: 'filling', last_activity_at: now(), last_saved_at: now() };
  // Only non-empty values are written, so an empty form never wipes saved data.
  const fields = [
    'first_name', 'last_name', 'mobile', 'email', 'school_id',
    'certification_id', 'abbrivation_id', 'specialisation_id', 'current_step',
  ];
  for (const f of fields) {
    if (data[f] !== undefined && data[f] !== '' && data[f] !== null) update[f] = data[f];
  }
  if (data.progress_percent) update.progress_percent = parseInt(data.progress_percent, 10) || 0;
  if (data.form_data && typeof data.form_data === 'object' && Object.keys(data.form_data).length) {
    update.form_data = JSON.stringify(data.form_data);
  }

  const keys = Object.keys(update);
  const setSql = keys.map((k) => `\`${k}\` = ?`).join(', ');
  await diceapp.query(
    `UPDATE dice_application_sessions SET ${setSql} WHERE id = ?`,
    [...keys.map((k) => update[k]), sess.id]
  );

  if (data.step_changed && data.current_step) {
    await logActivity(sess.id, 'STEP_CHANGED', data.current_step);
  }
  return { status: 'ok', id: sess.id };
}

// Same mobile/email in another OPEN session -> mark the older one merged into this one.
async function mergeDuplicates(currentId, mobile, email) {
  mobile = String(mobile || '').trim();
  email = String(email || '').trim();
  const hasMobile = mobile.replace(/\D/g, '').length >= 10;
  const hasEmail = isEmail(email);
  if (!hasMobile && !hasEmail) return 0;

  const params = [parseInt(currentId, 10), dateMinusDays(30)];
  const ors = [];
  if (hasMobile) { ors.push('mobile = ?'); params.push(mobile); }
  if (hasEmail) { ors.push('email = ?'); params.push(email); }

  const [rows] = await diceapp.query(
    `SELECT id FROM dice_application_sessions
      WHERE id != ?
        AND status IN ('filling','idle','abandoned')
        AND started_at >= ?
        AND (${ors.join(' OR ')})`,
    params
  );

  for (const r of rows) {
    await diceapp.query(
      `UPDATE dice_application_sessions SET status = 'merged', merged_into = ? WHERE id = ?`,
      [parseInt(currentId, 10), r.id]
    );
    await logActivity(r.id, 'MERGED', 'into:' + parseInt(currentId, 10));
  }
  return rows.length;
}

async function heartbeat(token, step) {
  await diceapp.query(
    `UPDATE dice_application_sessions
       SET last_activity_at = ?, current_step = ?, status = 'filling'
     WHERE session_token = ? AND status NOT IN (?, ?)`,
    [now(), step, token, CLOSED[0], CLOSED[1]]
  );
}

async function markSubmitted(token, applicationId) {
  await diceapp.query(
    `UPDATE dice_application_sessions
       SET status = 'submitted', application_id = ?, submitted_at = ?
     WHERE session_token = ?`,
    [applicationId, now(), token]
  );
  const sess = await getSessionByToken(token);
  if (sess) await logActivity(sess.id, 'SUBMITTED', 'submit-info');
}

async function logActivity(sessionId, type, step = null) {
  await diceapp.query(
    `INSERT INTO dice_application_session_activity (session_id, activity_type, step, created_at)
     VALUES (?,?,?,?)`,
    [sessionId, type, step, now()]
  );
}

// ---------- admin dashboard (merged rows hidden) ----------
async function getLiveSessions() {
  const [rows] = await diceapp.query(
    `SELECT s.*,
        CONCAT('atlas-', s.id) AS resume_code,
        sc.school_full_name,
        c.certification_name,
        a.abbrivation,
        sp.specialisation_name,
        TIMESTAMPDIFF(SECOND, s.last_activity_at, NOW()) AS idle_seconds,
        CASE
          WHEN s.status = 'submitted' THEN 'submitted'
          WHEN TIMESTAMPDIFF(SECOND, s.last_activity_at, NOW()) <= 60   THEN 'live'
          WHEN TIMESTAMPDIFF(SECOND, s.last_activity_at, NOW()) <= 300  THEN 'idle'
          WHEN TIMESTAMPDIFF(SECOND, s.last_activity_at, NOW()) <= 1800 THEN 'inactive'
          ELSE 'abandoned'
        END AS live_status
      FROM dice_application_sessions s
      LEFT JOIN dice_schools sc        ON sc.school_id = s.school_id
      LEFT JOIN dice_certification c   ON c.certification_id = s.certification_id
      LEFT JOIN dice_abbrivation a     ON a.id = s.abbrivation_id
      LEFT JOIN dice_specialisation sp ON sp.specialisation_id = s.specialisation_id
      WHERE DATE(s.last_activity_at) = CURDATE()
        AND s.status != 'merged'
      ORDER BY s.last_activity_at DESC`
  );
  return rows;
}

async function getCounts() {
  const [rows] = await diceapp.query(
    `SELECT
        SUM(TIMESTAMPDIFF(SECOND,last_activity_at,NOW())<=60 AND status!='submitted') AS live,
        SUM(TIMESTAMPDIFF(SECOND,last_activity_at,NOW()) BETWEEN 61 AND 300 AND status!='submitted') AS idle,
        SUM(status='submitted') AS submitted,
        SUM(TIMESTAMPDIFF(SECOND,last_activity_at,NOW())>1800 AND status!='submitted') AS abandoned,
        COUNT(*) AS total
      FROM dice_application_sessions
      WHERE DATE(last_activity_at)=CURDATE() AND status!='merged'`
  );
  return rows[0];
}

// Cron: flag abandoned sessions.
async function flagAbandoned() {
  const [res] = await diceapp.query(
    `UPDATE dice_application_sessions
        SET status = 'abandoned', abandoned_at = NOW()
      WHERE status IN ('filling','idle')
        AND TIMESTAMPDIFF(SECOND, last_activity_at, NOW()) > 1800`
  );
  return res.affectedRows;
}

module.exports = {
  CLOSED,
  isClosed,
  parsePublicCode,
  makePublicCode,
  getSessionByToken,
  getSessionById,
  initSession,
  resumeSession,
  autosave,
  mergeDuplicates,
  heartbeat,
  markSubmitted,
  logActivity,
  getLiveSessions,
  getCounts,
  flagAbandoned,
};
