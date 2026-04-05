import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="container">
          <h1>Your Dream Job Awaits</h1>
          <p>Join thousands of successful candidates who found their perfect career through our platform</p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <Link to="/login" className="btn btn-primary">Get Started</Link>
                <Link to="/register" className="btn btn-secondary">Create Account</Link>
              </>
            ) : (
              <Link to={user.role === 'admin' ? '/admin-dashboard' : '/engineer-dashboard'} className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <p className="section-subtitle">We make job applications simple, fast, and efficient</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Easy Application</h3>
              <p>Fill out your personal information and upload your resume in just a few minutes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Real-time Tracking</h3>
              <p>Monitor your application status and get instant updates on your progress.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Smart Scheduling</h3>
              <p>Get notified about interviews and manage your schedule effortlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Secure Platform</h3>
              <p>Your data is safe with our enterprise-grade security measures.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Fast Processing</h3>
              <p>Quick response times and efficient application handling.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Top Companies</h3>
              <p>Connect with leading employers looking for talented professionals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;