import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminReviewsTab() {
  const showToast = useToast();
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ productId: '', userName: '', rating: 5, comment: '', featured: false });

  const load = () => api.get('/reviews/admin/all').then(({ data }) => setReviews(data.reviews || []));
  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    const { data } = await api.put(`/reviews/${id}/${action}`);
    showToast(data.message);
    load();
  };

  const feature = async (id, featured) => {
    const { data } = await api.put(`/reviews/${id}/feature`, { featured });
    showToast(data.message);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    const { data } = await api.delete(`/reviews/${id}`);
    showToast(data.message);
    load();
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setForm({
      productId: review.productId || '',
      userName: review.userName || '',
      rating: review.rating || 5,
      comment: review.comment || '',
      featured: review.featured || false
    });
    setShowAddForm(true);
  };

  const saveReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        const { data } = await api.put(`/reviews/${editingReview.id}`, form);
        showToast(data.message);
      } else {
        const { data } = await api.post('/reviews/admin/create', form);
        showToast(data.message);
      }
      setShowAddForm(false);
      setEditingReview(null);
      setForm({ productId: '', userName: '', rating: 5, comment: '', featured: false });
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save review');
    }
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingReview(null);
    setForm({ productId: '', userName: '', rating: 5, comment: '', featured: false });
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ marginBottom: 16 }}>
        Add New Review
      </button>

      {showAddForm && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>{editingReview ? 'Edit Review' : 'Add New Review'}</h3>
          <form onSubmit={saveReview}>
            <div className="fg">
              <label>Product ID</label>
              <input
                required
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                placeholder="Enter product ID"
              />
            </div>
            <div className="fg">
              <label>Customer Name</label>
              <input
                required
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div className="fg">
              <label>Rating</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Comment</label>
              <textarea
                required
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Enter review comment"
              />
            </div>
            <div className="fg">
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Featured Review
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">
                {editingReview ? 'Update Review' : 'Add Review'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td>{r.productName}</td>
              <td>{r.userName}</td>
              <td>{'★'.repeat(r.rating)}</td>
              <td style={{ maxWidth: 240 }}>{r.comment}</td>
              <td>{r.status}{r.featured ? ' · featured' : ''}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {r.status === 'pending'
                  ? <button className="btn-e" onClick={() => act(r.id, 'approve')}>Approve</button>
                  : <button className="btn-e" onClick={() => act(r.id, 'unapprove')}>Hide</button>}{' '}
                <button className="btn-e" onClick={() => feature(r.id, !r.featured)}>{r.featured ? 'Unfeature' : 'Feature'}</button>{' '}
                <button className="btn-e" onClick={() => startEdit(r)}>Edit</button>{' '}
                <button className="btn-d" onClick={() => remove(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
