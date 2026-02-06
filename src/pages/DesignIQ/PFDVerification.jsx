import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, X, Plus, FolderPlus, Package, Edit, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api.service';

const PFDVerification = () => {
  // Configuration for reference documents
  const referenceDocuments = [
    { key: 'bfd', label: 'BFD (Block Flow Diagram)', icon: FileText, color: 'blue', required: false },
    { key: 'process_description', label: 'PROCESS DESCRIPTION', icon: FileText, color: 'green', required: true },
    { key: 'process_design_basis', label: 'PROCESS DESIGN BASIS', icon: FileText, color: 'purple', required: true },
    { key: 'operation_control_philosophy', label: 'OPERATION & CONTROL PHILOSOPHY', icon: FileText, color: 'orange', required: true },
    { key: 'scope_of_work', label: 'SCOPE OF WORK', icon: FileText, color: 'indigo', required: true },
    { key: 'legends_symbols', label: 'LEGENDS AND SYMBOLS', icon: FileText, color: 'pink', required: true },
    { key: 'equipment_data_sheet', label: 'EQUIPMENT DATA SHEET', icon: FileText, color: 'teal', required: true },
    { key: 'other_documents', label: 'OTHER DOCUMENTS', icon: FileText, color: 'gray', required: false }
  ];

  // Project state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  
  // Edit/Delete state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PFD upload state
  const [pfdFile, setPfdFile] = useState(null);
  const [referenceFiles, setReferenceFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [drawingNumber, setDrawingNumber] = useState('');
  const [revision, setRevision] = useState('');
  const [drawingTitle, setDrawingTitle] = useState('');
  
  // Verification state
  const [uploadedPFDId, setUploadedPFDId] = useState(null);
  const [verificationReport, setVerificationReport] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [updatingIssues, setUpdatingIssues] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await api.get('/pfd/projects/');
      // Backend returns { success: true, count: X, projects: [...] }
      setProjects(response.data.projects || response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    } finally {
      setLoadingProjects(false);
    }
  };

  // Create new project - directly show upload page without fetching
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a project name' });
      return;
    }

    setCreatingProject(true);
    try {
      const response = await api.post('/pfd/projects/', {
        name: newProjectName,
        description: newProjectDescription
      });

      const newProject = response.data.project || response.data;
      
      // Directly set the project from create response - no need to fetch again
      setSelectedProject(newProject);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Refresh projects list
      fetchProjects();
      
      setMessage({ 
        type: 'success', 
        text: `Project "${newProject.project_name}" created successfully!` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create project' 
      });
    } finally {
      setCreatingProject(false);
    }
  };

  // Handle edit project
  const handleEditClick = (e, project) => {
    e.stopPropagation(); // Prevent card click
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
      // Use numeric id (not project_id) for PUT endpoint
      // Backend expects project_name (not name) and created_by
      const response = await api.put(`/pfd/projects/${editingProject.id}/`, {
        project_name: editProjectName,
        description: editProjectDescription,
        created_by: editingProject.created_by
      });

      // Update projects list
      fetchProjects();
      
      setShowEditModal(false);
      setEditingProject(null);
      setEditProjectName('');
      setEditProjectDescription('');
      
      setMessage({ 
        type: 'success', 
        text: 'Project updated successfully!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating project:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update project' 
      });
    } finally {
      setUpdatingProject(false);
    }
  };

  // Handle delete project
  const handleDeleteClick = (e, project) => {
    e.stopPropagation(); // Prevent card click
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      // Use numeric id (not project_id) for DELETE endpoint
      await api.delete(`/pfd/projects/${deletingProject.id}/`);
      
      // Update projects list
      fetchProjects();
      
      setShowDeleteConfirm(false);
      setDeletingProject(null);
      
      setMessage({ 
        type: 'success', 
        text: 'Project deleted successfully!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting project:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete project' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle PFD file selection
  const handlePfdFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size <= 50 * 1024 * 1024) {
          setPfdFile(file);
          setMessage({ type: 'success', text: `PFD file selected: ${file.name}` });
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

  // Handle reference document file selection
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

  // Remove selected file
  const removeFile = (key) => {
    if (key === 'pfd') {
      setPfdFile(null);
      const input = document.getElementById('pfd-upload');
      if (input) input.value = '';
    } else {
      setReferenceFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[key];
        return newFiles;
      });
      const input = document.getElementById(`ref-${key}`);
      if (input) input.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setMessage({ type: 'error', text: 'Please create a project first' });
      return;
    }

    if (!pfdFile) {
      setMessage({ type: 'error', text: 'Please upload the PFD document' });
      return;
    }

    if (!drawingNumber || !revision || !drawingTitle) {
      setMessage({ type: 'error', text: 'Please fill in all required drawing fields' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const formData = new FormData();
      formData.append('pfd_file', pfdFile);
      formData.append('project_id', selectedProject.project_id);
      formData.append('drawing_number', drawingNumber);
      formData.append('revision', revision);
      formData.append('drawing_title', drawingTitle);
      formData.append('document_type', 'pfd');

      // Upload reference documents if provided
      Object.keys(referenceFiles).forEach(key => {
        formData.append(`reference_${key}`, referenceFiles[key]);
      });

      const response = await api.post(
        '/pfd/projects/upload/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress({ overall: percentCompleted });
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const uploadData = response.data;
        const uploadId = uploadData.upload_id || uploadData.pfd_upload?.upload_id;
        
        setMessage({ 
          type: 'success', 
          text: `PFD uploaded successfully! Starting verification...` 
        });
        
        // Store upload ID for verification
        if (uploadId) {
          setUploadedPFDId(uploadId);
          // Auto-trigger verification
          startVerification(uploadId);
        } else {
          setTimeout(() => resetForm(), 3000);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to upload PFD. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Start PFD verification
  const startVerification = async (uploadId) => {
    setIsVerifying(true);
    try {
      setMessage({ type: 'info', text: 'AI verification in progress... This may take a few minutes.' });
      
      const response = await api.post('/pfd/verify/start-verification/', {
        upload_id: uploadId,
        auto_analyze: true
      });
      
      if (response.data.success) {
        setVerificationReport(response.data.report);
        setShowResults(true);
        setMessage({ type: 'success', text: 'Verification completed!' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage({
        type: 'error',
        text: 'Verification failed. ' + (error.response?.data?.message || '')
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Update issue status (approve/reject)
  const handleIssueUpdate = async (action) => {
    if (selectedIssues.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one issue' });
      return;
    }
    
    setUpdatingIssues(true);
    try {
      await api.post(`/pfd/verify/${uploadedPFDId}/update-issues/`, {
        issue_ids: selectedIssues,
        status: action === 'approve' ? 'approved' : 'ignored',
        approval: action === 'approve' ? 'Approved' : 'Rejected',
        remark: `${action === 'approve' ? 'Approved' : 'Rejected'} by user`
      });
      
      // Refresh results
      const response = await api.get(`/pfd/verify/${uploadedPFDId}/results/`);
      setVerificationReport(response.data.report);
      setSelectedIssues([]);
      setMessage({ type: 'success', text: `${selectedIssues.length} issue(s) ${action}d` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update issues' });
    } finally {
      setUpdatingIssues(false);
    }
  };
  
  // Toggle issue selection
  const toggleIssueSelection = (issueId) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  // Export to PDF (Print to PDF)
  const handleExportPDF = () => {
    try {
      // Get the table HTML
      const table = document.querySelector('.overflow-x-auto table');
      if (!table) {
        setMessage({ type: 'error', text: 'No table found to export' });
        return;
      }
      
      // Create a printable window with the table
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>PFD Verification Report</title>');
      printWindow.document.write('<style>');
      printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
      printWindow.document.write('h1 { color: #1e40af; margin-bottom: 20px; }');
      printWindow.document.write('.info { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }');
      printWindow.document.write('.info-row { margin: 5px 0; }');
      printWindow.document.write('.label { font-weight: bold; color: #374151; }');
      printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
      printWindow.document.write('th { background-color: #1e40af; color: white; padding: 12px; text-align: left; font-size: 12px; }');
      printWindow.document.write('td { border: 1px solid #e5e7eb; padding: 10px; font-size: 11px; }');
      printWindow.document.write('tbody tr:nth-child(even) { background-color: #f9fafb; }');
      printWindow.document.write('.badge { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }');
      printWindow.document.write('.critical { background: #fee2e2; color: #991b1b; }');
      printWindow.document.write('.major { background: #fed7aa; color: #9a3412; }');
      printWindow.document.write('.minor { background: #fef3c7; color: #92400e; }');
      printWindow.document.write('.observation { background: #dbeafe; color: #1e40af; }');
      printWindow.document.write('.approved { background: #dcfce7; color: #166534; }');
      printWindow.document.write('.pending { background: #fef3c7; color: #92400e; }');
      printWindow.document.write('.ignored { background: #f3f4f6; color: #374151; }');
      printWindow.document.write('</style></head><body>');
      
      // Add header info
      printWindow.document.write(`
        <h1>PFD Verification Report</h1>
        <div class="info">
          <div class="info-row"><span class="label">Drawing Number:</span> ${drawingNumber || 'N/A'}</div>
          <div class="info-row"><span class="label">Revision:</span> ${revision || 'N/A'}</div>
          <div class="info-row"><span class="label">Drawing Title:</span> ${drawingTitle || 'N/A'}</div>
          <div class="info-row"><span class="label">Total Issues:</span> ${verificationReport.total_issues || 0}</div>
          <div class="info-row"><span class="label">Critical:</span> ${verificationReport.critical_count || 0} | <span class="label">Major:</span> ${verificationReport.major_count || 0} | <span class="label">Minor:</span> ${verificationReport.minor_count || 0} | <span class="label">Observations:</span> ${verificationReport.observation_count || 0}</div>
        </div>
      `);
      
      // Clone and clean the table
      const tableClone = table.cloneNode(true);
      // Remove checkbox column
      tableClone.querySelectorAll('th:first-child, td:first-child').forEach(el => el.remove());
      // Remove action buttons from status column
      tableClone.querySelectorAll('button').forEach(btn => btn.remove());
      // Clean up status badges
      tableClone.querySelectorAll('.flex.items-center.gap-2').forEach(div => {
        const badge = div.querySelector('span');
        if (badge) {
          div.replaceWith(badge);
        }
      });
      
      printWindow.document.write(tableClone.outerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        setMessage({ type: 'success', text: 'PDF print dialog opened. Save as PDF in print dialog.' });
      }, 250);
    } catch (error) {
      console.error('Export PDF error:', error);
      setMessage({ type: 'error', text: 'Failed to export PDF' });
    }
  };

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    try {
      if (!verificationReport.issues || verificationReport.issues.length === 0) {
        setMessage({ type: 'error', text: 'No issues to export' });
        return;
      }
      
      // Create CSV content with BOM for proper Excel encoding
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += 'S/N,Severity,Category,Issue Found,Action Required,Status\n';
      
      verificationReport.issues.forEach(issue => {
        csv += `"${issue.serial_number}",`;
        csv += `"${issue.severity}",`;
        csv += `"${issue.category}",`;
        csv += `"${(issue.issue_found || '').replace(/"/g, '""')}",`;
        csv += `"${(issue.action_required || '').replace(/"/g, '""')}",`;
        csv += `"${issue.status}"\n`;
      });
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `PFD_Verification_${drawingNumber || 'report'}_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Excel file downloaded successfully! Open with Excel.' });
    } catch (error) {
      console.error('Export Excel error:', error);
      setMessage({ type: 'error', text: 'Failed to export Excel' });
    }
  };

  // Reset form
  const resetForm = () => {
    setPfdFile(null);
    setReferenceFiles({});
    setDrawingNumber('');
    setRevision('');
    setDrawingTitle('');
    setUploadProgress({});
    setMessage({ type: '', text: '' });
    setUploadedPFDId(null);
    setVerificationReport(null);
    setShowResults(false);
    setSelectedIssues([]);
    
    // Clear file inputs
    const pfdInput = document.getElementById('pfd-upload');
    if (pfdInput) pfdInput.value = '';
    
    referenceDocuments.forEach(doc => {
      const input = document.getElementById(`ref-${doc.key}`);
      if (input) input.value = '';
    });
  };

  // Color utilities
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700'
    };
    return colors[color] || colors.gray;
  };

  // If no project selected, show create project prompt
  if (!selectedProject) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PFD Verification</h1>
          <p className="text-gray-600 mt-2">Upload Process Flow Diagrams with reference documents</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Create Project Card */}
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
          <FolderPlus className="w-24 h-24 text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {projects.length > 0 ? 'Create New Project' : 'Create Your First Project'}
          </h2>
          <p className="text-gray-600 mb-8">
            {projects.length > 0 
              ? 'Start a new project to organize your PFD documents and reference materials.'
              : 'Start by creating a project to organize your PFD documents and reference materials.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg flex items-center mx-auto transition-colors shadow-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Create Project
          </button>
        </div>

        {/* Existing Projects Section */}
        {loadingProjects ? (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading projects...</p>
          </div>
        ) : projects.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Your Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.project_id || project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl cursor-pointer transition-all border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-1 relative group"
                >
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditClick(e, project)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                      title="Edit Project"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Package className="w-8 h-8 text-blue-500 mb-3" />
                  <h4 className="font-bold text-lg text-gray-900 mb-2">
                    {project.project_name || project.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {project.description || 'No description provided'}
                  </p>
                </div>
              ))}
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
                    setEditProjectName('');
                    setEditProjectDescription('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter project name"
                      disabled={updatingProject}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={editProjectDescription}
                      onChange={(e) => setEditProjectDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter project description"
                      rows="3"
                      disabled={updatingProject}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProject(null);
                      setEditProjectName('');
                      setEditProjectDescription('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={updatingProject}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProject || !editProjectName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  >
                    {updatingProject ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Project'
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
                  disabled={isDeleting}
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
                  This action cannot be undone. All associated documents will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingProject(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </>
                  )}
                </button>
              </div>
            </div>
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
                        Done
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
  // Main upload interface (project selected)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PFD Verification</h1>
          <p className="text-gray-600 mt-2">Upload Process Flow Diagrams with reference documents</p>
        </div>
        <button
          onClick={() => {
            setSelectedProject(null);
            resetForm();
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-800' :
            message.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Selected Project Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-lg font-bold text-white">{selectedProject.project_name}</h3>
              <p className="text-sm text-blue-100">Current Project</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Project ID</p>
            <p className="text-lg font-mono font-bold text-indigo-600">{selectedProject.project_id}</p>
          </div>
        </div>
      </div>

      {/* Reference Documents */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <FileText className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reference Documents</h2>
            <p className="text-sm text-gray-600">Upload supporting documents for verification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {referenceDocuments.map((doc) => (
            <div
              key={doc.key}
              className={`p-4 border-2 rounded-lg ${getColorClasses(doc.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <doc.icon className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-sm">{doc.label}</span>
                </div>
                {!doc.required && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Optional</span>
                )}
              </div>

              {referenceFiles[doc.key] ? (
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate">{referenceFiles[doc.key].name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(doc.key)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor={`ref-${doc.key}`} className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-gray-400 transition-colors bg-white">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
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

      {/* PFD Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drawing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drawing Number *
              </label>
              <input
                type="text"
                value={drawingNumber}
                onChange={(e) => setDrawingNumber(e.target.value)}
                placeholder="e.g., PFD-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revision *
              </label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="e.g., A, B, 01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drawing Title *
              </label>
              <input
                type="text"
                value={drawingTitle}
                onChange={(e) => setDrawingTitle(e.target.value)}
                placeholder="e.g., Main Process Flow"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* PFD File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PFD Document *
            </label>
            {pfdFile ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center flex-1 min-w-0 mr-4">
                  <FileText className="w-6 h-6 mr-3 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{pfdFile.name}</p>
                    <p className="text-sm text-gray-600">{(pfdFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile('pfd')}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ) : (
              <label htmlFor="pfd-upload" className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-1">Click to upload PFD</p>
                  <p className="text-sm text-gray-500">PDF format, maximum 50MB</p>
                </div>
              </label>
            )}
            <input
              type="file"
              id="pfd-upload"
              accept=".pdf"
              onChange={handlePfdFileChange}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress.overall !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Uploading...</span>
                <span className="text-sm font-semibold text-blue-900">{uploadProgress.overall}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.overall}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PFD
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Reference Documents</p>
            <p className="text-lg font-semibold text-gray-900">
              {Object.keys(referenceFiles).length} Uploaded
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">PFD Document</p>
            <p className="text-lg font-semibold text-gray-900">
              {pfdFile ? '✓ Selected' : '○ Not Selected'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Ready to Upload</p>
            <p className="text-lg font-semibold text-gray-900">
              {pfdFile && drawingNumber && revision && drawingTitle 
                ? '✓ Yes' 
                : '○ No'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Verification Results Section */}
      {isVerifying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <div className="flex items-center">
            <Loader className="w-6 h-6 text-yellow-600 animate-spin mr-3" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900">AI Verification In Progress</h3>
              <p className="text-sm text-yellow-700">Analyzing PFD with OpenAI GPT-4 Vision... This may take 2-3 minutes.</p>
            </div>
          </div>
        </div>
      )}
      
      {showResults && verificationReport && (
        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">Critical</p>
                <p className="text-3xl font-bold text-red-700">{verificationReport.critical_count || 0}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Major</p>
                <p className="text-3xl font-bold text-orange-700">{verificationReport.major_count || 0}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">Minor</p>
                <p className="text-3xl font-bold text-yellow-700">{verificationReport.minor_count || 0}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Observations</p>
                <p className="text-3xl font-bold text-blue-700">{verificationReport.observation_count || 0}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            {selectedIssues.length > 0 && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleIssueUpdate('approve')}
                  disabled={updatingIssues}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Selected ({selectedIssues.length})
                </button>
                <button
                  onClick={() => handleIssueUpdate('reject')}
                  disabled={updatingIssues}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject Selected ({selectedIssues.length})
                </button>
              </div>
            )}
            
            {/* Export Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-sm transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </button>
            </div>
            
            {/* Issues Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={verificationReport.issues?.length > 0 && selectedIssues.length === verificationReport.issues.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIssues(verificationReport.issues.map(i => i.id));
                          } else {
                            setSelectedIssues([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S/N</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Found</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Required</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationReport.issues?.map((issue) => (
                    <tr key={issue.id} className={selectedIssues.includes(issue.id) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIssues.includes(issue.id)}
                          onChange={() => toggleIssueSelection(issue.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{issue.serial_number}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{issue.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{issue.issue_found}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{issue.action_required}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {issue.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedIssues([issue.id]);
                                  handleIssueUpdate('approve');
                                }}
                                disabled={updatingIssues}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                                title="Approve this issue"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedIssues([issue.id]);
                                  handleIssueUpdate('reject');
                                }}
                                disabled={updatingIssues}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-400 flex items-center"
                                title="Reject this issue"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              issue.status === 'approved' ? 'bg-green-100 text-green-800' :
                              issue.status === 'ignored' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {issue.status}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* New Verification Button */}
          <div className="flex justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start New Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PFDVerification;
