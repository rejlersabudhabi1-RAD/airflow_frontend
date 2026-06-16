/**
 * Leave Dashboard — HR Leave Management
 * ======================================
 * Displays leave data imported from "Summary Leave Calculation-RAD-Updated.xlsx"
 * Source: /api/v1/payroll/leave-records/
 *
 * Views:  Overview  ·  Employee Detail  ·  Reports
 * All config (thresholds, colours, columns) → hrLeave.config.js
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import payrollService from '../../../services/payroll.service'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — all soft-coded constants
// ─────────────────────────────────────────────────────────────────────────────
const YEAR = 2026
const ANNUAL_ENTITLEMENT = 22   // default if not returned by API

const BALANCE_TIERS = [
  { label: 'Surplus (> 5)',   min: 5,   max: Infinity, color: '#10b981', bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  { label: 'Low (0 – 5)',     min: 0,   max: 5,        color: '#f59e0b', bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200' },
  { label: 'Negative',        min: -Infinity, max: 0,  color: '#ef4444', bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200' },
]

const balanceTier = (balance) => {
  const b = Number(balance)
  return BALANCE_TIERS.find(t => b > t.min || (b >= t.min && t.min === t.max)) ||
         BALANCE_TIERS.find(t => b >= t.min && b < t.max) ||
         (b >= 5 ? BALANCE_TIERS[0] : b >= 0 ? BALANCE_TIERS[1] : BALANCE_TIERS[2])
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const LIST_COLS = [
  { id: 'name',    label: 'Employee',    accessor: r => r.employee_name },
  { id: 'code',    label: 'Code',        accessor: r => r.employee_code || '—' },
  { id: 'dept',    label: 'Department',  accessor: r => r.department || '—' },
  { id: 'title',   label: 'Title',       accessor: r => r.job_title   || '—' },
  { id: 'joining', label: 'Joined',      accessor: r => r.joining_date ? r.joining_date.slice(0, 10) : '—' },
  { id: 'earned',  label: 'Earned',      accessor: r => Number(r.total_earned).toFixed(2),  cellType: 'number' },
  { id: 'taken',   label: 'Taken',       accessor: r => Number(r.total_taken).toFixed(2),   cellType: 'taken' },
  { id: 'encashed',label: 'Encashed',    accessor: r => Number(r.total_encashed).toFixed(2), cellType: 'number' },
  { id: 'balance', label: 'Balance',     accessor: r => Number(r.leave_balance).toFixed(2), cellType: 'balance' },
]

const PAGE_SIZE_OPTIONS = [25, 50, 100, 'All']
const ALL_DEPTS = 'all'

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const BalanceBadge = ({ value }) => {
  const tier = balanceTier(value)
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${tier.bg} ${tier.text} ${tier.border}`}>
      {Number(value).toFixed(1)} d
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'overview', label: 'Overview',   icon: 'ChartBarSquareIcon' },
  { id: 'list',     label: 'Employees',  icon: 'TableCellsIcon' },
  { id: 'detail',   label: 'Detail',     icon: 'UserCircleIcon' },
]

export default function LeaveDashboard() {
  const [view,        setView]        = useState('overview')
  const [records,     setRecords]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [deptFilter,  setDeptFilter]  = useState(ALL_DEPTS)
  const [selected,    setSelected]    = useState(null)  // full record with monthly breakdown
  const [detailLoading, setDetailLoading] = useState(false)
  const [pageSize,    setPageSize]    = useState(50)
  const [page,        setPage]        = useState(1)
  const [sortCol,     setSortCol]     = useState('name')
  const [sortAsc,     setSortAsc]     = useState(true)

  // ── Fetch all records ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    payrollService.getLeaveRecords({ year: YEAR, page_size: 500 })
      .then(d => setRecords(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  // ── Departments list ───────────────────────────────────────────────────────
  const departments = useMemo(() =>
    [...new Set(records.map(r => r.department).filter(Boolean))].sort(),
    [records]
  )

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let d = records
    if (deptFilter !== ALL_DEPTS) d = d.filter(r => r.department === deptFilter)
    if (search.trim()) {
      const s = search.toLowerCase()
      d = d.filter(r =>
        r.employee_name?.toLowerCase().includes(s) ||
        r.employee_code?.toLowerCase().includes(s) ||
        r.job_title?.toLowerCase().includes(s)
      )
    }
    return [...d].sort((a, b) => {
      let av = LIST_COLS.find(c => c.id === sortCol)?.accessor(a) ?? ''
      let bv = LIST_COLS.find(c => c.id === sortCol)?.accessor(b) ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortAsc ? cmp : -cmp
    })
  }, [records, deptFilter, search, sortCol, sortAsc])

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(filtered.length / pageSize)
  const paginated  = pageSize === 'All' ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize)

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const toggleSort = (id) => {
    if (sortCol === id) setSortAsc(a => !a)
    else { setSortCol(id); setSortAsc(true) }
  }

  // ── Load detail ────────────────────────────────────────────────────────────
  const loadDetail = useCallback((rec) => {
    setDetailLoading(true)
    setView('detail')
    payrollService.getLeaveRecord(rec.id)
      .then(d => setSelected(d))
      .catch(() => setSelected(rec))
      .finally(() => setDetailLoading(false))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // KPI computations
  // ─────────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total     = records.length
    const negative  = records.filter(r => Number(r.leave_balance) < 0).length
    const low       = records.filter(r => Number(r.leave_balance) >= 0 && Number(r.leave_balance) < 5).length
    const surplus   = records.filter(r => Number(r.leave_balance) >= 5).length
    const totalTaken  = records.reduce((s, r) => s + Number(r.total_taken  || 0), 0)
    const totalEncash = records.reduce((s, r) => s + Number(r.total_encashed || 0), 0)
    const avgBalance  = total > 0
      ? (records.reduce((s, r) => s + Number(r.leave_balance || 0), 0) / total).toFixed(2)
      : 0
    return { total, negative, low, surplus, totalTaken, totalEncash, avgBalance }
  }, [records])

  // ─────────────────────────────────────────────────────────────────────────
  // Chart data
  // ─────────────────────────────────────────────────────────────────────────
  const deptChart = useMemo(() => {
    const map = {}
    records.forEach(r => {
      const d = r.department || 'Unassigned'
      if (!map[d]) map[d] = { dept: d.slice(0, 15), taken: 0, encashed: 0, balance: 0, count: 0 }
      map[d].taken    += Number(r.total_taken    || 0)
      map[d].encashed += Number(r.total_encashed || 0)
      map[d].balance  += Number(r.leave_balance  || 0)
      map[d].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 12)
  }, [records])

  const balanceDist = useMemo(() => [
    { name: 'Surplus ≥5d',  value: kpis.surplus,  fill: '#10b981' },
    { name: 'Low 0–5d',     value: kpis.low,       fill: '#f59e0b' },
    { name: 'Negative',     value: kpis.negative,  fill: '#ef4444' },
  ].filter(d => d.value > 0), [kpis])

  const topNegative = useMemo(() =>
    [...records]
      .filter(r => Number(r.leave_balance) < 0)
      .sort((a, b) => Number(a.leave_balance) - Number(b.leave_balance))
      .slice(0, 10),
    [records]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // OVERVIEW VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Employees', value: kpis.total,      icon: 'UsersIcon',         bg: 'bg-blue-50',    text: 'text-blue-700' },
          { label: 'Surplus Balance', value: kpis.surplus,    icon: 'CheckCircleIcon',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Low Balance',     value: kpis.low,        icon: 'ExclamationCircleIcon', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Negative Balance',value: kpis.negative,   icon: 'XCircleIcon',       bg: 'bg-rose-50',    text: 'text-rose-700' },
          { label: 'Total Days Taken',value: kpis.totalTaken.toFixed(0), icon: 'CalendarDaysIcon', bg: 'bg-purple-50', text: 'text-purple-700' },
          { label: 'Avg Balance',     value: `${kpis.avgBalance}d`, icon: 'ScaleIcon',   bg: 'bg-slate-50',   text: 'text-slate-700' },
        ].map(k => {
          const Icon = HeroIcons[k.icon] || HeroIcons.ChartBarIcon
          return (
            <div key={k.label} className={`${k.bg} rounded-xl p-4 border border-white/80 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.text}`} />
              </div>
              <div className={`text-2xl font-bold ${k.text}`}>{loading ? '…' : k.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dept bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <HeroIcons.BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
            Leave Taken + Encashed by Department
          </h3>
          {deptChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptChart} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="taken"    name="Days Taken"    fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="encashed" name="Days Encashed" fill="#8b5cf6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-slate-400 text-sm">{loading ? <Spinner /> : 'No data'}</div>}
        </div>

        {/* Balance distribution pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <HeroIcons.ChartPieIcon className="w-4 h-4 text-slate-400" />
            Leave Balance Distribution
          </h3>
          {balanceDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={balanceDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" nameKey="name" label={({ name, value }) => `${value}`}>
                  {balanceDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} employees`, n]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-slate-400 text-sm">{loading ? <Spinner /> : 'No data'}</div>}
        </div>
      </div>

      {/* Negative balance alert */}
      {topNegative.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-1.5">
            <HeroIcons.ExclamationTriangleIcon className="w-4 h-4" />
            Employees with Negative Leave Balance ({topNegative.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {topNegative.map((r, i) => (
              <button key={i} type="button" onClick={() => loadDetail(r)}
                className="bg-white text-rose-700 text-xs px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1.5">
                <span>{r.employee_name}</span>
                <span className="font-bold">{Number(r.leave_balance).toFixed(1)}d</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderList = () => (
    <div className="space-y-3">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-slate-500 mb-1">Search employee</label>
          <div className="relative">
            <HeroIcons.MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Name, code, or title…"
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="min-w-44">
          <label className="block text-xs text-slate-500 mb-1">Department</label>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value={ALL_DEPTS}>All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Rows</label>
          <select value={pageSize} onChange={e => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value)); setPage(1) }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            {PAGE_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="font-semibold">{filtered.length}</span> of {records.length} employees
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-sm"><Spinner /> Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {LIST_COLS.map(c => (
                    <th key={c.id} onClick={() => toggleSort(c.id)}
                      className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 transition select-none">
                      <div className="flex items-center gap-1">
                        {c.label}
                        {sortCol === c.id && (
                          sortAsc
                            ? <HeroIcons.ChevronUpIcon className="w-3 h-3" />
                            : <HeroIcons.ChevronDownIcon className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 ? (
                  <tr><td colSpan={LIST_COLS.length + 1} className="text-center py-10 text-slate-400 text-sm">No records found</td></tr>
                ) : paginated.map((r) => {
                  const balance = Number(r.leave_balance)
                  const tier    = balanceTier(balance)
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${balance < 0 ? 'bg-rose-50/30' : ''}`}>
                      {LIST_COLS.map(c => {
                        const v = c.accessor(r)
                        if (c.cellType === 'balance') {
                          return <td key={c.id} className="px-3 py-2.5"><BalanceBadge value={r.leave_balance} /></td>
                        }
                        if (c.cellType === 'taken') {
                          return <td key={c.id} className={`px-3 py-2.5 font-medium ${Number(r.total_taken) > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{v}</td>
                        }
                        return <td key={c.id} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{v}</td>
                      })}
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => loadDetail(r)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          Detail <HeroIcons.ArrowRightIcon className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageSize !== 'All' && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selected && !detailLoading) return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
        <HeroIcons.UserCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
        Select an employee from the Employees tab
      </div>
    )
    if (detailLoading) return (
      <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-sm"><Spinner /> Loading…</div>
    )

    const monthly = selected?.monthly_breakdown ?? []
    const chartData = monthly.map(m => ({
      month:   MONTH_LABELS[(m.month || 1) - 1],
      earned:  Number(m.earned   || 0),
      taken:   Number(m.taken    || 0),
      encashed:Number(m.encashed || 0),
      balance: Number(m.balance  || 0),
    }))
    const tier = balanceTier(selected.leave_balance)

    return (
      <div className="space-y-4">
        {/* Back button */}
        <button type="button" onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <HeroIcons.ArrowLeftIcon className="w-4 h-4" /> Back to list
        </button>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selected.employee_name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{selected.job_title || '—'}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                {selected.employee_code && <span className="bg-slate-100 px-2 py-0.5 rounded">#{selected.employee_code}</span>}
                {selected.department    && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{selected.department}</span>}
                {selected.joining_date  && <span className="bg-slate-100 px-2 py-0.5 rounded">Joined {selected.joining_date.slice(0, 10)}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Leave Balance</div>
              <BalanceBadge value={selected.leave_balance} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Annual Entitlement', value: `${Number(selected.annual_entitlement).toFixed(1)} d`, color: 'text-slate-700' },
              { label: 'Total Earned',       value: `${Number(selected.total_earned).toFixed(2)} d`,      color: 'text-emerald-700' },
              { label: 'Total Taken',        value: `${Number(selected.total_taken).toFixed(2)} d`,       color: 'text-blue-700' },
              { label: 'Total Encashed',     value: `${Number(selected.total_encashed).toFixed(2)} d`,    color: 'text-purple-700' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`text-lg font-bold ${s.color} mt-0.5`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly chart */}
        {chartData.some(d => d.earned > 0 || d.taken > 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Monthly Leave Breakdown — {YEAR}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="earned"   name="Earned"   fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="taken"    name="Taken"    fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="encashed" name="Encashed" fill="#8b5cf6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly table */}
        {monthly.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">Monthly breakdown</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Month','Earned','Taken','Encashed','Balance'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthly.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-700">{m.month_label || MONTH_LABELS[(m.month || 1) - 1]}</td>
                      <td className="px-3 py-2.5 text-emerald-700">{Number(m.earned   || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-blue-700">{Number(m.taken    || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-purple-700">{Number(m.encashed || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5"><BalanceBadge value={m.balance} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex gap-1 items-center flex-wrap">
        {VIEWS.map(v => {
          const Icon = HeroIcons[v.icon] || HeroIcons.TableCellsIcon
          const active = view === v.id
          return (
            <button key={v.id} type="button" onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}>
              <Icon className="w-4 h-4" />
              {v.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          {records.length} employees · {YEAR} · Imported from HR Excel
        </div>
      </div>

      {view === 'overview' && renderOverview()}
      {view === 'list'     && renderList()}
      {view === 'detail'   && renderDetail()}
    </div>
  )
}
