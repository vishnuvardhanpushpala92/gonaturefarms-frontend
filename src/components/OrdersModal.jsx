import React from 'react';
import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

const STATUS_LABELS = {
  'Placed': 'Order Placed',
  'Confirmed': 'Order Confirmed',
  'Processing': 'Processing',
  'Packed': 'Packed',
  'Shipped': 'Shipped',
  'OutForDelivery': 'Out for Delivery',
  'Delivered': 'Delivered',
  'PaymentVerificationPending': 'Payment Verification',
  'Cancelled': 'Cancelled'
};

export default function OrdersModal({ open, onClose }) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get('/orders/lookup', { params: { phone } });
      setOrders(data.orders || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.orders || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Track Orders" wide>
      {user ? (
        <button className="btn btn-secondary" style={{ marginBottom: 14 }} onClick={loadMyOrders}>
          View My Orders
        </button>
      ) : (
        <form onSubmit={lookupByPhone} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }} />
          <button className="btn btn-primary">Track</button>
        </form>
      )}

      {loading && <p>Loading...</p>}

      {!loading && searched && orders.length === 0 && <p>No orders found.</p>}

      {orders.map((o) => {
        const normalizedStatus = o.status === 'Pending' ? 'Placed' : o.status;
        const stepIdx = STATUS_STEPS.indexOf(normalizedStatus);
        const isCancelled = o.status === 'Cancelled';
        const isPaymentPending = o.status === 'PaymentVerificationPending';
        
        return (
          <div key={o.orderId} className="bill" style={{ marginBottom: 14 }}>
            <div className="bill-hdr">
              <h3>{o.orderId}</h3>
              <p>{new Date(o.createdAt).toLocaleDateString()} · {STATUS_LABELS[o.status] || o.status}</p>
            </div>
            <div className="bill-body">
              <div className="bill-info">{o.itemsSummary}</div>
              
              {isPaymentPending && (
                <div style={{ 
                  padding: '12px', 
                  background: '#fffbeb', 
                  border: '1px solid #fcd34d', 
                  borderRadius: 8, 
                  margin: '14px 0',
                  fontSize: '.85rem',
                  color: '#92400e'
                }}>
                  ⏳ Payment verification pending. Please wait for admin approval.
                </div>
              )}
              
              {!isCancelled && !isPaymentPending && (
                <div className="steps" style={{ margin: '14px 0' }}>
                  {STATUS_STEPS.map((s, i) => {
                    const isComplete = i <= stepIdx;
                    const isCurrent = i === stepIdx;
                    return (
                      <div className="step" key={s} style={{ flex: 1 }}>
                        <div 
                          className={`step-num${isComplete ? ' done' : ''}${isCurrent ? ' active' : ''}`}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '.75rem',
                            fontWeight: 600,
                            margin: '0 auto 4px',
                            background: isComplete ? 'var(--p)' : (isCurrent ? 'var(--accent)' : '#e5e7eb'),
                            color: isComplete ? '#fff' : (isCurrent ? 'var(--text)' : '#9ca3af')
                          }}
                        >
                          {isComplete ? '✓' : i + 1}
                        </div>
                        <div 
                          className={`step-lbl${isCurrent ? ' active' : ''}`}
                          style={{
                            fontSize: '.7rem',
                            textAlign: 'center',
                            color: isCurrent ? 'var(--p)' : (isComplete ? 'var(--text)' : '#9ca3af'),
                            fontWeight: isCurrent ? 600 : 400
                          }}
                        >
                          {STATUS_LABELS[s] || s}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {isCancelled && (
                <div style={{ 
                  padding: '12px', 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: 8, 
                  margin: '14px 0',
                  fontSize: '.85rem',
                  color: '#dc2626'
                }}>
                  ❌ Order cancelled
                </div>
              )}
              
              {o.trackingLocation && <p style={{ fontSize: '.78rem', color: 'var(--muted)' }}>📍 {o.trackingLocation}</p>}
              <div className="bill-total"><span>Total</span><span>₹{o.total}</span></div>
            </div>
          </div>
        );
      })}
    </Modal>
  );
}
