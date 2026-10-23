// services/mailer.js — application confirmation email.
// Two paths, exactly like the CI controller:
//   autoEmail()  : POST to the ERP MasterMail endpoint. If it returns status 1 we
//                  are done. Otherwise fall back to _sendEmail().
//   _sendEmail() : SendGrid SMTP (nodemailer) with the generated PDF attached.
const axios = require('axios');
const nodemailer = require('nodemailer');
const M = require('../models/applicationModel');
const { createApplicationDetailsPDF } = require('./pdf');

// POST to the ERP mailer. Returns the parsed body on status 1, else false.
async function autoEmail(applnID) {
  const url = process.env.ERP_MAIL_URL || 'https://atlasskilltech.app/erp/MasterMail/send';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.ERP_MAIL_COOKIE) headers.Cookie = process.env.ERP_MAIL_COOKIE;
    const res = await axios.post(
      url,
      { applnID: String(applnID), stage: '1', is_reminder: '0', reminder_stage: '0', attechment: '' },
      { headers }
    );
    if (res.data && res.data.status == 1) return res.data;
    return false;
  } catch (err) {
    console.error('[mailer] autoEmail failed for', applnID, '-', err.message);
    return false;
  }
}

function transport() {
  const pass = process.env.SENDGRID_API_KEY;
  if (!pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER || 'apikey', pass },
  });
}

// SendGrid fallback — mirrors _sendEmail(): applicant + parents, cc school +
// specialisation, bcc tech + specialisation bcc, PDF attached.
async function _sendEmail(applnID) {
  const tx = transport();
  if (!tx) {
    console.warn('[mailer] SENDGRID_API_KEY not configured — skipping email for', applnID);
    return false;
  }
  try {
    const emails = await M.getEmailIDs(applnID);
    const basic = await M.basicApplnDetails(applnID);
    if (!basic) return false;

    const schoolEmail = basic.school_email;
    const schoolEmailCc = basic.specialisation_email;
    const bcc = basic.specialisation_bcc_email;

    const details = await M.allApplnDetailsUpdate(applnID);
    const pdfPath = await createApplicationDetailsPDF(applnID, 'pdf/application_details_ug_isme_atlas_view', { details });

    const ejs = require('ejs');
    const path = require('path');
    const html = await ejs.renderFile(path.resolve('views/mailer/application_email.ejs'), { details }, { async: true });

    await tx.sendMail({
      from: `"ATLAS" <${schoolEmail}>`,
      to: (emails && emails.length) ? emails : schoolEmail,
      replyTo: schoolEmailCc,
      cc: [schoolEmail, schoolEmailCc].filter(Boolean),
      bcc: ['tech@atlasuniversity.edu.in', bcc].filter(Boolean),
      subject: `Application Received — ${applnID}`,
      html,
      attachments: pdfPath ? [{ filename: `${applnID}.pdf`, path: pdfPath }] : [],
    });
    return true;
  } catch (err) {
    console.error('[mailer] _sendEmail failed for', applnID, '-', err.message);
    return false;
  }
}

// What the controller calls: try ERP first, fall back to SendGrid.
async function sendApplicationEmail(applnID) {
  const sent = await autoEmail(applnID);
  if (!sent) await _sendEmail(applnID);
  return true;
}

module.exports = { autoEmail, _sendEmail, sendApplicationEmail };
