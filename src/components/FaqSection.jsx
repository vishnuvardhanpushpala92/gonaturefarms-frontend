import React from 'react';
import { useState, useEffect } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import api from '../api/client';

export default function FaqSection() {
  const { faqs: initialFaqs, loaded } = useSite();
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  // Load FAQs separately if not in homepage data
  useEffect(() => {
    if (loaded && initialFaqs.length > 0) {
      setFaqs(initialFaqs);
    } else if (loaded) {
      // Load FAQs separately since they're not in homepage endpoint anymore
      api.get('/admin/faqs').then(res => {
        if (res.data && res.data.success) {
          setFaqs(Array.isArray(res.data.faqs) ? res.data.faqs : []);
        }
      }).catch(err => {
        console.error('Failed to load FAQs:', err);
        setFaqs([]);
      });
    }
  }, [loaded, initialFaqs]);

  if (!faqs.length) return null;

  return (
    <div className="section reveal last-section">
      <div className="section-head"><h2>Frequently Asked Questions <span></span></h2></div>
      {faqs.map((f) => (
        <div className="faq-row" key={f.id} onClick={() => setOpenId(openId === f.id ? null : f.id)} style={{ cursor: 'pointer' }}>
          <div className="faq-q">{f.question}</div>
          {openId === f.id && <div className="faq-a">{f.answer}</div>}
        </div>
      ))}
    </div>
  );
}
