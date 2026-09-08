import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gonaturefarms-qf9o.onrender.com';

// Helper function to ensure HTTPS URLs
const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//, 'https://');
};

export const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  timeout: 60000
});

// Transform keys (if your backend uses snake_case)
function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof File) && !(val instanceof Blob);
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function transformKeys(data, converter) {
  if (Array.isArray(data)) return data.map((item) => transformKeys(item, converter));
  if (isPlainObject(data)) {
    return Object.entries(data || {}).reduce((acc, [key, value]) => {
      acc[converter(key)] = transformKeys(value, converter);
      return acc;
    }, {});
  }
  return data;
}

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('gnf_token') || localStorage.getItem('gnf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.skipTransform) return config;
  if (config.data && !(config.data instanceof FormData)) {
    config.data = transformKeys(config.data, camelToSnake);
  }
  if (config.params) {
    config.params = transformKeys(config.params, camelToSnake);
  }
  return config;
});

// Helper function to sanitize URLs in API responses
function sanitizeUrlsInObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    // Check if string is a URL and ensure HTTPS
    if (obj.match(/^https?:\/\/.*cloudinary\.com/)) {
      return ensureHttps(obj);
    }
    // Also sanitize other image URLs
    if (obj.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      return ensureHttps(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeUrlsInObject);
  }
  if (isPlainObject(obj)) {
    return Object.entries(obj || {}).reduce((acc, [key, value]) => {
      acc[key] = sanitizeUrlsInObject(value);
      return acc;
    }, {});
  }
  return obj;
}

// Handle 401 errors gracefully (prevent console spam and auto-logout)
api.interceptors.response.use(
  (response) => {
    if (response.config?.skipTransform) {
      // Still sanitize URLs even with skipTransform
      if (response.data && !(response.data instanceof Blob) && !(response.data instanceof ArrayBuffer)) {
        response.data = sanitizeUrlsInObject(response.data);
      }
      return response;
    }
    if (response.data && !(response.data instanceof Blob) && !(response.data instanceof ArrayBuffer)) {
      response.data = transformKeys(response.data, snakeToCamel);
      // Sanitize URLs to prevent mixed content errors
      response.data = sanitizeUrlsInObject(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens if unauthorized, but keep cart intact
      sessionStorage.removeItem('gnf_token');
      sessionStorage.removeItem('gnf_user');
      localStorage.removeItem('gnf_token');
      localStorage.removeItem('gnf_user');
      // Do NOT remove cart - it should persist independently
      
      // Prevent infinite console spam
      if (!error.config?.silent) {
        console.warn('Unauthorized request. Redirecting to login...');
        // Optional: Redirect to home or login
        // window.location.href = '/';
      }
    }
    
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('=== API ERROR DETAILS ===');
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('URL:', error.config?.url);
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('Headers:', JSON.stringify(error.config?.headers, null, 2));
      console.error('==========================');
      
      // Transform error data if needed
      if (!error.config?.skipTransform && error.response.data && !(error.response.data instanceof Blob) && !(error.response.data instanceof ArrayBuffer)) {
        error.response.data = transformKeys(error.response.data, snakeToCamel);
      }
      
      // Add user-friendly error message to error object
      const data = error.response.data;
      if (data?.message) {
        error.userMessage = data.message;
      } else if (error.response.status === 400) {
        // Check for specific validation errors
        if (data?.errors) {
          // Handle validation errors object
          const errorMessages = Object.values(data.errors);
          error.userMessage = errorMessages.join('; ') || 'Invalid request. Please check your input and try again.';
        } else {
          error.userMessage = 'Invalid request. Please check your input and try again.';
        }
      } else if (error.response.status === 404) {
        error.userMessage = 'The requested resource was not found.';
      } else if (error.response.status === 500) {
        error.userMessage = 'Server error. Please try again later.';
      } else {
        error.userMessage = `Request failed with status ${error.response.status}`;
      }
    } else if (error.request) {
      console.error('=== NETWORK ERROR ===');
      console.error('Message:', error.message);
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('===================');
      error.userMessage = 'Network error. Please check your connection and try again.';
    } else {
      console.error('=== REQUEST ERROR ===');
      console.error('Message:', error.message);
      console.error('Config:', JSON.stringify(error.config, null, 2));
      console.error('===================');
      error.userMessage = 'Request failed. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

export default api;