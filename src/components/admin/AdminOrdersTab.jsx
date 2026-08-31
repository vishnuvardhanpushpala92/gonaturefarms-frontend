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
  const [refundForm, setRefundForm] = useState({});

  const load = () => {
    api.get('/admin/orders', { params: { status: statusFilter || undefined } })
      .then(({ data }) => setOrders(data.orders || []));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const updateOrder = async (orderId, patch) => {
    try {
      const { data } = await api.put(`/orders/${orderId}`, patch);
      showToast(data.message || 'Order updated successfully');
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update order');
    }
  };

  const verifyPayment = async (orderId, approved) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/verify-payment?approved=${approved}`);
      showToast(data.message || 'Payment verification completed');
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Payment verification failed');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete ALL orders? This will export all orders to Excel before clearing. This cannot be undone.')) return;
    try {
      const { data } = await api.delete('/admin/orders/all');
      showToast(data.message || 'All orders deleted successfully');
      
      // Download Excel file if available
      if (data.excelData) {
        const blob = new Blob([data.excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete orders');
    }
  };

  const processRefund = async (orderId) => {
    const form = refundForm[orderId] || {};
    if (!form.returnStatus) {
      showToast('Please select a refund status');
      return;
    }

    if ((form.returnStatus === 'Approved' || form.returnStatus === 'PartialRefund') && !form.refundAmount) {
      showToast('Please enter refund amount');
      return;
    }

    try {
      const { data } = await api.put(`/orders/${orderId}/refund`, {
        returnStatus: form.returnStatus,
        refundAmount: form.refundAmount,
        refundNotes: form.refundNotes
      });
      showToast(data.message || 'Refund processed successfully');
      setRefundForm(prev => ({ ...prev, [orderId]: {} }));
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to process refund');
    }
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
                    <p><strong>Items:</strong></p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {(o.itemsList || '').split('||').map((itemStr, i) => {
                        if (!itemStr) return null;
                        const [name, qty, img] = itemStr.split('|');
                        return (
                          <li key={i} style={{ marginBottom: 4 }}>
                            {name} 
                            <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>(Qty: {qty})</span>
                          </li>
                        );
                      })}
                    </ul>
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

                    {/* Return/Refund Section */}
                    {o.returnRequested && (
                      <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: 8
                      }}>
                        <h4 style={{ marginBottom: 12, color: '#92400e' }}>🔄 Return Request</h4>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Return Reason:</strong> {o.returnReason || 'Not provided'}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Requested At:</strong> {o.returnRequestedAt ? new Date(o.returnRequestedAt).toLocaleString() : 'N/A'}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <strong>Current Status:</strong>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: '.75rem',
                            marginLeft: 8,
                            background: o.returnStatus === 'Pending' ? '#fffbeb' : o.returnStatus === 'Approved' ? '#f0fdf4' : o.returnStatus === 'Rejected' ? '#fef2f2' : '#dbeafe',
                            color: o.returnStatus === 'Pending' ? '#92400e' : o.returnStatus === 'Approved' ? '#166534' : o.returnStatus === 'Rejected' ? '#dc2626' : '#1e40af'
                          }}>
                            {o.returnStatus}
                          </span>
                        </div>

                        {o.returnStatus === 'Pending' && (
                          <div style={{ marginTop: 12 }}>
                            <h5 style={{ marginBottom: 8 }}>Process Refund</h5>
                            <div className="fg" style={{ marginBottom: 8 }}>
                              <label>Refund Decision</label>
                              <select
                                value={refundForm[o.orderId]?.returnStatus || ''}
                                onChange={(e) => setRefundForm(prev => ({
                                  ...prev,
                                  [o.orderId]: { ...prev[o.orderId], returnStatus: e.target.value }
                                }))}
                              >
                                <option value="">Select action...</option>
                                <option value="Approved">Full Refund</option>
                                <option value="PartialRefund">Partial Refund</option>
                                <option value="Rejected">Reject Return</option>
                              </select>
                            </div>

                            {(refundForm[o.orderId]?.returnStatus === 'Approved' || refundForm[o.orderId]?.returnStatus === 'PartialRefund') && (
                              <div className="fg" style={{ marginBottom: 8 }}>
                                <label>Refund Amount (₹)</label>
                                <input
                                  type="number"
                                  value={refundForm[o.orderId]?.refundAmount || o.total}
                                  onChange={(e) => setRefundForm(prev => ({
                                    ...prev,
                                    [o.orderId]: { ...prev[o.orderId], refundAmount: parseFloat(e.target.value) }
                                  }))}
                                  placeholder="Enter refund amount"
                                />
                              </div>
                            )}

                            <div className="fg" style={{ marginBottom: 12 }}>
                              <label>Refund Notes (optional)</label>
                              <textarea
                                rows={2}
                                value={refundForm[o.orderId]?.refundNotes || ''}
                                onChange={(e) => setRefundForm(prev => ({
                                  ...prev,
                                  [o.orderId]: { ...prev[o.orderId], refundNotes: e.target.value }
                                }))}
                                placeholder="Add notes about this refund..."
                              />
                            </div>

                            <button
                              className="btn btn-primary"
                              onClick={() => processRefund(o.orderId)}
                              style={{ background: '#16a34a' }}
                            >
                              Process Refund
                            </button>
                          </div>
                        )}

                        {o.returnStatus !== 'Pending' && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Processed At:</strong> {o.returnProcessedAt ? new Date(o.returnProcessedAt).toLocaleString() : 'N/A'}
                            </div>
                            {o.refundAmount && (
                              <div style={{ marginBottom: 4 }}>
                                <strong>Refund Amount:</strong> ₹{o.refundAmount}
                              </div>
                            )}
                            {o.refundNotes && (
                              <div style={{ marginBottom: 4 }}>
                                <strong>Refund Notes:</strong> {o.refundNotes}
                              </div>
                            )}
                          </div>
                        )}
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
