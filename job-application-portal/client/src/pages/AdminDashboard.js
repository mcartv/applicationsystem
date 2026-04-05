import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
  }, [user, navigate]);

  const fetchApplications = async () => {
    try {
      const res = await axios.get('/admin/applications');
      setApplications(res.data);
    } catch (err) {
      setError('Error fetching applications');
    } finally {
      setLoading(false);
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
      fetchApplications();
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
      fetchApplications();
      setTimeout(() => {
        closeModal();
        setMessage('');
      }, 2000);
    } catch (err) {
      setError('Error updating status');
      setTimeout(() => setError(''), 3000);
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

  const formatRoleDisplay = (role) => {
    if (!role) return 'Engineer';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredApplications = applications.filter((app) => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();

    if (!statusMatch) return false;
    if (!query) return true;

    const name = (app.personalInfo?.fullName || app.user?.name || '').toLowerCase();
    const email = (app.personalInfo?.email || app.user?.email || '').toLowerCase();
    const position = (app.personalInfo?.position || formatRoleDisplay(app.user?.role)).toLowerCase();

    return name.includes(query) || email.includes(query) || position.includes(query);
  });

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '50px' }}>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard - Welcome, {user?.name}</h2>
        <button 
          onClick={logout} 
          className="btn btn-secondary"
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="application-card">
          <h3>All Applications ({filteredApplications.length})</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px' }}>
              <label htmlFor="searchQuery" style={{ fontWeight: '600' }}>Search:</label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or email"
                className="form-control"
                style={{ width: '420px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px' }}>
              <label htmlFor="statusFilter" style={{ fontWeight: '600' }}>Filter by status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="form-control"
                style={{ width: '220px' }}
              >
                <option value="all">All</option>
                <option value="pending">Pending Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="applications-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Email</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length > 0 ? filteredApplications.map(app => (
                  <tr key={app._id}>
                    <td>{app.personalInfo?.fullName || app.user?.name || 'N/A'}</td>
                    <td>{app.personalInfo?.position || formatRoleDisplay(app.user?.role)}</td>
                    <td>{app.personalInfo?.email || app.user?.email || 'N/A'}</td>
                    <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusBadgeClass(app.status)}>
                        {getStatusText(app.status)}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewApplication(app)}
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No applications match the selected status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Application Details */}
      {showModal && selectedApplication && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Application Details</h3>
              <button 
                onClick={closeModal}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Personal Information */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Personal Information</h4>
              <p><strong>Name:</strong> {selectedApplication.personalInfo?.fullName}</p>
              <p><strong>Email:</strong> {selectedApplication.personalInfo?.email}</p>
              <p><strong>Phone:</strong> {selectedApplication.personalInfo?.phone}</p>
              <p><strong>Address:</strong> {selectedApplication.personalInfo?.address || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {selectedApplication.personalInfo?.dateOfBirth ? new Date(selectedApplication.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Position:</strong> {selectedApplication.personalInfo?.position || formatRoleDisplay(selectedApplication.user?.role)}</p>
            </div>
            
            {/* Resume */}
            {selectedApplication.resume && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Resume</h4>
                <p><strong>File:</strong> {selectedApplication.resume.originalName}</p>
                <a 
                  href={`http://localhost:5000/${selectedApplication.resume.path}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '0.9rem', display: 'inline-block', marginTop: '5px' }}
                >
                  View Resume
                </a>
              </div>
            )}
            
            {/* Current Status */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Current Status</h4>
              <p><strong>Status:</strong> {getStatusText(selectedApplication.status)}</p>
              {selectedApplication.interviewSchedule && (
                <div>
                  <p><strong>Interview Date:</strong> {new Date(selectedApplication.interviewSchedule.date).toLocaleDateString()}</p>
                  <p><strong>Interview Time:</strong> {selectedApplication.interviewSchedule.time}</p>
                  <p><strong>Location:</strong> {selectedApplication.interviewSchedule.location}</p>
                  {selectedApplication.interviewSchedule.notes && (
                    <p><strong>Notes:</strong> {selectedApplication.interviewSchedule.notes}</p>
                  )}
                </div>
              )}
              {selectedApplication.adminNotes && (
                <p><strong>Admin Notes:</strong> {selectedApplication.adminNotes}</p>
              )}
            </div>
            
            {/* Schedule Interview Form */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Schedule Interview</h4>
              <form onSubmit={handleScheduleInterview}>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {validationErrors.date && <small style={{ color: '#dc3545' }}>{validationErrors.date}</small>}
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    className={`form-control ${validationErrors.time ? 'is-invalid' : ''}`}
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                    required
                  />
                  {validationErrors.time && <small style={{ color: '#dc3545' }}>{validationErrors.time}</small>}
                </div>
                <div className="form-group">
                  <label>Location / Meeting Link *</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.location ? 'is-invalid' : ''}`}
                    placeholder="e.g., Zoom link or office address"
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                    required
                  />
                  {validationErrors.location && <small style={{ color: '#dc3545' }}>{validationErrors.location}</small>}
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    Enter a valid Zoom/Google Meet link or physical address
                  </small>
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Additional instructions for the candidate"
                    value={interviewData.notes}
                    onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-submit" style={{ marginTop: '10px' }}>
                  Schedule Interview
                </button>
              </form>
            </div>
            
            {/* Update Status Form */}
            <div>
              <h4>Update Status</h4>
              <form onSubmit={handleUpdateStatus}>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    className={`form-control ${validationErrors.status ? 'is-invalid' : ''}`}
                    value={statusData.status}
                    onChange={(e) => setStatusData({...statusData, status: e.target.value})}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {validationErrors.status && <small style={{ color: '#dc3545' }}>{validationErrors.status}</small>}
                </div>
                <div className="form-group">
                  <label>Admin Notes {statusData.status === 'rejected' && '*'}</label>
                  <textarea
                    className={`form-control ${validationErrors.adminNotes ? 'is-invalid' : ''}`}
                    rows="3"
                    placeholder={statusData.status === 'rejected' ? "Please provide a reason for rejection" : "Add notes about this decision (optional)"}
                    value={statusData.adminNotes}
                    onChange={(e) => setStatusData({...statusData, adminNotes: e.target.value})}
                    required={statusData.status === 'rejected'}
                  />
                  {validationErrors.adminNotes && <small style={{ color: '#dc3545' }}>{validationErrors.adminNotes}</small>}
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {statusData.status === 'rejected' ? 'Reason for rejection is required' : 'Optional: Add any relevant notes'}
                  </small>
                </div>
                <button type="submit" className="btn-submit" style={{ marginTop: '10px' }}>
                  Update Status
                </button>
              </form>
            </div>
            
            <button 
              onClick={closeModal}
              className="btn btn-secondary"
              style={{ marginTop: '20px', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;