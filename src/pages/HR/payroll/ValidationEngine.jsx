/**
 * Validation Engine — pre-payroll rule checks
 */
import { useEffect, useMemo, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollService from '../../../services/payroll.service'
import {
  PAYROLL_VALIDATION_RULES, PAYROLL_VALIDATION_SEVERITY,
  PAYROLL_COPY,
} from '../../../config/hrPayroll.config'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

export default function ValidationEngine({ activeRunId }) {
  const [runs,      setRuns]      = useState([])
  const [runId,     setRunId]     = useState(activeRunId ?? '')
  const [slips,     setSlips]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    payrollService.getPayrollRuns({ page_size: 24 }).then((r) => {
      const list = r?.results ?? r ?? []
      setRuns(list)
      if (!runId && list.length) setRunId(list[0].id)
    })
  }, [])

  useEffect(() => { if (activeRunId) setRunId(activeRunId) }, [activeRunId])

  const runValidation = async () => {
    if (!runId) return
    setLoading(true); setValidated(false)
    try {
      const [s, e] = await Promise.all([
        payrollService.getSalarySlips({ payroll_run: runId, page_size: 200 }),
        payrollService.getEmployeeSalaryInfo({ page_size: 200 }),
      ])
      setSlips(s?.results ?? s ?? [])
      setEmployees(e?.results ?? e ?? [])
      setValidated(true)
    } finally { setLoading(false) }
  }

  // Run all validation rules
  const findings = useMemo(() => {
    if (!validated) return []
    return PAYROLL_VALIDATION_RULES.flatMap((rule) => {
      try {
        const results = rule.check(slips, employees)
        return results.map((f) => ({ ...f, ruleId: rule.id, ruleLabel: rule.label, severity: rule.severity }))
      } catch { return [] }
    })
  }, [slips, employees, validated])

  const grouped = useMemo(() => ({
    error:   findings.filter((f) => f.severity === 'error'),
    warning: findings.filter((f) => f.severity === 'warning'),
    info:    findings.filter((f) => f.severity === 'info'),
  }), [findings])

  const SeveritySection = ({ level, items }) => {
    const meta = PAYROLL_VALIDATION_SEVERITY[level]
    const Icon = HeroIcons[meta.icon] || HeroIcons.ExclamationCircleIcon
    if (items.length === 0) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{meta.label}s ({items.length})</span>
        </div>
        <div className="space-y-2">
          {items.map((f, i) => (
            <div key={i} className={`rounded-xl border p-4 ${meta.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">{f.ruleLabel}</p>
                  <p className="text-sm mt-0.5">{f.description}</p>
                  {f.suggested_action && (
                    <p className="text-xs mt-1 opacity-80">→ {f.suggested_action}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-slate-500 mb-1">Payroll Run</label>
          <select
            value={runId}
            onChange={(e) => { setRunId(e.target.value); setValidated(false) }}
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
          onClick={runValidation}
          disabled={!runId || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white text-sm font-medium rounded-lg transition"
        >
          {loading ? <Spinner /> : <HeroIcons.ShieldCheckIcon className="w-4 h-4" />}
          {loading ? 'Validating…' : 'Run Validation'}
        </button>
        {validated && (
          <div className="flex items-center gap-3 text-sm">
            {grouped.error.length > 0 && <span className="text-rose-700 font-medium">{grouped.error.length} errors</span>}
            {grouped.warning.length > 0 && <span className="text-amber-700 font-medium">{grouped.warning.length} warnings</span>}
            {grouped.info.length > 0 && <span className="text-blue-700 font-medium">{grouped.info.length} info</span>}
            {findings.length === 0 && <span className="text-emerald-700 font-medium">✓ All checks passed</span>}
          </div>
        )}
      </div>

      {!validated ? (
        <div className="bg-white rounded-xl border border-slate-200 p-14 text-center text-slate-400">
          <HeroIcons.ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a payroll run and click "Run Validation" to check for issues.</p>
        </div>
      ) : findings.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center text-emerald-700">
          <HeroIcons.CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-60" />
          <p className="font-medium">{PAYROLL_COPY.validationEmpty}</p>
          <p className="text-sm opacity-70 mt-1">All {slips.length} salary slips passed validation.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <SeveritySection level="error"   items={grouped.error}   />
          <SeveritySection level="warning" items={grouped.warning} />
          <SeveritySection level="info"    items={grouped.info}    />
        </div>
      )}
    </div>
  )
}
