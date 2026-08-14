import React from 'react';
import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

export default function WelcomeBlast() {
  const { settings } = useSite();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const blastEnabled = settings.blast_enabled === 'true';
  const blastType = settings.blast_type || 'popup';
  const blastTitle = settings.blast_title || 'Welcome!';
  const blastMessage = settings.blast_message || 'Welcome to our store!';
  const blastImage = settings.blast_image || '';
  const buttonText = settings.blast_button_text || 'Explore';
  const buttonLink = settings.blast_button_link || '';
  const displayDuration = parseInt(settings.blast_duration) || 5000;
  const animation = settings.blast_animation || 'fade';

  useEffect(() => {
    if (!blastEnabled || dismissed) return;
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [blastEnabled, dismissed]);

  const handleClose = () => {
    setVisible(false);
    setDismissed(true);
    if (displayDuration > 0) {
      localStorage.setItem('blastDismissed', Date.now().toString());
    }
  };

  const handleButtonClick = () => {
    if (buttonLink) {
      window.open(buttonLink, '_blank');
    }
    handleClose();
  };

  if (!blastEnabled || dismissed || !visible) return null;

  const getAnimationClass = () => {
    switch (animation) {
      case 'slide': return 'blast-slide';
      case 'zoom': return 'blast-zoom';
      case 'bounce': return 'blast-bounce';
      default: return 'blast-fade';
    }
  };

  const renderContent = () => (
    <div className={`blast-content ${getAnimationClass()}`}>
      {blastImage && (
        <img src={blastImage} alt="Welcome" className="blast-image" />
      )}
      <div className="blast-text">
        <h2>{blastTitle}</h2>
        <p>{blastMessage}</p>
        {buttonText && (
          <button className="btn btn-primary" onClick={handleButtonClick}>
            {buttonText}
          </button>
        )}
      </div>
      <button className="blast-close" onClick={handleClose}>×</button>
    </div>
  );

  if (blastType === 'banner') {
    return (
      <div className="blast-banner">
        {renderContent()}
      </div>
    );
  }

  if (blastType === 'fullscreen') {
    return (
      <div className="blast-overlay blast-fullscreen">
        {renderContent()}
      </div>
    );
  }

  // Default popup/modal
  return (
    <div className="blast-overlay">
      <div className="blast-modal">
        {renderContent()}
      </div>
    </div>
  );
}
