/**
 * Payroll Engine — salary slips browser with approval drawer
 */
import { useEffect, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollService from '../../../services/payroll.service'
import {
  PAYROLL_SLIP_COLUMNS, PAYROLL_COPY,
  slipStatusMeta, runStatusMeta, fmtCurrency,
} from '../../../config/hrPayroll.config'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const STATUS_FILTERS = ['all', 'draft', 'pending_approval', 'approved', 'rejected', 'sent']

export default function PayrollEngine({ activeRunId, onSelectRun }) {
  const [runs,      setRuns]      = useState([])
  const [runId,     setRunId]     = useState(activeRunId ?? '')
  const [slips,     setSlips]     = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [drawer,    setDrawer]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  // Load runs for selector
  useEffect(() => {
    payrollService.getPayrollRuns({ page_size: 24 }).then((r) => {
      const list = r?.results ?? r ?? []
      setRuns(list)
      if (!runId && list.length) setRunId(list[0].id)
    })
  }, [])

  // Sync external runId prop
  useEffect(() => { if (activeRunId) setRunId(activeRunId) }, [activeRunId])

  // Load slips for selected run
  useEffect(() => {
    if (!runId) return
    setLoading(true)
    const params = { payroll_run: runId, page_size: 100 }
    if (statusFilter !== 'all') params.status = statusFilter
    payrollService.getSalarySlips(params).then((r) => {
      setSlips(r?.results ?? r ?? [])
    }).finally(() => setLoading(false))
  }, [runId, statusFilter])

  const act = async (label, fn) => {
    setActionMsg('')
    try { await fn(); setActionMsg(`${label} successful.`); setDrawer(null) }
    catch (e) { setActionMsg(`Error: ${e.message}`) }
    finally {
      const params = { payroll_run: runId, page_size: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      payrollService.getSalarySlips(params).then((r) => setSlips(r?.results ?? r ?? []))
    }
  }

  const breakdown = (obj) =>
    obj && typeof obj === 'object' && Object.keys(obj).length > 0
      ? Object.entries(obj).map(([k, v]) => ({ k, v }))
      : []

  return (
    <div className="flex gap-4 h-full">
      {/* Main panel */}
      <div className={`flex-1 min-w-0 space-y-4 ${drawer ? 'lg:w-1/2' : ''}`}>
        {/* Run selector + status pills */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-slate-500 mb-1">Payroll Run</label>
            <select
              value={runId}
              onChange={(e) => { setRunId(e.target.value); onSelectRun?.(e.target.value) }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select run —</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.run_code} · {String(r.month).padStart(2,'0')}/{r.year} · {runStatusMeta(r.status).label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : slipStatusMeta(s).label}
              </button>
            ))}
          </div>
        </div>

        {actionMsg && (
          <div className={`px-4 py-2 rounded-lg text-sm ${actionMsg.startsWith('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {actionMsg}
          </div>
        )}

        {/* Slips table */}
        {!runId ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            {PAYROLL_COPY.noRunSelected}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-sm"><Spinner /> Loading slips…</div>
        ) : slips.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            <HeroIcons.InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            {PAYROLL_COPY.noSlipsFound}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">{slips.length} salary slips</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {PAYROLL_SLIP_COLUMNS.map((c) => (
                      <th key={c.id} className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slips.map((s) => (
                    <tr key={s.id} onClick={() => setDrawer(s)} className="hover:bg-slate-50 cursor-pointer">
                      {PAYROLL_SLIP_COLUMNS.map((c) => {
                        const v = c.accessor(s)
                        if (c.cellType === 'slip_status') {
                          const m = slipStatusMeta(v)
                          return (
                            <td key={c.id} className="px-3 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${m.tone}`}>{m.label}</span>
                            </td>
                          )
                        }
                        return <td key={c.id} className="px-3 py-2.5 text-slate-700">{v}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="w-80 xl:w-96 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{drawer.slip_number}</span>
            <button type="button" onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-700">
              <HeroIcons.XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Status */}
            <div>
              {(() => { const m = slipStatusMeta(drawer.status); return (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${m.tone}`}>{m.label}</span>
              )})()}
            </div>

            {/* Formula */}
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-medium">{fmtCurrency(drawer.basic_salary)}</span>
              </div>
              <div className="flex justify-between mb-1 text-emerald-700">
                <span>+ Allowances</span>
                <span className="font-medium">+ {fmtCurrency(drawer.total_allowances)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">= Gross</span>
                <span className="font-semibold">{fmtCurrency(drawer.gross_salary)}</span>
              </div>
              <div className="flex justify-between mb-1 text-rose-700">
                <span>− Deductions</span>
                <span className="font-medium">− {fmtCurrency(drawer.total_deductions)}</span>
              </div>
              <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Net Salary</span>
                <span>{fmtCurrency(drawer.net_salary)}</span>
              </div>
            </div>

            {/* Allowances breakdown */}
            {breakdown(drawer.allowances_breakdown).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Allowances</h4>
                {breakdown(drawer.allowances_breakdown).map(({ k, v }) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-600">{k}</span>
                    <span className="text-emerald-700 font-medium">{fmtCurrency(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Deductions breakdown */}
            {breakdown(drawer.deductions_breakdown).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deductions</h4>
                {breakdown(drawer.deductions_breakdown).map(({ k, v }) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-600">{k}</span>
                    <span className="text-rose-700 font-medium">− {fmtCurrency(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attendance</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[['Working Days', drawer.working_days], ['Present', drawer.present_days], ['Absent', drawer.absent_days]].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg p-2">
                    <div className="font-bold text-base text-slate-800">{v ?? '—'}</div>
                    <div className="text-slate-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {(drawer.status === 'pending_approval' || drawer.status === 'approved') && (
              <div className="flex flex-col gap-2 pt-2">
                {drawer.status === 'pending_approval' && (
                  <>
                    <button type="button" onClick={() => act('Approve', () => payrollService.approveSalarySlip(drawer.id))}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition">
                      ✓ Approve
                    </button>
                    <button type="button" onClick={() => act('Reject', () => payrollService.rejectSalarySlip(drawer.id))}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition">
                      ✗ Reject
                    </button>
                  </>
                )}
                {drawer.status === 'approved' && (
                  <button type="button" onClick={() => act('Email sent', () => payrollService.sendSalarySlipEmail(drawer.id))}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    ✉ Send Email
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
