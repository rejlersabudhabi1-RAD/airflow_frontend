/**
 * Spec Customization API Service
 * ───────────────────────────────
 * Paper Spec PDF Extraction endpoints, fully soft-coded.
 *
 * Adjust `SPEC_API_CONFIG` to retune endpoints, polling cadence, or limits
 * without touching any UI component.
 */
import apiClient from './api.service';

export const SPEC_API_CONFIG = {
  prefix:           '/spec-customization',
  // Endpoints
  uploadPath:       '/paper-spec/upload/',
  jobsPath:         '/paper-spec/jobs/',
  jobDetailPath:    (id) => `/paper-spec/jobs/${id}/`,
  jobClassesPath:   (id) => `/paper-spec/jobs/${id}/classes/`,
  jobCancelPath:    (id) => `/paper-spec/jobs/${id}/cancel/`,
  jobExportPath:    (id, fmt = 'xlsx') => `/paper-spec/jobs/${id}/export/?format=${fmt}`,
  classDetailPath:  (id) => `/paper-spec/classes/${id}/`,
  configPath:       '/config/',

  // Field name expected by the backend `upload_paper_spec` view
  fileFieldName:    'file',

  // Polling cadence for job status (ms)
  pollIntervalMs:   2500,

  // Frontend file limits
  acceptedExts:     ['pdf'],
  maxFileSizeMB:    200,
};

const path = (p) => `${SPEC_API_CONFIG.prefix}${p}`;

const specCustomizationAPI = {
  /** Upload PDF + queue job. */
  async upload({ file, projectId, title, documentNumber, onUploadProgress } = {}) {
    const fd = new FormData();
    fd.append(SPEC_API_CONFIG.fileFieldName, file);
    if (projectId)      fd.append('project_id', projectId);
    if (title)          fd.append('title', title);
    if (documentNumber) fd.append('document_number', documentNumber);
    const { data } = await apiClient.post(path(SPEC_API_CONFIG.uploadPath), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data;
  },

  async listJobs() {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobsPath));
    return data;
  },

  async getJob(jobId) {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobDetailPath(jobId)));
    return data;
  },

  async getJobClasses(jobId) {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobClassesPath(jobId)));
    return data;
  },

  async cancelJob(jobId) {
    const { data } = await apiClient.post(path(SPEC_API_CONFIG.jobCancelPath(jobId)));
    return data;
  },

  async getClass(classId) {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.classDetailPath(classId)));
    return data;
  },

  /** Returns a Blob for XLSX, or parsed JSON for JSON exports. */
  async exportJob(jobId, format = 'xlsx') {
    const isBlob = format === 'xlsx';
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobExportPath(jobId, format)), {
      responseType: isBlob ? 'blob' : 'json',
    });
    return data;
  },

  async getConfig() {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.configPath));
    return data;
  },
};

export default specCustomizationAPI;
