import React, { useState, useEffect, useRef } from 'react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const pageRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 15;
      const y = (clientY / innerHeight - 0.5) * 15;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await adminLogin(form.username, form.password);
      showToast('Admin login successful');
      navigate('/admin');
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Admin login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-login-page" ref={pageRef}>
      <div className="auth-background admin-background" style={{
        transform: `perspective(1000px) rotateY(${mousePosition.x * 0.3}deg) rotateX(${-mousePosition.y * 0.3}deg)`,
        transition: 'transform 0.1s ease-out'
      }}>
        <div className="floating-leaves">
          <div className="leaf leaf-1"></div>
          <div className="leaf leaf-2"></div>
          <div className="leaf leaf-3"></div>
          <div className="leaf leaf-4"></div>
        </div>
      </div>
      
      <div className="auth-container">
        <div className="auth-card admin-card">
          <div className="auth-header">
            <img src="/logo.png" alt="Go Nature Farms" className="auth-logo" />
            <h1>Admin Portal</h1>
            <p>Secure administrator access</p>
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
            
            <button type="submit" className="auth-button admin-button" disabled={loading}>
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
  );
}
