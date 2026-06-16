/**
 * Project Costing Intelligence
 * Scaffold with Valueframe integration notice.
 * Real data will flow from ProjectCostAllocation model once Valueframe sync is live.
 */
import { useEffect, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import payrollService from '../../../services/payroll.service'
import { PAYROLL_COPY, fmtCurrency } from '../../../config/hrPayroll.config'

// Soft-coded demo palette for project cost bars
const BAR_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4']

// Soft-coded mock data — replaced by real API data once Valueframe is integrated
const MOCK_PROJECTS = [
  { project_code: 'P-201', project_name: 'Abu Dhabi Refinery Expansion', cost_center: 'PROCESS', allocated_cost: 62400, allocated_hours: 420 },
  { project_code: 'P-203', project_name: 'ADNOC Offshore Pipeline', cost_center: 'PIPING',   allocated_cost: 48700, allocated_hours: 310 },
  { project_code: 'P-205', project_name: 'Internal R&D', cost_center: 'PROCESS', allocated_cost: 18900, allocated_hours: 130 },
  { project_code: 'P-207', project_name: 'Jubail Petrochemical', cost_center: 'INSTRUMENT', allocated_cost: 35200, allocated_hours: 240 },
  { project_code: 'P-209', project_name: 'LNG Terminal Study', cost_center: 'PROCESS', allocated_cost: 27600, allocated_hours: 190 },
]

export default function ProjectCosting() {
  const [apiData, setApiData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    payrollService.getProjectCosts({ page_size: 50 })
      .then((r) => setApiData(r?.results ?? r ?? []))
      .catch(() => setApiData([]))
      .finally(() => setLoading(false))
  }, [])

  const display = apiData.length > 0 ? apiData : MOCK_PROJECTS
  const isLive  = apiData.length > 0

  const totalCost  = display.reduce((s, p) => s + (parseFloat(p.allocated_cost) || 0), 0)
  const totalHours = display.reduce((s, p) => s + (parseFloat(p.allocated_hours) || 0), 0)

  const chartData = display.map((p) => ({
    name:  p.project_code,
    cost:  parseFloat(p.allocated_cost) || 0,
    hours: parseFloat(p.allocated_hours) || 0,
  }))

  return (
    <div className="space-y-5">
      {/* Integration notice */}
      {!isLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <HeroIcons.InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{PAYROLL_COPY.projectsComingSoon}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Sample data is shown. Connect Valueframe to populate real project cost allocations via{' '}
              <code className="bg-amber-100 px-1 rounded">POST /api/v1/payroll/project-costs/</code>.
            </p>
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Labour Cost',  value: fmtCurrency(totalCost),  tone: 'bg-blue-50 text-blue-700',    icon: 'BanknotesIcon' },
          { label: 'Total Hours',        value: `${totalHours.toFixed(0)}h`, tone: 'bg-teal-50 text-teal-700', icon: 'ClockIcon' },
          { label: 'Projects',           value: display.length,           tone: 'bg-purple-50 text-purple-700', icon: 'BuildingOfficeIcon' },
          { label: 'Avg Cost / Hour',    value: totalHours > 0 ? fmtCurrency(totalCost / totalHours) : '—', tone: 'bg-amber-50 text-amber-700', icon: 'CalculatorIcon' },
        ].map((k) => {
          const Icon = HeroIcons[k.icon] || HeroIcons.ChartBarIcon
          return (
            <div key={k.label} className={`rounded-xl border p-4 ${k.tone} border-current/10`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-4 h-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{k.label}</span>
              </div>
              <div className="text-lg font-bold">{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Labour Cost by Project</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmtCurrency(v)} />
            <Bar dataKey="cost" name="Cost (AED)" radius={[4,4,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Project Allocations</h3>
          {!isLive && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Sample data</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Project Code','Project Name','Cost Center','Hours','Allocated Cost','Cost/Hour'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {display.map((p) => {
                const costPerHour = p.allocated_hours > 0 ? parseFloat(p.allocated_cost) / parseFloat(p.allocated_hours) : 0
                return (
                  <tr key={p.project_code} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{p.project_code}</td>
                    <td className="px-4 py-3 text-slate-700">{p.project_name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{p.cost_center}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{parseFloat(p.allocated_hours).toFixed(0)}h</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{fmtCurrency(p.allocated_cost)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtCurrency(costPerHour)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
