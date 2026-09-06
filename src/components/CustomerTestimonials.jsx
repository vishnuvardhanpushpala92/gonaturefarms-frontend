import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';

export default function CustomerTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const res = await api.get('/testimonials');
      if (res.data && res.data.success) {
        setTestimonials(Array.isArray(res.data.testimonials) ? res.data.testimonials : []);
      } else {
        console.error('API returned success=false:', res.data);
        setTestimonials([]);
      }
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      setTestimonials([]);
    }
  };

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < testimonials.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="customer-testimonials-section">
      <div className="customer-testimonials-container">
        <div className="customer-testimonials-header">
          <h2 className="customer-testimonials-title">Listen From Our Customers</h2>
        </div>
        
        <div className="customer-testimonials-slider">
          <button 
            className="customer-testimonials-nav customer-testimonials-nav-left" 
            onClick={scrollLeft}
            disabled={currentIndex === 0}
          >
            <span>‹</span>
          </button>
          
          <div className="customer-testimonials-content">
            <div className="customer-testimonials-stars">
              {renderStars(currentTestimonial.rating)}
            </div>
            <p className="customer-testimonials-quote">
              "{currentTestimonial.quote}"
            </p>
            <div className="customer-testimonials-author">
              {currentTestimonial.avatarUrl && (
                <img 
                  src={currentTestimonial.avatarUrl} 
                  alt={currentTestimonial.customerName}
                  className="customer-testimonials-avatar"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <span className="customer-testimonials-name">
                {currentTestimonial.customerName}
              </span>
            </div>
          </div>
          
          <button 
            className="customer-testimonials-nav customer-testimonials-nav-right" 
            onClick={scrollRight}
            disabled={currentIndex === testimonials.length - 1}
          >
            <span>›</span>
          </button>
        </div>
        
        <div className="customer-testimonials-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`customer-testimonials-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}