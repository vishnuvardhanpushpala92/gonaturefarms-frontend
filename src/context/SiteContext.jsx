import React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';

// Helper function to ensure HTTPS URLs - export for global use
export const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//, 'https://');
};

// Safe localStorage wrapper to handle tracking prevention
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage access blocked by tracking prevention:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage access blocked by tracking prevention:', e);
      return false;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage access blocked by tracking prevention:', e);
      return false;
    }
  }
};

// Safe sessionStorage wrapper
const safeSessionStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage access blocked by tracking prevention:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('sessionStorage access blocked by tracking prevention:', e);
      return false;
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('sessionStorage access blocked by tracking prevention:', e);
      return false;
    }
  }
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
  const [layout, setLayout] = useState(null); // Homepage layout configuration
  const [loaded, setLoaded] = useState(true); // Set to true immediately for instant page render
  const [error, setError] = useState(null);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const loadCalledRef = useRef(false);

  // Load cached data on mount (stale-while-revalidate pattern)
  useEffect(() => {
    try {
      const cachedData = safeLocalStorage.getItem('gnf_homepage_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;

        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setSettings(parsed.settings || {});
          setSlides(parsed.slides || []);
          setBlocks(parsed.blocks || []);
          setFaqs(parsed.faqs || []);
          setZones(parsed.zones || []);
          setFooterLinks(parsed.footerLinks || []);
          setTestimonials(parsed.testimonials || []);
          setVideos(parsed.videos || []);
          setProducts(parsed.products || []);
          setLayout(parsed.layout || null);
        }
      }
    } catch (e) {
      // Silent fail - localStorage may be blocked by tracking prevention
      console.warn('Failed to load cached data (storage may be blocked):', e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    loadCalledRef.current = true;
    setError(null);
    setShowTimeoutMessage(false);
    setBackendDown(false);

    // Show loading message after 5 seconds
    const timeoutId = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 5000);

    const attemptLoad = async () => {
      try {
        // Single endpoint for all homepage data - reduces API calls from 9 to 1
        // Uses 30-second timeout to accommodate Render cold starts
        const { data } = await api.get('/homepage', { skipTransform: true, timeout: 30000 });

        // Clear timeout on success
        clearTimeout(timeoutId);
        setShowTimeoutMessage(false);
        setBackendDown(false);

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
        setZones(data.zones || {});
        setFooterLinks(data.footerLinks || []);
        setTestimonials(data.testimonials || []);
        setVideos(data.videos || []);
        setProducts(data.products || []);
        setLayout(data.layout || null);
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
            products: Array.isArray(data.products) ? data.products : [],
            layout: data.layout || null
          };
          safeLocalStorage.setItem('gnf_homepage_cache', JSON.stringify(cacheData));
        } catch (e) {
          console.warn('Failed to cache homepage data:', e);
        }
      } catch (error) {
        // Clear timeout on error
        clearTimeout(timeoutId);
        
        // Don't retry on 404 or 401 errors (these are permanent failures)
        if (error.response?.status === 404 || error.response?.status === 401) {
          setError(error.message || 'Failed to load data. Please check your connection.');
          setBackendDown(true);
          return;
        }
        
        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
          const errorMessage = 'Server is waking up. Please wait a moment and refresh...';
          setError(errorMessage);
          setBackendDown(true);
        } else {
          // Other errors
          const errorMessage = error.userMessage || 'Unable to load content. Please refresh the page.';
          setError(errorMessage);
          setBackendDown(true);
        }
      }
    };
    
    await attemptLoad();
  }, []);

  const retryLoad = useCallback(() => {
    loadCalledRef.current = false;
    setBackendDown(false); // Reset backend down state on retry
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
    // Fire-and-forget - don't await to avoid blocking initial render
    loadAll().catch(err => {
      console.error('Homepage data load failed:', err);
      // Don't set error state - let the page render with cached/skeleton data
    });
  }, []);

  return (
    <SiteContext.Provider value={{ settings, slides, faqs, zones, blocks, footerLinks, testimonials, videos, products, layout, loaded, error, showTimeoutMessage, backendDown, reload: loadAll, retry: retryLoad, updateSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

// Export safe storage wrappers for use in other components
export { safeLocalStorage, safeSessionStorage };
