import axios from 'axios';

const PRIMARY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const FALLBACK_URL = 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: PRIMARY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('creditsea_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-fallback from port 5000 to port 5001 if port 5000 is occupied by macOS ControlCenter
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      if (api.defaults.baseURL !== FALLBACK_URL) {
        console.warn(`Primary API URL ${api.defaults.baseURL} unreachable. Retrying with ${FALLBACK_URL}...`);
        api.defaults.baseURL = FALLBACK_URL;
        if (error.config) {
          error.config.baseURL = FALLBACK_URL;
          return axios.request(error.config);
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getFileUrl(pathStr?: string): string {
  if (!pathStr) return '#';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;

  let currentBase = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  // Fallback port fix: macOS ControlCenter occupies port 5000, so Express runs on port 5001
  if (currentBase.includes(':5000')) {
    currentBase = currentBase.replace(':5000', ':5001');
  }

  const origin = currentBase.replace(/\/api\/?.*$/, '');
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  return `${origin}${cleanPath}`;
}

(api as any).getFileUrl = getFileUrl;

export default api;
