import React from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header({ search, onSearch, onOpenCart, onOpenOrders, onOpenAuth, onOpenAdmin }) {
  const { settings } = useSite();
  const { count } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const headerFontSize = settings.hdr_font_size || '16';

  // Helper function to get image URL with proper backend prefix
  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    // If it's already a full URL (Cloudinary), return as-is
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    // 🛑 FIX: If it's the default static frontend logo, load it from Vercel (don't prefix backend URL)
    if (imgUrl === '/logo.png' || imgUrl === '/brand-logo.png') {
      return imgUrl; 
    }
    // If it's a local backend path (e.g., uploaded via Admin), prefix with backend API URL
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanImgUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${cleanImgUrl}`;
  };

  // Use logo from settings if available, otherwise fallback to default
  const logoUrl = settings.logo || '/logo.png';

  return (
    <header style={{ backgroundColor: isAdminPage ? undefined : (settings.hdr_bg || undefined), fontSize: `${headerFontSize}px` }}>
      <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}>
        <img src={getImageUrl(logoUrl)} alt="Go Nature Farms" style={{ height: '50px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d5a27', fontFamily: 'Georgia, serif' }}>
            Go Nature Farms
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#4a7c4f', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Nature is Our future & Forever
          </span>
        </div>
      </div>
      <div className="nav-right">
        <div className="search-wrap">
          <svg fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button className="hbtn" onClick={onOpenOrders}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
          <span>Orders</span>
        </button>
        <button className="hbtn" onClick={onOpenAuth}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Account</span>
        </button>
        <button className="hbtn" title="Admin Login" onClick={onOpenAdmin}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        <button className="hbtn" title="Toggle Dark Mode" onClick={toggleDarkMode}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}