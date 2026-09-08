import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminLockOverlay() {
  const { isLocked, isAdmin, isAuthenticated, unlockAdminSession, logout } = useAuth();
  const showToast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isLocked || !isAdmin || !isAuthenticated) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await unlockAdminSession(password);
      if (result.success) {
        showToast('Session unlocked successfully');
        setPassword('');
      } else {
        showToast(result.message || 'Invalid password');
      }
    } catch (err) {
      showToast('Failed to unlock session');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    setPassword('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '2px solid #dc3545'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '600',
            color: '#dc3545'
          }}>
            Admin Session Locked
          </h2>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            Your admin session has expired. Please enter your password to continue.
          </p>
        </div>

        <form onSubmit={handleUnlock}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#333'
            }}>
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              marginBottom: '12px'
            }}
          >
            {busy ? 'Verifying...' : 'Unlock Session'}
          </button>
        </form>

        <div style={{ 
          display: 'flex', 
          gap: '12px',
          borderTop: '1px solid #eee',
          paddingTop: '16px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: '10px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#856404',
          textAlign: 'center'
        }}>
          ⚠️ For security reasons, your session was locked due to inactivity or timer expiration.
        </div>
      </div>
    </div>
  );
}
