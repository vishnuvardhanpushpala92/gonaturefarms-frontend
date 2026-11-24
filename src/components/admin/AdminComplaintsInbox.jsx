import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_LABEL = { open: 'New', pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' };
const STATUSES = ['open', 'pending', 'in_progress', 'resolved', 'rejected'];

export default function AdminComplaintsInbox() {
  const showToast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState({ status: '', adminNote: '', customerResponse: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/support/admin/all');
      setTickets(data?.tickets || []);
    } catch (e) {
      showToast(e?.userMessage || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 };
    tickets.forEach((t) => { if (c[t.status] !== undefined) c[t.status]++; });
    return c;
  }, [tickets]);

  const filtered = useMemo(() => tickets.filter((t) => {
    const d = t.data || {};
    if (statusFilter && t.status !== statusFilter) return false;
    if (dateFilter) {
      const day = new Date(t.created_at).toISOString().slice(0, 10);
      if (day !== dateFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hay = [t.ticket_number, t.customer_name, t.customer_mobile, d.full_name, d.name, d.mobile, d.subject, d.description, t.category, t.order_id]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [tickets, search, statusFilter, dateFilter]);

  const openDetail = (t) => {
    setSelected(t);
    setEdit({ status: t.status, adminNote: t.admin_note || '', customerResponse: t.customer_response || '' });
  };

  const saveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/support/admin/tickets/${selected.id}`, {
        status: edit.status,
        adminNote: edit.adminNote,
        customerResponse: edit.customerResponse
      });
      showToast('Complaint updated');
      setSelected(null);
      load();
    } catch (e) {
      showToast(e?.userMessage || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const d = selected?.data || {};

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['Total', counts.total], ['New', counts.open], ['Pending', counts.pending], ['In Progress', counts.in_progress], ['Resolved', counts.resolved]].map(([label, n]) => (
          <div key={label} className="admin-card" style={{ flex: '1 1 110px', padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input placeholder="Search name, mobile, subject, ref…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '2 1 200px' }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          {(search || statusFilter || dateFilter) && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); }}>Clear</button>
          )}
        </div>

        {loading ? <p>Loading…</p> : (
          <table className="data-table">
            <thead>
              <tr><th>Ref No.</th><th>Customer</th><th>Mobile</th><th>Order ID</th><th>Category</th><th>Submitted</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>No complaints found</td></tr>}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.ticket_number || `#${t.id}`}</td>
                  <td>{t.customer_name || d.full_name || d.name || '—'}</td>
                  <td>{t.customer_mobile || d.mobile || '—'}</td>
                  <td>{t.order_id || d.order_id || '—'}</td>
                  <td>{t.category || d.category || '—'}</td>
                  <td>{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                  <td><span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status] || t.status}</span></td>
                  <td><button className="btn-e" onClick={() => openDetail(t)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
             onClick={() => setSelected(null)}>
          <div className="admin-card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Complaint {selected.ticket_number || `#${selected.id}`}</h3>
            <table className="data-table" style={{ marginBottom: 12 }}>
              <tbody>
                <tr><td><b>Name</b></td><td>{selected.customer_name || d.full_name || d.name || '—'}</td></tr>
                <tr><td><b>Mobile</b></td><td>{selected.customer_mobile || d.mobile || '—'}</td></tr>
                <tr><td><b>Email</b></td><td>{selected.customer_email || d.email || '—'}</td></tr>
                <tr><td><b>Order ID</b></td><td>{selected.order_id || d.order_id || '—'}</td></tr>
                <tr><td><b>Category</b></td><td>{selected.category || d.category || '—'}</td></tr>
                <tr><td><b>Subject</b></td><td>{d.subject || '—'}</td></tr>
                <tr><td><b>Description</b></td><td style={{ whiteSpace: 'pre-wrap' }}>{d.description || d.message || '—'}</td></tr>
                <tr><td><b>Submitted</b></td><td>{selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</td></tr>
                {Array.isArray(d.images) && d.images.length > 0 && (
                  <tr><td><b>Images</b></td>
                    <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {d.images.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} /></a>)}
                    </div></td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="fg"><label>Status</label>
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="fg"><label>Response for Customer</label>
              <textarea rows={3} value={edit.customerResponse} onChange={(e) => setEdit({ ...edit, customerResponse: e.target.value })} placeholder="Shown to customer via Track Complaint" /></div>
            <div className="fg"><label>Internal Note (admin only)</label>
              <textarea rows={2} value={edit.adminNote} onChange={(e) => setEdit({ ...edit, adminNote: e.target.value })} /></div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveDetail}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
