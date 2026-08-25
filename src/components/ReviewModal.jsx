import React from 'react';
import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client';

export default function ReviewModal({ product, onClose }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!product) return;
    const { data } = await api.get(`/reviews/${product.id}`);
    setReviews(data.reviews || []);
    setAvg(data.avgRating || 0);
    setCount(data.count || 0);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [product]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/reviews/${product.id}`, { rating, comment });
      showToast(data.message);
      if (data.success) {
        setComment('');
        load();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Please login to submit a review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!product} onClose={onClose} title={product?.name} subtitle={`${avg.toFixed ? avg.toFixed(1) : avg} ★ · ${count} reviews`}>
      {user && (
        <form onSubmit={submit} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div className="fg">
            <label>Your Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Your Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit Review'}</button>
        </form>
      )}

      {reviews.length === 0 && <p style={{ color: 'var(--muted)' }}>No reviews yet. Be the first!</p>}
      {reviews.map((r) => (
        <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <strong>{r.user_name || r.userName}</strong> — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 4 }}>{r.comment}</p>
        </div>
      ))}
    </Modal>
  );
}
