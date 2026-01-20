/**
 * RBAC Service - API calls for Super Admin Dashboard
 */
import apiService from './api.service';

const RBAC_BASE_URL = '/rbac';

class RBACService {
  // ==================== Organizations ====================
  async getOrganizations() {
    return apiService.get(`${RBAC_BASE_URL}/organizations/`);
  }

  async createOrganization(data) {
    return apiService.post(`${RBAC_BASE_URL}/organizations/`, data);
  }

  async updateOrganization(id, data) {
    return apiService.patch(`${RBAC_BASE_URL}/organizations/${id}/`, data);
  }

  async deleteOrganization(id) {
    return apiService.delete(`${RBAC_BASE_URL}/organizations/${id}/`);
  }

  // ==================== Users ====================
  async getUsers(params = {}) {
    return apiService.get(`${RBAC_BASE_URL}/users/`, { params });
  }

  async getCurrentUser() {
    return apiService.get(`${RBAC_BASE_URL}/users/me/`);
  }

  async createUser(data) {
    return apiService.post(`${RBAC_BASE_URL}/users/`, data);
  }

  async updateUser(id, data) {
    return apiService.patch(`${RBAC_BASE_URL}/users/${id}/`, data);
  }

  async deleteUser(id) {
    return apiService.delete(`${RBAC_BASE_URL}/users/${id}/`);
  }

  async assignRole(userId, roleId, isPrimary = false) {
    return apiService.post(`${RBAC_BASE_URL}/users/${userId}/assign_role/`, {
      role_id: roleId,
      is_primary: isPrimary
    });
  }

  async revokeRole(userId, roleId) {
    return apiService.post(`${RBAC_BASE_URL}/users/${userId}/revoke_role/`, {
      role_id: roleId
    });
  }

  async deactivateUser(userId, reason) {
    return apiService.post(`${RBAC_BASE_URL}/users/${userId}/deactivate/`, { reason });
  }

  async activateUser(userId) {
    return apiService.post(`${RBAC_BASE_URL}/users/${userId}/activate/`);
  }

  async softDeleteUser(userId) {
    return apiService.delete(`${RBAC_BASE_URL}/users/${userId}/soft_delete/`);
  }

  async resetUserPassword(userId) {
    return apiService.post(`${RBAC_BASE_URL}/users/${userId}/reset-password/`);
  }

  async getUserStats() {
    return apiService.get(`${RBAC_BASE_URL}/users/stats/`);
  }

  // ==================== Bulk Operations ====================
  async bulkUploadUsers(formData) {
    return apiService.post(`${RBAC_BASE_URL}/users/bulk_upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async downloadBulkUploadTemplate() {
    return apiService.get(`${RBAC_BASE_URL}/users/download_template/`, {
      responseType: 'blob'
    });
  }

  // ==================== Roles ====================
  async getRoles() {
    return apiService.get(`${RBAC_BASE_URL}/roles/`);
  }

  async createRole(data) {
    return apiService.post(`${RBAC_BASE_URL}/roles/`, data);
  }

  async updateRole(id, data) {
    return apiService.patch(`${RBAC_BASE_URL}/roles/${id}/`, data);
  }

  async deleteRole(id) {
    return apiService.delete(`${RBAC_BASE_URL}/roles/${id}/`);
  }

  async assignPermissionToRole(roleId, permissionId) {
    return apiService.post(`${RBAC_BASE_URL}/roles/${roleId}/assign_permission/`, {
      permission_id: permissionId
    });
  }

  async revokePermissionFromRole(roleId, permissionId) {
    return apiService.post(`${RBAC_BASE_URL}/roles/${roleId}/revoke_permission/`, {
      permission_id: permissionId
    });
  }

  async assignModuleToRole(roleId, moduleId) {
    return apiService.post(`${RBAC_BASE_URL}/roles/${roleId}/assign_module/`, {
      module_id: moduleId
    });
  }

  // ==================== Permissions ====================
  async getPermissions() {
    return apiService.get(`${RBAC_BASE_URL}/permissions/`);
  }

  async checkPermission(userId, permissionCode) {
    return apiService.post(`${RBAC_BASE_URL}/permissions/check_permission/`, {
      user_id: userId,
      permission_code: permissionCode
    });
  }

  // ==================== Modules ====================
  async getModules() {
    return apiService.get(`${RBAC_BASE_URL}/modules/`);
  }

  async checkModuleAccess(userId, moduleCode) {
    return apiService.post(`${RBAC_BASE_URL}/modules/check_access/`, {
      user_id: userId,
      module_code: moduleCode
    });
  }

  // ==================== Audit Logs ====================
  async getAuditLogs(params = {}) {
    return apiService.get(`${RBAC_BASE_URL}/audit-logs/`, { params });
  }

  async getUserActivity(userId) {
    return apiService.get(`${RBAC_BASE_URL}/audit-logs/user_activity/`, {
      params: { user_id: userId }
    });
  }

  // ==================== Storage ====================
  async generateUploadUrl(fileData) {
    return apiService.post(`${RBAC_BASE_URL}/storage/generate_upload_url/`, fileData);
  }

  async uploadToS3(uploadUrl, fields, file) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return response;
  }

  async verifyUpload(storageId, checksum) {
    return apiService.post(`${RBAC_BASE_URL}/storage/${storageId}/verify_upload/`, {
      checksum
    });
  }

  async getDownloadUrl(storageId) {
    return apiService.get(`${RBAC_BASE_URL}/storage/${storageId}/download/`);
  }

  async getFiles(params = {}) {
    return apiService.get(`${RBAC_BASE_URL}/storage/`, { params });
  }

  async getStorageStats() {
    return apiService.get(`${RBAC_BASE_URL}/storage/stats/`);
  }

  async deleteFile(storageId) {
    return apiService.delete(`${RBAC_BASE_URL}/storage/${storageId}/`);
  }

  // Bulk assign modules to all users
  async bulkAssignModules(data) {
    return apiService.post(`${RBAC_BASE_URL}/users/bulk-assign-modules/`, data);
  }
}

export default new RBACService();
