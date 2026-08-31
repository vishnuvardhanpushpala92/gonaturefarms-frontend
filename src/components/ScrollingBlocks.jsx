import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function ScrollingBlocks() {
  const { blocks } = useSite();

  if (!blocks || blocks.length === 0) return null;

  return (
    <div style={{
      background: '#ffffff',
      padding: '14px 0',
      overflow: 'hidden',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      position: 'relative',
      zIndex: 10,
      margin: '0'
    }}>
      <div style={{
        display: 'flex',
        animation: 'scrollLeft 25s linear infinite',
        whiteSpace: 'nowrap',
        alignItems: 'center'
      }}>
        {[...blocks, ...blocks].map((block, index) => (
          <div
            key={`${block.id}-${index}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 32px',
              color: '#2d5a27',
              fontSize: '0.9rem',
              fontWeight: '500',
              letterSpacing: '0.2px'
            }}
          >
            <span style={{
              fontSize: '1rem',
              color: '#2d5a27',
              display: 'flex',
              alignItems: 'center',
              minWidth: '16px'
            }}>
              {block.icon || '🌿'}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              color: '#2d5a27'
            }}>
              {block.title}
            </span>
            <span style={{
              color: '#1f2937',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}>
              {block.content}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @media (max-width: 768px) {
          div > div {
            padding: 0 20px;
            font-size: 0.8rem;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}