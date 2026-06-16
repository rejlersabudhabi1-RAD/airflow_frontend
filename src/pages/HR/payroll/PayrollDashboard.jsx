/**
 * Payroll Intelligence — Executive Dashboard
 * Shows KPI tiles, payroll runs table, and trend charts.
 */
import { useEffect, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import payrollService from '../../../services/payroll.service'
import {
  PAYROLL_KPIS, PAYROLL_RUN_COLUMNS, PAYROLL_COPY,
  runStatusMeta, fmtCurrency,
} from '../../../config/hrPayroll.config'

const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4']

export default function PayrollDashboard({ onSelectRun }) {
  const [summary,  setSummary]  = useState(null)
  const [runs,     setRuns]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      payrollService.getDashboardSummary().catch(() => null),
      payrollService.getPayrollRuns({ page_size: 12 }).catch(() => ({ results: [] })),
    ]).then(([s, r]) => {
      setSummary(s)
      setRuns(r?.results ?? r ?? [])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  // Build trend data from runs list
  const trendData = [...runs].reverse().slice(0, 6).map((r) => ({
    period: `${String(r.month).padStart(2,'0')}/${String(r.year).slice(-2)}`,
    gross:  parseFloat(r.total_gross_salary) || 0,
    net:    parseFloat(r.total_net_salary)   || 0,
  }))

  const handleProcess = async (runId) => {
    setProcessing(runId)
    try {
      await payrollService.processPayrollRun(runId)
      const r = await payrollService.getPayrollRuns({ page_size: 12 })
      setRuns(r?.results ?? r ?? [])
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
      <span className="ml-3 text-slate-500 text-sm">Loading payroll data…</span>
    </div>
  )

  if (error) return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700 text-sm">{error}</div>
  )

  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {PAYROLL_KPIS.map((kpi) => {
          const Icon = HeroIcons[kpi.icon] || HeroIcons.ChartBarIcon
          const val = kpi.compute(summary)
          return (
            <div key={kpi.id} className={`rounded-xl border p-4 ${kpi.tone} border-current/10`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{kpi.label}</span>
              </div>
              <div className="text-xl font-bold">{val}{kpi.suffix}</div>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart — payroll trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Payroll Trend (last 6 months)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtCurrency(v)} />
                <Bar dataKey="gross" name="Gross" fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="net"   name="Net"   fill="#10b981" radius={[3,3,0,0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No run data yet</div>
          )}
        </div>

        {/* Pie — run status distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Run Status Distribution</h3>
          {runs.length > 0 ? (() => {
            const statusCounts = runs.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})
            const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name: runStatusMeta(name).label, value }))
            return (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )
          })() : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No runs yet</div>
          )}
        </div>
      </div>

      {/* Payroll Runs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Payroll Runs</h3>
          <span className="text-xs text-slate-500">{runs.length} runs</span>
        </div>
        {runs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <HeroIcons.InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No payroll runs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {PAYROLL_RUN_COLUMNS.map((c) => (
                    <th key={c.id} className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">{c.label}</th>
                  ))}
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => onSelectRun?.(r)}
                  >
                    {PAYROLL_RUN_COLUMNS.map((c) => {
                      const v = c.accessor(r)
                      if (c.cellType === 'run_status') {
                        const m = runStatusMeta(v)
                        return (
                          <td key={c.id} className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${m.tone}`}>{m.label}</span>
                          </td>
                        )
                      }
                      return <td key={c.id} className="px-4 py-3 text-slate-700">{v}</td>
                    })}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleProcess(r.id) }}
                        disabled={r.status === 'completed' || processing === r.id}
                        className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-md transition"
                      >
                        {processing === r.id ? '…' : 'Process'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
