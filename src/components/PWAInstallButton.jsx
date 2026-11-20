import React, { useState, useEffect } from 'react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window.MSStream);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {(showInstallButton || isIOS) && (
        <button 
          className="hbtn" 
          onClick={isIOS ? () => setShowIOSModal(true) : handleInstallClick}
          style={{ color: '#2e7d32', fontWeight: '500' }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M20 9v11a2 2 0 01-2 2H6a2 2 0 01-2-2V9" /><path d="M16 5h-4a2 2 0 01-2-2V3a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          <span style={{ marginLeft: 4 }}>Install App</span>
        </button>
      )}
      {showIOSModal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999,
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: 10 }}>Install Go Nature Farms</h3>
          <p style={{ marginBottom: 10 }}>To install on iPhone/iPad:</p>
          <ol style={{ textAlign: 'left', paddingLeft: 20 }}>
            <li>Tap the Share button</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
          <button onClick={() => setShowIOSModal(false)} style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
        </div>
      )}
    </>
  );
}
