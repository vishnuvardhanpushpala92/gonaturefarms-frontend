import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

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
        const stepIdx = STATUS_STEPS.indexOf(o.status);
        return (
          <div key={o.orderId} className="bill" style={{ marginBottom: 14 }}>
            <div className="bill-hdr">
              <h3>{o.orderId}</h3>
              <p>{new Date(o.createdAt).toLocaleDateString()} · {o.status}</p>
            </div>
            <div className="bill-body">
              <div className="bill-info">{o.itemsSummary}</div>
              {o.status !== 'Cancelled' && (
                <div className="steps" style={{ margin: '14px 0' }}>
                  {STATUS_STEPS.map((s, i) => (
                    <div className="step" key={s}>
                      <div className={`step-num${i <= stepIdx ? ' done' : ''}${i === stepIdx ? ' active' : ''}`}>{i + 1}</div>
                      <div className={`step-lbl${i === stepIdx ? ' active' : ''}`}>{s}</div>
                    </div>
                  ))}
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
