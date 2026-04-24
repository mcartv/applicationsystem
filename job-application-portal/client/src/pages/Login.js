import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/engineer-dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cooldownTime > 0) {
      setError(`Too many failed attempts. Please wait ${cooldownTime} seconds before trying again.`);
      return;
    }

    const username = formData.username.trim().toLowerCase();

    // Hardcoded admin check
    if (username === 'admin' && formData.password === 'admin123') {
      const adminUser = {
        id: 'admin001',
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        name: 'Administrator',
        email: 'admin@system.com',
        role: 'admin'
      };
      localStorage.setItem('token', 'admin-token-123');
      localStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
      navigate('/admin-dashboard');
      window.location.reload();
      return;
    }

    setLoading(true);
    const result = await login(username, formData.password);

    if (!result.success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        setCooldownTime(60);
        setError('Too many failed attempts (5/5). Please wait 60 seconds before trying again.');
        setFailedAttempts(0);
      } else {
        setError(`${result.error} (${newAttempts}/5 attempts remaining before 60s cooldown)`);
      }
      setLoading(false);
    } else {
      setFailedAttempts(0);
    }
  };

  const setUser = (userData) => {
    window.dispatchEvent(new CustomEvent('authChange', { detail: userData }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
          Back
        </button>
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Login with your username to access your dashboard</p>
        {error && <div className="alert alert-error">{error}</div>}
        {cooldownTime > 0 && (
          <div className="alert alert-warning" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
            Cooldown active: {cooldownTime} seconds remaining
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              disabled={cooldownTime > 0}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={cooldownTime > 0}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={cooldownTime > 0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${showPassword ? 'hide' : 'view'}.png`}
                  alt={showPassword ? 'Hide password' : 'Show password'}
                  className="password-toggle-icon"
                />
              </button>
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={loading || cooldownTime > 0}>
            {loading ? 'Logging in...' : cooldownTime > 0 ? `Wait ${cooldownTime}s` : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '25px', color: '#666' }}>
          Don&apos;t have an account? <Link to="/register" style={{ color: '#2a5298', fontWeight: '600' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
