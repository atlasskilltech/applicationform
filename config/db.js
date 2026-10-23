// config/db.js
// Two MySQL connection pools (mysql2 / promise API), mirroring the two CodeIgniter
// database groups the original app used:
//
//   - `diceapp`  : the primary admissions database. Almost every read (schools,
//                  certifications, specialisations, countries/states/cities, agents,
//                  academic years) and the master writes (isdi_admsn_appln,
//                  isdi_admsn_documents_uploads, applicant status) go here.
//   - `defaultDb`: the secondary store that receives the per-year application row
//                  (isdi_admsn_appln_uni / isdi_admsn_appln_ay_11) and whose
//                  insert_id drives the application id.
//
// Point the .env values at your EXISTING ATLAS databases — this file only connects,
// it never creates or migrates tables.

require('dotenv').config();
const mysql = require('mysql2');

function makePool(prefix, fallbackName) {
  return mysql.createPool({
    host: process.env[`${prefix}_DB_HOST`] || process.env.DB_HOST || 'localhost',
    port: Number(process.env[`${prefix}_DB_PORT`] || process.env.DB_PORT) || 3306,
    user: process.env[`${prefix}_DB_USER`] || process.env.DB_USER || 'root',
    password: process.env[`${prefix}_DB_PASSWORD`] || process.env.DB_PASSWORD || '',
    database: process.env[`${prefix}_DB_NAME`] || process.env.DB_NAME || fallbackName,
    waitForConnections: true,
    connectionLimit: Number(process.env[`${prefix}_DB_CONNECTION_LIMIT`] || process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    dateStrings: true,
  }).promise();
}

const diceapp = makePool('DICEAPP', 'diceapp');
const defaultDb = makePool('DEFAULT', 'atlas_applications');

// Verify both connections at startup so a bad password fails loudly (but never crashes).
(async () => {
  for (const [name, pool] of [['diceapp', diceapp], ['default', defaultDb]]) {
    try {
      const conn = await pool.getConnection();
      console.log(`[db] Connected to MySQL group "${name}"`);
      conn.release();
    } catch (err) {
      console.error(`[db] MySQL group "${name}" connection FAILED:`, err.code, '-', err.message);
      console.error('[db] Check your .env DB_* values.');
    }
  }
})();

module.exports = { diceapp, defaultDb };
