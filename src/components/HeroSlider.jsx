import React from 'react';
import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function HeroSlider() {
  const { slides } = useSite();
  const [index, setIndex] = useState(0);
  const [sliderHeight, setSliderHeight] = useState(400);
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleImageLoad = (e, slideId) => {
    const img = e.target;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    // Calculate optimal height based on aspect ratio
    // For landscape images (width > height), use aspect ratio to determine height
    // For portrait images, force a minimum height for good visibility
    let calculatedHeight;
    
    if (aspectRatio >= 1) {
      // Landscape or square: use window width to calculate height
      const windowWidth = window.innerWidth;
      calculatedHeight = Math.min(windowWidth / aspectRatio, 700); // Max 700px height
      calculatedHeight = Math.max(calculatedHeight, 300); // Min 300px height
    } else {
      // Portrait: force reasonable height for display
      calculatedHeight = 500;
    }
    
    setLoadedImages(prev => ({ ...prev, [slideId]: calculatedHeight }));
    
    // Update slider height if this is the current slide
    if (slides[index]?.id === slideId) {
      setSliderHeight(calculatedHeight);
    }
  };

  // Update slider height when index changes
  useEffect(() => {
    if (slides[index] && loadedImages[slides[index].id]) {
      setSliderHeight(loadedImages[slides[index].id]);
    }
  }, [index, slides, loadedImages]);

  if (!slides.length) return null;

  return (
    <div 
      className="slider-wrap" 
      style={{ height: `${sliderHeight}px` }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`slide${i === index ? ' active' : ''}`}
          style={{ 
            backgroundImage: slide.imageUrl ? `url(${slide.imageUrl})` : 'none',
            backgroundColor: slide.imageUrl ? 'transparent' : '#2d5a27'
          }}
        >
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt={slide.caption || 'Slide'}
              style={{ 
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                opacity: 0,
                pointerEvents: 'none'
              }}
              onLoad={(e) => handleImageLoad(e, slide.id)}
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
