import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ensureHttps } from '../context/SiteContext.jsx';
import api from '../api/client.js';

const green = '#2d5a27';
const greenDark = '#1e3f1a';

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function TransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const showToast = useToast();

  const orderData = location.state?.orderData;

  const [step, setStep] = useState('summary'); // summary | payment | pending | paid | failed
  const [form, setForm] = useState({
    customerName: '', phone: '', email: '', address: '', area: '', city: '', state: '', pincode: ''
  });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loadingDeliveryCharge, setLoadingDeliveryCharge] = useState(false);
  const [payment, setPayment] = useState(null); // {orderId,total,upiUri,upiId,payeeName,qrDataUrl}
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const utrBlink = `@keyframes utrBlink{0%,100%{border-color:#dc2626;box-shadow:0 0 0 0 rgba(220,38,38,.35)}50%{border-color:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,.18)}}`;
  const [upiConfig, setUpiConfig] = useState(null); // {upiEnabled, upiId, payeeName, qrImageUrl, configured, configError}
  const [configLoading, setConfigLoading] = useState(true);
  const [placedOrder, setPlacedOrder] = useState(null);
  const idemKeyRef = useRef(newIdempotencyKey());
  const pollRef = useRef(null);

  // Fetch public UPI configuration once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/payments/config');
        if (!cancelled && data.success) {
          setUpiConfig({
            upiEnabled: data.upiEnabled !== false,
            upiId: data.upiId || '',
            payeeName: data.payeeName || '',
            qrImageUrl: data.qrImageUrl || '',
            paymentInstructions: data.paymentInstructions || '',
            configured: !!data.configured,
            configError: data.configError || ''
          });
        }
      } catch (err) {
        if (!cancelled) setUpiConfig({ configured: false, configError: 'Could not load payment configuration' });
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const freeDeliveryAbove = parseFloat(settings.free_delivery_above || 500);
  const subtotalWithGst = totals.subtotal + totals.gstAmount;
  const grandTotal = Math.max(0, subtotalWithGst + deliveryCharge - discount);

  useEffect(() => {
    if (orderData) {
      setForm({
        customerName: orderData.customerName || user?.name || '',
        phone: orderData.phone || user?.phone || '',
        email: orderData.email || user?.email || '',
        address: orderData.address || '',
        area: orderData.area || '',
        city: orderData.city || '',
        state: orderData.state || '',
        pincode: orderData.pincode || ''
      });
      if (orderData.pincode) fetchDeliveryCharge(orderData.pincode);
    } else {
      setForm((f) => ({
        ...f,
        customerName: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData, user]);

  const fetchDeliveryCharge = async (pincode) => {
    try {
      setLoadingDeliveryCharge(true);
      const { data } = await api.get(`/admin/zones/charge?pincode=${pincode}`);
      if (data.success) {
        const zoneCharge = parseFloat(data.charge || 0);
        setDeliveryCharge(subtotalWithGst >= freeDeliveryAbove ? 0 : zoneCharge);
        setPincodeError('');
      } else {
        setPincodeError(data.message || 'Delivery not available in your area');
        setDeliveryCharge(0);
      }
    } catch (err) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode, subtotalWithGst, freeDeliveryAbove]);

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

  const validateForm = () => {
    const checks = [
      [form.customerName, 'Please enter your name'],
      [form.phone, 'Please enter your phone number'],
      [form.email, 'Please enter your email'],
      [form.address, 'Please enter your address'],
      [form.city, 'Please enter your city'],
      [form.state, 'Please enter your state'],
      [form.pincode, 'Please enter your pincode']
    ];
    for (const [val, msg] of checks) {
      if (!val?.trim()) { showToast(msg); return false; }
    }
    if (pincodeError) { showToast('Please fix the pincode error before proceeding'); return false; }
    if (items.length === 0) { showToast('Your cart is empty'); return false; }
    return true;
  };

  // ── Step 1 → 2: create pending order + get UPI link/QR ──────────────
  const proceedToPayment = async () => {
    if (!validateForm()) return;
    setPlacing(true);
    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        email: form.email || '',
        address: form.address,
        area: form.area || '',
        city: form.city,
        state: form.state || '',
        pincode: form.pincode,
        paymentMethod: 'UPI',
        couponCode: coupon || undefined,
        idempotencyKey: idemKeyRef.current,
        userId: user?.id,
        items: items.map((item) => ({
          id: item.id,
          variantId: item.variantId || null,
          name: item.name,
          img: item.img || '',
          price: Number(item.price),
          gst: item.gst ? Number(item.gst) : 0,
          qty: Number(item.qty)
        }))
      };
      const { data } = await api.post('/payments/create', payload);
      if (data.success) {
        setPayment({
          orderId: data.orderId,
          total: parseFloat(data.total),
          upiUri: data.upiUri,
          upiLink: data.upiLink,
          upiId: data.upiId,
          payeeName: data.payeeName,
          qrImageUrl: data.qrImageUrl || '',
          qrDataUrl: data.qrDataUrl,
          subtotal: parseFloat(data.subtotal) || 0,
          gstAmount: parseFloat(data.gstAmount) || 0,
          deliveryCharge: parseFloat(data.deliveryCharge) || 0,
          discount: parseFloat(data.discount) || 0,
          paymentStatus: data.paymentStatus
        });
        // Restore previously entered UTR if customer went back and returned
        setUtr(sessionStorage.getItem(`gnf_utr_${data.orderId}`) || '');
        setUtrError('');
        if (data.paymentStatus === 'Paid') {
          handlePaid(data.orderId, parseFloat(data.total));
        } else {
          setStep('payment');
        }
      } else {
        showToast(data.message || 'Could not create order');
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Could not create order');
    } finally {
      setPlacing(false);
    }
  };

  // ── Customer submits UPI Transaction ID → verification pending ──────
  const validUtr = (v) => {
    const t = (v || '').trim();
    if (!t) return 'UPI Transaction ID is required';
    if (t.length < 6 || t.length > 50) return 'Transaction ID must be 6–50 characters';
    if (!/^[A-Za-z0-9]+$/.test(t)) return 'Transaction ID contains invalid characters';
    if (/test|demo|fake|sample|example|abcd|xxxx/i.test(t)) return 'Please enter the real transaction ID from your UPI app';
    return '';
  };

  const confirmPaid = async () => {
    if (!payment?.orderId) return;
    const err = validUtr(utr);
    setUtrError(err);
    if (err) return;
    setConfirming(true);
    try {
      const { data } = await api.post(`/payments/${payment.orderId}/confirm`, null, { params: { utr: utr.trim() } });
      if (data.success) {
        if (data.paymentStatus === 'Paid') {
          handlePaid(payment.orderId, payment.total);
        } else {
          setPayment((p) => ({ ...p, paymentStatus: data.paymentStatus || 'VerificationPending' }));
          setStep('pending');
          showToast('Payment details submitted successfully! Your bill has been generated. Our team will verify your payment and update the status.');
        }
      } else {
        showToast(data.message || 'Could not submit payment confirmation');
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Could not submit payment confirmation');
    } finally {
      setConfirming(false);
    }
  };

  const handlePaid = useCallback((orderId, paidTotal) => {
    stopPolling();
    setPlacedOrder({ orderId, total: paidTotal });
    setStep('paid');
    clearCart();
    sessionStorage.removeItem('gnf_checkout_idem');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Poll payment status while waiting (admin may verify while customer watches)
  useEffect(() => {
    if (step !== 'pending' && step !== 'payment') return;
    if (!payment?.orderId) return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/${payment.orderId}/status`);
        if (data.success) {
          const ps = data.paymentStatus;
          if (ps === 'Paid') {
            handlePaid(payment.orderId, parseFloat(data.total) || payment.total);
          } else if (ps === 'Failed' || ps === 'Cancelled' || data.status === 'Cancelled') {
            setStep('failed');
            stopPolling();
          }
        }
      } catch (e) { /* silent — keep polling */ }
    };
    poll();
    pollRef.current = setInterval(poll, 8000);
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, payment?.orderId]);

  const resetForNewOrder = () => {
    idemKeyRef.current = newIdempotencyKey();
    setPayment(null);
    setPlacedOrder(null);
    setDiscount(0);
    setCoupon('');
    setStep('summary');
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

  const card = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, marginBottom: 16 };
  const h3 = { fontSize: '1rem', marginBottom: 12, color: '#374151', margin: '0 0 12px 0' };
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 500, color: '#374151' };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────
  if (step === 'paid' && placedOrder) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px', border: '1px solid #86efac', background: '#f0fdf4' }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%', background: green, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', margin: '0 auto 16px'
          }}>✓</div>
          <h1 style={{ fontSize: '1.6rem', color: green, margin: '0 0 8px' }}>ORDER PLACED SUCCESSFULLY!</h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px' }}>
            Thank you for choosing Go Nature Farms! Your payment has been successfully received.
            Our team will contact you shortly with updates regarding your order.
          </p>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, textAlign: 'left', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
              <span style={{ color: '#6b7280' }}>Order ID</span><strong>{placedOrder.orderId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
              <span style={{ color: '#6b7280' }}>Payment Reference</span><strong>{placedOrder.orderId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
              <span style={{ color: '#6b7280' }}>Paid Amount</span><strong>₹{(placedOrder.total ?? grandTotal).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
              <span style={{ color: '#6b7280' }}>Payment Method</span><strong>UPI</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/tracking')} style={{ padding: '12px 24px' }}>
              Track My Order
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px' }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Back from payment → reopen checkout/address step with current details
  const backToCheckout = () => {
    navigate('/', { state: { openCheckout: true, checkoutPrefill: form } });
  };

  // ── PENDING VERIFICATION + BILL ─────────────────────────────────────
  if (step === 'pending' && payment) {
    const billSubtotal = payment.subtotal ?? subtotalWithGst;
    const billGst = payment.gstAmount ?? totals.gstAmount;
    const billDelivery = payment.deliveryCharge ?? deliveryCharge;
    const billDiscount = payment.discount ?? discount;
    const billTotal = payment.total;
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '2.6rem' }}>🧾</div>
          <h1 style={{ fontSize: '1.4rem', color: green, margin: '8px 0 4px' }}>Order Submitted</h1>
          <p style={{ color: '#6b7280', margin: '0 0 8px' }}>
            Your bill has been generated successfully. Our team will verify your payment and update your payment status after confirming the transaction.
          </p>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Payment verification is pending. This page updates automatically once our team verifies your payment.
          </p>
        </div>

        {/* Bill / Invoice */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: green, color: '#fff', padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: 0.5 }}>GO NATURE FARMS</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Farm-fresh organic products</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.85rem', marginBottom: 14 }}>
              <div><span style={{ color: '#6b7280' }}>Order No:</span> <strong>{payment.orderId}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Order Date:</span> <strong>{new Date().toLocaleDateString('en-IN')}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Customer:</span> <strong>{form.customerName}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Phone:</span> <strong>{form.phone}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#6b7280' }}>Delivery Address:</span>{' '}
                <strong>{form.address}{form.area ? `, ${form.area}` : ''}, {form.city}, {form.state} - {form.pincode}</strong>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>Item</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.id}-${item.variantId || i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 4px' }}>
                      {item.name}
                      {item.variantName && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.variantName}</div>}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{Number(item.price).toFixed(2)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>₹{(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{billSubtotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>₹{billGst.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery</span><span>{billDelivery === 0 ? 'FREE' : `₹${billDelivery.toFixed(2)}`}</span>
              </div>
              {billDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Discount</span><span>-₹{billDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: green, borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 4 }}>
                <span>Total</span><span>₹{billTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#6b7280' }}>Payment Method</span><span>UPI</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#6b7280' }}>Payment Status</span>
                <span style={{ color: '#92400e', fontWeight: 600 }}>Awaiting verification</span>
              </div>
              {utr.trim() && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7280' }}>UPI Transaction ID / UTR</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{utr.trim()}</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: '#6b7280', borderTop: '1px dashed #d1d5db', marginTop: 14, paddingTop: 10, lineHeight: 1.5 }}>
              <strong>NOTE:</strong> Your UPI payment will be verified by the Go Nature Farms team.
              A WhatsApp payment confirmation will be sent only after our team verifies that the payment has been received.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => navigate('/tracking')} style={{ padding: '12px 24px' }}>
            Track My Order
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── FAILED / CANCELLED ──────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px', border: '1px solid #fecaca', background: '#fef2f2' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✕</div>
          <h1 style={{ fontSize: '1.4rem', color: '#991b1b', margin: '0 0 8px' }}>PAYMENT NOT COMPLETED</h1>
          <p style={{ color: '#6b7280', margin: '0 0 24px' }}>
            {payment?.orderId ? `Order ${payment.orderId} was not paid or was cancelled. ` : ''}
            No amount was confirmed. You can try again — your cart is safe.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={resetForNewOrder} style={{ padding: '12px 24px' }}>
              Try Again
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px' }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── UPI PAYMENT SCREEN ──────────────────────────────────────────────
  if (step === 'payment' && payment) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: '1.4rem', color: green, margin: 0 }}>UPI Payment</h1>
          <button onClick={backToCheckout} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Edit Address
          </button>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: '0 0 4px', fontSize: '0.9rem' }}>Amount Payable</p>
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: green, margin: '0 0 4px' }}>₹{payment.total.toFixed(2)}</p>
          <p style={{ color: '#6b7280', margin: '0 0 20px', fontSize: '0.85rem' }}>
            Order: {payment.orderId} · Pay to: <strong>{payment.payeeName}</strong>
            {payment.upiId ? ` (${payment.upiId})` : ''}
          </p>

          {payment.qrImageUrl ? (
            <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 }}>
              <img src={payment.qrImageUrl} alt="UPI QR Code" style={{ width: 220, height: 220, objectFit: 'contain', display: 'block' }} />
            </div>
          ) : payment.qrDataUrl ? (
            <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 }}>
              <img src={payment.qrDataUrl} alt="UPI QR Code" style={{ width: 220, height: 220, display: 'block' }} />
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 6 }}>Auto-generated QR with exact amount &amp; order reference</div>
            </div>
          ) : (
            <div style={{ padding: 24, background: '#f9fafb', borderRadius: 8, marginBottom: 16, color: '#6b7280' }}>
              QR code unavailable — use the Pay button below.
            </div>
          )}

          <p style={{ fontSize: '0.9rem', color: '#374151', margin: '0 0 16px' }}>
            <strong>Scan & Pay:</strong> Open PhonePe, Google Pay, Paytm or any UPI app on your phone
            and scan the QR code above to pay the exact order amount.
          </p>

          {/* SECTION B – Mandatory Transaction ID */}
          <div style={{ textAlign: 'left', marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#dc2626', marginBottom: 6 }}>
              ENTER YOUR UPI TRANSACTION ID <span style={{ fontSize: '0.7rem', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle' }}>MANDATORY</span>
            </label>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={utr}
              onChange={(e) => {
                const v = e.target.value;
                setUtr(v);
                setUtrError('');
                if (payment?.orderId) sessionStorage.setItem(`gnf_utr_${payment.orderId}`, v);
              }}
              placeholder="Enter your 12-digit UPI transaction reference number"
              style={{
                width: '100%', padding: '12px', fontSize: '1rem', borderRadius: 10,
                border: '2px solid #dc2626', outline: 'none', boxSizing: 'border-box',
                animation: 'utrBlink 1.6s ease-in-out infinite'
              }}
            />
            <style>{utrBlink}</style>
            {utrError && <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{utrError}</div>}
            {!utrError && utr.trim() && !validUtr(utr) && (
              <div style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: 4 }}>✓ Looks valid</div>
            )}
          </div>

          {/* SECTION C – Instructional images */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { src: '/transaction-id-demo-1.svg', name: 'PhonePe', desc: 'History → tap payment → UTR' },
              { src: '/transaction-id-demo-2.svg', name: 'Google Pay', desc: 'Activity → tap payment → UPI ref' }
            ].map((img) => (
              <a key={img.name} href={img.src} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                  <img src={img.src} alt={`${img.name} – where to find UPI Transaction ID`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: green }}>{img.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{img.desc}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* SECTION D – Payment instructions */}
          <div style={{ textAlign: 'left', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: green, marginBottom: 6 }}>Payment Instructions</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#374151', lineHeight: 1.7 }}>
              <li>Open PhonePe, Google Pay, Paytm or another UPI application.</li>
              <li>Scan the Go Nature Farms QR code with your UPI application.</li>
              <li>Check the <strong>Go Nature Farms</strong> merchant name.</li>
              <li>Check the amount before paying.</li>
              <li>Complete the payment in your UPI application.</li>
              <li>Return to the Go Nature Farms website.</li>
              <li>Find the UPI Transaction ID in your payment history.</li>
              <li>Enter the Transaction ID in the mandatory field above.</li>
              <li>Click <strong>PAYMENT DONE</strong>.</li>
            </ol>
          </div>

          {/* Payment Verification Notice */}
          <div style={{ textAlign: 'left', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e', marginBottom: 4 }}>Payment Verification Notice:</div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f', lineHeight: 1.6 }}>
              <strong>NOTE:</strong> Our team will verify your payment and update the payment status.
            </p>
          </div>

          {/* SECTION E – PAYMENT DONE */}
          <button
            onClick={confirmPaid}
            disabled={confirming || !!validUtr(utr)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', opacity: confirming || validUtr(utr) ? 0.6 : 1, fontWeight: 700, fontSize: '1rem' }}
          >
            {confirming ? 'Submitting…' : 'PAYMENT DONE'}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10 }}>
            Enter your UPI Transaction ID above to enable this button. Our team verifies every payment manually.
          </p>
        </div>
      </div>
    );
  }

  // ── ORDER SUMMARY / CHECKOUT DETAILS ────────────────────────────────
  if (items.length === 0 && step === 'summary') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <h2 style={{ color: green }}>Your cart is empty</h2>
        <p style={{ color: '#6b7280' }}>Add some products before checking out.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 12 }}>Back to Store</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', color: green, margin: 0 }}>Checkout</h1>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back to Store
        </button>
      </div>

      {/* Order Summary */}
      <div style={card}>
        <h3 style={h3}>Order Summary</h3>
        {items.map((item, index) => (
          <div key={`${item.id}-${item.variantId || index}`} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
            {item.img && (
              <img src={getImageUrl(item.img)} alt={item.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
              {item.variantName && <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.variantName}</div>}
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Qty: {item.qty} × ₹{Number(item.price).toFixed(2)}</div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{(item.price * item.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Customer Details — confirmed at checkout; edit via Back/Edit Address */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ ...h3, margin: 0 }}>Customer Details</h3>
          {orderData && (
            <button type="button" onClick={backToCheckout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Edit Address
            </button>
          )}
        </div>
        {orderData ? (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
            <div><strong>{form.customerName}</strong></div>
            <div>{form.phone} · {form.email}</div>
            <div>{form.address}{form.area ? `, ${form.area}` : ''}, {form.city}, {form.state} - {form.pincode}</div>
          </div>
        ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label style={labelStyle}>Pincode</label>
            <input style={inputStyle} value={form.pincode} maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            {pincodeError && <div style={{ color: '#dc2626', fontSize: '.75rem', marginTop: 4 }}>{pincodeError}</div>}
            {loadingDeliveryCharge && <div style={{ color: '#6b7280', fontSize: '.75rem', marginTop: 4 }}>Checking delivery availability…</div>}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Address</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div><label style={labelStyle}>City</label><input style={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label style={labelStyle}>State</label><input style={inputStyle} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
        </div>
        </>
        )}
      </div>

      {/* Totals + Coupon */}
      <div style={card}>
        <h3 style={h3}>Payment</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }}
            placeholder="Coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          />
          <button type="button" onClick={applyCoupon} className="btn btn-secondary" style={{ padding: '10px 16px' }}>Apply</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>GST</span><span>₹{totals.gstAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Delivery</span>
            <span>{loadingDeliveryCharge ? '…' : deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.9rem' }}>
              <span>Discount</span><span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: green, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
            <span>Total Payable</span><span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* UPI configuration status */}
      {!configLoading && upiConfig && !upiConfig.configured && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#92400e' }}>
          {upiConfig.upiEnabled === false
            ? 'UPI payments are currently disabled. Please contact the store.'
            : (upiConfig.configError || 'UPI payments are not configured yet. Please contact the store.')}
        </div>
      )}

      <button
        onClick={proceedToPayment}
        disabled={placing || !!pincodeError || configLoading || (upiConfig && !upiConfig.configured)}
        className="btn btn-primary btn-block"
        style={{ padding: '14px', fontSize: '1rem', fontWeight: 700, opacity: placing || pincodeError || (upiConfig && !upiConfig.configured) ? 0.6 : 1 }}
      >
        {placing ? 'Creating order…' : 'PROCEED TO UPI PAYMENT'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: 10 }}>
        You will pay directly via UPI (GPay, PhonePe, Paytm, etc.). No card or net-banking needed.
      </p>
    </div>
  );
}
