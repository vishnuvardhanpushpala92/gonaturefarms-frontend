import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ FIX: Initialize user as null if they are an admin (forces re-login on every page load)
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('gnf_user') || localStorage.getItem('gnf_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin') {
          // Clear the admin token immediately to prevent unauthorized fetches!
          sessionStorage.removeItem('gnf_token');
          localStorage.removeItem('gnf_token');
          sessionStorage.removeItem('gnf_user');
          localStorage.removeItem('gnf_user');
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
    const stored = sessionStorage.getItem('gnf_token') || localStorage.getItem('gnf_token');
    const storedUser = sessionStorage.getItem('gnf_user') || localStorage.getItem('gnf_user');
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

  const register = useCallback(async (payload, config = {}) => {
    // Remove confirmPassword from payload as backend doesn't expect it
    const { confirmPassword, ...registerPayload } = payload;
    const { data } = await api.post('/auth/register', registerPayload, { timeout: 60000, ...config });
    if (data.success) persist(data.token, data.user);
    return data;
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password }, { timeout: 60000 });
    if (data.success) {
      persist(data.token, data.user);
    }
    return data;
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/admin-login', { username, password }, { timeout: 60000 });
    if (data.success) persist(data.token, data.user);
    return data;
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

  const logout = useCallback(() => persist(null, null), []);

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

  useEffect(() => {
    const onStorage = () => {
      const t = sessionStorage.getItem('gnf_token') || localStorage.getItem('gnf_token');
      if (!t && token) persist(null, null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isAuthenticated, register, login, adminLogin, logout, refreshMe, forgotPassword, resetPassword, resetPasswordWithSecurityQuestion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}