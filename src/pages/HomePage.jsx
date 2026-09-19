import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/HeroSlider.jsx';
import PromoStrip from '../components/PromoStrip.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import VideoGallery from '../components/VideoGallery.jsx';
import Footer from '../components/Footer.jsx';
import FlowerBlast from '../components/FlowerBlast.jsx';
import ScrollingBlocks from '../components/ScrollingBlocks.jsx';
import HomePageSkeleton from '../components/HomePageSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

export default function HomePage({ onOpenCart, search }) {
  const { isAuthenticated, user } = useAuth();
  const showToast = useToast();
  const { setItemAddedCallback } = useCart();
  const { loaded, error, retry } = useSite();

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
      
      {/* Show skeleton while loading - renders immediately */}
      {!loaded && !error && <HomePageSkeleton />}
      
      {/* Show error state with retry button - Fixed container to prevent layout shift */}
      {error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', minHeight: '200px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#dc2626' }}>Failed to load content</div>
          <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={retry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2d5a27',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Show actual content when loaded */}
      {loaded && (
        <>
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
      )}
    </>
  );
}