/**
 * API Configuration
 * Smart configuration for API endpoints and settings
 * 
 * SOFT-CODED: Now uses centralized environment configuration
 * Based on commit: c6c3a7e (9-3-26 : First Commit)
 * Aligned with backend configuration for proper frontend-backend synchronization
 */

import envConfig, { getApiBaseUrl, getApiTimeouts } from './environment.config'

// Get API base URL from centralized configuration
export const API_BASE_URL = getApiBaseUrl()

// Get timeout settings from centralized configuration
const { timeout, timeoutLong } = getApiTimeouts()

// Log configuration for debugging
console.log('[API Config] ✅ Using centralized environment configuration')
console.log('[API Config] Environment:', envConfig.getEnvironment())
console.log('[API Config] API Base URL:', API_BASE_URL)
console.log('[API Config] Backend URL:', envConfig.getBackendUrl())
console.log('[API Config] Environment Config:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'not set',
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'not set',
  VITE_AIFLOW_ENVIRONMENT: import.meta.env.VITE_AIFLOW_ENVIRONMENT || 'not set',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR'
})

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login/',
  REFRESH: '/auth/refresh/',
  
  // User endpoints
  USERS: '/users/',
  // User endpoints (changed from /users/ to /user-management/ to avoid route conflicts)
  // Note: Use RBAC endpoint for complete profile data including photo
  USER_ME: '/rbac/users/me/',  // RBAC endpoint with profile_photo
  USER_PROFILE: '/users/update_profile/',
  
  // Health check
  HEALTH: '/health/',
}

// SOFT-CODED: Timeout values from centralized configuration
// These values are now managed in config/environments.json
export const API_TIMEOUT = timeout // From centralized config
export const API_TIMEOUT_LONG = timeoutLong // From centralized config
export const API_TIMEOUT_AI_GENERATION = 300000 // 5 minutes for AI P&ID generation (OpenAI API calls)

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}
