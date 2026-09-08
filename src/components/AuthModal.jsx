import React, { useState, useEffect } from 'react';
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
  const [showAddressManagement, setShowAddressManagement] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '', securityQuestion: '', securityAnswer: '' });
  const [addressForm, setAddressForm] = useState({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [originalAddressForm, setOriginalAddressForm] = useState(null);
  const [changeCount, setChangeCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAddresses();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (originalAddressForm) {
      let changes = 0;
      const fields = ['addressType', 'name', 'addressLine', 'city', 'state', 'pincode', 'phone', 'isDefault'];
      fields.forEach(field => {
        if (addressForm[field] !== originalAddressForm[field]) {
          changes++;
        }
      });
      setChangeCount(changes);
    }
  }, [addressForm, originalAddressForm]);

  const loadAddresses = async () => {
    try {
      const { data } = await api.get('/addresses', { timeout: 60000 });
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

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
    
    // Clear previous errors
    const errors = {};
    
    // Email validation for registration
    if (!isLogin && form.email && !validateEmail(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation for registration (must be exactly 10 digits)
    if (!isLogin && form.phone && !validatePhone(form.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    // Password validation for registration (must be at least 6 characters)
    if (!isLogin && form.password && form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Password confirmation for registration
    if (!isLogin && form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Security question validation for registration
    if (!isLogin && !form.securityQuestion) {
      errors.securityQuestion = 'Please select a security question';
    }
    
    // Security answer validation for registration
    if (!isLogin && !form.securityAnswer?.trim()) {
      errors.securityAnswer = 'Please provide a security answer';
    }
    
    // Ensure phone is provided and not empty
    if (!form.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    // Ensure name is provided and not empty
    if (!isLogin && !form.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    // Ensure password is provided and not empty
    if (!form.password?.trim()) {
      errors.password = 'Password is required';
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    try {
      if (isLogin) {
        try {
          const result = await login(form.phone, form.password);
          if (result.success) {
            const userData = result?.user || {};
            showToast(`Welcome back, ${userData.username || userData.name || 'User'}!`);
            // Keep modal open and switch to account view
            // The modal will automatically switch to account view due to isAuthenticated check
            // No need to call onClose() - let the conditional rendering handle the switch
          } else {
            showToast(result.message || 'Login failed. Please try again.');
          }
        } catch (loginErr) {
          console.error('Login error:', loginErr);
          const errorMessage = loginErr?.response?.data?.message || loginErr?.userMessage || 'Login failed. Please try again.';
          
          // Provide specific error messages
          if (errorMessage.includes('User not found')) {
            showToast('User not found. Please check your phone number or register a new account.');
          } else if (errorMessage.includes('Incorrect password')) {
            showToast('Incorrect password. Please try again.');
          } else {
            showToast(errorMessage);
          }
          return;
        }
      } else {
        // Ensure email is not sent as phone number - validate email properly
        const registerPayload = {
          name: form.name,
          username: form.username && form.username !== form.email ? form.username : null, // Don't use email as username
          phone: form.phone, // Only phone should be sent as identifier
          email: form.email && validateEmail(form.email) ? form.email : null, // Only send valid email
          password: form.password,
          securityQuestion: form.securityQuestion,
          securityAnswer: form.securityAnswer
        };
        
        // Remove skipTransform to allow camelCase to snake_case conversion
        const result = await register(registerPayload);
        showToast('Registration successful');
        // Pre-fill address form with registration data
        const userData = result?.user || {};
        setAddressForm({
          ...addressForm,
          name: userData.name || form.name,
          phone: userData.phone || form.phone
        });
        setForm({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '', securityQuestion: '', securityAnswer: '' });
        
        // Show address setup immediately after successful registration
        // The register function already calls persist() which sets the token
        setShowAddressSetup(true);
      }
    } catch (err) {
      // Handle specific registration errors
      let errorMessage = err?.userMessage || err?.response?.data?.message || 'Error';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('Phone number already registered')) {
        errorMessage = 'This phone number is already registered. Please use a different phone number or login.';
      } else if (errorMessage.includes('Email already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or login.';
      } else if (errorMessage.includes('Phone must be exactly 10 digits')) {
        errorMessage = 'Phone number must be exactly 10 digits.';
      } else if (errorMessage.includes('Password must be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (errorMessage.includes('Name is required')) {
        errorMessage = 'Name is required for registration.';
      }
      
      showToast(errorMessage);
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
    
    // Validate pincode against admin-configured serviceable pincodes
    try {
      const { data: pincodeData } = await api.get('/admin/zones/validate', { 
        params: { pincode: addressForm.pincode.trim() },
        timeout: 60000 
      });
      
      if (!pincodeData.success) {
        showToast('Cannot be delivered to this location. This pincode is not serviceable.');
        return;
      }
    } catch (err) {
      // If pincode validation fails, still proceed with address save
      console.warn('Could not validate pincode:', err);
    }
    
    try {
      const payload = { ...addressForm, isDefault: true };
      console.log('[DEBUG] handleAddressSetup - isAuthenticated:', isAuthenticated);
      console.log('[DEBUG] handleAddressSetup - user:', user);
      console.log('[DEBUG] handleAddressSetup - sessionStorage token:', sessionStorage.getItem('gnf_token') ? 'present' : 'missing');
      console.log('[DEBUG] handleAddressSetup - localStorage token:', localStorage.getItem('gnf_token') ? 'present' : 'missing');
      
      const { data } = await api.post('/addresses', payload);
      
      console.log('[DEBUG] handleAddressSetup - response:', data);
      
      if (data.success) {
        showToast('Address saved successfully and will be used for your orders');
        setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
        setShowAddressSetup(false);
        onClose();
      }
    } catch (err) {
      console.error('=== ADDRESS SAVE ERROR ===');
      console.error('Error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('=======================');
      
      if (err.response?.status === 401) {
        showToast('Authentication expired. Please login again.');
        onClose();
      } else {
        showToast(err?.userMessage || err?.response?.data?.message || 'Failed to save address');
      }
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addressForm,
        isDefault: addresses.length === 0 ? true : addressForm.isDefault
      };

      let data;
      if (editingAddressId) {
        data = await api.put(`/addresses/${editingAddressId}`, payload);
      } else {
        data = await api.post('/addresses', payload);
      }

      if (data.data.success) {
        showToast(editingAddressId ? 'Address updated successfully' : 'Address saved successfully');
        setShowAddressManagement(false);
        setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
        setOriginalAddressForm(null);
        setChangeCount(0);
        setEditingAddressId(null);
        loadAddresses();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save address');
    }
  };

  const editAddress = (address) => {
    const formCopy = {
      addressType: address.addressType,
      name: address.name,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
      isDefault: address.isDefault
    };
    setAddressForm(formCopy);
    setOriginalAddressForm(formCopy);
    setEditingAddressId(address.id);
    setShowAddressManagement(true);
    setChangeCount(0);
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await api.delete(`/addresses/${id}`);
      showToast(data.message || 'Address deleted successfully');
      loadAddresses();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete address');
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const { data } = await api.put(`/addresses/${id}/default`);
      showToast(data.message || 'Default address updated');
      loadAddresses();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to set default address');
    }
  };

  const cancelAddressForm = () => {
    setShowAddressManagement(false);
    setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
    setOriginalAddressForm(null);
    setChangeCount(0);
    setEditingAddressId(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={showAddressSetup ? 'Setup Your Address' : (showAddressManagement ? 'Manage Addresses' : (isAuthenticated ? 'My Account' : (isLogin ? 'Login' : 'Register')))}>
      <div className="mbody">
        {showAddressSetup ? (
          <>
            <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--muted)' }}>
              Please add your delivery address to complete your profile setup. This is required to place orders.
            </p>
            <form onSubmit={handleAddressSetup}>
              <div className="fg">
                <label htmlFor="address-type">Address Type</label>
                <select 
                  id="address-type"
                  name="addressType"
                  value={addressForm.addressType} 
                  onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div className="fg">
                <label htmlFor="address-name">Name</label>
                <input id="address-name" name="name" required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
              </div>
              <div className="fg">
                <label htmlFor="address-line">Address Line</label>
                <textarea id="address-line" name="addressLine" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} />
              </div>
              <div className="frow">
                <div className="fg">
                  <label htmlFor="address-city">City</label>
                  <input id="address-city" name="city" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
                <div className="fg">
                  <label htmlFor="address-state">State</label>
                  <input id="address-state" name="state" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                </div>
              </div>
              <div className="frow">
                <div className="fg">
                  <label htmlFor="address-pincode">Pincode</label>
                  <input id="address-pincode" name="pincode" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                </div>
                <div className="fg">
                  <label htmlFor="address-phone">Phone</label>
                  <input id="address-phone" name="phone" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block">Save Address</button>
            </form>
          </>
        ) : showAddressManagement ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddressManagement(false)} style={{ marginBottom: 12 }}>
                ← Back to Account
              </button>
              <button className="btn btn-primary" onClick={() => { setEditingAddressId(null); setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false }); setOriginalAddressForm(null); setChangeCount(0); }} style={{ float: 'right' }}>
                + Add New Address
              </button>
            </div>

            {editingAddressId !== null || addressForm.name ? (
              <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12 }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>
                <form onSubmit={saveAddress}>
                  <div className="fg">
                    <label htmlFor="edit-address-type">Address Type</label>
                    <select 
                      id="edit-address-type"
                      name="addressType"
                      value={addressForm.addressType} 
                      onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label htmlFor="edit-address-name">Name</label>
                    <input 
                      id="edit-address-name"
                      name="name"
                      required 
                      value={addressForm.name} 
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} 
                    />
                  </div>
                  <div className="fg">
                    <label htmlFor="edit-address-line">Address Line</label>
                    <textarea 
                      id="edit-address-line"
                      name="addressLine"
                      required 
                      value={addressForm.addressLine} 
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} 
                    />
                  </div>
                  <div className="frow">
                    <div className="fg">
                      <label htmlFor="edit-address-city">City</label>
                      <input 
                        id="edit-address-city"
                        name="city"
                        required 
                        value={addressForm.city} 
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} 
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="edit-address-state">State</label>
                      <input 
                        id="edit-address-state"
                        name="state"
                        required 
                        value={addressForm.state} 
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="frow">
                    <div className="fg">
                      <label htmlFor="edit-address-pincode">Pincode</label>
                      <input 
                        id="edit-address-pincode"
                        name="pincode"
                        required 
                        value={addressForm.pincode} 
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} 
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="edit-address-phone">Phone</label>
                      <input 
                        id="edit-address-phone"
                        name="phone"
                        required 
                        value={addressForm.phone} 
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="fg">
                    <label>
                      <input 
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        style={{ marginRight: 8 }}
                      />
                      Set as default address
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary" disabled={editingAddressId && changeCount === 0}>
                      {editingAddressId ? `Commit Changes${changeCount > 0 ? ` (${changeCount})` : ''}` : 'Save Address'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={cancelAddressForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {addresses.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
                No saved addresses. Click "Add New Address" above.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    style={{ 
                      padding: 16, 
                      border: `2px solid ${addr.isDefault ? 'var(--p)' : 'var(--border)'}`, 
                      borderRadius: 8,
                      background: addr.isDefault ? '#f0fdf4' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ 
                          fontSize: '.7rem', 
                          background: 'var(--accent)', 
                          padding: '2px 8px', 
                          borderRadius: 4,
                          marginRight: 8
                        }}>
                          {addr.addressType}
                        </span>
                        {addr.isDefault && (
                          <span style={{ 
                            fontSize: '.7rem', 
                            background: '#16a34a', 
                            color: '#fff',
                            padding: '2px 8px', 
                            borderRadius: 4 
                          }}>
                            Default
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!addr.isDefault && (
                          <button 
                            className="btn-e" 
                            onClick={() => setDefaultAddress(addr.id)}
                            style={{ fontSize: '.7rem', padding: '4px 8px' }}
                          >
                            Set Default
                          </button>
                        )}
                        <button 
                          className="btn-e" 
                          onClick={() => editAddress(addr)}
                          style={{ fontSize: '.7rem', padding: '4px 8px' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-d" 
                          onClick={() => deleteAddress(addr.id)}
                          style={{ fontSize: '.7rem', padding: '4px 8px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{addr.name}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{addr.addressLine}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{addr.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : isAuthenticated && user ? (
          <>
            <div className="profile-card">
              <div className="pa">{user.name?.charAt(0).toUpperCase()}</div>
              <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>{user.name}</h3>
              <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '16px' }}>{user.email || user.phone}</p>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setShowAddressManagement(true)} style={{ marginBottom: 8 }}>
              📍 Manage Addresses
            </button>
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
                <>
                  <div className="fg">
                    <label htmlFor="auth-name">Name</label>
                    <input id="auth-name" name="name" required value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: '' }); }} />
                    {formErrors.name && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.name}</div>}
                  </div>
                  <div className="fg">
                    <label htmlFor="auth-username">Username (optional)</label>
                    <input id="auth-username" name="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Choose a username" />
                  </div>
                </>
              )}
              {isLogin ? (
                <div className="fg">
                  <label htmlFor="auth-phone">Phone Number</label>
                  <input id="auth-phone" name="phone" required value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFormErrors({ ...formErrors, phone: '' }); }} placeholder="10-digit phone number" />
                  {formErrors.phone && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.phone}</div>}
                </div>
              ) : (
                <>
                  <div className="fg">
                    <label htmlFor="auth-phone">Phone (required)</label>
                    <input id="auth-phone" name="phone" required value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFormErrors({ ...formErrors, phone: '' }); }} placeholder="10-digit phone number" />
                    {formErrors.phone && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.phone}</div>}
                  </div>
                  <div className="fg">
                    <label htmlFor="auth-email">Email (optional)</label>
                    <input id="auth-email" name="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErrors({ ...formErrors, email: '' }); }} placeholder="email@example.com" />
                    {formErrors.email && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.email}</div>}
                  </div>
                </>
              )}
              {!isLogin && (
                <>
                  <div className="fg">
                    <label htmlFor="auth-security-question">Security Question</label>
                    <select 
                      id="auth-security-question"
                      name="securityQuestion"
                      required 
                      value={form.securityQuestion} 
                      onChange={(e) => { setForm({ ...form, securityQuestion: e.target.value }); setFormErrors({ ...formErrors, securityQuestion: '' }); }}
                    >
                      <option value="">Select a security question</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is your favorite color?">What is your favorite color?</option>
                    </select>
                    {formErrors.securityQuestion && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.securityQuestion}</div>}
                  </div>
                  <div className="fg">
                    <label htmlFor="auth-security-answer">Security Answer</label>
                    <input id="auth-security-answer" name="securityAnswer" required value={form.securityAnswer} onChange={(e) => { setForm({ ...form, securityAnswer: e.target.value }); setFormErrors({ ...formErrors, securityAnswer: '' }); }} />
                    {formErrors.securityAnswer && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.securityAnswer}</div>}
                  </div>
                </>
              )}
              <div className="fg">
                <label htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="auth-password"
                    name="password"
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setFormErrors({ ...formErrors, password: '' }); }} 
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#666'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formErrors.password && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.password}</div>}
              </div>
              {!isLogin && (
                <div className="fg">
                  <label htmlFor="auth-confirm-password">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      id="auth-confirm-password"
                      name="confirmPassword"
                      required 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={form.confirmPassword} 
                      onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setFormErrors({ ...formErrors, confirmPassword: '' }); }}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#666'
                      }}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.confirmPassword}</div>}
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
            <div style={{ position: 'relative' }}>
              <input 
                required 
                type={showNewPassword ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <div className="fg">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                required 
                type={showResetConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
              >
                {showResetConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Reset Password</button>
          <button type="button" className="btn btn-secondary btn-block" onClick={onBack}>Back to Login</button>
        </form>
      )}
    </>
  );
}