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
  const [returnForm, setReturnForm] = useState({});
  const [showReturnForm, setShowReturnForm] = useState({});

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    // If user is logged in, they should use "View My Orders" instead
    if (user) {
      alert('Please use the "View My Orders" button to view your orders.');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.get('/orders/lookup', { params: { phone }, timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my', { timeout: 60000 });
      setOrders(data.orders || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const requestReturn = async (orderId) => {
    const form = returnForm[orderId] || {};
    if (!form.reason) {
      alert('Please provide a reason for the return');
      return;
    }

    try {
      const { data } = await api.post(`/orders/${orderId}/return`, {
        reason: form.reason,
        notes: form.notes
      });
      alert('Return request submitted successfully');
      setShowReturnForm(prev => ({ ...prev, [orderId]: false }));
      setReturnForm(prev => ({ ...prev, [orderId]: {} }));
      loadMyOrders();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit return request');
    }
  };

  const reorderOrder = async (order) => {
    if (!confirm('Do you want to add these items to your cart?')) return;
    
    try {
      const items = order.items || [];
      for (const item of items) {
        await api.post('/cart', {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        });
      }
      alert('Items added to cart successfully');
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add items to cart');
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
              
              {o.trackingLocation && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  background: '#f0fdf4', 
                  border: '2px solid #16a34a', 
                  borderRadius: 8 
                }}>
                  <div style={{ 
                    fontSize: '.85rem', 
                    fontWeight: 600, 
                    color: '#16a34a', 
                    marginBottom: 4 
                  }}>
                    🚚 Current Location
                  </div>
                  <div style={{ 
                    fontSize: '.9rem', 
                    color: '#1f2937',
                    fontWeight: 500
                  }}>
                    {o.trackingLocation}
                  </div>
                  <div style={{ 
                    fontSize: '.75rem', 
                    color: '#6b7280', 
                    marginTop: 4 
                  }}>
                    Last updated: {new Date(o.updatedAt || o.createdAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Post-Delivery Actions */}
              {o.status === 'Delivered' && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.open(`/api/orders/${o.orderId}/invoice`, '_blank')}
                    style={{ fontSize: '.85rem' }}
                  >
                    📄 Download Invoice
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.open(`/api/orders/${o.orderId}/details`, '_blank')}
                    style={{ fontSize: '.85rem' }}
                  >
                    👁️ View Details
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReturnForm(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }))}
                    style={{ fontSize: '.85rem' }}
                  >
                    🔄 Request Return
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => reorderOrder(o)}
                    style={{ fontSize: '.85rem' }}
                  >
                    🛒 Reorder
                  </button>
                </div>
              )}

              {/* Return Request Section */}
              {o.status === 'Delivered' && !o.returnRequested && (
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReturnForm(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }))}
                    style={{ fontSize: '.85rem' }}
                  >
                    🔄 Request Return
                  </button>

                  {showReturnForm[o.orderId] && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      background: '#f9fafb',
                      border: '1px solid var(--border)',
                      borderRadius: 8
                    }}>
                      <h5 style={{ marginBottom: 8, fontSize: '.9rem' }}>Request Return</h5>
                      <div className="fg" style={{ marginBottom: 8 }}>
                        <label>Return Reason *</label>
                        <select
                          value={returnForm[o.orderId]?.reason || ''}
                          onChange={(e) => setReturnForm(prev => ({
                            ...prev,
                            [o.orderId]: { ...prev[o.orderId], reason: e.target.value }
                          }))}
                        >
                          <option value="">Select reason...</option>
                          <option value="Product damaged">Product damaged</option>
                          <option value="Wrong product received">Wrong product received</option>
                          <option value="Quality issues">Quality issues</option>
                          <option value="Not as described">Not as described</option>
                          <option value="Changed mind">Changed mind</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="fg" style={{ marginBottom: 8 }}>
                        <label>Additional Notes</label>
                        <textarea
                          rows={2}
                          value={returnForm[o.orderId]?.notes || ''}
                          onChange={(e) => setReturnForm(prev => ({
                            ...prev,
                            [o.orderId]: { ...prev[o.orderId], notes: e.target.value }
                          }))}
                          placeholder="Please provide more details..."
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => requestReturn(o.orderId)}
                          style={{ fontSize: '.85rem' }}
                        >
                          Submit Return Request
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowReturnForm(prev => ({ ...prev, [o.orderId]: false }))}
                          style={{ fontSize: '.85rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Return Status Display */}
              {o.returnRequested && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: 8,
                  fontSize: '.85rem'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>🔄 Return Request Status</div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Status:</strong>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '.75rem',
                      marginLeft: 8,
                      background: o.returnStatus === 'Pending' ? '#fffbeb' : o.returnStatus === 'Approved' ? '#f0fdf4' : o.returnStatus === 'Rejected' ? '#fef2f2' : '#dbeafe',
                      color: o.returnStatus === 'Pending' ? '#92400e' : o.returnStatus === 'Approved' ? '#166534' : o.returnStatus === 'Rejected' ? '#dc2626' : '#1e40af'
                    }}>
                      {o.returnStatus}
                    </span>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Reason:</strong> {o.returnReason}
                  </div>
                  {o.returnProcessedAt && (
                    <div style={{ marginBottom: 4 }}>
                      <strong>Processed At:</strong> {new Date(o.returnProcessedAt).toLocaleString()}
                    </div>
                  )}
                  {o.refundAmount && (
                    <div style={{ marginBottom: 4 }}>
                      <strong>Refund Amount:</strong> ₹{o.refundAmount}
                    </div>
                  )}
                  {o.refundNotes && (
                    <div>
                      <strong>Admin Notes:</strong> {o.refundNotes}
                    </div>
                  )}
                </div>
              )}

              <div className="bill-total"><span>Total</span><span>₹{o.total}</span></div>
            </div>
          </div>
        );
      })}
    </Modal>
  );
}
