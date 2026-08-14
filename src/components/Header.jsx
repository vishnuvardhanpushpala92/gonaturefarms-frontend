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

  return (
    <header style={{ backgroundColor: isAdminPage ? undefined : (settings.hdr_bg || undefined), fontSize: `${headerFontSize}px` }}>
      <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        {settings.logo_url ? (
          <img id="main-logo" src={settings.logo_url} alt="Logo" />
        ) : null}
        <div className="brand-text">
          <h1 style={{ color: isAdminPage ? undefined : (settings.hdr_text || undefined) }}>{settings.site_name || 'Go Nature Farms'}</h1>
          <span style={{ color: isAdminPage ? undefined : (settings.hdr_text || undefined) }}>{settings.tagline || 'Nature is Our Future'}</span>
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
        <button className="hbtn cart-btn" onClick={onOpenCart}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="cart-count">{count}</span>
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
