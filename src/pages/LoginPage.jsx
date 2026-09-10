import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle intended action after successful login
  useEffect(() => {
    const intendedAction = sessionStorage.getItem('gnf_intended_action');
    if (intendedAction && loading === false) {
      try {
        const action = JSON.parse(intendedAction);
        if (action.type === 'add_to_cart' && action.product) {
          addItem(action.product);
          showToast('Product added to cart');
          sessionStorage.removeItem('gnf_intended_action');
        }
      } catch (err) {
        console.error('Failed to restore intended action:', err);
      }
    }
  }, [loading, addItem, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(form.username, form.password);
      showToast('Login successful');
      navigate('/dashboard');
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Invalid mobile number or password.');
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
          <h1 className="auth-brand-title">Welcome to Go Nature Farms!</h1>
          <p className="auth-brand-subtitle">Login to continue and explore our fresh organic products.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">⭐</div>
              <div className="auth-feature-title">Farm Fresh</div>
              <div className="auth-feature-desc">Fresh products directly from our farms.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🌱</div>
              <div className="auth-feature-title">100% Natural</div>
              <div className="auth-feature-desc">Quality-focused natural products.</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">❤️</div>
              <div className="auth-feature-title">Trusted</div>
              <div className="auth-feature-desc">Trusted by our customers.</div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <img src="/logo.png" alt="Go Nature Farms" className="auth-form-logo" />
              <h2 className="auth-form-title">Login</h2>
              <p className="auth-form-subtitle">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
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

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Enter your password"
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
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register">Register</Link></p>
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
