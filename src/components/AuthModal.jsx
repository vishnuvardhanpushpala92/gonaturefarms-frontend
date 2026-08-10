import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function AuthModal({ open, onClose }) {
  const { user, login, register, logout } = useAuth();
  const showToast = useToast();
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', pincode: '', password: '', puzzleAnswer: '' });
  const [forgotForm, setForgotForm] = useState({ identifier: '', code: '', newPassword: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await login(loginForm.identifier, loginForm.password);
      showToast(data.message || (data.success ? 'Welcome back!' : 'Login failed'));
      if (data.success) onClose();
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
      const { data } = await api.post('/auth/forgot-password', { identifier: forgotForm.identifier });
      showToast(data.message || 'If account exists, reset code sent');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        identifier: forgotForm.identifier,
        code: forgotForm.code,
        newPassword: forgotForm.newPassword
      });
      showToast(data.message || 'Password reset successful');
      if (data.success) {
        setTab('login');
        setForgotForm({ identifier: '', code: '', newPassword: '' });
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Reset failed');
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
        <button className="btn btn-danger btn-block" onClick={() => { logout(); onClose(); }}>Logout</button>
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
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
        </form>
      ) : tab === 'forgot' ? (
        <form onSubmit={forgotForm.code ? handleResetPassword : handleForgotPassword}>
          <div className="fg">
            <label>Phone or Email</label>
            <input required value={forgotForm.identifier}
                   onChange={(e) => setForgotForm({ ...forgotForm, identifier: e.target.value })} />
          </div>
          {!forgotForm.code ? (
            <>
              <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending...' : 'Send Reset Code'}</button>
            </>
          ) : (
            <>
              <div className="fg">
                <label>Reset Code</label>
                <input required value={forgotForm.code}
                       onChange={(e) => setForgotForm({ ...forgotForm, code: e.target.value })} />
              </div>
              <div className="fg">
                <label>New Password (min 6 chars)</label>
                <input required type="password" minLength={6} value={forgotForm.newPassword}
                       onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Resetting...' : 'Reset Password'}</button>
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
