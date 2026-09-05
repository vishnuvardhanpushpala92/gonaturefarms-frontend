import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminSessionTimer() {
  const { logout, isAdmin, isAuthenticated } = useAuth();
  const { settings, reload, updateSettings } = useSite();
  const showToast = useToast();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  // Load initial timeout setting
  useEffect(() => {
    const savedTimeout = settings?.admin_session_timeout;
    if (savedTimeout) {
      setInputMinutes(savedTimeout);
    }
  }, [settings]);

  const startTimer = useCallback((minutes) => {
    if (!isAdmin || !isAuthenticated) return;
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    const timeoutMs = minutes * 60 * 1000;
    
    setTimeLeft(timeoutMs);
    setIsTimerActive(true);
    setShowWarning(false);
    setIsEditing(false);
    
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
  }, [isAdmin, isAuthenticated, logout, showToast]);

  const stopTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setIsTimerActive(false);
    setTimeLeft(0);
    setShowWarning(false);
  }, []);

  const deleteTimer = useCallback(() => {
    stopTimer();
    setInputMinutes('');
    setIsEditing(false);
    showToast('Timer deleted');
  }, [stopTimer, showToast]);

  const handleStart = () => {
    const minutes = parseInt(inputMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      showToast('Please enter a valid time in minutes');
      return;
    }
    startTimer(minutes);
    showToast(`Timer started for ${minutes} minutes`);
  };

  const handleEdit = () => {
    setIsEditing(true);
    stopTimer();
  };

  const handleSave = async () => {
    const minutes = parseInt(inputMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      showToast('Please enter a valid time in minutes');
      return;
    }
    
    // Save to settings
    try {
      await updateSettings({ admin_session_timeout: minutes.toString() });
      showToast('Timer setting saved');
      setIsEditing(false);
    } catch (err) {
      showToast('Failed to save timer setting');
    }
  };

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  // Handle tab switching - require login if timer is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerActive && isAdmin && isAuthenticated) {
        logout();
        showToast('Session expired due to tab switch. Please login again.');
      }
    };

    const handleBeforeUnload = (e) => {
      if (isTimerActive && isAdmin && isAuthenticated) {
        e.preventDefault();
        e.returnValue = '';
        logout();
      }
    };

    if (isTimerActive) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTimerActive, isAdmin, isAuthenticated, logout, showToast]);

  // Countdown display
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          setIsTimerActive(false);
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

  if (!isAdmin || !isAuthenticated) return null;

  return (
    <div style={{
      background: '#ffffff',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#333'
        }}>
          Session Timer
        </h3>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {isTimerActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {!isTimerActive && !isEditing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            placeholder="Enter minutes"
            min="1"
            step="1"
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleStart}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Start
          </button>
          {inputMinutes && (
            <button
              onClick={deleteTimer}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Delete
            </button>
          )}
        </div>
      ) : isEditing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            placeholder="Enter minutes"
            min="1"
            step="1"
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: showWarning ? '#dc3545' : '#007bff',
              fontFamily: 'monospace'
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleEdit}
                style={{
                  padding: '6px 12px',
                  background: '#ffc107',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Edit
              </button>
              <button
                onClick={stopTimer}
                style={{
                  padding: '6px 12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Stop
              </button>
            </div>
          </div>
          {showWarning && (
            <div style={{ 
              padding: '8px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404',
              textAlign: 'center'
            }}>
              ⚠️ Session expiring soon! Please save your work.
            </div>
          )}
          <div style={{ 
            fontSize: '11px', 
            color: '#666', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Note: Switching tabs or closing window will require login again
          </div>
        </div>
      )}
    </div>
  );
}
