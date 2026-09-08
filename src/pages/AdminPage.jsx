import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab.jsx';
import AdminProductsTab from '../components/admin/AdminProductsTab.jsx';
import AdminOrdersTab from '../components/admin/AdminOrdersTab.jsx';
import AdminCouponsTab from '../components/admin/AdminCouponsTab.jsx';
import AdminReviewsTab from '../components/admin/AdminReviewsTab.jsx';
import AdminSupportTab from '../components/admin/AdminSupportTab.jsx';
import AdminUsersTab from '../components/admin/AdminUsersTab.jsx';
import AdminContentTab from '../components/admin/AdminContentTab.jsx';
import AdminSettingsTab from '../components/admin/AdminSettingsTab.jsx';
import AdminFooterTab from '../components/admin/AdminFooterTab.jsx';
import AdminVideosTab from '../components/admin/AdminVideosTab.jsx';
import AdminTestimonialsTab from '../components/admin/AdminTestimonialsTab.jsx';
import AdminWhatsAppTab from '../components/admin/AdminWhatsAppTab.jsx';
import AdminDataDeletionTab from '../components/admin/AdminDataDeletionTab.jsx';
import FloatingCart from '../components/FloatingCart.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModalNew.jsx';

const TIMER_START_TIME = 'admin_timer_start';
const TIMER_DURATION = 'admin_timer_duration';
const TIMER_EXPIRED = 'admin_timer_expired';

const TABS = [
  { key: 'analytics', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'support', label: 'Support' },
  { key: 'users', label: 'Customers' },
  { key: 'content', label: 'Content' },
  { key: 'videos', label: 'Videos' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'footer', label: 'Footer' },
  { key: 'settings', label: 'Settings' },
  { key: 'data-deletion', label: 'Data Deletion' }
];

export default function AdminPage() {
  const { user, isAdmin, adminLogin, logout, isTimerActive } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('analytics');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [timerLocked, setTimerLocked] = useState(false);

  // Check timer status on mount and when admin status changes
  useEffect(() => {
    if (isAdmin) {
      const checkTimer = () => {
        try {
          const expired = localStorage.getItem(TIMER_EXPIRED);
          const startTime = localStorage.getItem(TIMER_START_TIME);
          const duration = localStorage.getItem(TIMER_DURATION);
          
          if (expired === 'true') {
            setTimerLocked(true);
            return;
          }
          
          if (!startTime || !duration) {
            setTimerLocked(true);
            return;
          }
          
          const startTimeMs = parseInt(startTime, 10);
          const durationMs = parseInt(duration, 10) * 60 * 1000;
          
          if (isNaN(startTimeMs) || isNaN(durationMs)) {
            setTimerLocked(true);
            return;
          }
          
          const elapsed = Date.now() - startTimeMs;
          const remaining = durationMs - elapsed;
          
          setTimerLocked(remaining <= 0);
        } catch (e) {
          setTimerLocked(true);
        }
      };
      
      checkTimer();
      
      // Check timer every second
      const interval = setInterval(checkTimer, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimerLocked(false);
    }
  }, [isAdmin]);

  // ✅ FIX: Force re-render when admin logs out
  useEffect(() => {
    if (!isAdmin) {
      setTab('analytics');
    }
  }, [isAdmin]);

  if (!isAdmin) {
    const handleLogin = async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        const result = await adminLogin(form.username, form.password);
        if (result.success) {
          showToast('Login successful! Redirecting to dashboard...');
        } else {
          const errorMessage = result.message || 'Login failed. Please try again.';
          
          // Provide specific error messages
          if (errorMessage.includes('Admin account not found')) {
            showToast('Admin account not found. Please check your username.');
          } else if (errorMessage.includes('Incorrect admin password')) {
            showToast('Incorrect admin password. Please try again.');
          } else {
            showToast(errorMessage);
          }
        }
      } catch (err) {
        console.error('Admin login error:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
        
        // Provide specific error messages
        if (errorMsg.includes('Admin account not found')) {
          showToast('Admin account not found. Please check your username.');
        } else if (errorMsg.includes('Incorrect admin password')) {
          showToast('Incorrect admin password. Please try again.');
        } else {
          showToast(errorMsg);
        }
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="admin-login-shell">
        <div className="admin-card">
          <h2 style={{ marginBottom: 4 }}>Admin Login</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginBottom: 16 }}>Go Nature Farms Admin Panel</p>
          <form onSubmit={handleLogin}>
            <div className="fg">
              <label>Username</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Enter username" />
            </div>
            <div className="fg">
              <label>Password</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
          </form>
          <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => navigate('/')}>
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // Show lock screen if timer is not active
  if (timerLocked) {
    return (
      <div className="admin-login-shell">
        <div className="admin-card" style={{ 
          background: '#fff3cd', 
          border: '2px solid #ffc107',
          padding: '24px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '48px', marginBottom: 12 }}>🔒</div>
            <h2 style={{ marginBottom: 4, color: '#856404' }}>Session Locked</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginBottom: 16 }}>
              Please start the session timer to access the admin dashboard
            </p>
          </div>
          <div style={{ 
            padding: '12px',
            background: '#fff',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404',
            textAlign: 'center',
            marginBottom: 16
          }}>
            ⚠️ Timer must be active to enable tab switching and prevent automatic logout
          </div>
          <button 
            className="btn btn-secondary btn-block" 
            onClick={() => navigate('/')}
            style={{ marginBottom: 10 }}
          >
            Back to Store
          </button>
          <button 
            className="btn btn-danger btn-block" 
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ alignSelf: 'center', fontSize: '.82rem', color: 'var(--muted)' }}>Hi, {user?.name}</span>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>View Store</button>
          <button className="btn btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`fbtn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AdminAnalyticsTab />}
      {tab === 'products' && <AdminProductsTab />}
      {tab === 'orders' && <AdminOrdersTab />}
      {tab === 'coupons' && <AdminCouponsTab />}
      {tab === 'reviews' && <AdminReviewsTab />}
      {tab === 'support' && <AdminSupportTab />}
      {tab === 'users' && <AdminUsersTab />}
      {tab === 'content' && <AdminContentTab />}
      {tab === 'videos' && <AdminVideosTab />}
      {tab === 'testimonials' && <AdminTestimonialsTab />}
      {tab === 'whatsapp' && <AdminWhatsAppTab />}
      {tab === 'footer' && <AdminFooterTab />}
      {tab === 'settings' && <AdminSettingsTab />}
      {tab === 'data-deletion' && <AdminDataDeletionTab />}

      <FloatingCart onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}