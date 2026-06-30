/**
 * ComparisonPanel — single reusable panel that:
 *   1) lets HR upload an external XLSX/CSV against a chosen run,
 *   2) shows summary KPIs,
 *   3) renders a diff table with per-field variances + recommendations,
 *   4) lists prior comparisons for the same run, and
 *   5) provides an XLSX export of the diff.
 *
 * It is used twice:
 *   - Standalone in `ComparisonsHub` (global tab) — caller passes `showRunPicker`.
 *   - Embedded inside `RunDetail` — caller passes `runId` and hides the run picker.
 *
 * Everything visual (status labels, tones, field labels, severity badges) is
 * pulled from `payrollEngine.config.js` so the UI follows the backend catalog.
 */
import React, { useEffect, useMemo, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'

import payrollEngineService, { downloadBlob } from '../../../../services/payrollEngine.service'
import {
  COMPARISON_STATUS, COMPARISON_STATUS_META, COMPARISON_SEVERITY_META,
  COMPARISON_FIELDS, COMPARISON_PROFILE_FALLBACK,
  comparisonFieldMeta, formatComparisonValue, formatNumber,
} from '../../../../config/payrollEngine.config'

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-AE', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const STATUS_TABS = [
  { key: '__all__',                          label: 'All' },
  { key: COMPARISON_STATUS.VARIANCE,         label: COMPARISON_STATUS_META[COMPARISON_STATUS.VARIANCE].label },
  { key: COMPARISON_STATUS.MATCH,            label: COMPARISON_STATUS_META[COMPARISON_STATUS.MATCH].label },
  { key: COMPARISON_STATUS.EXTERNAL_ONLY,    label: COMPARISON_STATUS_META[COMPARISON_STATUS.EXTERNAL_ONLY].label },
  { key: COMPARISON_STATUS.PAYROLL_ONLY,     label: COMPARISON_STATUS_META[COMPARISON_STATUS.PAYROLL_ONLY].label },
]

export default function ComparisonPanel({
  runId,                 // required when showRunPicker=false
  runOptions = [],       // list of {id, cycle_code, status_label} for picker
  showRunPicker = false, // global page passes true; RunDetail passes false
  defaultRunId = '',
}) {
  const [profiles, setProfiles] = useState(COMPARISON_PROFILE_FALLBACK)
  const [activeRunId, setActiveRunId] = useState(runId || defaultRunId || '')
  const [history, setHistory] = useState([])
  const [comparison, setComparison] = useState(null)   // full detail of selected
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const [file, setFile] = useState(null)
  const [sourceProfile, setSourceProfile] = useState('auto')
  const [sourceLabel, setSourceLabel] = useState('')

  const [statusFilter, setStatusFilter] = useState('__all__')
  const [search, setSearch] = useState('')

  // ── Effect: keep activeRunId in sync when parent prop changes
  useEffect(() => {
    if (runId && runId !== activeRunId) setActiveRunId(runId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // ── Effect: load profile list once
  useEffect(() => {
    payrollEngineService.getComparisonProfiles()
      .then((data) => {
        if (Array.isArray(data) && data.length) setProfiles(data)
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  // ── Effect: when active run changes, refresh history + clear detail
  useEffect(() => {
    if (!activeRunId) {
      setHistory([]); setComparison(null); setRows([])
      return
    }
    setLoading(true)
    setError(null)
    payrollEngineService.listComparisons({ run: activeRunId })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results ?? [])
        setHistory(list)
        // Auto-select newest if any
        if (list.length) {
          loadComparison(list[0].id)
        } else {
          setComparison(null); setRows([])
        }
      })
      .catch((e) => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunId])

  // ── Effect: reload rows when status filter / search changes
  useEffect(() => {
    if (!comparison) return
    refreshRows(comparison.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search])

  const loadComparison = async (id) => {
    setLoading(true); setError(null)
    try {
      const detail = await payrollEngineService.getComparison(id)
      setComparison(detail)
      await refreshRows(id, detail)
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshRows = async (id, detail = comparison) => {
    const params = {}
    if (statusFilter !== '__all__') params.status = statusFilter
    if (search.trim()) params.search = search.trim()
    try {
      const data = await payrollEngineService.listComparisonRows(id, params)
      const list = Array.isArray(data) ? data : (data?.results ?? [])
      setRows(list)
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    }
  }

  const handleUpload = async () => {
    if (!activeRunId) { setError('Pick a payroll run first.'); return }
    if (!file)        { setError('Choose a file to upload.'); return }
    setUploading(true); setError(null)
    try {
      const detail = await payrollEngineService.uploadComparison({
        runId: activeRunId,
        file,
        sourceLabel,
        sourceProfile,
      })
      // Refresh history list and select new comparison
      const list = await payrollEngineService.listComparisons({ run: activeRunId })
      setHistory(Array.isArray(list) ? list : (list?.results ?? []))
      setComparison(detail)
      setRows(detail.rows || [])
      setFile(null)
      // Reset native file input
      const input = document.getElementById('comparison-file-input')
      if (input) input.value = ''
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this comparison report?')) return
    try {
      await payrollEngineService.deleteComparison(id)
      const list = await payrollEngineService.listComparisons({ run: activeRunId })
      const remaining = Array.isArray(list) ? list : (list?.results ?? [])
      setHistory(remaining)
      if (comparison?.id === id) {
        if (remaining.length) loadComparison(remaining[0].id)
        else { setComparison(null); setRows([]) }
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    }
  }

  const handleDownloadXlsx = async () => {
    if (!comparison) return
    try {
      const blob = await payrollEngineService.downloadComparisonXlsx(comparison.id)
      downloadBlob(blob, `comparison_${comparison.run_cycle_code}_${comparison.source_profile}_${comparison.id}.xlsx`)
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    }
  }

  // Build a quick lookup of fields actually carried by the external file
  const detectedFields = useMemo(() => {
    const fields = comparison?.summary?.fields_detected || []
    return fields.filter((f) => f !== 'employee_no' && f !== 'full_name')
  }, [comparison])

  return (
    <div className="space-y-4">
      {/* ── Upload card ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <HeroIcons.ArrowsRightLeftIcon className="w-4 h-4 text-indigo-600" />
              Upload external file
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload a ValueFrame attendance / Sympa HR / generic XLSX file —
              the engine extracts the same columns as Monthly Runs and reports
              variances with recommendations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
          {showRunPicker && (
            <div className="md:col-span-3">
              <label className="block text-[11px] uppercase font-medium text-slate-500 mb-1">
                Payroll run
              </label>
              <select
                value={activeRunId}
                onChange={(e) => setActiveRunId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-md px-2 py-2 bg-white"
              >
                <option value="">— select —</option>
                {runOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.cycle_code} {r.status_label ? `(${r.status_label})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={showRunPicker ? 'md:col-span-3' : 'md:col-span-3'}>
            <label className="block text-[11px] uppercase font-medium text-slate-500 mb-1">
              Source profile
            </label>
            <select
              value={sourceProfile}
              onChange={(e) => setSourceProfile(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md px-2 py-2 bg-white"
            >
              {profiles.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[11px] uppercase font-medium text-slate-500 mb-1">
              Source label (optional)
            </label>
            <input
              type="text"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="e.g. ValueFrame Jun-2026"
              className="w-full text-xs border border-slate-300 rounded-md px-2 py-2"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[11px] uppercase font-medium text-slate-500 mb-1">
              File (.xlsx)
            </label>
            <input
              id="comparison-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs"
            />
          </div>
          <div className={showRunPicker ? 'md:col-span-12 md:mt-1' : 'md:col-span-3 md:mt-1'}>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file || !activeRunId}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading
                ? <HeroIcons.ArrowPathIcon className="w-4 h-4 animate-spin" />
                : <HeroIcons.ArrowUpTrayIcon className="w-4 h-4" />}
              {uploading ? 'Comparing…' : 'Compare'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* ── History strip ───────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-[11px] uppercase font-medium text-slate-500 mb-2">
            Prior comparisons for this run ({history.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <div
                key={h.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border ${
                  comparison?.id === h.id
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadComparison(h.id)}
                  className="flex items-center gap-1.5"
                >
                  <HeroIcons.DocumentMagnifyingGlassIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{h.source_label || h.source_profile}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{formatDateTime(h.created_at)}</span>
                  {h.summary?.variance ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
                      {h.summary.variance} diff
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(h.id)}
                  title="Delete this comparison"
                  className="text-slate-400 hover:text-rose-600"
                >
                  <HeroIcons.XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary KPIs + actions ──────────────────────────────── */}
      {comparison && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="text-sm font-semibold text-slate-700">
                {comparison.source_label}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  vs {comparison.run_cycle_code} ·
                  uploaded {formatDateTime(comparison.created_at)}
                  {comparison.uploaded_by_name ? ` by ${comparison.uploaded_by_name}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadXlsx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 hover:bg-slate-50"
              >
                <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" />
                Download diff XLSX
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile label="Matched"
                       value={formatNumber(comparison.summary?.matched, { decimals: 0 })}
                       tone="emerald" />
              <KpiTile label="Variances"
                       value={formatNumber(comparison.summary?.variance, { decimals: 0 })}
                       tone="amber" />
              <KpiTile label="External only"
                       value={formatNumber(comparison.summary?.external_only, { decimals: 0 })}
                       tone="sky" />
              <KpiTile label="Missing from external"
                       value={formatNumber(comparison.summary?.payroll_only, { decimals: 0 })}
                       tone="rose" />
            </div>

            {/* Per-field variance breakdown */}
            {detectedFields.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase font-medium text-slate-500 mb-2">
                  Variance by field
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {detectedFields.map((f) => {
                    const meta = comparisonFieldMeta(f)
                    const st = comparison.summary?.by_field?.[f] || {}
                    return (
                      <div
                        key={f}
                        className="border border-slate-200 rounded-md px-2 py-1.5 text-xs bg-slate-50"
                      >
                        <div className="font-medium text-slate-700">{meta.label}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-500">Δ {st.variances || 0}</span>
                          {st.critical
                            ? <span className="text-rose-600 font-medium">!{st.critical}</span>
                            : null}
                          {st.warning
                            ? <span className="text-amber-600 font-medium">·{st.warning}</span>
                            : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Filters ─────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-wrap gap-1">
                {STATUS_TABS.map((t) => {
                  const isActive = statusFilter === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setStatusFilter(t.key)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                        isActive
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
              <div className="relative">
                <HeroIcons.MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name / emp #"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md w-64"
                />
              </div>
            </div>
          </div>

          {/* ── Diff table ──────────────────────────────────────── */}
          <ComparisonRowsTable
            rows={rows}
            detectedFields={detectedFields}
            loading={loading}
          />
        </>
      )}

      {!comparison && !loading && activeRunId && (
        <div className="text-center text-slate-500 text-sm py-8 border border-dashed border-slate-300 rounded-xl">
          No comparisons yet. Upload an external file above to get started.
        </div>
      )}
    </div>
  )
}

function KpiTile({ label, value, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    sky:     'bg-sky-50 border-sky-200 text-sky-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
    slate:   'bg-slate-50 border-slate-200 text-slate-800',
  }
  return (
    <div className={`border rounded-lg p-3 ${tones[tone] || tones.slate}`}>
      <div className="text-[10px] uppercase font-medium opacity-70">{label}</div>
      <div className="text-lg font-semibold tabular-nums mt-1">{value || 0}</div>
    </div>
  )
}

function ComparisonRowsTable({ rows, detectedFields, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
        Loading rows…
      </div>
    )
  }
  if (!rows.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
        No rows for the current filter.
      </div>
    )
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Employee</th>
              <th className="px-3 py-2 text-left font-medium">Match</th>
              {detectedFields.map((f) => (
                <th key={f} className="px-3 py-2 text-right font-medium tabular-nums">
                  {comparisonFieldMeta(f).label}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Recommendations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const meta = COMPARISON_STATUS_META[row.status] || {}
              const varMap = Object.fromEntries((row.variances || []).map((v) => [v.field, v]))
              const recs = (row.variances || [])
                .filter((v) => v.recommendation)
                .map((v) => `${comparisonFieldMeta(v.field).label}: ${v.recommendation}`)
              return (
                <tr key={row.id} className={`hover:bg-slate-50 ${meta.rowFill || ''}`}>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${meta.badge || ''}`}>
                      {meta.short || row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">
                      {row.payroll_employee_name || row.external_name || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {row.payroll_employee_no || row.external_employee_no || ''}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-[10px]">
                    {row.matched_by || '—'}
                  </td>
                  {detectedFields.map((f) => {
                    const v = varMap[f]
                    const ourValue = formatComparisonValue(f, v?.our ?? null)
                    const extValue = formatComparisonValue(f, v?.external ?? null)
                    if (!v) {
                      return <td key={f} className="px-3 py-2 text-right text-slate-300">—</td>
                    }
                    const sev = COMPARISON_SEVERITY_META[v.severity] || {}
                    return (
                      <td
                        key={f}
                        className={`px-3 py-2 text-right tabular-nums ${sev.cell || ''}`}
                        title={`Our: ${ourValue}\nExternal: ${extValue}\nDiff: ${v.diff ?? '—'} (${v.pct ?? 0}%)`}
                      >
                        <div className="text-slate-700">{ourValue}</div>
                        <div className="text-[10px] text-slate-500">ext {extValue}</div>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-slate-600 max-w-xs">
                    {recs.length ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {recs.map((r, i) => (
                          <li key={i} className="text-[11px]">{r}</li>
                        ))}
                      </ul>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
