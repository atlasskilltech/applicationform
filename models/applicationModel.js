// models/applicationModel.js
// Port of the CodeIgniter M_applications model. Reads go to the `diceapp` pool;
// the per-year application row is written to the `defaultDb` pool (whose insert id
// drives the application id), exactly as the original dual-group app did.
//
// Values that came from the request are passed as bound parameters (?) to avoid SQL
// injection; id-lists that are themselves computed from trusted master tables keep
// the original GROUP_CONCAT / IN (...) shape so results are identical.

const { diceapp, defaultDb } = require('../config/db');

async function q(pool, sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
async function row(pool, sql, params = []) {
  const rows = await q(pool, sql, params);
  return rows.length ? rows[0] : null;
}

// Column names of a table (CI's $db->list_fields()).
async function listFields(pool, table) {
  const rows = await q(pool, `SHOW COLUMNS FROM \`${table}\``);
  return rows.map((r) => r.Field);
}

// Generic parameterised INSERT; returns insertId.
async function insert(pool, table, obj) {
  const keys = Object.keys(obj);
  if (!keys.length) return null;
  const cols = keys.map((k) => `\`${k}\``).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const vals = keys.map((k) => obj[k]);
  const [res] = await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, vals);
  return res.insertId;
}

const M = {
  // ---------------------------------------------------------------- master data
  getCountries() {
    return q(diceapp, 'SELECT * FROM isdi_admsn_country');
  },

  getStateCity(value, type) {
    if (type === 'state') {
      return q(diceapp, 'SELECT state_id AS id, state_name AS name FROM isdi_admsn_state WHERE country_id = ?', [value]);
    }
    if (type === 'city') {
      return q(diceapp, 'SELECT city_id AS id, city_name AS name FROM isdi_admsn_city WHERE state_id = ? ORDER BY name ASC', [value]);
    }
    return [];
  },

  getStateCitySchool(value) {
    return q(
      diceapp,
      'SELECT admsn_school_12_id AS id, admsn_school_city_school_name AS name FROM isdi_admsn_12_schools WHERE admsn_school_city = ? AND is_school_approved = 1 ORDER BY admsn_school_city_school_name ASC',
      [value]
    );
  },

  // value = academic year id (0 for "all"). agent = {id} or null.
  async getSchoolForUni(value = 0, agent = null) {
    let condition = ' `school_id` >= 7 ';
    if (value && Number(value) !== 0) {
      const r = await row(
        diceapp,
        'SELECT GROUP_CONCAT(DISTINCT specialisation_school) AS school FROM `dice_specialisation_year` JOIN dice_specialisation ON dice_specialisation.specialisation_id = dice_specialisation_year.specialisation_id WHERE `year_id` = ?',
        [value]
      );
      if (r && r.school) condition = ` \`school_id\` IN (${r.school}) `;
    }
    if (agent && agent.id) {
      const r = await row(diceapp, 'SELECT GROUP_CONCAT(`agents_sp`) AS school FROM `isdi_admsn_agents_spe` WHERE `agent_id` = ?', [agent.id]);
      if (r && r.school) condition = ` \`school_id\` IN (${r.school}) `;
    }
    const condition1 = ' AND `school_id` NOT IN (1,12,10,9,11,14,15) ';
    return q(diceapp, `SELECT * FROM \`dice_school\` WHERE ${condition} ${condition1} `);
  },

  async getSchoolListForUni(value, agent = null) {
    let condition = ' `school_id` >= 7 ';
    if (value && Number(value) !== 0) {
      const r = await row(
        diceapp,
        'SELECT GROUP_CONCAT(DISTINCT specialisation_school) AS school FROM `dice_specialisation_year` JOIN dice_specialisation ON dice_specialisation.specialisation_id = dice_specialisation_year.specialisation_id WHERE `year_id` = ?',
        [value]
      );
      if (r && r.school) condition = ` \`school_id\` IN (${r.school}) `;
    }
    if (agent && agent.id) {
      const r = await row(diceapp, 'SELECT GROUP_CONCAT(`agents_sp`) AS school FROM `isdi_admsn_agents_spe` WHERE `agent_id` = ?', [agent.id]);
      if (r && r.school) condition = ` \`school_id\` IN (${r.school}) `;
    }
    const condition1 = ' AND `school_id` NOT IN (1,12,10,9) ';
    return q(diceapp, `SELECT * FROM \`dice_school\` WHERE ${condition} ${condition1} `);
  },

  // value = school id. agent = {id} or null.
  async getCerticiateForUni(value, agent = null) {
    let condition = '';
    if (agent && agent.id) {
      const r = await row(
        diceapp,
        'SELECT GROUP_CONCAT( DISTINCT `agent_ce`) AS ce FROM `isdi_admsn_agents` JOIN isdi_admsn_agents_spe ON isdi_admsn_agents_spe.agent_id = isdi_admsn_agents.id JOIN isdi_admsn_agents_ce ON isdi_admsn_agents_ce.agent_id = isdi_admsn_agents.id JOIN isdi_admsn_agents_degree ON isdi_admsn_agents_degree.agents_id = isdi_admsn_agents.id JOIN dice_specialisation ON dice_specialisation.specialisation_deg_abbrevation = isdi_admsn_agents_degree.agents_degree AND isdi_admsn_agents_spe.agents_sp = dice_specialisation.specialisation_school AND dice_specialisation.specialisation_certification = isdi_admsn_agents_ce.agent_ce WHERE isdi_admsn_agents.id = ? AND isdi_admsn_agents_spe.agents_sp IN(?) GROUP BY isdi_admsn_agents_ce.agent_id',
        [agent.id, value]
      );
      if (r && r.ce) condition = ` AND \`certification_id\` IN (${r.ce}) `;
    }
    // Faithful to the original: $not is finally fixed to exclude certification 3.
    const not = 'AND  `specialisation_certification` NOT IN (3)';
    return q(
      diceapp,
      `SELECT dice_certification.certification_id, dice_certification.certification_short_name,
        CASE WHEN dice_certification.certification_id = 3 THEN 'Summer School' ELSE dice_certification.certification_name END AS certification_name
       FROM \`dice_specialisation\`
       JOIN dice_certification ON dice_certification.certification_id = specialisation_certification
       WHERE \`specialisation_admission_is_not\` = 0 AND specialisation_deg_abbrevation != 10 AND is_addmission_block = 0
         AND \`specialisation_school\` = ? AND \`specialisation_certification\` != 10 ${condition} ${not}
       GROUP BY specialisation_certification`,
      [value]
    );
  },

  async getCertificationForUni(agent = null) {
    let condition = ' `certification_id` != 3 ';
    if (agent && agent.id) {
      const r = await row(diceapp, 'SELECT GROUP_CONCAT(`agent_ce`) AS ce FROM `isdi_admsn_agents_ce` WHERE `agent_id` = ?', [agent.id]);
      if (r && r.ce) condition = ` \`certification_id\` IN (${r.ce}) `;
    }
    return q(diceapp, `SELECT * FROM \`isdi_admsn_certification\` WHERE ${condition}`);
  },

  // ce = certification id, school = school id. acYear from session (0 => none). agent = {id}|null.
  async getAbrivationForUni(ce = 0, school = 0, acYear = 0, agent = null) {
    let condition = '';
    if (acYear && Number(acYear) !== 0 && Number(acYear) !== 11) {
      const r = await row(
        diceapp,
        'SELECT GROUP_CONCAT(DISTINCT specialisation_deg_abbrevation) AS school FROM `dice_specialisation_year` JOIN dice_specialisation ON dice_specialisation.specialisation_id = dice_specialisation_year.specialisation_id WHERE `year_id` = ? AND `specialisation_school` = ? AND `specialisation_certification` = ?',
        [acYear, school, ce]
      );
      if (r && r.school) condition = `AND \`id\` IN (${r.school})`;
    }
    if (agent && agent.id) {
      const r = await row(diceapp, 'SELECT GROUP_CONCAT(`agents_degree`) AS degree FROM `isdi_admsn_agents_degree` WHERE `agents_id` = ?', [agent.id]);
      if (r && r.degree) condition = ` AND \`id\` IN (${r.degree}) `;
    }
    const conSchool = ' '; // original always resets this to a blank string.
    return q(
      diceapp,
      `SELECT id, abbrivation FROM \`dice_specialisation\` JOIN atlas_degree_abbrevation ON id = \`specialisation_deg_abbrevation\` WHERE \`specialisation_school\` = ? AND \`specialisation_certification\` = ? AND \`specialisation_admission_is_not\` = '0' ${conSchool} ${condition} GROUP BY id`,
      [school, ce]
    );
  },

  getSpecialisationsForUni(ab = 0, certification = 0, school = 0) {
    // In the original the academic-year condition is computed then discarded, so it is always empty here.
    const orderBy = Number(ab) === 15 ? 'ORDER BY `specialisation_id` ASC' : 'ORDER BY `specialisation_name` ASC';
    return q(
      diceapp,
      `SELECT * FROM \`dice_specialisation\` WHERE \`specialisation_school\` = ? AND \`specialisation_certification\` = ? AND \`specialisation_category\` = 1 AND specialisation_admission_is_not = 0 AND \`specialisation_deg_abbrevation\` = ? ${orderBy}`,
      [school, certification, ab]
    );
  },

  getSpecialisationsForUni2(certification = 0, school = 0) {
    return q(
      diceapp,
      'SELECT * FROM `dice_specialisation` WHERE `specialisation_school` = ? AND `specialisation_certification` = ? AND `specialisation_category` = 1 AND specialisation_id NOT IN (89,10,104,122,96) and specialisation_admission_is_not = 0 ORDER BY `specialisation_name` ASC',
      [school, certification]
    );
  },

  getAcedmicYear() {
    return q(diceapp, 'SELECT `academic_year_id`, `academic_year_admission_name` FROM `dice_academic_year` WHERE `year_status` = 1 ');
  },

  getAcademicYearDetails(yearId) {
    return row(diceapp, 'SELECT * FROM `dice_academic_year` WHERE `academic_year_id` = ?', [yearId]);
  },

  getSchoolName(d) {
    return row(
      diceapp,
      'SELECT isdi_school.school_id, isdi_school.school_name FROM `isdi_admsn_appln` JOIN isdi_school ON isdi_school.school_id = isdi_admsn_appln.appln_school_un WHERE `appln_id` = ?',
      [d]
    );
  },

  getAgent(code) {
    return row(diceapp, 'SELECT `id`,`code`,`name`,`email`,`phone` FROM `isdi_admsn_agents` WHERE `code_url` = ? AND `is_deleted` = 0', [code]);
  },

  getLeadData(leadId) {
    return row(diceapp, 'SELECT * FROM `landing_page_leads` WHERE `lead_id` = ?', [leadId]);
  },

  getSOP(applnID) {
    return row(diceapp, 'SELECT `sop` FROM `isdi_admsn_sop` WHERE `appln_id` = ?', [applnID]);
  },

  // ------------------------------------------------------------- uniqueness checks
  // params = "school-specialisation-abbrivation-field"
  async validationUnique(str, params) {
    const [school, , abbrivation, field] = String(params).split('-');
    const rows = await q(
      diceapp,
      'SELECT * FROM isdi_admsn_appln WHERE appln_school = ? AND appln_abbrivation = ? AND appln_old = 0 AND ?? = ?',
      [school, abbrivation, field, str]
    );
    return rows.length === 0; // true = unique / valid
  },

  // params = "employee_id-field". Valid when a matching active staff row exists.
  async validationUniqueStaff(str, params) {
    const [employeeId] = String(params).split('-');
    const rows = await q(diceapp, 'SELECT * FROM dice_staff WHERE staff_app_id = ? AND staff_email = ?', [employeeId, str]);
    return rows.length > 0;
  },

  // ------------------------------------------------------------- status machine
  async setStatus(applnID, status) {
    await insert(diceapp, 'isdi_admsn_applicant_status', {
      applicant_st_appln_id: applnID,
      applicant_st_status: status,
      applicant_st_datetime: new Date(),
    });

    await diceapp.query(
      `INSERT INTO isdi_admsn_applicant_sub_status(applicant_sub_status, applicant_sub_appln_id, applicant_sub_datetime)
       SELECT dasm.sub_status_master_id, ias.applicant_st_appln_id, NOW()
       FROM isdi_admsn_applicant_status ias
       JOIN dice_admissions_sub_status_master dasm ON dasm.status_pk = ias.applicant_st_status
       JOIN isdi_admsn_appln ia ON ia.appln_id = ias.applicant_st_appln_id
       JOIN dice_admissions_sub_status_master_degree dasmd ON dasmd.master_degree_pk = ia.appln_abbrivation AND dasmd.sub_status_master_pk = dasm.sub_status_master_id
       WHERE ias.applicant_st_appln_id = ? AND NOT EXISTS(
         SELECT 1 FROM isdi_admsn_applicant_sub_status sub
         WHERE sub.applicant_sub_status = dasm.sub_status_master_id AND sub.applicant_sub_appln_id = ias.applicant_st_appln_id)
       GROUP BY dasm.sub_status_master_id
       ORDER BY ias.applicant_st_id DESC`,
      [applnID]
    );
  },

  // ------------------------------------------------------------- email/sms data
  async getMobileNos(applnID) {
    const r = await row(diceapp, 'SELECT `appln_phone`,`appln_fatherPhone`,`appln_motherPhone` FROM isdi_admsn_appln WHERE appln_id = ?', [applnID]);
    if (!r) return false;
    return Object.values(r).filter((v) => v !== null && v !== '' && v !== undefined);
  },

  async getEmailIDs(applnID) {
    const r = await row(diceapp, 'SELECT `appln_email`,`appln_fatherEmail`,`appln_motherEmail` FROM isdi_admsn_appln WHERE appln_id = ?', [applnID]);
    if (!r) return false;
    return Object.values(r).filter((v) => v !== null && v !== '' && v !== undefined);
  },

  basicApplnDetails(applnID) {
    return row(
      diceapp,
      `SELECT appln_id AS applnID, appln_certification AS certification, appln_certification, appln_fatherName AS fatherName,
        CONCAT(appln_firstName,' ',appln_lastName) AS name, appln_fatherFirstName AS fatherFirstName, appln_fatherLastName AS fatherLastName,
        appln_email AS email, appln_phone AS phone, school_name, school_logo, school_email, school_contact_no, school_address, school_paytm,
        school_pan, school_registration_no, school_gstin, school_admission_login_url, appln_address1 AS address, specialisation_name,
        specialisation_short_name, specialisation_contact_person, specialisation_contact_email, specialisation_bcc_email,
        specialisation_contact_phone, appln_uni_id, specialisation_email
       FROM isdi_admsn_appln
       JOIN isdi_school ON isdi_admsn_appln.appln_school = isdi_school.school_id
       JOIN isdi_admsn_specialisation ON isdi_admsn_appln.appln_specialisation = isdi_admsn_specialisation.specialisation_id
       WHERE appln_id = ?`,
      [applnID]
    );
  },

  // Large detail row used by the PDF / email (ported from allApplnDetailsUpdate).
  async allApplnDetailsUpdate(applnID) {
    await diceapp.query(
      "UPDATE `isdi_admsn_appln` SET appln_address1 = appln_address_un_1, appln_country = appln_country_un_1, appln_state = appln_state_un_1, appln_city = appln_city_un_1, appln_pincode = appln_pin_code_1 WHERE `appln_id` >= '1010000' AND appln_country IS NULL AND appln_state IS NULL AND appln_city IS NULL"
    );
    return row(
      diceapp,
      `SELECT appln_id AS applnID, CONCAT(appln_firstName,' ',appln_lastName) AS name, appln_fatherFirstName AS fatherFirstName,
        appln_fatherLastName AS fatherLastName, appln_email AS email, appln_phone AS phone, appln_certification, appln_dob, gender_name,
        blood_name, appln_address2, appln_pincode, appln_fatherOccupation, appln_guardian_name, appln_examinationBoardUG,
        academic_yearUg.academic_year_name AS appln_academicYearUg, appln_fatherEmail, appln_fatherPhone, appln_motherFirstName,
        appln_motherLastName, appln_motherOccupation, appln_motherEmail, appln_motherPhone, appln_landline, appln_institutionNameHS,
        appln_institutionAddressHS, appln_gradeHS, academic_yearHS.academic_year_name AS academic_year_nameHS,
        examination_boardHS.exam_board_name AS exam_board_nameHS, appln_marksSecuredHS, appln_marksSecuredOutOfHS,
        appln_institutionNameHSS, appln_institutionAddressHSS, appln_gradeHSS, academic_year2.academic_year_name AS academic_year_nameHSS,
        examination_board2.exam_board_name AS exam_board_nameHSS, appln_marksSecuredHSS, appln_marksSecuredOutOfHSS, appln_refExtraCurriculam,
        appln_institutionNameUG, appln_gradeUG, appln_institutionNamePG, appln_stream, appln_gradePG, appln_currentEmployer,
        appln_currentEmployerTimeFrom, appln_currentEmployerTimeTo, appln_prevEmployer, appln_prevEmployerTimeFrom, appln_prevEmployerTimeTo,
        appln_pastEmployer, appln_pastEmployerTimeFrom, appln_pastEmployerTimeTo, appln_yearExperience, appln_ugUniversity, appln_address_un_1,
        school_name, school_logo, school_id, school_email, school_contact_no, school_address, school_paytm, school_pan, school_registration_no,
        school_gstin, school_admission_login_url, appln_address1 AS address, specialisation_name, specialisation_contact_phone,
        specialisation_short_name, country_name, specialisation_bcc_email, state_name, city_name, appln_refName, specialisation_contact_email
       FROM isdi_admsn_appln
       JOIN isdi_school ON isdi_admsn_appln.appln_school = isdi_school.school_id
       JOIN isdi_admsn_specialisation ON isdi_admsn_appln.appln_specialisation = isdi_admsn_specialisation.specialisation_id
       LEFT JOIN isdi_admsn_gender ON isdi_admsn_appln.appln_gender = isdi_admsn_gender.gender_id
       LEFT JOIN isdi_admsn_blood ON isdi_admsn_appln.appln_blood = isdi_admsn_blood.blood_id
       LEFT JOIN isdi_admsn_country ON isdi_admsn_appln.appln_country = isdi_admsn_country.country_id
       LEFT JOIN isdi_admsn_state ON isdi_admsn_appln.appln_state = isdi_admsn_state.state_id
       LEFT JOIN isdi_admsn_city ON isdi_admsn_appln.appln_city = isdi_admsn_city.city_id
       LEFT JOIN isdi_admsn_academic_year AS academic_yearHS ON isdi_admsn_appln.appln_academicYearHS = academic_yearHS.academic_year_id
       LEFT JOIN isdi_admsn_examination_board AS examination_boardHS ON isdi_admsn_appln.appln_examinationBoardHS = examination_boardHS.exam_board_id
       LEFT JOIN isdi_admsn_academic_year academic_year2 ON isdi_admsn_appln.appln_academicYearHSS = academic_year2.academic_year_id
       LEFT JOIN isdi_admsn_academic_year AS academic_yearUg ON isdi_admsn_appln.appln_academicYearUg = academic_yearUg.academic_year_id
       LEFT JOIN isdi_admsn_examination_board AS examination_board2 ON isdi_admsn_appln.appln_examinationBoardHSS = examination_board2.exam_board_id
       WHERE appln_id = ?`,
      [applnID]
    );
  },

  // ------------------------------------------------------------- insert helpers
  listFields,
  insert,
  pools: { diceapp, defaultDb },
};

module.exports = M;
