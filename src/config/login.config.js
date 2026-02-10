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
    message: '⏱️ Request timeout - Backend server is not responding. Please check your connection.',
    console: '[Login] 🔥 TIMEOUT: Backend did not respond within 60 seconds',
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
