import React, { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminDataDeletionTab() {
  const showToast = useToast();
  const [categories, setCategories] = useState({});
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState({});
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'credentials'
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/admin/data/categories')
      .then(({ data }) => {
        if (data?.data) {
          setCategories(data.data.categories || {});
          setCounts(data.data.counts || {});
        }
      })
      .catch(() => showToast('Failed to load data categories'));
  }, []);

  const toggle = (key) => setSelected({ ...selected, [key]: !selected[key] });

  const selectedKeys = Object.keys(selected).filter((k) => selected[k]);
  const totalRecords = selectedKeys.reduce((sum, k) => sum + (counts[k] || 0), 0);

  const proceed = () => {
    if (selectedKeys.length === 0) {
      showToast('Select at least one data category');
      return;
    }
    setStep('credentials');
  };

  const deleteData = async () => {
    setDeleting(true);
    try {
      const { data } = await api.post('/admin/data/delete', {
        password,
        categories: selectedKeys
      });
      if (data?.success !== false) {
        showToast(data?.message || 'Data deleted successfully');
        setStep('select');
        setSelected({});
        setPassword('');
        // Refresh counts
        const { data: refreshed } = await api.get('/admin/data/categories');
        if (refreshed?.data) setCounts(refreshed.data.counts || {});
      } else {
        showToast(data?.message || 'Deletion failed');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.userMessage || 'Deletion failed');
      setPassword('');
    } finally {
      setDeleting(false);
    }
  };

  if (step === 'credentials') {
    return (
      <div className="admin-card" style={{ maxWidth: 480 }}>
        <h3>Confirm Permanent Deletion</h3>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#dc2626' }}>⚠️ This action is IRREVERSIBLE</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            You are about to permanently delete <strong>{totalRecords}</strong> records from:{' '}
            {selectedKeys.map((k) => categories[k]).join(', ')}.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Users, orders, products, settings and admin accounts are never deleted by this tool.
          </p>
        </div>
        <div className="fg">
          <label>Admin Password (verified on server)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your admin password" autoComplete="current-password" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-danger" disabled={deleting || !password} onClick={deleteData}>
            {deleting ? 'Deleting…' : 'Permanently Delete'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setStep('select'); setPassword(''); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>Data Management</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Select business data categories to permanently delete. Admin password verification is required.
        Users, orders, products, settings and admin accounts cannot be deleted here.
      </p>
      <div className="admin-card">
        {Object.entries(categories).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!selected[key]} onChange={() => toggle(key)} />
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{counts[key] ?? '…'} records</span>
          </label>
        ))}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-danger" disabled={selectedKeys.length === 0} onClick={proceed}>
            Delete Selected ({totalRecords} records)
          </button>
          {selectedKeys.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {selectedKeys.map((k) => categories[k]).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
