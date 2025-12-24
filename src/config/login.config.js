/**
 * Login Page Configuration
 * Soft-coded configuration for login page
 * Allows easy customization without modifying core logic
 */

// Branding Configuration
export const BRANDING = {
  company: {
    name: 'REJLERS',
    product: 'RADAI',
    tagline: 'AI-Powered P&ID Design Verification',
    description: 'Intelligent engineering review for Process & Instrumentation Diagrams',
  },
  location: {
    city: 'Abu Dhabi',
    country: 'UAE',
    displayText: 'Launching in Abu Dhabi, UAE',
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
      link: '#',
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
    message: '⏱️ Request timeout - Backend server is not responding. Please ensure Docker containers are running.',
    console: '[Login] 🔥 TIMEOUT: Backend did not respond within 60 seconds',
  },
  network: {
    message: '🌐 Cannot connect to server. Please verify backend is running at http://localhost:8000',
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

// Theme Configuration
export const THEME = {
  colors: {
    primary: 'blue',
    secondary: 'indigo',
    accent: 'amber',
    success: 'green',
    error: 'red',
  },
  
  gradients: {
    background: 'from-slate-50 via-blue-50 to-indigo-100',
    branding: 'from-blue-900 via-indigo-900 to-purple-900',
    button: 'from-blue-600 via-indigo-600 to-purple-600',
    buttonHover: 'from-blue-700 via-indigo-700 to-purple-700',
    accentLine: 'from-amber-400 to-orange-500',
    title: 'from-blue-600 to-indigo-600',
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
