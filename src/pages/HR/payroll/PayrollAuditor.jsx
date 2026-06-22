/**
 * Payroll Auditor — anomaly detection comparing payroll runs.
 * Aligned with PayrollEngine via shared activeRunId / onSelectRun / onSwitchTab props.
 */
import { useEffect, useMemo, useState, useRef } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import payrollService from '../../../services/payroll.service'
import {
  PAYROLL_AUDIT_THRESHOLDS, PAYROLL_ALERT_SEVERITY,
  PAYROLL_COPY, fmtCurrency, CROSS_TAB_COPY,
} from '../../../config/hrPayroll.config'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

// Client-side anomaly detection
const detectAnomalies = (currSlips, prevSlips) => {
  const prevMap = {}
  for (const s of prevSlips) prevMap[s.employee_salary_info] = s

  const anomalies = []

  for (const curr of currSlips) {
    const prev = prevMap[curr.employee_salary_info]
    if (!prev) {
      anomalies.push({
        type: 'new_employee',
        severity: 'low',
        employee: curr.employee_name || curr.employee_id || curr.slip_number,
        current: curr.net_salary,
        previous: null,
        changePct: null,
        rootCause: 'Employee appears for the first time in this payroll run.',
        suggestion: 'Verify the employee is correctly onboarded.',
      })
      continue
    }
    const currNet  = parseFloat(curr.net_salary) || 0
    const prevNet  = parseFloat(prev.net_salary) || 0
    if (prevNet > 0) {
      const pct = ((currNet - prevNet) / prevNet) * 100
      if (Math.abs(pct) > PAYROLL_AUDIT_THRESHOLDS.spikePercent) {
        anomalies.push({
          type: 'salary_spike',
          severity: Math.abs(pct) > 40 ? 'critical' : Math.abs(pct) > 25 ? 'high' : 'medium',
          employee: curr.employee_name || curr.employee_id || curr.slip_number,
          current: currNet,
          previous: prevNet,
          changePct: pct,
          rootCause: `Net salary changed by ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% from previous period.`,
          suggestion: 'Review salary structure and any approved adjustments.',
        })
      }
    }
  }

  // Missing employees (in prev but not curr)
  const currEmpIds = new Set(currSlips.map((s) => s.employee_salary_info))
  for (const prev of prevSlips) {
    if (!currEmpIds.has(prev.employee_salary_info)) {
      anomalies.push({
        type: 'missing_employee',
        severity: 'high',
        employee: prev.employee_name || prev.employee_id || prev.slip_number,
        current: null,
        previous: prev.net_salary,
        changePct: null,
        rootCause: 'Employee was in previous run but missing from current run.',
        suggestion: 'Verify employee status — may be inactive or missed in processing.',
      })
    }
  }

  return anomalies
}

export default function PayrollAuditor({ activeRunId, onSelectRun, onSwitchTab }) {
  const [runs,       setRuns]       = useState([])
  const [runId,      setRunId]      = useState(activeRunId ?? '')
  const [currSlips,  setCurrSlips]  = useState([])
  const [prevSlips,  setPrevSlips]  = useState([])
  const [allRuns,    setAllRuns]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [analysed,   setAnalysed]   = useState(false)
  // Track the last activeRunId we already auto-ran to avoid duplicate triggers
  const lastAutoRunId = useRef(null)

  useEffect(() => {
    payrollService.getPayrollRuns({ page_size: 24 }).then((r) => {
      const list = r?.results ?? r ?? []
      setRuns(list)
      setAllRuns(list)
      if (!runId && list.length) setRunId(list[0].id)
    })
  }, [])

  // When Engine selects a run: sync into local state + auto-trigger audit
  useEffect(() => {
    if (!activeRunId) return
    setRunId(activeRunId)
    setAnalysed(false)
    // Auto-run only once per unique activeRunId to avoid re-running on every render
    if (activeRunId !== lastAutoRunId.current) {
      lastAutoRunId.current = activeRunId
      // Run after a tick so allRuns is populated
      setTimeout(() => runAnalysisForId(activeRunId), 0)
    }
  }, [activeRunId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Core analysis function accepting an explicit runId so it works both from
  // the button click and the auto-trigger above.
  const runAnalysisForId = async (targetId) => {
    if (!targetId) return
    setLoading(true); setAnalysed(false)
    try {
      const sortedRuns = [...allRuns].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      const currIdx = sortedRuns.findIndex((r) => r.id === targetId)
      const prevRun = currIdx > 0 ? sortedRuns[currIdx - 1] : null

      const [curr, prev] = await Promise.all([
        payrollService.getSalarySlips({ payroll_run: targetId, page_size: 200 }),
        prevRun ? payrollService.getSalarySlips({ payroll_run: prevRun.id, page_size: 200 }) : Promise.resolve({ results: [] }),
      ])
      setCurrSlips(curr?.results ?? curr ?? [])
      setPrevSlips(prev?.results ?? prev ?? [])
      setAnalysed(true)
    } finally { setLoading(false) }
  }

  const runAnalysis = () => runAnalysisForId(runId)

  // When the user manually picks a different run in the Auditor's own selector,
  // sync it back to the parent (Payroll.jsx) so the Engine also knows.
  const handleRunChange = (newId) => {
    setRunId(newId)
    setAnalysed(false)
    lastAutoRunId.current = null // allow auto-run if Engine sends this ID next
    onSelectRun?.(newId)
  }

  const isSyncedWithEngine = activeRunId && runId === activeRunId
  const activeRunMeta = runs.find(r => r.id === runId)

  const anomalies = useMemo(() =>
    analysed ? detectAnomalies(currSlips, prevSlips) : []
  , [analysed, currSlips, prevSlips])

  // Trend data from all runs
  const trendData = [...allRuns]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-8)
    .map((r) => ({
      period:  `${String(r.month).padStart(2,'0')}/${String(r.year).slice(-2)}`,
      gross:   parseFloat(r.total_gross_salary) || 0,
      net:     parseFloat(r.total_net_salary)   || 0,
      emps:    r.total_employees || 0,
    }))

  return (
    <div className="space-y-5">
      {/* Connection header — shows sync state with Engine */}
      <div className={`rounded-xl border px-4 py-3 flex items-center justify-between flex-wrap gap-2 ${
        isSyncedWithEngine
          ? 'bg-indigo-50 border-indigo-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSyncedWithEngine ? 'bg-indigo-500' : 'bg-slate-400'}`} />
          {isSyncedWithEngine ? (
            <span className="text-xs font-medium text-indigo-700">
              {CROSS_TAB_COPY.syncedBadge}
              {activeRunMeta && (
                <span className="ml-1.5 text-indigo-500 font-normal">
                  · {activeRunMeta.run_code} · {String(activeRunMeta.month).padStart(2,'0')}/{activeRunMeta.year}
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-slate-500">{CROSS_TAB_COPY.notSyncedBadge}</span>
          )}
          {loading && (
            <span className="text-xs text-indigo-500 flex items-center gap-1"><Spinner /> Auto-analysing…</span>
          )}
          {analysed && isSyncedWithEngine && !loading && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <HeroIcons.CheckCircleIcon className="w-3.5 h-3.5" /> {CROSS_TAB_COPY.autoAuditDone}
            </span>
          )}
        </div>
        {isSyncedWithEngine && (
          <button
            type="button"
            onClick={() => onSwitchTab?.('engine')}
            title={CROSS_TAB_COPY.backToEngineTitle}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <HeroIcons.ArrowLeftIcon className="w-3.5 h-3.5" />
            {CROSS_TAB_COPY.backToEngine}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-slate-500 mb-1">Payroll Run to Audit</label>
          <select
            value={runId}
            onChange={(e) => { handleRunChange(e.target.value) }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select run —</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>{r.run_code} · {String(r.month).padStart(2,'0')}/{r.year}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!runId || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white text-sm font-medium rounded-lg transition"
        >
          {loading ? <Spinner /> : <HeroIcons.MagnifyingGlassIcon className="w-4 h-4" />}
          {loading ? 'Analysing…' : 'Run Audit'}
        </button>
        {analysed && (
          <span className="text-sm text-slate-600">
            {anomalies.length === 0 ? '✓ No anomalies detected' : `${anomalies.length} anomalies found`}
          </span>
        )}
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Month-over-Month Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Line type="monotone" dataKey="gross" name="Gross" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="net"   name="Net"   stroke="#10b981" strokeWidth={2} dot={false} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies */}
      {!analysed ? (
        <div className="bg-white rounded-xl border border-slate-200 p-14 text-center text-slate-400">
          <HeroIcons.MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a run and click "Run Audit" to detect anomalies.</p>
          <p className="text-xs mt-1 opacity-70">Compares vs previous payroll run · Spike threshold: {PAYROLL_AUDIT_THRESHOLDS.spikePercent}%</p>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center text-emerald-700">
          <HeroIcons.CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-60" />
          <p className="font-medium">{PAYROLL_COPY.auditorEmpty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a, i) => {
            const meta = PAYROLL_ALERT_SEVERITY[a.severity] ?? PAYROLL_ALERT_SEVERITY.medium
            return (
              <div key={i} className={`rounded-xl border p-4 ${meta.tone}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wide">{a.type.replace(/_/g,' ')}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.tone}`}>{meta.label}</span>
                      <span className="text-xs text-slate-600">{a.employee}</span>
                      {a.changePct !== null && (
                        <span className={`text-xs font-bold ${a.changePct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {a.changePct >= 0 ? '+' : ''}{a.changePct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {a.current !== null && (
                      <div className="text-sm mt-1">
                        {a.previous !== null && <span className="text-slate-500">{fmtCurrency(a.previous)} → </span>}
                        <span className="font-semibold">{fmtCurrency(a.current)}</span>
                      </div>
                    )}
                    <p className="text-xs mt-1 opacity-80">{a.rootCause}</p>
                    <p className="text-xs mt-0.5 opacity-70">→ {a.suggestion}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
