import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gonaturefarms-qf9o.onrender.com';

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

// Handle 401 errors gracefully (prevent console spam and auto-logout)
api.interceptors.response.use(
  (response) => {
    if (response.config?.skipTransform) return response;
    if (response.data && !(response.data instanceof Blob) && !(response.data instanceof ArrayBuffer)) {
      response.data = transformKeys(response.data, snakeToCamel);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens if unauthorized
      sessionStorage.removeItem('gnf_token');
      sessionStorage.removeItem('gnf_user');
      localStorage.removeItem('gnf_token');
      localStorage.removeItem('gnf_user');
      
      // Prevent infinite console spam
      if (!error.config?.silent) {
        console.warn('Unauthorized request. Redirecting to login...');
        // Optional: Redirect to home or login
        // window.location.href = '/';
      }
    }
    
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Add user-friendly error message to error object
      if (error.response.data && error.response.data.message) {
        error.userMessage = error.response.data.message;
      } else if (error.response.status === 400) {
        error.userMessage = 'Invalid request. Please check your input and try again.';
      } else if (error.response.status === 404) {
        error.userMessage = 'The requested resource was not found.';
      } else if (error.response.status === 500) {
        error.userMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      console.error('Network Error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      error.userMessage = 'Network error. Please check your connection and try again.';
    } else {
      console.error('Request Error:', {
        message: error.message,
        config: error.config
      });
      error.userMessage = 'Request failed. Please try again.';
    }
    
    if (!error.config?.skipTransform && error.response && error.response.data && !(error.response.data instanceof Blob) && !(error.response.data instanceof ArrayBuffer)) {
      error.response.data = transformKeys(error.response.data, snakeToCamel);
    }
    return Promise.reject(error);
  }
);

export default api;