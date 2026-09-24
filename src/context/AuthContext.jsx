import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/client';
import { safeLocalStorage, safeSessionStorage } from './SiteContext';

const TIMER_START_TIME = 'admin_timer_start';
const TIMER_DURATION = 'admin_timer_duration';
const TIMER_EXPIRED = 'admin_timer_expired';
const TIMER_STARTED = 'admin_timer_started';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = safeSessionStorage.getItem('gnf_user') || safeLocalStorage.getItem('gnf_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin') {
          safeSessionStorage.removeItem('gnf_token');
          safeSessionStorage.removeItem('gnf_user');
          safeLocalStorage.removeItem('gnf_token');
          safeLocalStorage.removeItem('gnf_user');
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
    const stored = safeSessionStorage.getItem('gnf_token') || safeLocalStorage.getItem('gnf_token');
    const storedUser = safeSessionStorage.getItem('gnf_user') || safeLocalStorage.getItem('gnf_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'admin') return null;
      } catch (e) {
        return null;
      }
    }
    return stored;
  });

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasTimerStarted, setHasTimerStarted] = useState(false);
  const intervalRef = useRef(null);
  const showWarningRef = useRef(false);
  const startTimeRef = useRef(null);
  const durationRef = useRef(null);
  const previousPathRef = useRef(window.location.pathname);

  // Derived state - must be computed before functions that use them
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  const persist = (t, u) => {
    if (t) {
      safeSessionStorage.setItem('gnf_token', t);
      safeLocalStorage.setItem('gnf_token', t);
    } else {
      safeSessionStorage.removeItem('gnf_token');
      safeLocalStorage.removeItem('gnf_token');
    }
    if (u) {
      safeSessionStorage.setItem('gnf_user', JSON.stringify(u));
      safeLocalStorage.setItem('gnf_user', JSON.stringify(u));
    } else {
      safeSessionStorage.removeItem('gnf_user');
      safeLocalStorage.removeItem('gnf_user');
    }
    setToken(t);
    setUser(u);
    // Note: Cart is preserved independently in CartContext
  };

  const register = useCallback(async (payload, config = {}) => {
    // Remove confirmPassword from payload as backend doesn't expect it
    const { confirmPassword, ...registerPayload } = payload;
    const { data } = await api.post('/auth/register', registerPayload, { timeout: 60000, ...config });
    // DO NOT auto-login after registration - let user login explicitly
    // if (data.success) {
    //   console.log('[REGISTER] Token received from backend:', data.token ? 'present' : 'missing');
    //   console.log('[REGISTER] User received from backend:', data.user ? 'present' : 'missing');
    //   persist(data.token, data.user);
    //   console.log('[REGISTER] After persist - safeSessionStorage token:', safeSessionStorage.getItem('gnf_token') ? 'present' : 'missing');
    //   console.log('[REGISTER] After persist - safeLocalStorage token:', safeLocalStorage.getItem('gnf_token') ? 'present' : 'missing');
    // }
    return data;
  }, []);

  const login = useCallback(async (identifier, password) => {
    try {
      const { data } = await api.post('/auth/login', { identifier, password }, { timeout: 60000 });
      if (data.success) {
        persist(data.token, data.user);
        return data;
      } else {
        // Backend returns specific error messages - pass them through
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      // Backend already returns field-specific errors - pass them through
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    try {
      const { data } = await api.post('/auth/admin-login', { username, password }, { timeout: 60000 });
      if (data.success) {
        persist(data.token, data.user);
        // Do NOT auto-start timer - timer starts only when admin enters Admin Panel
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
    safeSessionStorage.removeItem('gnf_token');
    safeSessionStorage.removeItem('gnf_user');
    safeLocalStorage.removeItem('gnf_token');
    safeLocalStorage.removeItem('gnf_user');
    setToken(null);
    setUser(null);
    setIsLocked(false);
    // Clear timer only if admin
    if (isAdmin) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsTimerActive(false);
      setIsSessionExpired(false);
      setTimeLeft(0);
      setShowWarning(false);
      showWarningRef.current = false;
      setHasTimerStarted(false);
      startTimeRef.current = null;
      durationRef.current = null;
      try {
        safeLocalStorage.removeItem(TIMER_START_TIME);
        safeLocalStorage.removeItem(TIMER_DURATION);
        safeLocalStorage.removeItem(TIMER_EXPIRED);
        safeLocalStorage.removeItem(TIMER_STARTED);
      } catch (e) {

      }
    }
  }, [isAdmin]);

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

  // Start admin session timer
  const startAdminTimer = useCallback((minutes) => {
    if (!isAdmin || !isAuthenticated) return;
    
    // Clear existing intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const durationMs = minutes * 60 * 1000;
    const startTime = Date.now();
    
    // Store in refs to avoid closure issues
    startTimeRef.current = startTime;
    durationRef.current = durationMs;
    
    // Save to safeLocalStorage for persistence across navigation
    try {
      safeLocalStorage.setItem(TIMER_START_TIME, startTime.toString());
      safeLocalStorage.setItem(TIMER_DURATION, minutes.toString());
      safeLocalStorage.setItem(TIMER_EXPIRED, 'false');
      safeLocalStorage.setItem(TIMER_STARTED, 'true');
    } catch (e) {

    }
    
    setTimeLeft(durationMs);
    setIsTimerActive(true);
    setShowWarning(false);
    showWarningRef.current = false;
    setIsSessionExpired(false);
    setIsLocked(false);
    setHasTimerStarted(true);
    
    // Start countdown interval
    intervalRef.current = setInterval(() => {
      const currentStartTime = startTimeRef.current;
      const currentDuration = durationRef.current;
      
      if (currentStartTime == null || currentDuration == null) {
        clearInterval(intervalRef.current);
        return;
      }
      
      const elapsed = Date.now() - currentStartTime;
      const remaining = currentDuration - elapsed;
      
      if (remaining <= 0) {
        // Timer expired - lock instead of logout
        clearInterval(intervalRef.current);
        setIsTimerActive(false);
        setIsSessionExpired(true);
        setIsLocked(true);
        try {
          safeLocalStorage.setItem(TIMER_EXPIRED, 'true');
          safeLocalStorage.removeItem(TIMER_START_TIME);
          safeLocalStorage.removeItem(TIMER_DURATION);
        } catch (e) {

        }
      } else {
        setTimeLeft(remaining);
        
        // Show warning at 1 minute remaining
        if (remaining <= 60000 && !showWarningRef.current) {
          showWarningRef.current = true;
          setShowWarning(true);
        }
      }
    }, 1000);
  }, [isAdmin, isAuthenticated]);

  // Stop admin session timer
  const stopAdminTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setIsTimerActive(false);
    setIsSessionExpired(false);
    setIsLocked(false);
    setTimeLeft(0);
    setShowWarning(false);
    showWarningRef.current = false;
    setHasTimerStarted(false);
    startTimeRef.current = null;
    durationRef.current = null;
    
    // Clear safeLocalStorage
    try {
      safeLocalStorage.removeItem(TIMER_START_TIME);
      safeLocalStorage.removeItem(TIMER_DURATION);
      safeLocalStorage.removeItem(TIMER_EXPIRED);
      safeLocalStorage.removeItem(TIMER_STARTED);
    } catch (e) {

    }
  }, []);

  // Unlock admin session with password verification
  const unlockAdminSession = useCallback(async (password) => {
    if (!isAdmin || !isAuthenticated) return { success: false, message: 'Not authenticated as admin' };
    
    try {
      const { data } = await api.post('/auth/admin-login', { username: user?.username || 'admin', password }, { timeout: 60000 });
      if (data.success) {
        setIsLocked(false);
        setIsSessionExpired(false);
        // Restart timer with default 30 minutes
        startAdminTimer(30);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid password' };
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Invalid password';
      return { success: false, message: errorMessage };
    }
  }, [isAdmin, isAuthenticated, user, startAdminTimer]);

  // Check for existing timer on mount
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) {
      stopAdminTimer();
      return;
    }

    try {
      const expired = safeLocalStorage.getItem(TIMER_EXPIRED);
      const started = safeLocalStorage.getItem(TIMER_STARTED);
      const startTime = safeLocalStorage.getItem(TIMER_START_TIME);
      const duration = safeLocalStorage.getItem(TIMER_DURATION);

      // Restore hasTimerStarted state
      if (started === 'true') {
        setHasTimerStarted(true);
      }

      if (expired === 'true') {
        setIsSessionExpired(true);
        setIsTimerActive(true);
        setIsLocked(true);
        return;
      }

      if (startTime && duration) {
        const startTimeMs = parseInt(startTime, 10);
        const durationMs = parseInt(duration, 10) * 60 * 1000;
        
        if (isNaN(startTimeMs) || isNaN(durationMs)) {
          safeLocalStorage.removeItem(TIMER_START_TIME);
          safeLocalStorage.removeItem(TIMER_DURATION);
          return;
        }
        
        // Store in refs
        startTimeRef.current = startTimeMs;
        durationRef.current = durationMs;
        
        const elapsed = Date.now() - startTimeMs;
        const remaining = durationMs - elapsed;

        if (remaining <= 0) {
          // Timer expired while away - lock instead of logout
          setIsSessionExpired(true);
          setIsTimerActive(false);
          setIsLocked(true);
          safeLocalStorage.setItem(TIMER_EXPIRED, 'true');
          safeLocalStorage.removeItem(TIMER_START_TIME);
          safeLocalStorage.removeItem(TIMER_DURATION);
        } else {
          // Timer still running, restore it
          setIsTimerActive(true);
          setTimeLeft(remaining);
          setIsSessionExpired(false);
          setIsLocked(false);
          
          // Continue the countdown
          intervalRef.current = setInterval(() => {
            const currentStartTime = startTimeRef.current;
            const currentDuration = durationRef.current;
            
            if (currentStartTime == null || currentDuration == null) {
              clearInterval(intervalRef.current);
              return;
            }
            
            const newElapsed = Date.now() - currentStartTime;
            const newRemaining = currentDuration - newElapsed;
            
            if (newRemaining <= 0) {
              clearInterval(intervalRef.current);
              setIsTimerActive(false);
              setIsSessionExpired(true);
              setIsLocked(true);
              safeLocalStorage.setItem(TIMER_EXPIRED, 'true');
              safeLocalStorage.removeItem(TIMER_START_TIME);
              safeLocalStorage.removeItem(TIMER_DURATION);
            } else {
              setTimeLeft(newRemaining);
              
              if (newRemaining <= 60000 && !showWarningRef.current) {
                showWarningRef.current = true;
                setShowWarning(true);
              }
            }
          }, 1000);
        }
      }
    } catch (e) {

    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAdmin, isAuthenticated, stopAdminTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle tab switching - lock if timer is not active or has expired
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      // Lock if timer is not active OR if session has expired when switching away
      if (document.hidden && (!isTimerActive || isSessionExpired)) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdmin, isAuthenticated, isTimerActive, isSessionExpired]);

  // Handle route changes - lock if timer NOT started when navigating away from admin
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) return;

    const checkRouteChange = () => {
      const currentPath = window.location.pathname;
      const previousPath = previousPathRef.current;

      // If was on admin page and timer NOT started, lock when navigating away
      if (previousPath.startsWith('/admin') && !currentPath.startsWith('/admin') && !isTimerActive) {
        setIsLocked(true);
      }

      // Update previous path
      previousPathRef.current = currentPath;
    };

    // Check route changes periodically
    const interval = setInterval(checkRouteChange, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isAdmin, isAuthenticated, isTimerActive]);


  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAdmin, 
      isAuthenticated, 
      register, 
      login, 
      adminLogin, 
      logout, 
      refreshMe, 
      forgotPassword, 
      resetPassword, 
      resetPasswordWithSecurityQuestion,
      timeLeft,
      showWarning,
      isTimerActive,
      isSessionExpired,
      isLocked,
      hasTimerStarted,
      startAdminTimer,
      stopAdminTimer,
      unlockAdminSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}