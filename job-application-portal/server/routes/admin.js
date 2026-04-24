const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// Get all applications (Admin only)
router.get('/applications', [auth, auth.adminOnly], async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('user', 'firstName lastName name email role')
      .sort({ submittedAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single application (Admin only)
router.get('/applications/:id', [auth, auth.adminOnly], async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('user', 'firstName lastName name email role');
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Schedule interview (Admin only)
router.put('/applications/:id/schedule-interview', [auth, auth.adminOnly], async (req, res) => {
  try {
    const { date, time, location, notes } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    application.interviewSchedule = { date, time, location, notes };
    application.status = 'interview_scheduled';
    application.updatedAt = Date.now();
    
    await application.save();
    res.json({ msg: 'Interview scheduled successfully', application });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update application status (Admin only)
router.put('/applications/:id/status', [auth, auth.adminOnly], async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    application.status = status;
    if (adminNotes) application.adminNotes = adminNotes;
    application.updatedAt = Date.now();
    
    await application.save();
    res.json({ msg: 'Status updated successfully', application });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
