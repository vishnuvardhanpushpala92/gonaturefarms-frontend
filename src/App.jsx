import React, { useState, lazy, Suspense } from 'react';
import CheckoutModal from './components/CheckoutModalNew';
import CartDrawer from './components/CartDrawer.jsx';
import FloatingCart from './components/FloatingCart.jsx';
import SupportModal from './components/SupportModal.jsx';
import ReviewModal from './components/ReviewModal.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Lazy load routes for better performance
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'));
const TrackingPage = lazy(() => import('./pages/TrackingPage.jsx'));

function MainLayout({ children, showHeader = true }) {
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(false);
  const [blinkLogin, setBlinkLogin] = useState(false);
  const [blinkCart, setBlinkCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleOpenCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCartOpen(true);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  // Clone children to pass onOpenCart prop if they accept it
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === HomePage) {
      return React.cloneElement(child, { onOpenCart: handleOpenCart });
    }
    return child;
  });

  return (
    <>
      {showHeader && (
        <Header
          search={search}
          onSearch={setSearch}
          onOpenCart={handleOpenCart}
          blinkLogin={blinkLogin}
          blinkCart={blinkCart}
        />
      )}
      {childrenWithProps}
      <CartDrawer open={cartOpen} onClose={handleCartClose} onCheckout={() => { handleCartClose(); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
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

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🌱</div>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tracking" element={<MainLayout><TrackingPage /></MainLayout>} />
        <Route path="/dashboard" element={<MainLayout><CustomerDashboard /></MainLayout>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<MainLayout><HomePage /></MainLayout>} />
      </Routes>
    </Suspense>
  );
}