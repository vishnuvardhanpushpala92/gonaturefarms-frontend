import React from 'react';
import { useState } from 'react';
import api from '../../api/client';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const FIELDS = [
  ['site_name', 'Site Name'], ['tagline', 'Tagline'], ['footer_text', 'Footer Text'],
  ['upi_id', 'UPI ID'], ['store_location', 'Store Location'], ['qr_code', 'QR Code Image URL'],
  ['hdr_bg', 'Header Background'], ['hdr_text', 'Header Text Color'],
  ['hdr_font_size', 'Header Font Size (px)'], ['ftr_bg', 'Footer Background'], ['ftr_text', 'Footer Text Color'],
  ['ftr_font_size', 'Footer Font Size (px)'],
  ['banner_msgs', 'Banner Messages (| separated)'], ['free_delivery_above', 'Free Delivery Above (₹)'],
  ['delivery_charge_below', 'Delivery Charge Below Threshold (₹)'], ['whatsapp_number', 'WhatsApp Number'],
  ['screenshot_number', 'Payment Screenshot Number'], ['footer_desc', 'Footer Description'],
  ['footer_phone', 'Footer Phone'], ['payment_instructions', 'Payment Instructions'],
  ['footer_bg_image', 'Footer Background Image URL']
];

export default function AdminSettingsTab() {
  const { settings, reload } = useSite();
  const showToast = useToast();
  const [form, setForm] = useState(settings);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [uploading, setUploading] = useState(false);

  const saveSettings = async (e) => {
    e.preventDefault();
    const { data } = await api.put('/admin/settings', form, { skipTransform: true });
    showToast(data.message);
    reload();
  };

  const updateCreds = async (e) => {
    e.preventDefault();
    const { data } = await api.put('/admin/credentials', creds);
    showToast(data.message);
    if (data.success) setCreds({ username: '', password: '' });
  };

  const uploadImage = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      
      let url;
      if (field === 'footer_bg_image') {
        const { data } = await api.post('/admin/settings/footer-bg-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        url = data.url;
      } else {
        const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        url = data.url;
      }
      
      if (url) {
        setForm((f) => ({ ...f, [field]: url }));
        showToast('Image uploaded');
      } else {
        showToast('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Site Settings</h3>
        <form onSubmit={saveSettings}>
          {FIELDS.map(([key, label]) => (
            <div className="fg" key={key}>
              <label>{label}</label>
              {key === 'payment_instructions' || key === 'footer_desc' ? (
                <textarea value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              ) : key === 'hdr_bg' || key === 'hdr_text' || key === 'ftr_bg' || key === 'ftr_text' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 60, height: 40 }}>
                    <input
                      type="color"
                      value={form[key] || '#000000'}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', height: '100%', padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: '#fff' }}
                    />
                  </div>
                  <input
                    value={form[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder="#000000"
                    style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', background: '#fff' }}
                  />
                </div>
              ) : key === 'hdr_font_size' || key === 'ftr_font_size' ? (
                <input
                  type="number"
                  value={form[key] || '16'}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  min="12"
                  max="32"
                  placeholder="16"
                />
              ) : (
                <input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              )}
              {(key === 'qr_code' || key === 'footer_bg_image') && (
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => uploadImage(e, key)} style={{ marginTop: 6 }} />
              )}
            </div>
          ))}
          <button className="btn btn-primary">Save Settings</button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Update Admin Credentials</h3>
        <form onSubmit={updateCreds}>
          <div className="fg"><label>New Username</label>
            <input required value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} /></div>
          <div className="fg"><label>New Password (min 6 chars)</label>
            <input required type="password" minLength={6} value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} /></div>
          <button className="btn btn-primary">Update Credentials</button>
        </form>
      </div>
    </div>
  );
}
