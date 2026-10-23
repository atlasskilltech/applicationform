-- sql/tracker_schema.sql
-- Tables used by the Node session tracker (models/trackerModel.js), on the
-- `diceapp` database. If these already exist on your diceapp DB (from the
-- previous PHP tracker), you do NOT need to run this — it is provided only so a
-- fresh environment can be set up. IF NOT EXISTS makes it safe to re-run.

CREATE TABLE IF NOT EXISTS `dice_application_sessions` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_token`    CHAR(48)     NOT NULL,
  `ip_address`       VARCHAR(45)      DEFAULT NULL,
  `user_agent`       VARCHAR(255)     DEFAULT NULL,
  `geo_city`         VARCHAR(128)     DEFAULT NULL,
  `geo_region`       VARCHAR(128)     DEFAULT NULL,
  `geo_country`      VARCHAR(128)     DEFAULT NULL,
  `first_name`       VARCHAR(100)     DEFAULT NULL,
  `last_name`        VARCHAR(100)     DEFAULT NULL,
  `mobile`           VARCHAR(20)      DEFAULT NULL,
  `email`            VARCHAR(255)     DEFAULT NULL,
  `school_id`        INT              DEFAULT NULL,
  `certification_id` INT              DEFAULT NULL,
  `abbrivation_id`   INT              DEFAULT NULL,
  `specialisation_id` INT             DEFAULT NULL,
  `current_step`     VARCHAR(50)      DEFAULT 'stud-info',
  `progress_percent` INT              DEFAULT 0,
  `form_data`        LONGTEXT         DEFAULT NULL,
  `status`           ENUM('filling','idle','abandoned','submitted','merged') NOT NULL DEFAULT 'filling',
  `application_id`   VARCHAR(50)      DEFAULT NULL,
  `merged_into`      INT UNSIGNED     DEFAULT NULL,
  `started_at`       DATETIME         DEFAULT NULL,
  `last_activity_at` DATETIME         DEFAULT NULL,
  `last_saved_at`    DATETIME         DEFAULT NULL,
  `submitted_at`     DATETIME         DEFAULT NULL,
  `abandoned_at`     DATETIME         DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_token` (`session_token`),
  KEY `idx_status` (`status`),
  KEY `idx_last_activity` (`last_activity_at`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `dice_application_session_activity` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`    INT UNSIGNED NOT NULL,
  `activity_type` VARCHAR(40)  NOT NULL,
  `step`          VARCHAR(50)      DEFAULT NULL,
  `created_at`    DATETIME         DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
