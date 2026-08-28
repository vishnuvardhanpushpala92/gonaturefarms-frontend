import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';

export default function AuthModal({ open, onClose }) {
  const { login, register, forgotPassword, resetPasswordWithSecurityQuestion, user, isAuthenticated, logout } = useAuth();
  const showToast = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showAddressSetup, setShowAddressSetup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', securityQuestion: '', securityAnswer: '' });
  const [addressForm, setAddressForm] = useState({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email validation for registration
    if (!isLogin && form.email && !validateEmail(form.email)) {
      showToast('Please enter a valid email address');
      return;
    }
    
    // Phone validation for registration (must be exactly 10 digits)
    if (!isLogin && form.phone && !validatePhone(form.phone)) {
      showToast('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Password confirmation for registration
    if (!isLogin && form.password !== form.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    
    // Security question validation for registration
    if (!isLogin && !form.securityQuestion) {
      showToast('Please select a security question');
      return;
    }
    
    // Security answer validation for registration
    if (!isLogin && !form.securityAnswer?.trim()) {
      showToast('Please provide a security answer');
      return;
    }
    
    try {
      if (isLogin) {
        const result = await login(form.email || form.phone, form.password);
        showToast('Login successful');
        // Pre-fill address form with user data from response
        const userData = result?.user || {};
        setAddressForm({
          ...addressForm,
          name: userData.name || form.name,
          phone: userData.phone || form.phone
        });
        // Show address setup after successful login
        setShowAddressSetup(true);
      } else {
        const result = await register(form);
        showToast('Registration successful');
        // Pre-fill address form with registration data
        const userData = result?.user || {};
        setAddressForm({
          ...addressForm,
          name: userData.name || form.name,
          phone: userData.phone || form.phone
        });
        setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', securityQuestion: '', securityAnswer: '' });
        // Show address setup after successful registration
        setShowAddressSetup(true);
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Error');
    }
  };

  const handleAddressSetup = async (e) => {
    e.preventDefault();
    
    // Validate address fields
    if (!addressForm.name?.trim()) {
      showToast('Please enter your name');
      return;
    }
    if (!addressForm.addressLine?.trim()) {
      showToast('Please enter your address');
      return;
    }
    if (!addressForm.city?.trim()) {
      showToast('Please enter your city');
      return;
    }
    if (!addressForm.state?.trim()) {
      showToast('Please enter your state');
      return;
    }
    if (!addressForm.pincode?.trim()) {
      showToast('Please enter your pincode');
      return;
    }
    if (!addressForm.phone?.trim()) {
      showToast('Please enter your phone');
      return;
    }
    
    try {
      const payload = { ...addressForm, isDefault: true };
      const { data } = await api.post('/addresses', payload);
      if (data.success) {
        showToast('Address saved successfully');
        setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
        setShowAddressSetup(false);
        onClose();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save address');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={showAddressSetup ? 'Setup Your Address' : (isAuthenticated ? 'My Account' : (isLogin ? 'Login' : 'Register'))}>
      <div className="mbody">
        {showAddressSetup ? (
          <>
            <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--muted)' }}>
              Please add your delivery address to complete your profile setup.
            </p>
            <form onSubmit={handleAddressSetup}>
              <div className="fg">
                <label>Address Type</label>
                <select 
                  value={addressForm.addressType} 
                  onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div className="fg">
                <label>Name</label>
                <input required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
              </div>
              <div className="fg">
                <label>Address Line</label>
                <textarea required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} />
              </div>
              <div className="frow">
                <div className="fg">
                  <label>City</label>
                  <input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
                <div className="fg">
                  <label>State</label>
                  <input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                </div>
              </div>
              <div className="frow">
                <div className="fg">
                  <label>Pincode</label>
                  <input required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                </div>
                <div className="fg">
                  <label>Phone</label>
                  <input required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-block">Save Address</button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => { setShowAddressSetup(false); onClose(); }}>Skip for Now</button>
              </div>
            </form>
          </>
        ) : isAuthenticated && user ? (
          <>
            <div className="profile-card">
              <div className="pa">{user.name?.charAt(0).toUpperCase()}</div>
              <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>{user.name}</h3>
              <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '16px' }}>{user.email || user.phone}</p>
            </div>
            <button className="btn btn-danger btn-block" onClick={logout}>
              Logout
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--muted)' }}>
              <button type="button" onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: 'var(--p)', cursor: 'pointer', fontWeight: '600' }}>
                Switch Account
              </button>
            </p>
          </>
        ) : !forgotOpen ? (
          <>
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="fg">
                  <label>Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              {isLogin ? (
                <div className="fg">
                  <label>Email or Phone</label>
                  <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              ) : (
                <>
                  <div className="fg">
                    <label>Phone (required)</label>
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit phone number" />
                  </div>
                  <div className="fg">
                    <label>Email (optional)</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                </>
              )}
              {!isLogin && (
                <>
                  <div className="fg">
                    <label>Security Question</label>
                    <select 
                      required 
                      value={form.securityQuestion} 
                      onChange={(e) => setForm({ ...form, securityQuestion: e.target.value })}
                    >
                      <option value="">Select a security question</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is your favorite color?">What is your favorite color?</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label>Security Answer</label>
                    <input required value={form.securityAnswer} onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })} />
                  </div>
                </>
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
  const { forgotPassword, resetPasswordWithSecurityQuestion } = useAuth();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const showToast = useToast();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await forgotPassword(identifier);
      if (data.success) {
        setSecurityQuestion(data.securityQuestion);
        setStep(2);
      } else {
        showToast(data.message);
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Error');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    try {
      const data = await resetPasswordWithSecurityQuestion({ email: identifier, answer, newPassword });
      showToast(data.message || 'Password reset successfully');
      onBack();
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Error');
    }
  };

  return (
    <>
      <h3>Forgot Password</h3>
      {step === 1 && (
        <form onSubmit={handleVerify}>
          <div className="fg">
            <label>Email or Phone</label>
            <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
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