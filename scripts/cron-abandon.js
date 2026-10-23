// scripts/cron-abandon.js
// Node equivalent of the PHP `tracker cron_abandon` CLI task: flag sessions that
// have had no activity for >30 minutes as abandoned.
//
// Run from cron, e.g. every 5 minutes:
//   */5 * * * * cd /path/to/app && node scripts/cron-abandon.js >> logs/cron-abandon.log 2>&1
require('dotenv').config();

const M = require('../models/trackerModel');

(async () => {
  try {
    const n = await M.flagAbandoned();
    console.log(`[cron-abandon] flagged ${n} session(s) as abandoned at ${new Date().toISOString()}`);
    process.exit(0);
  } catch (err) {
    console.error('[cron-abandon] failed:', err);
    process.exit(1);
  }
})();
