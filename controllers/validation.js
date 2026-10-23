// controllers/validation.js
// Port of the CodeIgniter form_validation rules + custom callbacks used by
// doAdmission(). Returns an ordered { field: message } object (empty = valid),
// matching the shape the client JS expects (res.error keyed by field id, with
// special handling for accept / special_accept / dob).
const M = require('../models/applicationModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^((?!(0))[0-9]{10})$/; // 10 digits, not starting with 0
const NAME_RE = /^[a-zA-Z ]+$/;
const DOMAIN_RE = /^[a-z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu\.in|in|co\.in)$/i;

const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';

function parseYMD(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

function yearsBetween(cutoff, dob) {
  let age = cutoff.getFullYear() - dob.getFullYear();
  const md = (d) => (d.getMonth() + 1) * 100 + d.getDate();
  if (md(cutoff) < md(dob)) age--;
  return age;
}

// age-on-cutoff check (check_age_new)
async function checkAgeNew(dob, cert, academicYearId) {
  if (String(cert) !== '1' && String(cert) !== '7') return null;
  if (!has(academicYearId)) return 'Please select Academic Year.';
  const yd = await M.getAcademicYearDetails(academicYearId);
  if (!yd || !yd.year_cuttoff_date || yd.year_cuttoff_date === '0000-00-00') {
    return 'Cutoff date is not configured for the selected academic year.';
  }
  if (!has(dob)) return 'Date of Birth is required.';
  const dobObj = parseYMD(dob);
  if (!dobObj) return 'Invalid Date of Birth format. Use YYYY-MM-DD.';
  if (dobObj > new Date()) return 'Date of Birth cannot be in the future.';
  const cutoffObj = parseYMD(yd.year_cuttoff_date);
  const age = yearsBetween(cutoffObj, dobObj);
  if (age >= 20) return 'Applicant must be less than 21 years old on or before 31st Dec';
  return null;
}

// Main validator. `session` carries the uploaded filenames (userfile, tenmarksheet…).
async function validateAdmission(b, session = {}) {
  const errors = {};
  const set = (field, msg) => { if (!(field in errors)) errors[field] = msg; };
  const g = (k) => (b[k] === undefined ? '' : b[k]);

  // Each entry runs in order; the first failing rule for a field wins (like form_error()).
  async function field(name, label, checks) {
    for (const check of checks) {
      const msg = await check(g(name), label);
      if (msg) { set(name, msg); return; }
    }
  }
  const required = (label) => (v) => (has(v) ? null : `The ${label} field is required.`);
  const email = (label) => (v) => (!has(v) || EMAIL_RE.test(v) ? null : `The ${label} field must contain a valid email address.`);
  const natural = (label) => (v) => (!has(v) || /^\d+$/.test(v) ? null : `The ${label} field must only contain numbers.`);
  const exactLen = (label, n) => (v) => (!has(v) || String(v).length === n ? null : `The ${label} field must be exactly ${n} characters in length.`);
  const regex = (label, re) => (v) => (!has(v) || re.test(v) ? null : `The ${label} field is not in the correct format.`);
  const validDomain = () => (v) => (!has(v) || DOMAIN_RE.test(v) ? null : 'Please enter Valid Email / Valid Email Domain.');
  const fileInSession = (key, msg) => () => (session[key] ? null : msg);

  const school = g('school'); const cert = g('certification'); const abbr = g('abbrivation');
  const paramsEmail = `${school}-${g('specialisation')}-${abbr}-appln_email`;
  const paramsPhone = `${school}-${g('specialisation')}-${abbr}-appln_phone`;

  const uniquePhone = (label) => async (v) => {
    if (!has(v)) return null;
    try { return (await M.validationUnique(v, paramsPhone)) ? null : `The ${label} field must contain a unique value`; }
    catch (_) { return null; }
  };
  const uniqueEmail = (label) => async (v) => {
    if (!has(v)) return null;
    try { return (await M.validationUnique(v, paramsEmail)) ? null : `The ${label} field must contain a unique value`; }
    catch (_) { return null; }
  };

  // ---- core fields (same order as the controller) ----
  await field('academicYear', 'Academic Year', [required('Academic Year')]);
  await field('school', 'School', [required('School')]);
  await field('certification', 'Programmes', [required('Programmes')]);
  await field('abbrivation', 'Degree', [required('Degree')]);
  await field('source', 'Source', [required('Source')]);
  if (!session.userfile) set('userfile', 'Please upload a profile photo.');
  await field('lastName', 'Last Name', [required('Last Name'), regex('Last Name', NAME_RE)]);
  await field('firstName', 'First Name', [required('First Name'), regex('First Name', NAME_RE)]);
  await field('middleName', 'Middle Name', [regex('Middle Name', NAME_RE)]);
  await field('address_un_1', 'Your Address', [required('Your Address')]);
  await field('country_un_1', 'Your Country', [required('Your Country')]);
  await field('state_un_1', 'Your State', [required('Your State')]);
  await field('city_un_1', 'Your City', [required('Your City')]);
  await field('pin_code_1', 'Your Pin Code', [required('Your Pin Code')]);
  await field('phone', 'Mobile', [required('Mobile'), natural('Mobile'), exactLen('Mobile', 10), regex('Mobile', PHONE_RE), uniquePhone('Mobile')]);
  await field('email', 'Email', [required('Email'), email('Email'), uniqueEmail('Email'), validDomain()]);
  {
    const dobMsg = await checkAgeNew(g('dob'), cert, g('academicYear'));
    if (!has(g('dob'))) set('dob', 'The Date of Birth field is required.');
    else if (dobMsg) set('dob', dobMsg);
  }
  await field('gender', 'Gender', [required('Gender')]);
  await field('blood', 'Blood Group', [required('Blood Group')]);
  await field('fatherFirstName', 'Father Name', [required('Father Name')]);
  await field('fatherOccupation', 'Father Occupation', [required('Father Occupation')]);
  await field('fatherOrganizationName', 'Father Organization Name', [required('Father Organization Name')]);
  await field('fatherPhone', 'Father Phone', [required('Father Phone'), regex('Father Phone', PHONE_RE)]);
  await field('fatherEmail', 'Father Email', [required('Father Email'), email('Father Email'), validDomain()]);
  await field('motherFirstName', 'Mother Name', [required('Mother Name')]);
  await field('motherOccupation', 'Mother Occupation', [required('Mother Occupation')]);
  await field('motherOrganizationName', 'Mother Organization Name', [required('Mother Organization Name')]);
  await field('motherPhone', 'Mother Phone', [required('Mother Phone'), regex('Mother Phone', PHONE_RE)]);
  await field('motherEmail', 'Mother Email', [required('Mother Email'), email('Mother Email'), validDomain()]);
  await field('institutionNameHS', 'Institution Name', [required('Institution Name')]);
  await field('marksSecuredHS', 'Marks Secured', [required('Marks Secured')]);
  await field('academicYearHS', 'Academic Year', [required('Academic Year')]);
  await field('examinationBoardHS', 'Examination Board', [required('Examination Board')]);
  await field('streamHSS', 'Class XII- Academic Stream', [required('Class XII- Academic Stream')]);
  await field('academicYearHSS', 'Academic Year', [required('Academic Year')]);
  await field('examinationBoardHSS', 'Examination Board', [required('Examination Board')]);
  await field('state_12_school', '12th School State', [required('12th School State')]);
  await field('city_12_school', '12th School City', [required('12th School City')]);
  await field('institutionNameHSS_school_id', '12th School School', [required('12th School School')]);
  await field('instgram', 'Instagram', [required('Instagram')]);
  await field('accept', 'Accept', [required('Accept')]);

  // ---- conditional rules ----
  if (String(cert) === '1') {
    if (!session.tenmarksheet) set('tenmarksheet', 'Please Upload 10th Marksheet');
    await field('special_assistance', 'Special Learning Assistance', [required('Special Learning Assistance')]);
    if (g('special_assistance') === 'Yes' && !session.special_assistance_doc) {
      set('special_assistance_doc', 'Please Upload Special Assistance Document');
    }
    if (Number(g('academicYearHSS')) <= 20 && !session.gap_year_certificate) {
      set('gap_year_certificate', 'Please Upload Gap Year Certificate');
    }
    await field('isPersuingUG', 'Have you completed or are you currently studying Mathematics in Grade 12',
      [required('Have you completed or are you currently studying Mathematics in Grade 12')]);
  } else {
    await field('marksSecuredHS', 'Marks Secured', [required('Marks Secured')]);
  }

  if (g('full_time_member') === 'Yes') {
    await field('member_employee_id', 'Employee ID', [required('Employee ID')]);
    await field('member_email_id', 'Official Email', [
      required('Official Email'),
      email('Official Email'),
      async (v) => {
        if (!has(v)) return null;
        try {
          const params = `${g('member_employee_id')}-member_email_id`;
          return (await M.validationUniqueStaff(v, params)) ? null : 'Invalid Employee ID and Official Email';
        } catch (_) { return null; }
      },
    ]);
  }

  // Specialisation required unless one of the special school/cert combos.
  const sc = Number(school); const cc = Number(cert);
  if (!((sc === 8 && cc === 1) || (sc === 16 && cc === 7) || (sc === 16 && cc === 4))) {
    await field('specialisation', 'Specialisation', [required('Specialisation')]);
  }

  return errors;
}

module.exports = { validateAdmission };
