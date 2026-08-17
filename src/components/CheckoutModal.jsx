import React from 'react';
import { useState } from 'react';
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
  const [form, setForm] = useState({
    customerName: user?.name || '', phone: user?.phone || '', email: user?.email || '',
    address: '', area: '', city: '', state: '', pincode: '', paymentMethod: 'UPI'
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
        ...form,
        items: items.map((i) => ({ id: i.id, name: i.name, img: i.img, price: i.price, gst: i.gst, qty: i.qty })),
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        deliveryCharge,
        discount,
        total: grandTotal,
        couponCode: coupon || undefined,
        userId: user?.id
      };
      const { data } = await api.post('/orders', payload);
      if (data.success) {
        setPlacedOrder({ orderId: data.orderId, ...payload });
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
    // If it's already a full URL (Cloudinary), return as-is
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    // If it's a local path, prefix with backend API URL
    // Handle double slashes by removing leading slash from imgUrl if backend URL ends with /
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
          <div className="frow">
            <div className="fg"><label>Name</label>
              <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
            <div className="fg"><label>Phone</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="fg"><label>Email (optional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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

          {form.paymentMethod === 'UPI' && settings.qr_code && (
            <div className="qr-box"><img src={getImageUrl(settings.qr_code)} alt="Payment QR" /></div>
          )}
          {form.paymentMethod === 'UPI' && settings.upi_id && (
            <div className="upi-box"><span className="upi-id">{settings.upi_id}</span></div>
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
