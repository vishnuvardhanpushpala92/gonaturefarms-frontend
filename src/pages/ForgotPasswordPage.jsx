import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [step, setStep] = useState(1); // 1: email/phone, 2: reset password
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityQuestion, setSecurityQuestion] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password/verify', { identifier: form.username });
      if (data.success && data.securityQuestion) {
        setSecurityQuestion(data.securityQuestion);
        setStep(2);
        showToast('Account found. Please answer your security question.');
      } else {
        showToast(data.message || 'Account not found');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Account not found. Please check your mobile number or email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password/security-question', {
        email: form.username,
        answer: form.securityAnswer,
        newPassword: form.newPassword
      });
      if (data.success) {
        showToast('Password reset successfully. Please login with your new password.');
        navigate('/login');
      } else {
        showToast(data.message || 'Failed to reset password');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        {/* Left Brand Section */}
        <div className="auth-brand-section">
          <img src="/logo.png" alt="Go Nature Farms" className="auth-brand-logo" />
          <h1 className="auth-brand-title">Reset Your Password</h1>
          <p className="auth-brand-subtitle">Securely reset your password to access your account.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-title">Secure</div>
              <div className="auth-feature-desc">Your password is encrypted and secure.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✅</div>
              <div className="auth-feature-title">Verified</div>
              <div className="auth-feature-desc">Security question verification required.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔄</div>
              <div className="auth-feature-title">Easy</div>
              <div className="auth-feature-desc">Simple 3-step password reset process.</div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <img src="/logo.png" alt="Go Nature Farms" className="auth-form-logo" />
              <h2 className="auth-form-title">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Reset Password'}
              </h2>
              <p className="auth-form-subtitle">
                {step === 1 && 'Enter your mobile number or email to find your account'}
                {step === 2 && 'Answer your security question and create a new password'}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="username">Mobile Number / Email</label>
                  <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    placeholder="Enter your mobile number or email"
                  />
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Finding account...' : 'Find Account'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label>Security Question</label>
                  <div className="security-question-display">{securityQuestion}</div>
                </div>

                <div className="form-group">
                  <label htmlFor="securityAnswer">Your Answer</label>
                  <input
                    id="securityAnswer"
                    type="text"
                    value={form.securityAnswer}
                    onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })}
                    required
                    placeholder="Enter your answer"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    required
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="auth-button secondary"
                  style={{ marginTop: '10px' }}
                >
                  Back
                </button>
              </form>
            )}

            <div className="auth-footer">
              <p>Remember your password? <Link to="/login">Login</Link></p>
              <p><Link to="/register">Create an account</Link></p>
              <button
                onClick={() => navigate('/')}
                className="view-store-btn"
              >
                View Store
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
