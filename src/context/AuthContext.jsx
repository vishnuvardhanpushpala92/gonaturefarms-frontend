import React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('gnf_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('gnf_token'));

  const persist = (t, u) => {
    if (t) sessionStorage.setItem('gnf_token', t); else sessionStorage.removeItem('gnf_token');
    if (u) sessionStorage.setItem('gnf_user', JSON.stringify(u)); else sessionStorage.removeItem('gnf_user');
    setToken(t);
    setUser(u);
  };

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
    // Keep local state in sync if the interceptor clears storage on a 401 elsewhere.
    const onStorage = () => {
      const t = sessionStorage.getItem('gnf_token');
      if (!t && token) persist(null, null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, register, login, adminLogin, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
