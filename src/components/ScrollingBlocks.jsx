import React from 'react';
import { useSite } from '../context/SiteContext.jsx';
import api from '../api/client';
import { useEffect, useState } from 'react';

export default function ScrollingBlocks() {
  const { blocks } = useSite();
  const [publicBlocks, setPublicBlocks] = useState([]);

  // Fetch public blocks separately to ensure we get active ones
  useEffect(() => {
    const fetchPublicBlocks = async () => {
      try {
        const response = await api.get('/admin/scroll-content');
        setPublicBlocks(response.data.blocks || []);
      } catch (err) {
        console.error('Failed to fetch public blocks:', err);
        setPublicBlocks([]);
      }
    };
    fetchPublicBlocks();
  }, []);

  const displayBlocks = publicBlocks.slice(0, 6);

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