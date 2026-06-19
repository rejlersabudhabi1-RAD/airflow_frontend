/**
 * Payroll Engine â€” full lifecycle management + AI anomaly intelligence
 *
 * Sections:
 *   1. Header â€” run selector + New Run button
 *   2. RunControlPanel â€” run info, â–¶ Run Engine, Bulk Approve, Bulk Send
 *   3. Subtab nav â€” Overview | Slips | Analytics
 *   4. Overview â€” 5 KPI tiles + Anomaly Panel + Charts
 *   5. Slips â€” filter bar + table with per-row AI badges + SlipDrawer
 *   6. Analytics â€” dept breakdown + MoM comparison
 *
 * All thresholds / labels are soft-coded via ENGINE_* in hrPayroll.config.js
 */
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from 'recharts'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollService from '../../../services/payroll.service'
import timesheetSvc   from '../../../services/timesheet.service'
import {
  ENGINE_ANOMALY_RULES,
  ENGINE_ANOMALY_SEVERITY,
  ENGINE_DEPT_CHART_COLORS,
  ENGINE_SUBTABS,
  ENGINE_COPY,
  ENGINE_BULK_PAGE_SIZE,
  PAYROLL_SLIP_STATUS,
  PAYROLL_ALERT_SEVERITY,
  IMPORT_SOURCES,
  IMPORT_RADAI_SOURCE,
  IMPORT_BIOMETRIC_SOURCE,
  IMPORT_MASTER_COLUMNS,
  IMPORT_COPY,
  slipStatusMeta,
  runStatusMeta,
  fmtCurrency,
} from '../../../config/hrPayroll.config'

// â”€â”€â”€ tiny helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const C = HeroIcons[name]
  return C ? <C className={className} /> : null
}

const Spinner = ({ size = 4 }) => (
  <svg className={`animate-spin w-${size} h-${size} text-blue-500`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <div className="h-3 bg-slate-100 rounded animate-pulse" />
      </td>
    ))}
  </tr>
)

const StatusBadge = ({ status }) => {
  const m = PAYROLL_SLIP_STATUS[status] ?? { label: status, tone: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${m.tone}`}>
      {m.label}
    </span>
  )
}

const SeverityDot = ({ severity }) => {
  const s = PAYROLL_ALERT_SEVERITY[severity] ?? PAYROLL_ALERT_SEVERITY.medium
  return <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// â”€â”€â”€ sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KpiTile({ icon, label, value, sub, tone = 'bg-blue-50 text-blue-700' }) {
  return (
    <div className={`rounded-2xl p-4 ${tone} space-y-1 min-w-0`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-75">
        <Icon name={icon} className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight truncate">{value ?? 'â€”'}</div>
      {sub && <div className="text-xs opacity-60 truncate">{sub}</div>}
    </div>
  )
}

function RunControlPanel({ run, processing, pendingCount, approvedCount, onProcess, onBulkApprove, onBulkSend }) {
  if (!run) return null
  const rm = runStatusMeta(run.status)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-slate-800">{run.run_code}</span>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rm.tone}`}>{rm.label}</span>
          <span className="text-xs text-slate-400">
            {MONTH_NAMES[(run.month ?? 1) - 1]} {run.year}
            {run.period_start && run.period_end && ` Â· ${run.period_start} â€“ ${run.period_end}`}
          </span>
        </div>
        {run.status === 'failed' && run.error_log && (
          <p className="mt-1 text-xs text-rose-600 line-clamp-2">{run.error_log}</p>
        )}
        {run.status === 'processing' && (
          <p className="mt-1 text-xs text-blue-600 flex items-center gap-1.5">
            <Spinner size={3} />{ENGINE_COPY.processing}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={run.status !== 'draft' || processing}
          onClick={onProcess}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
        >
          {processing
            ? <><Spinner size={3} />{ENGINE_COPY.runEngineRunning}</>
            : <><Icon name="CpuChipIcon" className="w-4 h-4" />{ENGINE_COPY.runEngineBtn}</>}
        </button>
        <button
          type="button"
          disabled={pendingCount === 0}
          onClick={onBulkApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
        >
          <Icon name="CheckCircleIcon" className="w-4 h-4" />
          {ENGINE_COPY.bulkApproveBtn}
          {pendingCount > 0 && (
            <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-xs">{pendingCount}</span>
          )}
        </button>
        <button
          type="button"
          disabled={approvedCount === 0}
          onClick={onBulkSend}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
        >
          <Icon name="EnvelopeIcon" className="w-4 h-4" />
          {ENGINE_COPY.bulkSendBtn}
          {approvedCount > 0 && (
            <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-xs">{approvedCount}</span>
          )}
        </button>
      </div>
    </div>
  )
}

function AnomalyPanel({ flags }) {
  const [open, setOpen] = useState(true)
  if (flags.length === 0) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-amber-900 hover:bg-amber-100/60 transition"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="ExclamationTriangleIcon" className="w-4 h-4 text-amber-600" />
          {ENGINE_COPY.anomalyPanelTitle}
          <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">{flags.length}</span>
        </span>
        <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} className="w-4 h-4 text-amber-600" />
      </button>
      {open && (
        <div className="divide-y divide-amber-200/60">
          {flags.map((f, i) => {
            const sev = PAYROLL_ALERT_SEVERITY[ENGINE_ANOMALY_SEVERITY[f.rule]?.severity ?? 'medium']
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <SeverityDot severity={ENGINE_ANOMALY_SEVERITY[f.rule]?.severity ?? 'medium'} />
                <div className="flex-1 min-w-0 text-sm">
                  <span className="font-medium text-slate-800">{f.employeeName}</span>
                  <span className="mx-1.5 text-slate-400">Â·</span>
                  <span className="text-slate-600">{f.message}</span>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${sev?.tone}`}>
                  {ENGINE_ANOMALY_SEVERITY[f.rule]?.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DeptBarChart({ data }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-slate-300 text-sm">{ENGINE_COPY.noSlipsFound}</div>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => [fmtCurrency(v), 'Net Salary']} labelFormatter={(l) => `Dept: ${l}`} />
        <Bar dataKey="net" name="Net Salary" radius={[4, 4, 0, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={ENGINE_DEPT_CHART_COLORS[idx % ENGINE_DEPT_CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BreakdownPie({ allowances, deductions }) {
  const data = [
    { name: 'Allowances', value: Number(allowances) || 0, fill: '#10b981' },
    { name: 'Deductions', value: Number(deductions) || 0, fill: '#ef4444' },
  ]
  if (!data[0].value && !data[1].value) return (
    <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="45%" outerRadius={68} innerRadius={36} paddingAngle={3}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
        <Tooltip formatter={(v) => [fmtCurrency(v)]} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function MoMChart({ slips, prevSlips }) {
  const deptData = useMemo(() => {
    const curr = {}
    const prev = {}
    slips.forEach(s => {
      const d = s.department || s.employee_department || 'Other'
      curr[d] = (curr[d] || 0) + Number(s.net_salary || 0)
    })
    prevSlips.forEach(s => {
      const d = s.department || s.employee_department || 'Other'
      prev[d] = (prev[d] || 0) + Number(s.net_salary || 0)
    })
    const depts = [...new Set([...Object.keys(curr), ...Object.keys(prev)])]
    return depts.map(d => ({ dept: d, current: curr[d] || 0, previous: prev[d] || 0 }))
  }, [slips, prevSlips])

  if (!deptData.length) return (
    <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={deptData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => [fmtCurrency(v)]} />
        <Bar dataKey="previous" name="Previous Month" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="current"  name="Current Month"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Legend iconType="circle" iconSize={8} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SlipDrawer({ slip, biometricRow, anomalies, onApprove, onReject, onSend, onClose }) {
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing] = useState(false)

  const doApprove = async () => { setActing(true); await onApprove(slip.id); setActing(false) }
  const doReject  = async () => {
    if (!rejectNote.trim()) return
    setActing(true); await onReject(slip.id, rejectNote.trim()); setActing(false)
  }
  const doSend = async () => { setActing(true); await onSend(slip.id); setActing(false) }

  const breakdownRows = (obj) =>
    obj && typeof obj === 'object' ? Object.entries(obj).filter(([, v]) => Number(v) > 0) : []

  const biometricPresent = biometricRow?.days_present ?? biometricRow?.present_days ?? null
  const slipPresent      = slip.present_days ?? null
  const hasMismatch      = biometricPresent !== null && slipPresent !== null &&
    Math.abs(biometricPresent - slipPresent) > ENGINE_ANOMALY_RULES.attendanceMismatchTolerance

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative ml-auto w-96 xl:w-[28rem] bg-white shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-sm font-bold text-slate-800">{slip.slip_number}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {slip.employee_name} Â· {MONTH_NAMES[(slip.month ?? 1) - 1]} {slip.year}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={slip.status} />
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
              <Icon name="XMarkIcon" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Salary formula */}
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
            {[
              ['Basic Salary',   slip.basic_salary,      'text-slate-500',   null],
              ['+ Allowances',   slip.total_allowances,  'text-emerald-700', '+'],
              ['= Gross Salary', slip.gross_salary,      'text-slate-700 font-semibold', null],
              ['âˆ’ Deductions',   slip.total_deductions,  'text-rose-600',    'âˆ’'],
            ].map(([label, val, cls]) => (
              <div key={label} className={`flex justify-between ${label.startsWith('=') ? 'border-t border-slate-200 pt-1.5' : ''}`}>
                <span className={cls}>{label}</span>
                <span className={`font-medium ${cls}`}>{fmtCurrency(val)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-slate-300 pt-2 text-base font-bold text-slate-900">
              <span>Net Salary</span>
              <span>{fmtCurrency(slip.net_salary)}</span>
            </div>
          </div>

          {/* Allowances breakdown */}
          {breakdownRows(slip.allowances_breakdown).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Allowances</h4>
              {breakdownRows(slip.allowances_breakdown).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-600">{k}</span>
                  <span className="text-emerald-700 font-medium">{fmtCurrency(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Deductions breakdown */}
          {breakdownRows(slip.deductions_breakdown).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deductions</h4>
              {breakdownRows(slip.deductions_breakdown).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-600">{k}</span>
                  <span className="text-rose-700 font-medium">âˆ’ {fmtCurrency(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Attendance */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {ENGINE_COPY.drawerAttendance}
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[['Working', slip.working_days], ['Present (Slip)', slipPresent], ['Absent', slip.absent_days]].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-xl p-2">
                  <div className="font-bold text-base text-slate-800">{v ?? 'â€”'}</div>
                  <div className="text-slate-400 mt-0.5 leading-tight">{l}</div>
                </div>
              ))}
              <div className={`rounded-xl p-2 ${hasMismatch ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <div className={`font-bold text-base ${hasMismatch ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {biometricPresent ?? 'â€”'}
                </div>
                <div className={`text-xs mt-0.5 leading-tight ${hasMismatch ? 'text-rose-500' : 'text-emerald-600'}`}>
                  Biometric{hasMismatch && ' âš '}
                </div>
              </div>
            </div>
          </div>

          {/* AI flags */}
          {anomalies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {ENGINE_COPY.drawerAIFlags}
              </h4>
              <div className="space-y-1.5">
                {anomalies.map((a, i) => {
                  const sev = PAYROLL_ALERT_SEVERITY[ENGINE_ANOMALY_SEVERITY[a.rule]?.severity ?? 'medium']
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${sev?.tone}`}>
                      <SeverityDot severity={ENGINE_ANOMALY_SEVERITY[a.rule]?.severity ?? 'medium'} />
                      <span>{a.message}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {(slip.remarks || slip.rejection_reason) && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</h4>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                {slip.rejection_reason || slip.remarks}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {slip.status === 'pending_approval' && (
              <>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder={ENGINE_COPY.drawerRejectNote}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={acting} onClick={doApprove}
                    className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                    {acting ? <Spinner size={3} /> : <Icon name="CheckIcon" className="w-4 h-4" />}
                    {ENGINE_COPY.drawerApprove}
                  </button>
                  <button type="button" disabled={acting || !rejectNote.trim()} onClick={doReject}
                    className="flex items-center justify-center gap-1.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                    <Icon name="XMarkIcon" className="w-4 h-4" />
                    {ENGINE_COPY.drawerReject}
                  </button>
                </div>
              </>
            )}
            {slip.status === 'approved' && (
              <button type="button" disabled={acting} onClick={doSend}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                {acting ? <Spinner size={3} /> : <Icon name="EnvelopeIcon" className="w-4 h-4" />}
                {ENGINE_COPY.drawerSendEmail}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Data Import Modal ────────────────────────────────────────────────────────
function DataImportModal({ onClose, selRun, onGenerated }) {
  const now          = new Date()
  const defaultYear  = selRun?.year  ?? now.getFullYear()
  const defaultMonth = selRun?.month ?? now.getMonth() + 1

  const [year,        setYear]       = useState(String(defaultYear))
  const [month,       setMonth]      = useState(String(defaultMonth))
  const [sympaFile,   setSympaFile]  = useState(null)
  const [vfFile,      setVfFile]     = useState(null)
  const [otherFile,   setOtherFile]  = useState(null)
  const [generating,  setGenerating] = useState(false)
  const [err,         setErr]        = useState('')

  const canGenerate = !!(sympaFile || vfFile || otherFile)

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setGenerating(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('year', year); fd.append('month', month)
      if (sympaFile) fd.append('sympa_file',     sympaFile)
      if (vfFile)    fd.append('valueframe_file', vfFile)
      if (otherFile) fd.append('other_file',      otherFile)
      const res = await payrollService.generateMasterPayroll(fd)
      // Shift result into the main Payroll Engine page and close this modal
      onGenerated({
        rows:      res.rows     ?? [],
        stats:     res.stats    ?? {},
        warnings:  res.warnings ?? [],
        year, month,
        sympaFile, vfFile, otherFile,
      })
      onClose()
    } catch (e) {
      setErr(e?.response?.data?.error || IMPORT_COPY.errorGeneric)
    } finally { setGenerating(false) }
  }, [canGenerate, sympaFile, vfFile, otherFile, year, month, onGenerated, onClose])

  const SourceBadge = ({ src }) => {
    // Check upload sources first, then display-only auto sources
    const s = IMPORT_SOURCES.find(x => x.id === src)
           ?? (src === 'radai'     ? IMPORT_RADAI_SOURCE      : null)
           ?? (src === 'biometric' ? IMPORT_BIOMETRIC_SOURCE  : null)
    if (!s) return (
      <span className="inline-flex text-xs px-1.5 py-0.5 rounded-full border bg-violet-100 text-violet-700 border-violet-200 font-medium">
        RAD
      </span>
    )
    return (
      <span className={`inline-flex text-xs px-1.5 py-0.5 rounded-full border font-medium ${s.badge}`}>{s.abbr}</span>
    )
  }

  const fileStates = {
    sympa:      { file: sympaFile,  setFile: setSympaFile  },
    valueframe: { file: vfFile,     setFile: setVfFile     },
    other:      { file: otherFile,  setFile: setOtherFile  },
  }

  const FileCard = ({ source }) => {
    const { file, setFile } = fileStates[source.id] ?? { file: null, setFile: () => {} }
    return (
      <div className={`relative rounded-2xl border-2 border-dashed p-5 transition ${
        file ? `${source.color} border-solid` : 'border-slate-200 hover:border-slate-300 bg-slate-50'
      }`}>
        <label className="block cursor-pointer">
          <input type="file" accept={source.accept} className="sr-only"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${file ? source.color : 'bg-white border border-slate-200'}`}>
              <Icon name={source.icon} className={`w-5 h-5 ${source.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{source.label}</span>
                {file && <span className="text-xs text-emerald-600 flex items-center gap-0.5"><Icon name="CheckCircleIcon" className="w-3.5 h-3.5" /> Uploaded</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{source.description}</p>
              {file
                ? <p className="text-xs font-medium text-slate-700 mt-1.5 truncate">{file.name}</p>
                : <p className="text-xs text-blue-600 mt-1.5 font-medium">Click to upload ({source.accept})</p>
              }
            </div>
            {file && (
              <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setFile(null) }}
                className="text-slate-400 hover:text-slate-700 p-1 shrink-0">
                <Icon name="XMarkIcon" className="w-4 h-4" />
              </button>
            )}
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-400 italic">{source.hint}</p>
      </div>
    )
  }

  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Icon name="CircleStackIcon" className="w-5 h-5 text-blue-600" />
              {IMPORT_COPY.modalTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{IMPORT_COPY.modalSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none">
              {MN.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} min={2020} max={2100}
              className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5">
              <Icon name="XMarkIcon" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {IMPORT_SOURCES.map(src => <FileCard key={src.id} source={src} />)}
          </div>
          <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
            <Icon name="ClockIcon" className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-700 leading-relaxed">{IMPORT_COPY.radaiNote}</p>
          </div>
          {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">{err}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition">
            {IMPORT_COPY.cancelBtn}
          </button>
          <button type="button" disabled={!canGenerate || generating} onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition">
            {generating
              ? <><Spinner size={3} />{IMPORT_COPY.generatingBtn}</>
              : <><Icon name="CpuChipIcon" className="w-4 h-4" />{IMPORT_COPY.generateBtn}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewRunModal({ onClose, onCreated }) {
  const now = new Date()
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  const runCodePreview = `${ENGINE_COPY.runCodePrefix}-${year}-${String(month).padStart(2, '0')}`
  const periodStart    = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay        = new Date(Number(year), Number(month), 0).getDate()
  const periodEnd      = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const run = await payrollService.createPayrollRun({
        month:        Number(month),
        year:         Number(year),
        run_code:     runCodePreview,
        period_start: periodStart,
        period_end:   periodEnd,
      })
      onCreated(run)
    } catch (ex) {
      const msg = ex?.response?.data?.detail ||
        Object.values(ex?.response?.data ?? {})?.[0]?.[0] ||
        'Failed to create payroll run.'
      setErr(msg)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">{ENGINE_COPY.createRunTitle}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <Icon name="XMarkIcon" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-500 font-medium">Month</span>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 font-medium">Year</span>
              <input type="number" value={year} onChange={e => setYear(e.target.value)}
                min={2020} max={2100}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </label>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Run Code</span>
              <span className="font-mono font-semibold text-blue-700">{runCodePreview}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Period</span>
              <span className="text-slate-700">{periodStart} â†’ {periodEnd}</span>
            </div>
          </div>
          {err && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition">
              {saving ? <Spinner size={3} /> : <Icon name="PlusIcon" className="w-4 h-4" />}
              Create Run
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// â”€â”€â”€ main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_FILTER_OPTIONS = ['all', 'draft', 'generated', 'pending_approval', 'approved', 'rejected', 'sent']

export default function PayrollEngine({ activeRunId, onSelectRun }) {
  const [runs,         setRuns]        = useState([])
  const [selRunId,     setSelRunId]    = useState(activeRunId ?? '')
  const [slips,        setSlips]       = useState([])
  const [prevSlips,    setPrevSlips]   = useState([])
  const [attendance,   setAttendance]  = useState({})
  const [statusFilter, setStatusFilter]= useState('all')
  const [deptFilter,   setDeptFilter]  = useState('all')
  const [subtab,       setSubtab]      = useState('overview')
  const [drawer,       setDrawer]      = useState(null)
  const [loading,      setLoading]     = useState(false)
  const [processing,   setProcessing]  = useState(false)
  const [actionMsg,    setActionMsg]   = useState(null)
  const [newRunOpen,   setNewRunOpen]  = useState(false)
  const [importOpen,   setImportOpen]  = useState(false)
  const [masterPreview,setMasterPreview] = useState(null)  // {rows,stats,warnings,year,month,sympaFile,vfFile,otherFile}
  const [prevDlLoading,setPrevDlLoading] = useState(false)
  const [runsLoading,  setRunsLoading] = useState(true)

  const selRun = useMemo(() => runs.find(r => r.id === selRunId) ?? null, [runs, selRunId])

  // Load runs on mount
  useEffect(() => {
    setRunsLoading(true)
    payrollService.getPayrollRuns({ page_size: 36 })
      .then(r => {
        const list = Array.isArray(r) ? r : (r?.results ?? [])
        setRuns(list)
        if (!selRunId && list.length) setSelRunId(list[0].id)
      })
      .finally(() => setRunsLoading(false))
  }, [])

  useEffect(() => { if (activeRunId) setSelRunId(activeRunId) }, [activeRunId])

  // Load slips + attendance + prev-month slips whenever run changes
  useEffect(() => {
    if (!selRun) return
    setLoading(true)
    setSlips([]); setPrevSlips([]); setAttendance({})

    const { year, month } = selRun

    const slipP = payrollService.getSalarySlips({
      payroll_run: selRunId, page_size: ENGINE_BULK_PAGE_SIZE,
    }).then(r => setSlips(Array.isArray(r) ? r : (r?.results ?? []))).catch(() => setSlips([]))

    const attP = timesheetSvc.fetchMonthly(year, month)
      .then(res => {
        const rows = Array.isArray(res) ? res : (res?.rows ?? [])
        const map  = {}
        rows.forEach(row => {
          const code = (row.employee_code || row.code || '').toString().toLowerCase().trim()
          if (code) map[code] = row
        })
        setAttendance(map)
      }).catch(() => setAttendance({}))

    const prevM   = month === 1 ? 12 : month - 1
    const prevY   = month === 1 ? year - 1 : year
    const prevRun = runs.find(r => r.month === prevM && r.year === prevY)
    const prevP   = prevRun
      ? payrollService.getSalarySlips({ payroll_run: prevRun.id, page_size: ENGINE_BULK_PAGE_SIZE })
          .then(r => setPrevSlips(Array.isArray(r) ? r : (r?.results ?? []))).catch(() => setPrevSlips([]))
      : Promise.resolve()

    Promise.all([slipP, attP, prevP]).finally(() => setLoading(false))
  }, [selRunId, selRun])

  // â”€â”€ AI Anomaly Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const anomalyFlags = useMemo(() => {
    const flags = []
    const prevMap = {}
    prevSlips.forEach(s => {
      prevMap[(s.employee_code || s.employee_salary_info?.employee_id || '').toString().toLowerCase().trim()] = s
    })
    slips.forEach(slip => {
      const code = (slip.employee_code || slip.employee_salary_info?.employee_id || '').toString().toLowerCase().trim()

      if (Number(slip.absent_days ?? 0) > ENGINE_ANOMALY_RULES.highAbsentDays)
        flags.push({ slipId: slip.id, employeeName: slip.employee_name || code, rule: 'highAbsent',
          message: `${slip.absent_days} absent days (threshold: ${ENGINE_ANOMALY_RULES.highAbsentDays})` })

      if (ENGINE_ANOMALY_RULES.zeroNetSalary && Number(slip.net_salary ?? 0) === 0)
        flags.push({ slipId: slip.id, employeeName: slip.employee_name || code, rule: 'zeroNet',
          message: 'Net salary is AED 0.00 â€” possible data error' })

      const prev = prevMap[code]
      if (prev) {
        const curr = Number(slip.net_salary ?? 0), pn = Number(prev.net_salary ?? 0)
        if (pn > 0 && Math.abs((curr - pn) / pn) * 100 > ENGINE_ANOMALY_RULES.salaryJumpPct)
          flags.push({ slipId: slip.id, employeeName: slip.employee_name || code, rule: 'salaryJump',
            message: `Net salary changed ${(Math.abs((curr - pn) / pn) * 100).toFixed(1)}% vs last month (${fmtCurrency(pn)} â†’ ${fmtCurrency(curr)})` })
      }

      const bio = attendance[code]
      if (bio) {
        const bioP  = Number(bio.days_present ?? bio.present_days ?? 0)
        const slipP = Number(slip.present_days ?? 0)
        if (bioP > 0 && Math.abs(bioP - slipP) > ENGINE_ANOMALY_RULES.attendanceMismatchTolerance)
          flags.push({ slipId: slip.id, employeeName: slip.employee_name || code, rule: 'attendanceMismatch',
            message: `Biometric: ${bioP} days, Slip: ${slipP} days (diff: ${Math.abs(bioP - slipP)})` })
      }
    })
    return flags
  }, [slips, prevSlips, attendance])

  const anomalyMap = useMemo(() => {
    const m = {}
    anomalyFlags.forEach(f => { if (!m[f.slipId]) m[f.slipId] = []; m[f.slipId].push(f) })
    return m
  }, [anomalyFlags])

  // â”€â”€ Derived aggregates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const departments = useMemo(() => {
    const s = new Set(slips.map(s2 => s2.department || s2.employee_department || 'Other'))
    return ['all', ...Array.from(s).sort()]
  }, [slips])

  const filteredSlips = useMemo(() => slips.filter(s => {
    const stOk   = statusFilter === 'all' || s.status === statusFilter
    const dept   = s.department || s.employee_department || 'Other'
    const deptOk = deptFilter   === 'all' || dept === deptFilter
    return stOk && deptOk
  }), [slips, statusFilter, deptFilter])

  const kpiData = useMemo(() => ({
    totalEmployees: slips.length,
    grossPayroll:   slips.reduce((s, r) => s + Number(r.gross_salary ?? 0), 0),
    netPayroll:     slips.reduce((s, r) => s + Number(r.net_salary   ?? 0), 0),
    pendingCount:   slips.filter(r => r.status === 'pending_approval').length,
    approvedCount:  slips.filter(r => r.status === 'approved').length,
    anomalyCount:   Object.keys(anomalyMap).length,
  }), [slips, anomalyMap])

  const deptChartData = useMemo(() => {
    const agg = {}
    slips.forEach(s => { const d = s.department || s.employee_department || 'Other'; agg[d] = (agg[d] || 0) + Number(s.net_salary ?? 0) })
    return Object.entries(agg).map(([dept, net]) => ({ dept, net })).sort((a, b) => b.net - a.net)
  }, [slips])

  const pieData = useMemo(() => ({
    allowances: slips.reduce((s, r) => s + Number(r.total_allowances ?? 0), 0),
    deductions: slips.reduce((s, r) => s + Number(r.total_deductions ?? 0), 0),
  }), [slips])

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toast = useCallback((text, ok = true) => {
    setActionMsg({ text, ok }); setTimeout(() => setActionMsg(null), 4500)
  }, [])

  const reloadSlips = useCallback(() => {
    if (!selRunId) return
    payrollService.getSalarySlips({ payroll_run: selRunId, page_size: ENGINE_BULK_PAGE_SIZE })
      .then(r => setSlips(Array.isArray(r) ? r : (r?.results ?? []))).catch(() => {})
  }, [selRunId])

  const handleProcess = useCallback(async () => {
    setProcessing(true)
    try {
      await payrollService.processPayrollRun(selRunId)
      toast(ENGINE_COPY.processSuccess)
      const r2 = await payrollService.getPayrollRuns({ page_size: 36 })
      setRuns(Array.isArray(r2) ? r2 : (r2?.results ?? []))
      reloadSlips()
    } catch (e) {
      toast(e?.response?.data?.error || ENGINE_COPY.processFailed, false)
    } finally { setProcessing(false) }
  }, [selRunId, toast, reloadSlips])

  const handleBulkApprove = useCallback(async () => {
    try {
      const res = await payrollService.bulkApproveRun(selRunId)
      toast(`${ENGINE_COPY.bulkApproveSuccess} (${res?.approved ?? 0} slips)`)
      reloadSlips()
    } catch (e) { toast(e?.response?.data?.error || 'Bulk approve failed.', false) }
  }, [selRunId, toast, reloadSlips])

  const handleBulkSend = useCallback(async () => {
    try {
      const res = await payrollService.bulkSendApprovedRun(selRunId)
      toast(`${ENGINE_COPY.bulkSendSuccess} (${res?.sent ?? 0} sent)`)
      reloadSlips()
    } catch (e) { toast(e?.response?.data?.error || 'Bulk send failed.', false) }
  }, [selRunId, toast, reloadSlips])

  const handleApprove = useCallback(async (id) => {
    await payrollService.approveSalarySlip(id)
    reloadSlips(); setDrawer(d => d?.id === id ? null : d)
  }, [reloadSlips])

  const handleReject = useCallback(async (id, note) => {
    await payrollService.rejectSalarySlip(id, { rejection_reason: note })
    reloadSlips(); setDrawer(d => d?.id === id ? null : d)
  }, [reloadSlips])

  const handleSend = useCallback(async (id) => {
    await payrollService.sendSalarySlipEmail(id); toast('Email sent.'); reloadSlips()
  }, [toast, reloadSlips])

  const handleNewRunCreated = useCallback((run) => {
    setRuns(prev => [run, ...prev]); setSelRunId(run.id)
    setNewRunOpen(false); toast(`Run ${run.run_code} created. Click "Run Engine" to generate slips.`)
  }, [toast])


  const handlePreviewDownload = useCallback(async () => {
    if (!masterPreview) return
    const { year, month, sympaFile, vfFile, otherFile } = masterPreview
    setPrevDlLoading(true)
    try {
      const fd = new FormData()
      fd.append('year', year); fd.append('month', month)
      if (sympaFile) fd.append('sympa_file',     sympaFile)
      if (vfFile)    fd.append('valueframe_file', vfFile)
      if (otherFile) fd.append('other_file',      otherFile)
      const blob = await payrollService.downloadMasterPayrollExcel(fd)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `master_payroll_${year}_${String(month).padStart(2, '0')}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast(e?.response?.data?.error || IMPORT_COPY.errorGeneric, false)
    } finally { setPrevDlLoading(false) }
  }, [masterPreview, toast])

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{ENGINE_COPY.sectionTitle}</h2>
          <p className="text-xs text-slate-400">{ENGINE_COPY.sectionSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {runsLoading
            ? <div className="flex items-center gap-1.5 text-xs text-slate-400"><Spinner size={3} /> Loading runsâ€¦</div>
            : (
              <select value={selRunId} onChange={e => { setSelRunId(e.target.value); onSelectRun?.(e.target.value) }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-48">
                <option value="">{ENGINE_COPY.noRunSelected}</option>
                {runs.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.run_code} Â· {MONTH_NAMES[(r.month ?? 1) - 1]} {r.year} Â· {runStatusMeta(r.status).label}
                  </option>
                ))}
              </select>
            )
          }
          <button type="button" onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
            <Icon name="CircleStackIcon" className="w-4 h-4" />
            {IMPORT_COPY.btnOpen}
          </button>
          <button type="button" onClick={() => setNewRunOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Icon name="PlusIcon" className="w-4 h-4" />
            {ENGINE_COPY.newRunBtn}
          </button>
        </div>
      </div>

      {/* ── Master Payroll Preview (inline, shown after import) ──────── */}
      {masterPreview && (() => {
        const { rows, stats, warnings, year, month } = masterPreview
        const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        return (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="TableCellsIcon" className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    Master Payroll File
                    <span className="text-xs font-normal text-slate-400">
                      {MN[Number(month) - 1]} {year} &middot; {rows.length} employees
                    </span>
                  </h3>
                  {stats && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{IMPORT_COPY.statsLabel(stats)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" disabled={prevDlLoading} onClick={handlePreviewDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition">
                  {prevDlLoading
                    ? <><Spinner size={3} />{IMPORT_COPY.downloadingBtn}</>
                    : <><Icon name="ArrowDownTrayIcon" className="w-3.5 h-3.5" />{IMPORT_COPY.downloadBtn}</>}
                </button>
                <button type="button" onClick={() => setMasterPreview(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <Icon name="XMarkIcon" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Icon name="ExclamationTriangleIcon" className="w-4 h-4" />{IMPORT_COPY.warningTitle}
                </div>
                {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700 pl-5">{w}</p>)}
              </div>
            )}

            {/* Table */}
            <div className="overflow-auto max-h-[420px]">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    {IMPORT_MASTER_COLUMNS.map(col => (
                      <th key={col.key} className={`px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 ${col.numeric ? 'text-right' : ''}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.length === 0
                    ? <tr><td colSpan={IMPORT_MASTER_COLUMNS.length} className="px-4 py-10 text-center text-slate-400">{IMPORT_COPY.noFiles}</td></tr>
                    : rows.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                        {IMPORT_MASTER_COLUMNS.map(col => {
                          if (col.sources) return (
                            <td key={col.key} className="px-3 py-2">
                              <div className="flex flex-wrap gap-0.5">{(row.sources || []).map(s => (
                                <SourceBadge key={s} src={s} />
                              ))}</div>
                            </td>
                          )
                          const v   = row[col.key]
                          const num = col.numeric && v != null && v !== '' && v !== 'None'
                          return (
                            <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.numeric ? 'text-right font-mono' : ''} ${col.highlight ? 'font-semibold text-emerald-700' : col.key === 'employee_code' ? 'font-mono text-slate-500 text-[11px]' : 'text-slate-700'}`}>
                              {num ? fmtCurrency(v) : (v ?? '—')}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
              <span>{rows.length} employees &middot; {MN[Number(month) - 1]} {year}</span>
              <button type="button" onClick={() => setMasterPreview(null)}
                className="flex items-center gap-1 hover:text-slate-600 transition">
                <Icon name="XMarkIcon" className="w-3.5 h-3.5" /> Clear preview
              </button>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {actionMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm border ${
          actionMsg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>{actionMsg.text}</div>
      )}

      {/* Run control */}
      <RunControlPanel
        run={selRun} processing={processing}
        pendingCount={kpiData.pendingCount} approvedCount={kpiData.approvedCount}
        onProcess={handleProcess} onBulkApprove={handleBulkApprove} onBulkSend={handleBulkSend}
      />

      {!selRunId ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Icon name="CpuChipIcon" className="w-10 h-10 mx-auto text-slate-200" />
          <p className="text-slate-400 text-sm">{ENGINE_COPY.noRunSelected}</p>
        </div>
      ) : (
        <>
          {/* Subtab nav */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {ENGINE_SUBTABS.map(t => (
              <button key={t.id} type="button" onClick={() => setSubtab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  subtab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon name={t.icon} className="w-4 h-4" />
                {t.label}
                {t.id === 'slips' && slips.length > 0 && (
                  <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs">{slips.length}</span>
                )}
                {t.id === 'overview' && kpiData.anomalyCount > 0 && (
                  <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-xs">{kpiData.anomalyCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* â”€â”€ OVERVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {subtab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                <KpiTile icon="UsersIcon"               label={ENGINE_COPY.kpiEmployees} value={loading ? 'â€¦' : kpiData.totalEmployees}         sub={selRun ? `${MONTH_NAMES[(selRun.month ?? 1) - 1]} ${selRun.year}` : ''} tone="bg-blue-50 text-blue-700" />
                <KpiTile icon="BanknotesIcon"           label={ENGINE_COPY.kpiGross}     value={loading ? 'â€¦' : fmtCurrency(kpiData.grossPayroll)} sub="Total gross salary"   tone="bg-emerald-50 text-emerald-700" />
                <KpiTile icon="CurrencyDollarIcon"      label={ENGINE_COPY.kpiNet}       value={loading ? 'â€¦' : fmtCurrency(kpiData.netPayroll)}   sub="Take-home total"      tone="bg-teal-50 text-teal-700" />
                <KpiTile icon="ClockIcon"               label={ENGINE_COPY.kpiPending}   value={loading ? 'â€¦' : kpiData.pendingCount}              sub="Awaiting approval"    tone={kpiData.pendingCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'} />
                <KpiTile icon="ExclamationTriangleIcon" label={ENGINE_COPY.kpiAnomalies} value={loading ? 'â€¦' : kpiData.anomalyCount}              sub="AI-detected issues"   tone={kpiData.anomalyCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'} />
              </div>

              {loading && (
                <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-sm">
                  <Spinner /> Analysing payroll dataâ€¦
                </div>
              )}

              {!loading && <AnomalyPanel flags={anomalyFlags} />}

              {!loading && slips.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{ENGINE_COPY.deptChartTitle}</h3>
                    <DeptBarChart data={deptChartData} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{ENGINE_COPY.pieChartTitle}</h3>
                    <BreakdownPie allowances={pieData.allowances} deductions={pieData.deductions} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ SLIPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {subtab === 'slips' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTER_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}>
                      {s === 'all' ? 'All' : slipStatusMeta(s).label}
                    </button>
                  ))}
                </div>
                {departments.length > 2 && (
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    className="ml-auto px-2.5 py-1 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                    {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                  </select>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {filteredSlips.length > 0 && (
                  <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-400">
                    {filteredSlips.length} slip{filteredSlips.length !== 1 ? 's' : ''}
                    {statusFilter !== 'all' && ` Â· ${slipStatusMeta(statusFilter).label}`}
                    {deptFilter !== 'all' && ` Â· ${deptFilter}`}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Employee','Department','Basic','Allowances','Deductions','Net Salary','Attendance','Status','AI Flags'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading
                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                        : filteredSlips.length === 0
                          ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">
                                <Icon name="InboxIcon" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                {ENGINE_COPY.noSlipsFound}
                              </td>
                            </tr>
                          )
                          : filteredSlips.map(slip => {
                            const flags   = anomalyMap[slip.id] ?? []
                            const empCode = (slip.employee_code || slip.employee_salary_info?.employee_id || '').toString().toLowerCase().trim()
                            const bio     = attendance[empCode]
                            const bioP    = bio?.days_present ?? bio?.present_days
                            const attStr  = bioP != null ? `${slip.present_days ?? '?'} / ${bioP}` : `${slip.present_days ?? 'â€”'}`
                            return (
                              <tr key={slip.id} onClick={() => setDrawer(slip)} className="hover:bg-slate-50 cursor-pointer">
                                <td className="px-3 py-2.5">
                                  <div className="font-medium text-slate-800 whitespace-nowrap">{slip.employee_name || 'â€”'}</div>
                                  <div className="text-xs text-slate-400 font-mono">{slip.slip_number}</div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{slip.department || 'â€”'}</td>
                                <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{fmtCurrency(slip.basic_salary)}</td>
                                <td className="px-3 py-2.5 text-emerald-700 whitespace-nowrap">+{fmtCurrency(slip.total_allowances)}</td>
                                <td className="px-3 py-2.5 text-rose-700 whitespace-nowrap">âˆ’{fmtCurrency(slip.total_deductions)}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{fmtCurrency(slip.net_salary)}</td>
                                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap text-xs">{attStr}</td>
                                <td className="px-3 py-2.5"><StatusBadge status={slip.status} /></td>
                                <td className="px-3 py-2.5">
                                  {flags.length > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                                      <Icon name="ExclamationTriangleIcon" className="w-3 h-3" />
                                      {flags.length}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {subtab === 'analytics' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-48 gap-2 text-slate-400 text-sm"><Spinner /> Loadingâ€¦</div>
              ) : slips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                  <Icon name="PresentationChartLineIcon" className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  {ENGINE_COPY.noSlipsFound}
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">{ENGINE_COPY.deptChartTitle}</h3>
                    <p className="text-xs text-slate-400 mb-4">Net salary total by department for this run</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={deptChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => [fmtCurrency(v), 'Net Salary']} />
                        <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                          {deptChartData.map((_, idx) => (
                            <Cell key={idx} fill={ENGINE_DEPT_CHART_COLORS[idx % ENGINE_DEPT_CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {prevSlips.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-1">Month-over-Month Comparison</h3>
                      <p className="text-xs text-slate-400 mb-4">
                        {MONTH_NAMES[(selRun?.month ?? 1) - 1]} {selRun?.year} vs previous month
                      </p>
                      <MoMChart slips={slips} prevSlips={prevSlips} />
                    </div>
                  )}

                  {anomalyFlags.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Anomaly Summary</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(ENGINE_ANOMALY_SEVERITY).map(([rule, meta]) => {
                          const count = anomalyFlags.filter(f => f.rule === rule).length
                          const sev   = PAYROLL_ALERT_SEVERITY[meta.severity]
                          return (
                            <div key={rule} className={`rounded-xl p-3 border ${sev.tone}`}>
                              <div className="text-2xl font-bold">{count}</div>
                              <div className="text-xs mt-0.5 opacity-80">{meta.label}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">{ENGINE_COPY.pieChartTitle}</h3>
                      <BreakdownPie allowances={pieData.allowances} deductions={pieData.deductions} />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Payroll Totals</h3>
                      <div className="space-y-2 text-sm pt-2">
                        {[
                          ['Total Employees',  kpiData.totalEmployees,              ''],
                          ['Total Gross',      fmtCurrency(kpiData.grossPayroll),   'text-slate-700'],
                          ['Total Allowances', fmtCurrency(pieData.allowances),     'text-emerald-700'],
                          ['Total Deductions', fmtCurrency(pieData.deductions),     'text-rose-700'],
                          ['Total Net Salary', fmtCurrency(kpiData.netPayroll),     'text-blue-700 font-bold text-base'],
                        ].map(([l, v, cls]) => (
                          <div key={l} className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500">{l}</span>
                            <span className={cls}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Slip Drawer */}
      {drawer && (
        <SlipDrawer
          slip={drawer}
          biometricRow={
            attendance[
              (drawer.employee_code || drawer.employee_salary_info?.employee_id || '')
                .toString().toLowerCase().trim()
            ] ?? null
          }
          anomalies={anomalyMap[drawer.id] ?? []}
          onApprove={handleApprove}
          onReject={handleReject}
          onSend={handleSend}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* New Run Modal */}
      {newRunOpen && (
        <NewRunModal
          onClose={() => setNewRunOpen(false)}
          onCreated={handleNewRunCreated}
        />
      )}

      {/* Data Import Modal */}
      {importOpen && (
        <DataImportModal
          onClose={() => setImportOpen(false)}
          selRun={selRun}
          onGenerated={data => setMasterPreview(data)}
        />
      )}
    </div>
  )
}

