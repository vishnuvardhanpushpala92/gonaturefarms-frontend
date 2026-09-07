import React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  const loadAll = useCallback(async () => {
    try {
      const [s, sl, f, z, b, fl] = await Promise.all([
        api.get('/admin/settings/public', { skipTransform: true, timeout: 60000 }),
        api.get('/admin/slides', { timeout: 60000 }),
        api.get('/admin/faqs', { timeout: 60000 }),
        api.get('/admin/zones', { timeout: 60000 }),
        api.get('/admin/scroll-content', { timeout: 60000 }),
        api.get('/footer-links', { timeout: 60000 })
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
      setFaqs(f.data.faqs || []);
      setZones(z.data.zones || []);
      setBlocks(b.data.blocks || []);
      setFooterLinks(fl.data.links || []);
    } finally {
      setLoaded(true);
    }
  }, []);

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
  }, [loadAll]);

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
