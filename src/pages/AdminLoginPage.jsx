import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminLogin(form.username, form.password);
      showToast('Admin login successful');
      navigate('/admin');
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Invalid admin credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-login-page">
      <div className="auth-split-layout">
        {/* Left Brand Section */}
        <div className="auth-brand-section">
          <img src="/logo.png" alt="Go Nature Farms" className="auth-brand-logo" />
          <h1 className="auth-brand-title">Admin Portal</h1>
          <p className="auth-brand-subtitle">Secure administrator access for Go Nature Farms management.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-title">Secure Access</div>
              <div className="auth-feature-desc">Protected admin interface with role-based permissions.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📊</div>
              <div className="auth-feature-title">Order Management</div>
              <div className="auth-feature-desc">Complete order tracking and fulfillment control.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚙️</div>
              <div className="auth-feature-title">Store Control</div>
              <div className="auth-feature-desc">Manage products, content, and customer data.</div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <img src="/logo.png" alt="Go Nature Farms" className="auth-form-logo" />
              <h2 className="auth-form-title">Admin Login</h2>
              <p className="auth-form-subtitle">Enter your administrator credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="admin-username">Admin Username</label>
                <input
                  id="admin-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="Enter admin username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">Admin Password</label>
                <div className="password-input">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Authenticating...' : 'Access Admin Panel'}
              </button>
            </form>

            <div className="auth-footer">
              <p><span className="security-notice">🔒 Secure Administrator Area</span></p>
              <p><a href="/">Return to Website</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
