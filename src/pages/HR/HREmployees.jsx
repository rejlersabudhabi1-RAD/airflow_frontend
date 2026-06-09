/**
 * HR · Employee Management (`/hr/employees`)
 * -------------------------------------------
 * HR-facing workforce directory built on top of the existing RBAC user store.
 *
 * Data source : rbacService.getUsers() — same paginated endpoint that powers
 *               `/admin/users`. This page presents the same records through an
 *               HR lens: KPIs, multi-dimensional filters, three view modes
 *               (cards / table / departments) and a slide-in detail drawer.
 *
 * Every label, threshold, KPI, filter, column and tab comes from
 * `frontend/src/config/hrEmployees.config.js` — no magic values live here.
 *
 * Create / edit / bulk-import flows intentionally deep-link back to
 * `/admin/users` so we keep one authoritative write surface.
 */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as HeroIcons from '@heroicons/react/24/outline'
import rbacService from '../../services/rbac.service'
import {
  HR_KPIS,
  HR_FILTERS,
  HR_VIEW_MODES,
  HR_DEFAULT_VIEW_MODE,
  HR_CARD_FIELDS,
  HR_TABLE_COLUMNS,
  HR_DETAIL_TABS,
  HR_DEFAULT_DETAIL_TAB,
  HR_PAGE_SIZES,
  HR_DEFAULT_PAGE_SIZE,
  HR_DATA_FETCH_PAGE_SIZE,
  HR_EXPORT_FORMATS,
  HR_COPY,
  HR_ADMIN_USER_LINK,
  HR_ADMIN_USERS_LIST_LINK,
  HR_DISCIPLINES,
  formatYearsOfService,
  formatDateTime,
  formatDate,
  fullName,
  initials,
  matchDiscipline,
  getStatusMeta,
} from '../../config/hrEmployees.config'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve a heroicon name from string → component (falls back to UserIcon). */
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const C = HeroIcons[name] || HeroIcons.UserIcon
  return <C className={className} aria-hidden="true" />
}

/** Normalise the various shapes rbacService.getUsers() can return. */
const extractUserList = (resp) => {
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp?.results)) return resp.results
  if (Array.isArray(resp?.data)) return resp.data
  if (Array.isArray(resp?.data?.results)) return resp.data.results
  return []
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: KPI Strip
// ─────────────────────────────────────────────────────────────────────────────
const KpiStrip = ({ employees, loading }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
    {HR_KPIS.map((kpi) => (
      <div
        key={kpi.id}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${kpi.accent} text-white p-4 shadow-md`}
      >
        <div className="flex items-start justify-between">
          <Icon name={kpi.icon} className="w-6 h-6 opacity-80" />
          <span className="text-[10px] uppercase tracking-wider opacity-80">{kpi.label}</span>
        </div>
        <div className="mt-2 text-2xl font-bold leading-tight">
          {loading ? <span className="inline-block w-8 h-6 bg-white/30 animate-pulse rounded" /> : kpi.compute(employees)}
        </div>
        <div className="mt-1 text-[11px] opacity-80 line-clamp-1">{kpi.sub}</div>
      </div>
    ))}
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Filters Bar
// ─────────────────────────────────────────────────────────────────────────────
const FiltersBar = ({ employees, filterValues, setFilterValue, searchTerm, setSearchTerm, viewMode, setViewMode, onReset }) => {
  // Derive dynamic filter options from the loaded employees list.
  const dynamicOptions = useMemo(() => {
    const out = {}
    for (const f of HR_FILTERS) {
      if (typeof f.optionsFrom === 'function') {
        const set = new Set()
        for (const emp of employees) {
          const v = f.optionsFrom(emp)
          if (v && String(v).trim()) set.add(String(v).trim())
        }
        out[f.id] = [
          { value: 'all', label: f.placeholder || `All ${f.label.toLowerCase()}` },
          ...[...set].sort().map(v => ({ value: v, label: v })),
        ]
      }
    }
    return out
  }, [employees])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      {/* Top row: search + view mode toggle + reset */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1">
          <HeroIcons.MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={HR_COPY.searchPlaceholder}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            {HR_VIEW_MODES.map(vm => (
              <button
                key={vm.id}
                type="button"
                onClick={() => setViewMode(vm.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  viewMode === vm.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={viewMode === vm.id}
              >
                <Icon name={vm.icon} className="w-4 h-4" />
                {vm.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Filter selects */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {HR_FILTERS.map(f => {
          const opts = f.optionsFrom === 'static' ? f.options : (dynamicOptions[f.id] || [{ value: 'all', label: f.placeholder || 'All' }])
          return (
            <div key={f.id}>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {f.label}
              </label>
              <select
                value={filterValues[f.id] || 'all'}
                onChange={(e) => setFilterValue(f.id, e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {opts.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Avatar
// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({ emp, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-20 h-20 text-2xl' }
  const cls = sizes[size] || sizes.md
  if (emp.profile_photo) {
    return (
      <img
        src={emp.profile_photo}
        alt={fullName(emp)}
        className={`${cls} rounded-full object-cover ring-2 ring-white shadow`}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center ring-2 ring-white shadow`}>
      {initials(emp)}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Status Badge & Discipline Tag
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

const DisciplineTag = ({ emp }) => {
  const d = matchDiscipline(emp.engineer_profile?.discipline || emp.department)
  if (!d) return null
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${d.tone}`}>{d.label}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Employee Card (Cards view)
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeCard = ({ emp, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(emp)}
    className="group text-left bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition p-4 flex flex-col"
  >
    <div className="flex items-start gap-3">
      <Avatar emp={emp} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-slate-900 truncate">{fullName(emp)}</div>
          <StatusBadge status={emp.status} />
        </div>
        <div className="text-xs text-slate-500 truncate">{emp.user?.email || '—'}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          <DisciplineTag emp={emp} />
          {emp.is_mfa_enabled && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
              <HeroIcons.ShieldCheckIcon className="w-3 h-3" /> MFA
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="mt-3 grid grid-cols-1 gap-1 text-xs">
      {HR_CARD_FIELDS.map(f => (
        <div key={f.id} className="flex items-center gap-2 text-slate-600 truncate">
          <Icon name={f.icon} className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{f.accessor(emp)}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
      <span className="flex items-center gap-1">
        <HeroIcons.ClockIcon className="w-3.5 h-3.5" /> {formatYearsOfService(emp.created_at)}
      </span>
      <span className="text-blue-600 group-hover:underline">View details →</span>
    </div>
  </button>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Employees Table (Table view)
// ─────────────────────────────────────────────────────────────────────────────
const EmployeesTable = ({ employees, onSelect }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {HR_TABLE_COLUMNS.map(c => (
              <th key={c.id} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {employees.map(emp => (
            <tr key={emp.id} className="hover:bg-blue-50/50 cursor-pointer" onClick={() => onSelect(emp)}>
              {HR_TABLE_COLUMNS.map(c => {
                const v = c.accessor(emp)
                if (c.id === 'name') {
                  return (
                    <td key={c.id} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar emp={emp} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{v}</div>
                          <div className="text-xs text-slate-500">{emp.user?.email}</div>
                        </div>
                      </div>
                    </td>
                  )
                }
                if (c.id === 'status') return <td key={c.id} className="px-3 py-2"><StatusBadge status={v} /></td>
                if (c.id === 'last_login') return <td key={c.id} className="px-3 py-2 text-xs text-slate-600">{formatDateTime(v)}</td>
                return <td key={c.id} className="px-3 py-2 text-sm text-slate-700">{v}</td>
              })}
              <td className="px-3 py-2 text-right">
                <HeroIcons.ChevronRightIcon className="w-4 h-4 text-slate-400 inline" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Departments Breakdown view
// ─────────────────────────────────────────────────────────────────────────────
const DepartmentsView = ({ employees, onSelect }) => {
  const grouped = useMemo(() => {
    const map = new Map()
    for (const e of employees) {
      const key = (e.department || 'Unassigned').trim() || 'Unassigned'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [employees])

  const maxCount = grouped.reduce((m, [, list]) => Math.max(m, list.length), 1)

  return (
    <div className="space-y-3">
      {grouped.map(([dept, list]) => (
        <div key={dept} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-slate-900">{dept}</div>
              <div className="text-xs text-slate-500">{list.length} employees · {new Set(list.map(e => e.job_title).filter(Boolean)).size} distinct designations</div>
            </div>
            <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full" style={{ width: `${(list.length / maxCount) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {list.slice(0, 30).map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => onSelect(emp)}
                title={`${fullName(emp)} · ${emp.job_title || '—'}`}
                className="flex items-center gap-2 px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-full text-xs transition"
              >
                <Avatar emp={emp} size="sm" />
                <span className="font-medium text-slate-700">{fullName(emp)}</span>
              </button>
            ))}
            {list.length > 30 && (
              <span className="px-2 py-1 text-xs text-slate-500">+{list.length - 30} more</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Detail Drawer
// ─────────────────────────────────────────────────────────────────────────────
const Field = ({ label, value, mono = false }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
  </div>
)

const DetailDrawer = ({ emp, onClose }) => {
  const [tab, setTab] = useState(HR_DEFAULT_DETAIL_TAB)
  useEffect(() => { setTab(HR_DEFAULT_DETAIL_TAB) }, [emp?.id])

  if (!emp) return null
  const ep = emp.engineer_profile || {}

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
      />
      <aside className="w-full max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="flex items-start gap-4">
            <Avatar emp={emp} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold truncate">{fullName(emp)}</div>
              <div className="text-sm opacity-90 truncate">{emp.job_title || 'No designation'}</div>
              <div className="text-xs opacity-75 truncate">{emp.user?.email}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge status={emp.status} />
                <DisciplineTag emp={emp} />
                {emp.organization_name && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white">
                    {emp.organization_name}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded">
              <HeroIcons.XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-2">
          <div className="flex overflow-x-auto">
            {HR_DETAIL_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                  tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon name={t.icon} className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee ID" value={emp.employee_id} mono />
              <Field label="Years of Service" value={formatYearsOfService(emp.created_at)} />
              <Field label="Email" value={emp.user?.email} />
              <Field label="Phone" value={emp.phone} />
              <Field label="Location" value={emp.location} />
              <Field label="Joined" value={formatDate(emp.created_at)} />
              <div className="col-span-2">
                <Field label="Bio" value={emp.bio} />
              </div>
            </div>
          )}

          {tab === 'employment' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organisation" value={emp.organization_name} />
              <Field label="Department" value={emp.department} />
              <Field label="Designation" value={emp.job_title} />
              <Field label="Manager" value={emp.manager ? `User #${emp.manager}` : '—'} />
              <Field label="Status" value={getStatusMeta(emp.status).label} />
              <Field label="Discipline" value={matchDiscipline(ep.discipline || emp.department)?.label || ep.discipline || '—'} />
            </div>
          )}

          {tab === 'competency' && (
            <div className="space-y-3">
              {Object.keys(ep).length === 0 ? (
                <div className="text-sm text-slate-500 italic">No engineering competency profile recorded.</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(ep).map(([k, v]) => (
                    <Field
                      key={k}
                      label={k.replace(/_/g, ' ')}
                      value={Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—'))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'access' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assigned Roles</div>
                <div className="flex flex-wrap gap-1.5">
                  {(emp.roles || []).length === 0 && <span className="text-sm text-slate-400 italic">No roles assigned</span>}
                  {(emp.roles || []).map(r => (
                    <span key={r.id || r.name} className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {r.display_name || r.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Accessible Modules ({(emp.modules || []).length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {(emp.modules || []).length === 0 && <span className="text-sm text-slate-400 italic">No modules</span>}
                  {(emp.modules || []).map(m => (
                    <span key={m.id || m.code} className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {m.name || m.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="MFA Enabled" value={emp.is_mfa_enabled ? 'Yes' : 'No'} />
              <Field label="Must Change Password" value={emp.must_change_password ? 'Yes' : 'No'} />
              <Field label="Failed Login Attempts" value={String(emp.failed_login_attempts ?? 0)} />
              <Field label="Last Login" value={formatDateTime(emp.last_login_at)} />
              <Field label="Last Login IP" value={emp.last_login_ip} mono />
              <Field label="Account Created" value={formatDateTime(emp.created_at)} />
              <Field label="Last Updated" value={formatDateTime(emp.updated_at)} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Link
            to={HR_ADMIN_USER_LINK(emp.id)}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <HeroIcons.PencilSquareIcon className="w-4 h-4" /> Open in Admin
          </Link>
          {emp.user?.email && (
            <a
              href={`mailto:${emp.user.email}`}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <HeroIcons.EnvelopeIcon className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function HREmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [viewMode, setViewMode] = useState(HR_DEFAULT_VIEW_MODE)
  const [pageSize, setPageSize] = useState(HR_DEFAULT_PAGE_SIZE)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // ──────── Data load ────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await rbacService.getUsers({ page_size: HR_DATA_FETCH_PAGE_SIZE })
      const list = extractUserList(resp)
      setEmployees(list)
    } catch (err) {
      console.error('[HR] Failed to load employees:', err)
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // ──────── Filtering pipeline ────────
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return employees.filter(emp => {
      // Filter chips
      for (const f of HR_FILTERS) {
        const v = filterValues[f.id] || 'all'
        if (!f.match(emp, v)) return false
      }
      if (!q) return true
      // Search
      const hay = [
        fullName(emp),
        emp.user?.email,
        emp.employee_id,
        emp.department,
        emp.job_title,
        emp.location,
        emp.organization_name,
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [employees, filterValues, searchTerm])

  // ──────── Pagination (cards/table modes only) ────────
  useEffect(() => { setPageIndex(0) }, [searchTerm, filterValues, viewMode, pageSize])

  const paginated = useMemo(() => {
    if (viewMode === 'dept') return filteredEmployees
    const start = pageIndex * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, pageIndex, pageSize, viewMode])

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize))

  // ──────── Filter helpers ────────
  const setFilterValue = useCallback((id, value) => {
    setFilterValues(prev => ({ ...prev, [id]: value }))
  }, [])
  const resetFilters = useCallback(() => {
    setFilterValues({})
    setSearchTerm('')
  }, [])

  // ──────── Export ────────
  const handleExport = async (format) => {
    setExportOpen(false)
    setExporting(true)
    try {
      const resp = await rbacService.exportUsers(format)
      const ext = HR_EXPORT_FORMATS.find(f => f.value === format)?.ext || format
      const filename = `employees_${new Date().toISOString().slice(0, 10)}.${ext}`
      const url = window.URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[HR] Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // ──────── Render ────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <nav className="text-xs text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-slate-700">Dashboard</Link>
              <span className="mx-1.5">/</span>
              <span>Human Resources</span>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700 font-medium">Employees</span>
            </nav>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <HeroIcons.UserGroupIcon className="w-7 h-7 text-blue-600" />
              {HR_COPY.pageTitle}
            </h1>
            <p className="text-sm text-slate-600">{HR_COPY.pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchEmployees}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 inline-flex items-center gap-1.5"
            >
              <HeroIcons.ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen(o => !o)}
                disabled={exporting || employees.length === 0}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
                <HeroIcons.ChevronDownIcon className="w-3 h-3" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {HR_EXPORT_FORMATS.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => handleExport(f.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to={HR_ADMIN_USERS_LIST_LINK}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 shadow-sm"
            >
              <HeroIcons.UserPlusIcon className="w-4 h-4" /> Add / Manage in Admin
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip employees={employees} loading={loading} />

        {/* Filters */}
        <FiltersBar
          employees={employees}
          filterValues={filterValues}
          setFilterValue={setFilterValue}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onReset={resetFilters}
        />

        {/* Result count */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> of {employees.length} employees
            {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
          </div>
          {viewMode !== 'dept' && filteredEmployees.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-slate-500">Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              >
                {HR_PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Body */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <HeroIcons.ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="font-semibold text-red-900">{HR_COPY.errorTitle}</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
            <button
              type="button"
              onClick={fetchEmployees}
              className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-44 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && filteredEmployees.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <HeroIcons.UsersIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-semibold text-slate-900">{HR_COPY.emptyTitle}</div>
            <div className="text-sm text-slate-500 mt-1">{HR_COPY.emptySubtitle}</div>
          </div>
        )}

        {!loading && !error && filteredEmployees.length > 0 && (
          <>
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginated.map(emp => (
                  <EmployeeCard key={emp.id} emp={emp} onSelect={setSelectedEmp} />
                ))}
              </div>
            )}
            {viewMode === 'table' && (
              <EmployeesTable employees={paginated} onSelect={setSelectedEmp} />
            )}
            {viewMode === 'dept' && (
              <DepartmentsView employees={filteredEmployees} onSelect={setSelectedEmp} />
            )}

            {/* Pagination */}
            {viewMode !== 'dept' && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page <span className="font-semibold">{pageIndex + 1}</span> of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex >= totalPages - 1}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Discipline legend (always visible footer) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Discipline legend</div>
          <div className="flex flex-wrap gap-1.5">
            {HR_DISCIPLINES.map(d => (
              <span key={d.code} className={`px-2 py-0.5 rounded text-[10px] font-medium ${d.tone}`}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedEmp && <DetailDrawer emp={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  )
}
