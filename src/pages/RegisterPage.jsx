import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength) => {
    if (strength === 0) return 'Enter password';
    if (strength === 1) return 'Very Weak';
    if (strength === 2) return 'Weak';
    if (strength === 3) return 'Fair';
    if (strength === 4) return 'Good';
    if (strength === 5) return 'Strong';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      showToast(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(form.phone)) {
      showToast('Mobile Number incorrect');
      return;
    }

    // Validate email
    if (form.email && !/^[A-Za-z0-9+_.-]+@(.+)$/.test(form.email)) {
      showToast('Email incorrect');
      return;
    }

    setLoading(true);

    try {
      const result = await register(form);
      
      // Only navigate if registration actually succeeded
      if (result.success) {
        showToast('Registration successful');
        navigate('/login');
      } else {
        // Registration failed - show the error message from backend
        showToast(result.message || 'Registration failed');
      }
    } catch (err) {
      // Backend already returns field-specific errors - pass them through
      const errorMessage = err?.response?.data?.message || err?.userMessage || 'Registration failed. Please try again.';
      showToast(errorMessage);
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
          <h1 className="auth-brand-title">Join Go Nature Farms</h1>
          <p className="auth-brand-subtitle">Create your account and experience fresh, natural products from the farm.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🌱</div>
              <div className="auth-feature-title">Fresh & Natural</div>
              <div className="auth-feature-desc">Quality organic products from trusted farms.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🚜</div>
              <div className="auth-feature-title">Direct from Farm</div>
              <div className="auth-feature-desc">Farm-to-table freshness guaranteed.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">❤️</div>
              <div className="auth-feature-title">Trusted by Families</div>
              <div className="auth-feature-desc">Join thousands of happy customers.</div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <img src="/logo.png" alt="Go Nature Farms" className="auth-form-logo" />
              <h2 className="auth-form-title">Create Account</h2>
              <p className="auth-form-subtitle">Join Go Nature Farms for the best natural products</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="Choose a username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Password Strength
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        gap: '2px'
                      }}>
                        {[1, 2, 3, 4, 5].map((segment) => (
                          <div
                            key={segment}
                            style={{
                              flex: 1,
                              height: '100%',
                              background: getPasswordStrength(form.password) >= segment 
                                ? (getPasswordStrength(form.password) === 5 ? '#22c55e' : getPasswordStrength(form.password) >= 4 ? '#3b82f6' : getPasswordStrength(form.password) >= 3 ? '#f59e0b' : '#ef4444')
                                : '#e5e7eb',
                              transition: 'background 0.3s ease',
                              borderRadius: '2px'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: getPasswordStrength(form.password) === 5 ? '#22c55e' : getPasswordStrength(form.password) >= 4 ? '#3b82f6' : getPasswordStrength(form.password) >= 3 ? '#f59e0b' : '#ef4444',
                        whiteSpace: 'nowrap',
                        minWidth: '80px'
                      }}>
                        {getStrengthLabel(getPasswordStrength(form.password))}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Password must include:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: form.password.length >= 8 ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                          {form.password.length >= 8 ? '✓' : '✗'}
                        </span>
                        <span>At least 8 characters</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: /[A-Z]/.test(form.password) ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                          {/[A-Z]/.test(form.password) ? '✓' : '✗'}
                        </span>
                        <span>One uppercase letter (A-Z)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: /[a-z]/.test(form.password) ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                          {/[a-z]/.test(form.password) ? '✓' : '✗'}
                        </span>
                        <span>One lowercase letter (a-z)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: /[0-9]/.test(form.password) ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                          {/[0-9]/.test(form.password) ? '✓' : '✗'}
                        </span>
                        <span>One number (0-9)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                          {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? '✓' : '✗'}
                        </span>
                        <span>One special character (@ # $ % !)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="toggle-password"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {form.confirmPassword && (
                  <div style={{ marginTop: '8px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: form.password === form.confirmPassword ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                      {form.password === form.confirmPassword ? '✓' : '✗'}
                    </span>
                    <span style={{ color: form.password === form.confirmPassword ? '#22c55e' : '#ef4444' }}>
                      {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="securityQuestion">Security Question</label>
                <select
                  id="securityQuestion"
                  value={form.securityQuestion}
                  onChange={(e) => setForm({ ...form, securityQuestion: e.target.value })}
                  required
                >
                  <option value="">Select a security question</option>
                  <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What is your favorite color?">What is your favorite color?</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="securityAnswer">Security Answer</label>
                <input
                  id="securityAnswer"
                  type="text"
                  value={form.securityAnswer}
                  onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })}
                  required
                  placeholder="Enter your answer"
                />
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login</Link></p>
              <p><Link to="/tracking">Track your order</Link></p>
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
