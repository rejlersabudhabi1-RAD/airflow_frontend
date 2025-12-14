import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config'
import { STORAGE_KEYS } from '../config/app.config'
import { toast } from 'react-toastify'

/**
 * Smart Axios instance with interceptors
 * Handles authentication, errors, and request/response transformations
 */

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
})

console.log('[API Service] Axios client initialized')
console.log('[API Service] Base URL:', API_BASE_URL)
console.log('[API Service] Timeout:', API_TIMEOUT)
console.log('[API Service] With Credentials:', true)

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

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

    // Show error toast for other errors (not 401 redirects)
    if (error.response?.status !== 401 || originalRequest._retry) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'An error occurred'
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default apiClient
