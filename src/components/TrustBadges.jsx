import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

const DEFAULT_BADGES = [
  { icon: '🌿', title: '100% Organic', sub: 'Certified by FSSAI' },
  { icon: '🚚', title: 'Free Delivery', sub: 'Orders above ₹500' },
  { icon: '🔄', title: 'Easy Returns', sub: '7-day return policy' },
  { icon: '🏆', title: '5000+ Families', sub: 'Trust us daily' }
];

export default function TrustBadges() {
  const { settings } = useSite();
  let badges = DEFAULT_BADGES;
  if (settings.trust_badges) {
    try {
      const parsed = JSON.parse(settings.trust_badges);
      if (Array.isArray(parsed) && parsed.length) badges = parsed;
    } catch {
      /* fall back to defaults */
    }
  }

  return (
    <div className="trust-section reveal first-section">
      <div className="trust-grid">
        {badges.map((b, i) => (
          <div className="trust-item" key={i}>
            <span className="trust-icon">{b.icon}</span>
            <div>
              <strong>{b.title}</strong>
              <p>{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
