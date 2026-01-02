import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, fetchRoles, fetchModules, fetchCurrentUser } from '../store/slices/rbacSlice';
import rbacService from '../services/rbac.service';
import { STORAGE_KEYS } from '../config/app.config';

/**
 * User Management Page - Rebuilt
 * CRUD operations for users with role assignment
 * Soft-coded with proper state management
 */
const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { users, roles, modules, currentUser, loading } = useSelector((state) => state.rbac);
  const { user: authUser } = useSelector((state) => state.auth);
  
  // Local state - Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Local state - UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Local state - Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Local state - Data
  const [organizations, setOrganizations] = useState([]);
  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState([]);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // Local state - Forms
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
  
  const [emailValidation, setEmailValidation] = useState({
    checking: false,
    isValid: false,
    isAvailable: false,
    message: ''
  });
  
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  
  // Soft-coded: Configuration constants
  const CONFIG = useMemo(() => ({
    NOTIFICATION_TIMEOUT: 5000,
    ACTION_BUTTONS: {
      EDIT: {
        label: 'Edit',
        color: 'text-blue-600 hover:text-blue-900',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      },
      ACTIVATE: {
        label: 'Activate',
        color: 'text-green-600 hover:text-green-900',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      DEACTIVATE: {
        label: 'Deactivate',
        color: 'text-red-600 hover:text-red-900',
        icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
      },
      DELETE: {
        label: 'Delete',
        color: 'text-red-600 hover:text-red-900',
        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
      }
    }
  }), []);
  
  // ========== LIFECYCLE: AUTHENTICATION & DATA LOADING ==========
  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async () => {
      try {
        // Check authentication
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        console.log('[UserManagement] Initializing component...');
        console.log('[UserManagement] Token exists:', !!token);
        
        if (!token && !refreshToken) {
          console.warn('[UserManagement] No authentication tokens - redirecting to login');
          navigate('/login', { 
            replace: true,
            state: { from: '/admin/users', message: 'Please login to access User Management' }
          });
          return;
        }
        
        if (!isMounted) return;
        setIsAuthenticated(true);
        
        // Load all data
        console.log('[UserManagement] Loading data...');
        
        // Fetch current user
        await dispatch(fetchCurrentUser()).unwrap();
        
        // Fetch core data in parallel
        const [usersResult, rolesResult, modulesResult] = await Promise.allSettled([
          dispatch(fetchUsers()).unwrap(),
          dispatch(fetchRoles()).unwrap(),
          dispatch(fetchModules()).unwrap()
        ]);
        
        console.log('[UserManagement] Core data loaded:', {
          users: usersResult.status,
          roles: rolesResult.status,
          modules: modulesResult.status
        });
        
        // Load organizations
        try {
          const orgsResponse = await rbacService.getOrganizations();
          let orgsData = [];
          
          if (Array.isArray(orgsResponse)) {
            orgsData = orgsResponse;
          } else if (orgsResponse?.data) {
            orgsData = Array.isArray(orgsResponse.data) 
              ? orgsResponse.data 
              : (orgsResponse.data.results || []);
          } else if (orgsResponse?.results) {
            orgsData = orgsResponse.results;
          }
          
          if (isMounted) {
            setOrganizations(orgsData);
            console.log('[UserManagement] Organizations loaded:', orgsData.length);
          }
        } catch (error) {
          console.error('[UserManagement] Failed to load organizations:', error);
          if (isMounted) setOrganizations([]);
        }
        
        // Extract departments and job titles
        try {
          const usersData = await rbacService.getUsers();
          let allUsers = [];
          
          if (Array.isArray(usersData)) {
            allUsers = usersData;
          } else if (usersData?.data) {
            allUsers = Array.isArray(usersData.data) 
              ? usersData.data 
              : (usersData.data.results || []);
          } else if (usersData?.results) {
            allUsers = usersData.results;
          }
          
          if (isMounted && allUsers.length > 0) {
            const departments = [...new Set(
              allUsers
                .map(u => u?.department)
                .filter(d => d && d.trim())
            )].sort();
            
            const jobTitles = [...new Set(
              allUsers
                .map(u => u?.job_title)
                .filter(j => j && j.trim())
            )].sort();
            
            setDepartmentSuggestions(departments);
            setJobTitleSuggestions(jobTitles);
            console.log('[UserManagement] Extracted:', departments.length, 'departments,', jobTitles.length, 'job titles');
          }
        } catch (error) {
          console.error('[UserManagement] Failed to extract suggestions:', error);
        }
        
        if (isMounted) {
          setIsDataLoaded(true);
          console.log('[UserManagement] Initialization complete');
        }
        
      } catch (error) {
        console.error('[UserManagement] Initialization failed:', error);
        
        if (error?.status === 401 || error?.message?.includes('401')) {
          console.warn('[UserManagement] Authentication expired - clearing tokens');
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          
          if (isMounted) {
            navigate('/login', { 
              replace: true,
              state: { from: '/admin/users', message: 'Session expired. Please login again.' }
            });
          }
        }
      }
    };
    
    initializeComponent();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate]);
  
  // ========== LIFECYCLE: NOTIFICATION AUTO-DISMISS ==========
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, CONFIG.NOTIFICATION_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [notification.show, CONFIG.NOTIFICATION_TIMEOUT]);
  
  // ========== COMPUTED: ADMIN ACCESS CHECK ==========
  const hasAdminAccess = useMemo(() => {
    const hasRBACRole = currentUser?.roles?.some(
      role => ['super_admin', 'admin'].includes(role.code)
    );
    const isDjangoAdmin = authUser?.is_superuser || authUser?.is_staff;
    return hasRBACRole || isDjangoAdmin;
  }, [currentUser, authUser]);
  
  // ========== COMPUTED: FILTERED USERS ==========
  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    
    return safeUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);
  
  // ========== EMAIL VALIDATION ==========
  const validateEmail = useCallback(async (email) => {
    if (!email) {
      setEmailValidation({
        checking: false,
        isValid: false,
        isAvailable: false,
        message: ''
      });
      return;
    }
    
    setEmailValidation(prev => ({ ...prev, checking: true }));
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/validate-email/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ email })
        }
      );
      
      const data = await response.json();
      
      setEmailValidation({
        checking: false,
        isValid: data.is_valid,
        isAvailable: data.is_available,
        message: data.message
      });
    } catch (error) {
      console.error('[UserManagement] Email validation error:', error);
      setEmailValidation({
        checking: false,
        isValid: false,
        isAvailable: false,
        message: 'Failed to validate email'
      });
    }
  }, []);
  
  // Debounced email validation
  useEffect(() => {
    if (!formData.email) return;
    
    const timer = setTimeout(() => {
      validateEmail(formData.email);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.email, validateEmail]);
  
  // ========== HANDLERS: USER ACTIONS ==========
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading({ create: true });
      
      const payload = {
        user: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password
        },
        organization_id: formData.organization_id,
        department: formData.department,
        job_title: formData.job_title,
        phone_number: formData.phone_number,
        module_ids: formData.module_ids
      };
      
      await rbacService.createUser(payload);
      
      // Refresh users list
      await dispatch(fetchUsers()).unwrap();
      
      setNotification({
        show: true,
        type: 'success',
        message: 'User created successfully'
      });
      
      setShowCreateModal(false);
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
      console.error('[UserManagement] Create user error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to create user'
      });
    } finally {
      setActionLoading({ create: false });
    }
  };
  
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      setActionLoading({ [`edit_${selectedUser.id}`]: true });
      
      const payload = {
        user: {
          email: editFormData.email,
          first_name: editFormData.first_name,
          last_name: editFormData.last_name
        },
        organization_id: editFormData.organization_id,
        department: editFormData.department,
        job_title: editFormData.job_title,
        phone_number: editFormData.phone_number,
        module_ids: editFormData.module_ids
      };
      
      await rbacService.updateUser(selectedUser.id, payload);
      
      // Refresh users list
      await dispatch(fetchUsers()).unwrap();
      
      setNotification({
        show: true,
        type: 'success',
        message: 'User updated successfully'
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('[UserManagement] Update user error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to update user'
      });
    } finally {
      setActionLoading({ [`edit_${selectedUser.id}`]: false });
    }
  };
  
  const handleStatusToggle = async (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    const confirmMessage = currentStatus === 'active'
      ? 'Are you sure you want to deactivate this user?'
      : 'Are you sure you want to activate this user?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setActionLoading({ [`status_${userId}`]: true });
      
      if (action === 'deactivate') {
        await rbacService.deactivateUser(userId, 'Manual deactivation');
      } else {
        await rbacService.activateUser(userId);
      }
      
      // Refresh users list
      await dispatch(fetchUsers()).unwrap();
      
      setNotification({
        show: true,
        type: 'success',
        message: `User ${action}d successfully`
      });
      
    } catch (error) {
      console.error(`[UserManagement] ${action} error:`, error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || `Failed to ${action} user`
      });
    } finally {
      setActionLoading({ [`status_${userId}`]: false });
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading({ [`delete_${userId}`]: true });
      
      await rbacService.softDeleteUser(userId);
      
      // Refresh users list
      await dispatch(fetchUsers()).unwrap();
      
      setNotification({
        show: true,
        type: 'success',
        message: 'User deleted successfully'
      });
      
    } catch (error) {
      console.error('[UserManagement] Delete user error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete user'
      });
    } finally {
      setActionLoading({ [`delete_${userId}`]: false });
    }
  };
  
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.user?.email || '',
      first_name: user.user?.first_name || '',
      last_name: user.user?.last_name || '',
      organization_id: user.organization || '',
      department: user.department || '',
      job_title: user.job_title || '',
      phone_number: user.phone_number || '',
      module_ids: user.accessible_modules || []
    });
    setShowEditModal(true);
  };
  
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    
    if (!bulkUploadFile) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please select a file'
      });
      return;
    }
    
    try {
      setActionLoading({ bulkUpload: true });
      
      const formData = new FormData();
      formData.append('file', bulkUploadFile);
      
      const response = await rbacService.bulkUploadUsers(formData);
      
      setBulkUploadResults(response.data);
      
      // Refresh users list
      await dispatch(fetchUsers()).unwrap();
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Bulk upload completed'
      });
      
    } catch (error) {
      console.error('[UserManagement] Bulk upload error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to upload users'
      });
    } finally {
      setActionLoading({ bulkUpload: false });
    }
  };
  
  // ========== RENDER: LOADING STATE ==========
  if (!isAuthenticated || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading User Management</h2>
          <p className="text-gray-600">Please wait while we load your data...</p>
        </div>
      </div>
    );
  }
  
  // ========== RENDER: NO ADMIN ACCESS ==========
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access User Management</p>
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
  
  // ========== RENDER: MAIN COMPONENT ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white max-w-md`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Bulk Upload
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{filteredUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {filteredUsers.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Roles</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{Array.isArray(roles) ? roles.length : 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Modules</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{Array.isArray(modules) ? modules.length : 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-600 text-lg font-medium">No users found</p>
                      <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.user?.first_name?.[0] || user.user?.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.user?.first_name} {user.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.organization_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.job_title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.accessible_modules?.length || 0} modules
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading[`edit_${user.id}`]}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.status)}
                          disabled={actionLoading[`status_${user.id}`]}
                          className={`${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } disabled:opacity-50`}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                              user.status === 'active'
                                ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            } />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading[`delete_${user.id}`]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Create Modal - Simplified placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
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
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={actionLoading.create}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading.create ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal - Simplified placeholder */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={actionLoading[`edit_${selectedUser.id}`]}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading[`edit_${selectedUser.id}`] ? 'Updating...' : 'Update User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
