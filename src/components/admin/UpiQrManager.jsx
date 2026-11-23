import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';
import { ensureHttps } from '../../context/SiteContext.jsx';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE_MB = 5;

/** Admin panel card: Payment Settings → UPI QR Code (Cloudinary-backed). */
export default function UpiQrManager() {
  const showToast = useToast();
  const [qr, setQr] = useState(null); // {image_url, public_id, active, uploaded_at}
  const [preview, setPreview] = useState(null); // local object URL for selected file
  const [selectedFile, setSelectedFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/payment-settings/upi-qr');
      if (data.success) setQr(data.qr || null);
    } catch (err) {
      console.error('Failed to load UPI QR settings', err);
    }
  };

  useEffect(() => { load(); }, []);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      showToast('Only PNG, JPG, JPEG or WEBP images are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`File too large. Maximum size is ${MAX_SIZE_MB} MB`);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const upload = async () => {
    if (!selectedFile) {
      showToast('Please choose a QR image first');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const { data } = await api.post('/admin/payment-settings/upi-qr', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipTransform: true
      });
      if (data.success) {
        showToast(data.message || 'UPI QR code saved and published');
        setSelectedFile(null);
        setPreview((old) => { if (old) URL.revokeObjectURL(old); return null; });
        if (fileRef.current) fileRef.current.value = '';
        await load();
      } else {
        showToast(data.message || 'Upload failed');
      }
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove the current UPI QR code? Checkout will fall back to the auto-generated QR.')) return;
    setBusy(true);
    try {
      const { data } = await api.delete('/admin/payment-settings/upi-qr');
      showToast(data.message || 'UPI QR code removed');
      setSelectedFile(null);
      setPreview((old) => { if (old) URL.revokeObjectURL(old); return null; });
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      showToast(err?.userMessage || err?.response?.data?.message || 'Failed to remove QR code');
    } finally {
      setBusy(false);
    }
  };

  const activeUrl = qr?.active && qr?.image_url ? ensureHttps(qr.image_url) : null;

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginBottom: 4 }}>Payment Settings → UPI QR Code</h3>
      <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 12 }}>
        Upload your merchant UPI QR (PNG, JPG, JPEG or WEBP, max 5 MB). It is stored in Cloudinary
        and shown to customers on the checkout payment screen. Replace it anytime — the previous image is removed automatically.
      </p>

      {activeUrl ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: 6, color: '#166534' }}>
            Currently active QR{qr.uploaded_at ? ` · uploaded ${new Date(qr.uploaded_at).toLocaleString()}` : ''}
          </div>
          <img
            src={activeUrl}
            alt="Active UPI QR"
            style={{ width: 160, height: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}
          />
        </div>
      ) : (
        <div style={{ fontSize: '.85rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          No UPI QR uploaded. Checkout currently shows an auto-generated amount-specific QR.
        </div>
      )}

      <div className="fg">
        <label>Upload / Replace QR Image</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          disabled={busy}
          onChange={pickFile}
        />
      </div>

      {preview && (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: 6 }}>Preview before saving:</div>
          <img
            src={preview}
            alt="QR preview"
            style={{ width: 160, height: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}
          />
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>{selectedFile?.name}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <button className="btn btn-primary" onClick={upload} disabled={busy || !selectedFile}>
          {busy ? 'Uploading…' : activeUrl ? 'Replace & Publish QR' : 'Save & Publish QR'}
        </button>
        {activeUrl && (
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            Remove QR
          </button>
        )}
      </div>
    </div>
  );
}
