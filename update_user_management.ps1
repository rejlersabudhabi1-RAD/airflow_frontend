# Read file
$filePath = "C:\Users\Abdullah.Khan\airflow_frontend\src\pages\UserManagement.jsx"
$content = Get-Content $filePath -Raw

# 1. Add state variable after showBulkUploadModal
$pattern1 = 'const \[showBulkUploadModal, setShowBulkUploadModal\] = useState\(false\);'
$replacement1 = @'
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkModuleModal, setShowBulkModuleModal] = useState(false);
'@
$content = $content -replace $pattern1, $replacement1

# 2. Add handler function after handleBulkUpload function (search for a good anchor point)
$handlerCode = @'

  // Handle bulk module assignment
  const handleBulkModuleAssign = async (payload) => {
    try {
      setActionLoading(prev => ({ ...prev, bulk_module_assign: true }));
      
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/rbac/users/bulk-assign-modules/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to assign modules');
      }

      const result = await response.json();
      
      setNotification({
        show: true,
        type: 'success',
        message: `Successfully assigned ${result.summary.total_module_assignments} module(s) to ${result.summary.successful} user(s)`
      });
      
      setShowBulkModuleModal(false);
      dispatch(fetchUsers());
      
    } catch (error) {
      console.error('Bulk module assignment error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.message || 'Failed to assign modules. Please try again.'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, bulk_module_assign: false }));
    }
  };
'@

# Find a good insertion point - after handleEditUser or similar
$pattern2 = '(const handleEditUser = async.*?\n  };)'
$content = $content -replace $pattern2, ('$1' + $handlerCode)

# 3. Add button after Bulk Upload button
$buttonCode = @'

              {canManageModules(currentUser) && (
                <button
                  onClick={() => setShowBulkModuleModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg"
                  title="Bulk assign modules to multiple users (Admin only)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Assign Modules
                </button>
              )}
'@

$pattern3 = '(\s+<button\s+onClick=\{\(\) => \{\s+console\.log\(''Bulk Upload button clicked''\);\s+setShowBulkUploadModal\(true\);\s+\}\}\s+className="px-4 py-2 bg-gray-600[^>]+>\s+<svg[^<]+</svg>\s+Bulk Upload\s+</button>)'
$content = $content -replace $pattern3, ('$1' + $buttonCode)

# 4. Add modal component before final closing tag
$modalCode = @'

      {/* Bulk Module Assignment Modal */}
      <BulkModuleAssignmentModal
        isOpen={showBulkModuleModal}
        onClose={() => setShowBulkModuleModal(false)}
        onAssign={handleBulkModuleAssign}
        users={filteredAndSortedUsers}
        modules={modules}
        currentUser={currentUser}
        loading={actionLoading.bulk_module_assign}
      />
'@

$pattern4 = '(</EditUserModal>)'
$content = $content -replace $pattern4, ('$1' + $modalCode)

# Write back
Set-Content $filePath $content
Write-Host "✅ Successfully updated UserManagement.jsx with bulk module assignment feature"
