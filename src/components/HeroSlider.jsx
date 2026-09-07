import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function HeroSlider() {
  const { slides, loaded } = useSite();
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length, mounted]);

  if (!mounted || !loaded || !slides.length) return null;

  // Get image URLs with fallback for backward compatibility
  const getImageUrls = (slide) => ({
    mobile: slide.mobileImage || slide.tabletImage || slide.desktopImage || slide.imageUrl,
    tablet: slide.tabletImage || slide.desktopImage || slide.imageUrl,
    desktop: slide.desktopImage || slide.imageUrl
  });

  return (
    <div className="slider-wrap" ref={sliderRef}>
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
