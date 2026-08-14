import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

const THEME_PRESETS = {
  nature: {
    name: 'Nature Green',
    colors: {
      '--p': '#2d5a27',
      '--p2': '#3a7232',
      '--accent': '#8bc34a',
      '--earth': '#5d4037',
      '--cream': '#ffffff',
      '--white': '#ffffff',
      '--text': '#1a1a1a',
      '--muted': '#6b7280',
      '--border': '#e5e7eb',
      '--hdr-bg': '#ffffff',
      '--hdr-text': '#1a1a1a',
      '--ftr-bg': '#111111',
      '--ftr-text': '#e5e7eb',
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      '--p': '#1e40af',
      '--p2': '#2563eb',
      '--accent': '#60a5fa',
      '--earth': '#1e3a8a',
      '--cream': '#ffffff',
      '--white': '#ffffff',
      '--text': '#1a1a1a',
      '--muted': '#6b7280',
      '--border': '#e5e7eb',
      '--hdr-bg': '#ffffff',
      '--hdr-text': '#1a1a1a',
      '--ftr-bg': '#0f172a',
      '--ftr-text': '#e2e8f0',
    }
  },
  sunset: {
    name: 'Sunset Orange',
    colors: {
      '--p': '#c2410c',
      '--p2': '#ea580c',
      '--accent': '#fb923c',
      '--earth': '#9a3412',
      '--cream': '#ffffff',
      '--white': '#ffffff',
      '--text': '#1a1a1a',
      '--muted': '#6b7280',
      '--border': '#e5e7eb',
      '--hdr-bg': '#ffffff',
      '--hdr-text': '#1a1a1a',
      '--ftr-bg': '#1c1917',
      '--ftr-text': '#f5f5f4',
    }
  },
  lavender: {
    name: 'Lavender Purple',
    colors: {
      '--p': '#7c3aed',
      '--p2': '#8b5cf6',
      '--accent': '#a78bfa',
      '--earth': '#5b21b6',
      '--cream': '#ffffff',
      '--white': '#ffffff',
      '--text': '#1a1a1a',
      '--muted': '#6b7280',
      '--border': '#e5e7eb',
      '--hdr-bg': '#ffffff',
      '--hdr-text': '#1a1a1a',
      '--ftr-bg': '#2e1065',
      '--ftr-text': '#f3e8ff',
    }
  },
  dark: {
    name: 'Dark Mode',
    colors: {
      '--p': '#2d5a27',
      '--p2': '#3a7232',
      '--accent': '#8bc34a',
      '--earth': '#5d4037',
      '--cream': '#1a1a1a',
      '--white': '#1a1a1a',
      '--text': '#f3f4f6',
      '--muted': '#9ca3af',
      '--border': '#374151',
      '--hdr-bg': '#1f2937',
      '--hdr-text': '#f3f4f6',
      '--ftr-bg': '#111827',
      '--ftr-text': '#e5e7eb',
    }
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('colorTheme');
    return saved || 'nature';
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('colorTheme', theme);
    const themeColors = THEME_PRESETS[theme]?.colors || THEME_PRESETS.nature.colors;
    Object.entries(themeColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const setThemePreset = (preset) => {
    setTheme(preset);
    if (preset === 'dark') {
      setDarkMode(true);
    } else if (darkMode && preset !== 'dark') {
      setDarkMode(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, setThemePreset, toggleDarkMode, themePresets: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};
