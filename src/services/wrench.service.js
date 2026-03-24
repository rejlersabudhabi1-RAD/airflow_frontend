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
}

export default wrenchService

