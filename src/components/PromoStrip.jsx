import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

const DEFAULT_MSGS = [
  '100% Organic Certified', 'Free Delivery above ₹500', 'Farm Fresh Produce',
  'A2 Cow Products', 'Trusted by 5000+ Families', 'No Preservatives', 'Direct from Farm'
];

export default function PromoStrip() {
  const { settings } = useSite();
  const msgs = settings.banner_msgs ? settings.banner_msgs.split('|').filter(Boolean) : DEFAULT_MSGS;
  // Duplicate the list so the CSS marquee animation loops seamlessly.
  const looped = [...msgs, ...msgs];

  return (
    <div className="promo-strip">
      <div className="promo-inner">
        {looped.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
    </div>
  );
}
