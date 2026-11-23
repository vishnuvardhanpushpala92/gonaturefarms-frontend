import React, { useState, lazy, Suspense } from 'react';
import CheckoutModal from './components/CheckoutModalNew';
import CartDrawer from './components/CartDrawer.jsx';
import FloatingCart from './components/FloatingCart.jsx';
import SupportModal from './components/SupportModal.jsx';
import ReviewModal from './components/ReviewModal.jsx';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const TransactionPage = lazy(() => import('./pages/TransactionPage.jsx'));

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
  const location = useLocation();

  const [checkoutPrefill, setCheckoutPrefill] = useState(null);

  // Allow other pages (e.g. payment screen "Edit Address") to reopen checkout
  React.useEffect(() => {
    if (location.state?.openCheckout) {
      setCheckoutPrefill(location.state?.checkoutPrefill || null);
      setCheckoutOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

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

  // Clone children to pass onOpenCart and search props if they accept it
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === HomePage) {
      return React.cloneElement(child, { onOpenCart: handleOpenCart, search });
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
      <div className={showHeader ? 'main-content' : ''}>
        {childrenWithProps}
      </div>
      <CartDrawer open={cartOpen} onClose={handleCartClose} onCheckout={() => { handleCartClose(); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => { setCheckoutOpen(false); setCheckoutPrefill(null); }} prefill={checkoutPrefill} />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ReviewModal product={reviewProduct} onClose={() => setReviewProduct(null)} />
      <FloatingCart onClick={handleOpenCart} blinkCart={blinkCart} />
      <button
        className="btn-support-fab"
        style={{
          position: 'fixed',
          bottom: 170, // above FloatingCart (bottom:100 + 54px height + 16px gap)
          right: 20,
          zIndex: 999,
          borderRadius: '50%',
          width: 54,
          height: 54,
          backgroundColor: '#16a34a',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
        onClick={() => setSupportOpen(true)}
        title="Contact Support"
        aria-label="Contact Support"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 18v-6a9 9 0 0118 0v6" />
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
          <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
        </svg>
      </button>
    </>
  );
}

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20vh' }}>
    <div style={{ textAlign: 'center' }}>
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/tracking" element={<MainLayout><TrackingPage /></MainLayout>} />
        <Route path="/dashboard" element={<MainLayout><CustomerDashboard /></MainLayout>} />
        <Route path="/transaction" element={<MainLayout><TransactionPage /></MainLayout>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<MainLayout><HomePage /></MainLayout>} />
      </Routes>
    </Suspense>
  );
}