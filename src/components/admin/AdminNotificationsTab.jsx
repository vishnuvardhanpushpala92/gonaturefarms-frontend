import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';
import { isFirebaseConfigured, getFcmToken, onForegroundMessage } from '../../firebase.js';

function playTestSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch (_) {}
}

export default function AdminNotificationsTab({ onOpenOrder }) {
  const showToast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState({ sound_enabled: true, desktop_enabled: true, push_enabled: true });
  const [pushState, setPushState] = useState('idle'); // idle|unsupported|unconfigured|requesting|enabled|denied

  useEffect(() => {
    setPushState(!('serviceWorker' in navigator) ? 'unsupported'
      : !isFirebaseConfigured ? 'unconfigured' : 'idle');
    onForegroundMessage((payload) => {
      const n = payload.notification || {};
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(n.title || 'Go Nature Farms', { body: n.body || '', icon: '/logo.png' });
      }
    });
  }, []);

  const enableMobilePush = async () => {
    if (!isFirebaseConfigured) { setPushState('unconfigured'); showToast('Firebase not configured'); return; }
    if (!('Notification' in window)) { setPushState('unsupported'); return; }
    setPushState('requesting');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushState('denied'); showToast('Notification permission denied'); return; }
      const token = await getFcmToken();
      if (!token) { setPushState('idle'); showToast('Could not get push token'); return; }
      await api.post('/admin/notifications/devices', { token, device_info: navigator.userAgent.slice(0, 180) });
      setPushState('enabled');
      showToast('Mobile push notifications enabled on this device');
    } catch (e) {
      setPushState('idle');
      showToast(e?.message || 'Failed to enable push');
    }
  };

  const disableMobilePush = async () => {
    try {
      const { getToken, deleteToken } = await import('firebase/messaging');
      const { initFirebaseMessaging } = await import('../../firebase.js');
      const m = await initFirebaseMessaging();
      if (m) {
        const token = await getToken(m);
        if (token) {
          await api.delete('/admin/notifications/devices', { data: { token } });
          await deleteToken(m);
        }
      }
      setPushState('idle');
      showToast('Mobile push disabled on this device');
    } catch { showToast('Failed to disable push'); }
  };

  const load = useCallback(() => {
    api.get('/admin/notifications', { params: { filter }, skipTransform: true })
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch(() => showToast('Failed to load notifications'));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/notifications/settings', { skipTransform: true })
      .then(({ data }) => {
        const s = data.settings || data;
        setSettings({
          sound_enabled: s.sound_enabled !== false,
          desktop_enabled: s.desktop_enabled !== false,
          push_enabled: s.push_enabled !== false,
        });
      }).catch(() => {});
  }, []);

  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      const { data } = await api.put('/admin/notifications/settings', next);
      const s = data.settings || data;
      setSettings({
        sound_enabled: s.sound_enabled !== false,
        desktop_enabled: s.desktop_enabled !== false,
        push_enabled: s.push_enabled !== false,
      });
    } catch {
      showToast('Failed to save notification settings');
    }
  };

  const testDesktop = async () => {
    if (!('Notification' in window)) { showToast('Desktop notifications not supported'); return; }
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission === 'granted') {
      new Notification('Go Nature Farms', { body: 'Test notification — new order alerts are working.', icon: '/logo.png' });
      showToast('Test notification sent');
    } else {
      showToast('Desktop notification permission denied');
    }
  };

  const markRead = async (id) => {
    await api.put(`/admin/notifications/${id}/read`).catch(() => {});
    load();
  };
  const markAllRead = async () => {
    await api.put('/admin/notifications/read-all').catch(() => {});
    load(); showToast('All notifications marked as read');
  };
  const del = async (id) => {
    await api.delete(`/admin/notifications/${id}`).catch(() => {});
    load();
  };

  const openOrder = (n) => {
    if (n.order_id || n.orderId) {
      if (onOpenOrder) onOpenOrder(n.order_id || n.orderId);
    }
    if (!(n.is_read ?? n.isRead)) markRead(n.id);
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Notification Settings</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={settings.sound_enabled}
              onChange={(e) => saveSettings({ sound_enabled: e.target.checked })} />
            🔔 Sound
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={settings.desktop_enabled}
              onChange={(e) => saveSettings({ desktop_enabled: e.target.checked })} />
            🖥️ Desktop notifications
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={settings.push_enabled}
              onChange={(e) => saveSettings({ push_enabled: e.target.checked })} />
            📱 Mobile push (FCM)
          </label>
          <button className="btn btn-secondary" onClick={() => { playTestSound(); }}>Test Sound</button>
          <button className="btn btn-secondary" onClick={testDesktop}>Test Desktop</button>
          <button className="btn btn-secondary" onClick={markAllRead}>Mark All Read</button>
          {pushState === 'enabled' ? (
            <button className="btn btn-danger" onClick={disableMobilePush}>Disable Mobile Push</button>
          ) : (
            <button className="btn btn-primary" onClick={enableMobilePush} disabled={pushState === 'requesting' || pushState === 'unconfigured' || pushState === 'unsupported'}>
              {pushState === 'requesting' ? 'Enabling…' : 'Enable Mobile Push'}
            </button>
          )}
        </div>
        {pushState === 'unconfigured' && (
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 10 }}>
            Mobile push requires Firebase config — set VITE_FIREBASE_* env vars in Vercel and fill public/firebase-config.js.
          </p>
        )}
        {pushState === 'denied' && (
          <p style={{ fontSize: '.8rem', color: '#b91c1c', marginTop: 10 }}>
            Browser blocked notifications. Allow them in browser settings, then retry.
          </p>
        )}
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Notification History</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['all', 'All'], ['unread', 'Unread']].map(([k, l]) => (
              <button key={k} className={`fbtn${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No notifications yet.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Time</th><th>Type</th><th>Message</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {notifications.map((n) => {
                const read = n.is_read ?? n.isRead;
                return (
                  <tr key={n.id} style={{ fontWeight: read ? 400 : 600, background: read ? 'transparent' : '#fffbeb' }}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '.82rem' }}>{(n.created_at || n.createdAt || '').replace('T', ' ').slice(0, 19)}</td>
                    <td>{n.notification_type || n.type}</td>
                    <td>
                      <button onClick={() => openOrder(n)} style={{ background: 'none', border: 'none', color: 'var(--p)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        {n.title ? `${n.title} — ` : ''}{n.message}
                      </button>
                    </td>
                    <td>{n.order_amount ?? n.orderAmount ? `₹${n.order_amount ?? n.orderAmount}` : '—'}</td>
                    <td>{read ? 'Read' : 'Unread'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {!read && <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '.75rem' }} onClick={() => markRead(n.id)}>Mark Read</button>}
                      <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '.75rem', marginLeft: 6 }} onClick={() => del(n.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
