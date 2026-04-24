import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [usernameExists, setUsernameExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/engineer-dashboard');
    }
  }, [user, navigate]);

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    return usernameRegex.test(username);
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

  const checkUsernameExists = async (username) => {
    if (!validateUsername(username)) {
      return false;
    }

    try {
      const res = await axios.get('/auth/check-username', {
        params: { username }
      });
      setUsernameExists(res.data.exists);
      return res.data.exists;
    } catch (err) {
      console.error('Username check failed', err);
      return false;
    }
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
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'username') {
      setUsernameExists(false);
    }

    if (name === 'email') {
      setEmailExists(false);
    }

    if (fieldErrors[name]) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [name]: ''
      }));
    }
  };

  const handleUsernameBlur = async () => {
    if (formData.username) {
      const exists = await checkUsernameExists(formData.username.trim().toLowerCase());
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        username: exists ? 'This username is already taken.' : ''
      }));
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email) {
      const exists = await checkEmailExists(formData.email.trim());
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        email: exists ? 'This email is already registered.' : ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const username = formData.username.trim().toLowerCase();
    const nextFieldErrors = {};

    if (!validateUsername(username)) {
      nextFieldErrors.username = 'Username must be 4-20 characters and use only letters, numbers, or underscores';
    }

    if (!nextFieldErrors.username) {
      const usernameTaken = await checkUsernameExists(username);
      if (usernameTaken) {
        nextFieldErrors.username = 'This username is already taken. Please choose a different one.';
      }
    }

    if (!validateNamePart(formData.firstName.trim())) {
      nextFieldErrors.firstName = 'First name must contain only letters and spaces (2-50 characters)';
    }

    if (!validateNamePart(formData.lastName.trim())) {
      nextFieldErrors.lastName = 'Last name must contain only letters and spaces (2-50 characters)';
    }

    const email = formData.email.trim();

    if (!validateEmail(email)) {
      nextFieldErrors.email = 'Please enter a valid email address';
    }

    if (!nextFieldErrors.email) {
      const emailTaken = await checkEmailExists(email);
      if (emailTaken) {
        nextFieldErrors.email = 'This email is already registered. Please use a different email.';
      }
    }

    if (!validatePhone(formData.phone.trim())) {
      nextFieldErrors.phone = 'Phone number must contain only numbers (10-15 digits)';
    }

    if (!validateDateOfBirth(formData.dateOfBirth)) {
      nextFieldErrors.dateOfBirth = 'You must be at least 18 years old';
    }

    if (!validatePassword(formData.password)) {
      nextFieldErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number. Special characters are not allowed.';
    }

    if (formData.password !== formData.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(nextFieldErrors).some((key) => nextFieldErrors[key])) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);

    const result = await register({
      username,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      password: formData.password
    });

    if (!result.success) {
      const normalizedError = String(result.error || '').toLowerCase();

      if (normalizedError.includes('username')) {
        setFieldErrors((currentErrors) => ({ ...currentErrors, username: result.error }));
      } else if (normalizedError.includes('email')) {
        setFieldErrors((currentErrors) => ({ ...currentErrors, email: result.error }));
      } else if (normalizedError.includes('password')) {
        setFieldErrors((currentErrors) => ({ ...currentErrors, password: result.error }));
      } else {
        setError(result.error);
      }

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
        >
          Back
        </button>
        <h2>Create Account</h2>
        <p className="form-subtitle">Create your profile now so your application form is already prepared later.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`}
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleUsernameBlur}
              required
            />
            <small className={`hint-text ${(fieldErrors.username || usernameExists) ? 'error' : ''}`}>
              {fieldErrors.username || (usernameExists ? 'This username is already taken.' : 'Use 4-20 letters, numbers, or underscores')}
            </small>
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            {fieldErrors.firstName && <small className="hint-text error">{fieldErrors.firstName}</small>}
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            {fieldErrors.lastName && <small className="hint-text error">{fieldErrors.lastName}</small>}
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              required
            />
            <small className={`hint-text ${(fieldErrors.email || emailExists) ? 'error' : ''}`}>
              {fieldErrors.email || (emailExists ? 'This email is already registered.' : 'Email must be unique and valid format')}
            </small>
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <small className={`hint-text ${fieldErrors.phone ? 'error' : ''}`}>
              {fieldErrors.phone || 'Use 10 to 15 digits only.'}
            </small>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              className="form-control"
              placeholder="Enter your current address"
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
              className={`form-control ${fieldErrors.dateOfBirth ? 'is-invalid' : ''}`}
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
            <small className={`hint-text ${fieldErrors.dateOfBirth ? 'error' : ''}`}>
              {fieldErrors.dateOfBirth || 'You must be at least 18 years old to apply.'}
            </small>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${showPassword ? 'hide' : 'view'}.png`}
                  alt={showPassword ? 'Hide password' : 'Show password'}
                  className="password-toggle-icon"
                />
              </button>
            </div>
            <small className={`hint-text ${fieldErrors.password ? 'error' : ''}`}>
              {fieldErrors.password || 'Password must be at least 8 characters with uppercase, lowercase, and number. No special characters allowed.'}
            </small>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${showConfirmPassword ? 'hide' : 'view'}.png`}
                  alt={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="password-toggle-icon"
                />
              </button>
            </div>
            {fieldErrors.confirmPassword && <small className="hint-text error">{fieldErrors.confirmPassword}</small>}
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footnote">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
