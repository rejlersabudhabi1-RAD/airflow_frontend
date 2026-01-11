/**
 * Frontend Test Configuration
 * Matches backend test_config.py and features.config.js
 */

// Environment Detection
const getEnvironment = () => {
  return process.env.NODE_ENV || 'development'
}

const isDevelopment = getEnvironment() === 'development'
const isProduction = getEnvironment() === 'production'

// Application URLs
export const URLs = {
  // Local Development
  FRONTEND_LOCAL: 'http://localhost:5173',
  BACKEND_LOCAL: 'http://localhost:8000',
  API_LOCAL: 'http://localhost:8000/api/v1',
  
  // Production
  FRONTEND_PROD: 'https://www.radai.ae',
  BACKEND_PROD: 'https://aiflowbackend-production.up.railway.app',
  API_PROD: 'https://aiflowbackend-production.up.railway.app/api/v1',
  
  // Current Environment
  get current() {
    if (isProduction) {
      return {
        frontend: this.FRONTEND_PROD,
        backend: this.BACKEND_PROD,
        api: this.API_PROD
      }
    }
    return {
      frontend: this.FRONTEND_LOCAL,
      backend: this.BACKEND_LOCAL,
      api: this.API_LOCAL
    }
  }
}

// Test Credentials
export const TestCredentials = {
  EMAIL: process.env.TEST_EMAIL || 'tanzeem.agra@rejlers.ae',
  PASSWORD: process.env.TEST_PASSWORD || 'Tanzeem@123',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'tanzeem.agra@rejlers.ae',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Tanzeem@123'
}

// Timeout Settings
export const Timeouts = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  UPLOAD: 60000,
  CONVERSION: 120000,
  ANALYSIS: 180000
}

// API Endpoints
export const APIEndpoints = {
  // Authentication
  AUTH_LOGIN: '/auth/login/',
  AUTH_REFRESH: '/auth/refresh/',
  AUTH_REGISTER: '/auth/register/',
  AUTH_LOGOUT: '/auth/logout/',
  PASSWORD_RESET: '/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  
  // Users
  USERS_ME: '/rbac/users/me/',
  USERS_LIST: '/rbac/users/',
  USERS_STATS: '/rbac/users/stats/',
  
  // PID Analysis
  PID_UPLOAD: '/pid/upload/',
  PID_ANALYZE: '/pid/analyze/',
  PID_HISTORY: '/pid/history/',
  PID_REPORT: (id) => `/pid/report/${id}/`,
  
  // PFD to P&ID Conversion
  PFD_UPLOAD: '/pfd/documents/upload/',
  PFD_ANALYZE: (documentId) => `/pfd/analyze/${documentId}/`,
  PFD_CONVERT: (documentId) => `/pfd/convert/${documentId}/`,
  PFD_HISTORY: '/pfd/history/',
  PFD_DOCUMENTS: '/pfd/documents/',
  
  // S3 Management
  S3_PFD_LIST: '/pfd/s3/list-pfds/',
  S3_PFD_UPLOAD: '/pfd/s3/upload-pfd/',
  S3_PID_LIST: '/pfd/s3/list-pids/',
  S3_CONVERT: '/pfd/s3/convert-pfd/',
  
  // CRS Documents
  CRS_DOCUMENTS: '/crs/documents/',
  CRS_UPLOAD: '/crs/documents/upload/',
  CRS_HISTORY: '/crs/documents/history/',
  CRS_REVISIONS: '/crs/revision-chains/',
  
  // RBAC
  RBAC_MODULES: '/rbac/modules/',
  RBAC_ROLES: '/rbac/roles/',
  RBAC_PROFILES: '/rbac/profiles/'
}

// Feature Flags (matches features.config.js)
export const FeatureFlags = {
  PFD_UPLOAD_VERSION: import.meta.env.VITE_PFD_UPLOAD_VERSION || (isDevelopment ? 'new' : 'classic'),
  ENABLE_ULTRA_COMPLETE: import.meta.env.VITE_ENABLE_ULTRA_COMPLETE === 'true' || isDevelopment,
  ENABLE_RAG_KB: import.meta.env.VITE_ENABLE_RAG_KB === 'true' || isDevelopment,
  ENABLE_GRAPH_AI: import.meta.env.VITE_ENABLE_GRAPH_AI === 'true' || isDevelopment,
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true' || isDevelopment
}

// File Upload Configuration
export const UploadConfig = {
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'],
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'image/vnd.dwg',
    'application/dxf'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PHILOSOPHY_SIZE: 5 * 1024 * 1024 // 5MB
}

// Environment Info
export const ENV = {
  isDevelopment,
  isProduction,
  environment: getEnvironment(),
  nodeEnv: process.env.NODE_ENV
}

// Debug output
if (FeatureFlags.ENABLE_DEBUG) {
  console.log('=' .repeat(60))
  console.log('FRONTEND TEST CONFIGURATION LOADED')
  console.log('=' .repeat(60))
  console.log('Environment:', ENV.environment)
  console.log('Frontend URL:', URLs.current.frontend)
  console.log('Backend URL:', URLs.current.backend)
  console.log('API URL:', URLs.current.api)
  console.log('PFD Upload Version:', FeatureFlags.PFD_UPLOAD_VERSION)
  console.log('Ultra Complete Enabled:', FeatureFlags.ENABLE_ULTRA_COMPLETE)
  console.log('=' .repeat(60))
}

export default {
  URLs,
  TestCredentials,
  Timeouts,
  APIEndpoints,
  FeatureFlags,
  UploadConfig,
  ENV
}
