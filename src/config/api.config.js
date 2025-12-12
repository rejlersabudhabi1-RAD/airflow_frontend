/**
 * API Configuration
 * Smart configuration for API endpoints and settings
 */

// Prefer explicit env var `VITE_API_URL`. If not provided, derive from the current origin.
const deriveBaseFromWindow = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000/api/v1'
  return `${window.location.origin.replace(/:\d+$/, '')}/api/v1`
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || deriveBaseFromWindow()

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login/',
  REFRESH: '/auth/refresh/',
  
  // User endpoints
  USERS: '/users/',
  USER_ME: '/users/me/',
  USER_PROFILE: '/users/update_profile/',
  
  // Health check
  HEALTH: '/health/',
}

export const API_TIMEOUT = 10000 // 10 seconds

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
