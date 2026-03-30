const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Create uploads folder if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created uploads folder');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal';

console.log('Attempting to connect to MongoDB...');
console.log('Connection string:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')); // Hide password in logs

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your connection string is correct');
    console.log('2. Make sure your IP address is whitelisted in MongoDB Atlas');
    console.log('3. Check if username/password are correct');
    process.exit(1);
  });

// Import Models
const User = require('./models/User');
const Application = require('./models/Application');

// Import Routes - FIXED: Changed 'applications' to 'application'
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/application');  // ← This line is fixed
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    msg: 'Something went wrong on the server',
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ Test the server at: http://localhost:${PORT}/api/test`);
  console.log('\nAvailable endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`  POST http://localhost:${PORT}/api/applications/submit`);
  console.log(`  GET  http://localhost:${PORT}/api/admin/applications`);
  console.log('\nReady to accept requests!\n');
});