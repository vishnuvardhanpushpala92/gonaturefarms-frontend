import { useEffect, useState, Fragment } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

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
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  <td colSpan={6} style={{ background: '#f9fafb' }}>
                    <p><strong>Address:</strong> {o.address}, {o.area}, {o.city}, {o.state} - {o.pincode}</p>
                    <p><strong>Items:</strong> {o.itemsList}</p>
                    <div className="fg" style={{ maxWidth: 320 }}>
                      <label>Tracking Location</label>
                      <input
                        defaultValue={o.trackingLocation || ''}
                        onBlur={(e) => updateOrder(o.orderId, { trackingLocation: e.target.value })}
                      />
                    </div>
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
