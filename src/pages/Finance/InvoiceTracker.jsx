/**
 * Invoice Tracker — Accounts Receivable register.
 *
 * Mirrors the finance team's Excel "Customer Inv masterfile" workflow:
 *   • Bulk-import .xlsx files (External + Internal sheets) with upsert
 *   • Per-row PDF/document attachment upload (S3-backed)
 *   • KPI tiles, filters, search, table view
 *
 * Distinct from apps.finance (Accounts Payable, AI extraction). All logic
 * goes through invoiceTrackerService → /api/v1/invoice-tracker/.
 *
 * Soft-coded knobs live in `frontend/src/config/invoiceTracker.config.js`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import invoiceTrackerService from '../../services/invoiceTracker.service'
import {
  TRACKER_API_CONFIG,
  INVOICE_CATEGORIES,
  PAYMENT_STATUSES,
  CURRENCIES,
  TRACKER_COLUMNS,
  ATTACHMENT_DISPLAY,
  formatMoney,
} from '../../config/invoiceTracker.config'

// ─── Small presentational helpers ───────────────────────────────────────────
const StatusTile = ({ status, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl border text-left p-4 transition-all duration-200 ${
      active
        ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md scale-[1.02]'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
    }`}
  >
    <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${status.tile}`} />
    <div className="relative">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
        {status.label}
      </p>
      <p className="text-2xl font-bold text-gray-800 tabular-nums">{count}</p>
    </div>
  </button>
)

const StatusBadge = ({ statusKey }) => {
  const s = PAYMENT_STATUSES.find((x) => x.key === statusKey)
  if (!s || !s.key) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.badge}`}>
      {s.label}
    </span>
  )
}

// ─── Excel-import modal ─────────────────────────────────────────────────────
const ImportExcelModal = ({ open, onClose, onImported }) => {
  const [file, setFile]       = useState(null)
  const [sheets, setSheets]   = useState('')
  const [busy, setBusy]       = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const inputRef              = useRef(null)

  useEffect(() => {
    if (!open) {
      setFile(null); setSheets(''); setResult(null); setError(null); setBusy(false)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (!file) return
    setBusy(true); setError(null); setResult(null)
    try {
      const res = await invoiceTrackerService.importExcel(file, sheets.trim())
      setResult(res)
      onImported?.()
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <DocumentArrowUpIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Import Customer-Invoice Excel</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
          >
            <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : 'Click to select an .xlsx file'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Headers auto-detected. External + Internal sheets supported.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </button>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Sheets (optional, comma-separated)
            </label>
            <input
              type="text"
              value={sheets}
              onChange={(e) => setSheets(e.target.value)}
              placeholder="e.g. ExternalInvoice,InternalInvoice2018"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Leave blank to import every sheet.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 space-y-1">
              <p className="font-semibold">Import complete.</p>
              <ul className="text-xs space-y-0.5 text-emerald-700">
                <li>Sheets processed: <b>{result.sheets_processed}</b></li>
                <li>Rows seen: <b>{result.rows_seen}</b></li>
                <li>Created: <b>{result.rows_created}</b> · Updated: <b>{result.rows_updated}</b> · Skipped: <b>{result.rows_skipped}</b></li>
                {result.errors?.length > 0 && (
                  <li className="text-rose-700">Errors: {result.errors.length}</li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-white"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || busy}
            className="px-3.5 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
          >
            {busy ? 'Importing…' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Attachment-upload control (per row) ────────────────────────────────────
const AttachmentControl = ({ invoice, onChanged }) => {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await invoiceTrackerService.uploadAttachment(invoice.id, file)
      onChanged?.()
    } catch (err) {
      console.error('[InvoiceTracker] upload failed', err)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const count = invoice.attachments_count ?? invoice.attachments?.length ?? 0

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50"
        title="Upload PDF / supporting document"
      >
        <PaperClipIcon className="w-3.5 h-3.5 text-gray-500" />
        {busy ? '…' : count > 0 ? `${count}` : ATTACHMENT_DISPLAY.noneLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleUpload}
      />
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
const InvoiceTracker = () => {
  const [invoices, setInvoices]       = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [accountFilter, setAccountFilter]   = useState('')
  const [projectFilter, setProjectFilter]   = useState('')
  const [searchTerm, setSearchTerm]         = useState('')
  const [dateFrom, setDateFrom]             = useState('')
  const [dateTo, setDateTo]                 = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [lastFetched, setLastFetched] = useState(null)

  const buildFilters = useCallback(() => {
    const f = {}
    if (categoryFilter) f.category = categoryFilter
    if (statusFilter)   f.payment_status = statusFilter
    if (currencyFilter) f.currency = currencyFilter
    if (accountFilter.trim()) f.account = accountFilter.trim()
    if (projectFilter.trim()) f.project = projectFilter.trim()
    if (searchTerm.trim()) f.search = searchTerm.trim()
    if (dateFrom) f.date_from = dateFrom
    if (dateTo)   f.date_to   = dateTo
    f.page_size = TRACKER_API_CONFIG.pageSize
    return f
  }, [categoryFilter, statusFilter, currencyFilter, accountFilter, projectFilter, searchTerm, dateFrom, dateTo])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const filters = buildFilters()
      const [list, s] = await Promise.all([
        invoiceTrackerService.list(filters),
        invoiceTrackerService.stats({}).catch(() => null),
      ])
      const rows = Array.isArray(list) ? list : list?.results || []
      setInvoices(rows)
      if (s) setStats(s)
      setLastFetched(new Date())
    } catch (err) {
      console.error('[InvoiceTracker] fetch failed', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to load invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [buildFilters])

  useEffect(() => { setLoading(true); fetchData() }, [fetchData])

  useEffect(() => {
    if (!TRACKER_API_CONFIG.refreshMs) return
    const id = setInterval(fetchData, TRACKER_API_CONFIG.refreshMs)
    return () => clearInterval(id)
  }, [fetchData])

  const statusCounts = useMemo(() => {
    const map = { '': invoices.length }
    PAYMENT_STATUSES.forEach((s) => {
      if (!s.key) return
      map[s.key] = stats?.by_status?.[s.key] ?? invoices.filter((i) => i.payment_status === s.key).length
    })
    return map
  }, [invoices, stats])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2">
              Finance · 3.2 · A/R
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Invoice Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">
              Customer-invoice register — External + Internal — with Excel import & S3 attachments.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Import Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Status tiles ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {PAYMENT_STATUSES.map((s) => (
            <StatusTile
              key={s.key || 'all'}
              status={s}
              count={statusCounts[s.key] ?? 0}
              active={statusFilter === s.key}
              onClick={() => setStatusFilter(s.key)}
            />
          ))}
        </div>
        {stats && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <ChartBarIcon className="w-3.5 h-3.5" />
              Overdue: <b className="text-rose-700">{stats.overdue_count}</b>
            </span>
            <span>· Total (AED): <b className="text-gray-700">{formatMoney(stats.total_aed, 'AED')}</b></span>
            {Object.entries(stats.by_category || {}).map(([k, v]) => (
              <span key={k}>· {k}: <b className="text-gray-700">{v}</b></span>
            ))}
          </div>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice #, account, project…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <input
            type="text"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            placeholder="Filter by account…"
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <input
            type="text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Filter by project / RAD #…"
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {INVOICE_CATEGORIES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-24 px-2 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {CURRENCIES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 col-span-1 md:col-span-2">
            <label className="text-[11px] text-gray-500 shrink-0">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                   className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            <label className="text-[11px] text-gray-500 shrink-0">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                   className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          {lastFetched && (
            <span className="text-[11px] text-gray-400 self-center">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-sm text-rose-600 bg-rose-50">{error}</div>
          ) : loading && invoices.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              No invoices match the current filter. Use <b>Import Excel</b> to load the master file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {TRACKER_COLUMNS.map((c) => (
                      <th key={c.key} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                    >
                      {TRACKER_COLUMNS.map((c) => (
                        <td key={c.key} className={`px-4 py-3 ${c.className || ''}`}>
                          {c.accessor(inv)}
                        </td>
                      ))}
                      <td className="px-4 py-3"><StatusBadge statusKey={inv.payment_status} /></td>
                      <td className="px-4 py-3">
                        <AttachmentControl invoice={inv} onChanged={fetchData} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 text-[11px] text-gray-400 bg-gray-50 border-t border-gray-100">
                Showing {invoices.length} row{invoices.length === 1 ? '' : 's'}
                {' · '}page size {TRACKER_API_CONFIG.pageSize}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchData}
      />
    </div>
  )
}

export default InvoiceTracker
