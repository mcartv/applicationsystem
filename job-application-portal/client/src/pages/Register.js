import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/engineer-dashboard');
    }
  }, [user, navigate]);

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (email) => {
    if (!validateEmail(email)) {
      return false;
    }

    try {
      const res = await axios.get('/auth/check-email', {
        params: { email }
      });
      setEmailExists(res.data.exists);
      return res.data.exists;
    } catch (err) {
      console.error('Email check failed', err);
      return false;
    }
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'email') {
      setEmailExists(false);
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email) {
      await checkEmailExists(formData.email.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateName(formData.name)) {
      setError('Name must contain only letters and spaces (2-50 characters)');
      return;
    }

    const email = formData.email.trim();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const exists = await checkEmailExists(email);
    if (exists) {
      setError('This email is already registered. Please use a different email.');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number. Special characters are not allowed.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register(
      formData.name,
      email,
      formData.password
    );
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <div className="form-container">
        <button 
          onClick={goBack} 
          className="btn-back"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#2a5298',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Back
        </button>
        <h2>Create Account</h2>
        <p className="form-subtitle">Join us and start your journey</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Enter your full name (letters only, 2-50 characters)"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              required
            />
            <small style={{ color: emailExists ? '#c00' : '#666', display: 'block', marginTop: '5px' }}>
              {emailExists ? 'This email is already registered.' : 'Email must be unique and valid format'}
            </small>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${showPassword ? 'hide' : 'view'}.png`}
                  alt={showPassword ? "Hide password" : "Show password"}
                  className="password-toggle-icon"
                />
              </button>
            </div>
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Password must be at least 8 characters with uppercase, lowercase, and number. No special characters allowed.
            </small>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className="form-control"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${showConfirmPassword ? 'hide' : 'view'}.png`}
                  alt={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="password-toggle-icon"
                />
              </button>
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '25px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#2a5298', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;