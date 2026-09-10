import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ensureHttps } from '../context/SiteContext.jsx';
import api from '../api/client.js';

export default function TransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const showToast = useToast();

  const [form, setForm] = useState({
    customerName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'UPI',
    paymentUtr: ''
  });

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [pincodeError, setPincodeError] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loadingDeliveryCharge, setLoadingDeliveryCharge] = useState(false);

  const freeDeliveryAbove = parseFloat(settings.free_delivery_above || 500);
  const deliveryChargeBelow = parseFloat(settings.delivery_charge_below || 50);
  const subtotalWithGst = totals.subtotal + totals.gstAmount;
  const grandTotal = Math.max(0, subtotalWithGst + deliveryCharge - discount);

  // Get order data from location state
  const orderData = location.state?.orderData;

  useEffect(() => {
    if (orderData) {
      setForm({
        ...form,
        customerName: orderData.customerName || user?.name || '',
        phone: orderData.phone || user?.phone || '',
        email: orderData.email || user?.email || '',
        address: orderData.address || '',
        area: orderData.area || '',
        city: orderData.city || '',
        state: orderData.state || '',
        pincode: orderData.pincode || ''
      });
      if (orderData.pincode) {
        fetchDeliveryCharge(orderData.pincode);
      }
    }
  }, [orderData, user]);

  const fetchDeliveryCharge = async (pincode) => {
    try {
      setLoadingDeliveryCharge(true);
      const { data } = await api.get(`/admin/zones/charge?pincode=${pincode}`);
      if (data.success) {
        const zoneCharge = parseFloat(data.charge || 0);
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
      showToast(err?.userMessage || err?.response?.data?.message || 'Invalid coupon');
    }
  };

  const placeOrder = async () => {
    // Validate required fields
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
      showToast('Please fix the pincode error before placing order');
      return;
    }
    if (!form.paymentMethod) {
      showToast('Please select a payment method');
      return;
    }
    if (form.paymentMethod === 'UPI' && !form.paymentUtr?.trim()) {
      showToast('Transaction ID is required.');
      return;
    }
    if (form.paymentMethod === 'UPI' && form.paymentUtr?.trim().length < 12) {
      showToast('Transaction ID must be at least 12 characters.');
      return;
    }
    if (items.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        customer_name: form.customerName,
        phone: form.phone,
        email: form.email || '',
        address: form.address,
        area: form.area || '',
        city: form.city,
        state: form.state || '',
        pincode: form.pincode,
        payment_method: form.paymentMethod,
        payment_utr: form.paymentUtr ? form.paymentUtr.trim() : '',
        subtotal: totals.subtotal,
        gst_amount: totals.gstAmount,
        delivery_charge: deliveryCharge,
        discount: discount,
        total: grandTotal,
        coupon_code: coupon || undefined,
        user_id: user?.id,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img || '',
          price: Number(item.price),
          gst: item.gst ? Number(item.gst) : 0,
          qty: Number(item.qty)
        }))
      };

      const { data } = await api.post('/orders', payload);

      if (data.success) {
        const orderedItems = [...items];
        setPlacedOrder({
          orderId: data.orderId,
          customerName: form.customerName,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          phone: form.phone,
          items: orderedItems
        });
        showToast('Order placed successfully!');
        clearCart(); // Clear cart after successful order
      } else {
        showToast(data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      const errorMsg = err?.response?.data?.message || err?.userMessage || err?.message || 'Could not place order';
      showToast(errorMsg);
    } finally {
      setPlacing(false);
    }
  };

  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return ensureHttps(imgUrl);
    }
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="transaction-page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', color: '#2d5a27', margin: 0 }}>Payment</h1>
        <button onClick={handleBack} className="transaction-button" style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back to Store
        </button>
      </div>

      {placedOrder ? (
        <div className="transaction-section" style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>✅</span>
          <h2 style={{ fontSize: '1.3rem', color: '#2d5a27', marginBottom: '8px', margin: 0 }}>Order Confirmed!</h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '16px' }}>Order ID: {placedOrder.orderId}</p>
          <div style={{ textAlign: 'left', background: '#f9fafb', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>{placedOrder.customerName}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}>{placedOrder.address}, {placedOrder.city} - {placedOrder.pincode}</p>
            <p style={{ margin: 0 }}>{placedOrder.phone}</p>
          </div>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', margin: 0 }}>Order Items:</h3>
            {placedOrder.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.9rem' }}>{item.name} x {item.qty}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' }}>
            Total: ₹{grandTotal.toFixed(2)}
          </div>
          <button onClick={handleBack} className="transaction-button" style={{ padding: '10px 20px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' }}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="transaction-page-content">
          {/* Order Summary */}
          <div className="transaction-section" style={{ background: '#f9fafb', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#374151', margin: 0 }}>Order Summary</h3>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Qty: {item.qty}</div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>₹{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Customer Details */}
          <div className="transaction-section" style={{ background: '#fff', padding: '16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#374151', margin: 0 }}>Customer Details</h3>
            <div className="transaction-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Name</label>
                <input
                  className="transaction-input"
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Phone</label>
                <input
                  className="transaction-input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Email</label>
                <input
                  className="transaction-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Pincode</label>
                <input
                  className="transaction-input"
                  type="text"
                  value={form.pincode}
                  onChange={(e) => { setForm({ ...form, pincode: e.target.value }); if (e.target.value.length === 6) fetchDeliveryCharge(e.target.value); }}
                  required
                  maxLength={6}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                {pincodeError && <div style={{ color: '#dc2626', fontSize: '.75rem', marginTop: 4 }}>{pincodeError}</div>}
                {loadingDeliveryCharge && <div style={{ color: '#6b7280', fontSize: '.75rem', marginTop: 4 }}>Checking delivery availability...</div>}
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Address</label>
              <textarea
                className="transaction-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows="2"
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>
            <div className="transaction-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>City</label>
                <input
                  className="transaction-input"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>State</label>
                <input
                  className="transaction-input"
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="transaction-section" style={{ background: '#fff', padding: '16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#374151', margin: 0 }}>Payment</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Coupon Code</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="transaction-input"
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="transaction-button"
                  style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Apply
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Payment Method</label>
              <select
                className="transaction-input"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="UPI">UPI</option>
              </select>
            </div>

            {form.paymentMethod === 'UPI' && (
              <>
                {settings.upi_scanner_url && (
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <img 
                      src={getImageUrl(settings.upi_scanner_url)} 
                      alt="UPI Scanner" 
                      style={{ maxWidth: '180px', height: 'auto', borderRadius: '6px' }}
                    />
                  </div>
                )}
                {!settings.upi_scanner_url && (
                  <div style={{ textAlign: 'center', marginBottom: '12px', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>QR Code Placeholder</span>
                  </div>
                )}
                {settings.upi_id && (
                  <div style={{ textAlign: 'center', marginBottom: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #22c55e' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#166534' }}>{settings.upi_id}</span>
                  </div>
                )}
                
                <div style={{ marginBottom: '12px' }}>
                  <label className="transaction-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>Transaction ID / UTR (required)</label>
                  <input
                    className="transaction-input"
                    type="text"
                    value={form.paymentUtr}
                    onChange={(e) => setForm({ ...form, paymentUtr: e.target.value.trim() })}
                    placeholder="Enter your transaction ID"
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                  />
                  {form.paymentUtr && form.paymentUtr.length > 0 && form.paymentUtr.length < 12 && (
                    <div style={{ color: '#dc2626', fontSize: '.75rem', marginTop: 4 }}>Transaction ID must be at least 12 characters.</div>
                  )}
                </div>

                {/* Transaction ID Visual Guidance */}
                <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#374151', margin: 0 }}>How to find your Transaction ID / UTR</h4>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '10px' }}>After payment, open your payment transaction details and enter the Transaction ID shown in the example below.</p>
                  
                  <div className="transaction-id-demo-images">
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src="/transaction-id-demo-1.svg" 
                        alt="Transaction ID Example 1" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src="/transaction-id-demo-2.svg" 
                        alt="Transaction ID Example 2" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {settings.payment_instructions && (
              <p style={{ fontSize: '.75rem', color: '#6b7280', whiteSpace: 'pre-line', marginBottom: '12px' }}>
                {settings.payment_instructions}
              </p>
            )}
          </div>

          {/* Order Total */}
          <div className="transaction-section" style={{ background: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#374151', margin: 0 }}>Order Total</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>GST</span>
                <span>₹{totals.gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Delivery</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.9rem' }}>
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#2d5a27', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleBack}
              className="transaction-button"
              style={{ flex: 1, padding: '10px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Back
            </button>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="transaction-button"
              style={{ flex: 1, padding: '10px 20px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', opacity: placing ? 0.6 : 1 }}
            >
              {placing ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}