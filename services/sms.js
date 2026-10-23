// services/sms.js — transactional SMS to the applicant + parents via MSG91.
// Port of M_applications::sendSMSToApplication. authkey / flow id / sender come
// from the environment.
const axios = require('axios');
const M = require('../models/applicationModel');

async function sendSMSToApplication(applnID) {
  const authkey = process.env.MSG91_AUTHKEY;
  const flowId = process.env.MSG91_FLOW_ID || '618ba2c0ca875b601c4fe9a3';
  const sender = process.env.MSG91_SENDER || 'ATLASU';
  if (!authkey) {
    console.warn('[sms] MSG91_AUTHKEY not configured — skipping SMS for', applnID);
    return false;
  }

  try {
    const numbers = await M.getMobileNos(applnID);
    if (!numbers || !numbers.length) return false;

    const recipients = numbers.map((n) => ({ mobiles: '91' + n, ID: String(applnID) }));
    await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      { sender, flow_id: flowId, recipients },
      { headers: { authkey, 'content-type': 'application/json' } }
    );
    return true;
  } catch (err) {
    console.error('[sms] send failed for', applnID, '-', err.message);
    return false;
  }
}

module.exports = { sendSMSToApplication };
