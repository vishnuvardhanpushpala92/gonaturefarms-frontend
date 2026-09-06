import React, { useState, useEffect } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { useLocation } from 'react-router-dom';
import api from '../api/client';

export default function Footer({ onOpenSupport }) {
  const { settings, footerLinks } = useSite();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const footerFontSize = settings.ftr_font_size || '14';

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Group footer links by category
  const quickLinks = footerLinks.filter(link => link.category === 'QUICK_LINKS');
  const customerCareLinks = footerLinks.filter(link => link.category === 'CUSTOMER_CARE');

  // Default navigation links that should always be available (removed About Us)
  const defaultLinks = [
    { name: 'Home', url: '/' },
    { name: 'Back to Top', url: 'scroll' }
  ];

  // Combine default links with admin-added quick links
  const allQuickLinks = [...defaultLinks, ...quickLinks];

  // Load testimonials
  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const res = await api.get('/testimonials');
      if (res.data && res.data.success) {
        setTestimonials(Array.isArray(res.data.testimonials) ? res.data.testimonials : []);
      } else {
        console.error('API returned success=false:', res.data);
        setTestimonials([]);
      }
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      setTestimonials([]);
    }
  };

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < testimonials.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

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
    <footer style={{ 
      backgroundColor: isAdminPage ? undefined : (settings.ftr_bg || undefined), 
      color: isAdminPage ? undefined : (settings.ftr_text || undefined), 
      fontSize: `${footerFontSize}px`,
      margin: 0,
      padding: 0
    }}>
      {/* Testimonials Section - Integrated at top of footer */}
      {testimonials.length > 0 && (
        <div className="customer-testimonials-section" style={{ margin: 0, padding: '60px 20px' }}>
          <div className="customer-testimonials-container">
            <div className="customer-testimonials-header">
              <h2 className="customer-testimonials-title">Listen From Our Customers</h2>
            </div>
            
            <div className="customer-testimonials-slider">
              <button 
                className="customer-testimonials-nav customer-testimonials-nav-left" 
                onClick={scrollLeft}
                disabled={currentIndex === 0}
              >
                <span>‹</span>
              </button>
              
              <div className="customer-testimonials-content">
                <div className="customer-testimonials-stars">
                  {renderStars(testimonials[currentIndex].rating)}
                </div>
                <p className="customer-testimonials-quote">
                  "{testimonials[currentIndex].quote}"
                </p>
                <div className="customer-testimonials-author">
                  {testimonials[currentIndex].avatarUrl && (
                    <img 
                      src={testimonials[currentIndex].avatarUrl} 
                      alt={testimonials[currentIndex].customerName}
                      className="customer-testimonials-avatar"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <span className="customer-testimonials-name">
                    {testimonials[currentIndex].customerName}
                  </span>
                </div>
              </div>
              
              <button 
                className="customer-testimonials-nav customer-testimonials-nav-right" 
                onClick={scrollRight}
                disabled={currentIndex === testimonials.length - 1}
              >
                <span>›</span>
              </button>
            </div>
            
            <div className="customer-testimonials-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`customer-testimonials-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Original Footer Content */}
      <div className="footer-main" style={{ marginTop: 0, paddingTop: '40px' }}>
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
