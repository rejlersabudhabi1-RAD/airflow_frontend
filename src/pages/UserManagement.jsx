import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, fetchRoles, fetchModules, fetchCurrentUser } from '../store/slices/rbacSlice';
import rbacService from '../services/rbac.service';
import { STORAGE_KEYS } from '../config/app.config';
import { 
  validateUserForm, 
  parseBackendError, 
  prepareUserPayload,
  USER_MANAGEMENT_CONFIG 
} from '../config/userManagement.config';

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
  
  // Local state - Create User Wizard
  const [createUserStep, setCreateUserStep] = useState(1);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  
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
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState({});
  
  // Soft-coded configuration for bulk upload
  const BULK_UPLOAD_CONFIG = {
    acceptedFileTypes: '.csv',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    templateFileName: 'user_bulk_upload_template.csv',
    successMessage: 'Users uploaded successfully!',
    errorMessage: 'Failed to upload users. Please check your file and try again.',
    validationRules: {
      required: ['email', 'first_name', 'last_name'],
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    instructions: [
      'Download the CSV template using the button below',
      'Fill in the user details following the format in the template',
      '(Optional) Select an organization for all users',
      'Upload the completed CSV file'
    ]
  };
  
  // Local state - Forms
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    organization_id: '',
    department: '',
    job_title: '',
    phone: '',
    module_ids: [],
    role_ids: []
  });
  
  const [editFormData, setEditFormData] = useState({  email: '',
    first_name: '',
    last_name: '',
    organization_id: '',
    department: '',
    job_title: '',
    phone: '',
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
    
    // Create User Wizard Configuration
    CREATE_USER_STEPS: [
      { id: 1, name: 'Basic Info', icon: 'user', description: 'Personal details' },
      { id: 2, name: 'Account', icon: 'shield', description: 'Login credentials' },
      { id: 3, name: 'Organization', icon: 'building', description: 'Work details' },
      { id: 4, name: 'Access', icon: 'key', description: 'Roles & modules' }
    ],
    
    FORM_FIELDS: {
      STEP_1: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true, icon: 'user', placeholder: 'John' },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true, icon: 'user', placeholder: 'Doe' },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false, icon: 'phone', placeholder: '+971 50 123 4567' }
      ],
      STEP_2: [
        { name: 'email', label: 'Email Address', type: 'email', required: true, icon: 'mail', placeholder: 'john.doe@company.com' },
        { name: 'password', label: 'Password', type: 'password', required: true, icon: 'lock', placeholder: 'Min. 8 characters' },
        { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, icon: 'lock', placeholder: 'Re-enter password' }
      ],
      STEP_3: [
        { name: 'organization_id', label: 'Organization', type: 'select', required: false, icon: 'building', placeholder: 'Select organization' },
        { name: 'department', label: 'Department', type: 'text', required: false, icon: 'users', placeholder: 'Engineering' },
        { name: 'job_title', label: 'Job Title', type: 'text', required: false, icon: 'briefcase', placeholder: 'Software Engineer' }
      ],
      STEP_4: [
        { name: 'role_ids', label: 'Roles', type: 'multiselect', required: false, icon: 'shield', placeholder: 'Select roles' },
        { name: 'module_ids', label: 'Modules', type: 'multiselect', required: false, icon: 'grid', placeholder: 'Select accessible modules' }
      ]
    },
    
    PASSWORD_REQUIREMENTS: [
      { regex: /.{8,}/, label: 'At least 8 characters' },
      { regex: /[A-Z]/, label: 'One uppercase letter' },
      { regex: /[a-z]/, label: 'One lowercase letter' },
      { regex: /[0-9]/, label: 'One number' },
      { regex: /[^A-Za-z0-9]/, label: 'One special character' }
    ],
    
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
  
  // ========== HELPER: PASSWORD STRENGTH ==========
  const getPasswordStrength = useCallback((password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    CONFIG.PASSWORD_REQUIREMENTS.forEach(req => {
      if (req.regex.test(password)) score++;
    });
    
    const strengthLevels = [
      { min: 0, max: 1, label: 'Very Weak', color: 'bg-red-500' },
      { min: 2, max: 2, label: 'Weak', color: 'bg-orange-500' },
      { min: 3, max: 3, label: 'Fair', color: 'bg-yellow-500' },
      { min: 4, max: 4, label: 'Good', color: 'bg-blue-500' },
      { min: 5, max: 5, label: 'Strong', color: 'bg-green-500' }
    ];
    
    const level = strengthLevels.find(l => score >= l.min && score <= l.max);
    return { score, label: level.label, color: level.color, percentage: (score / 5) * 100 };
  }, [CONFIG.PASSWORD_REQUIREMENTS]);
  
  // ========== HELPER: WIZARD NAVIGATION ==========
  const canProceedToNextStep = useCallback(() => {
    const stepFields = CONFIG.FORM_FIELDS[`STEP_${createUserStep}`] || [];
    const canProceed = stepFields.every(field => {
      if (!field.required) return true;
      const value = formData[field.name];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.trim() !== '';
    });
    
    // Additional validation for Step 2 (Account credentials)
    if (createUserStep === 2 && canProceed) {
      // Check if password and confirmPassword match
      if (formData.password !== formData.confirmPassword) {
        console.log('[UserManagement] Step 2 validation failed: passwords do not match');
        return false;
      }
      
      // Check password strength
      if (formData.password && formData.password.length < 8) {
        console.log('[UserManagement] Step 2 validation failed: password too short');
        return false;
      }
    }
    
    if (!canProceed) {
      console.log(`[UserManagement] Step ${createUserStep} validation failed:`, {
        stepFields,
        formData: stepFields.reduce((acc, f) => ({ ...acc, [f.name]: formData[f.name] }), {})
      });
    }
    
    return canProceed;
  }, [createUserStep, formData, CONFIG.FORM_FIELDS]);
  
  const goToNextStep = () => {
    if (createUserStep < CONFIG.CREATE_USER_STEPS.length && canProceedToNextStep()) {
      setCreateUserStep(createUserStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (createUserStep > 1) {
      setCreateUserStep(createUserStep - 1);
    }
  };
  
  const resetCreateUserWizard = () => {
    setCreateUserStep(1);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
      organization_id: '',
      department: '',
      job_title: '',
      phone: '',
      module_ids: [],
      role_ids: []
    });
    setShowPasswordStrength(false);
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
  
  // ========== EMAIL VALIDATION - CLIENT SIDE ONLY ==========
  // Backend endpoint /users/validate-email/ doesn't exist, so we do client-side validation only
  useEffect(() => {
    if (!formData.email) {
      setEmailValidation({
        checking: false,
        isValid: false,
        isAvailable: false,
        message: ''
      });
      return;
    }
    
    const timer = setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(formData.email);
      
      setEmailValidation({
        checking: false,
        isValid: isValid,
        isAvailable: true, // Backend will validate on submit
        message: isValid ? '' : 'Invalid email format'
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.email]);
  
  // ========== DEBUG: BULK UPLOAD MODAL STATE ==========
  useEffect(() => {
    console.log('[DEBUG] showBulkUploadModal state changed:', showBulkUploadModal);
  }, [showBulkUploadModal]);
  
  // ========== HANDLERS: USER ACTIONS ==========
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    console.log('[UserManagement] Create user initiated');
    console.log('[UserManagement] Form data:', formData);
    
    // Advanced validation using soft-coded config
    const validation = validateUserForm(formData);
    
    console.log('[UserManagement] Validation result:', validation);
    
    if (!validation.valid) {
      console.error('[UserManagement] Validation failed:', validation.errors);
      
      // Show first error message
      const firstError = Object.values(validation.errors)[0];
      setNotification({
        show: true,
        type: 'error',
        message: firstError || 'Please check all fields and try again'
      });
      return;
    }
    
    try {
      setActionLoading({ create: true });
      
      // Prepare payload using soft-coded function
      const payload = prepareUserPayload(formData);
      
      console.log('[UserManagement] Sending payload:', payload);
      console.log('[UserManagement] Payload details:', {
        email: payload.email,
        hasPassword: !!payload.password,
        passwordLength: payload.password?.length,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role_ids: payload.role_ids,
        module_ids: payload.module_ids
      });
      
      const response = await rbacService.createUser(payload);
      console.log('[UserManagement] Create response:', response);
      
      // Refresh users list
      console.log('[UserManagement] Refreshing users list...');
      await dispatch(fetchUsers()).unwrap();
      console.log('[UserManagement] Users list refreshed');
      
      setNotification({
        show: true,
        type: 'success',
        message: USER_MANAGEMENT_CONFIG.successMessages.userCreated
      });
      
      setShowCreateModal(false);
      resetCreateUserWizard();
      
    } catch (error) {
      console.error('[UserManagement] Create user error:', error);
      console.error('[UserManagement] Error response:', error.response?.data);
      console.error('[UserManagement] Error response JSON:', JSON.stringify(error.response?.data, null, 2));
      console.error('[UserManagement] Error status:', error.response?.status);
      console.error('[UserManagement] Error headers:', error.response?.headers);
      console.error('[UserManagement] Full error object:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Parse backend error using soft-coded function
      const errorMessage = parseBackendError(error);
      
      // Show detailed error message including field-specific errors
      let detailedMessage = errorMessage;
      if (error.response?.data && typeof error.response.data === 'object') {
        const fieldErrors = [];
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (field !== 'detail' && field !== 'message') {
            const errorText = Array.isArray(messages) ? messages.join(', ') : messages;
            fieldErrors.push(`${field}: ${errorText}`);
          }
        }
        if (fieldErrors.length > 0) {
          detailedMessage = `${errorMessage}\n\nDetails:\n${fieldErrors.join('\n')}`;
        }
      }
      
      setNotification({
        show: true,
        type: 'error',
        message: detailedMessage
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
        phone: editFormData.phone,
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
      phone: user.phone || '',
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
    
    console.log('[BulkUpload] ========== Starting Upload Process ==========');
    console.log('[BulkUpload] File:', bulkUploadFile);
    console.log('[BulkUpload] Organization ID:', formData.organization_id);
    
    if (!bulkUploadFile) {
      console.warn('[BulkUpload] No file selected!');
      setNotification({
        show: true,
        type: 'error',
        message: 'Please select a file to upload'
      });
      return;
    }
    
    // File size validation
    if (bulkUploadFile.size > BULK_UPLOAD_CONFIG.maxFileSize) {
      console.warn('[BulkUpload] File too large:', bulkUploadFile.size);
      setNotification({
        show: true,
        type: 'error',
        message: `File size exceeds ${BULK_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
      });
      return;
    }
    
    try {
      setActionLoading({ bulkUpload: true });
      setBulkUploadProgress(10);
      console.log('[BulkUpload] Loading state set, progress: 10%');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', bulkUploadFile);
      
      // Add organization_id if selected (optional)
      if (formData.organization_id) {
        uploadFormData.append('organization_id', formData.organization_id);
        console.log('[BulkUpload] Organization ID added to form data');
      }
      
      console.log('[BulkUpload] Sending API request...');
      setBulkUploadProgress(30);
      
      const response = await rbacService.bulkUploadUsers(uploadFormData);
      
      console.log('[BulkUpload] ✓ Response received:', response);
      setBulkUploadProgress(70);
      
      setBulkUploadResults(response.data || response);
      
      // Refresh users list
      console.log('[BulkUpload] Refreshing user list...');
      await dispatch(fetchUsers()).unwrap();
      setBulkUploadProgress(90);
      
      const summary = response.data?.summary || response.summary || {};
      console.log('[BulkUpload] Upload summary:', summary);
      
      setNotification({
        show: true,
        type: summary.failed > 0 ? 'warning' : 'success',
        message: `${BULK_UPLOAD_CONFIG.successMessage} Success: ${summary.successful || 0}, Failed: ${summary.failed || 0}, Skipped: ${summary.skipped || 0}`
      });
      
      // Clear file
      setBulkUploadFile(null);
      setBulkUploadProgress(100);
      
      console.log('[BulkUpload] ========== Upload Complete! ==========');
      
      // Auto-hide progress after 2 seconds
      setTimeout(() => setBulkUploadProgress(0), 2000);
      
    } catch (error) {
      console.error('[BulkUpload] ========== ERROR ==========');
      console.error('[BulkUpload] Error object:', error);
      console.error('[BulkUpload] Error message:', error.message);
      console.error('[BulkUpload] Error response:', error.response?.data);
      console.error('[BulkUpload] Error status:', error.response?.status);
      
      let errorMessage = BULK_UPLOAD_CONFIG.errorMessage;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setNotification({
        show: true,
        type: 'error',
        message: errorMessage
      });
      
      setBulkUploadProgress(0);
    } finally {
      setActionLoading({ bulkUpload: false });
      console.log('[BulkUpload] Loading state cleared');
    }
  };
  
  const handleBulkUploadFileChange = (e) => {
    const file = e.target.files[0];
    console.log('[BulkUpload] File selected:', file);
    
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        console.warn('[BulkUpload] Invalid file type:', file.name);
        setNotification({
          show: true,
          type: 'error',
          message: 'Please upload a CSV file only'
        });
        e.target.value = null; // Clear input
        return;
      }
      
      // Validate file size
      if (file.size > BULK_UPLOAD_CONFIG.maxFileSize) {
        console.warn('[BulkUpload] File too large:', file.size);
        setNotification({
          show: true,
          type: 'error',
          message: `File size must be less than ${BULK_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`
        });
        e.target.value = null; // Clear input
        return;
      }
      
      console.log('[BulkUpload] File validated successfully');
      setBulkUploadFile(file);
      setBulkUploadResults(null);
      setBulkUploadProgress(0);
      
      setNotification({
        show: true,
        type: 'info',
        message: `File "${file.name}" selected. Ready to upload.`
      });
    }
  };
  
  const handleDownloadTemplate = async () => {
    try {
      console.log('[BulkUpload] Downloading template...');
      
      const response = await rbacService.downloadBulkUploadTemplate();
      
      console.log('[BulkUpload] Template response:', response);
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', BULK_UPLOAD_CONFIG.templateFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('[BulkUpload] Template downloaded successfully');
      
      setNotification({
        show: true,
        type: 'success',
        message: `Template "${BULK_UPLOAD_CONFIG.templateFileName}" downloaded successfully!`
      });
    } catch (error) {
      console.error('[BulkUpload] Template download error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to download template. Please try again or contact support.'
      });
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
              onClick={() => {
                console.log('Bulk Upload button clicked');
                setShowBulkUploadModal(true);
              }}
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
      
      {/* Create User Modal - Innovative Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Create New User</h2>
                  <p className="text-blue-100 mt-1">Step {createUserStep} of {CONFIG.CREATE_USER_STEPS.length}</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateUserWizard();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Step Progress Bar */}
              <div className="mt-6 flex items-center justify-between">
                {CONFIG.CREATE_USER_STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                        createUserStep === step.id 
                          ? 'bg-white text-blue-600 shadow-lg scale-110' 
                          : createUserStep > step.id
                          ? 'bg-green-400 text-white'
                          : 'bg-blue-400 bg-opacity-50 text-white'
                      }`}>
                        {createUserStep > step.id ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${createUserStep === step.id ? 'text-white' : 'text-blue-200'}`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-blue-100">{step.description}</p>
                    </div>
                    {index < CONFIG.CREATE_USER_STEPS.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                        createUserStep > step.id ? 'bg-green-400' : 'bg-blue-400 bg-opacity-30'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
              <form onSubmit={handleCreateUser}>
                {/* Step 1: Basic Info */}
                {createUserStep === 1 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Personal Details</h3>
                      <p className="text-gray-600 mt-2">Let's start with the basic information</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="John"
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Doe"
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          placeholder="+971 50 123 4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Account */}
                {createUserStep === 2 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Account Credentials</h3>
                      <p className="text-gray-600 mt-2">Set up login credentials for the user</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          placeholder="john.doe@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">User will use this email to log in</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showPasswordStrength ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({...formData, password: e.target.value});
                            setShowPasswordStrength(e.target.value.length > 0);
                          }}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordStrength(!showPasswordStrength)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPasswordStrength ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Password Strength</span>
                            <span className={`text-xs font-bold ${
                              getPasswordStrength(formData.password).score < 3 ? 'text-red-600' :
                              getPasswordStrength(formData.password).score < 4 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {getPasswordStrength(formData.password).label}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                              style={{ width: `${getPasswordStrength(formData.password).percentage}%` }}
                            />
                          </div>
                          
                          {/* Password Requirements */}
                          <div className="mt-3 space-y-1">
                            {CONFIG.PASSWORD_REQUIREMENTS.map((req, idx) => (
                              <div key={idx} className="flex items-center text-xs">
                                {req.regex.test(formData.password) ? (
                                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <span className={req.regex.test(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                                  {req.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            formData.confirmPassword && formData.password !== formData.confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="mt-2 flex items-center text-xs text-red-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Passwords do not match
                        </div>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Passwords match
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Step 3: Organization */}
                {createUserStep === 3 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Organization Details</h3>
                      <p className="text-gray-600 mt-2">Assign organizational information</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Organization <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <select
                          value={formData.organization_id}
                          onChange={(e) => setFormData({...formData, organization_id: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                        >
                          <option value="">Select organization</option>
                          {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Engineering"
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Job Title <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Software Engineer"
                            value={formData.job_title}
                            onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Access */}
                {createUserStep === 4 && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Access Permissions</h3>
                      <p className="text-gray-600 mt-2">Assign roles and module access</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Roles <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                        {Array.isArray(roles) && roles.map(role => (
                          <label
                            key={role.id}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              formData.role_ids?.includes(role.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.role_ids?.includes(role.id) || false}
                              onChange={(e) => {
                                const currentRoles = formData.role_ids || [];
                                if (e.target.checked) {
                                  setFormData({...formData, role_ids: [...currentRoles, role.id]});
                                } else {
                                  setFormData({...formData, role_ids: currentRoles.filter(id => id !== role.id)});
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900">{role.name}</span>
                              {role.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Accessible Modules <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                        {Array.isArray(modules) && modules.map(module => (
                          <label
                            key={module.id}
                            className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              formData.module_ids?.includes(module.code)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.module_ids?.includes(module.code) || false}
                              onChange={(e) => {
                                const currentModules = formData.module_ids || [];
                                if (e.target.checked) {
                                  setFormData({...formData, module_ids: [...currentModules, module.code]});
                                } else {
                                  setFormData({...formData, module_ids: currentModules.filter(code => code !== module.code)});
                                }
                              }}
                              className="mb-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-xs font-medium text-center text-gray-900">{module.name}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{module.code}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">User</p>
                          <p className="text-gray-900">{formData.first_name} {formData.last_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Email</p>
                          <p className="text-gray-900">{formData.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Organization</p>
                          <p className="text-gray-900">{organizations.find(o => o.id === formData.organization_id)?.name || 'Not assigned'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Department</p>
                          <p className="text-gray-900">{formData.department || 'Not assigned'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Roles</p>
                          <p className="text-gray-900">{formData.role_ids?.length || 0} assigned</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Modules</p>
                          <p className="text-gray-900">{formData.module_ids?.length || 0} assigned</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-5 flex items-center justify-between border-t border-gray-200">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={createUserStep === 1}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex items-center gap-3">
                {createUserStep < CONFIG.CREATE_USER_STEPS.length ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!canProceedToNextStep()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg"
                  >
                    Next Step
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCreateUser}
                      disabled={actionLoading.create || !canProceedToNextStep()}
                      title={!canProceedToNextStep() ? 'Please fill all required fields' : 'Create new user'}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg"
                    >
                      {actionLoading.create ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Create User
                        </>
                      )}
                    </button>
                    {!canProceedToNextStep() && (
                      <p className="text-xs text-red-600">
                        ⚠️ Please fill all required fields
                      </p>
                    )}
                  </>
                )}
              </div>
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
      
      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Users</h2>
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadFile(null);
                    setBulkUploadResults(null);
                  }}
                  disabled={actionLoading.bulkUpload}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkUpload} className="p-6">
              <div className="space-y-6">
                {/* Progress Bar */}
                {bulkUploadProgress > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Upload Progress</span>
                      <span className="text-sm font-bold text-blue-900">{bulkUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${bulkUploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use Bulk Upload:</h3>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        {BULK_UPLOAD_CONFIG.instructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ol>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md hover:shadow-lg"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Selection (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization (Optional)
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({...formData, organization_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Organization (optional)</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">If not selected, organization can be specified in CSV file per user</p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUploadFileChange}
                      className="hidden"
                      id="bulk-upload-file"
                    />
                    <label htmlFor="bulk-upload-file" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600 mb-1">
                        {bulkUploadFile ? bulkUploadFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">CSV file only</p>
                    </label>
                  </div>
                </div>

                {/* Upload Results */}
                {bulkUploadResults && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Upload Summary</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-700">{bulkUploadResults.summary?.successful || 0}</p>
                          <p className="text-xs text-green-600">Successful</p>
                        </div>
                        <div className="bg-red-100 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-700">{bulkUploadResults.summary?.failed || 0}</p>
                          <p className="text-xs text-red-600">Failed</p>
                        </div>
                        <div className="bg-yellow-100 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-yellow-700">{bulkUploadResults.summary?.skipped || 0}</p>
                          <p className="text-xs text-yellow-600">Skipped</p>
                        </div>
                      </div>
                    </div>

                    {bulkUploadResults.details && (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {/* Success */}
                        {bulkUploadResults.details.success && bulkUploadResults.details.success.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-700 mb-2">Successfully Created ({bulkUploadResults.details.success.length})</h4>
                            <div className="space-y-1">
                              {bulkUploadResults.details.success.map((item, idx) => (
                                <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                                  Row {item.row}: {item.email} - {item.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Failed */}
                        {bulkUploadResults.details.failed && bulkUploadResults.details.failed.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-700 mb-2">Failed ({bulkUploadResults.details.failed.length})</h4>
                            <div className="space-y-1">
                              {bulkUploadResults.details.failed.map((item, idx) => (
                                <div key={idx} className="text-sm bg-red-50 p-2 rounded">
                                  Row {item.row}: {item.email} - {item.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skipped */}
                        {bulkUploadResults.details.skipped && bulkUploadResults.details.skipped.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-700 mb-2">Skipped ({bulkUploadResults.details.skipped.length})</h4>
                            <div className="space-y-1">
                              {bulkUploadResults.details.skipped.map((item, idx) => (
                                <div key={idx} className="text-sm bg-yellow-50 p-2 rounded">
                                  Row {item.row}: {item.email} - {item.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadFile(null);
                    setBulkUploadResults(null);
                  }}
                  disabled={actionLoading.bulkUpload}
                  className={`px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg transition-colors font-medium ${
                    actionLoading.bulkUpload ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  {bulkUploadResults ? 'Close' : 'Cancel'}
                </button>
                {!bulkUploadResults && (
                  <button
                    type="submit"
                    disabled={actionLoading.bulkUpload || !bulkUploadFile}
                    className={`px-6 py-2.5 bg-green-600 text-white rounded-lg transition-colors font-medium shadow-lg flex items-center space-x-2 ${
                      actionLoading.bulkUpload || !bulkUploadFile
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-green-700 hover:shadow-xl'
                    }`}
                  >
                    {actionLoading.bulkUpload ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload Users</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
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
