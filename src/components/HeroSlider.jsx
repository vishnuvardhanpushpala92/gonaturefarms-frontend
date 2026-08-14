import React from 'react';
import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function HeroSlider() {
  const { slides } = useSite();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="slider-wrap">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`slide${i === index ? ' active' : ''}`}
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        >
          <div className="slide-mask" />
          <div className="slide-content">
            <h2>{slide.caption}</h2>
            <p>{slide.subText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
