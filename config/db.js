// config/db.js
// MySQL connection pool (mysql2 / promise API).
// Point the .env values at your EXISTING ATLAS database — this file does not
// create or migrate any tables, it only connects.

require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atlas_applications',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true,
});

// promise() gives us async/await (await pool.query(...)).
const db = pool.promise();

// Optional: verify the connection at startup so a bad password fails loudly.
(async () => {
  try {
    const conn = await db.getConnection();
    console.log(`[db] Connected to MySQL "${process.env.DB_NAME}" on ${process.env.DB_HOST}`);
    conn.release();
  } catch (err) {
    console.error('[db] MySQL connection FAILED:', err.code, '-', err.message);
    console.error('[db] Check your .env DB_* values.');
  }
})();

module.exports = db;
