/**
 * Wrench Integration Service
 * All API calls for the Wrench SmartProject Platform integration.
 * Credentials are never handled on the frontend – only the backend stores them (encrypted).
 * Session tokens are managed server-side (rolling token pattern).
 */
import apiService from './api.service'

const BASE = '/wrench'

const wrenchService = {
  // ── Config ───────────────────────────────────────────────────────────────
  /** Retrieve the current (safe) configuration – no credentials returned */
  getConfig: () => apiService.get(`${BASE}/config/`),

  /**
   * Save a new Wrench configuration.
   * @param {object} payload – { base_url, svc_url?, server_id, login_name, password, organization_name, is_active }
   * The password travels over HTTPS and is Fernet-encrypted on the backend before storage.
   * On update, omit `password` to keep the existing one.
   */
  saveConfig: (payload) => apiService.post(`${BASE}/config/`, payload),

  /** Test connectivity – performs a real Wrench login to validate credentials */
  verifyConnection: () => apiService.post(`${BASE}/config/verify/`),

  /** Delete the active config (super admin only) */
  deleteConfig: (id) => apiService.delete(`${BASE}/config/${id}/`),

  // ── Sync ─────────────────────────────────────────────────────────────────
  /** List recent sync logs */
  getSyncLogs: () => apiService.get(`${BASE}/sync/`),

  /** Get a single sync log */
  getSyncLog: (id) => apiService.get(`${BASE}/sync/${id}/`),

  /**
   * Trigger a sync run.
   * @param {string} direction     – 'wrench_to_radai' | 'radai_to_wrench'
   * @param {string} entity_type  – 'project' | 'document' | 'transmittal' | 'user' | 'all'
   */
  triggerSync: (direction = 'wrench_to_radai', entity_type = 'all') =>
    apiService.post(`${BASE}/sync/trigger/`, { direction, entity_type }),

  // ── Document Search ───────────────────────────────────────────────────────
  /**
   * Search the Wrench document repository via SearchObject API.
   * @param {object} filters – {
   *   discipline?: string,
   *   doc_no?: string,
   *   date_from?: string,  // 'YYYY/MM/DD HH:MM'
   *   date_to?: string,    // 'YYYY/MM/DD HH:MM'
   *   page?: number,
   *   page_size?: number,
   * }
   * Returns { total, documents: [{DOC_NO, DOC_DESCRIPTION, ORDER_NO, ...}] }
   */
  searchDocuments: (filters = {}) => apiService.post(`${BASE}/sync/search-documents/`, filters),

  /**
   * Fetch unique discipline codes and document numbers from a sample search.
   * Used to populate dropdowns in the Document Search UI.
   * Returns { disciplines: string[], doc_numbers: string[] }
   */
  getDocumentChoices: () => apiService.get(`${BASE}/sync/document-choices/`),

  /**
   * List transmittals from Wrench via the REST WebAPI.
   * @param {number} page
   * @param {number} pageSize
   */
  listTransmittals: (page = 1, pageSize = 100) =>
    apiService.get(`${BASE}/sync/list-transmittals/`, { params: { page, page_size: pageSize } }),

  /**
   * Fetch documents linked to a transmittal via its ORDER_NO (and optionally TRANS_ID).
   * Backend tries transmittal-specific REST paths first, then GenericDocumentList, then DocumentSearch.
   * No SVC URL required for the first two strategies.
   * @param {string} orderNo   – the ORDER_NO field from the transmittal row
   * @param {string} [transId] – the TRANS_ID field (sent as fallback identifier)
   * @param {number} page
   * @param {number} pageSize
   */
  getTransmittalDocuments: (orderNo, transId = '', page = 1, pageSize = 200) =>
    apiService.get(`${BASE}/sync/trans-documents/`, {
      params: {
        order_no:  orderNo,
        ...(transId ? { trans_id: transId } : {}),
        page,
        page_size: pageSize,
      },
    }),

  // ── S3 Export ─────────────────────────────────────────────────────────────
  /** List S3 export jobs (last 50) */
  getS3Jobs: () => apiService.get(`${BASE}/s3-sync/`),

  /** Get a single S3 job */
  getS3Job: (id) => apiService.get(`${BASE}/s3-sync/${id}/`),

  /**
   * Start a Wrench → S3 export job.
   * @param {object} payload – { mode: 'batch'|'realtime', entity_type: 'transmittals'|'documents'|'all', s3_prefix?: string }
   */
  startS3Sync: (payload) => apiService.post(`${BASE}/s3-sync/start/`, payload),

  /** Stop a running real-time S3 export job */
  stopS3Job: (id) => apiService.post(`${BASE}/s3-sync/${id}/stop/`),

  // ── Token Injection ───────────────────────────────────────────────────────
  /**
   * Save a pre-shared Wrench session token directly — bypasses username/password login.
   * Once saved, the backend uses this token for all Wrench API calls; the rolling-token
   * refresh from each Wrench response keeps it current automatically.
   * @param {string} token – raw Wrench session token string
   */
  injectToken: (token) => apiService.post(`${BASE}/config/inject-token/`, { token }),

  // ── Document Download ─────────────────────────────────────────────────────
  /**
   * Download a Wrench document file (proxied through the backend for auth).
   * Backend tries multiple Wrench download endpoints and streams the binary back.
   * @param {string} idocId  – IDOC_ID of the document (required)
   * @param {string} [docNo] – DOC_NO used as fallback filename hint (optional)
   * Returns a blob response for direct save-as in the browser.
   */
  downloadDocument: (idocId, docNo) =>
    apiService.get(`${BASE}/sync/document-download/`, {
      params: { idoc_id: idocId, ...(docNo ? { doc_no: docNo } : {}) },
      responseType: 'blob',
    }),
}

export default wrenchService

