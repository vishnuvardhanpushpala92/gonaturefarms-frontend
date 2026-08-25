import React from 'react';
import { useState, useEffect } from 'react';

const agricultureImages = [
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop'
];

export default function AgricultureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % agricultureImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % agricultureImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + agricultureImages.length) % agricultureImages.length);
  };

  return (
    <div className="agriculture-carousel">
      <div className="carousel-track">
        {agricultureImages.map((image, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
      </div>
      <button className="carousel-arrow carousel-prev" onClick={prevSlide}>
        ‹
      </button>
      <button className="carousel-arrow carousel-next" onClick={nextSlide}>
        ›
      </button>
      <div className="carousel-dots">
        {agricultureImages.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
