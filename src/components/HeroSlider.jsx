import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function HeroSlider() {
  const { slides } = useSite();
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="slider-wrap" ref={sliderRef}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`slide${i === index ? ' active' : ''}`}
        >
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt={slide.caption || 'Slide'}
              className="slide-image"
            />
          )}
          <div className="slide-mask" />
          <div className="slide-content">
            {slide.caption && <h2>{slide.caption}</h2>}
            {slide.subText && <p>{slide.subText}</p>}
          </div>
        </div>
      ))}
      <div className="slider-nav">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`snav${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
