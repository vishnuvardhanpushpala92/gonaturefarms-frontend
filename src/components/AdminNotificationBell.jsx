import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/client';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gonaturefarms-qf9o.onrender.com'}/api`;
import { useAuth } from '../context/AuthContext.jsx';

const getToken = () => localStorage.getItem('gnf_token') || sessionStorage.getItem('gnf_token');

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
    // second chime
    setTimeout(() => {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.frequency.value = 1174; o2.type = 'sine';
      g2.gain.setValueAtTime(0.12, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o2.start(); o2.stop(ctx.currentTime + 0.5);
    }, 180);
  } catch (_) {}
}

function showDesktopNotification(n) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notif = new Notification(n.title || 'Go Nature Farms', {
      body: n.message || 'New order received',
      icon: '/logo.png',
      tag: `order-${n.orderId || n.id}`,
    });
    notif.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent('gnf:open-order', { detail: { orderId: n.orderId } }));
      notif.close();
    };
  } catch (_) {}
}

export default function AdminNotificationBell({ onOpenOrder }) {
  const { isAdmin } = useAuth();
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState({ sound_enabled: true, desktop_enabled: true });
  const seenIds = useRef(new Set());
  const reconnectTimer = useRef(null);

  const refreshCount = useCallback(() => {
    api.get('/admin/notifications/unread-count')
      .then(({ data }) => setUnread(data.count ?? data.unread_count ?? data.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    refreshCount();
    api.get('/admin/notifications/settings', { skipTransform: true })
      .then(({ data }) => {
        const s = data.settings || data;
        setSettings({
          sound_enabled: s.sound_enabled !== false,
          desktop_enabled: s.desktop_enabled !== false,
        });
      }).catch(() => {});

    let abort = false;
    const connect = async () => {
      while (!abort) {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/notifications/stream`, {
            headers: { Authorization: `Bearer ${getToken()}`, Accept: 'text/event-stream' },
          });
          if (!res.ok || !res.body) throw new Error('SSE failed');
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!abort) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';
            for (const ev of events) {
              const dataLine = ev.split('\n').find(l => l.startsWith('data:'));
              if (!dataLine) continue;
              try {
                const n = JSON.parse(dataLine.slice(5).trim());
                if (n.id && !seenIds.current.has(n.id)) {
                  seenIds.current.add(n.id);
                  setUnread(c => c + 1);
                  if (settings.sound_enabled) playNotificationSound();
                  if (settings.desktop_enabled) showDesktopNotification(n);
                }
              } catch (_) {}
            }
          }
        } catch (_) {}
        if (abort) break;
        await new Promise(r => { reconnectTimer.current = setTimeout(r, 5000); });
      }
    };
    connect();
    return () => { abort = true; if (reconnectTimer.current) clearTimeout(reconnectTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const requestDesktopPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={() => { requestDesktopPermission(); refreshCount(); onOpenOrder && onOpenOrder(); }}
      title="Notifications"
      style={{ position: 'relative', padding: '6px 10px' }}
    >
      🔔
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff',
          borderRadius: 10, fontSize: '.68rem', fontWeight: 700, minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
        }}>{unread > 99 ? '99+' : unread}</span>
      )}
    </button>
  );
}
