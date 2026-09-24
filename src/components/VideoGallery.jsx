import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import useSWR from 'swr';

// Add shimmer animation for skeleton loading
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .skeleton-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Inject shimmer styles
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'shimmer-styles';
  styleSheet.textContent = shimmerStyle;
  document.head.appendChild(styleSheet);
}

// SWR fetcher function
const fetcher = (url) => api.get(url).then(res => res.data);

export default function VideoGallery({ onOpenCart }) {
  const { videos: initialVideos, loaded } = useSite();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  
  // Use SWR for videos with automatic caching
  const { data: videosData, error: videosError, isLoading: videosLoading } = useSWR('/videos', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Deduplicate requests within 60 seconds
    onError: (err) => {
      console.error('SWR error loading videos:', err);
    }
  });
  
  const videos = videosData?.videos || [];

  useEffect(() => {
    setMounted(true);
  }, []);

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
      // Video will autoplay with muted and playsInline attributes
      // No need to manually call play()
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
    console.log('Video URL:', filePath);
    // Return clean URL to avoid caching issues
    return filePath;
  };

  // Get video URL from video object (handle both snake_case and camelCase)
  const getVideoUrlFromVideo = (video) => {
    const filePath = video.file_path || video.filePath;
    if (!filePath) return '';
    console.log('Video URL from object:', filePath);
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
      url.searchParams.set('f', 'jpg'); // Force output format
      return url.toString();
    } catch {
      return null;
    }
  };

  // Get poster URL with fallbacks
  const getPosterUrl = (video) => {
    // 1. Try existing poster URL (handle both snake_case and camelCase)
    if ((video.posterUrl || video.poster_url) && !isExternalImage(video.posterUrl || video.poster_url)) return video.posterUrl || video.poster_url;
    // 2. Try product image (handle both snake_case and camelCase)
    if (video.product && (video.product.img_url || video.product.imgUrl) && !isExternalImage(video.product.img_url || video.product.imgUrl)) return video.product.img_url || video.product.imgUrl;
    // 3. Try Cloudinary thumbnail from video URL (handle both snake_case and camelCase)
    const videoFilePath = video.file_path || video.filePath;
    if (videoFilePath) {
      const cloudinaryThumb = getCloudinaryThumbnail(videoFilePath);
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

  if (!mounted || videosLoading) {
    return (
      <section className="section video-section last-section">
        <div className="section-head">
          <h2>
            Watch and Buy
            <span />
          </h2>
        </div>
        <div className="video-carousel-container">
          <button className="video-nav-btn video-nav-left" disabled>‹</button>
          <div className="video-carousel-track">
            {/* Skeleton loading cards */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="video-card" style={{ pointerEvents: 'none' }}>
                <div className="video-card-wrapper">
                  <div className="skeleton-loading" style={{ 
                    height: '200px', 
                    borderRadius: '8px'
                  }} />
                </div>
                <div className="video-card-info">
                  <div className="skeleton-loading" style={{ 
                    height: '20px', 
                    borderRadius: '4px',
                    width: '80%'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <button className="video-nav-btn video-nav-right" disabled>›</button>
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
                      loading="lazy"
                      onError={() => handlePosterError(video.id)}
                    />
                  )}
                  <div className="video-play-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                  {/* Product Tag Overlay */}
                  {video.product && (
                    <div
                      className="video-product-overlay"
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
                      {video.product.img_url || video.product.imgUrl ? (
                        <img
                          src={video.product.img_url || video.product.imgUrl}
                          alt={video.product.name}
                          className="video-product-overlay-image"
                          loading="lazy"
                          onError={(e) => {
                            if (!mounted) return;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="video-product-overlay-no-image">No Image</div>
                      )}
                      <div className="video-product-overlay-details">
                        <p className="video-product-overlay-name">{video.product.name}</p>
                        <p className="video-product-overlay-price">₹{video.product.price}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="video-card-info">
                  {video.title && <h4>{video.title}</h4>}
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
            <div className="video-modal-wrapper">
              <video
                crossOrigin="anonymous"
                ref={videoRef}
                controls
                preload="metadata"
                muted
                playsInline
                src={getVideoUrlFromVideo(selectedVideo)}
                className="video-modal-video"
                onError={(e) => {
                  console.error('Video load error:', getVideoUrlFromVideo(selectedVideo), e);
                  console.error('Video error code:', e.target.error?.code);
                  console.error('Video error message:', e.target.error?.message);
                }}
                onLoadStart={() => {
                  console.log('Video load started:', getVideoUrlFromVideo(selectedVideo));
                }}
                onCanPlay={() => {
                  console.log('Video can play:', getVideoUrlFromVideo(selectedVideo));
                }}
              />
              {/* Product Tag Overlay in Modal */}
              {selectedVideo.product && (
                <div
                  className="video-modal-product-overlay"
                  onClick={(e) => handleProductClick(e, selectedVideo.product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${selectedVideo.product.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleProductClick(e, selectedVideo.product);
                    }
                  }}
                >
                  {selectedVideo.product.img_url || selectedVideo.product.imgUrl ? (
                    <img
                      src={selectedVideo.product.img_url || selectedVideo.product.imgUrl}
                      alt={selectedVideo.product.name}
                      className="video-modal-product-overlay-image"
                      loading="lazy"
                      onError={(e) => {
                        if (!mounted) return;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="video-modal-product-overlay-no-image">No Image</div>
                  )}
                  <div className="video-modal-product-overlay-details">
                    <p className="video-modal-product-overlay-name">{selectedVideo.product.name}</p>
                    <p className="video-modal-product-overlay-price">₹{selectedVideo.product.price}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="video-modal-title">
              <h3>{selectedVideo.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
