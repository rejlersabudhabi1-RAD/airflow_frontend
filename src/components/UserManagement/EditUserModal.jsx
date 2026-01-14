import React, { useState, useEffect, useMemo } from 'react';
import { EDIT_USER_CONFIG, initializeFormData, validateField, hasChanges } from '../../config/editUser.config';

/**
 * Comprehensive Edit User Modal
 * Feature-rich, soft-coded user editing interface
 * Supports all user attributes, roles, modules, and advanced features
 */
const EditUserModal = ({
  isOpen,
  onClose,
  user,
  onSave,
  organizations = [],
  modules = [],
  roles = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      const initialData = initializeFormData(user);
      setFormData(initialData);
      setOriginalData(initialData);
      
      // Initialize expanded sections (collapse only collapsible ones)
      const initialExpanded = {};
      EDIT_USER_CONFIG.sections.forEach(section => {
        initialExpanded[section.id] = !section.collapsed;
      });
      setExpandedSections(initialExpanded);
    }
  }, [user]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return hasChanges(originalData, formData);
  }, [originalData, formData]);

  // Handle field change
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle module toggle
  const handleModuleToggle = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids?.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...(prev.module_ids || []), moduleId]
    }));
  };

  // Handle role toggle
  const handleRoleToggle = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids?.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...(prev.role_ids || []), roleId]
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    EDIT_USER_CONFIG.sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (EDIT_USER_CONFIG.behavior.confirmBeforeSave) {
      if (!window.confirm(EDIT_USER_CONFIG.messages.confirmation.save)) {
        return;
      }
    }

    await onSave(formData);
    
    if (EDIT_USER_CONFIG.behavior.closeOnSuccess) {
      handleClose();
    }
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges && EDIT_USER_CONFIG.behavior.showUnsavedWarning) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  // Handle section toggle
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Select all modules
  const handleSelectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      module_ids: modules.map(m => m.id)
    }));
  };

  // Clear all modules
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

  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-2'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                field.disabled 
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                  : 'bg-white text-gray-900'
              } ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {field.helpText && !error && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-2'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="">{field.placeholder || 'Select...'}</option>
              {(field.name === 'organization_id' ? organizations : field.options || []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'badge':
        const statusConfig = EDIT_USER_CONFIG.statusColors[value] || EDIT_USER_CONFIG.statusColors.active;
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-1'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </div>
          </div>
        );

      case 'date-display':
        const displayDate = value ? new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Never';
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-1'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className="text-gray-900 font-medium">{displayDate}</div>
          </div>
        );

      case 'number-display':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-1'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className="text-2xl font-bold text-blue-600">{value || 0}</div>
          </div>
        );

      case 'toggle':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-1'}`}>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{field.label}</div>
                {field.helpText && (
                  <div className="text-xs text-gray-600 mt-1">{field.helpText}</div>
                )}
              </div>
              <div className="relative inline-block w-12 h-6 ml-4">
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => {
                    if (field.requireConfirmation) {
                      if (window.confirm(field.confirmMessage)) {
                        handleFieldChange(field.name, e.target.checked);
                      }
                    } else {
                      handleFieldChange(field.name, e.target.checked);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  value ? 'transform translate-x-6' : ''
                }`}></div>
              </div>
            </label>
          </div>
        );

      case 'checkbox-group':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-2'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="flex gap-2">
                {EDIT_USER_CONFIG.moduleDisplay.selectAllButton && (
                  <button
                    type="button"
                    onClick={handleSelectAllModules}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Select All
                  </button>
                )}
                {EDIT_USER_CONFIG.moduleDisplay.clearAllButton && (
                  <button
                    type="button"
                    onClick={handleClearAllModules}
                    className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {EDIT_USER_CONFIG.moduleDisplay.searchable && modules.length > 5 && (
              <div className="mb-3">
                <input
                  type="text"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search modules..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {filteredModules.length > 0 ? (
                filteredModules.map((module) => (
                  <label
                    key={module.id}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.module_ids?.includes(module.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.module_ids?.includes(module.id) || false}
                      onChange={() => handleModuleToggle(module.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{module.name}</div>
                      {EDIT_USER_CONFIG.moduleDisplay.showDescription && module.description && (
                        <div className="text-sm text-gray-600 mt-1">{module.description}</div>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {moduleSearch ? 'No modules found matching your search' : 'No modules available'}
                </div>
              )}
            </div>

            {formData.module_ids?.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {formData.module_ids.length} module(s)
                </p>
              </div>
            )}

            {field.helpText && (
              <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>
            )}
          </div>
        );

      case 'role-selector':
        return (
          <div key={field.name} className={`${field.gridCols || 'col-span-2'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.length > 0 ? (
                roles.map((role) => {
                  const isSelected = formData.role_ids?.includes(role.id);
                  const isAdmin = role.name?.toLowerCase().includes('admin');

                  return (
                    <label
                      key={role.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? isAdmin && EDIT_USER_CONFIG.roleDisplay.highlightAdmin
                            ? EDIT_USER_CONFIG.roleDisplay.highlightColor
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRoleToggle(role.id)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900">{role.name}</div>
                          {EDIT_USER_CONFIG.roleDisplay.showPermissionCount && role.permissions?.length > 0 && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              {role.permissions.length} permissions
                            </span>
                          )}
                        </div>
                        {EDIT_USER_CONFIG.roleDisplay.showDescription && role.description && (
                          <div className="text-sm text-gray-600 mt-1">{role.description}</div>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No roles available
                </div>
              )}
            </div>

            {formData.role_ids?.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Assigned Roles:</strong> {formData.role_ids.length}
                </p>
              </div>
            )}

            {field.helpText && (
              <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Render section
  const renderSection = (section) => {
    const isExpanded = expandedSections[section.id];
    const isCollapsible = section.collapsible;

    return (
      <div key={section.id} className="border-b border-gray-200 pb-6 last:border-b-0">
        <div
          className={`flex items-center justify-between mb-4 ${isCollapsible ? 'cursor-pointer' : ''}`}
          onClick={() => isCollapsible && toggleSection(section.id)}
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

        {isExpanded && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${section.readOnly ? 'bg-gray-50 p-4 rounded-lg' : ''}`}>
            {section.fields.map(renderField)}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${EDIT_USER_CONFIG.modal.maxWidth} w-full ${EDIT_USER_CONFIG.modal.maxHeight} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{EDIT_USER_CONFIG.modal.title}</h2>
                <p className="text-blue-100 text-sm">
                  Editing: {formData.first_name} {formData.last_name} ({formData.email})
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {EDIT_USER_CONFIG.sections.map(renderSection)}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && EDIT_USER_CONFIG.behavior.highlightChanges && (
                <div className="flex items-center gap-2 text-orange-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className={EDIT_USER_CONFIG.buttons.cancel.className}
              >
                {EDIT_USER_CONFIG.buttons.cancel.label}
              </button>

              <button
                type="submit"
                disabled={loading || !hasUnsavedChanges}
                className={`${EDIT_USER_CONFIG.buttons.save.className} ${
                  !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
                } flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{EDIT_USER_CONFIG.buttons.save.loadingLabel}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={EDIT_USER_CONFIG.buttons.save.icon} />
                    </svg>
                    <span>{EDIT_USER_CONFIG.buttons.save.label}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
