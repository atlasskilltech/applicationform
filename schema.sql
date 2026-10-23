-- schema.sql
-- Sample table so you can run the project end-to-end TODAY, before wiring in
-- your existing CodeIgniter tables. Columns match models/applicationModel.js.
-- Once you share your real tables, this file can be dropped.

CREATE DATABASE IF NOT EXISTS atlas_applications
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE atlas_applications;

CREATE TABLE IF NOT EXISTS applications (
  id                      INT AUTO_INCREMENT PRIMARY KEY,

  -- Section 1: Program & Profile
  school                  VARCHAR(150),
  program                 VARCHAR(150),
  degree                  VARCHAR(150),
  specialisation          VARCHAR(150),
  source                  VARCHAR(150),
  profile_image           VARCHAR(255),

  -- Section 2: Student Details
  first_name              VARCHAR(100),
  middle_name             VARCHAR(100),
  last_name               VARCHAR(100),
  address                 TEXT,
  country                 VARCHAR(100),
  state                   VARCHAR(100),
  city                    VARCHAR(100),
  pin_code                VARCHAR(10),
  mobile                  VARCHAR(15),
  email                   VARCHAR(150),
  birth_date              DATE,
  gender                  VARCHAR(30),
  blood_group             VARCHAR(5),
  nationality             VARCHAR(100),
  instagram               VARCHAR(255),
  linkedin                VARCHAR(255),
  caste_category          VARCHAR(20),

  -- Section 3: Education — Class X
  class_x_school          VARCHAR(200),
  class_x_board           VARCHAR(100),
  class_x_year            VARCHAR(10),
  class_x_marksheet       VARCHAR(255),

  -- Section 3: Education — Class XII
  class_xii_state         VARCHAR(100),
  class_xii_city          VARCHAR(100),
  class_xii_school        VARCHAR(200),
  class_xii_stream        VARCHAR(100),
  class_xii_board         VARCHAR(100),
  class_xii_year          VARCHAR(10),
  class_xii_marksheet     VARCHAR(255),

  -- Section 4: Parents + SOP
  father_name             VARCHAR(150),
  father_mobile           VARCHAR(15),
  father_email            VARCHAR(150),
  father_occupation       VARCHAR(150),
  father_organization     VARCHAR(200),
  mother_name             VARCHAR(150),
  mother_mobile           VARCHAR(15),
  mother_email            VARCHAR(150),
  mother_occupation       VARCHAR(150),
  mother_organization     VARCHAR(200),
  guardian_relationship   VARCHAR(150),
  sop                     TEXT,

  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
