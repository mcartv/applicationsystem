const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and images are allowed'));
    }
  }
});

// Submit application
router.post('/submit', auth, upload.single('resume'), async (req, res) => {
  try {
    let personalInfo;
    try {
      personalInfo = JSON.parse(req.body.data).personalInfo;
    } catch (err) {
      return res.status(400).json({ msg: 'Invalid data format' });
    }
    
    let application = await Application.findOne({ user: req.user.id });
    
    if (application) {
      application.personalInfo = personalInfo;
      if (req.file) {
        application.resume = {
          filename: req.file.filename,
          path: req.file.path,
          originalName: req.file.originalname
        };
      }
      application.updatedAt = Date.now();
    } else {
      application = new Application({
        user: req.user.id,
        personalInfo,
        resume: req.file ? {
          filename: req.file.filename,
          path: req.file.path,
          originalName: req.file.originalname
        } : null
      });
    }
    
    await application.save();
    res.json({ msg: 'Application submitted successfully', application });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's application
router.get('/my-application', auth, async (req, res) => {
  try {
    const application = await Application.findOne({ user: req.user.id });
    if (!application) {
      return res.status(404).json({ msg: 'No application found' });
    }
    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;