import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function HeroSlider() {
  const { slides, loaded } = useSite();
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (newIndex) => {
    setIndex(newIndex);
  };

  const goToPrevious = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  if (!loaded || !slides.length) return null;

  // Get image URLs with fallback for backward compatibility
  const getImageUrls = (slide) => ({
    mobile: slide.mobileImage || slide.tabletImage || slide.desktopImage || slide.imageUrl,
    tablet: slide.tabletImage || slide.desktopImage || slide.imageUrl,
    desktop: slide.desktopImage || slide.imageUrl
  });

  return (
    <div className="slider-wrap" ref={sliderRef} onKeyDown={handleKeyDown} tabIndex={0}>
      {slides.map((slide, i) => {
        const imageUrls = getImageUrls(slide);
        return (
          <div
            key={slide.id}
            className={`slide${i === index ? ' active' : ''}`}
          >
            <picture className="hero-picture">
              <source
                media="(max-width: 767px)"
                srcSet={imageUrls.mobile}
              />
              <source
                media="(max-width: 1023px)"
                srcSet={imageUrls.tablet}
              />
              <img
                src={imageUrls.desktop}
                alt={slide.caption || 'Pure and natural products from Go Nature Farms'}
                className="slide-image"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </picture>
            <div className="slide-mask" />
            <div className="slide-content">
              {slide.caption && <h2>{slide.caption}</h2>}
              {slide.subText && <p>{slide.subText}</p>}
            </div>
          </div>
        );
      })}
      
      {/* Left Arrow */}
      <button 
        className="slider-arrow slider-arrow-left"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      {/* Right Arrow */}
      <button 
        className="slider-arrow slider-arrow-right"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      
      <div className="slider-nav">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`snav${i === index ? ' active' : ''}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
