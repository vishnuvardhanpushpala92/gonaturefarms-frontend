import React from 'react';
import { useState } from 'react';
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
import AdminWhatsAppTab from '../components/admin/AdminWhatsAppTab.jsx';
import FloatingCart from '../components/FloatingCart.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';

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
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'footer', label: 'Footer' },
  { key: 'settings', label: 'Settings' }
];

export default function AdminPage() {
  const { user, isAdmin, adminLogin, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('analytics');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isAdmin) {
    const handleLogin = async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        const data = await adminLogin(form.username, form.password);
        if (data && data.success) {
          showToast('Login successful! Redirecting to dashboard...');
        } else {
          showToast(data?.message || 'Invalid credentials');
        }
      } catch (err) {
        console.error('Admin login error:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
        showToast(errorMsg);
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

  return (
    <div className="admin-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
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
      {tab === 'whatsapp' && <AdminWhatsAppTab />}
      {tab === 'footer' && <AdminFooterTab />}
      {tab === 'settings' && <AdminSettingsTab />}

      <FloatingCart onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
