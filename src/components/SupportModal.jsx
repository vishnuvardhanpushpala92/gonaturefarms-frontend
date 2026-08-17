import React from 'react';
import { useState } from 'react';
import Modal from './Modal.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function SupportModal({ open, onClose }) {
  const { settings } = useSite();
  const { user } = useAuth();
  const showToast = useToast();
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  let schema = [];
  try {
    schema = settings.support_fields ? JSON.parse(settings.support_fields) : [];
  } catch {
    schema = [];
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/support', { fields, userId: user?.id });
      showToast(data.message);
      if (data.success) {
        setFields({});
        onClose();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not submit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Contact Support" subtitle="We'll get back to you soon">
      <form onSubmit={submit}>
        {schema.map((f) => (
          <div className="fg" key={f.key}>
            <label>{f.label}{f.required && ' *'}</label>
            {f.type === 'textarea' ? (
              <textarea required={f.required} value={fields[f.key] || ''}
                        onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
            ) : f.type === 'select' ? (
              <select required={f.required} value={fields[f.key] || ''}
                      onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}>
                <option value="">Select...</option>
                {(f.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} required={f.required} value={fields[f.key] || ''}
                     onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending...' : 'Send Message'}</button>
      </form>
    </Modal>
  );
}
