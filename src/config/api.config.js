/**
 * API Configuration
 * Smart configuration for API endpoints and settings
 */

// Production backend URL (Railway)
const PRODUCTION_API_URL = 'https://aiflowbackend-production.up.railway.app/api/v1'

// Determine API base URL
const getApiBaseUrl = () => {
  // 1. Check for explicit environment variable (highest priority)
  if (import.meta.env.VITE_API_URL) {
    console.log('[API Config] Using VITE_API_URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }
  
  // 2. If running on Vercel (production), use Railway backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('[API Config] Detected Vercel deployment, using Railway backend:', PRODUCTION_API_URL)
    return PRODUCTION_API_URL
  }
  
  // 3. For localhost, use Vite dev server proxy (just /api, Vite will proxy to backend)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const localUrl = '/api/v1'
    console.log('[API Config] Detected localhost, using Vite proxy:', localUrl)
    return localUrl
  }
  
  // 4. Default fallback to production
  console.log('[API Config] Using default production backend:', PRODUCTION_API_URL)
  return PRODUCTION_API_URL
}

export const API_BASE_URL = getApiBaseUrl()

// Log the final API URL
console.log('[API Config] Final API_BASE_URL:', API_BASE_URL)

// Log API URL for debugging
console.log('[API Config] API Base URL:', API_BASE_URL)
console.log('[API Config] Environment:', import.meta.env.MODE)
console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL)

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

// Dynamic timeouts based on operation type and database location
// Increased timeout for Railway database connections from local Docker
export const API_TIMEOUT = 90000 // 90 seconds (increased for Railway database)
export const API_TIMEOUT_LONG = 600000 // 10 minutes for file upload/analysis

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
