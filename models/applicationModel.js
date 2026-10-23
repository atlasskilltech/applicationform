// models/applicationModel.js
const db = require('../config/db');

/**
 * ====================================================================
 *  THIS IS THE FILE TO EDIT WHEN YOU SHARE YOUR EXISTING TABLES.
 * ====================================================================
 *
 * Right now create() inserts into a single `applications` table whose columns
 * match the form field names (the `name="..."` attributes in the form view).
 * When you give me your real CodeIgniter tables, we change the mapping below:
 *
 *   - rename the table ('applications' -> your table name)
 *   - map each `record.xxx` to your actual column names
 *   - if your form data is split across several tables (student / education /
 *     parents), turn create() into a transaction that inserts into each and
 *     links them by the inserted application id. Skeleton for that is at the
 *     bottom of this file (createAcrossTables), commented out.
 */

const ApplicationModel = {
  async create(record) {
    const sql = `
      INSERT INTO applications (
        school, program, degree, specialisation, source, profile_image,
        first_name, middle_name, last_name,
        address, country, state, city, pin_code, mobile, email,
        birth_date, gender, blood_group, nationality, instagram, linkedin, caste_category,
        class_x_school, class_x_board, class_x_year, class_x_marksheet,
        class_xii_state, class_xii_city, class_xii_school, class_xii_stream,
        class_xii_board, class_xii_year, class_xii_marksheet,
        father_name, father_mobile, father_email, father_occupation, father_organization,
        mother_name, mother_mobile, mother_email, mother_occupation, mother_organization,
        guardian_relationship, sop, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, NOW()
      )`;

    const params = [
      record.school, record.program, record.degree, record.specialisation, record.source, record.profile_image,
      record.first_name, record.middle_name || null, record.last_name,
      record.address, record.country, record.state, record.city, record.pin_code, record.mobile, record.email,
      record.birth_date, record.gender, record.blood_group, record.nationality || null, record.instagram, record.linkedin || null, record.caste_category,
      record.class_x_school, record.class_x_board, record.class_x_year, record.class_x_marksheet,
      record.class_xii_state, record.class_xii_city, record.class_xii_school, record.class_xii_stream,
      record.class_xii_board, record.class_xii_year, record.class_xii_marksheet,
      record.father_name, record.father_mobile, record.father_email, record.father_occupation, record.father_organization,
      record.mother_name, record.mother_mobile, record.mother_email, record.mother_occupation, record.mother_organization,
      record.guardian_relationship || null, record.sop,
    ];

    const [result] = await db.query(sql, params);
    return result.insertId;
  },
};

module.exports = ApplicationModel;

/*
// ---- Transaction skeleton for a multi-table schema (uncomment & adapt) ----
async function createAcrossTables(record) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [app] = await conn.query(
      'INSERT INTO student (first_name, last_name, email, mobile) VALUES (?, ?, ?, ?)',
      [record.first_name, record.last_name, record.email, record.mobile]
    );
    const studentId = app.insertId;

    await conn.query(
      'INSERT INTO education (student_id, class_x_board, class_xii_board) VALUES (?, ?, ?)',
      [studentId, record.class_x_board, record.class_xii_board]
    );

    await conn.query(
      'INSERT INTO parents (student_id, father_name, mother_name) VALUES (?, ?, ?)',
      [studentId, record.father_name, record.mother_name]
    );

    await conn.commit();
    return studentId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
*/
