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
  const [loaded, setLoaded] = useState(true); // Set to true immediately for instant page render
  const [error, setError] = useState(null);
  const loadCalledRef = useRef(false);

  // Load cached data on mount (stale-while-revalidate pattern)
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('gnf_homepage_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('Using cached homepage data (age:', Math.floor(cacheAge / 1000), 'seconds)');
          setSettings(parsed.settings || {});
          setSlides(parsed.slides || []);
          setBlocks(parsed.blocks || []);
          setFaqs(parsed.faqs || []);
          setZones(parsed.zones || []);
          setFooterLinks(parsed.footerLinks || []);
          setTestimonials(parsed.testimonials || []);
          setVideos(parsed.videos || []);
          setProducts(parsed.products || []);
        }
      }
    } catch (e) {
      console.warn('Failed to load cached data:', e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    loadCalledRef.current = true;
    setError(null);

    try {
      // Single endpoint for all homepage data - reduces API calls from 9 to 1
      // Uses global timeout of 5 seconds from axios config
      const { data } = await api.get('/homepage', { skipTransform: true });

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

      // Update state
      setSettings(sanitizedSettings || {});
      setSlides(data.slides || []);
      setBlocks(data.blocks || []);
      setFaqs(data.faqs || []);
      setZones(data.zones || []);
      setFooterLinks(data.footerLinks || []);
      setTestimonials(data.testimonials || []);
      setVideos(data.videos || []);
      setProducts(data.products || []);
      setError(null);

      // Cache the data for future visits
      try {
        const cacheData = {
          timestamp: Date.now(),
          settings: sanitizedSettings,
          slides: data.slides,
          blocks: data.blocks,
          faqs: data.faqs,
          zones: data.zones,
          footerLinks: data.footerLinks,
          testimonials: data.testimonials,
          videos: data.videos,
          products: data.products
        };
        localStorage.setItem('gnf_homepage_cache', JSON.stringify(cacheData));
        console.log('Homepage data cached successfully');
      } catch (e) {
        console.warn('Failed to cache homepage data:', e);
      }
    } catch (error) {
      console.error('Failed to load homepage data:', error);
      // Set error state but don't block page render
      setError(error.message || 'Failed to load data. Please check your connection.');
    }
  }, []);

  const retryLoad = useCallback(() => {
    loadCalledRef.current = false;
    loadAll();
  }, [loadAll]);

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
    <SiteContext.Provider value={{ settings, slides, faqs, zones, blocks, footerLinks, testimonials, videos, products, loaded, error, reload: loadAll, retry: retryLoad, updateSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
