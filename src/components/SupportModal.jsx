import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { uploadApi } from '../api/client';

const CATEGORIES = ['Order Issue', 'Payment Issue', 'Product Quality', 'Delivery', 'Return/Refund', 'Website Issue', 'Other'];

export default function SupportModal({ open, onClose }) {
  const { settings } = useSite();
  const { user } = useAuth();
  const showToast = useToast();
  const [support, setSupport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('form'); // 'form' | 'track' | 'done'
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [track, setTrack] = useState({ ref: '', mobile: '' });
  const [trackResult, setTrackResult] = useState(null);
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '', order_id: '', category: '', subject: '', description: ''
  });

  useEffect(() => {
    if (!open) return;
    setView('form'); setTrackResult(null); setTicketNumber(''); setImages([]);
    api.get('/support-settings/public')
      .then(({ data }) => { if (data?.success) setSupport(data.settings || {}); })
      .catch(() => setSupport({}));
  }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append('file', f);
        const { data } = await uploadApi.post('/support/upload', fd);
        if (data?.url) urls.push(data.url);
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      showToast('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fields = { ...form, images };
      const { data } = await api.post('/support', { fields, userId: user?.id });
      if (data?.success !== false) {
        setTicketNumber(data?.ticket_number || '');
        setView('done');
      } else {
        showToast(data?.message || 'Could not submit');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.userMessage || 'Could not submit');
    } finally {
      setBusy(false);
    }
  };

  const doTrack = async (e) => {
    e.preventDefault();
    setBusy(true); setTrackResult(null);
    try {
      const { data } = await api.get('/support/track', { params: { ref: track.ref, mobile: track.mobile } });
      if (data?.complaint) setTrackResult(data.complaint);
      else showToast('Complaint not found');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.userMessage || 'Could not find complaint');
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = (s) => ({ open: 'New', pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' }[s] || s);

  return (
    <Modal open={open} onClose={onClose} title="Contact Support" subtitle="We'll get back to you soon">
      {/* Saved support contact methods */}
      {support && (support.supportPhone || support.whatsappNumber || support.supportEmail || support.businessHours || support.responseInfo || support.storeAddress) && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {support.supportPhone && (
            <a href={`tel:${support.supportPhone}`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              📞 Call {support.supportPhone}
            </a>
          )}
          {support.whatsappNumber && (
            <a href={`https://wa.me/${`${support.whatsappCountryCode || '91'}${support.whatsappNumber}`.replace(/\D/g, '')}`}
               target="_blank" rel="noreferrer" className="btn btn-secondary"
               style={{ textAlign: 'center', textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none' }}>
              💬 WhatsApp {support.whatsappNumber}
            </a>
          )}
          {support.supportEmail && (
            <a href={`mailto:${support.supportEmail}`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              ✉️ {support.supportEmail}
            </a>
          )}
          {support.businessHours && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>🕐 {support.businessHours}</p>}
          {support.workingDays && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>📅 {support.workingDays}</p>}
          {support.storeAddress && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>📍 {support.storeAddress}</p>}
          {support.responseInfo && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>{support.responseInfo}</p>}
        </div>
      )}

      {view === 'done' ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <p style={{ fontWeight: 600 }}>Complaint submitted successfully!</p>
          {ticketNumber && <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Reference: <strong>{ticketNumber}</strong></p>}
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Save this reference number to track your complaint.</p>
          <button className="btn btn-primary btn-block" onClick={() => { setView('form'); setForm({ full_name: '', mobile: '', email: '', order_id: '', category: '', subject: '', description: '' }); setImages([]); }}>
            Submit Another
          </button>
        </div>
      ) : view === 'track' ? (
        <div>
          <form onSubmit={doTrack}>
            <div className="fg"><label>Complaint Reference Number</label>
              <input value={track.ref} onChange={(e) => setTrack({ ...track, ref: e.target.value })} required placeholder="CMP-XXXXXXXX" /></div>
            <div className="fg"><label>Registered Mobile Number</label>
              <input value={track.mobile} onChange={(e) => setTrack({ ...track, mobile: e.target.value })} required placeholder="10-digit mobile" /></div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Checking...' : 'Check Status'}</button>
          </form>
          {trackResult && (
            <div style={{ marginTop: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{trackResult.ticket_number} — {statusLabel(trackResult.status)}</p>
              {trackResult.customer_response && <p style={{ fontSize: '0.85rem', margin: 0 }}>Response: {trackResult.customer_response}</p>}
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '6px 0 0' }}>Submitted {trackResult.created_at ? new Date(trackResult.created_at).toLocaleString() : ''}</p>
            </div>
          )}
          <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => setView('form')}>← Back to form</button>
        </div>
      ) : (
        <>
          <form onSubmit={submit}>
            <div className="frow">
              <div className="fg"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} required /></div>
              <div className="fg"><label>Mobile Number *</label><input value={form.mobile} onChange={set('mobile')} required placeholder="10-digit mobile" /></div>
            </div>
            <div className="fg"><label>Email Address (optional)</label><input type="email" value={form.email} onChange={set('email')} /></div>
            <div className="frow">
              <div className="fg"><label>Order ID (optional)</label><input value={form.order_id} onChange={set('order_id')} placeholder="e.g. ORD-123" /></div>
              <div className="fg"><label>Complaint Category</label>
                <select value={form.category} onChange={set('category')}>
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="fg"><label>Subject *</label><input value={form.subject} onChange={set('subject')} required /></div>
            <div className="fg"><label>Complaint Description *</label>
              <textarea rows={4} value={form.description} onChange={set('description')} required /></div>
            <div className="fg"><label>Supporting Images (optional, max 5)</label>
              <input type="file" accept="image/*" multiple onChange={onPickImages} disabled={uploading || images.length >= 5} />
              {uploading && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Uploading…</p>}
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {images.map((u, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={u} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                      <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', fontSize: 11, cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-block" disabled={busy || uploading}>{busy ? 'Submitting...' : 'Submit Complaint'}</button>
          </form>
          <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => setView('track')}>Track Existing Complaint</button>
        </>
      )}
    </Modal>
  );
}
