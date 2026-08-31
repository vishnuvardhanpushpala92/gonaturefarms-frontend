import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function ScrollingBlocks() {
  const { blocks } = useSite();

  if (!blocks || blocks.length === 0) return null;

  // Limit to 6 items and use only the first 6
  const displayBlocks = blocks.slice(0, 6);

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {displayBlocks.map((block, index) => (
          <div
            key={block.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: textColor,
              fontSize: '0.9rem',
              fontWeight: '500',
              padding: '0 15px',
              borderRight: index < displayBlocks.length - 1 ? '1px solid #e0e0e0' : 'none'
            }}
          >
            <span style={{ fontSize: '1.1rem', minWidth: '20px' }}>
              {block.icon || '🌿'}
            </span>
            <span style={{ textAlign: 'center' }}>
              {block.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}