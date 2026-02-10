/**
 * P&ID Upload with Project Management & Reference Documents
 * SOFT-CODED: Following PFD Verification design pattern
 * - Project creation and selection
 * - Reference document uploads (ISO standards, legends, datasheets)
 * - Document upload within project context
 * - Preserves core P&ID verification logic
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FolderPlus, Edit, Trash2, X, CheckCircle, Loader, ArrowLeft, Upload as UploadIcon, FileText } from 'lucide-react';
import apiClient from '../services/api.service';
import { STORAGE_KEYS } from '../config/app.config';

const PIDUpload = () => {
  const navigate = useNavigate();
  
  // SOFT-CODED: Reference documents configuration for P&ID verification
  const referenceDocuments = [
    { key: 'pfd_document', label: 'PFD (Process Flow Diagram)', icon: FileText, color: 'cyan', required: true, description: 'P&IDs are generated from PFDs - upload for cross-verification' },
    { key: 'iso_standards', label: 'ISO Standards (ISO 15926, ISO 10628)', icon: FileText, color: 'blue', required: false },
    { key: 'pid_standards', label: 'P&ID Standards & Guidelines', icon: FileText, color: 'green', required: true },
    { key: 'legends_symbols', label: 'Legends and Symbols', icon: FileText, color: 'purple', required: true },
    { key: 'equipment_datasheet', label: 'Equipment Datasheets', icon: FileText, color: 'orange', required: false },
    { key: 'instrument_datasheet', label: 'Instrument Datasheets', icon: FileText, color: 'indigo', required: false },
    { key: 'process_description', label: 'Process Description', icon: FileText, color: 'pink', required: false },
    { key: 'safety_requirements', label: 'Safety Requirements (SIL, HAZOP)', icon: FileText, color: 'red', required: false },
    { key: 'other_documents', label: 'Other Reference Documents', icon: FileText, color: 'gray', required: false }
  ];
  
  // Project management state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  
  // Reference documents state
  const [referenceFiles, setReferenceFiles] = useState({});
  
  // Edit/Delete modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Upload state (existing logic preserved)
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    drawing_number: '',
    drawing_title: '',
    revision: '',
    project_name: '',
    auto_analyze: true,
    // Structured drawing number fields
    area: '',
    p_area: '',
    doc_code: '',
    serial_number: '',
    rev: '',
    sheet_number: '',
    total_sheets: ''
  });
  const [useStructuredNumber, setUseStructuredNumber] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);
  const uploadTimeoutRef = useRef(null);
  
  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  
  // ========== PROJECT MANAGEMENT FUNCTIONS ==========
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await apiClient.get('/pid/projects/');
      setProjects(response.data.projects || response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a project name' });
      return;
    }

    setCreatingProject(true);
    try {
      const response = await apiClient.post('/pid/projects/', {
        name: newProjectName,
        description: newProjectDescription
      });

      const newProject = response.data.project || response.data;
      setSelectedProject(newProject);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Update form with project name
      setFormData(prev => ({
        ...prev,
        project_name: newProject.project_name || newProject.name
      }));
      
      fetchProjects();
      setMessage({ type: 'success', text: `Project "${newProject.project_name || newProject.name}" created successfully!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create project' });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditProjectName(project.project_name || project.name);
    setEditProjectDescription(project.description || '');
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    if (!editProjectName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a project name' });
      return;
    }

    setUpdatingProject(true);
    try {
      await apiClient.put(`/pid/projects/${editingProject.id}/`, {
        project_name: editProjectName,
        description: editProjectDescription
      });

      fetchProjects();
      setShowEditModal(false);
      setEditingProject(null);
      setMessage({ type: 'success', text: 'Project updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update project' });
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/pid/projects/${deletingProject.id}/`);
      fetchProjects();
      setShowDeleteConfirm(false);
      setDeletingProject(null);
      setMessage({ type: 'success', text: 'Project deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete project' });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      project_name: project.project_name || project.name
    }));
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setFormData({
      project_name: '',
      drawing_number: '',
      revision: '',
      description: '',
      drawing_title: ''
    });
    setFile(null);
    setPreviewUrl(null);
    setError('');
    setSuccess('');
    setReferenceFiles({});
    fetchProjects();
  };

  // ========== REFERENCE DOCUMENT HANDLERS (SOFT-CODED) ==========
  
  const handleReferenceFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size <= 50 * 1024 * 1024) {
          setReferenceFiles(prev => ({ ...prev, [key]: file }));
          setMessage({ type: 'success', text: `Reference document selected: ${file.name}` });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
          setMessage({ type: 'error', text: 'File size exceeds 50MB limit' });
          e.target.value = '';
        }
      } else {
        setMessage({ type: 'error', text: 'Please select a PDF file' });
        e.target.value = '';
      }
    }
  };

  const removeReferenceFile = (key) => {
    setReferenceFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
    const input = document.getElementById(`ref-${key}`);
    if (input) input.value = '';
    setMessage({ type: 'success', text: 'Reference document removed' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50',
      indigo: 'border-indigo-200 bg-indigo-50',
      pink: 'border-pink-200 bg-pink-50',
      red: 'border-red-200 bg-red-50',
      gray: 'border-gray-200 bg-gray-50',
      teal: 'border-teal-200 bg-teal-50'
    };
    return colors[color] || colors.gray;
  };

  // ========== FILE HANDLING FUNCTIONS (Preserved Core Logic) ==========
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Enhanced PDF validation - check both extension and MIME type
    const fileName = selectedFile.name.toLowerCase();
    const fileType = selectedFile.type.toLowerCase();
    
    console.log('[FileSelect] File name:', selectedFile.name);
    console.log('[FileSelect] File type:', selectedFile.type);
    console.log('[FileSelect] File size:', selectedFile.size);
    
    // Accept PDF files by extension or MIME type
    const isPDF = fileName.endsWith('.pdf') || 
                  fileType === 'application/pdf' || 
                  fileType === 'application/x-pdf';
    
    if (!isPDF) {
      setError(`Invalid file type. Only PDF files are accepted. Received: ${selectedFile.name} (${selectedFile.type})`);
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size cannot exceed 50MB');
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a P&ID drawing file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('Preparing upload...');

    // Create FormData with proper type handling
    const formDataToSend = new FormData();
    
    // Add file first - this is critical for proper multipart encoding
    formDataToSend.append('file', file);
    
    // SOFT-CODED: Include reference documents if uploaded
    Object.keys(referenceFiles).forEach(key => {
      formDataToSend.append(`reference_${key}`, referenceFiles[key]);
    });
    
    // Only append non-empty optional fields
    if (formData.drawing_number?.trim()) {
      formDataToSend.append('drawing_number', formData.drawing_number.trim());
    }
    if (formData.drawing_title?.trim()) {
      formDataToSend.append('drawing_title', formData.drawing_title.trim());
    }
    if (formData.revision?.trim()) {
      formDataToSend.append('revision', formData.revision.trim());
    }
    if (formData.project_name?.trim()) {
      formDataToSend.append('project_name', formData.project_name.trim());
    }
    
    // CRITICAL: Convert boolean to string for DRF BooleanField
    formDataToSend.append('auto_analyze', formData.auto_analyze ? 'true' : 'false');

    try {
      console.log('[DEBUG] ===== UPLOAD REQUEST =====');
      console.log('[DEBUG] File:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      console.log('[DEBUG] FormData fields:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, typeof value === 'object' ? `[File: ${value.name}]` : value);
      }
      console.log('[DEBUG] Reference documents count:', Object.keys(referenceFiles).length);
      console.log('[DEBUG] API Endpoint:', apiClient.defaults.baseURL + '/pid/drawings/upload/');
      
      console.log('[DEBUG] Preparing API request...');
      const authToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('[DEBUG] Auth token available:', !!authToken);
      
      // SAFEGUARD: Verify token exists before making request
      if (!authToken) {
        console.error('[ERROR] No authentication token found - user may not be logged in');
        setError('Authentication token missing. Please log in again.');
        setUploading(false);
        navigate('/login');
        return;
      }
      
      // Set progress tracking stages
      setAnalysisStage('Uploading file to server...');
      setUploadProgress(10);
      
      // Simulate progress during upload (since we can't track multipart upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 20) return prev + 2;
          if (prev < 40) return prev + 1;
          return prev; // Stop at 40 until we get response
        });
      }, 500);
      
      const response = await apiClient.post(
        '/pid/drawings/upload/',
        formDataToSend,
        {
          headers: {
            // Authorization is set by interceptor
            // Don't set Content-Type - let browser handle multipart boundary
          },
          timeout: 600000, // 10 minutes for file upload + AI analysis
          // Ensure we don't override Content-Type set by axios for FormData
          transformRequest: [(data) => {
            // Let axios handle FormData transformation
            return data;
          }],
          onUploadProgress: (progressEvent) => {
            // Track actual upload progress if available
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total);
              setUploadProgress(percentCompleted);
              if (percentCompleted > 30) {
                setAnalysisStage('File uploaded, starting AI analysis...');
              }
            }
          }
        }
      );
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      // Update progress for analysis phase
      if (formData.auto_analyze) {
        setUploadProgress(50);
        setAnalysisStage('AI analyzing P&ID drawing (this may take 3-8 minutes)...');
        
        // Simulate analysis progress
        const analysisInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev < 90) return prev + 2;
            return prev;
          });
        }, 2000);
        
        uploadTimeoutRef.current = analysisInterval;
      }

      // Clear any progress intervals
      if (uploadTimeoutRef.current) {
        clearInterval(uploadTimeoutRef.current);
      }
      
      console.log('[DEBUG] ===== UPLOAD SUCCESS =====');
      console.log('[DEBUG] Response:', response.data);
      
      setUploadProgress(100);
      setAnalysisStage('Analysis complete! Redirecting...');
      
      // Validate response structure
      if (!response.data || !response.data.id) {
        throw new Error('Invalid server response: missing drawing ID');
      }
      
      // Short delay to show completion before redirect
      setTimeout(() => {
        navigate(`/pid/report/${response.data.id}`);
      }, 500);
    } catch (err) {
      // Clear any progress intervals
      if (uploadTimeoutRef.current) {
        clearInterval(uploadTimeoutRef.current);
      }
      
      console.error('[ERROR] ===== UPLOAD FAILED =====');
      console.error('[ERROR] Full error:', err);
      console.error('[ERROR] Response status:', err.response?.status);
      console.error('[ERROR] Response data:', err.response?.data);
      console.error('[ERROR] Request config:', err.config);
      
      setUploadProgress(0);
      setAnalysisStage('');
      
      // Handle different error scenarios with detailed messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Redirect to login
        setError(errorMessage);
        setTimeout(() => navigate('/login'), 2000);
        setUploading(false);
        return;
      } else if (err.response?.status === 415) {
        errorMessage = 'Unsupported media type. Please check file format and try again.';
        console.error('[ERROR] Content-Type issue - check multipart handling');
      } else if (err.response?.status === 400) {
        // Validation error - show detailed field errors
        const validationErrors = err.response.data;
        if (typeof validationErrors === 'object') {
          const fieldErrors = Object.entries(validationErrors)
            .map(([field, errors]) => {
              const errorMsg = Array.isArray(errors) ? errors[0] : errors;
              return `${field}: ${errorMsg}`;
            })
            .join(', ');
          errorMessage = `Validation error: ${fieldErrors}`;
        } else {
          errorMessage = `Validation error: ${validationErrors}`;
        }
      } else if (err.response?.data?.error) {
        // Backend returned a specific error message
        const backendError = err.response.data.error;
        
        // Check for OpenAI-specific errors
        if (backendError.includes('OpenAI') || backendError.includes('API key')) {
          errorMessage = '⚠️ Configuration Error: OpenAI service is not configured on the server. Please contact the administrator.';
        } else if (backendError.includes('quota') || backendError.includes('credits')) {
          errorMessage = '⚠️ Service Limit: Analysis service has reached its usage limit. Please contact the administrator.';
        } else if (backendError.includes('rate limit')) {
          errorMessage = 'Analysis service is busy. Please wait a moment and try again.';
        } else {
          errorMessage = `Analysis failed: ${backendError}`;
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 50MB.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Invalid file type. Only PDF files are accepted.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check the file and try again.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timeout. The analysis is taking longer than expected. This can happen with complex drawings. Please check the drawing list in a few minutes - the analysis may still complete in the background.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  // ========== RENDER: Project Selection or Upload Interface ==========
  
  // Show project selection if no project selected
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              P&ID Verification Projects
            </h1>
            <p className="text-gray-600">
              Select a project or create a new one to start uploading P&ID drawings
            </p>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                {message.type === 'error' && <X className="w-5 h-5 mr-2" />}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Create New Project Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FolderPlus className="w-5 h-5" />
              Create New Project
            </button>
          </div>

          {/* Projects Grid */}
          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600">Create your first project to start uploading P&ID drawings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {project.project_name || project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{project.drawing_count || 0} drawings</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditClick(e, project)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Project Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g., ADNOC Project XYZ"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Brief project description..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewProjectName('');
                        setNewProjectDescription('');
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingProject}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center transition-colors"
                    >
                      {creatingProject ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Create & Upload
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Project Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Edit Project</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProject(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editProjectDescription}
                      onChange={(e) => setEditProjectDescription(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingProject(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingProject}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center"
                    >
                      {updatingProject ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-red-600">Delete Project</h3>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingProject(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <p className="text-gray-700 text-center mb-2">
                    Are you sure you want to delete this project?
                  </p>
                  <p className="text-lg font-bold text-gray-900 text-center">
                    {deletingProject?.project_name || deletingProject?.name}
                  </p>
                  <p className="text-sm text-red-600 text-center mt-4">
                    This action cannot be undone. All associated drawings will be permanently removed.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingProject(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== UPLOAD INTERFACE (Project Selected - PRESERVED CORE LOGIC) ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-2xl sm:max-w-3xl lg:max-w-4xl mx-auto">
      {/* Back to Projects Button */}
      <div className="mb-4">
        <button
          onClick={handleBackToProjects}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-xl">←</span>
          Back to Projects
        </button>
      </div>

      {/* Header with Project Info */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedProject.project_name || selectedProject.name}
              </h2>
              {selectedProject.description && (
                <p className="text-sm text-gray-600">{selectedProject.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            P&ID Design Verification
          </h1>
          <button
            onClick={() => navigate('/pid/history')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <span>📋</span>
            View History
          </button>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Upload your P&ID drawing for AI-powered engineering review and compliance verification
        </p>
      </div>

      {/* SOFT-CODED: Reference Documents Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <FileText className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reference Documents</h2>
            <p className="text-sm text-gray-600">Upload supporting documents for P&ID verification (Optional but Recommended)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {referenceDocuments.map((doc) => (
            <div
              key={doc.key}
              className={`p-4 border-2 rounded-lg ${getColorClasses(doc.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <doc.icon className="w-5 h-5 mr-2" />
                    <span className="font-semibold text-sm">{doc.label}</span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-gray-600 mt-1 ml-7">{doc.description}</p>
                  )}
                </div>
                {!doc.required && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded ml-2">Optional</span>
                )}
              </div>

              {referenceFiles[doc.key] ? (
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate">{referenceFiles[doc.key].name}</span>
                  </div>
                  <button
                    onClick={() => removeReferenceFile(doc.key)}
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor={`ref-${doc.key}`} className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-gray-400 transition-colors bg-white">
                      <UploadIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-gray-600">Click to upload PDF</p>
                      <p className="text-xs text-gray-500 mt-1">Max 50MB</p>
                    </div>
                  </label>
                  <input
                    type="file"
                    id={`ref-${doc.key}`}
                    accept=".pdf"
                    onChange={(e) => handleReferenceFileChange(doc.key, e)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* File Upload Area */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              P&ID Drawing (PDF) *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              {!file ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">
                      Click to upload
                    </label>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF files only, up to 50MB
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="h-10 w-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Drawing Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Drawing Number
                </label>
                <button
                  type="button"
                  onClick={() => setUseStructuredNumber(!useStructuredNumber)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {useStructuredNumber ? 'Use Freeform' : 'Use Structured Format'}
                </button>
              </div>
              
              {!useStructuredNumber ? (
                <input
                  type="text"
                  name="drawing_number"
                  value={formData.drawing_number}
                  onChange={handleInputChange}
                  placeholder="e.g., 16-01-08-1678-1-1/1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-md border border-gray-300">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Area (2 digits)
                    </label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="16"
                      maxLength="2"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      P/Area (2 digits)
                    </label>
                    <input
                      type="text"
                      name="p_area"
                      value={formData.p_area}
                      onChange={handleInputChange}
                      placeholder="01"
                      maxLength="2"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Doc Code (2 digits)
                    </label>
                    <input
                      type="text"
                      name="doc_code"
                      value={formData.doc_code}
                      onChange={handleInputChange}
                      placeholder="08"
                      maxLength="2"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Serial (4 digits)
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      value={formData.serial_number}
                      onChange={handleInputChange}
                      placeholder="1678"
                      maxLength="4"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Rev (1 digit)
                    </label>
                    <input
                      type="text"
                      name="rev"
                      value={formData.rev}
                      onChange={handleInputChange}
                      placeholder="1"
                      maxLength="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sheet (1 digit)
                    </label>
                    <input
                      type="text"
                      name="sheet_number"
                      value={formData.sheet_number}
                      onChange={handleInputChange}
                      placeholder="1"
                      maxLength="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Total Sheets (1 digit)
                    </label>
                    <input
                      type="text"
                      name="total_sheets"
                      value={formData.total_sheets}
                      onChange={handleInputChange}
                      placeholder="1"
                      maxLength="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full px-2 py-1 text-sm bg-white border border-gray-400 rounded text-gray-700 font-mono">
                      {formData.area || '__'}-{formData.p_area || '__'}-{formData.doc_code || '__'}-{formData.serial_number || '____'}-{formData.rev || '_'}-{formData.sheet_number || '_'}/{formData.total_sheets || '_'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revision
              </label>
              <input
                type="text"
                name="revision"
                value={formData.revision}
                onChange={handleInputChange}
                placeholder="e.g., Rev 01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Title
              </label>
              <input
                type="text"
                name="drawing_title"
                value={formData.drawing_title}
                onChange={handleInputChange}
                placeholder="e.g., Compressor Package"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                placeholder="e.g., ADNOC Project XYZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Auto-analyze Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="auto_analyze"
              id="auto_analyze"
              checked={formData.auto_analyze}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_analyze" className="ml-2 block text-sm text-gray-700">
              Automatically start AI analysis after upload
            </label>
          </div>

          {/* Upload Progress */}
          {uploading && formData.auto_analyze && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">{analysisStage}</p>
                <span className="text-sm text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                ⏱️ The AI is performing comprehensive analysis with multiple validation passes. This typically takes 3-8 minutes depending on drawing complexity.
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
                uploading || !file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {formData.auto_analyze ? 'Uploading & Analyzing...' : 'Uploading...'}
                </span>
              ) : (
                `Upload ${formData.auto_analyze ? '& Analyze' : 'Drawing'}`
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">AI-Powered Verification Includes:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Equipment dimensions and datasheet compliance</li>
          <li>✓ Instrumentation tags and fail-safe positions</li>
          <li>✓ PSV set pressure vs Equipment Design Pressure compliance</li>
          <li>✓ Pipe class and Trim class consistency for Equipment connections</li>
          <li>✓ Dissimilar material connections and Insulating gasket requirements</li>
          <li>✓ Minimum spool length downstream of RO and LTCS compliance</li>
          <li>✓ Free draining/Slope requirements for horizontal piping</li>
          <li>✓ Piping layout and drainage compliance</li>
          <li>✓ Notes, legends, and project standard adherence</li>
        </ul>
      </div>
    </div>
    </div>
  );
};

export default PIDUpload;
