import React from 'react';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminFooterTab() {
  const { settings, reload } = useSite();
  const showToast = useToast();
  const [form, setForm] = useState(settings);
  const [links, setLinks] = useState([
    { id: 1, text: 'Contact Support', action: 'support' },
    { id: 2, text: 'Back to Top', action: 'scroll' }
  ]);
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({ text: '', action: 'support' });

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', form);
      await reload();
      showToast('Footer settings saved successfully');
    } catch (err) {
      showToast('Failed to save footer settings');
    }
  };

  const addLink = () => {
    if (!newLink.text.trim()) return;
    const link = {
      id: Date.now(),
      text: newLink.text,
      action: newLink.action
    };
    setLinks([...links, link]);
    setNewLink({ text: '', action: 'support' });
  };

  const editLink = (link) => {
    setEditingLink(link.id);
    setNewLink({ text: link.text, action: link.action });
  };

  const updateLink = () => {
    setLinks(links.map(l => l.id === editingLink ? { ...l, text: newLink.text, action: newLink.action } : l));
    setEditingLink(null);
    setNewLink({ text: '', action: 'support' });
  };

  const deleteLink = (id) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const cancelEdit = () => {
    setEditingLink(null);
    setNewLink({ text: '', action: 'support' });
  };

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Footer Content</h3>
        <form onSubmit={saveSettings}>
          <div className="fg">
            <label>Footer Description</label>
            <textarea
              value={form.footer_desc || ''}
              onChange={(e) => setForm({ ...form, footer_desc: e.target.value })}
              placeholder="Bringing the purest organic produce directly from our farms to your table."
            />
          </div>
          <div className="fg">
            <label>Footer Phone</label>
            <input
              type="text"
              value={form.footer_phone || ''}
              onChange={(e) => setForm({ ...form, footer_phone: e.target.value })}
              placeholder="+91 9182526xxx"
            />
          </div>
          <div className="fg">
            <label>Store Location</label>
            <input
              type="text"
              value={form.store_location || ''}
              onChange={(e) => setForm({ ...form, store_location: e.target.value })}
              placeholder="Hyderabad, Telangana"
            />
          </div>
          <div className="fg">
            <label>Copyright Text</label>
            <input
              type="text"
              value={form.footer_text || ''}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              placeholder={`© ${new Date().getFullYear()} Go Nature Farms. All rights reserved.`}
            />
          </div>
          <button className="btn btn-primary">Save Footer Content</button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Footer Links</h3>
        <div className="fg">
          <label>Add New Link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.text}
              onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
              placeholder="Link text"
              style={{ flex: 1 }}
            />
            <select
              value={newLink.action}
              onChange={(e) => setNewLink({ ...newLink, action: e.target.value })}
              style={{ width: 120 }}
            >
              <option value="support">Contact Support</option>
              <option value="scroll">Back to Top</option>
              <option value="external">External URL</option>
            </select>
          </div>
          {editingLink ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={updateLink}>Update</button>
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={addLink}>Add Link</button>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link Text</th>
                <th>Action</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link.id}>
                  <td>{link.text}</td>
                  <td>{link.action}</td>
                  <td>
                    <button className="btn-e" onClick={() => editLink(link)}>Edit</button>
                    <button className="btn-d" onClick={() => deleteLink(link.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
