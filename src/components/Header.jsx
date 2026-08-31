import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header({ search, onSearch, onOpenCart, onOpenOrders, onOpenAuth, onOpenAdmin, blinkLogin, blinkCart }) {
  const { settings } = useSite();
  const { count } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const headerFontSize = settings.hdr_font_size || '16';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    if (imgUrl === '/logo.png' || imgUrl === '/brand-logo.png') return imgUrl;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  const logoUrl = settings.logo || '/logo.png';

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
      setMobileMenuOpen(false);
    } else {
      console.warn('onOpenAuth prop is not provided');
    }
  };

  const handleOpenOrders = () => {
    if (onOpenOrders) {
      onOpenOrders();
      setMobileMenuOpen(false);
    } else {
      console.warn('onOpenOrders prop is not provided');
    }
  };

  const handleOpenAdmin = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
      setMobileMenuOpen(false);
    } else {
      console.warn('onOpenAdmin prop is not provided');
    }
  };

  const handleOpenCart = () => {
    if (onOpenCart) {
      onOpenCart();
      setMobileMenuOpen(false);
    } else {
      console.warn('onOpenCart prop is not provided');
    }
  };

  return (
    <header style={{ backgroundColor: isAdminPage ? undefined : (settings.hdr_bg || undefined), fontSize: `${headerFontSize}px` }}>
      <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}>
        <img src={getImageUrl(logoUrl)} alt="Go Nature Farms" style={{ height: '50px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d5a27', fontFamily: 'Georgia, serif' }}>Go Nature Farms</span>
          <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#4a7c4f', letterSpacing: '1px', textTransform: 'uppercase' }}>Nature is Our future & Forever</span>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          zIndex: 1001
        }}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Desktop Navigation */}
      <div className="nav-right">
        <div className="search-wrap">
          <svg fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <button className="hbtn" onClick={handleOpenCart}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span>Cart {count > 0 && `(${count})`}</span>
        </button>
        <button className="hbtn" onClick={handleOpenOrders}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
          <span>Orders</span>
        </button>
        <button className={`hbtn ${blinkLogin ? 'blink-alert' : ''}`} onClick={handleOpenAuth}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span>Account</span>
        </button>
        <button className="hbtn" title="Admin Login" onClick={handleOpenAdmin}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
        </button>
        <button className="hbtn" title="Toggle Dark Mode" onClick={toggleDarkMode}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          background: darkMode ? '#1f2937' : '#ffffff',
          borderBottom: '1px solid var(--border)',
          padding: '16px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="search-wrap" style={{ marginBottom: '8px' }}>
            <svg fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
          <button className="hbtn" onClick={handleOpenCart} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span>Cart {count > 0 && `(${count})`}</span>
          </button>
          <button className="hbtn" onClick={handleOpenOrders} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
            <span>Orders</span>
          </button>
          <button className={`hbtn ${blinkLogin ? 'blink-alert' : ''}`} onClick={handleOpenAuth} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span>Account</span>
          </button>
          <button className="hbtn" onClick={handleOpenAdmin} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
            <span>Admin</span>
          </button>
          <button className="hbtn" onClick={toggleDarkMode} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px' }}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}
    </header>
  );
}