import React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ Try to read from both storages for backward compatibility
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('gnf_user') || localStorage.getItem('gnf_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('gnf_token') || localStorage.getItem('gnf_token'));

  const persist = (t, u) => {
    if (t) {
      sessionStorage.setItem('gnf_token', t);
      localStorage.setItem('gnf_token', t);
    } else {
      sessionStorage.removeItem('gnf_token');
      localStorage.removeItem('gnf_token');
    }
    if (u) {
      sessionStorage.setItem('gnf_user', JSON.stringify(u));
      localStorage.setItem('gnf_user', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('gnf_user');
      localStorage.removeItem('gnf_user');
    }
    setToken(t);
    setUser(u);
  };

  // ✅ FIX: Clear any stored admin session on page load to force re-login
  useEffect(() => {
    const storedUser = localStorage.getItem('gnf_user') || sessionStorage.getItem('gnf_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'admin') {
          // Force logout for admin on every page load
          persist(null, null);
          console.log('Admin session cleared. Must log in again.');
        }
      } catch (e) {
        persist(null, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.success) persist(data.token, data.user);
    return data;
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    if (data.success) persist(data.token, data.user);
    return data;
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/admin-login', { username, password });
    if (data.success) persist(data.token, data.user);
    return data;
  }, []);

  const forgotPassword = useCallback(async (identifier) => {
    const { data } = await api.post('/auth/forgot-password/verify', { identifier });
    return data;
  }, []);

  const resetPassword = useCallback(async (payload) => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  }, []);

  const logout = useCallback(() => persist(null, null), []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) return data;
    } catch {
      // token invalid/expired — interceptor already cleared storage on 401
    }
    return null;
  }, [token]);

  useEffect(() => {
    const onStorage = () => {
      const t = sessionStorage.getItem('gnf_token') || localStorage.getItem('gnf_token');
      if (!t && token) persist(null, null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, register, login, adminLogin, logout, refreshMe, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}