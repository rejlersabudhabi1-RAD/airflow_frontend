/**
 * QHSE Service - Django API Integration
 * Replaces Google Sheets API with Django REST API
 * Maintains backward compatibility with existing hooks
 */

import { API_BASE_URL } from '../config/api.config';

/**
 * Get authentication headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Handle API responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'API request failed');
  }
  return response.json();
};

/**
 * QHSE Running Projects API
 */
export const qhseProjectsAPI = {
  /**
   * Get all running projects
   * @param {Object} filters - Query parameters for filtering
   * @returns {Promise<Array>} List of projects
   */
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/qhse/projects/${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Get single project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Object>} Project details
   */
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/${id}/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Create new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project
   */
  async create(projectData) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    return handleResponse(response);
  },

  /**
   * Update existing project
   * @param {number} id - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise<Object>} Updated project
   */
  async update(id, projectData) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    return handleResponse(response);
  },

  /**
   * Partial update project
   * @param {number} id - Project ID
   * @param {Object} projectData - Fields to update
   * @returns {Promise<Object>} Updated project
   */
  async patch(id, projectData) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    return handleResponse(response);
  },

  /**
   * Delete project
   * @param {number} id - Project ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/dashboard_stats/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Duplicate project
   * @param {number} id - Project ID to duplicate
   * @returns {Promise<Object>} Duplicated project
   */
  async duplicate(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/projects/${id}/duplicate/`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

/**
 * QHSE Spot Check Register API
 */
export const qhseSpotChecksAPI = {
  /**
   * Get all spot checks
   * @param {Object} filters - Query parameters for filtering
   * @returns {Promise<Array>} List of spot checks
   */
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/qhse/spot-checks/${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Get single spot check by ID
   * @param {number} id - Spot check ID
   * @returns {Promise<Object>} Spot check details
   */
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/spot-checks/${id}/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Create new spot check
   * @param {Object} spotCheckData - Spot check data
   * @returns {Promise<Object>} Created spot check
   */
  async create(spotCheckData) {
    const response = await fetch(`${API_BASE_URL}/qhse/spot-checks/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(spotCheckData)
    });
    return handleResponse(response);
  },

  /**
   * Update existing spot check
   * @param {number} id - Spot check ID
   * @param {Object} spotCheckData - Updated data
   * @returns {Promise<Object>} Updated spot check
   */
  async update(id, spotCheckData) {
    const response = await fetch(`${API_BASE_URL}/qhse/spot-checks/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(spotCheckData)
    });
    return handleResponse(response);
  },

  /**
   * Delete spot check
   * @param {number} id - Spot check ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/spot-checks/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete spot check');
    }
  },

  /**
   * Get spot checks grouped by project
   * @param {Object} filters - Query parameters
   * @returns {Promise<Array>} Spot checks grouped by project
   */
  async getByProject(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/qhse/spot-checks/by_project/${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }
};

/**
 * QHSE Audits API
 */
export const qhseAuditsAPI = {
  /**
   * Get all audits
   * @param {Object} filters - Query parameters for filtering
   * @returns {Promise<Array>} List of audits
   */
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/qhse/audits/${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Get single audit by ID
   * @param {number} id - Audit ID
   * @returns {Promise<Object>} Audit details
   */
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/audits/${id}/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Create new audit
   * @param {Object} auditData - Audit data
   * @returns {Promise<Object>} Created audit
   */
  async create(auditData) {
    const response = await fetch(`${API_BASE_URL}/qhse/audits/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(auditData)
    });
    return handleResponse(response);
  },

  /**
   * Update existing audit
   * @param {number} id - Audit ID
   * @param {Object} auditData - Updated data
   * @returns {Promise<Object>} Updated audit
   */
  async update(id, auditData) {
    const response = await fetch(`${API_BASE_URL}/qhse/audits/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(auditData)
    });
    return handleResponse(response);
  },

  /**
   * Delete audit
   * @param {number} id - Audit ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/qhse/audits/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete audit');
    }
  }
};

export default {
  projects: qhseProjectsAPI,
  spotChecks: qhseSpotChecksAPI,
  audits: qhseAuditsAPI
};
