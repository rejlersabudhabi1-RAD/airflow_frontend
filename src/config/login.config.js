/**
 * Login Page Configuration
 * Soft-coded configuration using Official Rejlers Brand Guidelines 2024
 * Allows easy customization without modifying core logic
 */

import { REJLERS_COLORS, BRAND_TEXT } from './theme.config'

// Branding Configuration
export const BRANDING = {
  company: {
    name: BRAND_TEXT.company,
    product: BRAND_TEXT.product,
    tagline: BRAND_TEXT.vision,
    description: BRAND_TEXT.visionDescription,
  },
  location: {
    city: 'Abu Dhabi',
    country: 'UAE',
    displayText: `${BRAND_TEXT.location}`,
  },
}

// Page Content
export const PAGE_CONTENT = {
  title: 'Welcome Back',
  subtitle: 'Sign in to access your P&ID verification dashboard',
  
  features: [
    {
      icon: 'check-circle',
      title: 'Automated Compliance Check',
      description: 'Verify P&ID standards instantly with AI',
    },
    {
      icon: 'check-circle',
      title: 'Smart Issue Detection',
      description: 'Identify design flaws before construction',
    },
    {
      icon: 'check-circle',
      title: 'Detailed Reports',
      description: 'Comprehensive analysis in seconds',
    },
  ],
}

// Form Configuration
export const FORM_CONFIG = {
  fields: {
    email: {
      label: 'Email Address',
      placeholder: 'your.email@rejlers.ae',
      type: 'email',
      icon: 'mail',
    },
    password: {
      label: 'Password',
      placeholder: '••••••••••',
      type: 'password',
      icon: 'lock',
    },
  },
  
  buttons: {
    submit: {
      text: 'Sign In',
      loadingText: 'Signing in...',
    },
    forgotPassword: {
      text: 'Forgot password?',
      link: '/forgot-password',
    },
    // SOFT-CODED: Subscription button disabled for in-house deployment
    subscription: {
      enabled: false, // Disabled for in-house use (no external subscriptions)
      text: 'View Subscription Plans',
      icon: 'currency-dollar',
      link: '/pricing',
      description: 'Explore our pricing and features',
      style: 'primary',
    },
  },
  
  options: {
    rememberMe: {
      enabled: true,
      label: 'Remember me',
    },
  },
}

// Validation Configuration
export const VALIDATION_CONFIG = {
  email: {
    required: 'Email is required',
    invalid: 'Invalid email',
  },
  password: {
    required: 'Password is required',
  },
}

// Error Messages
export const ERROR_MESSAGES = {
  timeout: {
    message: '⏱️ Server is starting up — please wait a moment and try again. (Railway cold start)',
    console: '[Login] 🔥 TIMEOUT: Backend did not respond within timeout window',
  },
  network: {
    message: '🌐 Cannot connect to server. Please check your internet connection and try again.',
    console: '[Login] 🔥 NETWORK ERROR: Cannot reach backend server',
  },
  unauthorized: {
    message: '🔒 Invalid email or password',
  },
  forbidden: {
    message: '🚫 Access forbidden',
  },
  serverError: {
    message: '🔧 Server error - please try again in a moment',
  },
  generic: {
    message: '❌ Network error - please check your connection',
  },
  unexpected: {
    message: 'An unexpected error occurred',
  },
}

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Login successful!',
}

// Navigation Configuration
export const NAVIGATION = {
  afterLogin: '/dashboard',
}

// Console Logging Configuration
export const LOGGING = {
  enabled: true,
  login: {
    attempt: '[Login] 🔐 Attempting login with email:',
    sending: '[Login] 📡 Sending request to backend...',
    success: '[Login] ✅ Login successful in',
    userData: '[Login] User data:',
    failed: '[Login] ❌ Login Failed - Error Analysis',
  },
}

// Theme Configuration - Official Rejlers Brand Colors
export const THEME = {
  colors: {
    primary: REJLERS_COLORS.primary.base,
    primaryAccent: REJLERS_COLORS.primary.accent,
    secondary: REJLERS_COLORS.secondary.green.base,
    secondaryAccent: REJLERS_COLORS.secondary.green.accent,
    success: REJLERS_COLORS.status.success,
    error: REJLERS_COLORS.status.error,
  },
  
  gradients: {
    background: `linear-gradient(to bottom right, ${REJLERS_COLORS.neutral.white}, ${REJLERS_COLORS.primary.complement}, ${REJLERS_COLORS.secondary.turbine.complement})`,
    branding: `linear-gradient(to bottom right, ${REJLERS_COLORS.primary.base}, ${REJLERS_COLORS.primary.accent}, ${REJLERS_COLORS.secondary.turbine.accent})`,
    button: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent})`,
    buttonHover: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.accent}, ${REJLERS_COLORS.secondary.green.base})`,
    accentLine: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})`,
    title: `linear-gradient(to right, ${REJLERS_COLORS.primary.base}, ${REJLERS_COLORS.primary.accent})`,
  },
  
  animations: {
    orbs: [
      { color: 'amber-400', size: 'w-72 h-72', position: 'top-20 left-10', delay: '0s' },
      { color: 'cyan-400', size: 'w-96 h-96', position: 'bottom-20 right-10', delay: '2s' },
      { color: 'pink-400', size: 'w-64 h-64', position: 'top-1/2 left-1/3', delay: '4s' },
    ],
  },
}

// HTTP Status Codes
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SERVER_ERROR_START: 500,
}

// Responsive Design Configuration
export const LOGIN_RESPONSIVE = {
  container: 'min-h-screen flex flex-col lg:flex-row',
  branding: {
    wrapper: 'hidden lg:flex lg:w-1/2 xl:w-3/5',
    padding: 'p-8 lg:p-12 xl:p-16',
    title: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl',
    subtitle: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
  },
  form: {
    wrapper: 'flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:w-1/2 xl:w-2/5',
    maxWidth: 'max-w-md',
    container: 'bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10',
    title: 'text-2xl sm:text-3xl md:text-4xl',
    input: 'py-2.5 sm:py-3 md:py-3.5',
    button: 'py-2.5 sm:py-3 md:py-3.5',
  },
}

// Icon Size Configuration
export const ICON = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

// =====================================================================
// SOFT-CODED INNOVATIVE UX ENHANCEMENTS
// All toggles below are additive — disabling any of them returns the
// page to its previous behaviour without code changes.
// =====================================================================

// Interaction Feature Flags
export const INTERACTIONS = {
  passwordToggle: { enabled: true, showLabel: 'Show', hideLabel: 'Hide' },
  capsLockWarning: { enabled: true, message: 'Caps Lock is ON' },
  mouseAurora: { enabled: true, radius: 320, opacity: 0.35 },
  errorShake: { enabled: true, durationMs: 420 },
  focusGlow: { enabled: true },
  particleField: { enabled: true, count: 14 },
}

// Rotating Taglines (typewriter effect on branding panel)
export const ROTATING_TAGLINES = {
  enabled: true,
  intervalMs: 3800,
  typingSpeedMs: 38,
  prefix: 'AI for',
  items: [
    'P&ID Verification',
    'PFD Quality Checks',
    'Equipment Datasheets',
    'Line List Validation',
    'Engineering Compliance',
  ],
}

// Animated Count-Up Stats (replaces static metrics block when enabled)
export const STATS_COUNTERS = {
  enabled: true,
  durationMs: 1600,
  items: [
    { label: 'Accuracy',    value: 99.7, suffix: '%', decimals: 1, color: '#73BDC8' },
    { label: 'Drawings/yr', value: 12500, suffix: '+', decimals: 0, color: '#7FCAB5' },
    { label: 'Hours Saved', value: 38000, suffix: '+', decimals: 0, color: '#F6B2BB' },
  ],
}

// Trust / Compliance Badges (footer of branding panel)
export const TRUST_BADGES = {
  enabled: true,
  items: [
    { code: 'ISO',  label: 'ISO 27001' },
    { code: 'GDPR', label: 'GDPR Ready' },
    { code: 'SOC',  label: 'SOC 2 Type II' },
    { code: 'SSL',  label: 'TLS 1.3' },
  ],
}

// Animated wave footer on branding panel
export const WAVE_FOOTER = {
  enabled: true,
  colors: ['#7FCAB5', '#73BDC8', '#617AAD'],
}

// Floating engineering keywords drifting across the branding panel
export const FLOATING_KEYWORDS = {
  enabled: true,
  count: 14,
  durationRange: [16, 32], // seconds, randomised per particle
  sizeRange: [10, 16],     // px font-size, randomised per particle
  opacity: 0.18,
  items: [
    'P&ID', 'PFD', 'ISO 27001', 'ASME', 'API 14C', 'HAZOP',
    'SIL-3', 'SLD', 'NDE', 'PSV', 'ESD', 'ISA-5.1',
    'PMS', 'IFC-2x3', 'COMPLIANT', 'AI-OCR', 'FEED', 'EPC',
    'DCS', 'SCADA', 'GA', 'BFD', 'P-101', 'V-204',
  ],
}

// Live "engineers online" pulse indicator (cosmetic, soft-coded)
export const LIVE_PULSE = {
  enabled: true,
  baseCount: 247,
  jitter: 18,                // ±jitter random variation
  refreshMs: 4500,
  label: 'engineers online',
}

// Animated pulse rings around the logo / company avatar
export const LOGO_PULSE = {
  enabled: true,
  rings: 3,
  durationMs: 2400,
  color: 'rgba(127, 202, 181, 0.55)',
}

// Shimmer sweep on the primary submit button (CSS-driven)
export const BUTTON_SHIMMER = {
  enabled: true,
  durationMs: 2800,
  intervalMs: 6000, // sweep every N ms
}

// Subtle 3D tilt on the form card following cursor
export const FORM_TILT = {
  enabled: true,
  maxDeg: 4,        // max rotation
  perspective: 1200,
  resetMs: 320,
}

