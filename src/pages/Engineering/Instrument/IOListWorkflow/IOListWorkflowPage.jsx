/**
 * Instrument IO List Workflow — CRS-style multi-revision page.
 *
 * Replaces the default content at /engineering/instrument/datasheet/io-list.
 * The legacy "Generate from P&ID" wizard remains untouched and is reachable
 * via the "Legacy generator" link → /engineering/instrument/datasheet/io-list/generator
 *
 * View modes:
 *   - list    → table of all uploaded IO List documents (+ Upload action)
 *   - detail  → dual-panel: Comments Resolution Sheet (left) | IO List table (right)
 *
 * Everything is driven by the soft-coded config in
 * frontend/src/config/ioListWorkflow.config.js — no hardcoded columns or
 * endpoints in this file.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

import ioListWorkflowService from '../../../../services/ioListWorkflowService'
import {
  COMMENT_DISPLAY_COLUMNS,
  IO_PREVIEW_COLUMNS,
  STATUS_BADGE_COLOURS,
  UPLOAD_CONFIG,
  ROUTES,
} from '../../../../config/ioListWorkflow.config'

// ────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ────────────────────────────────────────────────────────────────────
const Badge = ({ children, bg = '#e5e7eb', fg = '#374151' }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
    style={{ background: bg, color: fg }}
  >
    {children}
  </span>
)

const StatusBadge = ({ code }) => {
  const s = STATUS_BADGE_COLOURS[code]
  if (!s) return <span className="text-xs text-gray-500">{code || '—'}</span>
  return <Badge bg={s.bg} fg={s.fg}>{code} · {s.label}</Badge>
}

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 min-w-[140px]">
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
  </div>
)

// ────────────────────────────────────────────────────────────────────
// Upload modal
// ────────────────────────────────────────────────────────────────────
const UploadModal = ({ open, onClose, onUploaded }) => {
  const [file, setFile]         = useState(null)
  const [metadata, setMetadata] = useState({
    project_name: '', document_number: '', revision_label: '',
    plant: '', unit: '', crs_chain_id: '',
  })
  const [progress, setProgress] = useState(0)
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')

  const reset = () => {
    setFile(null); setMetadata({
      project_name: '', document_number: '', revision_label: '',
      plant: '', unit: '', crs_chain_id: '',
    })
    setProgress(0); setBusy(false); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a PDF.'); return }
    setBusy(true); setError(''); setProgress(0)
    try {
      const result = await ioListWorkflowService.uploadDocument({
        file,
        metadata,
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total))
        },
      })
      onUploaded(result)
      reset()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error
                   || err.message || 'Upload failed'
      setError(detail)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">Upload Instrument I/O List PDF</h3>
          <button onClick={() => { reset(); onClose() }} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF file</label>
            <input
              type="file"
              accept={UPLOAD_CONFIG.acceptedTypes}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm border rounded p-2"
            />
            <ul className="mt-2 text-xs text-gray-500 list-disc pl-5 space-y-0.5">
              {UPLOAD_CONFIG.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['project_name',    'Project name'],
              ['document_number', 'Document number'],
              ['revision_label',  'Revision (e.g. A, B, 0, IFC)'],
              ['plant',           'Plant'],
              ['unit',            'Unit'],
              ['crs_chain_id',    'CRS chain id (optional)'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="text"
                  value={metadata[key]}
                  onChange={(e) => setMetadata({ ...metadata, [key]: e.target.value })}
                  className="w-full text-sm border rounded p-1.5 mt-0.5"
                />
              </div>
            ))}
          </div>

          {busy && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Uploading & extracting… {progress}%</div>
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Extraction runs server-side with PyMuPDF (no AI cost). May take a moment for large PDFs.
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => { reset(); onClose() }}
                    className="px-4 py-2 text-sm border rounded">Cancel</button>
            <button type="submit" disabled={busy}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50">
              {busy ? 'Extracting…' : 'Upload & Extract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// List view — documents table
// ────────────────────────────────────────────────────────────────────
const DocumentsListView = ({ documents, onOpen, onUploadClick, onRefresh, loading }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Instrument I/O List — Documents</h2>
        <p className="text-sm text-gray-500">
          CRS-style multi-revision document workflow. Upload an I/O List PDF and the system extracts
          both the Comments Resolution Sheet and the structured IO table — server-side, no AI cost by default.
        </p>
      </div>
      <div className="flex gap-2">
        <Link to={ROUTES.legacyGenerator}
              className="text-sm px-3 py-2 border rounded hover:bg-gray-50">
          Legacy generator
        </Link>
        <button onClick={onRefresh}
                className="text-sm px-3 py-2 border rounded hover:bg-gray-50">
          Refresh
        </button>
        <button onClick={onUploadClick}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Upload PDF
        </button>
      </div>
    </div>

    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="text-left px-3 py-2">Document</th>
            <th className="text-left px-3 py-2">Project</th>
            <th className="text-left px-3 py-2">Rev</th>
            <th className="text-left px-3 py-2">Plant / Unit</th>
            <th className="text-left px-3 py-2">Comments</th>
            <th className="text-left px-3 py-2">IO Rows</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Uploaded</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={9} className="text-center py-6 text-gray-500">Loading…</td></tr>
          )}
          {!loading && documents.length === 0 && (
            <tr><td colSpan={9} className="text-center py-10">
              <div className="text-gray-500">No documents yet.</div>
              <button onClick={onUploadClick}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
                Upload your first PDF
              </button>
            </td></tr>
          )}
          {documents.map(d => (
            <tr key={d.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{d.document_number || '—'}</td>
              <td className="px-3 py-2">{d.project_name || '—'}</td>
              <td className="px-3 py-2"><Badge>{d.revision_label || '—'}</Badge></td>
              <td className="px-3 py-2 text-xs">{[d.plant, d.unit].filter(Boolean).join(' / ') || '—'}</td>
              <td className="px-3 py-2">{d.extraction_stats?.comments_found ?? '—'}</td>
              <td className="px-3 py-2">{d.extraction_stats?.io_rows_found ?? '—'}</td>
              <td className="px-3 py-2">
                <Badge
                  bg={d.status === 'completed' ? '#d1fae5' :
                      d.status === 'failed'    ? '#fee2e2' : '#fef3c7'}
                  fg={d.status === 'completed' ? '#065f46' :
                      d.status === 'failed'    ? '#991b1b' : '#92400e'}>
                  {d.status}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
              </td>
              <td className="px-3 py-2">
                <button onClick={() => onOpen(d.id)}
                        className="text-blue-600 hover:underline text-xs">Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ────────────────────────────────────────────────────────────────────
// Detail view — dual panel
// ────────────────────────────────────────────────────────────────────
const DetailView = ({ doc, onBack, onReExtract, onDownload, onDelete }) => {
  const [filterTag, setFilterTag] = useState('')
  const stats = doc.extraction_stats || {}
  const filteredComments = useMemo(() => {
    if (!filterTag) return doc.extracted_comments || []
    const t = filterTag.toUpperCase()
    return (doc.extracted_comments || []).filter(c =>
      (c.linked_tags || []).some(tag => tag.includes(t))
      || (c.company_comment || '').toUpperCase().includes(t),
    )
  }, [doc.extracted_comments, filterTag])

  const filteredRows = useMemo(() => {
    if (!filterTag) return doc.extracted_rows || []
    const t = filterTag.toUpperCase()
    return (doc.extracted_rows || []).filter(r => (r.tag_number || '').toUpperCase().includes(t))
  }, [doc.extracted_rows, filterTag])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={onBack} className="text-xs text-blue-600 hover:underline mb-1">← Back to list</button>
          <h2 className="text-xl font-bold">
            {doc.document_number || `Document #${doc.id}`}
            <Badge bg="#dbeafe" fg="#1e40af">{doc.revision_label || '—'}</Badge>
          </h2>
          <p className="text-sm text-gray-500">
            {[doc.project_name, doc.plant, doc.unit].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReExtract}
                  className="text-sm px-3 py-2 border rounded">Re-extract</button>
          <button onClick={onDownload}
                  className="text-sm px-3 py-2 bg-emerald-600 text-white rounded">Download xlsx</button>
          <button onClick={onDelete}
                  className="text-sm px-3 py-2 border border-red-300 text-red-600 rounded">Delete</button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Pages"          value={stats.total_pages ?? '—'} />
        <StatCard label="Comment pages"  value={stats.comment_pages ?? '—'} />
        <StatCard label="IO pages"       value={stats.io_table_pages ?? '—'} />
        <StatCard label="Comments"       value={stats.comments_found ?? '—'} />
        <StatCard label="IO rows"        value={stats.io_rows_found ?? '—'} />
        <StatCard label="Linked"         value={stats.linked_comments ?? '—'} hint="comments ↔ tag" />
        <StatCard
          label="Cost"
          value={stats.cost_profile?.cache_hit ? 'Cached (free)' :
                 stats.cost_profile?.vision_fallback_used ? 'AI used' : 'Free (PyMuPDF)'}
          hint={`${stats.elapsed_seconds ?? '?'}s`}
        />
      </div>

      {/* Filter */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Filter by tag number (e.g. 113-PT-3193)"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Dual panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Comments panel */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold">
            📋 Comments Resolution Sheet ({filteredComments.length})
          </div>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {COMMENT_DISPLAY_COLUMNS.map(c => (
                    <th key={c.key} className="text-left px-2 py-1.5 font-semibold text-gray-700"
                        style={{ minWidth: c.width }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComments.map(c => (
                  <tr key={c.id} className="border-t align-top hover:bg-gray-50">
                    <td className="px-2 py-1.5">{c.s_no}</td>
                    <td className="px-2 py-1.5">{c.company_comment}</td>
                    <td className="px-2 py-1.5">{c.contractor_reply}</td>
                    <td className="px-2 py-1.5">{c.company_decision}</td>
                    <td className="px-2 py-1.5"><StatusBadge code={c.status_code} /></td>
                    <td className="px-2 py-1.5 text-gray-500">{c.status_meaning}</td>
                    <td className="px-2 py-1.5">{c.page_number}</td>
                    <td className="px-2 py-1.5">
                      {(c.linked_tags || []).map(t => (
                        <span key={t} className="inline-block mr-1 mb-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-mono cursor-pointer"
                              onClick={() => setFilterTag(t)}>{t}</span>
                      ))}
                    </td>
                  </tr>
                ))}
                {filteredComments.length === 0 && (
                  <tr><td colSpan={COMMENT_DISPLAY_COLUMNS.length}
                          className="text-center py-6 text-gray-400">No comments.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* IO list panel */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold">
            📊 IO List Table ({filteredRows.length})
          </div>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {IO_PREVIEW_COLUMNS.map(c => (
                    <th key={c.key} className="text-left px-2 py-1.5 font-semibold text-gray-700"
                        style={{ minWidth: c.width }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    {IO_PREVIEW_COLUMNS.map(c => {
                      const val = c.key === 'tag_number' ? r.tag_number
                                : c.key === 'page_number' ? r.page_number
                                : (r.data || {})[c.key]
                      return <td key={c.key} className="px-2 py-1.5">{val ?? ''}</td>
                    })}
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={IO_PREVIEW_COLUMNS.length}
                          className="text-center py-6 text-gray-400">No rows.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        Tip: Excel export contains all {Object.keys((doc.extracted_rows?.[0]?.data) || {}).length + 2}+
        IO columns. The grid above shows a curated preview.
      </p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────
export default function IOListWorkflowPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [activeDoc, setActiveDoc] = useState(null)
  const [pageError, setPageError] = useState('')

  const loadDocuments = useCallback(async () => {
    setLoading(true); setPageError('')
    try {
      const data = await ioListWorkflowService.listDocuments()
      setDocuments(Array.isArray(data) ? data : (data.results || []))
    } catch (err) {
      setPageError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const handleUploaded = (result) => {
    const doc = result?.document
    if (doc) {
      setActiveDoc(doc)
      loadDocuments()
    }
  }

  const handleOpen = async (id) => {
    setLoading(true)
    try {
      const doc = await ioListWorkflowService.getDocument(id)
      setActiveDoc(doc)
    } catch (err) {
      setPageError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReExtract = async () => {
    if (!activeDoc) return
    setLoading(true)
    try {
      const doc = await ioListWorkflowService.reExtract(activeDoc.id)
      setActiveDoc(doc)
      loadDocuments()
    } catch (err) {
      setPageError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!activeDoc) return
    const name = `IOList_${activeDoc.document_number || activeDoc.id}_${activeDoc.revision_label || 'rev'}.xlsx`
    ioListWorkflowService.downloadXlsx(activeDoc.id, name)
  }

  const handleDelete = async () => {
    if (!activeDoc) return
    if (!window.confirm('Delete this document and all extracted rows?')) return
    await ioListWorkflowService.deleteDocument(activeDoc.id)
    setActiveDoc(null)
    loadDocuments()
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {pageError && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {pageError}
        </div>
      )}

      {!activeDoc ? (
        <DocumentsListView
          documents={documents}
          loading={loading}
          onOpen={handleOpen}
          onUploadClick={() => setShowUpload(true)}
          onRefresh={loadDocuments}
        />
      ) : (
        <DetailView
          doc={activeDoc}
          onBack={() => setActiveDoc(null)}
          onReExtract={handleReExtract}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
