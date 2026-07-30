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
      console.log('VideoGallery response:', res);
      console.log('VideoGallery response.data:', res.data);
      if (res.data.success) setVideos(res.data.videos || []);
      else console.error('API returned success=false:', res.data);
    } catch (err) {
      console.error('Failed to load videos:', err);
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
    <section className="section video-section">
      <div className="section-head">
        <h2>
          Our Farm Videos
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
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                >
                  <source src={video.filePath} type="video/mp4" />
                  <source src={video.filePath} type="video/webm" />
                  <source src={video.filePath} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
                <div className="video-play-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="video-card-info">
                <h4>{video.title}</h4>
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
              ref={videoRef}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '80vh', borderRadius: '12px' }}
            >
              <source src={selectedVideo.filePath} type="video/mp4" />
              <source src={selectedVideo.filePath} type="video/webm" />
              <source src={selectedVideo.filePath} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
            <div className="video-modal-title">
              <h3>{selectedVideo.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
