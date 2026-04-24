const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    fullName: String,
    email: String,
    phone: String,
    address: String,
    dateOfBirth: Date,
    position: String
  },
  resume: {
    filename: String,
    path: String,
    originalName: String
  },
  status: {
    type: String,
    enum: ['pending', 'interview_scheduled', 'hired', 'rejected'],
    default: 'pending'
  },
  interviewSchedule: {
    date: Date,
    time: String,
    location: String,
    notes: String
  },
  adminNotes: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
