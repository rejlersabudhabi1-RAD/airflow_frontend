import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import rbacService from '../../services/rbac.service';
import { fetchRoles, fetchModules, fetchOrganizations } from '../../store/slices/rbacSlice';
import { groupModulesByCategory, MODULE_CATEGORIES_CONFIG } from '../../config/moduleCategories.config';

/**
 * Enhanced Create User Form - Aligned with Edit User Modal Design
 * Using soft-coding principles with sectioned layout matching EditUserModal
 */

const FORM_CONFIG = {
  title: 'Create New User',
  subtitle: 'Fill in the required information below',
  requiredFields: ['email', 'first_name', 'last_name', 'password'],
  sections: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Essential user details',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      collapsible: false,
      collapsed: false
    },
    {
      id: 'work',
      title: 'Work Information',
      description: 'Job-related details (Optional)',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      collapsible: true,
      collapsed: true
    },
    {
      id: 'access',
      title: 'Access & Permissions',
      description: 'Roles and module access (Optional)',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      collapsible: true,
      collapsed: true
    }
  ],
  validation: {
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    password: { minLength: 8, message: 'Password must be at least 8 characters' },
    first_name: { minLength: 2, message: 'First name must be at least 2 characters' },
    last_name: { minLength: 2, message: 'Last name must be at least 2 characters' }
  },
  messages: {
    success: 'User created successfully!',
    loading: 'Creating user...',
    error: 'Failed to create user. Please try again.'
  },
  roleDisplay: {
    highlightAdmin: true,
    showDescription: true,
    showPermissionCount: false
  },
  moduleDisplay: {
    showDescription: true,
    showCategoryGroups: true,
    showSearch: true,
    showSelectAll: true
  }
};

const SimpleCreateUserForm = ({ onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const { roles, modules, organizations } = useSelector((state) => state.rbac);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    organization_id: '',
    department: '',
    job_title: '',
    phone: '',
    role_ids: [],
    module_ids: []
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [moduleSearch, setModuleSearch] = useState('');

  // Initialize expanded sections based on configuration
  useEffect(() => {
    const initialExpanded = {};
    FORM_CONFIG.sections.forEach(section => {
      initialExpanded[section.id] = !section.collapsed;
    });
    setExpandedSections(initialExpanded);
  }, []);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchModules());
    dispatch(fetchOrganizations());
  }, [dispatch]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleToggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...prev.module_ids, moduleId]
    }));
  };

  const handleToggleRole = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== moduleId)
        : [...prev.role_ids, roleId]
    }));
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSelectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      module_ids: modules.map(m => m.id)
    }));
  };

  const handleClearAllModules = () => {
    setFormData(prev => ({
      ...prev,
      module_ids: []
    }));
  };

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!moduleSearch) return modules;
    const search = moduleSearch.toLowerCase();
    return modules.filter(module =>
      module.name?.toLowerCase().includes(search) ||
      module.description?.toLowerCase().includes(search)
    );
  }, [modules, moduleSearch]);

  const validateField = (field, value) => {
    const validation = FORM_CONFIG.validation[field];
    if (!validation) return null;

    if (validation.pattern && !validation.pattern.test(value)) {
      return validation.message;
    }
    if (validation.minLength && value.length < validation.minLength) {
      return validation.message;
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check required fields
    FORM_CONFIG.requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      } else {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare payload - trim strings and remove empty optionals
      const payload = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        ...(formData.organization_id && { organization_id: formData.organization_id }),
        ...(formData.department && { department: formData.department.trim() }),
        ...(formData.job_title && { job_title: formData.job_title.trim() }),
        ...(formData.phone && { phone: formData.phone.trim() }),
        role_ids: formData.role_ids,
        module_ids: formData.module_ids
      };

      console.log('[SimpleCreateUserForm] Submitting:', payload);
      const response = await rbacService.createUser(payload);
      console.log('[SimpleCreateUserForm] Success:', response);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('[SimpleCreateUserForm] Error:', error);
      
      // Parse backend errors
      if (error.response?.data) {
        const backendErrors = {};
        Object.keys(error.response.data).forEach(key => {
          const errorValue = error.response.data[key];
          backendErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: FORM_CONFIG.messages.error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group modules by category
  const groupedModules = useMemo(() => {
    return groupModulesByCategory(filteredModules);
  }, [filteredModules]);

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header - Matching EditUserModal */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{FORM_CONFIG.title}</h2>
              <p className="text-blue-100 text-sm">{FORM_CONFIG.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          {/* Basic Information Section */}
          {renderSection('basic', (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="user@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.last_name}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 characters"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
                {!errors.password && (
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
                )}
              </div>

              {/* Organization */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <select
                  value={formData.organization_id}
                  onChange={(e) => handleChange('organization_id', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  disabled={isLoading}
                >
                  <option value="">Select organization (optional)</option>
                  {organizations?.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">If not selected, default organization will be assigned</p>
              </div>
            </div>
          ))}

          {/* Work Information Section - Collapsible */}
          {renderSection('work', (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Engineering"
                  disabled={isLoading}
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Software Engineer"
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+971501234567"
                  disabled={isLoading}
                />
              </div>
            </div>
          ))}

          {/* Access & Permissions Section - Collapsible */}
          {renderSection('access', (
            <div className="space-y-6">
              {/* Roles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Roles
                  </label>
                </div>

                {/* Selected Roles Summary */}
                {formData.role_ids.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-purple-900">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs mr-2">
                          {formData.role_ids.length}
                        </span>
                        Role{formData.role_ids.length !== 1 ? 's' : ''} Assigned
                      </p>
                      <span className="text-xs text-purple-700">
                        {roles.filter(r => formData.role_ids.includes(r.id)).map(r => r.name).join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white">
                  {roles.length > 0 ? (
                    roles.map((role) => {
                      const isSelected = formData.role_ids.includes(role.id);
                      const isAdmin = role.name?.toLowerCase().includes('admin');
                      const isSuperAdmin = role.name?.toLowerCase().includes('super');
                      const roleIcon = isSuperAdmin ? '👑' : isAdmin ? '🛡️' : '👤';

                      return (
                        <label
                          key={role.id}
                          className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                            isSelected
                              ? isAdmin && FORM_CONFIG.roleDisplay.highlightAdmin
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                                : 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRole(role.id)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            disabled={isLoading}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{roleIcon}</span>
                              <div className="font-bold text-gray-900">{role.name}</div>
                            </div>
                            {FORM_CONFIG.roleDisplay.showDescription && role.description && (
                              <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {role.description}
                              </div>
                            )}
                            {isAdmin && (
                              <div className="mt-2 inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                                ⚡ Elevated Access
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔒</div>
                      <div className="font-medium">No roles available</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modules */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Modules
                  </label>
                  {FORM_CONFIG.moduleDisplay.showSelectAll && MODULE_CATEGORIES_CONFIG.features.enableQuickActions && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSelectAllModules}
                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        ✓ Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllModules}
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        ✕ Clear All
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Count Badge */}
                {formData.module_ids.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-900">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">
                          {formData.module_ids.length}
                        </span>
                        Module{formData.module_ids.length !== 1 ? 's' : ''} Selected
                      </p>
                      <span className="text-xs text-blue-700">
                        of {modules.length} total
                      </span>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                {FORM_CONFIG.moduleDisplay.showSearch && MODULE_CATEGORIES_CONFIG.features.enableSearch && modules.length > 3 && (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="🔍 Search modules by name or description..."
                        className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      {moduleSearch && (
                        <button
                          type="button"
                          onClick={() => setModuleSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Categorized Modules */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white">
                  {FORM_CONFIG.moduleDisplay.showCategoryGroups && Object.keys(groupedModules).length > 0 ? (
                    Object.entries(groupedModules).map(([categoryId, categoryData]) => {
                      const { config, modules: categoryModules } = categoryData;
                      const selectedInCategory = categoryModules.filter(m => 
                        formData.module_ids.includes(m.id)
                      ).length;

                      return (
                        <div key={categoryId} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                          {/* Category Header */}
                          <div className={`flex items-center justify-between mb-3 ${config.bgColor} px-3 py-2.5 rounded-lg border ${config.borderColor}`}>
                            <div className="flex items-center gap-2">
                              {MODULE_CATEGORIES_CONFIG.display.showIcons && (
                                <span className="text-lg">{config.icon}</span>
                              )}
                              <h4 className={`text-sm font-bold ${config.textColor} uppercase tracking-wider`}>
                                {config.name}
                              </h4>
                            </div>
                            <span className={`text-xs ${config.badgeColor} ${config.textColor} px-2 py-1 rounded-full font-medium`}>
                              {selectedInCategory}/{categoryModules.length}
                            </span>
                          </div>

                          {/* Modules in Category */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                            {categoryModules.map((module) => {
                              const isSelected = formData.module_ids.includes(module.id);
                              return (
                                <label
                                  key={module.id}
                                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    isSelected
                                      ? `${config.borderColor} ${config.bgColor} shadow-sm`
                                      : 'border-gray-200 bg-white hover:border-blue-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleModule(module.id)}
                                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    disabled={isLoading}
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {module.name}
                                    </div>
                                    {FORM_CONFIG.moduleDisplay.showDescription && module.description && (
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {module.description}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* No modules found */
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <div className="font-medium">
                        {moduleSearch ? 'No modules found matching your search' : 'No modules available'}
                      </div>
                      {moduleSearch && (
                        <button
                          type="button"
                          onClick={() => setModuleSearch('')}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </form>
      </div>

      {/* Footer - Fixed */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{FORM_CONFIG.messages.loading}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Create User</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Helper function to render collapsible sections
  function renderSection(sectionId, content) {
    const section = FORM_CONFIG.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const isExpanded = expandedSections[sectionId];
    const isCollapsible = section.collapsible;

    return (
      <div key={sectionId} className="border-b border-gray-200 pb-6 last:border-b-0">
        <div
          className={`flex items-center justify-between mb-4 ${isCollapsible ? 'cursor-pointer' : ''}`}
          onClick={() => isCollapsible && toggleSection(sectionId)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </div>
          </div>
          {isCollapsible && (
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {isExpanded && content}
      </div>
    );
  }
};

export default SimpleCreateUserForm;
