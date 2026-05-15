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
  // SmartPlant 3D bulk-load exports (two separate workbooks)
  jobExportSpecPath: (id) => `/paper-spec/jobs/${id}/export-spec/`,
  jobExportCatPath:  (id) => `/paper-spec/jobs/${id}/export-cat/`,
  // Workbook canvas — cross-check & edit SPEC/CAT data before download.
  jobWorkbookPath:     (id) => `/paper-spec/jobs/${id}/workbook/`,
  jobWorkbookCellPath: (id) => `/paper-spec/jobs/${id}/workbook/cell/`,
  classDetailPath:  (id) => `/paper-spec/classes/${id}/`,
  configPath:       '/config/',

  // Field name expected by the backend `upload_paper_spec` view
  fileFieldName:    'file',

  // Polling cadence for job status (ms)
  pollIntervalMs:   2500,

  // Frontend file limits — superset of formats the backend can normalise to PDF.
  // The authoritative list lives in backend `file_normalizer.SUPPORTED_FORMATS`
  // and is mirrored at runtime via /config/ → `accepted_extensions`.
  acceptedExts:     [
    'pdf',
    'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'webp', 'gif',
    'docx', 'doc', 'xlsx', 'xlsm', 'xls',
    'txt', 'csv', 'log',
  ],
  maxFileSizeMB:    200,

  // Soft-coded UI metadata for each format group (icon + label).
  formatGroups: {
    pdf:    { label: 'PDF',         badge: 'bg-rose-100 text-rose-700',     hint: 'Native — fastest path.' },
    image:  { label: 'Image',       badge: 'bg-amber-100 text-amber-700',   hint: 'Scanned page — AI vision will read it.' },
    office: { label: 'Office',      badge: 'bg-sky-100 text-sky-700',       hint: 'Word/Excel — auto-converted to PDF.' },
    text:   { label: 'Text',        badge: 'bg-slate-100 text-slate-700',   hint: 'Plain text — rendered to PDF.' },
  },
  extToGroup: {
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', tif: 'image', tiff: 'image',
    bmp: 'image', webp: 'image', gif: 'image',
    docx: 'office', doc: 'office', xlsx: 'office', xlsm: 'office', xls: 'office',
    txt: 'text', csv: 'text', log: 'text',
  },
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

  /** SmartPlant 3D — SPEC workbook (piping spec rules). Returns a Blob. */
  async exportSmartplantSpec(jobId) {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobExportSpecPath(jobId)), {
      responseType: 'blob',
    });
    return data;
  },

  /** SmartPlant 3D — CAT workbook (component catalog). Returns a Blob. */
  async exportSmartplantCat(jobId) {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobExportCatPath(jobId)), {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * Workbook canvas — fetch SPEC or CAT contents as JSON
   * (with any cell-level overrides already merged in).
   */
  async getWorkbookPreview(jobId, workbook = 'spec') {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.jobWorkbookPath(jobId)), {
      params: { workbook },
    });
    return data;
  },

  /** Save a single cell override. */
  async saveWorkbookCell(jobId, { workbook, sheet_name, row_key, column_name, value }) {
    const { data } = await apiClient.post(
      path(SPEC_API_CONFIG.jobWorkbookCellPath(jobId)),
      { workbook, sheet_name, row_key, column_name, value },
    );
    return data;
  },

  /** Clear a single cell override (revert to extracted value). */
  async clearWorkbookCell(jobId, { workbook, sheet_name, row_key, column_name }) {
    const { data } = await apiClient.delete(
      path(SPEC_API_CONFIG.jobWorkbookCellPath(jobId)),
      { data: { workbook, sheet_name, row_key, column_name } },
    );
    return data;
  },

  async getConfig() {
    const { data } = await apiClient.get(path(SPEC_API_CONFIG.configPath));
    return data;
  },
};

export default specCustomizationAPI;
