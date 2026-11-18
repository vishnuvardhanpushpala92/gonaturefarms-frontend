import React from 'react';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminFooterTab() {
  const { settings, reload } = useSite();
  const showToast = useToast();
  const [form, setForm] = useState(settings);
  const [footerLinks, setFooterLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
  const [saving, setSaving] = useState(false);
  const [supportSettings, setSupportSettings] = useState({});
  const [socialMediaLinks, setSocialMediaLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState({ status: '', category: '', search: '' });
  const [previewMode, setPreviewMode] = useState('desktop');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
    loadFooterLinks();
    loadSupportSettings();
    loadSocialMediaLinks();
    loadFaqCategories();
    loadTickets();
  }, [settings]);

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/admin/support/tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  const loadFaqCategories = async () => {
    try {
      const { data } = await api.get('/admin/faqs/categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load FAQ categories:', err);
    }
  };

  const loadSupportSettings = async () => {
    try {
      const { data } = await api.get('/admin/support-settings');
      setSupportSettings(data.settings || {});
    } catch (err) {
      console.error('Failed to load support settings:', err);
    }
  };

  const loadSocialMediaLinks = async () => {
    try {
      const { data } = await api.get('/admin/social-media');
      setSocialMediaLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load social media links:', err);
    }
  };

  const loadFooterLinks = async () => {
    setLoadingLinks(true);
    try {
      const { data } = await api.get('/footer-links');
      setFooterLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load footer links:', err);
      showToast('Failed to load footer links');
    } finally {
      setLoadingLinks(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form, { skipTransform: true });
      await reload();
      showToast('Footer settings saved successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save footer settings');
    } finally {
      setSaving(false);
    }
  };

  const addLink = async () => {
    if (!newLink.name.trim() || !newLink.url.trim()) {
      showToast('Please enter both link name and URL');
      return;
    }
    try {
      await api.post('/footer-links', newLink);
      showToast('Footer link added successfully');
      setNewLink({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
      loadFooterLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add footer link');
    }
  };

  const editLink = (link) => {
    setEditingLink(link.id);
    setNewLink({ name: link.name, url: link.url, category: link.category, sortOrder: link.sortOrder, enabled: link.enabled, openInNewTab: link.openInNewTab, columnHeading: link.columnHeading });
  };

  const updateLink = async () => {
    if (!newLink.name.trim() || !newLink.url.trim()) {
      showToast('Please enter both link name and URL');
      return;
    }
    try {
      await api.put(`/footer-links/${editingLink}`, newLink);
      showToast('Footer link updated successfully');
      setEditingLink(null);
      setNewLink({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
      loadFooterLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update footer link');
    }
  };

  const deleteLink = async (id) => {
    if (!window.confirm('Delete this footer link?')) return;
    try {
      await api.delete(`/footer-links/${id}`);
      showToast('Footer link deleted successfully');
      loadFooterLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete footer link');
    }
  };

  const cancelEdit = () => {
    setEditingLink(null);
    setNewLink({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
  };

  const saveSupportSettings = async () => {
    try {
      await api.put('/admin/support-settings', supportSettings);
      showToast('Support settings saved successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save support settings');
    }
  };

  const addSocialMediaLink = async () => {
    if (!newLink.name.trim() || !newLink.url.trim()) {
      showToast('Please enter platform and URL');
      return;
    }
    try {
      await api.post('/admin/social-media', { platform: newLink.name, url: newLink.url, enabled: true, sortOrder: 0 });
      showToast('Social media link added');
      setNewLink({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
      loadSocialMediaLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add link');
    }
  };

  const deleteSocialMediaLink = async (id) => {
    if (!window.confirm('Delete this social media link?')) return;
    try {
      await api.delete(`/admin/social-media/${id}`);
      showToast('Social media link deleted');
      loadSocialMediaLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete link');
    }
  };

  const addFaqCategory = async () => {
    if (!newLink.name.trim()) {
      showToast('Please enter category name');
      return;
    }
    try {
      await api.post('/admin/faqs/categories', { name: newLink.name, description: '', sortOrder: 0, enabled: true });
      showToast('FAQ category added');
      setNewLink({ name: '', url: '', category: 'QUICK_LINKS', sortOrder: 0, enabled: true, openInNewTab: false, columnHeading: '' });
      loadFaqCategories();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add category');
    }
  };

  const deleteFaqCategory = async (id) => {
    if (!window.confirm('Delete this FAQ category?')) return;
    try {
      await api.delete(`/admin/faqs/categories/${id}`);
      showToast('FAQ category deleted');
      loadFaqCategories();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete category');
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await api.put(`/admin/support/tickets/${id}`, { status });
      showToast('Ticket status updated');
      loadTickets();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update ticket');
    }
  };

  const saveDraft = () => {
    localStorage.setItem('footerDraft', JSON.stringify(form));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const publishChanges = async () => {
    try {
      await api.put('/admin/settings', form, { skipTransform: true });
      showToast('Footer published successfully');
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to publish footer');
    }
  };

  const resetChanges = () => {
    setForm(settings);
    localStorage.removeItem('footerDraft');
    showToast('Footer reset to last published version');
  };

  const reorderLink = async (id, newSortOrder) => {
    try {
      await api.put(`/footer-links/${id}/reorder`, newSortOrder);
      loadFooterLinks();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reorder link');
    }
  };

  const quickLinks = footerLinks.filter(l => l.category === 'QUICK_LINKS');
  const customerCareLinks = footerLinks.filter(l => l.category === 'CUSTOMER_CARE');

  return (
    <div>
      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Footer Content & Colors</h3>
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
          <div className="frow">
            <div className="fg">
              <label>Footer Background Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={form.ftr_bg || '#FF8C00'} 
                  onChange={(e) => setForm({ ...form, ftr_bg: e.target.value })}
                  style={{ width: 50, height: 38, cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={form.ftr_bg || '#FF8C00'} 
                  onChange={(e) => setForm({ ...form, ftr_bg: e.target.value })}
                  placeholder="#FF8C00"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="fg">
              <label>Footer Text Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={form.ftr_text || '#FFFFFF'} 
                  onChange={(e) => setForm({ ...form, ftr_text: e.target.value })}
                  style={{ width: 50, height: 38, cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={form.ftr_text || '#FFFFFF'} 
                  onChange={(e) => setForm({ ...form, ftr_text: e.target.value })}
                  placeholder="#FFFFFF"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Footer Settings'}</button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Quick Links</h3>
        <div className="fg">
          <label>Add New Quick Link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              placeholder="Link name (e.g., Home)"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL (e.g., /#top)"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.columnHeading}
              onChange={(e) => setNewLink({ ...newLink, columnHeading: e.target.value })}
              placeholder="Column Heading (optional)"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={newLink.enabled}
                onChange={(e) => setNewLink({ ...newLink, enabled: e.target.checked })}
              />
              Enabled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={newLink.openInNewTab}
                onChange={(e) => setNewLink({ ...newLink, openInNewTab: e.target.checked })}
              />
              Open in New Tab
            </label>
          </div>
          {editingLink ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={updateLink}>Update</button>
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => { setNewLink({ ...newLink, category: 'QUICK_LINKS' }); addLink(); }}>Add Quick Link</button>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link Name</th>
                <th>URL</th>
                <th>Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quickLinks.map((link, index) => (
                <tr key={link.id}>
                  <td>{link.name}</td>
                  <td>{link.url}</td>
                  <td>{link.enabled ? '✓' : '✗'}</td>
                  <td>
                    <button className="btn-e" onClick={() => editLink(link)}>Edit</button>
                    <button className="btn-d" onClick={() => deleteLink(link.id)}>Delete</button>
                    {index > 0 && <button className="btn-e" onClick={() => reorderLink(link.id, index - 1)}>↑</button>}
                    {index < quickLinks.length - 1 && <button className="btn-e" onClick={() => reorderLink(link.id, index + 1)}>↓</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Customer Care Links</h3>
        <div className="fg">
          <label>Add New Customer Care Link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              placeholder="Link name (e.g., FAQ)"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL (e.g., /#about)"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.columnHeading}
              onChange={(e) => setNewLink({ ...newLink, columnHeading: e.target.value })}
              placeholder="Column Heading (optional)"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={newLink.enabled}
                onChange={(e) => setNewLink({ ...newLink, enabled: e.target.checked })}
              />
              Enabled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={newLink.openInNewTab}
                onChange={(e) => setNewLink({ ...newLink, openInNewTab: e.target.checked })}
              />
              Open in New Tab
            </label>
          </div>
          {editingLink ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={updateLink}>Update</button>
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => { setNewLink({ ...newLink, category: 'CUSTOMER_CARE' }); addLink(); }}>Add Customer Care Link</button>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link Name</th>
                <th>URL</th>
                <th>Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customerCareLinks.map((link, index) => (
                <tr key={link.id}>
                  <td>{link.name}</td>
                  <td>{link.url}</td>
                  <td>{link.enabled ? '✓' : '✗'}</td>
                  <td>
                    <button className="btn-e" onClick={() => editLink(link)}>Edit</button>
                    <button className="btn-d" onClick={() => deleteLink(link.id)}>Delete</button>
                    {index > 0 && <button className="btn-e" onClick={() => reorderLink(link.id, index - 1)}>↑</button>}
                    {index < customerCareLinks.length - 1 && <button className="btn-e" onClick={() => reorderLink(link.id, index + 1)}>↓</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Customer Support Settings</h3>
        <div className="fg">
          <label>Support Phone</label>
          <input
            type="text"
            value={supportSettings.supportPhone || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, supportPhone: e.target.value })}
            placeholder="+91 9182526xxx"
          />
        </div>
        <div className="fg">
          <label>WhatsApp Number</label>
          <input
            type="text"
            value={supportSettings.whatsappNumber || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, whatsappNumber: e.target.value })}
            placeholder="919182526xxx"
          />
        </div>
        <div className="fg">
          <label>Support Email</label>
          <input
            type="text"
            value={supportSettings.supportEmail || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, supportEmail: e.target.value })}
            placeholder="support@gonaturefarms.com"
          />
        </div>
        <div className="fg">
          <label>Business Hours</label>
          <input
            type="text"
            value={supportSettings.businessHours || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, businessHours: e.target.value })}
            placeholder="9:00 AM - 6:00 PM"
          />
        </div>
        <div className="fg">
          <label>Working Days</label>
          <input
            type="text"
            value={supportSettings.workingDays || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, workingDays: e.target.value })}
            placeholder="Monday - Saturday"
          />
        </div>
        <div className="fg">
          <label>Store Address</label>
          <textarea
            value={supportSettings.storeAddress || ''}
            onChange={(e) => setSupportSettings({ ...supportSettings, storeAddress: e.target.value })}
            placeholder="Enter store address"
          />
        </div>
        <button className="btn btn-primary" onClick={saveSupportSettings}>Save Support Settings</button>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Social Media Links</h3>
        <div className="fg">
          <label>Add Social Media Link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              placeholder="Platform (e.g., Instagram)"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL"
              style={{ flex: 1 }}
            />
          </div>
          <button className="btn btn-primary" onClick={addSocialMediaLink}>Add Link</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>URL</th>
                <th>Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {socialMediaLinks.map(link => (
                <tr key={link.id}>
                  <td>{link.platform}</td>
                  <td>{link.url}</td>
                  <td>{link.enabled ? '✓' : '✗'}</td>
                  <td>
                    <button className="btn-d" onClick={() => deleteSocialMediaLink(link.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>FAQ Management</h3>
        <div className="fg">
          <label>Add FAQ Category</label>
          <input
            type="text"
            value={newLink.name}
            onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            placeholder="Category name (e.g., Orders & Payments)"
            style={{ marginBottom: 8 }}
          />
          <button className="btn btn-primary" onClick={addFaqCategory}>Add Category</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <h4>Categories</h4>
          {categories && categories.map(cat => (
            <div key={cat.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              {cat.name} - {cat.enabled ? 'Enabled' : 'Disabled'}
              <button className="btn-d" style={{ marginLeft: 10 }} onClick={() => deleteFaqCategory(cat.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Support Tickets</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by ticket number, customer, order ID"
            value={ticketFilter.search}
            onChange={(e) => setTicketFilter({ ...ticketFilter, search: e.target.value })}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={ticketFilter.status}
            onChange={(e) => setTicketFilter({ ...ticketFilter, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={ticketFilter.category}
            onChange={(e) => setTicketFilter({ ...ticketFilter, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="order">Order Issue</option>
            <option value="payment">Payment Issue</option>
            <option value="product">Product Quality</option>
            <option value="shipping">Shipping/Delivery</option>
            <option value="refund">Refund Request</option>
            <option value="other">Other</option>
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.filter(t => {
              if (ticketFilter.status && t.status !== ticketFilter.status) return false;
              if (ticketFilter.category && t.category !== ticketFilter.category) return false;
              if (ticketFilter.search) {
                const search = ticketFilter.search.toLowerCase();
                return (t.ticketNumber || '').toLowerCase().includes(search) ||
                       (t.userId || '').toString().includes(search) ||
                       (t.orderId || '').toString().includes(search);
              }
              return true;
            }).map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.ticketNumber || `#${ticket.id}`}</td>
                <td>{ticket.userId}</td>
                <td>{ticket.category || 'N/A'}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background: ticket.status === 'open' ? '#ffebee' :
                               ticket.status === 'in_progress' ? '#fff3e0' :
                               ticket.status === 'resolved' ? '#e8f5e9' : '#ffebee',
                    color: ticket.status === 'open' ? '#c62828' :
                           ticket.status === 'in_progress' ? '#ef6c00' :
                           ticket.status === 'resolved' ? '#2e7d32' : '#c62828'
                  }}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn" onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>In Progress</button>
                  <button className="btn" onClick={() => updateTicketStatus(ticket.id, 'resolved')}>Resolve</button>
                  <button className="btn-d" onClick={() => updateTicketStatus(ticket.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Footer Live Preview</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={previewMode === 'mobile' ? 'btn btn-primary' : 'btn'}
            onClick={() => setPreviewMode('mobile')}
          >
            Mobile
          </button>
          <button
            className={previewMode === 'tablet' ? 'btn btn-primary' : 'btn'}
            onClick={() => setPreviewMode('tablet')}
          >
            Tablet
          </button>
          <button
            className={previewMode === 'desktop' ? 'btn btn-primary' : 'btn'}
            onClick={() => setPreviewMode('desktop')}
          >
            Desktop
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn" onClick={saveDraft}>Save Draft</button>
          <button className="btn btn-primary" onClick={publishChanges}>Publish</button>
          <button className="btn-d" onClick={resetChanges}>Reset</button>
        </div>
        {draftSaved && <div style={{ color: 'green', marginBottom: 8 }}>Draft saved successfully!</div>}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 20,
            background: '#f5f5f5',
            width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
            maxWidth: '100%',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              background: form.ftr_bg || '#1a5d1a',
              color: form.ftr_text || '#ffffff',
              padding: '40px 20px',
              display: 'grid',
              gridTemplateColumns: previewMode === 'mobile' ? '1fr' : previewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '20px'
            }}
          >
            <div>
              <h4 style={{ marginBottom: 12 }}>{form.site_name || 'Go Nature Farms'}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{form.footer_desc || 'Farm-fresh organic products delivered to your door.'}</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>{form.footer_phone || '+91 9182526xxx'}</p>
              <p style={{ fontSize: 14 }}>{form.store_location || 'Hyderabad, India'}</p>
            </div>
            <div>
              <h5 style={{ marginBottom: 12 }}>Quick Links</h5>
              {footerLinks.filter(l => l.category === 'QUICK_LINKS' && l.enabled).slice(0, 5).map(link => (
                <div key={link.id} style={{ marginBottom: 8 }}>
                  <a
                    href={link.url}
                    target={link.openInNewTab ? '_blank' : '_self'}
                    rel={link.openInNewTab ? 'noopener noreferrer' : ''}
                    style={{ color: 'inherit', textDecoration: 'none', fontSize: 14 }}
                  >
                    {link.name}
                  </a>
                </div>
              ))}
            </div>
            <div>
              <h5 style={{ marginBottom: 12 }}>Customer Care</h5>
              {footerLinks.filter(l => l.category === 'CUSTOMER_CARE' && l.enabled).slice(0, 5).map(link => (
                <div key={link.id} style={{ marginBottom: 8 }}>
                  <a
                    href={link.url}
                    target={link.openInNewTab ? '_blank' : '_self'}
                    rel={link.openInNewTab ? 'noopener noreferrer' : ''}
                    style={{ color: 'inherit', textDecoration: 'none', fontSize: 14 }}
                  >
                    {link.name}
                  </a>
                </div>
              ))}
            </div>
            <div>
              <h5 style={{ marginBottom: 12 }}>Connect</h5>
              {socialMediaLinks.filter(l => l.enabled).slice(0, 4).map(link => (
                <div key={link.id} style={{ marginBottom: 8 }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', fontSize: 14 }}
                  >
                    {link.platform}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              background: form.ftr_bg || '#1a5d1a',
              color: form.ftr_text || '#ffffff',
              padding: '20px',
              textAlign: 'center',
              fontSize: 12,
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {form.footer_text || '© 2024 Go Nature Farms. All rights reserved.'}
          </div>
        </div>
      </div>
    </div>
  );
}
