/**
 * User Management Configuration
 * Centralized configuration for user creation, validation, and management
 * Soft-coded for easy updates without touching component code
 */

export const USER_MANAGEMENT_CONFIG = {
  // Email Validation Configuration
  email: {
    // Email format validation regex
    formatRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // Allowed email domains (empty array = all domains allowed)
    allowedDomains: [
      // 'radai.ae',
      // 'rejlers.ae',
      // Add specific domains here if needed, or leave empty to allow all
    ],
    
    // Blocked email providers (disposable/temporary email services)
    blockedProviders: [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email'
    ],
    
    // Email validation messages
    messages: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
      exists: 'A user with this email already exists',
      blocked: 'This email provider is not allowed',
      domainNotAllowed: 'Email domain is not allowed'
    }
  },

  // Password Configuration
  password: {
    minLength: 8,
    maxLength: 128,
    
    // Password strength requirements
    requirements: {
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSpecialChars: 1,
      allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    },
    
    // Password validation messages
    messages: {
      required: 'Password is required',
      tooShort: `Password must be at least 8 characters long`,
      tooWeak: 'Password must contain uppercase, lowercase, number, and special character',
      mismatch: 'Passwords do not match'
    }
  },

  // Name Validation
  name: {
    minLength: 2,
    maxLength: 50,
    // Allow letters, spaces, hyphens, and apostrophes
    regex: /^[a-zA-Z\s'-]+$/,
    
    messages: {
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      invalid: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      tooShort: 'Name must be at least 2 characters long',
      tooLong: 'Name cannot exceed 50 characters'
    }
  },

  // Phone Validation
  phone: {
    // International phone format
    regex: /^\+?[1-9]\d{1,14}$/,
    
    messages: {
      invalid: 'Please enter a valid phone number (e.g., +971501234567)',
      required: 'Phone number is required'
    }
  },

  // Organization and Role Requirements
  requirements: {
    organizationRequired: false,
    roleRequired: true,
    moduleRequired: false,
    departmentRequired: false,
    jobTitleRequired: false
  },

  // Form Field Validation Messages
  validationMessages: {
    requiredField: 'This field is required',
    invalidFormat: 'Invalid format',
    minLength: (min) => `Minimum ${min} characters required`,
    maxLength: (max) => `Maximum ${max} characters allowed`
  },

  // Backend Error Messages Mapping
  backendErrorMapping: {
    'email': 'Email validation failed',
    'password': 'Password does not meet requirements',
    'user': 'User creation failed',
    'role_ids': 'Invalid role selection',
    'module_ids': 'Invalid module selection',
    'organization_id': 'Invalid organization',
    'default': 'Failed to create user. Please check all fields and try again.'
  },

  // Success Messages
  successMessages: {
    userCreated: '✓ User created successfully!',
    userUpdated: '✓ User updated successfully!',
    userDeleted: '✓ User deleted successfully!',
    userActivated: '✓ User activated successfully!',
    userDeactivated: '✓ User deactivated successfully!',
    passwordReset: '✓ Password reset link sent successfully!',
    roleAssigned: '✓ Role assigned successfully!',
    moduleAssigned: '✓ Modules assigned successfully!'
  },

  // Default Values
  defaults: {
    status: 'active',
    is_mfa_enabled: false,
    organization_id: null,
    department: null,
    job_title: null,
    phone: null
  }
}

/**
 * Validate email format and domain
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valid: false, message: USER_MANAGEMENT_CONFIG.email.messages.required }
  }

  // Format validation
  if (!USER_MANAGEMENT_CONFIG.email.formatRegex.test(email)) {
    return { valid: false, message: USER_MANAGEMENT_CONFIG.email.messages.invalid }
  }

  // Extract domain
  const domain = email.split('@')[1].toLowerCase()

  // Check blocked providers
  if (USER_MANAGEMENT_CONFIG.email.blockedProviders.includes(domain)) {
    return { valid: false, message: USER_MANAGEMENT_CONFIG.email.messages.blocked }
  }

  // Check allowed domains (if configured)
  if (USER_MANAGEMENT_CONFIG.email.allowedDomains.length > 0) {
    if (!USER_MANAGEMENT_CONFIG.email.allowedDomains.includes(domain)) {
      return { valid: false, message: USER_MANAGEMENT_CONFIG.email.messages.domainNotAllowed }
    }
  }

  return { valid: true, message: '' }
}

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const config = USER_MANAGEMENT_CONFIG.password

  if (!password || password.trim() === '') {
    return { valid: false, message: config.messages.required }
  }

  if (password.length < config.minLength) {
    return { valid: false, message: config.messages.tooShort }
  }

  if (password.length > config.maxLength) {
    return { valid: false, message: `Password cannot exceed ${config.maxLength} characters` }
  }

  // Check strength requirements
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = new RegExp(`[${config.requirements.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return { valid: false, message: config.messages.tooWeak }
  }

  return { valid: true, message: '' }
}

/**
 * Validate name
 */
export const validateName = (name, fieldName = 'Name') => {
  const config = USER_MANAGEMENT_CONFIG.name

  if (!name || name.trim() === '') {
    return { valid: false, message: `${fieldName} is required` }
  }

  if (name.length < config.minLength) {
    return { valid: false, message: config.messages.tooShort }
  }

  if (name.length > config.maxLength) {
    return { valid: false, message: config.messages.tooLong }
  }

  if (!config.regex.test(name)) {
    return { valid: false, message: config.messages.invalid }
  }

  return { valid: true, message: '' }
}

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const config = USER_MANAGEMENT_CONFIG.phone

  if (!phone || phone.trim() === '') {
    // Phone is optional
    return { valid: true, message: '' }
  }

  if (!config.regex.test(phone)) {
    return { valid: false, message: config.messages.invalid }
  }

  return { valid: true, message: '' }
}

/**
 * Validate complete user form
 */
export const validateUserForm = (formData) => {
  const errors = {}

  // Email validation
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.message
  }

  // Password validation (only for new users)
  if (!formData.id) {
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = USER_MANAGEMENT_CONFIG.password.messages.mismatch
    }
  }

  // First name validation
  const firstNameValidation = validateName(formData.first_name, 'First name')
  if (!firstNameValidation.valid) {
    errors.first_name = firstNameValidation.message
  }

  // Last name validation
  const lastNameValidation = validateName(formData.last_name, 'Last name')
  if (!lastNameValidation.valid) {
    errors.last_name = lastNameValidation.message
  }

  // Phone validation
  const phoneValidation = validatePhone(formData.phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message
  }

  // Role validation (if required)
  if (USER_MANAGEMENT_CONFIG.requirements.roleRequired) {
    if (!formData.role_ids || formData.role_ids.length === 0) {
      errors.role_ids = 'At least one role must be selected'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Parse backend error response
 */
export const parseBackendError = (error) => {
  if (!error.response || !error.response.data) {
    return USER_MANAGEMENT_CONFIG.backendErrorMapping.default
  }

  const data = error.response.data

  // If there's a detail message, use it
  if (data.detail) {
    return data.detail
  }

  // If there's a message field, use it
  if (data.message) {
    return data.message
  }

  // Check for field-specific errors
  if (typeof data === 'object') {
    const fieldErrors = []
    
    for (const [field, messages] of Object.entries(data)) {
      if (Array.isArray(messages)) {
        const fieldName = USER_MANAGEMENT_CONFIG.backendErrorMapping[field] || field
        fieldErrors.push(`${fieldName}: ${messages.join(', ')}`)
      } else if (typeof messages === 'string') {
        fieldErrors.push(messages)
      }
    }

    if (fieldErrors.length > 0) {
      return fieldErrors.join('; ')
    }
  }

  return USER_MANAGEMENT_CONFIG.backendErrorMapping.default
}

/**
 * Prepare user payload for backend
 */
export const prepareUserPayload = (formData) => {
  return {
    email: formData.email?.trim().toLowerCase(),
    first_name: formData.first_name?.trim(),
    last_name: formData.last_name?.trim(),
    password: formData.password,
    organization_id: formData.organization_id || null,
    department: formData.department?.trim() || null,
    job_title: formData.job_title?.trim() || null,
    phone: formData.phone?.trim() || null,
    role_ids: formData.role_ids || [],
    module_ids: formData.module_ids || []
  }
}

export default USER_MANAGEMENT_CONFIG
