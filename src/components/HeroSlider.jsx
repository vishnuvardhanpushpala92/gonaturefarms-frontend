import React, { useEffect, useState, useRef } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { getResponsiveImageUrls, getImageDimensions } from '../utils/imageOptimizer.js';

export default function HeroSlider() {
  const { slides, loaded, layout } = useSite();
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  // Get layout settings with defaults
  const heroHeightDesktop = layout?.heroHeightDesktop || 450;
  const heroHeightTablet = layout?.heroHeightTablet || 320;
  const heroHeightMobile = layout?.heroHeightMobile || 250;
  const heroImageFit = layout?.heroImageFit || 'contain';
  const heroImagePosition = layout?.heroImagePosition || 'center';
  const heroBackgroundColor = layout?.heroBackgroundColor || '#f5f5f0';
  const showHero = layout?.showHero !== false; // Default true

  // Add responsive height style
  const sliderStyle = {
    backgroundColor: heroBackgroundColor
  };

  const slideStyle = {
    desktop: { height: `${heroHeightDesktop}px` },
    tablet: { height: `${heroHeightTablet}px` },
    mobile: { height: `${heroHeightMobile}px` }
  };

  // Preload first slide image for LCP with optimization
  useEffect(() => {
    if (slides.length > 0) {
      const firstSlide = slides[0];
      const primaryImage = firstSlide.desktopImage || firstSlide.imageUrl;
      const imageUrls = getResponsiveImageUrls(primaryImage);
      const img = new Image();
      img.src = imageUrls.desktop;
      img.fetchPriority = 'high';
    }
  }, [slides]);

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

  if (!loaded || !slides.length || !showHero) return null;

  return (
    <div className="slider-wrap" ref={sliderRef} onKeyDown={handleKeyDown} tabIndex={0} style={sliderStyle}>
      {slides.map((slide, i) => {
        const imageUrls = getResponsiveImageUrls(
          slide.desktopImage || slide.imageUrl
        );
        return (
          <div
            key={slide.id}
            className={`slide${i === index ? ' active' : ''}`}
            style={{
              height: `${window.innerWidth < 768 ? heroHeightMobile : window.innerWidth < 1024 ? heroHeightTablet : heroHeightDesktop}px`,
              width: '100%'
            }}
          >
            <picture className="hero-picture" style={{ width: '100%', display: 'block' }}>
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
                fetchPriority={i === 0 ? 'high' : 'auto'}
                style={{
                  objectFit: heroImageFit,
                  objectPosition: heroImagePosition,
                  width: '100%',
                  height: 'auto',
                  maxWidth: 'none'
                }}
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
