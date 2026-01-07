/**
 * Password Reset Configuration
 * Centralized configuration for password reset functionality
 * Soft-coded approach for easy maintenance and scalability
 */

/**
 * API Endpoints Configuration
 */
export const PASSWORD_RESET_API = {
  requestReset: '/users/request-password-reset/',
  verifyToken: '/users/verify-reset-token/',
  resetPassword: '/users/reset-password/',
}

/**
 * UI Configuration
 */
export const PASSWORD_RESET_UI = {
  page: {
    title: 'Reset Password',
    description: 'Enter your email address and we\'ll send you a link to reset your password.',
  },
  form: {
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    submitButton: {
      idle: 'Send Reset Link',
      loading: 'Sending...',
    },
  },
  success: {
    title: 'Check Your Email',
    description: (email) => `If an account exists with ${email}, you will receive a password reset link shortly.`,
    tips: {
      title: "Didn't receive the email?",
      content: 'Check your spam folder or request a new link in a few minutes.',
    },
    backButton: 'Back to Login',
  },
  errors: {
    emptyEmail: 'Please enter your email address',
    invalidEmail: 'Please enter a valid email address',
    serverError: 'Failed to process password reset request. Please try again.',
  },
  links: {
    login: {
      text: 'Remember your password?',
      linkText: 'Login here',
      url: '/login',
    },
  },
}

/**
 * Styling Configuration (using Rejlers colors)
 */
export const PASSWORD_RESET_STYLES = {
  background: {
    light: 'from-blue-50 via-white to-purple-50',
    dark: 'from-gray-900 via-gray-800 to-gray-900',
  },
  container: {
    light: 'bg-white',
    dark: 'bg-gray-800',
  },
  primary: {
    button: {
      idle: 'bg-blue-600 hover:bg-blue-700',
      loading: 'bg-gray-400 cursor-not-allowed',
    },
    text: 'text-blue-600 hover:text-blue-700',
  },
  success: {
    icon: 'bg-green-100 text-green-600',
    tip: {
      light: 'bg-blue-50 border-blue-200 text-blue-800',
      dark: 'bg-blue-900/30 border-blue-700 text-blue-300',
    },
  },
  error: {
    background: {
      light: 'bg-red-50 border-red-200',
      dark: 'bg-red-900/30 border-red-700',
    },
    icon: 'text-red-600',
    text: {
      light: 'text-red-800',
      dark: 'text-red-300',
    },
  },
}

/**
 * Validation Configuration
 */
export const PASSWORD_RESET_VALIDATION = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
}

/**
 * Security Configuration
 */
export const PASSWORD_RESET_SECURITY = {
  // Always show success message for security (don't reveal if user exists)
  alwaysShowSuccess: true,
  // Token expiry hours (should match backend)
  tokenExpiryHours: 24,
}

/**
 * Helper Functions
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: PASSWORD_RESET_UI.errors.emptyEmail }
  }
  
  if (!PASSWORD_RESET_VALIDATION.email.pattern.test(email)) {
    return { isValid: false, error: PASSWORD_RESET_UI.errors.invalidEmail }
  }
  
  return { isValid: true, error: null }
}

export const buildRequestPayload = (email) => {
  return {
    email: email.trim(),
  }
}

/**
 * Create axios config for unauthenticated requests
 * This ensures no Authorization header is sent for public endpoints
 */
export const getPublicRequestConfig = () => {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
    // Don't include credentials for password reset
    withCredentials: false,
  }
}
