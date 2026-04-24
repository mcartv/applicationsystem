import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getDisplayName, getNameParts } from '../utils/nameUtils';
import '../styles/EngineerDashboard.css';

const EMPTY_FORM_DATA = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: ''
};

const formatDateForInput = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
};

const getProfileFormData = (user) => {
  const { firstName, lastName } = getNameParts(user || {});

  return {
    firstName,
    lastName,
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: formatDateForInput(user?.dateOfBirth)
  };
};

const getApplicationFormData = (application, user) => {
  const profileData = getProfileFormData(user);
  const { firstName, lastName } = getNameParts(application?.personalInfo || {});

  return {
    ...profileData,
    firstName: firstName || profileData.firstName,
    lastName: lastName || profileData.lastName,
    email: application?.personalInfo?.email || profileData.email,
    phone: application?.personalInfo?.phone || profileData.phone,
    address: application?.personalInfo?.address || profileData.address,
    dateOfBirth: formatDateForInput(application?.personalInfo?.dateOfBirth || profileData.dateOfBirth)
  };
};

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
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [activeSection, setActiveSection] = useState('overview');

  const fetchApplication = useCallback(async (currentUser = user) => {
    try {
      const res = await axios.get('/applications/my-application');
      setApplication(res.data);
      setFormData(getApplicationFormData(res.data, currentUser));
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setApplication(null);
        setFormData(getProfileFormData(currentUser));
      } else {
        console.error(err);
        setError('Error loading your application');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    fetchApplication(user);
  }, [user, navigate, fetchApplication]);

  useEffect(() => {
    if (!user || application) {
      return;
    }

    const profileData = getProfileFormData(user);

    setFormData((currentFormData) => ({
      firstName: currentFormData.firstName || profileData.firstName,
      lastName: currentFormData.lastName || profileData.lastName,
      email: currentFormData.email || profileData.email,
      phone: currentFormData.phone || profileData.phone,
      address: currentFormData.address || profileData.address,
      dateOfBirth: currentFormData.dateOfBirth || profileData.dateOfBirth
    }));
  }, [user, application]);

  const scrollToSection = (sectionKey, sectionId) => {
    setActiveSection(sectionKey);
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const validateNamePart = (name) => {
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

  const buildPersonalInfo = () => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    address: formData.address.trim(),
    dateOfBirth: formData.dateOfBirth || ''
  });

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

    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
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

    if (validationErrors.resume) {
      setValidationErrors({
        ...validationErrors,
        resume: ''
      });
    }
  };

  const validateForm = () => {
    const personalInfo = buildPersonalInfo();
    const errors = {};

    if (!validateNamePart(personalInfo.firstName)) {
      errors.firstName = 'First name must contain only letters and spaces (2-50 characters)';
    }

    if (!validateNamePart(personalInfo.lastName)) {
      errors.lastName = 'Last name must contain only letters and spaces (2-50 characters)';
    }

    if (!validateEmail(personalInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!validatePhone(personalInfo.phone)) {
      errors.phone = 'Phone number must contain only numbers (10-15 digits)';
    }

    if (!validateDateOfBirth(personalInfo.dateOfBirth) && personalInfo.dateOfBirth) {
      errors.dateOfBirth = 'You must be at least 18 years old';
    }

    if (!resumeFile && !application?.resume) {
      errors.resume = 'Please upload your resume/CV';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return null;
    }

    setFormData(personalInfo);
    return personalInfo;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const personalInfo = validateForm();
    if (!personalInfo) {
      return;
    }

    setSubmitting(true);
    setMessage('');
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('data', JSON.stringify({ personalInfo }));
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
      setResumeFile(null);
      setValidationErrors({});
      await fetchApplication();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'interview_scheduled':
        return 'status-interview_scheduled';
      case 'hired':
        return 'status-hired';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const applicationStage = application ? getStatusText(application.status) : 'Not Started';
  const resumeStatus = application?.resume ? 'On File' : 'Needs Upload';
  const profileStatus = formData.firstName && formData.lastName && formData.email && formData.phone ? 'Ready' : 'Review Needed';

  const sidebarItems = [
    { key: 'overview', label: 'Overview', sectionId: 'engineer-overview' },
    ...(application ? [{ key: 'status', label: 'Status', sectionId: 'engineer-status' }] : []),
    { key: 'form', label: 'Application Form', sectionId: 'engineer-form' },
    { key: 'checklist', label: 'Checklist', sectionId: 'engineer-checklist' }
  ];

  const checklistItems = application
    ? [
        'Review your details before saving another update to your application.',
        'Keep your latest resume on file so the admin sees your most recent version.',
        'Check this dashboard regularly for interview schedules and admin notes.'
      ]
    : [
        'Review the details already loaded from your registration profile.',
        'Upload your latest resume or CV before submitting your application.',
        'Submit once you are happy with your information to enter the review queue.'
      ];

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner"></div>
        <p className="text-muted">Loading your application...</p>
      </div>
    );
  }

  return (
    <div className="dashboard engineer-dashboard">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-kicker">Application Workspace</span>
            <h2>Engineer Portal</h2>
            <p className="sidebar-description">Move between your overview, status updates, and application form from one organized sidebar.</p>
          </div>

          <nav className="sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-link ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => scrollToSection(item.key, item.sectionId)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="sidebar-user-label">Signed in as</span>
              <strong>{getDisplayName(user || {})}</strong>
              <span className="sidebar-user-meta">{user?.username || user?.email}</span>
            </div>

            <button onClick={logout} className="sidebar-logout-btn">
              Logout
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero" id="engineer-overview">
            <div>
              <span className="sidebar-kicker">Application Overview</span>
              <h1>Hello, {getDisplayName(user || {})}</h1>
              <p>We loaded your registration details into the form below so you can focus on reviewing your information, uploading your resume, and submitting with confidence.</p>
            </div>

            <div className="dashboard-hero-meta">
              <div className="hero-stat">
                <span className="hero-stat-label">Current stage</span>
                <strong className="hero-stat-value">{applicationStage}</strong>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Resume status</span>
                <strong className="hero-stat-value">{resumeStatus}</strong>
              </div>
            </div>
          </section>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <section className="quick-stat-grid">
            <article className="summary-card engineer-summary-profile">
              <span className="summary-label">Profile Status</span>
              <strong className="summary-value">{profileStatus}</strong>
              <p className="summary-caption">Your registration details are already connected to this form.</p>
            </article>
            <article className="summary-card engineer-summary-stage">
              <span className="summary-label">Application Stage</span>
              <strong className="summary-value">{applicationStage}</strong>
              <p className="summary-caption">Track where you currently stand in the process.</p>
            </article>
            <article className="summary-card engineer-summary-resume">
              <span className="summary-label">Resume</span>
              <strong className="summary-value">{resumeStatus}</strong>
              <p className="summary-caption">Upload a file if you need to replace the resume already on record.</p>
            </article>
          </section>

          {!application && (
            <div className="quick-note">
              Your registration profile has already been loaded. Review the modules below, upload your resume, and submit when everything looks correct.
            </div>
          )}

          <section className="dashboard-section-grid">
            <article className="application-card" id="engineer-status">
              <div className="section-header">
                <div>
                  <h3>{application ? 'Current Application Status' : 'Before You Submit'}</h3>
                  <p className="section-subtitle">
                    {application
                      ? 'Watch for updates from the admin team, including interviews and review notes.'
                      : 'Use this space to understand what will happen after your first submission.'}
                  </p>
                </div>
                {application && (
                  <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                    {getStatusText(application.status)}
                  </span>
                )}
              </div>

              {application ? (
                <div className="status-panel">
                  <div className="status-detail-card">
                    <h4>Status Timeline</h4>
                    <p><strong>Submitted:</strong> {new Date(application.submittedAt).toLocaleDateString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(application.updatedAt || application.submittedAt).toLocaleDateString()}</p>
                  </div>

                  {application.interviewSchedule && (
                    <div className="status-detail-card">
                      <h4>Interview Schedule</h4>
                      <p><strong>Date:</strong> {new Date(application.interviewSchedule.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {application.interviewSchedule.time}</p>
                      <p><strong>Location:</strong> {application.interviewSchedule.location}</p>
                      {application.interviewSchedule.notes && <p><strong>Notes:</strong> {application.interviewSchedule.notes}</p>}
                    </div>
                  )}

                  {application.adminNotes && (
                    <div className="status-detail-card admin-notes">
                      <h4>Admin Notes</h4>
                      <p>{application.adminNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="info-list">
                  <li className="info-list-item">
                    <div>
                      <strong className="info-list-title">Review queue</strong>
                      <p className="info-list-meta">After you submit, your application moves into pending review.</p>
                    </div>
                    <span className="info-list-value">Pending</span>
                  </li>
                  <li className="info-list-item">
                    <div>
                      <strong className="info-list-title">Interview updates</strong>
                      <p className="info-list-meta">If selected, your interview details will appear in this dashboard.</p>
                    </div>
                    <span className="info-list-value">Here</span>
                  </li>
                  <li className="info-list-item">
                    <div>
                      <strong className="info-list-title">Admin notes</strong>
                      <p className="info-list-meta">Feedback and decisions will be posted back to this page.</p>
                    </div>
                    <span className="info-list-value">Visible</span>
                  </li>
                </ul>
              )}
            </article>

            <article className="application-card" id="engineer-checklist">
              <div className="section-header">
                <div>
                  <h3>Application Checklist</h3>
                  <p className="section-subtitle">Use this short checklist to keep your submission complete and up to date.</p>
                </div>
              </div>

              <ul className="dashboard-checklist">
                {checklistItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="application-card engineer-form-card" id="engineer-form">
            <div className="section-header">
              <div>
                <h3>{application ? 'Update Your Application' : 'Complete Your Application'}</h3>
                <p className="section-subtitle">Your form is now organized into modules so it is easier to review and update after registration.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section-card">
                <div className="form-section-header">
                  <h4>Personal Identity</h4>
                  <p>Confirm your name and birth date before you continue.</p>
                </div>

                <div className="module-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      className={`form-control ${validationErrors.firstName ? 'is-invalid' : ''}`}
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    {validationErrors.firstName && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.firstName}</small>}
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      className={`form-control ${validationErrors.lastName ? 'is-invalid' : ''}`}
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    {validationErrors.lastName && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.lastName}</small>}
                  </div>

                  <div className="form-group module-span-2">
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
                </div>
              </div>

              <div className="form-section-card">
                <div className="form-section-header">
                  <h4>Contact Information</h4>
                  <p>These details help the hiring team contact you quickly during the process.</p>
                </div>

                <div className="module-grid">
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

                  <div className="form-group module-span-2">
                    <label>Address</label>
                    <textarea
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-card">
                <div className="form-section-header">
                  <h4>Supporting Documents</h4>
                  <p>Upload a resume or CV so the admin can review your qualifications.</p>
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
                    <div className="current-resume">
                      Current resume: {application.resume.originalName}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : (application ? 'Update Application' : 'Submit Application')}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default EngineerDashboard;
