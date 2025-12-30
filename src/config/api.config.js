/**
 * API Configuration
 * Smart configuration for API endpoints and settings
 */

// Production backend URL (Railway)
const PRODUCTION_API_URL = 'https://aiflowbackend-production.up.railway.app/api/v1'

// Determine API base URL (soft-coded for all environments)
const getApiBaseUrl = () => {
  // 1. Check if running in browser (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // 2. For localhost/127.0.0.1, use relative path for Vite proxy
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localUrl = '/api/v1'
      console.log('[API Config] 🏠 Localhost detected, using Vite proxy:', localUrl)
      return localUrl
    }
    
    // 3. For Vercel production, use Railway backend
    if (hostname.includes('vercel.app')) {
      console.log('[API Config] ☁️ Vercel detected, using Railway backend:', PRODUCTION_API_URL)
      return PRODUCTION_API_URL
    }
  }
  
  // 4. SSR or build-time: Check environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('[API Config] 📦 Build-time VITE_API_URL:', import.meta.env.VITE_API_URL)
    // For Docker internal URLs, convert to relative path
    if (import.meta.env.VITE_API_URL.includes('backend:8000')) {
      return '/api/v1'
    }
    return import.meta.env.VITE_API_URL
  }
  
  // 5. Default fallback to production
  console.log('[API Config] 🌐 Using default production backend:', PRODUCTION_API_URL)
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
