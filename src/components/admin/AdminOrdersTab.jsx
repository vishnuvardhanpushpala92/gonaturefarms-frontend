import React from 'react';
import { useEffect, useState, Fragment } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'PaymentVerificationPending'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

const STATUS_LABELS = {
  'Placed': 'Order Placed',
  'Confirmed': 'Confirmed',
  'Processing': 'Processing',
  'Packed': 'Packed',
  'Shipped': 'Shipped',
  'OutForDelivery': 'Out for Delivery',
  'Delivered': 'Delivered',
  'Cancelled': 'Cancelled',
  'PaymentVerificationPending': 'Payment Verification'
};

export default function AdminOrdersTab() {
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    api.get('/admin/orders', { params: { status: statusFilter || undefined } })
      .then(({ data }) => setOrders(data.orders || []));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const updateOrder = async (orderId, patch) => {
    const { data } = await api.put(`/orders/${orderId}`, patch);
    showToast(data.message);
    load();
  };

  const verifyPayment = async (orderId, approved) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/verify-payment?approved=${approved}`);
      showToast(data.message);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Payment verification failed');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete ALL orders? This cannot be undone.')) return;
    const { data } = await api.delete('/admin/orders/all');
    showToast(data.message);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-danger" onClick={clearAll}>Clear All Orders</button>
      </div>

      <table className="data-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.orderId}>
              <tr>
                <td>{o.orderId}</td>
                <td>{o.customerName}<br /><small style={{ color: 'var(--muted)' }}>{o.phone}</small></td>
                <td>₹{o.total}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateOrder(o.orderId, { status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                  </select>
                </td>
                <td>
                  <select value={o.paymentStatus} onChange={(e) => updateOrder(o.orderId, { paymentStatus: e.target.value })}>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn-e" onClick={() => setExpanded(expanded === o.orderId ? null : o.orderId)}>
                    {expanded === o.orderId ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
              {expanded === o.orderId && (
                <tr>
                  <td colSpan={6} style={{ background: '#f9fafb', padding: 16 }}>
                    <p><strong>Address:</strong> {o.address}, {o.area}, {o.city}, {o.state} - {o.pincode}</p>
                    <p><strong>Items:</strong> {o.itemsList}</p>
                    <div className="fg" style={{ maxWidth: 320, marginBottom: 12 }}>
                      <label>Tracking Location</label>
                      <input
                        defaultValue={o.trackingLocation || ''}
                        onBlur={(e) => updateOrder(o.orderId, { trackingLocation: e.target.value })}
                      />
                    </div>
                    
                    {/* Payment Verification Section */}
                    {o.paymentMethod === 'UPI' && o.status === 'PaymentVerificationPending' && (
                      <div style={{ 
                        marginTop: 16, 
                        padding: 16, 
                        background: '#fffbeb', 
                        border: '1px solid #fcd34d', 
                        borderRadius: 8 
                      }}>
                        <h4 style={{ marginBottom: 12, color: '#92400e' }}>💳 Payment Verification Required</h4>
                        <div style={{ marginBottom: 8 }}>
                          <strong>UTR:</strong> {o.paymentUtr || 'Not provided'}
                        </div>
                        {o.paymentScreenshotUrl && (
                          <div style={{ marginBottom: 12 }}>
                            <strong>Payment Screenshot:</strong>
                            <div style={{ marginTop: 8 }}>
                              <img 
                                src={o.paymentScreenshotUrl} 
                                alt="Payment Screenshot" 
                                style={{ 
                                  maxWidth: 200, 
                                  maxHeight: 200, 
                                  border: '1px solid var(--border)', 
                                  borderRadius: 8,
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(o.paymentScreenshotUrl, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => verifyPayment(o.orderId, true)}
                            style={{ background: '#16a34a' }}
                          >
                            ✓ Approve Payment
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => verifyPayment(o.orderId, false)}
                          >
                            ✗ Reject Payment
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {o.paymentVerified && (
                      <div style={{ 
                        marginTop: 12, 
                        padding: 8, 
                        background: '#f0fdf4', 
                        border: '1px solid #86efac', 
                        borderRadius: 8,
                        fontSize: '.85rem',
                        color: '#166534'
                      }}>
                        ✓ Payment verified by admin
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
