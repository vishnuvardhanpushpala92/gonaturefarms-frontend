import React, { useState, useEffect } from 'react';
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

export default function HomePage({ onOpenCart, search }) {
  const { isAuthenticated, user } = useAuth();
  const showToast = useToast();
  const { setItemAddedCallback } = useCart();

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