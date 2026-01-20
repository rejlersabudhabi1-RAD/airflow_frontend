/**
 * =========================================================================
 * ADMIN PERMISSIONS CONFIGURATION
 * =========================================================================
 * 
 * Soft-coded permission system for sensitive features
 * Controls visibility of module assignment and other admin-only features
 * 
 * Usage:
 * import { canManageModules, SUPER_ADMIN_EMAILS } from './adminPermissions.config';
 * if (canManageModules(currentUser)) { // show feature }
 */

/**
 * Super Admin Emails
 * Users with these emails have full access to all admin features
 * including module assignment, bulk operations, and system configuration
 */
export const SUPER_ADMIN_EMAILS = [
  'tanzeem.agra@rejlers.ae',
  // Add more super admin emails here as needed
];

/**
 * Module Management Permissions
 * Controls who can assign/remove modules from users
 */
export const MODULE_MANAGEMENT_CONFIG = {
  // Who can view module assignment UI
  canView: (user) => {
    if (!user || !user.email) return false;
    return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  },
  
  // Who can assign modules to users
  canAssign: (user) => {
    if (!user || !user.email) return false;
    return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  },
  
  // Who can bulk assign modules
  canBulkAssign: (user) => {
    if (!user || !user.email) return false;
    return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  },
  
  // Feature flags
  enableModuleSearch: true,
  enableSelectAll: true,
  enableClearAll: true,
  showModuleDescription: true,
  
  // UI Configuration
  uiLabels: {
    sectionTitle: 'Accessible Modules',
    sectionDescription: 'Select which applications this user can access',
    searchPlaceholder: 'Search modules...',
    selectAllButton: 'Select All',
    clearAllButton: 'Clear All',
    noModulesMessage: 'No modules available',
    moduleCountLabel: 'modules selected',
  },
  
  // Validation
  minModulesRequired: 0,
  maxModulesAllowed: null, // null = unlimited
  
  // Warnings
  warnings: {
    noModulesSelected: 'User will not have access to any applications',
    manyModulesSelected: 'User will have access to many applications',
  }
};

/**
 * Helper Functions
 */

/**
 * Check if user can manage modules
 * @param {Object} user - Current user object with email property
 * @returns {boolean}
 */
export const canManageModules = (user) => {
  return MODULE_MANAGEMENT_CONFIG.canView(user);
};

/**
 * Check if user is super admin
 * @param {Object} user - Current user object with email property
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  if (!user || !user.email) return false;
  return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
};

/**
 * Get permission level for user
 * @param {Object} user - Current user object
 * @returns {string} 'super_admin' | 'admin' | 'user'
 */
export const getUserPermissionLevel = (user) => {
  if (isSuperAdmin(user)) return 'super_admin';
  // Add more permission levels as needed
  return 'user';
};

/**
 * Check if current user can perform action
 * @param {Object} user - Current user object
 * @param {string} action - Action to check (e.g., 'assign_modules', 'bulk_assign')
 * @returns {boolean}
 */
export const canPerformAction = (user, action) => {
  if (!user) return false;
  
  const actionPermissions = {
    'assign_modules': MODULE_MANAGEMENT_CONFIG.canAssign,
    'bulk_assign_modules': MODULE_MANAGEMENT_CONFIG.canBulkAssign,
    'view_modules': MODULE_MANAGEMENT_CONFIG.canView,
  };
  
  const checkPermission = actionPermissions[action];
  return checkPermission ? checkPermission(user) : false;
};

export default {
  SUPER_ADMIN_EMAILS,
  MODULE_MANAGEMENT_CONFIG,
  canManageModules,
  isSuperAdmin,
  getUserPermissionLevel,
  canPerformAction,
};
