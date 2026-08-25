import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What is your favorite food?",
  "What city were you born in?",
  "What is your favorite movie?",
  "What is your dream job?"
];

export default function AuthModal({ open, onClose }) {
  const { user, login, register, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [regForm, setRegForm] = useState({ 
    name: '', phone: '', email: '', pincode: '', password: '', confirmPassword: '', 
    securityQuestion: '', securityAnswer: '', puzzleAnswer: '' 
  });
  const [forgotForm, setForgotForm] = useState({ 
    identifier: '', securityQuestion: '', securityAnswer: '', 
    newPassword: '', confirmPassword: '', forgotStep: 1 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await login(loginForm.identifier, loginForm.password);
      showToast(data.message || (data.success ? 'Welcome back!' : 'Login failed'));
      if (data.success) {
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (regForm.password !== regForm.confirmPassword) {
        showToast('Passwords do not match');
        setBusy(false);
        return;
      }
      const data = await register(regForm);
      showToast(data.message || (data.success ? 'Welcome!' : 'Registration failed'));
      if (data.success) onClose();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (forgotForm.forgotStep === 1) {
        // Step 1: Verify security question
        const { data } = await api.post('/auth/forgot-password/verify', { identifier: forgotForm.identifier });
        if (data.success) {
          setForgotForm({ ...forgotForm, securityQuestion: data.securityQuestion, forgotStep: 2 });
          showToast('Security question found. Please answer it.');
        }
      } else if (forgotForm.forgotStep === 2) {
        // Step 2: Verify answer and reset password
        const { data } = await api.post('/auth/reset-password/security-question', {
          identifier: forgotForm.identifier,
          securityAnswer: forgotForm.securityAnswer,
          newPassword: forgotForm.newPassword,
          confirmPassword: forgotForm.confirmPassword
        });
        showToast(data.message || 'Password reset successful');
        if (data.success) {
          setTab('login');
          setForgotForm({ identifier: '', securityQuestion: '', securityAnswer: '', newPassword: '', confirmPassword: '', forgotStep: 1 });
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.role?.includes('admin')) {
    return (
      <Modal open={open} onClose={onClose} title="My Account" narrow>
        <div className="profile-card">
          <div className="pa">{user.name?.charAt(0).toUpperCase()}</div>
          <strong>{user.name}</strong>
          <p style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{user.phone}</p>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => { onClose(); navigate('/dashboard'); }}>
          Go to Dashboard
        </button>
        <button className="btn btn-danger btn-block" onClick={() => { logout(); onClose(); navigate('/'); }}>Logout</button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Welcome" subtitle="Login or create an account" narrow>
      <div className="auth-tabs">
        <button className={`atab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Login</button>
        <button className={`atab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Register</button>
        <button className={`atab${tab === 'forgot' ? ' active' : ''}`} onClick={() => setTab('forgot')}>Forgot Password</button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className="fg">
            <label>Phone or Email</label>
            <input required value={loginForm.identifier}
                   onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })} />
          </div>
          <div className="fg">
            <label>Password</label>
            <input required type="password" value={loginForm.password}
                   onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          </div>
          <button type="button" className="btn btn-link" style={{ fontSize: '.8rem', padding: 0, marginBottom: 12 }} onClick={() => setTab('forgot')}>
            Forgot Password?
          </button>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
        </form>
      ) : tab === 'forgot' ? (
        <form onSubmit={handleForgotPassword}>
          {forgotForm.forgotStep === 1 ? (
            <>
              <div className="fg">
                <label>Phone or Email</label>
                <input required value={forgotForm.identifier}
                       onChange={(e) => setForgotForm({ ...forgotForm, identifier: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Verifying...' : 'Find Account'}</button>
            </>
          ) : (
            <>
              <div className="fg">
                <label>Security Question</label>
                <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                  {forgotForm.securityQuestion}
                </div>
              </div>
              <div className="fg">
                <label>Your Answer</label>
                <input required value={forgotForm.securityAnswer}
                       onChange={(e) => setForgotForm({ ...forgotForm, securityAnswer: e.target.value })} />
              </div>
              <div className="fg">
                <label>New Password (min 6 chars)</label>
                <input required type="password" minLength={6} value={forgotForm.newPassword}
                       onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })} />
              </div>
              <div className="fg">
                <label>Confirm New Password</label>
                <input required type="password" minLength={6} value={forgotForm.confirmPassword}
                       onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Resetting...' : 'Reset Password'}</button>
              <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: '8px' }} 
                      onClick={() => setForgotForm({ ...forgotForm, forgotStep: 1 })}>
                Back
              </button>
            </>
          )}
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="fg">
            <label>Full Name</label>
            <input required value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
          </div>
          <div className="fg">
            <label>Phone (10 digits)</label>
            <input required pattern="\d{10}" value={regForm.phone}
                   onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
          </div>
          <div className="fg">
            <label>Email (optional)</label>
            <input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
          </div>
          <div className="fg">
            <label>Pincode</label>
            <input value={regForm.pincode} onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value })} />
          </div>
          <div className="fg">
            <label>Password (min 6 chars)</label>
            <input required type="password" minLength={6} value={regForm.password}
                   onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
          </div>
          <div className="fg">
            <label>Confirm Password</label>
            <input required type="password" minLength={6} value={regForm.confirmPassword}
                   onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} />
          </div>
          <div className="fg">
            <label>Security Question</label>
            <select required value={regForm.securityQuestion}
                    onChange={(e) => setRegForm({ ...regForm, securityQuestion: e.target.value })}>
              <option value="">Select a security question</option>
              {SECURITY_QUESTIONS.map((q, i) => (
                <option key={i} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Security Answer</label>
            <input required value={regForm.securityAnswer}
                   onChange={(e) => setRegForm({ ...regForm, securityAnswer: e.target.value })} />
          </div>
          <div className="fg">
            <label>What is 2 + 3? (human check)</label>
            <input required value={regForm.puzzleAnswer}
                   onChange={(e) => setRegForm({ ...regForm, puzzleAnswer: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait...' : 'Create Account'}</button>
        </form>
      )}
    </Modal>
  );
}
