import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider.jsx';
import PromoStrip from '../components/PromoStrip.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import VideoGallery from '../components/VideoGallery.jsx';
import Footer from '../components/Footer.jsx';
import FlowerBlast from '../components/FlowerBlast.jsx';
import ScrollingBlocks from '../components/ScrollingBlocks.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

// Add animation styles for timeout message
const animationStyles = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  .admin-back-button {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    background-color: #28a745;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .admin-back-button:hover {
    background-color: #218838;
  }
  
  @media (max-width: 768px) {
    .admin-back-button {
      top: 70px;
      right: 10px;
      padding: 10px 16px;
      font-size: 12px;
    }
  }
`;

// Inject animation styles
if (typeof document !== 'undefined' && !document.getElementById('timeout-animation-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'timeout-animation-styles';
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

export default function HomePage({ onOpenCart, search }) {
  const { isAuthenticated, user, isAdmin, isTimerActive, isSessionExpired, isLocked } = useAuth();
  const showToast = useToast();
  const { setItemAddedCallback } = useCart();
  const { showTimeoutMessage, backendDown } = useSite();
  const navigate = useNavigate();

  // Check if admin session is valid for preview navigation
  const isPreviewModeEnabled = isAdmin && isTimerActive && !isSessionExpired && !isLocked;

  const handleBackToAdmin = () => {
    if (isPreviewModeEnabled) {
      // Session is valid, navigate directly to admin dashboard
      navigate('/admin');
    } else {
      // Session is invalid (timer stopped/expired/locked), navigate to admin login
      // The expired session will be detected by AdminPage and show login form
      navigate('/admin');
    }
  };

  // Set up cart callback to automatically open drawer when item is added
  useEffect(() => {
    const callback = () => {
      // Cart drawer is handled by MainLayout
    };
    setItemAddedCallback(callback);
  }, [setItemAddedCallback]);

  // Show welcome message after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const hasShownWelcome = sessionStorage.getItem('gnf_welcome_shown');
      if (!hasShownWelcome) {
        showToast(`Welcome ${user?.name || 'back'}! Thank you for registering.`);
        sessionStorage.setItem('gnf_welcome_shown', 'true');
      }
    }
  }, [isAuthenticated, user, showToast]);

  return (
    <>
      <FlowerBlast />
      
      {/* Admin Back Button - Only visible when admin session is valid and timer is active */}
      {isPreviewModeEnabled && (
        <button
          className="admin-back-button"
          onClick={handleBackToAdmin}
          title="Return to Admin Dashboard (Session Active)"
        >
          ← Back to Admin
        </button>
      )}
      
      {/* Global timeout message for slow backend */}
      {showTimeoutMessage && (
        <div style={{ 
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: backendDown ? '#f8d7da' : '#fff3cd',
          color: backendDown ? '#721c24' : '#856404',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '90%',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          {backendDown 
            ? 'Server is temporarily unavailable. Please try again later or refresh the page.'
            : 'Loading content... Server is taking longer than expected (this is normal on free hosting)'}
        </div>
      )}
      
      {/* Always render layout immediately - no blocking loading screen */}
      <div id="top">
        <div className="slider-wrap-container">
          <HeroSlider />
        </div>
        <PromoStrip />
        <ScrollingBlocks />
      </div>
      <div id="products">
        <ProductGrid search={search} onOpenCart={onOpenCart} />
      </div>
      <VideoGallery onOpenCart={onOpenCart} />
      <Footer />
    </>
  );
}