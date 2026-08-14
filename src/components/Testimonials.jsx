import React from 'react';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/reviews/home/featured').then(({ data }) => setReviews(data.reviews || []));
  }, []);

  if (!reviews.length) return null;

  return (
    <div className="testimonials-section reveal">
      <div className="section-head"><h2>What Our Customers Say <span></span></h2></div>
      <div className="pgrid">
        {reviews.map((r) => (
          <div className="pcard" key={r.id} style={{ padding: 16 }}>
            <div>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <p style={{ fontSize: '.82rem', color: 'var(--muted)', margin: '8px 0' }}>{r.comment}</p>
            <strong style={{ fontSize: '.8rem' }}>{r.userName}</strong>
            {r.productName && <span style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block' }}>on {r.productName}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
