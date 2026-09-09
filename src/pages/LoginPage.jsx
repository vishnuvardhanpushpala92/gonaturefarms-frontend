import React, { useState, useEffect, useRef } from 'react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const pageRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      showToast(err?.userMessage || err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" ref={pageRef}>
      <div className="auth-background login-background" style={{
        transform: `perspective(1000px) rotateY(${mousePosition.x * 0.5}deg) rotateX(${-mousePosition.y * 0.5}deg)`,
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
        <div className="auth-card">
          <div className="auth-header">
            <img src="/logo.png" alt="Go Nature Farms" className="auth-logo" />
            <h1>Welcome Back</h1>
            <p>Login to your Go Nature Farms account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Email or Phone</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                placeholder="Enter your email or phone number"
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
          </div>
        </div>
      </div>
    </div>
  );
}
