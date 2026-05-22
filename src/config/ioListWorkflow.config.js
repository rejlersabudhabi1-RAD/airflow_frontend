/**
 * Soft-coded configuration for the Instrument IO List Workflow frontend.
 * Mirrors backend/apps/instrument_io_workflow/services/config.py.
 *
 * NEVER hardcode endpoints, column names, status codes, or colours in pages —
 * import them from here.
 */

export const IO_LIST_WORKFLOW_API = {
  base:           '/instrument-io-workflow',
  config:         '/instrument-io-workflow/config/',
  documents:      '/instrument-io-workflow/documents/',
  documentById:   (id) => `/instrument-io-workflow/documents/${id}/`,
  reextract:      (id) => `/instrument-io-workflow/documents/${id}/re-extract/`,
  exportXlsx:     (id) => `/instrument-io-workflow/documents/${id}/export-xlsx/`,
  diff:           '/instrument-io-workflow/diff/',
}

// 5-column Comments Resolution Sheet display order
export const COMMENT_DISPLAY_COLUMNS = [
  { key: 's_no',              label: 'S.No',              width: 80   },
  { key: 'company_comment',   label: 'COMPANY Comment',   width: 360  },
  { key: 'contractor_reply',  label: 'CONTRACTOR Reply',  width: 360  },
  { key: 'company_decision',  label: 'COMPANY Decision',  width: 280  },
  { key: 'status_code',       label: 'Status',            width: 90   },
  { key: 'status_meaning',    label: 'Meaning',           width: 220  },
  { key: 'page_number',       label: 'Page',              width: 70   },
  { key: 'linked_tags',       label: 'Linked Tags',       width: 220  },
]

// IO list columns — kept short list for the preview grid; full 40 columns
// remain in the Excel export.
export const IO_PREVIEW_COLUMNS = [
  { key: 'tag_number',          label: 'Tag No',         width: 130 },
  { key: 'loop_number',         label: 'Loop',           width: 100 },
  { key: 'pid_no',              label: 'P&ID',           width: 110 },
  { key: 'instrument_type',     label: 'Type',           width: 90  },
  { key: 'service_description', label: 'Service',        width: 260 },
  { key: 'hmi_description',     label: 'HMI Description',width: 260 },
  { key: 'io_type',             label: 'I/O Type',       width: 90  },
  { key: 'system',              label: 'System',         width: 90  },
  { key: 'signal_type',         label: 'Signal',         width: 110 },
  { key: 'unit',                label: 'Unit',           width: 90  },
  { key: 'alarm_priority',      label: 'Priority',       width: 110 },
  { key: 'page_number',         label: 'Page',           width: 70  },
]

export const STATUS_BADGE_COLOURS = {
  '1': { bg: '#fee2e2', fg: '#991b1b', label: 'Rejected' },
  '2': { bg: '#fef3c7', fg: '#92400e', label: 'As Noted' },
  '3': { bg: '#d1fae5', fg: '#065f46', label: 'No Comments' },
  '4': { bg: '#dbeafe', fg: '#1e40af', label: 'Info Only' },
}

export const DIFF_COLOURS = {
  added:     { bg: '#d1fae5', fg: '#065f46', label: 'Added'    },
  removed:   { bg: '#fee2e2', fg: '#991b1b', label: 'Removed'  },
  modified:  { bg: '#fef3c7', fg: '#92400e', label: 'Modified' },
  unchanged: { bg: '#f3f4f6', fg: '#374151', label: 'No change'},
}

export const UPLOAD_CONFIG = {
  acceptedTypes: '.pdf',
  maxSizeMB:     100,
  hints: [
    'Upload a multi-section Instrument I/O List PDF.',
    'The document is expected to contain (a) a Comments Resolution Sheet section and (b) the structured IO List table (DCS / ESD sheets).',
    'PyMuPDF text & table extraction is used by default (zero AI cost). Vision fallback is opt-in via INSTRUMENT_IO_ENABLE_VISION_FALLBACK on the backend.',
  ],
}

export const ROUTES = {
  workflow:        '/engineering/instrument/datasheet/io-list',
  legacyGenerator: '/engineering/instrument/datasheet/io-list/generator',
  detail:          (id) => `/engineering/instrument/datasheet/io-list/${id}`,
}
