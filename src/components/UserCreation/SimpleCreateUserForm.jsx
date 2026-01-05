import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import rbacService from '../../services/rbac.service';
import { fetchRoles, fetchModules } from '../../store/slices/rbacSlice';

/**
 * Simple Create User Form - User Friendly Design
 * Using soft-coding principles for easy configuration
 */

const FORM_CONFIG = {
  title: 'Create New User',
  subtitle: 'Fill in the required information below',
  requiredFields: ['email', 'first_name', 'last_name', 'password'],
  optionalSections: {
    workInfo: {
      title: 'Work Information (Optional)',
      fields: ['department', 'job_title', 'phone']
    },
    access: {
      title: 'Access Permissions',
      fields: ['role_ids', 'module_ids']
    }
  },
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
  }
};

const SimpleCreateUserForm = ({ onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const { roles, modules } = useSelector((state) => state.rbac);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    department: '',
    job_title: '',
    phone: '',
    role_ids: [],
    module_ids: []
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalSections, setShowOptionalSections] = useState({
    workInfo: false,
    access: false
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchModules());
  }, [dispatch]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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

  const handleToggleRole = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...prev.role_ids, roleId]
    }));
  };

  const handleToggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...prev.module_ids, moduleId]
    }));
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

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
        <h2 className="text-2xl font-bold">{FORM_CONFIG.title}</h2>
        <p className="text-blue-100 mt-1">{FORM_CONFIG.subtitle}</p>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Required Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Required Information
            </h3>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="user@example.com"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                  disabled={isLoading}
                />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                  disabled={isLoading}
                />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Minimum 8 characters"
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Optional Work Info Section - Collapsible */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowOptionalSections(prev => ({ ...prev, workInfo: !prev.workInfo }))}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-700">{FORM_CONFIG.optionalSections.workInfo.title}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showOptionalSections.workInfo ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showOptionalSections.workInfo && (
              <div className="px-4 pb-4 space-y-4 border-t">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Engineering"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Software Engineer"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+971501234567"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional Access Section - Collapsible */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowOptionalSections(prev => ({ ...prev, access: !prev.access }))}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-700">{FORM_CONFIG.optionalSections.access.title}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showOptionalSections.access ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showOptionalSections.access && (
              <div className="px-4 pb-4 space-y-4 border-t">
                {/* Roles */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {roles.map(role => (
                      <label key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.role_ids.includes(role.id)}
                          onChange={() => handleToggleRole(role.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Modules */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modules</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {modules.map(module => (
                      <label key={module.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.module_ids.includes(module.id)}
                          onChange={() => handleToggleModule(module.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700">{module.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>
      </div>

      {/* Footer - Fixed */}
      <div className="border-t bg-gray-50 px-8 py-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{FORM_CONFIG.messages.loading}</span>
            </>
          ) : (
            <span>Create User</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SimpleCreateUserForm;
