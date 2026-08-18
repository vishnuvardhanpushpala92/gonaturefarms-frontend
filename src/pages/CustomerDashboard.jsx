import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';
import OrdersModal from '../components/OrdersModal.jsx';
import FloatingCart from '../components/FloatingCart.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    pincode: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        pincode: user.pincode || ''
      });
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const { data } = await api.put('/users/profile', profileForm);
      showToast(data.message || 'Profile updated successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
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
        setShowAddressForm(false);
        setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
        setEditingAddressId(null);
        loadAddresses();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save address');
    }
  };

  const editAddress = (address) => {
    setAddressForm({
      addressType: address.addressType,
      name: address.name,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
      isDefault: address.isDefault
    });
    setEditingAddressId(address.id);
    setShowAddressForm(true);
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
    setShowAddressForm(false);
    setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
    setEditingAddressId(null);
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="customer-dashboard" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Account</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Store</button>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Sidebar */}
        <div style={{ flex: '0 0 250px', minWidth: 250 }}>
          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ 
                width: 50, height: 50, borderRadius: '50%', 
                background: 'var(--p)', color: '#fff', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 600
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{user.phone}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button 
                className={`fbtn${activeTab === 'profile' ? ' active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={{ textAlign: 'left', padding: '10px 12px' }}
              >
                👤 Profile
              </button>
              <button 
                className={`fbtn${activeTab === 'addresses' ? ' active' : ''}`}
                onClick={() => setActiveTab('addresses')}
                style={{ textAlign: 'left', padding: '10px 12px' }}
              >
                📍 Addresses
              </button>
              <button 
                className={`fbtn${activeTab === 'orders' ? ' active' : ''}`}
                onClick={() => { setActiveTab('orders'); setOrdersOpen(true); }}
                style={{ textAlign: 'left', padding: '10px 12px' }}
              >
                📦 Orders
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleLogout}
                style={{ marginTop: 12 }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {activeTab === 'profile' && (
            <div className="admin-card" style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 20 }}>Profile Information</h2>
              <form onSubmit={updateProfile}>
                <div className="fg">
                  <label>Full Name</label>
                  <input 
                    required 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Phone</label>
                  <input 
                    required 
                    pattern="\d{10}"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Email</label>
                  <input 
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Pincode</label>
                  <input 
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  />
                </div>
                <button className="btn btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="admin-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Saved Addresses</h2>
                <button className="btn btn-primary" onClick={() => setShowAddressForm(true)}>
                  + Add New Address
                </button>
              </div>

              {showAddressForm && (
                <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                  <h4 style={{ marginBottom: 12 }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>
                  <form onSubmit={saveAddress}>
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
                      <input 
                        required 
                        value={addressForm.name} 
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} 
                      />
                    </div>
                    <div className="fg">
                      <label>Address Line</label>
                      <textarea 
                        required 
                        value={addressForm.addressLine} 
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} 
                      />
                    </div>
                    <div className="frow">
                      <div className="fg">
                        <label>City</label>
                        <input 
                          required 
                          value={addressForm.city} 
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} 
                        />
                      </div>
                      <div className="fg">
                        <label>State</label>
                        <input 
                          required 
                          value={addressForm.state} 
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="frow">
                      <div className="fg">
                        <label>Pincode</label>
                        <input 
                          required 
                          value={addressForm.pincode} 
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} 
                        />
                      </div>
                      <div className="fg">
                        <label>Phone</label>
                        <input 
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary">
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={cancelAddressForm}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {addresses.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
                  No saved addresses. Add your first address above.
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
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-card" style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 20 }}>My Orders</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                Click the button below to view your order history and tracking.
              </p>
              <button className="btn btn-primary" onClick={() => setOrdersOpen(true)}>
                View Orders
              </button>
            </div>
          )}
        </div>
      </div>

      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <FloatingCart onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
