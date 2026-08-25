import React from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { useLocation } from 'react-router-dom';

export default function Footer({ onOpenSupport }) {
  const { settings } = useSite();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const footerFontSize = settings.ftr_font_size || '14';

  return (
    <footer style={{ backgroundColor: isAdminPage ? undefined : (settings.ftr_bg || undefined), color: isAdminPage ? undefined : (settings.ftr_text || undefined), fontSize: `${footerFontSize}px` }}>
      <div className="footer-main">
        <div className="footer-brand">
          <h3>{settings.site_name || 'Go Nature Farms'}</h3>
          <p>{settings.footer_desc || 'Bringing the purest organic produce directly from our farms to your table.'}</p>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <a href="#" onClick={(e) => { e.preventDefault(); onOpenSupport(); }}>Contact Support</a>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to Top</a>
        </div>
        <div className="footer-col">
          <h4>Get in Touch</h4>
          {settings.footer_phone && <a href={`tel:${settings.footer_phone}`}>{settings.footer_phone}</a>}
          {settings.store_location && <span style={{ display: 'block', fontSize: '.8rem', color: '#9ca3af' }}>{settings.store_location}</span>}
        </div>
      </div>
      <div className="footer-bottom">
        <span>{settings.footer_text || `© ${new Date().getFullYear()} Go Nature Farms. All rights reserved.`}</span>
      </div>
    </footer>
  );
}
