import React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';

// Helper function to ensure HTTPS URLs - export for global use
export const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//, 'https://');
};

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [slides, setSlides] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [footerLinks, setFooterLinks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadCalledRef = useRef(false);

  const loadCritical = useCallback(async () => {
    try {
      const [s, sl, b] = await Promise.all([
        api.get('/admin/settings/public', { skipTransform: true, timeout: 30000 }),
        api.get('/admin/slides', { timeout: 30000 }),
        api.get('/admin/scroll-content', { timeout: 30000 })
      ]);

      // Sanitize settings URLs to ensure HTTPS
      const sanitizedSettings = {};
      if (s.data.settings) {
        Object.keys(s.data.settings).forEach(key => {
          const value = s.data.settings[key];
          // Sanitize URLs for image fields
          if (key.includes('url') || key.includes('image') || key === 'qr_code' || key === 'logo' || key === 'favicon') {
            sanitizedSettings[key] = ensureHttps(value);
          } else {
            sanitizedSettings[key] = value;
          }
        });
      }

      setSettings(sanitizedSettings || {});
      setSlides(sl.data.slides || []);
      setBlocks(b.data.blocks || []);
    } catch (error) {
      console.error('Failed to load critical data:', error);
    }
  }, []);

  const loadSecondary = useCallback(async () => {
    try {
      const [f, z, fl] = await Promise.all([
        api.get('/admin/faqs', { timeout: 30000 }),
        api.get('/admin/zones', { timeout: 30000 }),
        api.get('/footer-links', { timeout: 30000 })
      ]);

      setFaqs(f.data.faqs || []);
      setZones(z.data.zones || []);
      setFooterLinks(fl.data.links || []);
    } catch (error) {
      console.error('Failed to load secondary data:', error);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (loadCalledRef.current) return;
    loadCalledRef.current = true;
    
    try {
      // Load critical data first (for first viewport)
      await loadCritical();
      setLoaded(true);
      
      // Load secondary data after critical data is loaded
      setTimeout(() => {
        loadSecondary();
      }, 50);
    } catch (error) {
      console.error('Failed to load site data:', error);
      setLoaded(true);
    }
  }, [loadCritical, loadSecondary]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      await api.put('/admin/settings', newSettings, { skipTransform: true });
      await loadAll();
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <SiteContext.Provider value={{ settings, slides, faqs, zones, blocks, footerLinks, loaded, reload: loadAll, updateSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
