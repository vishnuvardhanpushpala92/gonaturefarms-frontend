import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function ScrollingBlocks() {
  const { blocks } = useSite();

  const displayBlocks = blocks.slice(0, 6);

  if (!displayBlocks || displayBlocks.length === 0) return null;

  // Get background color from first block or use default light color
  const backgroundColor = displayBlocks[0]?.backgroundColor || '#f8fafb';
  // Get text color from first block or use default green
  const textColor = displayBlocks[0]?.textColor || '#2d5a27';

  return (
    <div style={{
      background: backgroundColor,
      padding: '15px 20px',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      margin: '0'
    }}>
      <div className="features-grid">
        {displayBlocks.map((block) => (
          <div
            key={block.id}
            className="feature-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: textColor,
              fontSize: '0.85rem',
              fontWeight: '500',
              padding: '8px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '1.1rem', minWidth: '20px' }}>
              {block.icon || '🌿'}
            </span>
            <span>
              {block.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}