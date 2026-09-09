import React, { useState } from 'react';
import CheckoutModal from './components/CheckoutModalNew';          
import CartDrawer from './components/CartDrawer.jsx';
import FloatingCart from './components/FloatingCart.jsx';
import SupportModal from './components/SupportModal.jsx';
import ReviewModal from './components/ReviewModal.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import TrackingPage from './pages/TrackingPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

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

export default function App() {
  return (
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
  );
}