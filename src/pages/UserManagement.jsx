import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, fetchRoles, fetchModules, fetchCurrentUser } from '../store/slices/rbacSlice';
import rbacService from '../services/rbac.service';
import { STORAGE_KEYS } from '../config/app.config';

/**
 * User Management Page
 * CRUD operations for users with role assignment
 * Soft-coded authentication check and redirect
 */
const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, roles, modules, currentUser, loading, error } = useSelector((state) => state.rbac);
  const { user: authUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    organization_id: '',
    department: '',
    job_title: '',
    phone_number: '',
    module_ids: []
  });
  const [organizations, setOrganizations] = useState([]);
  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState([]);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    organization_id: '',
    department: '',
    job_title: '',
    phone_number: '',
    module_ids: []
  });

  // Soft-coded: Check authentication before loading data
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      console.log('[UserManagement] Checking authentication...');
      console.log('[UserManagement] Access token exists:', !!token);
      console.log('[UserManagement] Refresh token exists:', !!refreshToken);
      
      if (!token && !refreshToken) {
        console.warn('[UserManagement] No authentication tokens found - redirecting to login');
        setIsAuthenticated(false);
        navigate('/login', { 
          replace: true,
          state: { from: '/admin/users', message: 'Please login to access User Management' }
        });
      } else {
        console.log('[UserManagement] Authentication tokens found - proceeding');
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Only fetch current user if authenticated
    if (isAuthenticated) {
      console.log('[UserManagement] Fetching current user...');
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Only load data if authenticated
    if (!isAuthenticated) {
      console.log('[UserManagement] Skipping data load - not authenticated');
      return;
    }
    
    const loadData = async () => {
      try {
        setAuthError(false);
        
        console.log('[UserManagement] Loading data...');
        
        // Fetch users, roles, and modules via Redux
        await Promise.all([
          dispatch(fetchUsers()).unwrap(),
          dispatch(fetchRoles()).unwrap(),
          dispatch(fetchModules()).unwrap()
        ]);
        
        // Load organizations with better error handling
        try {
          const orgsResponse = await rbacService.getOrganizations();
          console.log('Organizations Response:', orgsResponse);
          console.log('Organizations Response Type:', typeof orgsResponse);
          console.log('Organizations Response Keys:', orgsResponse ? Object.keys(orgsResponse) : 'null');
          
          let orgsData = [];
          if (orgsResponse) {
            if (Array.isArray(orgsResponse)) {
              orgsData = orgsResponse;
            } else if (orgsResponse.data) {
              orgsData = Array.isArray(orgsResponse.data) ? orgsResponse.data : (orgsResponse.data.results || []);
            } else if (orgsResponse.results) {
              orgsData = orgsResponse.results;
            }
          }
          setOrganizations(orgsData);
          console.log('✅ Organizations set to:', orgsData);
          console.log('✅ Organizations count:', orgsData.length);
        } catch (error) {
          console.error('❌ Failed to load organizations:', error);
          console.error('❌ Error details:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message
          });
          setOrganizations([]);
        }
        
        // Extract departments and job titles with better error handling
        try {
          const usersData = await rbacService.getUsers();
          console.log('Users Data for extraction:', usersData);
          
          let allUsers = [];
          if (usersData) {
            if (Array.isArray(usersData)) {
              allUsers = usersData;
            } else if (usersData.data) {
              allUsers = Array.isArray(usersData.data) ? usersData.data : (usersData.data.results || []);
            } else if (usersData.results) {
              allUsers = usersData.results;
            }
          }
          
          console.log('All Users array:', allUsers, 'is array:', Array.isArray(allUsers));
          
          if (Array.isArray(allUsers) && allUsers.length > 0) {
            const depts = allUsers
              .map(u => u?.department)
              .filter(d => d && typeof d === 'string' && d.trim() !== '');
            const uniqueDepartments = [...new Set(depts)].sort();
            
            const titles = allUsers
              .map(u => u?.job_title)
              .filter(j => j && typeof j === 'string' && j.trim() !== '');
            const uniqueJobTitles = [...new Set(titles)].sort();
            
            setDepartmentSuggestions(uniqueDepartments);
            setJobTitleSuggestions(uniqueJobTitles);
            console.log('Departments:', uniqueDepartments, 'Job Titles:', uniqueJobTitles);
          } else {
            setDepartmentSuggestions([]);
            setJobTitleSuggestions([]);
          }
        } catch (error) {
          console.error('Failed to extract departments/titles:', error);
          setDepartmentSuggestions([]);
          setJobTitleSuggestions([]);
        }
      } catch (err) {
        console.error('[UserManagement] Failed to load data:', err);
        console.error('[UserManagement] Error status:', err?.status);
        console.error('[UserManagement] Error message:', err?.message);
        
        // Soft-coded: Handle authentication errors
        if (err?.status === 401 || err?.message?.includes('401')) {
          console.warn('[UserManagement] Authentication error detected - redirecting to login');
          setAuthError(true);
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          navigate('/login', { 
            replace: true,
            state: { from: '/admin/users', message: 'Session expired. Please login again.' }
          });
        }
      }
    };
    loadData();
  }, [dispatch, isAuthenticated, navigate]);

  // Check if user has admin access via RBAC roles OR Django superuser/staff flags
  const hasRBACAdminRole = currentUser?.roles?.some(
    role => ['super_admin', 'admin'].includes(role.code)
  );
  
  const isDjangoSuperuser = authUser?.is_superuser || authUser?.is_staff;
  
  const hasAdminAccess = hasRBACAdminRole || isDjangoSuperuser;

  // Soft-coded: Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Authentication...</h2>
          <p className="text-gray-600">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAdminAccess && !loading && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access User Management.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Ensure users is always an array before filtering
  const safeUsers = Array.isArray(users) ? users : (users?.results ? users.results : []);
  const safeRoles = Array.isArray(roles) ? roles : (roles?.results ? roles.results : []);
  const safeModules = Array.isArray(modules) ? modules : (modules?.results ? modules.results : []);
  const safeOrganizations = Array.isArray(organizations) ? organizations : [];
  
  console.log('Debug - users:', users, 'safeUsers length:', safeUsers.length);
  console.log('Debug - roles:', roles, 'safeRoles length:', safeRoles.length);
  console.log('Debug - modules:', modules, 'safeModules length:', safeModules.length);
  console.log('Debug - organizations:', organizations, 'safeOrganizations length:', safeOrganizations.length);
  
  const filteredUsers = safeUsers.filter(user => {
    // Safe access to user properties with fallback
    const userEmail = user?.email || user?.user?.email || '';
    const userFullName = user?.full_name || `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim();
    
    const matchesSearch = userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userFullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      alert('Please fill in all required fields (Email, Password, First Name, Last Name)');
      return;
    }
    
    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.module_ids.length === 0) {
      alert('Please select at least one feature for the user');
      return;
    }
    
    if (!formData.organization_id) {
      alert('Please select an organization for the user');
      return;
    }
    
    try {
      // Prepare data to send
      const userData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        organization_id: formData.organization_id,
        department: formData.department,
        job_title: formData.job_title,
        phone: formData.phone_number,
        module_ids: formData.module_ids
      };
      
      console.log('🚀 Creating user with data:', userData);
      console.log('📋 Data types:', {
        email: typeof userData.email,
        organization_id: typeof userData.organization_id,
        module_ids: Array.isArray(userData.module_ids),
        module_ids_length: userData.module_ids?.length
      });
      
      // Send flattened data structure
      const response = await rbacService.createUser(userData);
      
      console.log('✅ User created successfully:', response);
      alert('User created successfully!');
      setShowCreateModal(false);
      dispatch(fetchUsers());
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        organization_id: '',
        department: '',
        job_title: '',
        phone_number: '',
        module_ids: []
      });
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Extract error message
      let errorMessage = 'Failed to create user. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          // Handle validation errors
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('\n');
          console.error('❌ Validation errors:', errors);
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      if (currentStatus === 'active') {
        await rbacService.deactivateUser(userId, 'Manual deactivation');
      } else {
        await rbacService.activateUser(userId);
      }
      dispatch(fetchUsers());
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleEditClick = (user) => {
    console.log('📝 Opening edit modal for user:', user);
    setSelectedUser(user);
    
    // Pre-populate the edit form with user data
    setEditFormData({
      email: user.email || user.user?.email || '',
      first_name: user.first_name || user.user?.first_name || '',
      last_name: user.last_name || user.user?.last_name || '',
      organization_id: user.organization?.id || '',
      department: user.department || '',
      job_title: user.job_title || '',
      phone_number: user.phone || '',
      module_ids: user.modules?.map(m => m.id) || []
    });
    
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('No user selected for update');
      return;
    }
    
    if (!editFormData.email) {
      alert('Email is required');
      return;
    }
    
    if (!editFormData.first_name || !editFormData.last_name) {
      alert('First name and last name are required');
      return;
    }
    
    if (editFormData.module_ids.length === 0) {
      alert('Please select at least one feature for the user');
      return;
    }
    
    try {
      const updateData = {
        email: editFormData.email,
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        organization_id: editFormData.organization_id,
        department: editFormData.department,
        job_title: editFormData.job_title,
        phone: editFormData.phone_number,
        module_ids: editFormData.module_ids
      };
      
      console.log('🚀 Updating user with data:', updateData);
      
      // Update user via API
      await rbacService.updateUser(selectedUser.id, updateData);
      
      console.log('✅ User updated successfully');
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      dispatch(fetchUsers());
      
      // Reset edit form
      setEditFormData({
        email: '',
        first_name: '',
        last_name: '',
        organization_id: '',
        department: '',
        job_title: '',
        phone_number: '',
        module_ids: []
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      let errorMessage = 'Failed to update user';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('\n');
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const toggleEditModule = (moduleId) => {
    setEditFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...prev.module_ids, moduleId]
    }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const toggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...prev.module_ids, moduleId]
    }));
  };

  const handleDepartmentInput = (value) => {
    setFormData({ ...formData, department: value });
    setShowDepartmentDropdown(value.length > 0);
  };

  const handleJobTitleInput = (value) => {
    setFormData({ ...formData, job_title: value });
    setShowJobTitleDropdown(value.length > 0);
  };

  const filteredDepartments = departmentSuggestions.filter(dept =>
    dept.toLowerCase().includes(formData.department.toLowerCase())
  );

  const filteredJobTitles = jobTitleSuggestions.filter(job =>
    job.toLowerCase().includes(formData.job_title.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Authentication Error Alert */}
        {authError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="mt-1 text-sm text-red-700">
                  You are not authenticated or your session has expired. Please <a href="/login" className="font-semibold underline hover:text-red-900">log in</a> to access this page.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their roles</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {(user?.full_name || user?.email || 'U')[0]?.toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.full_name || user?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{user?.email || user?.user?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department || '-'}</div>
                      <div className="text-sm text-gray-500">{user.job_title || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user?.primary_role ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {user.primary_role.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        className={`font-medium transition-colors ${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6">
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="Min. 8 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="Doe"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organization & Work Details Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization & Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.organization_id}
                          onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                          <option value="">Select an organization...</option>
                          {safeOrganizations.map(org => (
                            <option key={org.id} value={org.id}>
                              {org.name} {org.is_active ? '' : '(Inactive)'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => handleDepartmentInput(e.target.value)}
                          onFocus={() => setShowDepartmentDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDepartmentDropdown(false), 200)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="e.g., Engineering, Sales..."
                        />
                        {showDepartmentDropdown && filteredDepartments.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredDepartments.map((dept, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setFormData({ ...formData, department: dept });
                                  setShowDepartmentDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                              >
                                {dept}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                        <input
                          type="text"
                          value={formData.job_title}
                          onChange={(e) => handleJobTitleInput(e.target.value)}
                          onFocus={() => setShowJobTitleDropdown(true)}
                          onBlur={() => setTimeout(() => setShowJobTitleDropdown(false), 200)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="e.g., Senior Developer..."
                        />
                        {showJobTitleDropdown && filteredJobTitles.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredJobTitles.map((job, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setFormData({ ...formData, job_title: job });
                                  setShowJobTitleDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                              >
                                {job}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features & Access Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Features & Access <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Select the features this user can access</p>
                    
                    {safeModules.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {safeModules
                          .filter(module => module.is_active)
                          .map(module => (
                          <div
                            key={module.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.module_ids.includes(module.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  type="checkbox"
                                  checked={formData.module_ids.includes(module.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleModule(module.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                              <div className="ml-3 flex-1" onClick={() => toggleModule(module.id)}>
                                <label className="font-medium text-gray-900 cursor-pointer">
                                  {module.name}
                                </label>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                                {module.icon && (
                                  <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 rounded flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                      </svg>
                                      {module.icon}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">No features available. Please ensure modules are configured properly.</p>
                      </div>
                    )}
                    
                    {formData.module_ids.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Selected:</strong> {formData.module_ids.length} feature(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create User</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6">
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={editFormData.last_name}
                          onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 text-gray-700"
                        required
                        disabled
                        title="Email cannot be changed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                  </div>

                  {/* Organization Information */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                        <select
                          value={editFormData.organization_id}
                          onChange={(e) => setEditFormData({ ...editFormData, organization_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                          <option value="">Select Organization</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="e.g., Engineering..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                        <input
                          type="text"
                          value={editFormData.job_title}
                          onChange={(e) => setEditFormData({ ...editFormData, job_title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="e.g., Senior Developer..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.phone_number}
                          onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          placeholder="+971 XX XXX XXXX"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Module Assignment */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Access *</h3>
                    <p className="text-sm text-gray-600 mb-4">Select the features this user can access</p>
                    {modules && modules.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {modules.map((module) => (
                          <div
                            key={module.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              editFormData.module_ids.includes(module.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleEditModule(module.id)}
                          >
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  type="checkbox"
                                  checked={editFormData.module_ids.includes(module.id)}
                                  onChange={() => toggleEditModule(module.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                              <div className="ml-3 flex-1" onClick={() => toggleEditModule(module.id)}>
                                <label className="font-medium text-gray-900 cursor-pointer">
                                  {module.name}
                                </label>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">No features available.</p>
                      </div>
                    )}
                    
                    {editFormData.module_ids.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Selected:</strong> {editFormData.module_ids.length} feature(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update User</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
