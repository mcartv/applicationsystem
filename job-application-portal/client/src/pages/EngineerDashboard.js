import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/EngineerDashboard.css';

const EngineerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    fetchApplication();
  }, [user, navigate]);

  const fetchApplication = async () => {
    try {
      const res = await axios.get('/applications/my-application');
      setApplication(res.data);
      if (res.data.personalInfo) {
        setFormData({
          fullName: res.data.personalInfo.fullName || '',
          email: res.data.personalInfo.email || '',
          phone: res.data.personalInfo.phone || '',
          address: res.data.personalInfo.address || '',
          dateOfBirth: res.data.personalInfo.dateOfBirth ? res.data.personalInfo.dateOfBirth.split('T')[0] : ''
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateFullName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return true;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18 && age <= 100;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, DOC, DOCX, or image files only.');
        setResumeFile(null);
        return;
      }
      
      if (file.size > maxSize) {
        setError('File size exceeds 5MB limit.');
        setResumeFile(null);
        return;
      }
      
      setResumeFile(file);
      setError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!validateFullName(formData.fullName)) {
      errors.fullName = 'Name must contain only letters and spaces (2-50 characters)';
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Phone number must contain only numbers (10-15 digits)';
    }
    
    if (!validateDateOfBirth(formData.dateOfBirth) && formData.dateOfBirth) {
      errors.dateOfBirth = 'You must be at least 18 years old';
    }
    
    if (!resumeFile && !application?.resume) {
      errors.resume = 'Please upload your resume/CV';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setMessage('');
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('data', JSON.stringify({ personalInfo: formData }));
    if (resumeFile) {
      formDataToSend.append('resume', resumeFile);
    }

    try {
      await axios.post('/applications/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Application submitted successfully!');
      fetchApplication();
      setResumeFile(null);
      setValidationErrors({});
    } catch (err) {
      setError(err.response?.data?.msg || 'Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'interview_scheduled': return 'status-interview_scheduled';
      case 'hired': return 'status-hired';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pending Review';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'hired': return 'Hired';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner"></div>
        <p className="text-muted">Loading your application...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.name}</h2>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        {application && application.status !== 'pending' && (
          <div className="application-card">
            <h3>Application Status</h3>
            <div>
              <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                {getStatusText(application.status)}
              </span>
            </div>
            
            {application.interviewSchedule && (
              <div style={{ marginTop: '20px' }}>
                <h4>Interview Schedule</h4>
                <p><strong>Date:</strong> {new Date(application.interviewSchedule.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {application.interviewSchedule.time}</p>
                <p><strong>Location:</strong> {application.interviewSchedule.location}</p>
                {application.interviewSchedule.notes && <p><strong>Notes:</strong> {application.interviewSchedule.notes}</p>}
              </div>
            )}
            
            {application.adminNotes && (
              <div style={{ marginTop: '20px' }}>
                <h4>Admin Notes</h4>
                <p>{application.adminNotes}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="application-card">
          <h3>{application ? 'Update Your Application' : 'Submit Your Application'}</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                className={`form-control ${validationErrors.fullName ? 'is-invalid' : ''}`}
                value={formData.fullName}
                onChange={handleChange}
              />
              {validationErrors.fullName && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.fullName}</small>}
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {validationErrors.email && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.email}</small>}
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className={`form-control ${validationErrors.phone ? 'is-invalid' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-15 digits only"
              />
              {validationErrors.phone && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.phone}</small>}
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className={`form-control ${validationErrors.dateOfBirth ? 'is-invalid' : ''}`}
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {validationErrors.dateOfBirth && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.dateOfBirth}</small>}
            </div>
            
            <div className="form-group">
              <label>Resume/CV (PDF, DOC, DOCX, or Image) *</label>
              <input
                type="file"
                className={`form-control ${validationErrors.resume ? 'is-invalid' : ''}`}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {validationErrors.resume && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.resume}</small>}
              {application?.resume && !resumeFile && (
                <div style={{ marginTop: '8px', color: '#059669', fontSize: '0.75rem' }}>
                  ✓ Current resume: {application.resume.originalName}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : (application ? 'Update Application' : 'Submit Application')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EngineerDashboard;