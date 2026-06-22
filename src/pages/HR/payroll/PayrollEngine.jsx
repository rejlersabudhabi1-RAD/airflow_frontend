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
  ENGINE_HR_OVERRIDE_STATUSES,
  IMPORT_HISTORY_COPY,
  IMPORT_STATUS_STYLES,
  AI_ANALYTICS_COPY,
  AI_ANALYTICS_SEVERITY_COLORS,
  AI_ANALYTICS_HEALTH_COLORS,
  AI_ANALYTICS_TREND_MAP,
  AI_ANALYTICS_URGENCY_COLORS,
  AI_ANALYTICS_DEPT_STATUS_COLORS,
  CROSS_TAB_COPY,
  WORKFLOW_STAGE_META,
  WORKFLOW_STAGE_ORDER,
  WORKFLOW_COPY,
  recomputeMasterRow,
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
    {Array.from({ length: 10 }).map((_, i) => (
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
  const [year,   setYear]   = useState(String(now.getFullYear()))
  const [month,  setMonth]  = useState(String(now.getMonth() + 1))

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
// ─── Slip Edit Modal ──────────────────────────────────────────────────────────
function SlipEditModal({ slip, onClose, onSaved }) {
  const [form, setForm] = useState({
    basic_salary:     String(slip.basic_salary      ?? ''),
    total_allowances: String(slip.total_allowances  ?? ''),
    gross_salary:     String(slip.gross_salary      ?? ''),
    total_deductions: String(slip.total_deductions  ?? ''),
    net_salary:       String(slip.net_salary        ?? ''),
    present_days:     String(slip.present_days      ?? ''),
    absent_days:      String(slip.absent_days       ?? ''),
    working_days:     String(slip.working_days      ?? ''),
    remarks:          slip.remarks ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const payload = {
        basic_salary:     parseFloat(form.basic_salary)     || 0,
        total_allowances: parseFloat(form.total_allowances) || 0,
        gross_salary:     parseFloat(form.gross_salary)     || 0,
        total_deductions: parseFloat(form.total_deductions) || 0,
        net_salary:       parseFloat(form.net_salary)       || 0,
        present_days:     parseInt(form.present_days,  10)  || 0,
        absent_days:      parseInt(form.absent_days,   10)  || 0,
        working_days:     parseInt(form.working_days,  10)  || 0,
        remarks:          form.remarks.trim(),
      }
      await payrollService.updateSalarySlip(slip.id, payload)
      onSaved(ENGINE_COPY.editSuccess)
    } catch (ex) {
      setErr(
        ex?.response?.data?.detail ||
        Object.values(ex?.response?.data ?? {})?.[0]?.[0] ||
        'Failed to save changes.'
      )
    } finally { setSaving(false) }
  }

  const numField = (label, key) => (
    <label key={key} className="block">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <input type="number" step="0.01" min="0" value={form[key]} onChange={set(key)}
        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
    </label>
  )
  const intField = (label, key) => (
    <label key={key} className="block">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <input type="number" step="1" min="0" value={form[key]} onChange={set(key)}
        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Icon name="PencilSquareIcon" className="w-5 h-5 text-blue-600" />
              {ENGINE_COPY.editModalTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{slip.employee_name} · {slip.slip_number}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5">
            <Icon name="XMarkIcon" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-3">
            {numField('Basic Salary (AED)', 'basic_salary')}
            {numField('Total Allowances (AED)', 'total_allowances')}
            {numField('Gross Salary (AED)', 'gross_salary')}
            {numField('Total Deductions (AED)', 'total_deductions')}
            {numField('Net Salary (AED)', 'net_salary')}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {intField('Working Days', 'working_days')}
            {intField('Present Days', 'present_days')}
            {intField('Absent Days', 'absent_days')}
          </div>
          <label className="block">
            <span className="text-xs text-slate-500 font-medium">Remarks</span>
            <textarea value={form.remarks} onChange={set('remarks')} rows={2}
              placeholder="Optional remarks..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </label>
          {err && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition">
              {saving ? <Spinner size={3} /> : <Icon name="CheckIcon" className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Slip Delete Confirm Modal ─────────────────────────────────────────────────
function SlipDeleteModal({ slip, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [err,      setErr]      = useState('')
  const isProtected = ['approved', 'sent'].includes(slip.status)

  const handleDelete = async () => {
    setDeleting(true); setErr('')
    try {
      await payrollService.deleteSalarySlip(slip.id)
      onDeleted(slip.id)
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to delete salary slip.')
    } finally { setDeleting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2.5 rounded-xl bg-rose-100">
            <Icon name="TrashIcon" className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{ENGINE_COPY.deleteConfirmTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{slip.employee_name} · {slip.slip_number}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">{ENGINE_COPY.deleteConfirmMsg}</p>
        {isProtected && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <Icon name="ExclamationTriangleIcon" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This slip is <strong>{slip.status}</strong>. Deleting it may affect payroll records and audit trails.
            </p>
          </div>
        )}
        {err && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
            Cancel
          </button>
          <button type="button" disabled={deleting} onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg transition">
            {deleting ? <Spinner size={3} /> : <Icon name="TrashIcon" className="w-4 h-4" />}
            Delete Slip
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Slip HR Override Modal ────────────────────────────────────────────────────
function SlipHRModal({ slip, onClose, onSaved }) {
  const [newStatus, setNewStatus] = useState(slip.status)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!notes.trim()) { setErr(ENGINE_COPY.hrNoteRequired); return }
    setSaving(true); setErr('')
    try {
      await payrollService.updateSalarySlip(slip.id, {
        status:         newStatus,
        internal_notes: notes.trim(),
      })
      onSaved(ENGINE_COPY.hrOverrideSuccess)
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to apply HR override.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon name="AdjustmentsHorizontalIcon" className="w-5 h-5 text-amber-600" />
            {ENGINE_COPY.hrOverrideTitle}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <Icon name="XMarkIcon" className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Employee</span>
            <span className="font-medium text-slate-800">{slip.employee_name}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-400">Current Status</span>
            <StatusBadge status={slip.status} />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-slate-500 font-medium">New Status</span>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {ENGINE_HR_OVERRIDE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 font-medium">{ENGINE_COPY.hrNoteLabel}</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder={ENGINE_COPY.hrNoteRequired}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </label>
          {err && <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition">
              {saving ? <Spinner size={3} /> : <Icon name="AdjustmentsHorizontalIcon" className="w-4 h-4" />}
              Apply Override
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_FILTER_OPTIONS = ['all', 'draft', 'generated', 'pending_approval', 'approved', 'rejected', 'sent']

export default function PayrollEngine({ activeRunId, onSelectRun, onSwitchTab }) {
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
  const [previewEditMode, setPreviewEditMode] = useState(false)
  const [editableRows,    setEditableRows]    = useState([])
  const [runsLoading,  setRunsLoading] = useState(true)
  const [editModal,    setEditModal]   = useState(null)  // slip object | null
  const [deleteModal,  setDeleteModal] = useState(null)  // slip object | null
  const [hrModal,      setHrModal]     = useState(null)  // slip object | null
  const [importHistory,   setImportHistory]   = useState([])
  const [historyLoading,  setHistoryLoading]  = useState(true)
  const [historyDeleting, setHistoryDeleting] = useState(null) // importId being deleted
  const [runDeleting,     setRunDeleting]     = useState(false)

  // AI Analytics state
  const [aiAnalytics,        setAiAnalytics]        = useState(null)   // response from GPT-4o
  const [aiAnalyticsLoading, setAiAnalyticsLoading] = useState(false)
  const [aiAnalyticsError,   setAiAnalyticsError]   = useState(null)
  const [aiGeneratedAt,      setAiGeneratedAt]      = useState(null)

  // Master Payroll Workflow state
  const [workflowInfo,     setWorkflowInfo]     = useState(null)  // workflow status + log
  const [workflowLoading,  setWorkflowLoading]  = useState(false)
  const [workflowAction,   setWorkflowAction]   = useState(null)  // pending action modal
  const [workflowNote,     setWorkflowNote]     = useState('')     // note for the modal

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
    // Reset AI analytics when run changes so stale results are not shown
    setAiAnalytics(null); setAiAnalyticsError(null); setAiGeneratedAt(null)

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
      prevMap[(s.employee_code || s.employee_id || '').toString().toLowerCase().trim()] = s
    })
    slips.forEach(slip => {
      const code = (slip.employee_code || slip.employee_id || '').toString().toLowerCase().trim()

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
    // slips with no matching biometric row (only meaningful when attendance data loaded)
    unmatchedBiometric: Object.keys(attendance).length > 0
      ? slips.filter(s => {
          const code = (s.employee_code || s.employee_id || '').toString().toLowerCase().trim()
          return code && !attendance[code]
        }).length
      : 0,
  }), [slips, anomalyMap, attendance])

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

  // Called by edit/HR modals on successful save
  const handleSlipSaved = useCallback((msg) => {
    toast(msg)
    reloadSlips()
  }, [toast, reloadSlips])

  // Called by delete modal on successful delete
  const handleSlipDeleted = useCallback((slipId) => {
    toast(ENGINE_COPY.deleteSuccess)
    reloadSlips()
    setDrawer(d => (d?.id === slipId ? null : d))
  }, [toast, reloadSlips])

  const handleNewRunCreated = useCallback((run) => {
    setRuns(prev => [run, ...prev]); setSelRunId(run.id)
    setNewRunOpen(false); toast(`Run ${run.run_code} created. Click "Run Engine" to generate slips.`)
  }, [toast])

  // ── Import History ────────────────────────────────────────────────────────
  const reloadHistory = useCallback(() => {
    setHistoryLoading(true)
    payrollService.getMasterPayrollHistory({ page_size: 50 })
      .then(r => setImportHistory(r?.results ?? []))
      .catch(() => setImportHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => { reloadHistory() }, [reloadHistory])

  const handleHistoryRestore = useCallback(async (item) => {
    try {
      const res = await payrollService.getMasterPayrollRows(item.id)
      setMasterPreview({
        rows:     res.rows     ?? [],
        stats:    res.stats    ?? {},
        warnings: res.warnings ?? [],
        year:     String(res.year),
        month:    String(res.month),
        importId: item.id,
      })
      toast(IMPORT_HISTORY_COPY.restoreSuccess)
    } catch (e) {
      toast(e?.response?.data?.error || IMPORT_HISTORY_COPY.restoreFailed, false)
    }
  }, [toast])

  const handleHistoryDelete = useCallback(async (importId) => {
    if (!window.confirm(IMPORT_HISTORY_COPY.deleteConfirmMsg)) return
    setHistoryDeleting(importId)
    try {
      await payrollService.deleteMasterPayroll(importId)
      toast(IMPORT_HISTORY_COPY.deleteSuccess)
      setImportHistory(prev => prev.filter(h => h.id !== importId))
      // Clear active preview if it belongs to the deleted import
      setMasterPreview(prev => (prev?.importId === importId ? null : prev))
    } catch (e) {
      toast(e?.response?.data?.error || IMPORT_HISTORY_COPY.deleteFailed, false)
    } finally { setHistoryDeleting(null) }
  }, [toast])

  const [historyDownloading, setHistoryDownloading] = useState(null) // importId being downloaded

  const handleHistoryDownload = useCallback(async (item) => {
    setHistoryDownloading(item.id)
    try {
      const res  = await payrollService.getMasterPayrollRows(item.id)
      const blob = await payrollService.exportRowsToExcel(String(item.year), String(item.month), res.rows ?? [])
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `master_payroll_${item.year}_${String(item.month).padStart(2, '0')}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast(e?.response?.data?.error || IMPORT_HISTORY_COPY.downloadFailed, false)
    } finally { setHistoryDownloading(null) }
  }, [toast])

  const handleRunDelete = useCallback(async () => {
    if (!selRun) return
    if (selRun.status !== 'draft') {
      toast(`${ENGINE_COPY.deleteRunProtected} "${runStatusMeta(selRun.status).label}". Only draft runs can be deleted.`, false)
      return
    }
    if (!window.confirm(ENGINE_COPY.deleteRunMsg)) return
    setRunDeleting(true)
    try {
      await payrollService.deletePayrollRun(selRunId)
      toast(ENGINE_COPY.deleteRunSuccess)
      setRuns(prev => prev.filter(r => r.id !== selRunId))
      setSelRunId('')
      setSlips([])
    } catch (e) {
      toast(e?.response?.data?.error || ENGINE_COPY.deleteRunFailed, false)
    } finally { setRunDeleting(false) }
  }, [selRun, selRunId, toast])

  // Generate GPT-4o HR intelligence report for the selected payroll run
  const handleGenerateAIAnalytics = useCallback(async () => {
    if (!selRunId) return
    setAiAnalyticsLoading(true)
    setAiAnalyticsError(null)
    try {
      const data = await payrollService.generateAIAnalytics(selRunId)
      setAiAnalytics(data)
      setAiGeneratedAt(new Date())
    } catch (e) {
      const msg = e?.response?.data?.error || 'AI analysis failed. Please try again.'
      setAiAnalyticsError(msg)
    } finally {
      setAiAnalyticsLoading(false)
    }
  }, [selRunId])

  // ── Workflow helpers ─────────────────────────────────────────────────────
  const loadWorkflow = useCallback(async (importId) => {
    if (!importId) return
    try {
      const data = await payrollService.getMasterPayrollWorkflow(importId)
      setWorkflowInfo(data)
    } catch { /* non-blocking — workflow panel will stay null */ }
  }, [])

  const handleWorkflowAction = useCallback(async (action, importId, note) => {
    const actionMap = {
      freeze:          payrollService.freezeMasterPayroll,
      unfreeze:        payrollService.unfreezeMasterPayroll,
      hr_approve:      payrollService.hrApproveMasterPayroll,
      finance_review:  payrollService.financeReviewMasterPayroll,
      finance_approve: payrollService.financeApproveMasterPayroll,
      release:         payrollService.releaseMasterPayroll,
    }
    const successMap = {
      freeze:          WORKFLOW_COPY.freezeSuccess,
      unfreeze:        WORKFLOW_COPY.unfreezeSuccess,
      hr_approve:      WORKFLOW_COPY.hrApproveSuccess,
      finance_review:  WORKFLOW_COPY.financeReviewSuccess,
      finance_approve: WORKFLOW_COPY.financeApproveSuccess,
      release:         WORKFLOW_COPY.releaseSuccess,
    }
    const fn = actionMap[action]
    if (!fn) return
    setWorkflowLoading(true)
    try {
      await fn(importId, note || '')
      toast(successMap[action] || 'Done.')
      await loadWorkflow(importId)
      // Refresh the import history row so stage badge updates
      reloadHistory?.()
      // Re-fetch master preview rows to sync is_editable_by_hr
      if (masterPreview?.importId === importId) {
        setMasterPreview(prev => prev
          ? { ...prev, workflow_stage: workflowInfo?.stage }
          : prev
        )
      }
    } catch (e) {
      toast(e?.response?.data?.error || WORKFLOW_COPY.actionFailed, false)
    } finally {
      setWorkflowLoading(false)
    }
  }, [loadWorkflow, reloadHistory, masterPreview, workflowInfo])

  // Load workflow when master preview changes
  useEffect(() => {
    if (masterPreview?.importId) {
      loadWorkflow(masterPreview.importId)
    } else {
      setWorkflowInfo(null)
    }
  }, [masterPreview?.importId, loadWorkflow])

  // Sync editable rows whenever a new master preview is generated.
  // Run recomputeMasterRow on each row so totals are correct even when
  // the backend sent stale computed values.
  useEffect(() => {
    if (masterPreview?.rows) {
      setEditableRows(masterPreview.rows.map(r => recomputeMasterRow({ ...r })))
      setPreviewEditMode(false)
    }
  }, [masterPreview])

  const handleEditCell = useCallback((rowIdx, key, value) => {
    setEditableRows(prev => prev.map((r, i) =>
      i === rowIdx ? recomputeMasterRow({ ...r, [key]: value }) : r
    ))
  }, [])

  const handleResetRows = useCallback(() => {
    if (masterPreview?.rows) {
      setEditableRows(masterPreview.rows.map(r => recomputeMasterRow({ ...r })))
    }
  }, [masterPreview])

  const handlePreviewDownload = useCallback(async () => {
    if (!masterPreview) return
    const { year, month } = masterPreview
    setPrevDlLoading(true)
    try {
      const blob = await payrollService.exportRowsToExcel(year, month, editableRows)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `master_payroll_${year}_${String(month).padStart(2, '0')}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast(e?.response?.data?.error || IMPORT_COPY.errorGeneric, false)
    } finally { setPrevDlLoading(false) }
  }, [masterPreview, editableRows, toast])

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
          {selRunId && selRun && (
            <>
              <button
                type="button"
                onClick={() => onSwitchTab?.('auditor')}
                title={CROSS_TAB_COPY.auditRunTitle}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition">
                <Icon name="MagnifyingGlassCircleIcon" className="w-4 h-4" />
                {CROSS_TAB_COPY.auditRunBtn}
              </button>
              <button
                type="button"
                disabled={runDeleting}
                onClick={handleRunDelete}
                title={ENGINE_COPY.deleteRunTitle}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded-lg border border-rose-200 disabled:opacity-40 transition">
                {runDeleting ? <Spinner size={3} /> : <Icon name="TrashIcon" className="w-4 h-4" />}
                {ENGINE_COPY.deleteRunBtn}
              </button>
            </>
          )}
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
        const { stats, warnings, year, month } = masterPreview
        const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        const isDirty = editableRows !== masterPreview.rows

        // ── Workflow helpers for this panel ─────────────────────────────
        const stage       = workflowInfo?.stage ?? masterPreview?.workflow_stage ?? 'draft'
        const stageMeta   = WORKFLOW_STAGE_META[stage] ?? WORKFLOW_STAGE_META.draft
        const stageIdx    = WORKFLOW_STAGE_ORDER.indexOf(stage)
        const canEditRows = stage === 'draft'
        const importId    = masterPreview.importId
        const wfLog       = workflowInfo?.log ?? []

        // Action button helper — returns props or null if not applicable
        const wfBtnProps = (action, reqStage, label, btnCls, titleKey) => {
          if (stage !== reqStage) return null
          return {
            action, label,
            title:   WORKFLOW_COPY[titleKey] ?? label,
            className: `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${btnCls}`,
          }
        }

        return (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">

            {/* ── Workflow Banner ─────────────────────────────────────── */}
            <div className={`px-5 py-3 border-b ${stageMeta.bg} ${stageMeta.border}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Left: stage pill + progress steps */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${stageMeta.bg} ${stageMeta.color} border ${stageMeta.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dot}`} />
                    {stageMeta.label}
                    <span className="font-normal opacity-75">— {stageMeta.subtitle}</span>
                  </span>
                  {/* Mini progress bar */}
                  <div className="hidden sm:flex items-center gap-0.5">
                    {WORKFLOW_STAGE_ORDER.map((s, i) => (
                      <div key={s} className="flex items-center gap-0.5">
                        <div title={WORKFLOW_STAGE_META[s]?.label}
                          className={`w-5 h-1.5 rounded-full transition-all ${i <= stageIdx ? stageMeta.dot : 'bg-slate-200'}`} />
                        {i < WORKFLOW_STAGE_ORDER.length - 1 && (
                          <div className={`w-2 h-px ${i < stageIdx ? stageMeta.dot : 'bg-slate-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Freeze */}
                  {stage === 'draft' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.freezeTitle}
                      onClick={() => { setWorkflowAction({ action: 'freeze', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40">
                      <Icon name="LockClosedIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.freezeBtn}
                    </button>
                  )}
                  {/* HR Approve */}
                  {stage === 'frozen' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.hrApproveTitle}
                      onClick={() => { setWorkflowAction({ action: 'hr_approve', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40">
                      <Icon name="CheckBadgeIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.hrApproveBtn}
                    </button>
                  )}
                  {/* Finance Review */}
                  {stage === 'hr_approved' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.financeReviewTitle}
                      onClick={() => { setWorkflowAction({ action: 'finance_review', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40">
                      <Icon name="ClipboardDocumentCheckIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.financeReviewBtn}
                    </button>
                  )}
                  {/* Finance Approve */}
                  {stage === 'finance_review' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.financeApproveTitle}
                      onClick={() => { setWorkflowAction({ action: 'finance_approve', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40">
                      <Icon name="CurrencyDollarIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.financeApproveBtn}
                    </button>
                  )}
                  {/* Accounts Release */}
                  {stage === 'finance_approved' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.releaseTitle}
                      onClick={() => { setWorkflowAction({ action: 'release', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-green-600 hover:bg-green-700 text-white disabled:opacity-40">
                      <Icon name="BanknotesIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.releaseBtn}
                    </button>
                  )}
                  {/* Superadmin Unfreeze (all non-draft stages) */}
                  {stage !== 'draft' && stage !== 'released' && (
                    <button type="button"
                      disabled={workflowLoading}
                      title={WORKFLOW_COPY.unfreezeTitle}
                      onClick={() => { setWorkflowAction({ action: 'unfreeze', importId }); setWorkflowNote('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 disabled:opacity-40">
                      <Icon name="LockOpenIcon" className="w-3.5 h-3.5" />
                      {WORKFLOW_COPY.unfreezeBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* Locked warning */}
              {!canEditRows && stage !== 'released' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <Icon name="ExclamationTriangleIcon" className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {WORKFLOW_COPY.lockedMsg}
                  <span className="text-slate-400">{WORKFLOW_COPY.lockedSubtitle}</span>
                </div>
              )}

              {/* Workflow audit log accordion */}
              {wfLog.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700">
                    {WORKFLOW_COPY.logTitle} ({wfLog.length})
                  </summary>
                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                    {wfLog.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${WORKFLOW_STAGE_META[entry.to_stage]?.dot ?? 'bg-slate-400'}`} />
                        <span className="font-medium">{entry.action?.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400">{WORKFLOW_COPY.logByLabel}</span>
                        <span className="font-medium">{entry.by}</span>
                        <span className="text-slate-400 ml-auto whitespace-nowrap">
                          {entry.at ? new Date(entry.at).toLocaleString() : ''}
                        </span>
                        {entry.note && <span className="italic text-slate-400">— {entry.note}</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            {/* END Workflow Banner */}

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="TableCellsIcon" className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    Master Payroll File
                    <span className="text-xs font-normal text-slate-400">
                      {MN[Number(month) - 1]} {year} &middot; {editableRows.length} employees
                    </span>
                    {isDirty && previewEditMode && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full">{IMPORT_COPY.editDirtyBadge}</span>
                    )}
                  </h3>
                  {stats && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{IMPORT_COPY.statsLabel(stats)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Edit / Done / Reset buttons — hidden when file is locked */}
                {canEditRows && !previewEditMode ? (
                  <button type="button" onClick={() => setPreviewEditMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition">
                    <Icon name="PencilSquareIcon" className="w-3.5 h-3.5" />{IMPORT_COPY.editToggleBtn}
                  </button>
                ) : canEditRows ? (
                  <>
                    <button type="button" onClick={handleResetRows}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition">
                      <Icon name="ArrowPathIcon" className="w-3.5 h-3.5" />{IMPORT_COPY.editResetBtn}
                    </button>
                    <button type="button" onClick={() => setPreviewEditMode(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
                      <Icon name="CheckIcon" className="w-3.5 h-3.5" />{IMPORT_COPY.editDoneBtn}
                    </button>
                  </>
                ) : null}
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

            {/* Edit mode banner */}
            {previewEditMode && (
              <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
                <Icon name="PencilSquareIcon" className="w-3.5 h-3.5 shrink-0" />
                <span>{IMPORT_COPY.editModeLabel} — click any cell to modify. Changes are reflected in the downloaded Excel.</span>
              </div>
            )}

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
                      <th key={col.key} className={`px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 ${col.numeric ? 'text-right' : ''} ${col.computed ? 'bg-emerald-50/60' : ''}`}>
                        {col.label}
                        {col.computed && <span className="ml-1 text-[9px] font-normal text-emerald-600 opacity-70">=</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {editableRows.length === 0
                    ? <tr><td colSpan={IMPORT_MASTER_COLUMNS.length} className="px-4 py-10 text-center text-slate-400">{IMPORT_COPY.noFiles}</td></tr>
                    : editableRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-blue-50/40 transition-colors">
                        {IMPORT_MASTER_COLUMNS.map(col => {
                          if (col.sources) return (
                            <td key={col.key} className="px-3 py-2">
                              <div className="flex flex-wrap gap-0.5">{(row.sources || []).map(s => (
                                <SourceBadge key={s} src={s} />
                              ))}</div>
                            </td>
                          )
                          const v   = row[col.key]
                          // Computed (auto-calculated) field — show in edit mode with a teal bg to
                          // distinguish from user-input cells; shows formula result, not an input
                          if (previewEditMode && col.computed) {
                            const num = col.numeric && v != null && v !== '' && v !== 'None'
                            return (
                              <td key={col.key} className={`px-3 py-2 whitespace-nowrap text-right font-mono ${col.highlight ? 'font-semibold text-emerald-700 bg-emerald-50/70' : 'text-slate-600 bg-teal-50/40'}`}>
                                <span title="Auto-calculated">{num ? fmtCurrency(v) : (v ?? '—')}</span>
                              </td>
                            )
                          }
                          // Editable input in edit mode
                          if (previewEditMode && col.editable !== false) {
                            return (
                              <td key={col.key} className={`px-1.5 py-1 ${col.highlight ? 'bg-emerald-50/60' : ''}`}>
                                <input
                                  type={col.numeric ? 'number' : 'text'}
                                  step={col.numeric ? '0.01' : undefined}
                                  value={v ?? ''}
                                  onChange={e => handleEditCell(rowIdx, col.key, e.target.value)}
                                  className={`w-full min-w-[72px] px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white ${col.numeric ? 'text-right font-mono' : ''} ${col.highlight ? 'text-emerald-700 font-semibold border-emerald-400 focus:ring-emerald-500' : ''}`}
                                />
                              </td>
                            )
                          }
                          // Read-only cell
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
                {/* Totals footer row — aggregates all numeric columns */}
                {editableRows.length > 0 && (() => {
                  const SUMMABLE = ['basic_salary','transport_allowance','housing_allowance',
                                    'other_allowances','other_pay','total_allowances',
                                    'total_deductions','employee_salary','final_salary']
                  const totals = editableRows.reduce((acc, r) => {
                    SUMMABLE.forEach(k => { acc[k] = (acc[k] || 0) + (parseFloat(r[k]) || 0) })
                    return acc
                  }, {})
                  return (
                    <tfoot className="sticky bottom-0 bg-slate-100 border-t-2 border-slate-300 z-10">
                      <tr>
                        {IMPORT_MASTER_COLUMNS.map(col => {
                          const isTotal = SUMMABLE.includes(col.key)
                          return (
                            <td key={col.key}
                              className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-t border-slate-200 ${col.numeric ? 'text-right font-mono' : ''} ${col.highlight ? 'text-emerald-700' : 'text-slate-700'} ${col.computed ? 'bg-emerald-50/50' : ''}`}>
                              {col.key === 'employee_name'
                                ? <span className="text-slate-500 font-normal">{editableRows.length} employees</span>
                                : isTotal ? fmtCurrency(totals[col.key] ?? 0) : ''}
                            </td>
                          )
                        })}
                      </tr>
                    </tfoot>
                  )
                })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
              <span>{editableRows.length} employees &middot; {MN[Number(month) - 1]} {year}</span>
              <button type="button" onClick={() => setMasterPreview(null)}
                className="flex items-center gap-1 hover:text-slate-600 transition">
                <Icon name="XMarkIcon" className="w-3.5 h-3.5" /> Clear preview
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Import History Panel ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Icon name="ClockIcon" className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">{IMPORT_HISTORY_COPY.title}</h3>
            {importHistory.length > 0 && (
              <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-medium">{importHistory.length}</span>
            )}
          </div>
          <button type="button" onClick={reloadHistory} title={IMPORT_HISTORY_COPY.refreshBtn}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <Icon name="ArrowPathIcon" className="w-3.5 h-3.5" />
          </button>
        </div>

        {historyLoading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Spinner size={3} />{IMPORT_HISTORY_COPY.loadingMsg}
          </div>
        ) : importHistory.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            <Icon name="CircleStackIcon" className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {IMPORT_HISTORY_COPY.empty}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                <tr>
                  {['Period', 'Generated', 'By', 'Employees', 'S3 Status', 'Workflow', ''].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${h === 'Employees' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {importHistory.map(item => {
                  const MN2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                  const s   = IMPORT_STATUS_STYLES[item.status] ?? IMPORT_STATUS_STYLES.ready
                  const isDel = historyDeleting === item.id
                  const isActive = masterPreview?.importId === item.id
                  const wStage = item.workflow_stage ?? 'draft'
                  const wMeta  = WORKFLOW_STAGE_META[wStage] ?? WORKFLOW_STAGE_META.draft
                  return (
                    <tr key={item.id} className={`transition-colors ${isActive ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{MN2[Number(item.month) - 1]} {item.year}</span>
                        {isActive && <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 font-semibold">Active</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(item.generated_at).toLocaleDateString()}{' '}
                        {new Date(item.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{item.generated_by ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700">{item.total_rows}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>
                      </td>
                      {/* Workflow Stage badge */}
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${wMeta.bg} ${wMeta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${wMeta.dot}`} />
                          {wMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" disabled={historyDownloading === item.id} onClick={() => handleHistoryDownload(item)}
                            title={IMPORT_HISTORY_COPY.downloadBtn}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 disabled:opacity-40 transition">
                            {historyDownloading === item.id ? <Spinner size={3} /> : <Icon name="ArrowDownTrayIcon" className="w-3 h-3" />}
                            {IMPORT_HISTORY_COPY.downloadBtn}
                          </button>
                          <button type="button" onClick={() => handleHistoryRestore(item)}
                            title={IMPORT_HISTORY_COPY.restoreBtn}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 transition">
                            <Icon name="ArrowUpTrayIcon" className="w-3 h-3" />{IMPORT_HISTORY_COPY.restoreBtn}
                          </button>
                          <button type="button" disabled={isDel} onClick={() => handleHistoryDelete(item.id)}
                            title={IMPORT_HISTORY_COPY.deleteBtn}
                            className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-lg border border-rose-200 disabled:opacity-40 transition">
                            {isDel ? <Spinner size={3} /> : <Icon name="TrashIcon" className="w-3 h-3" />}
                            {IMPORT_HISTORY_COPY.deleteBtn}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

              {/* Biometric unmatched notice — only show when attendance data is available */}
              {!loading && kpiData.unmatchedBiometric > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <HeroIcons.ExclamationCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">{kpiData.unmatchedBiometric}</strong> slip{kpiData.unmatchedBiometric !== 1 ? 's' : ''} had no biometric match — attendance data may be incomplete for those employees.
                  </span>
                </div>
              )}

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
                        {['Employee','Department','Basic','Allowances','Deductions','Net Salary','Attendance','Status','AI Flags','Actions'].map(h => (
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
                              <td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                                <Icon name="InboxIcon" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                {ENGINE_COPY.noSlipsFound}
                              </td>
                            </tr>
                          )
                          : filteredSlips.map(slip => {
                            const flags   = anomalyMap[slip.id] ?? []
                            const empCode = (slip.employee_code || slip.employee_id || '').toString().toLowerCase().trim()
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
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" title={ENGINE_COPY.editBtn}
                                      onClick={() => setEditModal(slip)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                                      <Icon name="PencilSquareIcon" className="w-4 h-4" />
                                    </button>
                                    <button type="button" title={ENGINE_COPY.hrOverrideBtn}
                                      onClick={() => setHrModal(slip)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition">
                                      <Icon name="AdjustmentsHorizontalIcon" className="w-4 h-4" />
                                    </button>
                                    <button type="button" title={ENGINE_COPY.deleteBtn}
                                      onClick={() => setDeleteModal(slip)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                                      <Icon name="TrashIcon" className="w-4 h-4" />
                                    </button>
                                  </div>
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

          {/* AI ANALYTICS */}
          {subtab === 'analytics' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-48 gap-2 text-slate-400 text-sm"><Spinner /> Loading…</div>
              ) : slips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                  <Icon name="PresentationChartLineIcon" className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  {ENGINE_COPY.noSlipsFound}
                </div>
              ) : (
                <>
                  {/* AI Intelligence Panel */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-1 shadow-lg">
                    <div className="rounded-xl bg-white/[0.03] backdrop-blur-sm p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon name="SparklesIcon" className="w-5 h-5 text-indigo-300" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white">{AI_ANALYTICS_COPY.panelTitle}</h3>
                            <p className="text-xs text-indigo-300">{AI_ANALYTICS_COPY.panelSubtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {aiGeneratedAt && (
                            <span className="text-xs text-slate-400">
                              {AI_ANALYTICS_COPY.lastGeneratedLabel} {aiGeneratedAt.toLocaleTimeString()}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={aiAnalyticsLoading}
                            onClick={handleGenerateAIAnalytics}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white transition-colors shadow-md"
                          >
                            {aiAnalyticsLoading ? (
                              <><Spinner /> {AI_ANALYTICS_COPY.loadingMsg}</>
                            ) : aiAnalytics ? (
                              <><Icon name="ArrowPathIcon" className="w-3.5 h-3.5" /> {AI_ANALYTICS_COPY.regenerateBtn}</>
                            ) : (
                              <><Icon name="SparklesIcon" className="w-3.5 h-3.5" /> {AI_ANALYTICS_COPY.generateBtn}</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Loading state */}
                      {aiAnalyticsLoading && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center">
                          <div className="inline-flex items-center gap-3 text-indigo-200 text-sm">
                            <Spinner />
                            <div>
                              <div className="font-medium">{AI_ANALYTICS_COPY.loadingMsg}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{AI_ANALYTICS_COPY.loadingSubtitle}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error state */}
                      {!aiAnalyticsLoading && aiAnalyticsError && (
                        <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4 flex items-start gap-3">
                          <Icon name="ExclamationCircleIcon" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-red-300 font-medium">Analysis Failed</p>
                            <p className="text-xs text-red-400 mt-0.5">{aiAnalyticsError}</p>
                          </div>
                          <button type="button" onClick={handleGenerateAIAnalytics}
                            className="text-xs text-red-300 hover:text-white border border-red-500/40 rounded-lg px-3 py-1.5">
                            {AI_ANALYTICS_COPY.errorRetry}
                          </button>
                        </div>
                      )}

                      {/* Idle prompt */}
                      {!aiAnalyticsLoading && !aiAnalyticsError && !aiAnalytics && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
                          <Icon name="SparklesIcon" className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-300">Click <strong className="text-indigo-300">Generate AI Report</strong> for a deep-dive intelligence analysis of this payroll run.</p>
                          <p className="text-xs text-slate-500 mt-1">Powered by GPT-4o · Anonymized data · Actionable insights</p>
                        </div>
                      )}

                      {/* Results */}
                      {!aiAnalyticsLoading && aiAnalytics?.ai && (() => {
                        const ai = aiAnalytics.ai
                        const scoreNum = ai.health_score ?? 0
                        const healthMeta = AI_ANALYTICS_HEALTH_COLORS.find(h => scoreNum >= h.min) ?? AI_ANALYTICS_HEALTH_COLORS[AI_ANALYTICS_HEALTH_COLORS.length - 1]
                        const circumference = 2 * Math.PI * 36
                        const dashOffset = circumference - (scoreNum / 100) * circumference
                        return (
                          <div className="space-y-4">
                            {/* Health Score + Executive Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className={`rounded-xl ${healthMeta.bg} border border-white/10 p-5 flex flex-col items-center justify-center gap-2`}>
                                <p className="text-xs font-medium text-slate-500">{AI_ANALYTICS_COPY.healthLabel}</p>
                                <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                                  <circle cx="40" cy="40" r="36" fill="none" strokeWidth="8" stroke="currentColor" className="text-slate-200" />
                                  <circle cx="40" cy="40" r="36" fill="none" strokeWidth="8" strokeLinecap="round"
                                    className={healthMeta.ring}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                  />
                                </svg>
                                <div className="text-center -mt-3">
                                  <span className={`text-3xl font-bold ${healthMeta.text}`}>{scoreNum}</span>
                                  <span className={`text-xs ml-1 ${healthMeta.text}`}>/100</span>
                                  <p className={`text-xs font-semibold mt-0.5 ${healthMeta.text}`}>{ai.health_label}</p>
                                </div>
                              </div>
                              <div className="sm:col-span-2 rounded-xl bg-white/5 border border-white/10 p-5">
                                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-2">{AI_ANALYTICS_COPY.execSummaryTitle}</h4>
                                <p className="text-sm text-slate-200 leading-relaxed">{ai.executive_summary}</p>
                                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-slate-400">
                                  <span><span className="font-medium text-slate-300">{aiAnalytics.summary?.total_employees}</span> employees</span>
                                  <span><span className="font-medium text-slate-300">{aiAnalytics.period}</span></span>
                                  <span><span className="font-medium text-slate-300">{aiAnalytics.run_code}</span></span>
                                </div>
                              </div>
                            </div>

                            {/* Forecast + Compliance */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {ai.forecast && (() => {
                                const trendMeta = AI_ANALYTICS_TREND_MAP[ai.forecast.trend] ?? AI_ANALYTICS_TREND_MAP['Stable']
                                return (
                                  <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                                    <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">{AI_ANALYTICS_COPY.forecastTitle}</h4>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="text-2xl font-bold text-white">{fmtCurrency(ai.forecast.next_month_estimate)}</div>
                                      <div className={`flex items-center gap-1 text-xs font-medium ${trendMeta.color}`}>
                                        <Icon name={trendMeta.icon} className="w-4 h-4" />
                                        {trendMeta.label}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-400">{ai.forecast.rationale}</p>
                                    <div className="mt-2 text-xs text-slate-500">Confidence: <span className="text-slate-300 font-medium">{ai.forecast.confidence}</span></div>
                                  </div>
                                )
                              })()}
                              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">{AI_ANALYTICS_COPY.complianceTitle}</h4>
                                {(!ai.compliance_flags || ai.compliance_flags.length === 0) ? (
                                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                                    <Icon name="CheckCircleIcon" className="w-4 h-4" /> {AI_ANALYTICS_COPY.noCompliance}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {ai.compliance_flags.map((flag, i) => (
                                      <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${AI_ANALYTICS_URGENCY_COLORS[flag.urgency] ?? AI_ANALYTICS_URGENCY_COLORS['Monitor']}`}>
                                        <Icon name="ExclamationTriangleIcon" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        <div><span className="font-semibold">{flag.type}: </span>{flag.description} <span className="opacity-60">({flag.urgency})</span></div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Risk Items */}
                            {ai.risk_items && ai.risk_items.length > 0 && (
                              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">{AI_ANALYTICS_COPY.riskTitle}</h4>
                                <div className="space-y-2">
                                  {[...ai.risk_items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).map((risk, i) => {
                                    const colors = AI_ANALYTICS_SEVERITY_COLORS[risk.severity] ?? AI_ANALYTICS_SEVERITY_COLORS['low']
                                    return (
                                      <div key={i} className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} flex-shrink-0 capitalize`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} inline-block`} />
                                            {risk.severity}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className={`text-sm font-semibold ${colors.text}`}>{risk.issue}</span>
                                              {risk.emp_code && <span className="text-xs text-slate-500 bg-white/60 rounded px-1.5 py-0.5">{risk.emp_code}</span>}
                                              <span className="text-xs text-slate-400 capitalize">{risk.category}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1">{risk.root_cause}</p>
                                            <div className="flex items-start gap-1 mt-2 text-xs text-slate-700">
                                              <Icon name="LightBulbIcon" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                              <span>{risk.recommendation}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Top Recommendations */}
                            {ai.top_recommendations && ai.top_recommendations.length > 0 && (
                              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">{AI_ANALYTICS_COPY.recoTitle}</h4>
                                <div className="space-y-3">
                                  {ai.top_recommendations.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-indigo-300">{i + 1}</span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200">{rec.action}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                                            <Icon name="ArrowTrendingUpIcon" className="w-3 h-3" />{rec.impact}
                                          </span>
                                          {rec.effort && <span className="text-xs text-slate-500">Effort: <span className="text-slate-400">{rec.effort}</span></span>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Department Health */}
                            {ai.dept_health && ai.dept_health.length > 0 && (
                              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">{AI_ANALYTICS_COPY.deptHealthTitle}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {ai.dept_health.map((d, i) => (
                                    <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-start gap-2">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${AI_ANALYTICS_DEPT_STATUS_COLORS[d.status] ?? 'bg-slate-100 text-slate-600'}`}>{d.dept}</span>
                                      <p className="text-xs text-slate-400">{d.insight}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Disclaimer */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                              <Icon name="InformationCircleIcon" className="w-3.5 h-3.5 flex-shrink-0" />
                              {AI_ANALYTICS_COPY.disclaimerText}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Standard Charts */}
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
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">Anomaly Summary</h3>
                        <button
                          type="button"
                          onClick={() => onSwitchTab?.('auditor')}
                          title={CROSS_TAB_COPY.openAuditorTitle}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                        >
                          <Icon name="MagnifyingGlassCircleIcon" className="w-3.5 h-3.5" />
                          {CROSS_TAB_COPY.openAuditorLink}
                        </button>
                      </div>
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
              (drawer.employee_code || drawer.employee_id || '')
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
          onGenerated={data => { setMasterPreview(data); reloadHistory() }}
        />
      )}

      {/* Slip Edit Modal */}
      {editModal && (
        <SlipEditModal
          slip={editModal}
          onClose={() => setEditModal(null)}
          onSaved={(msg) => { toast(msg); reloadSlips(); setEditModal(null) }}
        />
      )}

      {/* Slip Delete Modal */}
      {deleteModal && (
        <SlipDeleteModal
          slip={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDeleted={(id) => { handleSlipDeleted(id); setDeleteModal(null) }}
        />
      )}

      {/* Slip HR Override Modal */}
      {hrModal && (
        <SlipHRModal
          slip={hrModal}
          onClose={() => setHrModal(null)}
          onSaved={(msg) => { toast(msg); reloadSlips(); setHrModal(null) }}
        />
      )}

      {/* ── Workflow Action Confirmation Modal ───────────────────────── */}
      {workflowAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <span className={`p-2 rounded-xl ${WORKFLOW_STAGE_META[workflowAction.action === 'freeze' ? 'frozen' : workflowAction.action === 'unfreeze' ? 'draft' : workflowAction.action === 'hr_approve' ? 'hr_approved' : workflowAction.action === 'finance_review' ? 'finance_review' : workflowAction.action === 'finance_approve' ? 'finance_approved' : 'released']?.bg ?? 'bg-slate-100'}`}>
                <Icon name="ArrowRightCircleIcon" className="w-5 h-5 text-slate-600" />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{WORKFLOW_COPY[`${workflowAction.action.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}Btn`] ?? 'Confirm Action'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{WORKFLOW_COPY[`${workflowAction.action.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}Title`] ?? ''}</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{WORKFLOW_COPY.noteLabel}</label>
              <textarea
                rows={3}
                value={workflowNote}
                onChange={e => setWorkflowNote(e.target.value)}
                placeholder={WORKFLOW_COPY.notePlaceholder}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-700"
              />
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button"
                onClick={() => { setWorkflowAction(null); setWorkflowNote('') }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                {WORKFLOW_COPY.cancelAction}
              </button>
              <button type="button"
                disabled={workflowLoading}
                onClick={async () => {
                  const { action, importId } = workflowAction
                  setWorkflowAction(null)
                  await handleWorkflowAction(action, importId, workflowNote)
                  setWorkflowNote('')
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-40">
                {workflowLoading ? 'Processing…' : WORKFLOW_COPY.confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

