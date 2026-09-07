import React from 'react';
import { useEffect, useState } from 'react';

export default function FlowerBlast() {
  const [visible, setVisible] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    const hideTimer = setTimeout(() => setVisible(false), 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Generate random confetti pieces only on client side
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#a8e6cf', '#ff9a9e', '#fecfef'];
    const pieces = [...Array(50)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: -10,
      animationDelay: Math.random() * 2,
      animationDuration: 3 + Math.random() * 2,
      background: colors[i % colors.length],
      width: 8 + Math.random() * 8,
      height: 8 + Math.random() * 8,
      borderRadius: Math.random() > 0.5 ? '50%' : '0'
    }));

    setConfettiPieces(pieces);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="confetti-overlay">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            animationDelay: `${piece.animationDelay}s`,
            animationDuration: `${piece.animationDuration}s`,
            background: piece.background,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            borderRadius: piece.borderRadius
          }}
        />
      ))}
    </div>
  );
}
