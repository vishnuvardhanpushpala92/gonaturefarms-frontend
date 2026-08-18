import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import PromoStrip from '../components/PromoStrip.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import VideoGallery from '../components/VideoGallery.jsx';
import FaqSection from '../components/FaqSection.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Footer from '../components/Footer.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import AuthModal from '../components/AuthModal.jsx';
import OrdersModal from '../components/OrdersModal.jsx';
import SupportModal from '../components/SupportModal.jsx';
import ReviewModal from '../components/ReviewModal.jsx';
import FlowerBlast from '../components/FlowerBlast.jsx';
import FloatingThemePanel from '../components/FloatingThemePanel.jsx';
import FloatingCart from '../components/FloatingCart.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);

  return (
    <>
      <FlowerBlast />
      <FloatingThemePanel />
      <Header
        search={search}
        onSearch={setSearch}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => navigate('/admin')}
      />
      <HeroSlider />
      <PromoStrip />
      <TrustBadges />
      <ProductGrid search={search} onOpenReviews={setReviewProduct} />
      <VideoGallery />
      <Testimonials />
      <FaqSection />
      <Footer onOpenSupport={() => setSupportOpen(true)} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ReviewModal product={reviewProduct} onClose={() => setReviewProduct(null)} />

      <FloatingCart onClick={() => setCartOpen(true)} />
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
