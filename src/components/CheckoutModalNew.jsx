import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ensureHttps } from '../context/SiteContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export default function CheckoutModal({ open, onClose }) {
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const showToast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false
  });
  const [originalAddressForm, setOriginalAddressForm] = useState(null);
  const [changeCount, setChangeCount] = useState(0);
  const [form, setForm] = useState({
    customerName: user?.name || '', phone: user?.phone || '', email: user?.email || '',
    address: '', area: '', city: '', state: '', pincode: '', paymentMethod: 'UPI',
    paymentUtr: ''
  });
  const [pincodeError, setPincodeError] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loadingDeliveryCharge, setLoadingDeliveryCharge] = useState(false);

  const freeDeliveryAbove = parseFloat(settings.free_delivery_above || 500);
  const deliveryChargeBelow = parseFloat(settings.delivery_charge_below || 50);
  const subtotalWithGst = totals.subtotal + totals.gstAmount;
  const grandTotal = Math.max(0, subtotalWithGst + deliveryCharge);

  useEffect(() => {
    if (open && user) {
      loadAddresses();
    }
  }, [open, user]);

  const fetchDeliveryCharge = async (pincode) => {
    try {
      setLoadingDeliveryCharge(true);
      const { data } = await api.get(`/admin/zones/charge?pincode=${pincode}`);
      if (data.success) {
        const zoneCharge = parseFloat(data.charge || 0);
        // Apply free delivery logic
        const finalCharge = subtotalWithGst >= freeDeliveryAbove ? 0 : zoneCharge;
        setDeliveryCharge(finalCharge);
        setPincodeError('');
      } else {
        setPincodeError(data.message || 'Delivery not available in your area');
        setDeliveryCharge(0);
      }
    } catch (err) {
      console.error('Failed to fetch delivery charge:', err);
      setPincodeError('Could not verify delivery availability');
      setDeliveryCharge(0);
    } finally {
      setLoadingDeliveryCharge(false);
    }
  };

  useEffect(() => {
    if (form.pincode && form.pincode.length === 6) {
      fetchDeliveryCharge(form.pincode);
    }
  }, [form.pincode, subtotalWithGst, freeDeliveryAbove]);

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
      const { data } = await api.get('/addresses');
      if (data.success) {
        const loadedAddresses = data.addresses || [];
        setAddresses(loadedAddresses);
        // Auto-select default address if exists
        const defaultAddress = loadedAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setForm({
            ...form,
            customerName: defaultAddress.name,
            phone: defaultAddress.phone,
            address: defaultAddress.addressLine,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode
          });
        } else {
          setSelectedAddressId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setForm({
      ...form,
      customerName: address.name,
      phone: address.phone,
      address: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    });
    // Close address form if open
    setShowAddressForm(false);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...addressForm, isDefault: addresses.length === 0 };
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
        setOriginalAddressForm(null);
        setChangeCount(0);
        setEditingAddressId(null);
        loadAddresses();
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Failed to save address');
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
    setShowAddressForm(true);
    setChangeCount(0);
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await api.delete(`/addresses/${id}`);
      showToast(data.message || 'Address deleted successfully');
      loadAddresses();
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete address');
    }
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
    setOriginalAddressForm(null);
    setChangeCount(0);
    setEditingAddressId(null);
  };

  const validatePincode = async (pincode) => {
    if (!pincode || pincode.length < 6) {
      setPincodeError('Please enter a valid 6-digit pincode');
      return false;
    }
    try {
      const { data } = await api.get(`/admin/zones/validate?pincode=${pincode}`);
      if (!data.success) {
        setPincodeError(data.message || 'Invalid pincode. Delivery not available in your area.');
        return false;
      }
      setPincodeError('');
      return true;
    } catch (err) {
      setPincodeError('Invalid pincode. Delivery not available in your area.');
      return false;
    }
  };

  const close = () => {
    onClose();
  };

  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    // Ensure HTTPS for external URLs (Cloudinary, etc.)
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return ensureHttps(imgUrl);
    }
    // Handle local URLs (server-hosted images)
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  return (
    <Modal open={open} onClose={close} title="Checkout" wide subtitle="Customer Details">
      {step === 1 && (
        <form onSubmit={(e) => {
          e.preventDefault();
          // Require address selection when addresses exist
          if (addresses.length > 0 && !selectedAddressId && !showAddressForm) {
            showToast('Please select a saved address or click "Add New Address"');
            return;
          }
          // Require manual address entry when adding new address
          if (showAddressForm && !form.address?.trim()) {
            showToast('Please enter your address details');
            return;
          }
        }}>
          {addresses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Saved Addresses</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {addresses.map((addr) => (
                  <div key={addr.id} style={{ padding: 12, border: `2px solid ${selectedAddressId === addr.id ? 'var(--p)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: selectedAddressId === addr.id ? '#f0fdf4' : '#fff' }}>
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div onClick={() => selectAddress(addr)} style={{ flex: 1 }}>
                        <span>{addr.name}</span>
                        <span style={{ fontSize: '.7rem', background: 'var(--accent)', padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>{addr.addressType}</span>
                        {addr.isDefault && (
                          <span style={{ fontSize: '.7rem', background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>Default</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button 
                          type="button" 
                          className="btn-e" 
                          onClick={(e) => { e.stopPropagation(); editAddress(addr); }}
                          style={{ fontSize: '.7rem', padding: '4px 8px' }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-d" 
                          onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                          style={{ fontSize: '.7rem', padding: '4px 8px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div onClick={() => selectAddress(addr)} style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.addressLine}</div>
                    <div onClick={() => selectAddress(addr)} style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.city}, {addr.state} - {addr.pincode}</div>
                    <div onClick={() => selectAddress(addr)} style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.phone}</div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={() => { setEditingAddressId(null); setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false }); setOriginalAddressForm(null); setChangeCount(0); setShowAddressForm(true); }}>+ Add New Address</button>
            </div>
          )}

          {showAddressForm && (
            <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 12 }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>
              <div className="fg"><label htmlFor="checkout-address-type">Address Type</label><select id="checkout-address-type" name="addressType" value={addressForm.addressType} onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}><option value="Home">Home</option><option value="Office">Office</option></select></div>
              <div className="fg"><label htmlFor="checkout-address-name">Name</label><input id="checkout-address-name" name="name" required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} /></div>
              <div className="fg"><label htmlFor="checkout-address-line">Address Line</label><textarea id="checkout-address-line" name="addressLine" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} /></div>
              <div className="frow"><div className="fg"><label htmlFor="checkout-address-city">City</label><input id="checkout-address-city" name="city" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></div><div className="fg"><label htmlFor="checkout-address-state">State</label><input id="checkout-address-state" name="state" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} /></div></div>
              <div className="frow"><div className="fg"><label htmlFor="checkout-address-pincode">Pincode</label><input id="checkout-address-pincode" name="pincode" required value={addressForm.pincode} onChange={(e) => { setAddressForm({ ...addressForm, pincode: e.target.value }); if (e.target.value.length === 6) fetchDeliveryCharge(e.target.value); }} /></div><div className="fg"><label htmlFor="checkout-address-phone">Phone</label><input id="checkout-address-phone" name="phone" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /></div></div>
              {pincodeError && <div style={{ color: '#dc2626', fontSize: '.8rem', marginTop: 4 }}>{pincodeError}</div>}
              <div className="fg"><label><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} style={{ marginRight: 8 }} />Set as default address</label></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button type="button" className="btn btn-primary" onClick={saveAddress} disabled={editingAddressId && changeCount === 0}>{editingAddressId ? `Commit Changes${changeCount > 0 ? ` (${changeCount})` : ''}` : 'Save Address'}</button><button type="button" className="btn btn-secondary" onClick={cancelAddressForm}>Cancel</button></div>
            </div>
          )}

          <div className="frow"><div className="fg"><label htmlFor="checkout-name">Name</label><input id="checkout-name" name="customerName" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div><div className="fg"><label htmlFor="checkout-phone">Phone</label><input id="checkout-phone" name="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
          <div className="fg"><label htmlFor="checkout-email">Email (required)</label><input id="checkout-email" name="email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="fg"><label htmlFor="checkout-address">Address</label><textarea id="checkout-address" name="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="frow"><div className="fg"><label htmlFor="checkout-city">City</label><input id="checkout-city" name="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div><div className="fg"><label htmlFor="checkout-state">State</label><input id="checkout-state" name="state" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div></div>
          <div className="fg"><label htmlFor="checkout-pincode">Pincode</label><input id="checkout-pincode" name="pincode" required value={form.pincode} onChange={(e) => { setForm({ ...form, pincode: e.target.value }); if (e.target.value.length === 6) fetchDeliveryCharge(e.target.value); }} /></div>
          {pincodeError && <div style={{ color: '#dc2626', fontSize: '.8rem', marginTop: 4 }}>{pincodeError}</div>}
          {loadingDeliveryCharge && <div style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 4 }}>Checking delivery availability...</div>}
          <button className="btn btn-primary btn-block" onClick={() => {
            // Validate form before proceeding
            if (!form.customerName?.trim()) {
              showToast('Please enter your name');
              return;
            }
            if (!form.phone?.trim()) {
              showToast('Please enter your phone number');
              return;
            }
            if (!form.email?.trim()) {
              showToast('Please enter your email');
              return;
            }
            if (!form.address?.trim()) {
              showToast('Please enter your address');
              return;
            }
            if (!form.city?.trim()) {
              showToast('Please enter your city');
              return;
            }
            if (!form.state?.trim()) {
              showToast('Please enter your state');
              return;
            }
            if (!form.pincode?.trim()) {
              showToast('Please enter your pincode');
              return;
            }
            if (pincodeError) {
              showToast('Please fix the pincode error before proceeding');
              return;
            }
            // Navigate to transaction page with order data
            navigate('/transaction', { 
              state: { 
                orderData: {
                  customerName: form.customerName,
                  phone: form.phone,
                  email: form.email,
                  address: form.address,
                  area: form.area,
                  city: form.city,
                  state: form.state,
                  pincode: form.pincode
                }
              }
            });
            onClose();
          }}>Continue to Payment</button>
        </form>
      )}
    </Modal>
  );
}