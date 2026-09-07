import React from 'react';
import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function VideoGallery({ onOpenCart }) {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos');
      console.log('Videos API response:', res.data);
      if (res.data && res.data.success) {
        setVideos(Array.isArray(res.data.videos) ? res.data.videos : []);
      } else {
        console.error('API returned success=false:', res.data);
        setVideos([]);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const openVideo = (video) => {
    setSelectedVideo(video);
  };

  // Get video URL (removed cache-buster to prevent infinite re-renders)
  const getVideoUrl = (filePath) => {
    if (!filePath) return '';
    return filePath;
  };

  // Check if image URL is from external domain (may have CORS issues)
  const isExternalImage = (url) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      const currentDomain = window.location.hostname;
      return urlObj.hostname !== currentDomain && 
             !urlObj.hostname.includes('cloudinary.com') &&
             !urlObj.hostname.includes('gonaturefarms');
    } catch {
      return false;
    }
  };

  // Get poster URL or fallback to product image (avoid external images to prevent CORS)
  const getPosterUrl = (video) => {
    if (video.posterUrl && !isExternalImage(video.posterUrl)) return video.posterUrl;
    if (video.product && video.product.imgUrl && !isExternalImage(video.product.imgUrl)) return video.product.imgUrl;
    return ''; // No fallback - will use black background
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Please login or register to add items to cart');
      return;
    }
    if (!product) {
      showToast('Product not available');
      return;
    }
    addItem(product);
    // Open cart preview after adding
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const handleProductClick = (e, product) => {
    e.stopPropagation();
    if (!product) return;
    // For now, just add to cart. In future, could open product detail modal
    handleAddToCart(e, product);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeVideo();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return (
      <section className="section video-section last-section">
        <div className="section-head">
          <h2>
            Watch and Buy
            <span />
          </h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Loading videos...
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="section video-section last-section">
        <div className="section-head">
          <h2>
            Watch and Buy
            <span />
          </h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No videos available at the moment.
        </div>
      </section>
    );
  }

  return (
    <section className="section video-section last-section">
      <div className="section-head">
        <h2>
          Watch and Buy
          <span />
        </h2>
      </div>
      <div className="video-carousel-container">
        <button className="video-nav-btn video-nav-left" onClick={scrollLeft}>
          ‹
        </button>
        <div className="video-carousel-track" ref={carouselRef}>
          {videos.map((video) => (
            <div key={video.id} className="video-card" onClick={() => openVideo(video)}>
              <div className="video-card-wrapper">
                <video
                  crossOrigin="anonymous"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={getPosterUrl(video)}
                  src={getVideoUrl(video.filePath)}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    backgroundColor: '#000' 
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = '#f0f0f0';
                    e.target.parentElement.innerHTML = `
                      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">
                        Video Unavailable
                      </div>
                    `;
                  }}
                />
                <div className="video-play-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="video-card-info">
                <h4>{video.title}</h4>
                {video.product && (
                  <div 
                    className="video-product-info clickable"
                    onClick={(e) => handleProductClick(e, video.product)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${video.product.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProductClick(e, video.product);
                      }
                    }}
                  >
                    {!isExternalImage(video.product.imgUrl) ? (
                      <img 
                        src={video.product.imgUrl || ''} 
                        alt={video.product.name}
                        className="video-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = '#f3f4f6';
                          e.target.parentElement.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#f3f4f6;border-radius:8px;color:#999;font-size:12px;">
                              No Image
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#f3f4f6;border-radius:8px;color:#999;font-size:12px;">
                        No Image
                      </div>
                    )}
                    <div className="video-product-details">
                      <p className="video-product-name">{video.product.name}</p>
                      <p className="video-product-price">₹{video.product.price}</p>
                      <button 
                        className="video-add-to-cart-btn"
                        onClick={(e) => handleAddToCart(e, video.product)}
                        aria-label="Add to cart"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="video-nav-btn video-nav-right" onClick={scrollRight}>
          ›
        </button>
      </div>

      {selectedVideo && (
        <div className="video-modal" onClick={closeVideo}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeVideo}>×</button>
            <video
              crossOrigin="anonymous"
              ref={videoRef}
              controls
              autoPlay
              src={getVideoUrl(selectedVideo.filePath)}
              style={{ width: '100%', maxHeight: '80vh', borderRadius: '12px' }}
            />
            <div className="video-modal-title">
              <h3>{selectedVideo.title}</h3>
              {selectedVideo.product && (
                <div className="video-modal-product">
                  <p className="video-modal-product-name">{selectedVideo.product.name}</p>
                  <p className="video-modal-product-price">₹{selectedVideo.product.price}</p>
                  <button 
                    className="video-modal-add-to-cart-btn"
                    onClick={(e) => handleAddToCart(e, selectedVideo.product)}
                    aria-label="Add to cart"
                  >
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
