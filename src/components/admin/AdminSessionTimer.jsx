import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminSessionTimer() {
  const { logout, isAdmin, isAuthenticated } = useAuth();
  const { settings } = useSite();
  const showToast = useToast();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const getTimeoutMinutes = useCallback(() => {
    const timeout = settings?.admin_session_timeout;
    if (!timeout) return 0; // No timeout set - don't start timer
    const minutes = parseInt(timeout, 10);
    return isNaN(minutes) || minutes <= 0 ? 0 : minutes;
  }, [settings]);

  const resetTimer = useCallback(() => {
    if (!isAdmin || !isAuthenticated) return;
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    const timeoutMinutes = getTimeoutMinutes();
    
    // If no timeout set, don't start timer (no auto logout)
    if (timeoutMinutes === 0) {
      setTimeLeft(0);
      setShowTimer(false);
      setShowWarning(false);
      return;
    }
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    setTimeLeft(timeoutMs);
    setShowTimer(true);
    setShowWarning(false);
    
    // Show warning at 1 minute remaining
    const warningTime = timeoutMs - 60000;
    warningRef.current = setTimeout(() => {
      if (isAuthenticated && isAdmin) {
        setShowWarning(true);
        showToast('Session will expire in 1 minute. Please save your work.');
      }
    }, warningTime);
    
    // Auto logout at timeout
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated && isAdmin) {
        logout();
        showToast('Admin session expired. Please login again.');
      }
    }, timeoutMs);
  }, [isAdmin, isAuthenticated, getTimeoutMinutes, logout, showToast]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAdmin && isAuthenticated) {
      resetTimer();
    } else {
      setTimeLeft(0);
      setShowTimer(false);
      setShowWarning(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    }
  }, [isAdmin, isAuthenticated, resetTimer]);

  // Countdown display
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleManualLogout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    logout();
    showToast('Admin logged out manually.');
  };

  // Show status when no timeout is set
  if (!showTimer && isAdmin && isAuthenticated) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#f8f9fa',
        border: '2px solid #6c757d',
        borderRadius: '8px',
        padding: '12px 16px',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '200px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#495057',
          marginBottom: '4px'
        }}>
          Session Timer
        </div>
        <div style={{ 
          fontSize: '13px', 
          color: '#6c757d',
          marginBottom: '8px' 
        }}>
          Auto-logout disabled
        </div>
        <button
          onClick={handleManualLogout}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Logout Now
        </button>
      </div>
    );
  }

  if (!showTimer || timeLeft <= 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: showWarning ? '#fff3cd' : '#e3f2fd',
      border: showWarning ? '2px solid #ffc107' : '2px solid #2196f3',
      borderRadius: '8px',
      padding: '12px 16px',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: showWarning ? '#856404' : '#0d47a1',
        marginBottom: '4px'
      }}>
        Session Timer
      </div>
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: showWarning ? '#dc3545' : '#0d47a1',
        fontFamily: 'monospace'
      }}>
        {formatTime(timeLeft)}
      </div>
      {showWarning && (
        <div style={{ 
          fontSize: '12px', 
          color: '#856404', 
          marginTop: '4px' 
        }}>
          Session expiring soon!
        </div>
      )}
      <button
        onClick={handleManualLogout}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Logout Now
      </button>
    </div>
  );
}
