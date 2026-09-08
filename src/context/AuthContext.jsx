import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

const TIMER_START_TIME = 'admin_timer_start';
const TIMER_DURATION = 'admin_timer_duration';
const TIMER_EXPIRED = 'admin_timer_expired';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ FIX: Initialize user as null if they are an admin (forces re-login on every page load)
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('gnf_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin') {
          // Clear the admin token immediately to prevent unauthorized fetches!
          sessionStorage.removeItem('gnf_token');
          sessionStorage.removeItem('gnf_user');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    const stored = sessionStorage.getItem('gnf_token');
    const storedUser = sessionStorage.getItem('gnf_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'admin') return null; // No token for admins on fresh load
      } catch (e) {
        return null;
      }
    }
    return stored;
  });

  const persist = (t, u) => {
    if (t) {
      sessionStorage.setItem('gnf_token', t);
    } else {
      sessionStorage.removeItem('gnf_token');
    }
    if (u) {
      sessionStorage.setItem('gnf_user', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('gnf_user');
    }
    setToken(t);
    setUser(u);
    // Note: Cart is preserved independently in CartContext
  };

  const register = useCallback(async (payload, config = {}) => {
    // Remove confirmPassword from payload as backend doesn't expect it
    const { confirmPassword, ...registerPayload } = payload;
    const { data } = await api.post('/auth/register', registerPayload, { timeout: 60000, ...config });
    if (data.success) persist(data.token, data.user);
    return data;
  }, []);

  const login = useCallback(async (identifier, password) => {
    try {
      const { data } = await api.post('/auth/login', { identifier, password }, { timeout: 60000 });
      if (data.success) {
        persist(data.token, data.user);
        return data;
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    try {
      const { data } = await api.post('/auth/admin-login', { username, password }, { timeout: 60000 });
      if (data.success) {
        persist(data.token, data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Admin login failed' };
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Admin login failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const forgotPassword = useCallback(async (identifier) => {
    try {
      const { data } = await api.post('/auth/forgot-password/verify', { identifier }, { timeout: 60000 });
      return data;
    } catch (err) {
      // Fallback to the basic forgot-password endpoint if verify endpoint doesn't exist
      if (err.response?.status === 404) {
        console.warn('Verify endpoint not found, falling back to basic forgot-password');
        const { data } = await api.post('/auth/forgot-password', { identifier }, { timeout: 60000 });
        return data;
      }
      throw err;
    }
  }, []);

  const resetPasswordWithSecurityQuestion = useCallback(async (payload) => {
    const { data } = await api.post('/auth/reset-password/security-question', payload, { timeout: 60000 });
    return data;
  }, []);

  const resetPassword = useCallback(async (payload) => {
    const { data } = await api.post('/auth/reset-password', payload, { timeout: 60000 });
    return data;
  }, []);

  const logout = useCallback(() => {
    // Clear only auth tokens, preserve cart
    sessionStorage.removeItem('gnf_token');
    sessionStorage.removeItem('gnf_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me', { timeout: 60000 });
      if (data.success) return data;
    } catch {
      return null;
    }
    return null;
  }, [token]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  // Check if admin timer is active
  const isTimerActive = useCallback(() => {
    if (!isAdmin || !isAuthenticated) return false;
    
    try {
      const expired = localStorage.getItem(TIMER_EXPIRED);
      if (expired === 'true') return false;
      
      const startTime = localStorage.getItem(TIMER_START_TIME);
      const duration = localStorage.getItem(TIMER_DURATION);
      
      if (!startTime || !duration) return false;
      
      const startTimeMs = parseInt(startTime, 10);
      const durationMs = parseInt(duration, 10) * 60 * 1000;
      
      if (isNaN(startTimeMs) || isNaN(durationMs)) return false;
      
      const elapsed = Date.now() - startTimeMs;
      const remaining = durationMs - elapsed;
      
      return remaining > 0;
    } catch (e) {
      return false;
    }
  }, [isAdmin, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isAuthenticated, register, login, adminLogin, logout, refreshMe, forgotPassword, resetPassword, resetPasswordWithSecurityQuestion, isTimerActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}