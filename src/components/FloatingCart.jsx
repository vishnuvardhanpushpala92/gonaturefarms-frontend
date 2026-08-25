import React from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function FloatingCart({ onClick }) {
  const { cart: items } = useCart();
  const count = (items || []).reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0);

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 100,
        right: 20,
        zIndex: 999,
        borderRadius: '50%',
        width: 54,
        height: 54,
        backgroundColor: '#16a34a',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      title="View Cart"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
