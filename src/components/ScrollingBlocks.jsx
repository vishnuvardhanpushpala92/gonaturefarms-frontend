import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function ScrollingBlocks() {
  const { blocks } = useSite();

  if (!blocks || blocks.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #2d5a27 0%, #3a7232 50%, #2d5a27 100%)',
      padding: '12px 0',
      overflow: 'hidden',
      borderBottom: '1px solid #1e3d1a'
    }}>
      <div style={{
        display: 'flex',
        animation: 'scrollLeft 20s linear infinite',
        whiteSpace: 'nowrap'
      }}>
        {[...blocks, ...blocks].map((block, index) => (
          <div
            key={`${block.id}-${index}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 40px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {block.icon && <span style={{ fontSize: '1.2rem' }}>{block.icon}</span>}
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: getBlockStyle(block.style),
              display: 'inline-block'
            }}>
              {block.title}
            </span>
            <span>{block.content}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function getBlockStyle(style) {
  const styles = {
    info: 'rgba(59, 130, 246, 0.3)',
    promo: 'rgba(245, 158, 11, 0.3)',
    notice: 'rgba(239, 68, 68, 0.3)',
    earth: 'rgba(139, 92, 246, 0.3)'
  };
  return styles[style] || styles.info;
}