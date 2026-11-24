import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const EXPORT_CATEGORIES = {
  customers: 'Customer Records', orders: 'Orders', order_items: 'Order Items',
  payments: 'Payments', complaints: 'Customer Complaints', reviews: 'Customer Reviews',
  products: 'Products', testimonials: 'Testimonials', videos: 'Videos', faqs: 'FAQs'
};

export default function AdminDataDeletionTab() {
  const showToast = useToast();
  const [categories, setCategories] = useState({});
  const [counts, setCounts] = useState({});
  const [audit, setAudit] = useState([]);
  const [selected, setSelected] = useState({});
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'credentials'
  const [deleting, setDeleting] = useState(false);
  // Export state
  const [expSelected, setExpSelected] = useState({});
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadMeta = () => {
    api.get('/admin/data/categories').then(({ data }) => {
      if (data?.data) { setCategories(data.data.categories || {}); setCounts(data.data.counts || {}); }
    }).catch(() => {});
    api.get('/admin/data/audit').then(({ data }) => setAudit(data?.audit || [])).catch(() => {});
  };
  useEffect(loadMeta, []);

  const toggle = (obj, key, setter) => setter({ ...obj, [key]: !obj[key] });
  const selKeys = (o) => Object.keys(o).filter((k) => o[k]);

  const download = async (url, fallbackName, isBlob) => {
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fallbackName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runExport = async () => {
    const cats = selKeys(expSelected);
    if (!cats.length) { showToast('Select at least one dataset'); return; }
    setExporting(true);
    try {
      const params = new URLSearchParams();
      cats.forEach((c) => params.append('categories', c));
      if (expFrom) params.set('from', expFrom);
      if (expTo) params.set('to', expTo);
      await download(`/admin/data/export?${params}`, 'gonaturefarms-export.xlsx');
      showToast('Excel export downloaded');
      loadMeta();
    } catch (e) {
      showToast('Export failed');
    } finally { setExporting(false); }
  };

  const runBackup = async () => {
    setExporting(true);
    try {
      await download('/admin/data/backup', 'gonaturefarms-backup.json');
      showToast('Backup downloaded — keep it safe, it contains business data');
      loadMeta();
    } catch (e) {
      showToast('Backup failed');
    } finally { setExporting(false); }
  };

  const selectedKeys = selKeys(selected);
  const totalRecords = selectedKeys.reduce((s, k) => s + (counts[k] || 0), 0);

  const deleteData = async () => {
    setDeleting(true);
    try {
      const { data } = await api.post('/admin/data/delete', {
        password, confirmation, categories: selectedKeys
      });
      if (data?.success !== false) {
        showToast(data?.message || 'Data deleted successfully');
        setStep('select'); setSelected({}); setPassword(''); setConfirmation('');
        loadMeta();
      } else {
        showToast(data?.message || 'Deletion failed');
        setPassword(''); setConfirmation('');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.userMessage || 'Deletion failed');
      setPassword(''); setConfirmation('');
    } finally { setDeleting(false); }
  };

  const catList = (obj, dict, setter, showCounts) => (
    <div className="admin-card">
      {Object.entries(dict).map(([key, label]) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!obj[key]} onChange={() => toggle(obj, key, setter)} />
          <span style={{ flex: 1 }}>{label}</span>
          {showCounts && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{counts[key] ?? '…'} records</span>}
        </label>
      ))}
    </div>
  );

  return (
    <div>
      <h3>Dashboard Data Management</h3>

      {/* ── Export ── */}
      <div className="admin-card">
        <h4 style={{ marginBottom: 4 }}>Export Dashboard Data to Excel</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
          Downloads a real .xlsx file with one worksheet per selected dataset, plus a summary sheet.
          Recommended before any deletion — but Excel is not a full database backup; use Backup below for that.
        </p>
        {catList(expSelected, EXPORT_CATEGORIES, setExpSelected, false)}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem' }}>From <input type="date" value={expFrom} onChange={(e) => setExpFrom(e.target.value)} /></label>
          <label style={{ fontSize: '0.85rem' }}>To <input type="date" value={expTo} onChange={(e) => setExpTo(e.target.value)} /></label>
          <button className="btn btn-primary" disabled={exporting || selKeys(expSelected).length === 0} onClick={runExport}>
            {exporting ? 'Working…' : 'Export to Excel'}
          </button>
          <button className="btn btn-secondary" disabled={exporting} onClick={runBackup}>Download JSON Backup</button>
        </div>
      </div>

      {/* ── Permanent wipe ── */}
      <div className="admin-card" style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 4, color: '#dc2626' }}>Permanent Business Data Management</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
          ⚠️ Deletion is permanent and cannot be undone. Admin accounts, passwords, site settings,
          support settings, homepage layout, product categories and audit logs are never deleted.
        </p>
        {step === 'select' ? (
          <>
            {catList(selected, categories, setSelected, true)}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-danger" disabled={selectedKeys.length === 0}
                onClick={() => { if (selKeys(selected).length === Object.keys(categories).length) { if (window.confirm('You selected ALL business data — this is a complete reset. Continue?')) setStep('credentials'); } else setStep('credentials'); }}>
                Delete Selected ({totalRecords} records)
              </button>
              <button className="btn btn-secondary" onClick={() => {
                const all = {}; Object.keys(categories).forEach((k) => all[k] = true); setSelected(all);
              }}>Select All (Full Reset)</button>
              {selectedKeys.length > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {selectedKeys.map((k) => categories[k]).join(', ')}
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#dc2626' }}>⚠️ IRREVERSIBLE — {totalRecords} records</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{selectedKeys.map((k) => categories[k]).join(', ')}</p>
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Consider exporting or downloading a backup first.
              </p>
            </div>
            <div className="fg"><label>Admin Password (verified on server)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
            <div className="fg"><label>Type <strong>DELETE PERMANENTLY</strong> to confirm</label>
              <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="DELETE PERMANENTLY" /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" disabled={deleting || !password || confirmation.trim().toUpperCase() !== 'DELETE PERMANENTLY'} onClick={deleteData}>
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setStep('select'); setPassword(''); setConfirmation(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Audit history ── */}
      {audit.length > 0 && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Operation History</h4>
          <table className="data-table">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {audit.slice(0, 20).map((a) => (
                <tr key={a.id}>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                  <td>{a.admin_name || a.admin_id || '—'}</td>
                  <td>{a.action}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
