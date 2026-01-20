import React, { useState, useMemo } from 'react';
import { canManageModules } from '../../config/adminPermissions.config';

/**
 * Bulk Module Assignment Modal
 * Allows super admin to assign modules to multiple users at once
 * Only accessible to authorized users (tanzeem.agra@rejlers.ae)
 */
const BulkModuleAssignmentModal = ({
  isOpen,
  onClose,
  onAssign,
  users = [],
  modules = [],
  currentUser,
  loading = false
}) => {
  const [selectedModules, setSelectedModules] = useState([]);
  const [targetSelection, setTargetSelection] = useState('all'); // 'all' or 'filtered'
  const [moduleSearch, setModuleSearch] = useState('');

  // Check permission
  if (!canManageModules(currentUser)) {
    return null;
  }

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!moduleSearch) return modules;
    const search = moduleSearch.toLowerCase();
    return modules.filter(module =>
      module.name?.toLowerCase().includes(search) ||
      module.code?.toLowerCase().includes(search) ||
      module.description?.toLowerCase().includes(search)
    );
  }, [modules, moduleSearch]);

  // Handle module toggle
  const handleModuleToggle = (moduleCode) => {
    setSelectedModules(prev =>
      prev.includes(moduleCode)
        ? prev.filter(code => code !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  // Select all modules
  const handleSelectAll = () => {
    setSelectedModules(modules.map(m => m.code));
  };

  // Clear all modules
  const handleClearAll = () => {
    setSelectedModules([]);
  };

  // Handle submit
  const handleSubmit = () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module');
      return;
    }

    const targetUsers = targetSelection === 'all' 
      ? users.map(u => u.email)
      : users.map(u => u.email); // For now, using all users. Can be enhanced to filter

    onAssign({
      user_emails: targetUsers,
      module_codes: selectedModules
    });
  };

  if (!isOpen) return null;

  const userCount = users.length;
  const selectedCount = selectedModules.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🚀 Bulk Assign Modules
              </h2>
              <p className="text-sm text-gray-600">
                Assign application access to multiple users at once
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Target Users
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="targetSelection"
                  value="all"
                  checked={targetSelection === 'all'}
                  onChange={(e) => setTargetSelection(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">All Users</div>
                  <div className="text-sm text-gray-600">
                    Assign to all {userCount} users in the system
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Module Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Select Applications to Grant Access
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {selectedCount} selected
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Search */}
            {modules.length > 5 && (
              <div className="mb-3">
                <input
                  type="text"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search modules by name or code..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Module List */}
            <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {filteredModules.length > 0 ? (
                filteredModules.map((module) => (
                  <label
                    key={module.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedModules.includes(module.code)
                        ? 'border-green-500 bg-green-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.code)}
                      onChange={() => handleModuleToggle(module.code)}
                      className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">{module.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono mr-2">
                          {module.code}
                        </span>
                        {module.description}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {moduleSearch ? 'No modules found matching your search' : 'No modules available'}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedCount > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Assignment Summary</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>{selectedCount}</strong> module(s) will be assigned</li>
                    <li>• To <strong>{userCount}</strong> user(s)</li>
                    <li>• Total operations: <strong>{selectedCount * userCount}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedModules.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Assigning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Assign to {userCount} Users
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkModuleAssignmentModal;
