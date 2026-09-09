import React, { useState } from 'react';
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
    
    setLoading(true);
    
    try {
      await register(form);
      showToast('Registration successful');
      navigate('/dashboard');
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
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
            <h1>Create Account</h1>
            <p>Join Go Nature Farms for the best natural products</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
