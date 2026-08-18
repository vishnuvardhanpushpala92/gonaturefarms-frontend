import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';

export const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api'
});

// ── camelCase <-> snake_case conversion ────────────────────────────
// The Spring Boot backend uses a global snake_case JSON naming strategy (so the
// original vanilla-JS frontend's field names like img_url/order_id/customer_name
// keep working). React components in this app use idiomatic camelCase instead, so
// we transparently convert object keys at the HTTP boundary rather than making
// every component match the wire format.
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

// Requests with FormData (file uploads) are passed through untouched.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('gnf_token');
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

api.interceptors.response.use(
  (response) => {
    if (response.config?.skipTransform) return response;
    // Leave file/blob downloads (CSV export etc.) untouched.
    if (response.data && !(response.data instanceof Blob)) {
      response.data = transformKeys(response.data, snakeToCamel);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('gnf_token');
      sessionStorage.removeItem('gnf_user');
    }
    if (!error.config?.skipTransform && error.response && error.response.data && !(error.response.data instanceof Blob)) {
      error.response.data = transformKeys(error.response.data, snakeToCamel);
    }
    return Promise.reject(error);
  }
);

export default api;
