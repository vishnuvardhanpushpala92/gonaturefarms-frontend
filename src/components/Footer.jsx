import React from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { useLocation } from 'react-router-dom';

export default function Footer({ onOpenSupport }) {
  const { settings, footerLinks } = useSite();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const footerFontSize = settings.ftr_font_size || '14';

  // Group footer links by category
  const quickLinks = footerLinks.filter(link => link.category === 'QUICK_LINKS');
  const customerCareLinks = footerLinks.filter(link => link.category === 'CUSTOMER_CARE');

  // Default navigation links that should always be available
  const defaultLinks = [
    { name: 'Home', url: '/' },
    { name: 'Back to Top', url: 'scroll' }
  ];

  // Combine default links with admin-added quick links
  const allQuickLinks = [...defaultLinks, ...quickLinks];

  const handleLinkClick = (url, e) => {
    e.preventDefault();
    
    // Handle special actions
    if (url === 'support') {
      onOpenSupport();
      return;
    }
    
    if (url === 'scroll') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Handle hash links (scroll to section)
    if (url.startsWith('#')) {
      const element = document.getElementById(url.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    // Handle external URLs
    if (url.startsWith('http')) {
      window.open(url, '_blank');
      return;
    }
    
    // Handle internal routes
    window.location.href = url;
  };

  return (
    <footer style={{ backgroundColor: isAdminPage ? undefined : (settings.ftr_bg || undefined), color: isAdminPage ? undefined : (settings.ftr_text || undefined), fontSize: `${footerFontSize}px` }}>
      <div className="footer-main">
        <div className="footer-brand">
          <h3>{settings.site_name || 'Go Nature Farms'}</h3>
          <p>{settings.footer_desc || 'Bringing the purest organic produce directly from our farms to your table.'}</p>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          {allQuickLinks.map((link, index) => (
            <a 
              key={link.id || `default-${index}`} 
              href={link.url} 
              onClick={(e) => handleLinkClick(link.url, e)}
            >
              {link.name}
            </a>
          ))}
        </div>
        <div className="footer-col">
          <h4>Customer Care</h4>
          {customerCareLinks.length > 0 ? (
            customerCareLinks.map(link => (
              <a 
                key={link.id} 
                href={link.url} 
                onClick={(e) => handleLinkClick(link.url, e)}
              >
                {link.name}
              </a>
            ))
          ) : (
            // Default customer care links if none are added
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); onOpenSupport(); }}>Contact Support</a>
              <a href="#faq">FAQ</a>
              <a href="#shipping">Shipping Info</a>
              <a href="#returns">Returns & Refunds</a>
            </>
          )}
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
