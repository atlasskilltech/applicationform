// config/formData.js
// Static option lists used to render the dropdowns / radios.
//
// NOTE: In your real app most of these (schools, programmes, degrees,
// specialisations, boards, states, cities ...) almost certainly live in
// your EXISTING master tables. When you give me those tables, we swap these
// arrays for DB queries in the controller (see controllers/applicationController.js
// -> loadFormData()) and pass the rows into the view the same way.
// Until then, these keep the form rendering and testable end-to-end.

const currentYear = new Date().getFullYear();
const years = [];
for (let y = currentYear + 1; y >= currentYear - 15; y--) years.push(String(y));

module.exports = {
  // ---- Section 1: Program & Profile ----
  schools: ['ISDI', 'ISME', 'uGDX', 'ATLAS LAW School'],
  programs: ['Undergraduate', 'Postgraduate', 'Diploma'],
  degrees: ['B.Des', 'B.Tech', 'BBA', 'B.Com', 'LLB', 'MBA', 'M.Des'],
  specialisations: [
    'Product Design', 'Communication Design', 'Interaction Design',
    'Marketing', 'Finance', 'Human Resources', 'Business Analytics',
  ],
  sources: ['Google / Search', 'Instagram', 'Facebook', 'Friend / Family', 'School / College', 'Newspaper', 'Event / Fair', 'Other'],

  // ---- Section 2: Student Details ----
  countries: ['India', 'Other'],
  states: [
    'Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu',
    'Uttar Pradesh', 'Rajasthan', 'West Bengal', 'Telangana', 'Other',
  ],
  cities: ['Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Chennai', 'Hyderabad', 'Other'],
  genders: ['Male', 'Female', 'Other', 'Prefer not to say'],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  casteCategories: ['SC', 'OBC', 'NT(A)', 'NT(B)', 'NT(C)', 'NT(D)', 'VJ/DT', 'ST', 'GENERAL'],

  // ---- Section 3: Education Details ----
  boards: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE / Cambridge', 'Other'],
  academicStreams: ['Science', 'Commerce', 'Arts / Humanities', 'Other'],
  years,
};
