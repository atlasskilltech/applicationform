// routes/application.js
const express = require('express');
const router = express.Router();

const { applicationUpload } = require('../config/upload');
const controller = require('../controllers/applicationController');

// Show the form
router.get('/', controller.showForm);

// Submit the form (multipart: profile image + marksheets)
router.post('/submit', applicationUpload, controller.submitForm);

// Thank-you page
router.get('/success', controller.showSuccess);

module.exports = router;
