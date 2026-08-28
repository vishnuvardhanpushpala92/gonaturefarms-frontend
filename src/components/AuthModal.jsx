import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthModal({ open, onClose }) {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const showToast = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(form.email || form.phone, form.password);
        showToast('Login successful');
        onClose();
      } else {
        await register(form);
        showToast('Registration successful');
        onClose();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isLogin ? 'Login' : 'Register'}>
      <div className="mbody">
        {!forgotOpen ? (
          <>
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="fg">
                  <label>Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              <div className="fg">
                <label>Email or Phone</label>
                <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!isLogin && (
                <div className="fg">
                  <label>Phone</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              )}
              <div className="fg">
                <label>Password</label>
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              {!isLogin && (
                <div className="fg">
                  <label>Confirm Password</label>
                  <input required type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                </div>
              )}
              
              {/* Forgot Password link directly below password box */}
              {isLogin && (
                <button type="button" className="btn-link" onClick={() => setForgotOpen(true)}>
                  Forgot Password?
                </button>
              )}
              
              <button type="submit" className="btn btn-primary btn-block">
                {isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--p)', cursor: 'pointer', fontWeight: '600', marginLeft: '4px' }}>
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </>
        ) : (
          <ForgotPasswordForm onBack={() => setForgotOpen(false)} />
        )}
      </div>
    </Modal>
  );
}

function ForgotPasswordForm({ onBack }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const showToast = useToast();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await forgotPassword(email);
      if (data.success) {
        setSecurityQuestion(data.securityQuestion);
        setStep(2);
      } else {
        showToast(data.message);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Error');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    try {
      const data = await resetPassword({ email, answer, newPassword });
      showToast(data.message || 'Password reset successfully');
      onBack();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Error');
    }
  };

  return (
    <>
      <h3>Forgot Password</h3>
      {step === 1 && (
        <form onSubmit={handleVerify}>
          <div className="fg">
            <label>Email or Phone</label>
            <input required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Verify Account</button>
          <button type="button" className="btn btn-secondary btn-block" onClick={onBack}>Back to Login</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleReset}>
          <div className="fg">
            <label>Security Question</label>
            <input disabled value={securityQuestion} />
          </div>
          <div className="fg">
            <label>Answer</label>
            <input required value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>
          <div className="fg">
            <label>New Password</label>
            <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="fg">
            <label>Confirm Password</label>
            <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Reset Password</button>
          <button type="button" className="btn btn-secondary btn-block" onClick={onBack}>Back to Login</button>
        </form>
      )}
    </>
  );
}