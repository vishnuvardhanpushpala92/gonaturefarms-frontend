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
`;

// Inject animation styles
if (typeof document !== 'undefined' && !document.getElementById('timeout-animation-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'timeout-animation-styles';
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

export default function HomePage({ onOpenCart, search }) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const showToast = useToast();
  const { setItemAddedCallback } = useCart();
  const { showTimeoutMessage, backendDown } = useSite();
  const navigate = useNavigate();

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
      
      {/* Admin Back Button - Only visible to authenticated admins */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
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