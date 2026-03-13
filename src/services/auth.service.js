import apiClient from './api.service'
import { API_ENDPOINTS } from '../config/api.config'
import { STORAGE_KEYS } from '../config/app.config'
import passwordExpiryService from './passwordExpiry.service'
import { getApiTimeouts } from '../config/environment.config'

// SOFT-CODED: Auth timeout from centralized config (90s to handle Railway cold-start DB reconnect)
const { timeoutAuth: AUTH_TIMEOUT_MS } = getApiTimeouts()

/**
 * Authentication Service
 * Smart authentication operations
 */

export const authService = {
  /**
   * Login user with enhanced error handling and timeout detection
   */
  async login(credentials) {
    console.log('[AuthService] 🔐 Starting login process...')
    console.log('[AuthService] Email:', credentials.email)
    console.log('[AuthService] API Endpoint:', API_ENDPOINTS.LOGIN)
    console.log('[AuthService] Auth timeout:', AUTH_TIMEOUT_MS, 'ms')
    
    try {
      const loginStartTime = Date.now()

      // Warmup ping: wake the Railway backend before the login POST.
      // Railway Postgres connection pool can take 10-60s to reconnect after idle,
      // causing the first login to time out. A cheap GET /health/ forces the
      // backend to open its DB connection so the subsequent POST is fast.
      console.log('[AuthService] 🌡️ Warming up backend connection...')
      try {
        await apiClient.get(API_ENDPOINTS.HEALTH, { timeout: 15000 })
        console.log('[AuthService] ✅ Backend warmed up in', Date.now() - loginStartTime, 'ms')
      } catch (warmupErr) {
        // Non-fatal — backend may still respond to POST even if health check fails
        console.warn('[AuthService] ⚠️ Warmup ping failed (non-fatal):', warmupErr.message)
      }
      
      console.log('[AuthService] 📡 Sending login request to backend...')
      
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials, {
        timeout: AUTH_TIMEOUT_MS, // SOFT-CODED from environments.json (default 90s for Railway cold-start)
      })
      
      const loginEndTime = Date.now()
      console.log('[AuthService] ✅ Login request completed in', loginEndTime - loginStartTime, 'ms')
      
      const { access, refresh } = response.data
      
      if (!access || !refresh) {
        console.error('[AuthService] ❌ Invalid response - missing tokens');
        throw new Error('Invalid response from server - missing tokens')
      }
      
      console.log('[AuthService] 🔑 Tokens received, storing...')
      
      // Store tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)
      
      console.log('[AuthService] 👤 Fetching user data...')
      
      // Get user data with retry logic
      let userData;
      let retries = 3;
      while (retries > 0) {
        try {
          userData = await this.getCurrentUser()
          break;
        } catch (userError) {
          retries--;
          if (retries === 0) {
            throw userError;
          }
          console.warn(`[AuthService] Failed to get user data, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      
      console.log('[AuthService] ✅ Login process completed successfully')
      
      // Start password expiry checking
      try {
        await passwordExpiryService.checkPasswordExpiry()
        passwordExpiryService.startPeriodicCheck()
        console.log('[AuthService] 🔒 Password expiry monitoring started')
      } catch (expiryError) {
        console.warn('[AuthService] ⚠️ Failed to initialize password expiry checking:', expiryError)
        // Don't fail login if expiry check fails
      }
      
      return userData
    } catch (error) {
      console.error('[AuthService] ❌ Login failed:', error.message)
      
      // Re-throw with additional context
      if (error.isTimeout) {
        console.error('[AuthService] ⏱️ TIMEOUT during login request')
        error.message = 'Login request timed out. Please check your connection and try again.';
      } else if (error.isNetworkError) {
        console.error('[AuthService] 🌐 NETWORK ERROR during login request')
        error.message = 'Cannot connect to server. Please verify the backend is running.';
      } else if (error.response?.status === 401) {
        error.message = 'Invalid email or password. Please try again.';
      } else if (error.response?.status >= 500) {
        error.message = 'Server error. Please try again in a moment.';
      }
      
      throw error
    }
  },

  /**
   * Register new user
   */
  async register(userData) {
    const response = await apiClient.post(API_ENDPOINTS.USERS, userData)
    return response.data
  },

  /**
   * Logout user
   */
  logout() {
    // Stop password expiry checking
    passwordExpiryService.stopPeriodicCheck()
    passwordExpiryService.clearStatus()
    
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    
    console.log('[AuthService] 🚪 Logged out successfully')
  },

  /**
   * Get current user data
   */
  async getCurrentUser() {
    const response = await apiClient.get(API_ENDPOINTS.USER_ME)
    return response.data
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },

  /**
   * Get stored user data
   */
  getUserData() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return userData ? JSON.parse(userData) : null
  },
}
