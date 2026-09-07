import React from 'react';
import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

export default function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await api.get('/videos');
      if (res.data && res.data.success) {
        setVideos(Array.isArray(res.data.videos) ? res.data.videos : []);
      } else {
        console.error('API returned success=false:', res.data);
        setVideos([]);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
      setVideos([]);
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

  // Add cache-buster to video URLs to prevent Cloudinary 404s
  const getVideoUrl = (filePath) => {
    if (!filePath) return '';
    // Add cache-buster parameter
    return `${filePath}?v=${Date.now()}`;
  };

  // Get poster URL or fallback to product image
  const getPosterUrl = (video) => {
    if (video.posterUrl) return video.posterUrl;
    if (video.product && video.product.imgUrl) return video.product.imgUrl;
    return ''; // No fallback - will use black background
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeVideo();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (videos.length === 0) return null;

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
                  <div className="video-product-info">
                    <img 
                      src={video.product.imgUrl || ''} 
                      alt={video.product.name}
                      className="video-product-image"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="video-product-details">
                      <p className="video-product-name">{video.product.name}</p>
                      <p className="video-product-price">₹{video.product.price}</p>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
