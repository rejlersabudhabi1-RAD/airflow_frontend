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
      // No credentials - JWT in localStorage, not cookies
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
  // withCredentials removed - we use JWT in localStorage, not cookies
  // This fixes CORS issues with Access-Control-Allow-Origin
})

console.log('[API Service] Enhanced Axios client initialized with CORS support')
console.log('[API Service] Base URL:', API_BASE_URL)
console.log('[API Service] Timeout:', API_TIMEOUT)
console.log('[API Service] With Credentials:', false) // JWT in localStorage

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
    
    // Enhanced error logging for debugging
    console.group('[API Error] ❌ Detailed Error Information');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Response Status:', error.response?.status);
    console.error('Response Data:', error.response?.data);
    console.error('Response Data (JSON):', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request Method:', error.config?.method);
    console.error('Request Data:', error.config?.data);
    console.error('Request Timeout:', error.config?.timeout);
    console.error('Full Error Object:', error);
    console.groupEnd();

    // Detect and handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('[API] ⏱️ TIMEOUT ERROR DETECTED');
      console.error('[API] Request timed out after', error.config?.timeout, 'ms');
      console.error('[API] Target:', error.config?.url);
      
      const timeoutError = new Error('Request timeout - server is not responding');
      timeoutError.isTimeout = true;
      timeoutError.originalError = error;
      
      toast.error(`Server not responding after ${Math.floor((error.config?.timeout || 60000) / 1000)} seconds. Please check if the backend is running.`);
      return Promise.reject(timeoutError);
    }

    // Handle network/connection errors (cannot reach server)
    if (!error.response) {
      console.error('[API] 🌐 NETWORK ERROR - No response received from server');
      
      // Check if it's a CORS issue
      if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
        console.warn('[API] 🔥 CORS/Network error detected, running diagnostics...');
        
        const networkError = new Error('Cannot connect to server');
        networkError.isNetworkError = true;
        networkError.originalError = error;
        
        toast.error('Cannot reach server. Please verify the backend is running at ' + API_BASE_URL);
        return Promise.reject(networkError);
      }
      
      // Generic network error
      const networkError = new Error('Network connection failed');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      
      toast.error('Network error - please check your internet connection.');
      return Promise.reject(networkError);
    }

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        
        if (!refreshToken) {
          console.warn('[API] No refresh token available, redirecting to login');
          // No refresh token, redirect to login
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER_DATA)
          
          // Avoid redirect loop - only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
        
        console.log('[API] 🔄 Attempting to refresh access token...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        }, {
          timeout: 30000, // 30 second timeout for token refresh
        })

        const { access } = response.data
        
        if (!access) {
          throw new Error('No access token received from refresh endpoint');
        }
        
        console.log('[API] ✅ Token refresh successful');
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access)

        // Update the failed request's authorization header
        originalRequest.headers.Authorization = `Bearer ${access}`
        
        // Retry the original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error('[API] ❌ Token refresh failed:', refreshError.message);
        
        // Refresh failed, logout user
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        
        // Avoid redirect loop - only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000);
        }
        
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
