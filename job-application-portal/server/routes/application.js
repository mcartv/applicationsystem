const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

const splitFullName = (value = '') => {
  const normalizedValue = String(value).trim().replace(/\s+/g, ' ');

  if (!normalizedValue) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...lastNameParts] = normalizedValue.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' ')
  };
};

const normalizePersonalInfo = (personalInfo = {}) => {
  const fallbackParts = splitFullName(personalInfo.fullName || '');
  const normalizedDobValue = personalInfo.dateOfBirth ? String(personalInfo.dateOfBirth).trim() : '';
  const parsedDate = normalizedDobValue ? new Date(normalizedDobValue) : null;

  return {
    firstName: (personalInfo.firstName || fallbackParts.firstName || '').trim(),
    lastName: (personalInfo.lastName || fallbackParts.lastName || '').trim(),
    email: (personalInfo.email || '').trim(),
    phone: (personalInfo.phone || '').trim(),
    address: (personalInfo.address || '').trim(),
    // Keep DOB nullable to avoid Mongoose Date cast errors on empty strings.
    dateOfBirth: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
    position: (personalInfo.position || '').trim()
  };
};

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
    const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);
    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]);
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
  }
});

// Submit application
router.post('/submit', auth, upload.single('resume'), async (req, res) => {
  try {
    let personalInfo;
    try {
      const parsedData = JSON.parse(req.body.data || '{}');
      personalInfo = normalizePersonalInfo(parsedData.personalInfo || {});
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
    console.error('Application submit error:', err);
    res.status(500).json({
      msg: 'Server error while submitting application',
      error: err.message,
      details: err.errors || null
    });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File size exceeds 5MB limit' });
    }

    return res.status(400).json({ msg: error.message });
  }

  if (error) {
    return res.status(400).json({ msg: error.message || 'Invalid file upload' });
  }

  return next();
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
