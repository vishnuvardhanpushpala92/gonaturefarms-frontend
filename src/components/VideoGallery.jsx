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
  
  /* Mobile optimization for video gallery */
  @media (max-width: 768px) {
    .video-carousel-track {
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    
    .video-card {
      scroll-snap-align: start;
      flex-shrink: 0;
    }
    
    .video-card-wrapper {
      width: 85vw;
      max-width: 320px;
    }
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
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef(null);
  const videoRefs = useRef({});
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const showToast = useToast();
  
  // Use SWR for videos with automatic caching and retry logic
  const { data: videosData, error: videosError, isLoading: videosLoading } = useSWR('/videos', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Deduplicate requests within 60 seconds
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Never retry on 404 or 401 errors
      if (error.status === 404 || error.status === 401) return;
      
      // Only retry up to 3 times
      if (retryCount >= 3) return;
      
      // Retry after 2 seconds with exponential backoff
      setTimeout(() => revalidate({ retryCount }), 2000 * Math.pow(2, retryCount));
    },
    onError: (err) => {
      console.error('SWR error loading videos:', err);
    }
  });
  
  const videos = videosData?.videos || [];
  
  // Show timeout message after 5 seconds if still loading
  useEffect(() => {
    if (videosLoading) {
      const timeoutId = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000);
      return () => clearTimeout(timeoutId);
    } else {
      setShowTimeoutMessage(false);
    }
  }, [videosLoading]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle video play/pause
  const handleVideoClick = (e, video) => {
    e.stopPropagation();
    
    const videoElement = videoRefs.current[video.id];
    if (!videoElement) return;
    
    // If clicking the same video that's playing, pause it
    if (playingVideoId === video.id) {
      videoElement.pause();
      setPlayingVideoId(null);
      return;
    }
    
    // Pause any currently playing video
    if (playingVideoId && videoRefs.current[playingVideoId]) {
      videoRefs.current[playingVideoId].pause();
    }
    
    // Play the clicked video
    videoElement.play().catch(err => {
      console.error('Video play error:', err);
    });
    setPlayingVideoId(video.id);
  };

  // Handle video play state
  const handleVideoPlay = (videoId) => {
    setPlayingVideoId(videoId);
  };

  // Handle video pause state
  const handleVideoPause = (videoId) => {
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
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

  // Get video URL from video object (handle both snake_case and camelCase)
  const getVideoUrlFromVideo = (video) => {
    const filePath = video.file_path || video.filePath;
    if (!filePath) return '';
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
            {/* Skeleton loading cards with vertical aspect ratio */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="video-card" style={{ pointerEvents: 'none' }}>
                <div className="video-card-wrapper" style={{ 
                  aspectRatio: '9/16',
                  maxWidth: '280px'
                }}>
                  <div className="skeleton-loading" style={{ 
                    height: '100%', 
                    borderRadius: '12px'
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
        {/* Show timeout message if taking too long */}
        {showTimeoutMessage && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: backendDown ? '#f8d7da' : '#fff3cd',
            borderRadius: '8px',
            marginTop: '20px',
            color: backendDown ? '#721c24' : '#856404',
            maxWidth: '600px',
            margin: '20px auto'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {backendDown 
                ? 'Server temporarily unavailable. Please refresh the page.'
                : 'Loading videos... Server is taking longer than expected'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: backendDown ? '#dc3545' : '#2d5a27',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
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
            const isPlaying = playingVideoId === video.id;

            return (
              <div key={video.id} className="video-card">
                <div 
                  className="video-card-wrapper"
                  style={{ 
                    aspectRatio: '9/16',
                    maxWidth: '280px',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    backgroundColor: '#000'
                  }}
                  onClick={(e) => handleVideoClick(e, video)}
                >
                  {showPlaceholder ? (
                    <div className="video-thumbnail-placeholder" style={{ height: '100%' }}>
                      <span className="video-placeholder-icon">🎬</span>
                    </div>
                  ) : (
                    <>
                      {/* Video element with click-to-play */}
                      <video
                        ref={(el) => videoRefs.current[video.id] = el}
                        src={getVideoUrlFromVideo(video)}
                        poster={posterUrl}
                        preload="none"
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onPlay={() => handleVideoPlay(video.id)}
                        onPause={() => handleVideoPause(video.id)}
                        onClick={(e) => handleVideoClick(e, video)}
                      />
                      
                      {/* Play/Pause overlay */}
                      {!isPlaying && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
                        >
                          <span style={{ 
                            fontSize: '24px', 
                            color: '#333',
                            marginLeft: '4px'
                          }}>▶</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Product Tag - Fixed design at bottom */}
                  {video.product && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        zIndex: 20,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(e, video.product);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${video.product.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductClick(e, video.product);
                        }
                      }}
                    >
                      {video.product.img_url || video.product.imgUrl ? (
                        <img
                          src={video.product.img_url || video.product.imgUrl}
                          alt={video.product.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                          loading="lazy"
                          onError={(e) => {
                            if (!mounted) return;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '12px',
                          color: '#999'
                        }}>No Image</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{video.product.name}</p>
                        <p style={{
                          margin: '2px 0 0 0',
                          fontSize: '12px',
                          color: '#2d5a27',
                          fontWeight: '500'
                        }}>₹{video.product.price}</p>
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
    </section>
  );
}
