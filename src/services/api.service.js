import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT, API_TIMEOUT_LONG } from '../config/api.config'
import { STORAGE_KEYS } from '../config/app.config'
import { toast } from 'react-toastify'

/**
 * Enhanced Axios instance with CORS error handling and retry logic
 * Handles authentication, errors, and request/response transformations
 */

// CORS Health Check Function
const testCorsConnection = async (baseURL = API_BASE_URL) => {
  console.log('[CORS_TEST] 🩺 Testing CORS connection to:', baseURL);
  
  try {
    // Test with simple fetch request to avoid axios interceptors
    const response = await fetch(`${baseURL}/cors/health/`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[CORS_TEST] ✅ CORS health check passed:', data);
      return data;
    } else {
      throw new Error(`CORS health check failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('[CORS_TEST] ❌ CORS health check failed:', error);
    throw error;
  }
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to false for better CORS compatibility
})

console.log('[API Service] Enhanced Axios client initialized with CORS support')
console.log('[API Service] Base URL:', API_BASE_URL)
console.log('[API Service] Timeout:', API_TIMEOUT)
console.log('[API Service] With Credentials:', false) // Better for CORS

// Request interceptor - Add auth token and handle content types
apiClient.interceptors.request.use(
  (config) => {
    // CRITICAL: Retrieve token from localStorage
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    
    // CRITICAL: Handle FormData BEFORE setting Authorization
    // Axios AxiosHeaders object can be corrupted if we delete after setting Authorization
    if (config.data instanceof FormData) {
      // Set Authorization explicitly for FormData to avoid header object mutation issues
      if (token) {
        config.headers.setAuthorization(`Bearer ${token}`)
      }
      // Remove Content-Type to let browser set multipart boundary
      config.headers.setContentType(false)
      console.log('[API] 📎 FormData detected, Authorization explicitly set, Content-Type cleared');
    } else {
      // For non-FormData requests, set Authorization normally
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    console.log('[API Request] 📤', config.method?.toUpperCase(), config.url);
    console.log('[API Request] Authorization:', config.headers.Authorization ? '✅ Present' : '❌ Missing');
    console.log('[API Request] Headers:', Object.keys(config.headers));
    
    return config
  },
  (error) => {
    console.error('[API] ❌ Request interceptor error:', error);
    return Promise.reject(error)
  }
)

// Enhanced response interceptor - Handle CORS and network errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response] ✅', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('[API Error] ❌', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });

    // Handle CORS/Network errors specifically
    if (!error.response && (error.message.includes('CORS') || error.message.includes('Network Error') || error.code === 'ERR_NETWORK')) {
      console.warn('[API] 🌐 CORS/Network error detected, running diagnostics...');
      
      // Try to diagnose CORS issues
      try {
        await testCorsConnection();
        console.log('[API] 🩺 CORS diagnostic passed - this might be a temporary network issue');
      } catch (corsError) {
        console.error('[API] 🔥 CORS diagnostic failed:', corsError);
        toast.error('Connection blocked by browser security policy. The server may be starting up - please wait a moment and try again.');
        return Promise.reject(error);
      }
    }

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER_DATA)
          window.location.href = '/login'
          return Promise.reject(error)
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        
        // Don't show toast when redirecting to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Enhanced error messages for different error types
    if (error.response?.status !== 401 || originalRequest._retry) {
      let errorMessage = 'An error occurred';
      
      if (!error.response) {
        // Network/CORS error
        errorMessage = 'Network error. Please check your connection or try again later.';
      } else if (error.response.status >= 500) {
        // Server error
        errorMessage = 'Server error. Please try again in a moment.';
      } else {
        // Client error
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.response?.data?.error ||
                      `Request failed: ${error.response.status}`;
      }
      
      toast.error(errorMessage);
    }

    return Promise.reject(error)
  }
)

// Add CORS test function to the client
apiClient.testCors = testCorsConnection;

export default apiClient
