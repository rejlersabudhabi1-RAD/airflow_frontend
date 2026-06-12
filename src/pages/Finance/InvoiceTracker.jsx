/**
 * Invoice Tracker — read-only pipeline view of invoices.
 *
 * Distinct from the (now retired) InvoiceList/Management page: no create,
 * edit, or upload actions. Designed as a quick visibility surface for the
 * Finance section on the dashboard sidebar (entry "3.2 Invoice Tracker").
 *
 * Soft-coded:
 *   - TRACKER_CONFIG.refreshMs, pageSize, dateField — tweak without JSX edits
 *   - TRACKER_STATUSES — the pipeline columns and their badge palettes
 *   - TRACKER_COLUMNS — table columns (order, label, accessor, formatter)
 *   - TRACKER_FILTERS — filter dropdown options
 *
 * No backend / service changes required — uses existing financeService.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import financeService from '../../services/finance.service';

// ─── Soft-coded configuration ───────────────────────────────────────────────
const TRACKER_CONFIG = {
  refreshMs: 60_000,       // auto-refresh interval
  pageSize: 50,            // client-side display cap
  dateField: 'created_at', // primary sort field
  emptyText: 'No invoices match the current filter.',
}

// Pipeline columns shown as KPI tiles + filter chips
const TRACKER_STATUSES = [
  { key: 'ALL',               label: 'All',          icon: ChartBarIcon,      tile: 'from-slate-500 to-slate-700',     badge: 'bg-slate-100 text-slate-700' },
  { key: 'UPLOADED',          label: 'Uploaded',     icon: DocumentTextIcon,  tile: 'from-gray-500 to-gray-700',       badge: 'bg-gray-100 text-gray-700' },
  { key: 'PROCESSING',        label: 'Processing',   icon: ArrowPathIcon,     tile: 'from-blue-500 to-blue-700',       badge: 'bg-blue-100 text-blue-700' },
  { key: 'PENDING_APPROVAL',  label: 'Pending',      icon: ClockIcon,         tile: 'from-amber-500 to-orange-600',    badge: 'bg-amber-100 text-amber-700' },
  { key: 'APPROVED',          label: 'Approved',     icon: CheckCircleIcon,   tile: 'from-emerald-500 to-green-700',   badge: 'bg-emerald-100 text-emerald-700' },
  { key: 'REJECTED',          label: 'Rejected',     icon: XCircleIcon,       tile: 'from-rose-500 to-red-700',        badge: 'bg-rose-100 text-rose-700' },
]

const TRACKER_INVOICE_TYPES = [
  { value: '',                  label: 'All types' },
  { value: 'FINANCE_ACCOUNTING', label: 'Finance / Accounting' },
  { value: 'IT_HARDWARE',        label: 'IT Hardware' },
  { value: 'IT_SOFTWARE',        label: 'IT Software' },
  { value: 'PROJECT_RELATED',    label: 'Project Related' },
  { value: 'ADMIN_GENERAL',      label: 'Admin / General' },
  { value: 'UTILITIES',          label: 'Utilities' },
  { value: 'MAINTENANCE',        label: 'Maintenance' },
]

// Currency formatter — soft-coded locale/currency
const CURRENCY_FORMAT = { locale: 'en-AE', currency: 'AED' }
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  try {
    return new Intl.NumberFormat(CURRENCY_FORMAT.locale, {
      style: 'currency',
      currency: CURRENCY_FORMAT.currency,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${CURRENCY_FORMAT.currency} ${n.toFixed(2)}`
  }
}
const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

// Table columns — add/remove freely without touching JSX
const TRACKER_COLUMNS = [
  { key: 'invoice_number', label: 'Invoice #',  accessor: (r) => r.invoice_number || r.id || '—', className: 'font-mono text-xs text-gray-700' },
  { key: 'vendor_name',    label: 'Vendor',     accessor: (r) => r.vendor_name || r.vendor || '—', className: 'text-gray-800' },
  { key: 'invoice_type',   label: 'Type',       accessor: (r) => (TRACKER_INVOICE_TYPES.find((t) => t.value === r.invoice_type)?.label) || r.invoice_type || '—', className: 'text-gray-600 text-xs' },
  { key: 'amount',         label: 'Amount',     accessor: (r) => formatCurrency(r.amount ?? r.total_amount), className: 'text-right font-semibold text-gray-800 tabular-nums' },
  { key: 'created_at',     label: 'Created',    accessor: (r) => formatDate(r.created_at), className: 'text-gray-500 text-xs whitespace-nowrap' },
]

// ─── Sub-components ─────────────────────────────────────────────────────────
const StatusTile = ({ status, count, active, onClick }) => {
  const Icon = status.icon
  return (
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
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            {status.label}
          </p>
          <p className="text-2xl font-bold text-gray-800 tabular-nums">{count}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${status.tile} shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </button>
  )
}

const StatusBadge = ({ statusKey }) => {
  const s = TRACKER_STATUSES.find((x) => x.key === statusKey)
  if (!s || s.key === 'ALL') return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.badge}`}>
      {s.label}
    </span>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
const InvoiceTracker = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter]     = useState('')
  const [searchTerm, setSearchTerm]     = useState('')
  const [exporting, setExporting]       = useState(false)
  const [lastFetched, setLastFetched]   = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const filters = {}
      if (statusFilter !== 'ALL') filters.status = statusFilter
      if (typeFilter) filters.invoice_type = typeFilter
      if (searchTerm.trim()) filters.search = searchTerm.trim()
      const data = await financeService.getInvoices(filters)
      const list = Array.isArray(data) ? data : data?.results || []
      setInvoices(list)
      setLastFetched(new Date())
    } catch (err) {
      console.error('[InvoiceTracker] fetch failed:', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to load invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, searchTerm])

  // Initial + dependency-driven load
  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  // Auto-refresh polling
  useEffect(() => {
    if (!TRACKER_CONFIG.refreshMs) return
    const id = setInterval(fetchData, TRACKER_CONFIG.refreshMs)
    return () => clearInterval(id)
  }, [fetchData])

  // Status counts across the full unfiltered set (for the tiles)
  const counts = useMemo(() => {
    const map = { ALL: invoices.length }
    TRACKER_STATUSES.forEach((s) => {
      if (s.key === 'ALL') return
      map[s.key] = invoices.filter((inv) => inv.status === s.key).length
    })
    return map
  }, [invoices])

  // Tiles reflect *currently loaded* set, so when a filter is active they
  // show the slice that came back from the API. The "ALL" tile resets filter.
  const displayed = invoices.slice(0, TRACKER_CONFIG.pageSize)

  const handleExport = async () => {
    try {
      setExporting(true)
      const filters = {}
      if (statusFilter !== 'ALL') filters.status = [statusFilter]
      if (typeFilter) filters.invoice_type = [typeFilter]
      if (searchTerm.trim()) filters.search = searchTerm.trim()
      await financeService.exportInvoices('excel', filters)
    } catch (err) {
      console.error('[InvoiceTracker] export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2">
              Finance · 3.2
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Invoice Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time pipeline view of all invoices across the approval workflow.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || invoices.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Status tiles ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TRACKER_STATUSES.map((s) => (
            <StatusTile
              key={s.key}
              status={s}
              count={counts[s.key] ?? 0}
              active={statusFilter === s.key}
              onClick={() => setStatusFilter(s.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number, vendor…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {TRACKER_INVOICE_TYPES.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {lastFetched && (
            <span className="text-[11px] text-gray-400 shrink-0">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-sm text-rose-600 bg-rose-50">
              {error}
            </div>
          ) : loading && invoices.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading invoices…</div>
          ) : displayed.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">{TRACKER_CONFIG.emptyText}</div>
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
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((inv, idx) => (
                    <tr
                      key={inv.id || idx}
                      className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                    >
                      {TRACKER_COLUMNS.map((c) => (
                        <td key={c.key} className={`px-4 py-3 ${c.className || ''}`}>
                          {c.accessor(inv)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <StatusBadge statusKey={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length > TRACKER_CONFIG.pageSize && (
                <div className="px-4 py-3 text-[11px] text-gray-400 bg-gray-50 border-t border-gray-100">
                  Showing first {TRACKER_CONFIG.pageSize} of {invoices.length}. Use filters to narrow results.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoiceTracker
