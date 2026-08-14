import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const STATUSES = ['open', 'in_progress', 'resolved'];

export default function AdminSupportTab() {
  const showToast = useToast();
  const [tickets, setTickets] = useState([]);

  const load = () => api.get('/support/admin/all').then(({ data }) => setTickets(data.tickets || []));
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await api.put(`/support/${id}`, { status });
    showToast(data.message);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    const { data } = await api.delete(`/support/${id}`);
    showToast(data.message);
    load();
  };

  return (
    <div>
      {tickets.map((t) => (
        <div className="admin-card" key={t.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-d" onClick={() => remove(t.id)}>Delete</button>
          </div>
          <div style={{ marginTop: 10, fontSize: '.82rem' }}>
            {Object.entries(t.data || {}).map(([k, v]) => (
              <p key={k}><strong>{k}:</strong> {String(v)}</p>
            ))}
          </div>
          <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 6 }}>
            {new Date(t.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
      {tickets.length === 0 && <p>No support tickets.</p>}
    </div>
  );
}
