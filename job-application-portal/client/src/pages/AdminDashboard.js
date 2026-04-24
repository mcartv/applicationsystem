import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getDisplayName, getNameParts } from '../utils/nameUtils';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    location: '',
    notes: ''
  });
  const [statusData, setStatusData] = useState({
    status: '',
    adminNotes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [showStatusSuccessModal, setShowStatusSuccessModal] = useState(false);
  const [refreshingApplications, setRefreshingApplications] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await axios.get('/admin/applications');
      setApplications(res.data);
      setError('');
    } catch (err) {
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/engineer-dashboard');
      return;
    }

    fetchApplications();
  }, [user, navigate, fetchApplications]);

  const scrollToSection = (sectionKey, sectionId) => {
    setActiveSection(sectionKey);
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
    setInterviewData({
      date: '',
      time: '',
      location: '',
      notes: ''
    });
    setStatusData({
      status: '',
      adminNotes: ''
    });
    setValidationErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
    setValidationErrors({});
  };

  const handleRefreshApplications = async () => {
    setRefreshingApplications(true);
    await fetchApplications();
    setRefreshingApplications(false);
  };

  const validateInterviewForm = () => {
    const errors = {};

    if (!interviewData.date) {
      errors.date = 'Please select an interview date';
    } else {
      const selectedDate = new Date(interviewData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.date = 'Interview date cannot be in the past';
      }
    }

    if (!interviewData.time) {
      errors.time = 'Please select an interview time';
    }

    if (!interviewData.location) {
      errors.location = 'Please enter an interview location or meeting link';
    } else if (interviewData.location.length < 5) {
      errors.location = 'Location must be at least 5 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStatusForm = () => {
    const errors = {};

    if (!statusData.status) {
      errors.status = 'Please select a status';
    }

    if (statusData.status === 'rejected' && !statusData.adminNotes) {
      errors.adminNotes = 'Please provide a reason for rejection';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!validateInterviewForm()) {
      return;
    }

    try {
      await axios.put(`/admin/applications/${selectedApplication._id}/schedule-interview`, interviewData);
      setMessage('Interview scheduled successfully!');
      await fetchApplications();
      setTimeout(() => {
        closeModal();
        setMessage('');
      }, 2000);
    } catch (err) {
      setError('Error scheduling interview');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!validateStatusForm()) {
      return;
    }

    try {
      await axios.put(`/admin/applications/${selectedApplication._id}/status`, statusData);
      setMessage('Status updated successfully!');
      await fetchApplications();
      closeModal();
      setShowStatusSuccessModal(true);
      setTimeout(() => {
        setShowStatusSuccessModal(false);
        setMessage('');
      }, 2200);
    } catch (err) {
      setError('Error updating status');
      setTimeout(() => setError(''), 3000);
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

  const formatRoleDisplay = (role) => {
    if (!role) return 'Engineer';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getApplicationDisplayName = (application) => getDisplayName(application.personalInfo || application.user || {});

  const getApplicationNameParts = (application) => getNameParts(application.personalInfo || application.user || {});

  const filteredApplications = applications.filter((app) => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();

    if (!statusMatch) return false;
    if (!query) return true;

    const name = getApplicationDisplayName(app).toLowerCase();
    const email = (app.personalInfo?.email || app.user?.email || '').toLowerCase();
    const position = (app.personalInfo?.position || formatRoleDisplay(app.user?.role)).toLowerCase();

    return name.includes(query) || email.includes(query) || position.includes(query);
  });

  const totalApplicants = applications.length;
  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const interviewCount = applications.filter((app) => app.status === 'interview_scheduled').length;
  const hiredCount = applications.filter((app) => app.status === 'hired').length;
  const rejectedCount = applications.filter((app) => app.status === 'rejected').length;
  const hireRate = totalApplicants > 0 ? Math.round((hiredCount / totalApplicants) * 100) : 0;

  const summaryCards = [
    { key: 'total', label: 'Total Applicants', value: totalApplicants, caption: 'All submitted applications in the pipeline.', className: 'admin-summary-total' },
    { key: 'pending', label: 'Pending Review', value: pendingCount, caption: 'Candidates waiting for your next action.', className: 'admin-summary-pending' },
    { key: 'interviews', label: 'Interviews', value: interviewCount, caption: 'Applicants with scheduled interview steps.', className: 'admin-summary-interview' },
    { key: 'hired', label: 'Hired', value: hiredCount, caption: 'Successful candidates already marked hired.', className: 'admin-summary-hired' },
    { key: 'hire-rate', label: 'Hire Rate', value: `${hireRate}%`, caption: 'Percentage of applicants converted to hired.', className: 'admin-summary-rate' }
  ];

  const statusBreakdown = [
    { key: 'pending', label: 'Pending Review', count: pendingCount, badgeClass: 'status-pending' },
    { key: 'interview_scheduled', label: 'Interview Scheduled', count: interviewCount, badgeClass: 'status-interview_scheduled' },
    { key: 'hired', label: 'Hired', count: hiredCount, badgeClass: 'status-hired' },
    { key: 'rejected', label: 'Rejected', count: rejectedCount, badgeClass: 'status-rejected' }
  ];

  const upcomingInterviews = applications
    .filter((app) => app.status === 'interview_scheduled' && app.interviewSchedule?.date)
    .sort((firstApplication, secondApplication) => new Date(firstApplication.interviewSchedule.date) - new Date(secondApplication.interviewSchedule.date))
    .slice(0, 5);

  const recentApplications = applications.slice(0, 5);

  const sidebarItems = [
    { key: 'overview', label: 'Overview', meta: 'Snapshot and totals', sectionId: 'admin-overview' },
    { key: 'pipeline', label: 'Pipeline', meta: 'Status and interviews', sectionId: 'admin-pipeline' },
    { key: 'applications', label: 'Applications', meta: 'Review all applicants', sectionId: 'admin-applications' }
  ];

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner"></div>
        <p className="text-muted">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-kicker">Hiring Operations</span>
            <h2>Admin Panel</h2>
            <p className="sidebar-description">Track applicants, monitor pipeline movement, and manage interviews from one workspace.</p>
          </div>

          <nav className="sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-link ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => scrollToSection(item.key, item.sectionId)}
              >
                <span className="sidebar-link-title">{item.label}</span>
                <span className="sidebar-link-meta">{item.meta}</span>
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
          <section className="dashboard-hero" id="admin-overview">
            <div>
              <span className="sidebar-kicker">Recruitment Snapshot</span>
              <h1>Welcome back, {getDisplayName(user || {})}</h1>
              <p>Review applicant volume, check how candidates are moving through the hiring pipeline, and act on the latest submissions.</p>
            </div>

            <div className="dashboard-hero-meta">
              <div className="hero-stat">
                <span className="hero-stat-label">Applicants in pipeline</span>
                <strong className="hero-stat-value">{totalApplicants}</strong>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Pending actions</span>
                <strong className="hero-stat-value">{pendingCount + interviewCount}</strong>
              </div>
            </div>
          </section>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <section className="stats-grid">
            {summaryCards.map((card) => (
              <article key={card.key} className={`summary-card ${card.className}`}>
                <span className="summary-label">{card.label}</span>
                <strong className="summary-value">{card.value}</strong>
                <p className="summary-caption">{card.caption}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-section-grid" id="admin-pipeline">
            <article className="application-card">
              <div className="section-header">
                <div>
                  <h3>Status Breakdown</h3>
                  <p className="section-subtitle">A quick view of where your applicants currently sit in the process.</p>
                </div>
              </div>

              <ul className="status-breakdown-list">
                {statusBreakdown.map((item) => (
                  <li key={item.key} className="status-breakdown-item">
                    <div>
                      <span className={`status-badge ${item.badgeClass}`}>{item.label}</span>
                    </div>
                    <strong className="status-breakdown-count">{item.count}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="application-card">
              <div className="section-header">
                <div>
                  <h3>Upcoming Interviews</h3>
                  <p className="section-subtitle">Candidates who already have interview schedules assigned.</p>
                </div>
              </div>

              {upcomingInterviews.length > 0 ? (
                <ul className="recent-activity-list">
                  {upcomingInterviews.map((app) => (
                    <li key={app._id} className="recent-activity-item">
                      <div className="recent-activity-head">
                        <div>
                          <strong className="recent-activity-name">{getApplicationDisplayName(app)}</strong>
                          <p className="recent-activity-meta">{app.personalInfo?.email || app.user?.email || 'No email available'}</p>
                        </div>
                        <span className="status-badge status-interview_scheduled">Interview</span>
                      </div>
                      <p className="recent-activity-meta">
                        {new Date(app.interviewSchedule.date).toLocaleDateString()} at {app.interviewSchedule.time}
                      </p>
                      <p className="recent-activity-meta">{app.interviewSchedule.location}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No interview schedules have been created yet.</p>
              )}
            </article>
          </section>

          <section className="application-card table-card" id="admin-applications">
            <div className="section-header">
              <div>
                <h3>All Applications ({filteredApplications.length})</h3>
                <p className="section-subtitle">Filter, review, and open each applicant record from the table below.</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary admin-refresh-btn"
                onClick={handleRefreshApplications}
                disabled={refreshingApplications}
              >
                {refreshingApplications ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="filter-bar">
              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="form-control"
                />
              </div>
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending Review</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {recentApplications.length > 0 && (
              <div className="recent-applicants-strip">
                <span className="strip-label">Latest applicants:</span>
                <div className="strip-items">
                  {recentApplications.map((app) => (
                    <span key={app._id} className="strip-chip">
                      {getApplicationDisplayName(app)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((app) => (
                      <tr key={app._id}>
                        <td>{getApplicationDisplayName(app) || 'N/A'}</td>
                        <td>{app.personalInfo?.position || formatRoleDisplay(app.user?.role)}</td>
                        <td>{app.personalInfo?.email || app.user?.email || 'N/A'}</td>
                        <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                            {getStatusText(app.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewApplication(app)}
                            className="btn btn-primary"
                            style={{ padding: '6px 16px', fontSize: '0.75rem' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ padding: '40px' }}>
                        <p className="text-muted">No applications found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button onClick={closeModal} className="close-btn" aria-label="Close application details">
                x
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-grid">
                <section className="modal-info-card">
                  <h4>Personal Information</h4>
                  <div className="modal-info-list">
                    <div className="modal-info-item">
                      <span className="modal-info-label">First Name</span>
                      <span className="modal-info-value">{getApplicationNameParts(selectedApplication).firstName || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Last Name</span>
                      <span className="modal-info-value">{getApplicationNameParts(selectedApplication).lastName || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Email</span>
                      <span className="modal-info-value">{selectedApplication.personalInfo?.email || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Phone</span>
                      <span className="modal-info-value">{selectedApplication.personalInfo?.phone || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Address</span>
                      <span className="modal-info-value">{selectedApplication.personalInfo?.address || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Date of Birth</span>
                      <span className="modal-info-value">{selectedApplication.personalInfo?.dateOfBirth ? new Date(selectedApplication.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Position</span>
                      <span className="modal-info-value">{selectedApplication.personalInfo?.position || formatRoleDisplay(selectedApplication.user?.role)}</span>
                    </div>
                  </div>
                </section>
              </div>

              {selectedApplication.resume && (
                <section className="form-group modal-info-card">
                  <h4>Resume</h4>
                  <div className="modal-info-list">
                    <div className="modal-info-item">
                      <span className="modal-info-label">File</span>
                      <span className="modal-info-value">{selectedApplication.resume.originalName}</span>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000/${selectedApplication.resume.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary modal-resume-btn"
                  >
                    View Resume
                  </a>
                </section>
              )}

              <section className="form-group modal-info-card">
                <h4>Current Status</h4>
                <div className="modal-info-list">
                  <div className="modal-info-item">
                    <span className="modal-info-label">Status</span>
                    <span className="modal-info-value">
                      <span className={`status-badge ${getStatusBadgeClass(selectedApplication.status)}`}>
                        {getStatusText(selectedApplication.status)}
                      </span>
                    </span>
                  </div>
                </div>
                {selectedApplication.interviewSchedule && (
                  <div className="modal-subinfo-list">
                    <div className="modal-info-item">
                      <span className="modal-info-label">Interview Date</span>
                      <span className="modal-info-value">{new Date(selectedApplication.interviewSchedule.date).toLocaleDateString()}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Interview Time</span>
                      <span className="modal-info-value">{selectedApplication.interviewSchedule.time}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="modal-info-label">Location</span>
                      <span className="modal-info-value">{selectedApplication.interviewSchedule.location}</span>
                    </div>
                    {selectedApplication.interviewSchedule.notes && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Notes</span>
                        <span className="modal-info-value">{selectedApplication.interviewSchedule.notes}</span>
                      </div>
                    )}
                  </div>
                )}
                {selectedApplication.adminNotes && (
                  <div className="modal-subinfo-list">
                    <div className="modal-info-item">
                      <span className="modal-info-label">Admin Notes</span>
                      <span className="modal-info-value">{selectedApplication.adminNotes}</span>
                    </div>
                  </div>
                )}
              </section>

              <div className="form-group">
                <h4>Schedule Interview</h4>
                <form onSubmit={handleScheduleInterview}>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
                      value={interviewData.date}
                      onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {validationErrors.date && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.date}</small>}
                  </div>
                  <div className="form-group">
                    <label>Time *</label>
                    <input
                      type="time"
                      className={`form-control ${validationErrors.time ? 'is-invalid' : ''}`}
                      value={interviewData.time}
                      onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                    />
                    {validationErrors.time && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.time}</small>}
                  </div>
                  <div className="form-group">
                    <label>Location / Meeting Link *</label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.location ? 'is-invalid' : ''}`}
                      placeholder="Zoom link or office address"
                      value={interviewData.location}
                      onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                    />
                    {validationErrors.location && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.location}</small>}
                  </div>
                  <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Additional instructions"
                      value={interviewData.notes}
                      onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-submit">Schedule Interview</button>
                </form>
              </div>

              <div className="form-group">
                <h4>Update Status</h4>
                <form onSubmit={handleUpdateStatus}>
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      className={`form-control ${validationErrors.status ? 'is-invalid' : ''}`}
                      value={statusData.status}
                      onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    {validationErrors.status && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.status}</small>}
                  </div>
                  <div className="form-group">
                    <label>Admin Notes {statusData.status === 'rejected' && '*'}</label>
                    <textarea
                      className={`form-control ${validationErrors.adminNotes ? 'is-invalid' : ''}`}
                      rows="3"
                      placeholder={statusData.status === 'rejected' ? 'Reason for rejection' : 'Add notes about this decision'}
                      value={statusData.adminNotes}
                      onChange={(e) => setStatusData({ ...statusData, adminNotes: e.target.value })}
                    />
                    {validationErrors.adminNotes && <small className="text-sm text-muted" style={{ color: '#ef4444' }}>{validationErrors.adminNotes}</small>}
                  </div>
                  <button type="submit" className="btn-submit">Update Status</button>
                </form>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showStatusSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowStatusSuccessModal(false)}>
          <div className="modal admin-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Status Updated</h3>
              <button onClick={() => setShowStatusSuccessModal(false)} className="close-btn" aria-label="Close success modal">
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-success-check-icon" aria-hidden="true">&#10003;</div>
              <p>The applicant status has been updated successfully.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
