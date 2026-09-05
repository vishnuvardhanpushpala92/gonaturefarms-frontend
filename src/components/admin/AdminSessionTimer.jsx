import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useLocation } from 'react-router-dom';

// LocalStorage keys
const TIMER_START_TIME = 'admin_timer_start';
const TIMER_DURATION = 'admin_timer_duration';
const TIMER_EXPIRED = 'admin_timer_expired';

export default function AdminSessionTimer() {
  const { logout, isAdmin, isAuthenticated } = useAuth();
  const { settings, reload, updateSettings } = useSite();
  const showToast = useToast();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [showFullControls, setShowFullControls] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const showWarningRef = useRef(false);

  // Load initial timeout setting
  useEffect(() => {
    const savedTimeout = settings?.admin_session_timeout;
    if (savedTimeout) {
      setInputMinutes(savedTimeout);
    }
  }, [settings]);

  // Check for existing timer from localStorage on mount
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) {
      // Clear timer data if not admin
      try {
        localStorage.removeItem(TIMER_START_TIME);
        localStorage.removeItem(TIMER_DURATION);
        localStorage.removeItem(TIMER_EXPIRED);
      } catch (e) {
        // Ignore localStorage errors
      }
      return;
    }

    try {
      const startTime = localStorage.getItem(TIMER_START_TIME);
      const duration = localStorage.getItem(TIMER_DURATION);
      const expired = localStorage.getItem(TIMER_EXPIRED);

      if (expired === 'true') {
        setIsSessionExpired(true);
        setIsTimerActive(false);
        return;
      }

      if (startTime && duration) {
        const startTimeMs = parseInt(startTime, 10);
        const durationMs = parseInt(duration, 10) * 60 * 1000;
        
        if (isNaN(startTimeMs) || isNaN(durationMs)) {
          // Invalid data, clear it
          localStorage.removeItem(TIMER_START_TIME);
          localStorage.removeItem(TIMER_DURATION);
          return;
        }
        
        const elapsed = Date.now() - startTimeMs;
        const remaining = durationMs - elapsed;

        if (remaining <= 0) {
          // Timer expired while away
          setIsSessionExpired(true);
          setIsTimerActive(false);
          localStorage.setItem(TIMER_EXPIRED, 'true');
          localStorage.removeItem(TIMER_START_TIME);
          localStorage.removeItem(TIMER_DURATION);
        } else {
          // Timer still running
          setIsTimerActive(true);
          setTimeLeft(remaining);
          setIsSessionExpired(false);
        }
      }
    } catch (e) {
      // Handle any localStorage errors
      console.error('Timer initialization error:', e);
    }
  }, [isAdmin, isAuthenticated]);

  const startTimer = useCallback((minutes) => {
    if (!isAdmin || !isAuthenticated) return;
    
    // Clear existing intervals/timeouts
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    const durationMs = minutes * 60 * 1000;
    const startTime = Date.now();
    
    // Save to localStorage for persistence across navigation
    try {
      localStorage.setItem(TIMER_START_TIME, startTime.toString());
      localStorage.setItem(TIMER_DURATION, minutes.toString());
      localStorage.setItem(TIMER_EXPIRED, 'false');
    } catch (e) {
      console.error('Failed to save timer to localStorage:', e);
    }
    
    setTimeLeft(durationMs);
    setIsTimerActive(true);
    setShowWarning(false);
    showWarningRef.current = false;
    setIsEditing(false);
    setIsSessionExpired(false);
    
    // Start countdown interval
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = durationMs - elapsed;
      
      if (remaining <= 0) {
        // Timer expired
        clearInterval(intervalRef.current);
        setIsTimerActive(false);
        setIsSessionExpired(true);
        try {
          localStorage.setItem(TIMER_EXPIRED, 'true');
          localStorage.removeItem(TIMER_START_TIME);
          localStorage.removeItem(TIMER_DURATION);
        } catch (e) {
          console.error('Failed to update timer in localStorage:', e);
        }
        logout();
        showToast('Admin session expired. Please login again.');
      } else {
        setTimeLeft(remaining);
        
        // Show warning at 1 minute remaining
        if (remaining <= 60000 && !showWarningRef.current) {
          showWarningRef.current = true;
          setShowWarning(true);
          showToast('Session will expire in 1 minute. Please save your work.');
        }
      }
    }, 1000);
  }, [isAdmin, isAuthenticated, logout, showToast]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    setIsTimerActive(false);
    setIsSessionExpired(false);
    setTimeLeft(0);
    setShowWarning(false);
    showWarningRef.current = false;
    
    // Clear localStorage
    try {
      localStorage.removeItem(TIMER_START_TIME);
      localStorage.removeItem(TIMER_DURATION);
      localStorage.removeItem(TIMER_EXPIRED);
    } catch (e) {
      console.error('Failed to clear timer from localStorage:', e);
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  // Handle tab switching - lock if timer is NOT started (not active) or has expired
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Lock if timer is not active (not started) OR if session has expired
      if (document.hidden && (!isTimerActive || isSessionExpired) && isAdmin && isAuthenticated) {
        logout();
        showToast('Session locked. Please login again.');
      }
    };

    const handleBeforeUnload = (e) => {
      // Lock if timer is not active (not started) OR if session has expired
      if ((!isTimerActive || isSessionExpired) && isAdmin && isAuthenticated) {
        e.preventDefault();
        e.returnValue = '';
        logout();
      }
    };

    // Add listeners if timer is not active OR session has expired
    if (!isTimerActive || isSessionExpired) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTimerActive, isSessionExpired, isAdmin, isAuthenticated, logout, showToast]);

  // Handle drag and drop
  const handleMouseDown = (e) => {
    if (isAdminPage) return; // Don't allow dragging on admin page
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isAdmin || !isAuthenticated) return null;

  // On admin page, show full rectangular box. On other pages, show compact version.
  if (isAdminPage) {
    return (
      <div style={{
        background: '#ffffff',
        border: isSessionExpired ? '2px solid #dc3545' : (!isTimerActive ? '2px solid #ffc107' : '2px solid #e0e0e0'),
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: isSessionExpired ? '#f8d7da' : (!isTimerActive ? '#fff3cd' : '#ffffff')
      }}>
        {isSessionExpired ? (
          <>
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
                color: '#721c24'
              }}>
                Session Expired
              </h3>
              <div style={{ fontSize: '12px', color: '#721c24' }}>
                🔒 Locked
              </div>
            </div>
            <div style={{ 
              padding: '12px',
              background: '#fff',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#721c24',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              ⚠️ Your admin session has expired. Please login again to continue.
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '10px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
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
                color: isTimerActive ? '#333' : '#856404'
              }}>
                Session Timer
              </h3>
              <div style={{ fontSize: '12px', color: isTimerActive ? '#666' : '#856404' }}>
                {isTimerActive ? '🟢 Active' : '🔒 Locked'}
              </div>
            </div>

            {!isTimerActive && !isEditing ? (
              <div>
                <div style={{ 
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#856404',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  🔒 Session locked. Start timer to enable tab switching.
                </div>
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
                  Timer runs in background. Navigation allowed while active.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // On other pages, show compact version
  return (
    <div 
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {isTimerActive && (
        <div style={{
          background: isSessionExpired ? '#f8d7da' : '#e3f2fd',
          border: isSessionExpired ? '2px solid #dc3545' : '2px solid #2196f3',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: isSessionExpired ? '#dc3545' : '#0d47a1',
          fontFamily: 'monospace',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          userSelect: 'none'
        }}>
          {formatTime(timeLeft)}
        </div>
      )}
      {isSessionExpired && (
        <div style={{
          background: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#721c24',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          userSelect: 'none'
        }}>
          🔒 Session Expired
        </div>
      )}
      <button
        onClick={() => setShowFullControls(!showFullControls)}
        style={{
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          userSelect: 'none'
        }}
      >
        ⏱️
      </button>
      
      {showFullControls && (
        <div style={{
          position: 'fixed',
          top: `${position.y + 40}px`,
          left: `${position.x}px`,
          width: '320px',
          zIndex: 9999,
          background: '#ffffff',
          border: isSessionExpired ? '2px solid #dc3545' : (!isTimerActive ? '2px solid #ffc107' : '2px solid #e0e0e0'),
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          backgroundColor: isSessionExpired ? '#f8d7da' : (!isTimerActive ? '#fff3cd' : '#ffffff')
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
              color: isTimerActive ? '#333' : '#856404'
            }}>
              Session Timer
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: isTimerActive ? '#666' : '#856404' }}>
                {isTimerActive ? '🟢 Active' : '🔒 Locked'}
              </div>
              <button
                onClick={() => setShowFullControls(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {isSessionExpired ? (
            <>
              <div style={{ 
                padding: '12px',
                background: '#fff',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#721c24',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                ⚠️ Your admin session has expired. Please login again to continue.
              </div>
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Go to Login
              </button>
            </>
          ) : !isTimerActive && !isEditing ? (
            <div>
              <div style={{ 
                padding: '12px',
                background: '#fff',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#856404',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                🔒 Session locked. Start timer to enable tab switching.
              </div>
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
                Timer runs in background. Navigation allowed while active.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
