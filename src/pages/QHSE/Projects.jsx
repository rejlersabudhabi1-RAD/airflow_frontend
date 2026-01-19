import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Download, RefreshCw, Eye, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useQHSERunningProjects } from './hooks/useQHSEProjects';
import { MainHeader } from './components/Common/MainHeader';
import { Card, CardContent } from './components/ui/Card';
import { ProjectForm, Toast } from './components/ProjectForm';
import { PROJECT_STATUS_OPTIONS, PRIORITY_OPTIONS } from './utils/projectFormConfig';

/**
 * Project Management Page
 * Create, Read, Update, Delete QHSE Running Projects
 */
const Projects = () => {
  const { data: projects = [], loading, error, refetch } = useQHSERunningProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get status color
  const getStatusColor = (status) => {
    const option = PROJECT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return option?.color || '#6b7280';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const option = PROJECT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return option?.label || priority;
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Handle create new project
  const handleCreateNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  // Handle edit project
  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  // Handle form submit (create or update)
  const handleFormSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = editingProject
        ? `http://localhost:8000/api/qhse-projects/${editingProject.id}/`
        : 'http://localhost:8000/api/qhse-projects/';
      
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save project');
      }

      const savedProject = await response.json();
      
      setToast({
        type: 'success',
        message: editingProject 
          ? `Project "${savedProject.project_name}" updated successfully!`
          : `Project "${savedProject.project_name}" created successfully!`
      });
      
      setShowForm(false);
      setEditingProject(null);
      refetch(); // Refresh project list
    } catch (error) {
      console.error('Error saving project:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to save project. Please try again.'
      });
    }
  };

  // Handle delete project
  const handleDelete = async (project) => {
    if (!confirm(`Are you sure you want to delete project "${project.project_name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/qhse-projects/${project.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setToast({
        type: 'success',
        message: `Project "${project.project_name}" deleted successfully!`
      });
      
      refetch(); // Refresh project list
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast({
        type: 'error',
        message: 'Failed to delete project. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    const csvContent = [
      // Headers
      ['Project Number', 'Project Name', 'Client', 'Status', 'Priority', 'Start Date', 'End Date', 'Budget', 'Completion %'].join(','),
      // Data rows
      ...filteredProjects.map(p => [
        p.project_number,
        `"${p.project_name}"`,
        `"${p.client_name || ''}"`,
        p.status,
        p.priority,
        p.start_date,
        p.planned_end_date,
        p.budget || 0,
        p.completion_percentage || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qhse-projects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary metrics
  const summaryMetrics = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active' || p.status === 'in_progress' || p.status === 'ongoing').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0),
    avgCompletion: projects.length > 0 
      ? projects.reduce((sum, p) => sum + (parseFloat(p.completion_percentage) || 0), 0) / projects.length 
      : 0,
    avgKPI: projects.length > 0
      ? projects.reduce((sum, p) => sum + (parseFloat(p.overall_kpi) || 0), 0) / projects.length
      : 0
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <MainHeader
          title="Project Management"
          description="Create, manage, and track QHSE running projects"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Projects</p>
                  <p className="text-2xl font-bold text-green-600">{summaryMetrics.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    AED {(summaryMetrics.totalBudget / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.avgCompletion.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects by name, number, or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {PROJECT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                <button
                  onClick={refetch}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Loading projects...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-2">Error loading projects</p>
                <p className="text-gray-600 text-sm">{error.message}</p>
                <button
                  onClick={refetch}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {projects.length === 0 
                    ? 'No projects found. Create your first project to get started.'
                    : 'No projects match your filters.'}
                </p>
                {projects.length === 0 && (
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timeline</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completion</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">KPI</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(project => (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{project.project_name}</p>
                            <p className="text-sm text-gray-500">{project.project_number}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{project.client_name || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          >
                            {getStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getPriorityColor(project.priority) }}
                          >
                            {getPriorityLabel(project.priority)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{project.start_date}</p>
                            <p className="text-gray-500">{project.planned_end_date}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(project.completion_percentage || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">{(project.completion_percentage || 0).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {(project.overall_kpi || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(project)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project)}
                              disabled={isDeleting}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        {!loading && !error && filteredProjects.length > 0 && (
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        )}
      </div>

      {/* Project Form Modal */}
      {showForm && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default Projects;
