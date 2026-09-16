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
  const [testimonials, setTestimonials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadCalledRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (loadCalledRef.current) return;
    loadCalledRef.current = true;

    try {
      // Single endpoint for all homepage data - reduces API calls from 9 to 1
      const { data } = await api.get('/homepage', { timeout: 30000, skipTransform: true });

      // Sanitize settings URLs to ensure HTTPS
      const sanitizedSettings = {};
      if (data.settings) {
        Object.keys(data.settings).forEach(key => {
          const value = data.settings[key];
          // Sanitize URLs for image fields
          if (key.includes('url') || key.includes('image') || key === 'qr_code' || key === 'logo' || key === 'favicon') {
            sanitizedSettings[key] = ensureHttps(value);
          } else {
            sanitizedSettings[key] = value;
          }
        });
      }

      setSettings(sanitizedSettings || {});
      setSlides(data.slides || []);
      setBlocks(data.blocks || []);
      setFaqs(data.faqs || []);
      setZones(data.zones || []);
      setFooterLinks(data.footerLinks || []);
      setTestimonials(data.testimonials || []);
      setVideos(data.videos || []);
      setProducts(data.products || []);
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load homepage data:', error);
      // Graceful error handling - don't break the app
      if (error.response?.status === 401) {
        console.warn('401 error on public endpoint - backend configuration issue');
      }
      // Set loaded to true even on error to prevent infinite loading
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
  }, []);

  return (
    <SiteContext.Provider value={{ settings, slides, faqs, zones, blocks, footerLinks, testimonials, videos, products, loaded, reload: loadAll, updateSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
