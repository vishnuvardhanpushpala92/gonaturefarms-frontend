import React from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function ScrollingBlocks() {
  const { blocks } = useSite();

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="scrolling-blocks-container">
      <div className="scrolling-blocks-inner">
        {[...blocks, ...blocks].map((block, index) => (
          <div key={`${block.id}-${index}`} className="scrolling-block-item">
            <span className="scrolling-block-icon">{block.icon || '🌿'}</span>
            <span className="scrolling-block-title">{block.title}</span>
            <span className="scrolling-block-content">{block.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}