import apiClient from './api.service'
import { API_ENDPOINTS } from '../config/api.config'
import { STORAGE_KEYS } from '../config/app.config'

/**
 * Authentication Service
 * Smart authentication operations
 */

export const authService = {
  /**
   * Login user
   */
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials)
    const { access, refresh } = response.data
    
    // Store tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)
    
    // Get user data
    const userData = await this.getCurrentUser()
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    
    return userData
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
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
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
