import apiClient from './api.service'

// ═════════════════════════════════════════════════════════════════════
// Soft-coded API config for P&ID Checker V2
// ═════════════════════════════════════════════════════════════════════
const BASE_PATH = '/pid-checker-v2'
const EXTRACT_ENDPOINT = `${BASE_PATH}/extract-line-tags/`
const EXTRACTIONS_ENDPOINT = `${BASE_PATH}/extractions/`
const LEGENDS_ENDPOINT = `${BASE_PATH}/legends/`
const LEGENDS_DEFAULT_TEMPLATE_ENDPOINT = `${BASE_PATH}/legends/default-template/`
const VALIDATE_ENDPOINT = `${BASE_PATH}/validate-line-tags/`
const UPLOAD_FIELD = 'file'
const REQUEST_TIMEOUT_MS = 15 * 60 * 1000   // OCR can take a few minutes

// Legend sections (extend when the backend adds more)
export const LEGEND_SECTIONS = [
  { id: 'line_list', label: 'Line List' },
]

// Extraction modes
export const MODE_OCR = 'ocr'
export const MODE_VISION = 'vision'

// Vision providers exposed to the UI
export const VISION_PROVIDERS = [
  { id: 'openai', label: 'OpenAI GPT-4o',    keyPrefix: 'sk-' },
  { id: 'claude', label: 'Claude Sonnet 4.5', keyPrefix: 'sk-ant-' },
]

/**
 * Upload a P&ID / line-list PDF and receive the extracted line tags.
 * @param {File} file
 * @param {{
 *   mode?: 'ocr'|'vision',
 *   forceOcr?: boolean,
 *   provider?: 'openai'|'claude',
 *   apiKey?: string,
 *   onProgress?: (pct:number)=>void
 * }} [opts]
 */
export async function extractLineTags(file, opts = {}) {
  const form = new FormData()
  form.append(UPLOAD_FIELD, file)

  const mode = opts.mode || MODE_OCR
  form.append('mode', mode)

  if (mode === MODE_OCR && opts.forceOcr) {
    form.append('force_ocr', 'true')
  }
  if (mode === MODE_VISION) {
    if (opts.provider) form.append('provider', opts.provider)
    if (opts.apiKey)   form.append('api_key', opts.apiKey)
  }

  const res = await apiClient.post(EXTRACT_ENDPOINT, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: REQUEST_TIMEOUT_MS,
    onUploadProgress: (evt) => {
      if (opts.onProgress && evt.total) {
        opts.onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    },
  })
  return res.data
}

/** List the current user's saved extractions (most recent first). */
export async function listExtractions() {
  const res = await apiClient.get(EXTRACTIONS_ENDPOINT)
  return res.data   // array of extraction summaries
}

/** Retrieve one saved extraction with its full tag list. */
export async function getExtraction(extractionId) {
  const res = await apiClient.get(`${EXTRACTIONS_ENDPOINT}${extractionId}/`)
  return res.data
}

/** Delete a saved extraction. */
export async function deleteExtraction(extractionId) {
  await apiClient.delete(`${EXTRACTIONS_ENDPOINT}${extractionId}/`)
}

// ═════════════════════════════════════════════════════════════════════
// Legend Sheets — user-owned per-section rule sets
// ═════════════════════════════════════════════════════════════════════

export async function listLegends(section) {
  const params = section ? { section } : undefined
  const res = await apiClient.get(LEGENDS_ENDPOINT, { params })
  return res.data
}

export async function getLegend(legendId) {
  const res = await apiClient.get(`${LEGENDS_ENDPOINT}${legendId}/`)
  return res.data
}

export async function createLegend(payload) {
  const res = await apiClient.post(LEGENDS_ENDPOINT, payload)
  return res.data
}

export async function updateLegend(legendId, payload) {
  const res = await apiClient.patch(`${LEGENDS_ENDPOINT}${legendId}/`, payload)
  return res.data
}

export async function deleteLegend(legendId) {
  await apiClient.delete(`${LEGENDS_ENDPOINT}${legendId}/`)
}

export async function activateLegend(legendId) {
  const res = await apiClient.post(`${LEGENDS_ENDPOINT}${legendId}/activate/`)
  return res.data
}

export async function getLegendDefaultTemplate(section) {
  const res = await apiClient.get(LEGENDS_DEFAULT_TEMPLATE_ENDPOINT, { params: { section } })
  return res.data
}

/**
 * Validate a list of tags against the active Legend Sheet for a section.
 * @param {{
 *   tags: Array<{tag:string}>,
 *   section?: string,
 *   legendId?: string,
 *   useAi?: boolean,
 *   provider?: 'openai'|'claude',
 *   apiKey?: string,
 * }} payload
 */
export async function validateLineTags(payload) {
  const body = {
    tags: payload.tags || [],
    section: payload.section || 'line_list',
    use_ai: Boolean(payload.useAi),
  }
  if (payload.legendId) body.legend_id = payload.legendId
  if (payload.useAi) {
    body.vision_provider = payload.provider
    body.vision_api_key = payload.apiKey
  }
  const res = await apiClient.post(VALIDATE_ENDPOINT, body, { timeout: REQUEST_TIMEOUT_MS })
  return res.data
}

export default {
  extractLineTags, listExtractions, getExtraction, deleteExtraction,
  listLegends, getLegend, createLegend, updateLegend, deleteLegend,
  activateLegend, getLegendDefaultTemplate,
  validateLineTags,
  MODE_OCR, MODE_VISION, VISION_PROVIDERS, LEGEND_SECTIONS,
}
