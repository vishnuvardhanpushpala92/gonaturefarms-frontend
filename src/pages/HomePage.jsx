import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import PromoStrip from '../components/PromoStrip.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import VideoGallery from '../components/VideoGallery.jsx';
import Footer from '../components/Footer.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModalNew.jsx';
import AuthModal from '../components/AuthModal.jsx';
import OrdersModal from '../components/OrdersModal.jsx';
import SupportModal from '../components/SupportModal.jsx';
import ReviewModal from '../components/ReviewModal.jsx';
import FlowerBlast from '../components/FlowerBlast.jsx';
import FloatingThemePanel from '../components/FloatingThemePanel.jsx';
import FloatingCart from '../components/FloatingCart.jsx';
import ScrollingBlocks from '../components/ScrollingBlocks.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const showToast = useToast();
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(false);
  const [blinkLogin, setBlinkLogin] = useState(false);
  const [blinkCart, setBlinkCart] = useState(false);
  const [cartAutoCloseTimer, setCartAutoCloseTimer] = useState(null);

  // Show auth modal on first visit if not authenticated
  useEffect(() => {
    const hasVisited = localStorage.getItem('gnf_visited');
    if (!hasVisited && !isAuthenticated) {
      setAuthOpen(true);
      setBlinkLogin(true);
      localStorage.setItem('gnf_visited', 'true');
      setTimeout(() => setBlinkLogin(false), 3000);
    }
  }, [isAuthenticated]);

  // Show auth modal after 10 seconds if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        setAuthOpen(true);
        setBlinkLogin(true);
        setTimeout(() => setBlinkLogin(false), 3000);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Show welcome message after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const hasShownWelcome = sessionStorage.getItem('gnf_welcome_shown');
      if (!hasShownWelcome) {
        showToast(`Welcome ${user?.name || 'back'}! Thank you for registering.`);
        sessionStorage.setItem('gnf_welcome_shown', 'true');
      }
    }
  }, [isAuthenticated, user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cartAutoCloseTimer) {
        clearTimeout(cartAutoCloseTimer);
      }
    };
  }, []);

  const handleOpenCart = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      setBlinkCart(true);
      setTimeout(() => setBlinkCart(false), 3000);
      return;
    }
    
    // Clear existing timer if any
    if (cartAutoCloseTimer) {
      clearTimeout(cartAutoCloseTimer);
    }
    
    // Open cart
    setCartOpen(true);
    
    // Set 5-second auto-close timer
    const timer = setTimeout(() => {
      setCartOpen(false);
      setCartAutoCloseTimer(null);
    }, 5000);
    
    setCartAutoCloseTimer(timer);
  };

  const handleCartClose = () => {
    // Clear timer if manually closed
    if (cartAutoCloseTimer) {
      clearTimeout(cartAutoCloseTimer);
      setCartAutoCloseTimer(null);
    }
    setCartOpen(false);
  };

  return (
    <>
      <FlowerBlast />
      <FloatingThemePanel />
      <Header
        search={search}
        onSearch={setSearch}
        onOpenCart={handleOpenCart}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => navigate('/admin')}
        blinkLogin={blinkLogin}
        blinkCart={blinkCart}
      />
      <div id="top">
        <HeroSlider />
        <PromoStrip />
        <ScrollingBlocks />
      </div>
      <div id="products">
        <ProductGrid search={search} onOpenReviews={setReviewProduct} />
      </div>
      <VideoGallery onOpenCart={handleOpenCart} />
      <Footer onOpenSupport={() => setSupportOpen(true)} />

      <CartDrawer open={cartOpen} onClose={handleCartClose} onCheckout={() => { handleCartClose(); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ReviewModal product={reviewProduct} onClose={() => setReviewProduct(null)} />

      <FloatingCart onClick={handleOpenCart} blinkCart={blinkCart} />
      <button
        className="btn-wa"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, borderRadius: '50%', width: 54, height: 54 }}
        onClick={() => setSupportOpen(true)}
        title="Contact Support"
      >
        💬
      </button>
    </>
  );
}