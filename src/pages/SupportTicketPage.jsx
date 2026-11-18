import React, { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function SupportTicketPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    category: '',
    orderId: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category.trim() || !form.description.trim()) {
      showToast('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support/tickets', {
        category: form.category,
        orderId: form.orderId || null,
        description: form.description
      });
      showToast('Ticket submitted successfully');
      setForm({ category: '', orderId: '', description: '' });
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <h2>Submit Support Ticket</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="fg">
          <label>Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Select category</option>
            <option value="order">Order Issue</option>
            <option value="payment">Payment Issue</option>
            <option value="product">Product Quality</option>
            <option value="shipping">Shipping/Delivery</option>
            <option value="refund">Refund Request</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="fg">
          <label>Order ID (optional)</label>
          <input
            type="text"
            value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            placeholder="Enter order ID if applicable"
          />
        </div>
        <div className="fg">
          <label>Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your issue in detail"
            rows={5}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
