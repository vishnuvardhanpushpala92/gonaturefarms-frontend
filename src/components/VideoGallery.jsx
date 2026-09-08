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
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadVideos();
  }, [mounted]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos');
      if (res.data && res.data.success) {
        setVideos(Array.isArray(res.data.videos) ? res.data.videos : []);
      } else {
        setVideos([]);
      }
    } catch (err) {
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
    if (mounted) {
      setSelectedVideo(video);
    }
  };

  const [posterStates, setPosterStates] = useState({});

  const handlePosterError = (videoId) => {
    if (!mounted) return;
    setPosterStates(prev => ({ ...prev, [videoId]: 'error' }));
  };

  // Get video URL with proper caching handling
  const getVideoUrl = (filePath) => {
    if (!filePath) return '';
    // Return clean URL to avoid caching issues
    return filePath;
  };

  // Check if image URL is from external domain (may have CORS issues)
  const isExternalImage = (url) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      // Only check for external domains, not during SSR
      if (typeof window === 'undefined') return false;
      const currentDomain = window.location.hostname;
      return urlObj.hostname !== currentDomain &&
             !urlObj.hostname.includes('cloudinary.com') &&
             !urlObj.hostname.includes('gonaturefarms');
    } catch {
      return false;
    }
  };

  // Generate Cloudinary thumbnail URL from video URL
  const getCloudinaryThumbnail = (videoUrl) => {
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) return null;
    try {
      // Cloudinary video thumbnail transformation: replace video extension with .jpg and add so_0 to get first frame
      const url = new URL(videoUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const folderPath = pathParts.slice(0, pathParts.length - 1).join('/');
      url.pathname = `${folderPath}/${nameWithoutExt}.jpg`;
      url.searchParams.set('so', '0'); // Get first frame
      url.searchParams.set('w', '400');
      url.searchParams.set('h', '300');
      url.searchParams.set('c', 'fill');
      return url.toString();
    } catch {
      return null;
    }
  };

  // Get poster URL with fallbacks
  const getPosterUrl = (video) => {
    // 1. Try existing poster URL
    if (video.posterUrl && !isExternalImage(video.posterUrl)) return video.posterUrl;
    // 2. Try product image
    if (video.product && video.product.imgUrl && !isExternalImage(video.product.imgUrl)) return video.product.imgUrl;
    // 3. Try Cloudinary thumbnail from video URL
    if (video.filePath) {
      const cloudinaryThumb = getCloudinaryThumbnail(video.filePath);
      if (cloudinaryThumb) return cloudinaryThumb;
    }
    // 4. Return null to use fallback placeholder
    return null;
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

  if (!mounted || loading) {
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
          {videos.map((video) => {
            const posterUrl = getPosterUrl(video);
            const posterState = posterStates[video.id];
            const showPlaceholder = !posterUrl || posterState === 'error';

            return (
              <div key={video.id} className="video-card" onClick={() => openVideo(video)}>
                <div className="video-card-wrapper">
                  {showPlaceholder ? (
                    <div className="video-thumbnail-placeholder">
                      <span className="video-placeholder-icon">🎬</span>
                    </div>
                  ) : (
                    <img
                      src={posterUrl}
                      alt={video.title}
                      className="video-thumbnail"
                      onError={() => handlePosterError(video.id)}
                    />
                  )}
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
                      {video.product.imgUrl ? (
                        <img
                          src={video.product.imgUrl}
                          alt={video.product.name}
                          className="video-product-image"
                          onError={(e) => {
                            if (!mounted) return;
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = '#f3f4f6';
                            const errorDiv = document.createElement('div');
                            errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#f3f4f6;border-radius:8px;color:#999;font-size:12px;';
                            errorDiv.textContent = 'No Image';
                            e.target.parentElement.appendChild(errorDiv);
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', color: '#999', fontSize: '12px' }}>
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
            );
          })}
        </div>
        <button className="video-nav-btn video-nav-right" onClick={scrollRight}>
          ›
        </button>
      </div>

      {selectedVideo && mounted && (
        <div className="video-modal" onClick={closeVideo}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeVideo}>×</button>
            <video
              crossOrigin="anonymous"
              ref={videoRef}
              controls
              preload="none"
              src={getVideoUrl(selectedVideo.filePath)}
              style={{ width: '100%', maxHeight: '80vh', borderRadius: '12px' }}
              onLoadedData={() => videoRef.current?.play()}
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
