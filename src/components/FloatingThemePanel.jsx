import React from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function FloatingThemePanel() {
  const { theme, darkMode, setThemePreset, toggleDarkMode, themePresets } = useTheme();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [isOpen, setIsOpen] = useState(false);

  if (isAdminPage) return null;

  return (
    <div className="floating-theme-panel">
      <button 
        className="theme-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        🎨
      </button>
      {isOpen && (
        <div className="theme-panel-content">
          <div className="theme-panel-header">
            <span>Color Themes</span>
            <button onClick={() => setIsOpen(false)} className="theme-close-btn">×</button>
          </div>
          <div className="theme-options">
            {Object.entries(themePresets).map(([key, preset]) => (
              <button
                key={key}
                className={`theme-panel-option ${theme === key ? 'active' : ''}`}
                onClick={() => { setThemePreset(key); }}
                title={preset.name}
              >
                <span className="theme-color-preview" style={{ backgroundColor: preset.colors['--p'] }} />
                {preset.name}
              </button>
            ))}
          </div>
          <div className="theme-panel-divider" />
          <button 
            className="theme-dark-toggle" 
            onClick={toggleDarkMode}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      )}
    </div>
  );
}
