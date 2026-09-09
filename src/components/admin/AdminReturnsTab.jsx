import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const RETURN_STATUSES = ['Pending', 'Approved', 'Rejected', 'Processing', 'Completed'];

const STATUS_LABELS = {
  'Pending': 'Pending Review',
  'Approved': 'Approved',
  'Rejected': 'Rejected',
  'Processing': 'Processing',
  'Completed': 'Completed'
};

export default function AdminReturnsTab() {
  const showToast = useToast();
  const [returns, setReturns] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [refundForm, setRefundForm] = useState({});

  const load = () => {
    api.get('/admin/orders', { params: { status: 'Delivered' } })
      .then(({ data }) => {
        const ordersWithReturns = (data.orders || []).filter(order => order.returnRequested);
        setReturns(ordersWithReturns);
      })
      .catch(err => showToast(err?.response?.data?.message || 'Failed to load return requests'));
  };

  useEffect(() => {
    load();
  }, []);

  const processRefund = async (orderId) => {
    const form = refundForm[orderId] || {};
    if (!form.returnStatus) {
      showToast('Please select a return status');
      return;
    }

    if ((form.returnStatus === 'Approved' || form.returnStatus === 'Processing') && !form.refundAmount) {
      showToast('Please enter refund amount');
      return;
    }

    try {
      const { data } = await api.put(`/orders/${orderId}/refund`, {
        returnStatus: form.returnStatus,
        refundAmount: form.refundAmount,
        refundNotes: form.refundNotes
      });
      showToast(data.message || 'Return status updated successfully');
      setRefundForm(prev => ({ ...prev, [orderId]: {} }));
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update return status');
    }
  };

  const filteredReturns = statusFilter
    ? returns.filter(r => r.returnStatus === statusFilter)
    : returns;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }}
        >
          <option value="">All statuses</option>
          {RETURN_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
        </select>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          {filteredReturns.length} return request{filteredReturns.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredReturns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No return requests found
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Requested</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((r) => (
              <React.Fragment key={r.orderId}>
                <tr>
                  <td>{r.orderId}</td>
                  <td>{r.customerName}<br /><small style={{ color: 'var(--muted)' }}>{r.phone}</small></td>
                  <td>{r.returnReason || '-'}</td>
                  <td>{r.returnRequestedAt ? new Date(r.returnRequestedAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '.75rem',
                      background: r.returnStatus === 'Pending' ? '#fffbeb' :
                               r.returnStatus === 'Approved' ? '#f0fdf4' :
                               r.returnStatus === 'Rejected' ? '#fef2f2' :
                               r.returnStatus === 'Processing' ? '#dbeafe' : '#f0fdf4',
                      color: r.returnStatus === 'Pending' ? '#92400e' :
                             r.returnStatus === 'Approved' ? '#166534' :
                             r.returnStatus === 'Rejected' ? '#dc2626' :
                             r.returnStatus === 'Processing' ? '#1e40af' : '#166534'
                    }}>
                      {r.returnStatus}
                    </span>
                  </td>
                  <td>
                    <button className="btn-e" onClick={() => setExpanded(expanded === r.orderId ? null : r.orderId)}>
                      {expanded === r.orderId ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded === r.orderId && (
                  <tr>
                    <td colSpan={6} style={{ background: '#f9fafb', padding: 16 }}>
                      <p><strong>Order Total:</strong> ₹{r.total}</p>
                      <p><strong>Return Reason:</strong> {r.returnReason || 'Not provided'}</p>
                      {r.returnNotes && <p><strong>Customer Notes:</strong> {r.returnNotes}</p>}
                      <p><strong>Requested At:</strong> {r.returnRequestedAt ? new Date(r.returnRequestedAt).toLocaleString() : 'N/A'}</p>

                      {r.returnStatus === 'Pending' && (
                        <div style={{ marginTop: 16, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                          <h5 style={{ marginBottom: 12 }}>Process Return Request</h5>
                          <div className="fg" style={{ marginBottom: 8 }}>
                            <label>Return Decision</label>
                            <select
                              value={refundForm[r.orderId]?.returnStatus || ''}
                              onChange={(e) => setRefundForm(prev => ({
                                ...prev,
                                [r.orderId]: { ...prev[r.orderId], returnStatus: e.target.value }
                              }))}
                            >
                              <option value="">Select action...</option>
                              <option value="Approved">Approve Return</option>
                              <option value="Rejected">Reject Return</option>
                            </select>
                          </div>

                          {refundForm[r.orderId]?.returnStatus === 'Approved' && (
                            <>
                              <div className="fg" style={{ marginBottom: 8 }}>
                                <label>Refund Amount (₹)</label>
                                <input
                                  type="number"
                                  value={refundForm[r.orderId]?.refundAmount || r.total}
                                  onChange={(e) => setRefundForm(prev => ({
                                    ...prev,
                                    [r.orderId]: { ...prev[r.orderId], refundAmount: parseFloat(e.target.value) }
                                  }))}
                                  placeholder="Enter refund amount"
                                />
                              </div>

                              <div className="fg" style={{ marginBottom: 12 }}>
                                <label>Refund Notes (optional)</label>
                                <textarea
                                  rows={2}
                                  value={refundForm[r.orderId]?.refundNotes || ''}
                                  onChange={(e) => setRefundForm(prev => ({
                                    ...prev,
                                    [r.orderId]: { ...prev[r.orderId], refundNotes: e.target.value }
                                  }))}
                                  placeholder="Add notes about this refund..."
                                />
                              </div>
                            </>
                          )}

                          <button
                            className="btn btn-primary"
                            onClick={() => processRefund(r.orderId)}
                            style={{ background: '#16a34a' }}
                          >
                            Update Status
                          </button>
                        </div>
                      )}

                      {r.returnStatus !== 'Pending' && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ marginBottom: 4 }}>
                            <strong>Processed At:</strong> {r.returnProcessedAt ? new Date(r.returnProcessedAt).toLocaleString() : 'N/A'}
                          </div>
                          {r.refundAmount && (
                            <div style={{ marginBottom: 4 }}>
                              <strong>Refund Amount:</strong> ₹{r.refundAmount}
                            </div>
                          )}
                          {r.refundNotes && (
                            <div style={{ marginBottom: 4 }}>
                              <strong>Refund Notes:</strong> {r.refundNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
