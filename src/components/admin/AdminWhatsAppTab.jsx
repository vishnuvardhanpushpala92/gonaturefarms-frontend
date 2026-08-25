import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const REMINDER_TYPES = ['Payment', 'Order', 'Delivery', 'Product', 'Custom'];

export default function AdminWhatsAppTab() {
  const showToast = useToast();
  const [reminders, setReminders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    reminderType: 'Custom',
    message: '',
    scheduledAt: '',
    customerIds: []
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  useEffect(() => {
    loadReminders();
    loadCustomers();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/whatsapp/reminders');
      if (data.success) {
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      if (data.success) {
        setCustomers(data.users?.filter(u => u.role === 'customer') || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const createReminder = async (e) => {
    e.preventDefault();
    if (selectedCustomers.length === 0) {
      showToast('Please select at least one customer');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...form,
        customerIds: selectedCustomers,
        scheduledAt: form.scheduledAt || new Date().toISOString()
      };
      
      const { data } = await api.post('/admin/whatsapp/send-customers', payload);
      showToast(data.message);
      if (data.success) {
        // Open WhatsApp for each selected customer
        data.whatsappLinks?.forEach((link, index) => {
          setTimeout(() => {
            window.open(link, '_blank');
          }, index * 500); // Stagger opening to avoid popup blocking
        });
        
        setForm({ reminderType: 'Custom', message: '', scheduledAt: '', customerIds: [] });
        setSelectedCustomers([]);
        setShowPreview(false);
        loadReminders();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    
    try {
      const { data } = await api.delete(`/admin/whatsapp/reminders/${id}`);
      showToast(data.message);
      loadReminders();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete reminder');
    }
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map(c => c.id));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomers([]);
  };

  const previewMessage = () => {
    setShowPreview(true);
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Create WhatsApp Reminder</h3>
        <form onSubmit={createReminder}>
          <div className="fg">
            <label>Reminder Type</label>
            <select 
              value={form.reminderType} 
              onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
            >
              {REMINDER_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="fg">
            <label>Message</label>
            <textarea 
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Enter your message here..."
              rows={4}
            />
          </div>
          
          <div className="fg">
            <label>Schedule (optional - leave empty for immediate send)</label>
            <input 
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>
          
          <div className="fg">
            <label>Select Customers ({selectedCustomers.length} selected)</label>
            <div style={{ marginBottom: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={selectAllCustomers} style={{ marginRight: 8 }}>
                Select All
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearCustomerSelection}>
                Clear Selection
              </button>
            </div>
            <div style={{ 
              maxHeight: 150, 
              overflowY: 'auto', 
              border: '1px solid var(--border)', 
              borderRadius: 8, 
              padding: 8 
            }}>
              {customers.map(customer => (
                <div key={customer.id} style={{ marginBottom: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      style={{ marginRight: 8 }}
                    />
                    {customer.name} ({customer.phone})
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={previewMessage}>
              👁 Preview Message
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reminder'}
            </button>
          </div>
        </form>
        
        {showPreview && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#f0fdf4', 
            border: '1px solid #86efac', 
            borderRadius: 8 
          }}>
            <h4 style={{ marginBottom: 8 }}>Message Preview</h4>
            <div style={{ 
              padding: 12, 
              background: '#fff', 
              border: '1px solid var(--border)', 
              borderRadius: 8,
              marginBottom: 8
            }}>
              <strong>Type:</strong> {form.reminderType}<br />
              <strong>Recipients:</strong> {selectedCustomers.length} customers<br />
              <strong>Message:</strong><br />
              <div style={{ marginTop: 8, padding: 8, background: '#f9fafb', borderRadius: 4 }}>
                {form.message}
              </div>
              <strong>Scheduled:</strong> {form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : 'Immediate'}
            </div>
            <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
              Close Preview
            </button>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 12 }}>Reminder History</h3>
        {loading && <p>Loading...</p>}
        {!loading && reminders.length === 0 && <p>No reminders sent yet.</p>}
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Sent At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reminders.map(reminder => (
              <tr key={reminder.id}>
                <td>{reminder.reminderType}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {reminder.message}
                </td>
                <td>{reminder.scheduledAt ? new Date(reminder.scheduledAt).toLocaleString() : 'Immediate'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '.75rem',
                    background: reminder.status === 'Sent' ? '#f0fdf4' : 
                               reminder.status === 'Pending' ? '#fffbeb' : '#fef2f2',
                    color: reminder.status === 'Sent' ? '#166534' : 
                           reminder.status === 'Pending' ? '#92400e' : '#dc2626'
                  }}>
                    {reminder.status}
                  </span>
                </td>
                <td>{reminder.sentAt ? new Date(reminder.sentAt).toLocaleString() : '-'}</td>
                <td>
                  <button className="btn-d" onClick={() => deleteReminder(reminder.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
