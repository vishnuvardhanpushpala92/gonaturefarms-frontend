import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function CheckoutModal({ open, onClose }) {
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false
  });
  const [form, setForm] = useState({
    customerName: user?.name || '', phone: user?.phone || '', email: user?.email || '',
    address: '', area: '', city: '', state: '', pincode: '', paymentMethod: 'UPI',
    paymentUtr: ''
  });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [pincodeError, setPincodeError] = useState('');

  const freeDeliveryAbove = parseFloat(settings.free_delivery_above || 500);
  const deliveryChargeBelow = parseFloat(settings.delivery_charge_below || 50);
  const subtotalWithGst = totals.subtotal + totals.gstAmount;
  const deliveryCharge = subtotalWithGst >= freeDeliveryAbove ? 0 : deliveryChargeBelow;
  const grandTotal = Math.max(0, subtotalWithGst + deliveryCharge - discount);

  // Load user addresses
  useEffect(() => {
    if (user && open) {
      loadAddresses();
    }
  }, [user, open]);

  const loadAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      if (data.success) {
        setAddresses(data.addresses || []);
        // Select default address if available
        const defaultAddr = data.addresses?.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setForm({
            ...form,
            customerName: defaultAddr.name,
            phone: defaultAddr.phone,
            address: defaultAddr.addressLine,
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode
          });
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
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addressForm,
        isDefault: addresses.length === 0 // Make first address default
      };
      const { data } = await api.post('/addresses', payload);
      if (data.success) {
        showToast('Address saved successfully');
        setShowAddressForm(false);
        setAddressForm({ addressType: 'Home', name: '', addressLine: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
        loadAddresses();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save address');
    }
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

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, orderTotal: subtotalWithGst });
      if (data.success) {
        setDiscount(parseFloat(data.discount || 0));
        showToast(data.message);
      } else {
        showToast(data.message);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Invalid coupon');
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        area: form.area,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        paymentMethod: form.paymentMethod,
        paymentUtr: form.paymentUtr,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        deliveryCharge,
        discount,
        total: grandTotal,
        couponCode: coupon || undefined,
        userId: user?.id,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img,
          price: item.price,
          gst: item.gst,
          qty: item.qty
        }))
      };
      
      const { data } = await api.post('/orders', payload);
      
      if (data.success) {
        setPlacedOrder({ orderId: data.orderId });
        clearCart();
        setStep(3);
      } else {
        showToast(data.message);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  const close = () => {
    setStep(1);
    setPlacedOrder(null);
    onClose();
  };

  // Helper function to get image URL with proper backend prefix
  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  return (
    <Modal open={open} onClose={close} title="Checkout" wide
           subtitle={step < 3 ? `Step ${step} of 2` : 'Order placed!'}>
      <div className="steps">
        <div className="step"><div className={`step-num${step >= 1 ? ' active' : ''}${step > 1 ? ' done' : ''}`}>1</div><div className="step-lbl">Details</div></div>
        <div className={`step-line${step > 1 ? ' done' : ''}`} />
        <div className="step"><div className={`step-num${step >= 2 ? ' active' : ''}${step > 2 ? ' done' : ''}`}>2</div><div className="step-lbl">Payment</div></div>
      </div>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          {/* Saved Addresses Section */}
          {addresses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Saved Addresses</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    style={{
                      padding: 12,
                      border: `2px solid ${selectedAddressId === addr.id ? 'var(--p)' : 'var(--border)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selectedAddressId === addr.id ? '#f0fdf4' : '#fff'
                    }}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{addr.name}</span>
                      <span style={{ fontSize: '.7rem', background: 'var(--accent)', padding: '2px 8px', borderRadius: 4 }}>{addr.addressType}</span>
                    </div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.addressLine}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.city}, {addr.state} - {addr.pincode}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{addr.phone}</div>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => setShowAddressForm(true)}
              >
                + Add New Address
              </button>
            </div>
          )}

          {/* Address Form */}
          {showAddressForm && (
            <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 12 }}>Add New Address</h4>
              <div className="fg">
                <label>Address Type</label>
                <select value={addressForm.addressType} onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}>
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
                <div className="fg"><label>City</label>
                  <input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
                <div className="fg"><label>State</label>
                  <input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} /></div>
              </div>
              <div className="frow">
                <div className="fg"><label>Pincode</label>
                  <input required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} /></div>
                <div className="fg"><label>Phone</label>
                  <input required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary" onClick={saveAddress}>Save Address</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddressForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Manual Address Entry */}
          <div className="frow">
            <div className="fg"><label>Name</label>
              <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
            <div className="fg"><label>Phone</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="fg"><label>Email (required)</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="fg"><label>Address</label>
            <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="frow">
            <div className="fg"><label>Area</label>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
            <div className="fg"><label>City</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          </div>
          <div className="frow">
            <div className="fg"><label>State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div className="fg"><label>Pincode</label>
              <input 
                required 
                value={form.pincode} 
                onChange={(e) => {
                  setForm({ ...form, pincode: e.target.value });
                  validatePincode(e.target.value);
                }} 
              />
              {pincodeError && <div style={{ color: '#dc2626', fontSize: '.7rem', marginTop: 4 }}>{pincodeError}</div>}
            </div>
          </div>
          <button className="btn btn-primary btn-block">Continue to Payment</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div className="fg">
            <label>Coupon Code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={applyCoupon}>Apply</button>
            </div>
          </div>

          <div className="fg">
            <label>Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {form.paymentMethod === 'UPI' && (
            <>
              {settings.qr_code && (
                <div className="qr-box"><img src={getImageUrl(settings.qr_code)} alt="Payment QR" /></div>
              )}
              {!settings.qr_code && (
                <div className="qr-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                  <img src="/qr-placeholder.png" alt="Payment QR" style={{ maxWidth: 200 }} onError={(e) => e.target.style.display = 'none'} />
                  <span style={{ color: 'var(--muted)' }}>QR Code Placeholder</span>
                </div>
              )}
              {settings.upi_id && (
                <div className="upi-box"><span className="upi-id">{settings.upi_id}</span></div>
              )}
              <div className="fg">
                <label>Transaction ID / UTR (required)</label>
                <input 
                  required 
                  value={form.paymentUtr} 
                  onChange={(e) => setForm({ ...form, paymentUtr: e.target.value })} 
                  placeholder="Enter your UTR number"
                />
              </div>
            </>
          )}
          {settings.payment_instructions && (
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', whiteSpace: 'pre-line', marginBottom: 12 }}>
              {settings.payment_instructions}
            </p>
          )}

          <div className="cart-summary">
            <div className="cs-row"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="cs-row"><span>GST</span><span>₹{totals.gstAmount.toFixed(2)}</span></div>
            <div className="cs-row"><span>Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
            {discount > 0 && <div className="cs-row"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
            <div className="cs-row total"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn btn-primary btn-block" disabled={placing} onClick={placeOrder}>
              {placing ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && placedOrder && (
        <div>
          <span className="s-icon">✅</span>
          <div className="bill">
            <div className="bill-hdr">
              <h3>Order Confirmed</h3>
              <p>Order ID: {placedOrder.orderId}</p>
            </div>
            <div className="bill-body">
              <div className="bill-info">
                {placedOrder.customerName}<br />
                {placedOrder.address}, {placedOrder.city} - {placedOrder.pincode}<br />
                {placedOrder.phone}
              </div>
              <table className="bill-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {placedOrder.items.map((it, i) => (
                    <tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>₹{(it.price * it.qty).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="bill-total"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <div className="bill-footer">Thank you for shopping with {settings.site_name || 'Go Nature Farms'}!</div>
          </div>
          <button className="btn btn-primary btn-block" onClick={close}>Done</button>
        </div>
      )}
    </Modal>
  );
}