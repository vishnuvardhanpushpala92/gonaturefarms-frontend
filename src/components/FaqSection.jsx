import React from 'react';
import { useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function FaqSection() {
  const { faqs } = useSite();
  const [openId, setOpenId] = useState(null);

  if (!faqs.length) return null;

  return (
    <div className="section reveal">
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
