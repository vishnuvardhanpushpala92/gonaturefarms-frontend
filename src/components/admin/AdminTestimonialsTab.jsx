import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = { customerName: '', quote: '', rating: 5, avatarUrl: '', enabled: true, sortOrder: 0 };

export default function AdminTestimonialsTab() {
  const showToast = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    api.get('/testimonials/admin/all').then(({ data }) => setTestimonials(data.testimonials || []));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (testimonial) => {
    setEditing(testimonial.id);
    setForm({
      customerName: testimonial.customerName,
      quote: testimonial.quote,
      rating: testimonial.rating,
      avatarUrl: testimonial.avatarUrl || '',
      enabled: testimonial.enabled,
      sortOrder: testimonial.sortOrder
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = editing
        ? (await api.put(`/testimonials/admin/${editing}`, form)).data
        : (await api.post('/testimonials/admin', form)).data;

      showToast(data.message);
      if (data.success) {
        resetForm();
        load();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save testimonial');
    }
  };

  const toggleEnabled = async (id) => {
    try {
      const { data } = await api.put(`/testimonials/admin/${id}/toggle`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to toggle testimonial status');
    }
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const { data } = await api.delete(`/testimonials/admin/${id}`);
      showToast(data.message);
      if (data.success) load();
    } catch (err) {
      showToast('Failed to delete testimonial');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="admin-card">
      <h3>Testimonials Management</h3>
      
      <form onSubmit={save} className="admin-form">
        <div className="fg">
          <label>Customer Name *</label>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            required
          />
        </div>

        <div className="fg">
          <label>Customer Quote *</label>
          <textarea
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            required
            rows={4}
          />
        </div>

        <div className="fg">
          <label>Rating *</label>
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
            required
          >
            <option value={5}>★★★★★ (5 stars)</option>
            <option value={4}>★★★★☆ (4 stars)</option>
            <option value={3}>★★★☆☆ (3 stars)</option>
            <option value={2}>★★☆☆☆ (2 stars)</option>
            <option value={1}>★☆☆☆☆ (1 star)</option>
          </select>
        </div>

        <div className="fg">
          <label>Avatar Image URL (Optional)</label>
          <input
            type="text"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <div className="fg">
          <label>Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
          />
        </div>

        <div className="fg">
          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            {' '}Enabled
          </label>
        </div>

        <div className="admin-ctrl">
          <button type="submit" className="btn-buy">
            {editing ? 'Update' : 'Add Testimonial'}
          </button>
          {editing && (
            <button type="button" className="btn-e" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-list">
        <h4>Existing Testimonials ({testimonials.length})</h4>
        {testimonials.length === 0 ? (
          <div className="empty-grid">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No testimonials added yet</p>
          </div>
        ) : (
          <div className="admin-list-items">
            {testimonials.sort((a, b) => a.sortOrder - b.sortOrder).map(testimonial => (
              <div key={testimonial.id} className="admin-list-item">
                <div className="admin-list-item-content">
                  <h5>{testimonial.customerName}</h5>
                  <p className="admin-list-item-sub">Rating: {renderStars(testimonial.rating)}</p>
                  <p className="admin-list-item-sub">{testimonial.quote.substring(0, 100)}...</p>
                  <p className="admin-list-item-sub">Sort: {testimonial.sortOrder}</p>
                  <p className="admin-list-item-sub">Status: {testimonial.enabled ? 'Enabled' : 'Disabled'}</p>
                  {testimonial.pending && <span className="badge-pending">Pending Approval</span>}
                </div>
                <div className="admin-list-item-actions">
                  <button className="btn-e" onClick={() => startEdit(testimonial)}>Edit</button>
                  <button className="btn-e" onClick={() => toggleEnabled(testimonial.id)}>
                    {testimonial.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-d" onClick={() => deleteTestimonial(testimonial.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}