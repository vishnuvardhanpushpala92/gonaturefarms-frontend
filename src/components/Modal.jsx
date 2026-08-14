import React from 'react';
export default function Modal({ open, onClose, title, subtitle, wide, narrow, children, footer }) {
  if (!open) return null;
  return (
    <div className={`modal${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-box${wide ? ' wide' : ''}${narrow ? ' narrow' : ''}`}>
        <div className="mhdr">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mbody">{children}</div>
        {footer && <div className="mftr">{footer}</div>}
      </div>
    </div>
  );
}
