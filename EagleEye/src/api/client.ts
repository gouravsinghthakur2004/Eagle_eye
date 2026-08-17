import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://eagleeyeofficial.com/demo/api';

let unauthorizedListener: (() => void) | null = null;

export const setUnauthorizedListener = (listener: (() => void) | null) => {
  unauthorizedListener = listener;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Helper to sanitize sensitive credentials in dev console logs
const sanitizeData = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : { ...data };
    if (parsed.password) parsed.password = '***REDACTED***';
    if (parsed.new_password) parsed.new_password = '***REDACTED***';
    return parsed;
  } catch {
    return data;
  }
};

// Request Interceptor: Dynamically attach Bearer Token from AsyncStorage
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error reading token for request interceptor:', error);
    }

    // When sending FormData (multipart upload), delete any Content-Type header
    // so React Native's native network client automatically creates the multipart boundary
    const isFormData =
      config.data instanceof FormData ||
      (config.data && typeof config.data === 'object' && Array.isArray((config.data as any)._parts));

    if (isFormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
        (config.headers as any).delete('content-type');
      }
    }

    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, sanitizeData(config.data));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centrally handle 401 Unauthorized errors and log responses
client.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${response.config.url}:`, response.data);
    }
    return response;
  },
  async (error) => {
    if (__DEV__ && error.response) {
      console.log(`[API Error] ${error.response.status} ${error.config?.url}:`, error.response.data);
    }

    if (error.response && error.response.status === 401) {
      console.warn('[API Auth Error] 401 Unauthorized detected. Clearing session...');
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.warn('Error clearing storage on 401:', e);
      }
      if (unauthorizedListener) {
        unauthorizedListener();
      }
    }
    return Promise.reject(error);
  }
);

export default client;