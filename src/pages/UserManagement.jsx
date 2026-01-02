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
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Local state - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Local state - User Details
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [detailedUser, setDetailedUser] = useState(null);
  
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
    ITEMS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
    DEFAULT_ITEMS_PER_PAGE: 10,
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
  
  // ========== HELPER: SAFE DATA EXTRACTION ==========
  // Handle both nested (user.user.email) and flat (user.email) data structures
  const getUserEmail = (user) => {
    return user.user?.email || user.email || null;
  };
  
  const getUserFirstName = (user) => {
    return user.user?.first_name || user.first_name || null;
  };
  
  const getUserLastName = (user) => {
    return user.user?.last_name || user.last_name || null;
  };
  
  const getUserUsername = (user) => {
    return user.user?.username || user.username || null;
  };
  
  const getUserDisplayName = (user) => {
    const firstName = getUserFirstName(user);
    const lastName = getUserLastName(user);
    const username = getUserUsername(user);
    const email = getUserEmail(user);
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (username) {
      return username;
    } else if (email) {
      return email.split('@')[0]; // Use email prefix
    }
    return 'Unknown User';
  };
  
  const getUserInitial = (user) => {
    const firstName = getUserFirstName(user);
    const lastName = getUserLastName(user);
    const email = getUserEmail(user);
    
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

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
        
        // Debug: Check first user data structure
        if (usersResult.status === 'fulfilled' && usersResult.value?.length > 0) {
          console.log('[UserManagement] First user sample:', usersResult.value[0]);
          console.log('[UserManagement] User has "user" nested object?', !!usersResult.value[0].user);
          console.log('[UserManagement] User has direct "email"?', !!usersResult.value[0].email);
        }
        
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
      const email = getUserEmail(user) || '';
      const firstName = getUserFirstName(user) || '';
      const lastName = getUserLastName(user) || '';
      const department = user.department || '';
      const jobTitle = user.job_title || '';
      
      const matchesSearch = !searchTerm || 
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      const matchesRole = roleFilter === 'all' || 
        user.roles?.some(role => role.id === roleFilter);
      
      const matchesOrganization = organizationFilter === 'all' || 
        user.organization === organizationFilter;
      
      return matchesSearch && matchesStatus && matchesRole && matchesOrganization;
    });
  }, [users, searchTerm, statusFilter, roleFilter, organizationFilter]);
  
  // ========== COMPUTED: PAGINATED USERS ==========
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);
  
  // ========== COMPUTED: PAGINATION INFO ==========
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const showingFrom = filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredUsers.length);
  
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
  
  const openUserDetails = (user) => {
    setDetailedUser(user);
    setShowUserDetailsModal(true);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
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
        
        {/* Search and Advanced Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, email, department, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Roles</option>
              {Array.isArray(roles) && roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setOrganizationFilter('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-600">Showing {showingFrom}-{showingTo} of {filteredUsers.length}</span>
            </div>
          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
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
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {getUserInitial(user)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-xs text-gray-500">{user.job_title || 'No job title'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getUserEmail(user) || 'N/A'}</div>
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
                          onClick={() => openUserDetails(user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
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
        
        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> results
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CONFIG.ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option} per page</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
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
      
      {/* User Details Modal */}
      {showUserDetailsModal && detailedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {detailedUser.user?.first_name?.[0] || detailedUser.user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {detailedUser.user?.first_name} {detailedUser.user?.last_name}
                  </h2>
                  <p className="text-gray-600">{detailedUser.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  detailedUser.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {detailedUser.status === 'active' ? '● Active' : '● Inactive'}
                </span>
                {detailedUser.user?.is_staff && (
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                    ★ Staff Member
                  </span>
                )}
                {detailedUser.user?.is_superuser && (
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                    ⚡ Superuser
                  </span>
                )}
              </div>
              
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Username</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.employee_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Organization & Department */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Organization & Role
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Organization</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.organization_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Title</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.job_title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Manager</p>
                    <p className="text-base font-medium text-gray-900">{detailedUser.manager || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Roles */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Assigned Roles
                  <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                    {detailedUser.roles?.length || 0}
                  </span>
                </h3>
                {detailedUser.roles && detailedUser.roles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {detailedUser.roles.map((role) => (
                      <div key={role.id} className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{role.name}</p>
                            <p className="text-sm text-gray-600">{role.code}</p>
                          </div>
                          {role.is_primary && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="mt-2 text-sm text-gray-600">{role.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No roles assigned</p>
                )}
              </div>
              
              {/* Accessible Modules */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Accessible Modules
                  <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                    {detailedUser.accessible_modules?.length || 0}
                  </span>
                </h3>
                {detailedUser.accessible_modules && detailedUser.accessible_modules.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {detailedUser.accessible_modules.map((moduleCode) => {
                      const moduleInfo = modules?.find(m => m.code === moduleCode);
                      return (
                        <div key={moduleCode} className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="font-semibold text-gray-900 text-sm">{moduleInfo?.name || moduleCode}</p>
                          <p className="text-xs text-gray-600 mt-1">{moduleInfo?.code || moduleCode}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No modules assigned</p>
                )}
              </div>
              
              {/* Activity Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activity Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Login</p>
                    <p className="text-base font-medium text-gray-900">
                      {detailedUser.last_login_at 
                        ? new Date(detailedUser.last_login_at).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created At</p>
                    <p className="text-base font-medium text-gray-900">
                      {detailedUser.created_at 
                        ? new Date(detailedUser.created_at).toLocaleString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Updated At</p>
                    <p className="text-base font-medium text-gray-900">
                      {detailedUser.updated_at 
                        ? new Date(detailedUser.updated_at).toLocaleString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Storage Used</p>
                    <p className="text-base font-medium text-gray-900">
                      {detailedUser.storage_used 
                        ? `${(detailedUser.storage_used / (1024 * 1024)).toFixed(2)} MB`
                        : '0 MB'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    openEditModal(detailedUser);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit User
                </button>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
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
