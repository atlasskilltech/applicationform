// controllers/applicationController.js
const formData = require('../config/formData');
const ApplicationModel = require('../models/applicationModel');

/**
 * Loads the option lists for every dropdown/radio on the form.
 *
 * Right now this returns the static arrays from config/formData.js.
 * When you share your master tables, replace the body with DB look-ups, e.g.:
 *
 *   const [schools] = await db.query('SELECT id, name FROM schools WHERE active = 1');
 *   ...
 *   return { schools, programs, ... };
 *
 * The views already loop over these, so swapping the source needs no view changes
 * (just make each item {id, name} if you want the id as the <option value>).
 */
async function loadFormData() {
  return { ...formData };
}

// GET /  -> render the form
exports.showForm = async (req, res, next) => {
  try {
    const data = await loadFormData();
    res.render('application-form', {
      title: 'ATLAS SkillTech University — Application Form',
      data,
      old: {},      // sticky values on re-render
      errors: {},   // field -> message
    });
  } catch (err) {
    next(err);
  }
};

// POST /submit -> validate + save
exports.submitForm = async (req, res, next) => {
  try {
    const body = req.body;
    const files = req.files || {};

    const errors = validate(body, files);

    if (Object.keys(errors).length > 0) {
      const data = await loadFormData();
      return res.status(422).render('application-form', {
        title: 'ATLAS SkillTech University — Application Form',
        data,
        old: body,
        errors,
      });
    }

    // Build the record passed to the model. File fields store the saved path.
    const record = {
      ...body,
      profile_image: files.profile_image ? '/uploads/' + files.profile_image[0].filename : null,
      class_x_marksheet: files.class_x_marksheet ? '/uploads/' + files.class_x_marksheet[0].filename : null,
      class_xii_marksheet: files.class_xii_marksheet ? '/uploads/' + files.class_xii_marksheet[0].filename : null,
    };

    const insertId = await ApplicationModel.create(record);
    console.log('[submit] saved application id =', insertId);

    return res.redirect('/success');
  } catch (err) {
    next(err);
  }
};

// GET /success
exports.showSuccess = (req, res) => {
  res.render('success', { title: 'Application Submitted' });
};

// --------------------------------------------------------------------------
// Server-side validation — mirrors the required fields in the screenshot.
// Keep this in sync with public/js/form.js (client-side) but never trust the
// client: this is the real gate.
// --------------------------------------------------------------------------
function validate(b, files) {
  const e = {};
  const req = (key, label) => {
    if (!b[key] || String(b[key]).trim() === '') e[key] = `${label} is required.`;
  };

  // Section 1
  req('school', 'School');
  req('program', 'Programme');
  req('degree', 'Degree');
  req('specialisation', 'Specialisation');
  req('source', 'Source');
  if (!files.profile_image) e.profile_image = 'Profile photo is required.';

  // Section 2
  req('first_name', 'First name');
  req('last_name', 'Last name');
  req('address', 'Address');
  req('country', 'Country');
  req('state', 'State');
  req('city', 'City');
  req('pin_code', 'Pin code');
  req('mobile', 'Mobile number');
  req('email', 'Email');
  req('birth_date', 'Date of birth');
  req('gender', 'Gender');
  req('blood_group', 'Blood group');
  req('instagram', 'Instagram');
  req('caste_category', 'Caste category');

  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) e.email = 'Enter a valid email address.';
  if (b.mobile && !/^\d{10}$/.test(b.mobile)) e.mobile = 'Enter a valid 10-digit mobile number.';
  if (b.pin_code && !/^\d{6}$/.test(b.pin_code)) e.pin_code = 'Enter a valid 6-digit pin code.';

  // Section 3 — Class X
  req('class_x_school', 'Class X school name');
  req('class_x_board', 'Class X examination board');
  req('class_x_year', 'Class X year of completion');
  if (!files.class_x_marksheet) e.class_x_marksheet = 'Class X marksheet is required.';

  // Section 3 — Class XII
  req('class_xii_state', 'Class XII state');
  req('class_xii_city', 'Class XII city');
  req('class_xii_school', 'Class XII school / college');
  req('class_xii_stream', 'Class XII academic stream');
  req('class_xii_board', 'Class XII examination board');
  req('class_xii_year', 'Class XII year of completion');
  // Class XII marksheet is optional ("if already passed").

  // Section 4 — Parents
  req('father_name', "Father's name");
  req('father_mobile', "Father's mobile number");
  req('father_email', "Father's email");
  req('father_occupation', "Father's occupation");
  req('father_organization', "Father's organization");
  req('mother_name', "Mother's name");
  req('mother_mobile', "Mother's mobile number");
  req('mother_email', "Mother's email");
  req('mother_occupation', "Mother's occupation");
  req('mother_organization', "Mother's organization");
  req('sop', 'Statement of purpose');

  if (b.father_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.father_email)) e.father_email = 'Enter a valid email.';
  if (b.mother_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.mother_email)) e.mother_email = 'Enter a valid email.';
  if (b.sop && b.sop.trim().split(/\s+/).length > 250) e.sop = 'Statement of purpose must be 250 words or fewer.';

  // Section 5 — Declaration
  if (!b.undertaking) e.undertaking = 'You must accept the undertaking to submit.';

  return e;
}
