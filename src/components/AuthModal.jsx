import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthModal({ open, onClose }) {
  const { user, login, register, logout } = useAuth();
  const showToast = useToast();
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', pincode: '', password: '', puzzleAnswer: '' });

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
