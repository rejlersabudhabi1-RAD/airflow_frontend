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
import PeopleNav from '../../components/PeopleNav/PeopleNav'
import TimeSheetAnalytics from './TimeSheetAnalytics'
import { fetchUserHistory, lookupByCode } from '../../services/timesheet.service'
import {
  HR_KPIS,
  HR_FILTERS,
  HR_VIEW_MODES,
  HR_UI,
  HR_DEFAULT_VIEW_MODE,
  HR_CARD_FIELDS,
  HR_TABLE_COLUMNS,
  HR_DETAIL_TABS,
  HR_DEFAULT_DETAIL_TAB,
  HR_DRAWER_WIDTH_DEFAULT,
  HR_DRAWER_WIDTH_BY_TAB,
  HR_PAGE_SIZES,
  HR_DEFAULT_PAGE_SIZE,
  HR_DATA_FETCH_PAGE_SIZE,
  HR_EXPORT_FORMATS,
  HR_COPY,
  HR_ADMIN_USER_LINK,
  HR_ADMIN_USERS_LIST_LINK,
  HR_DISCIPLINES,
  HR_TIMESHEET_RANGES,
  HR_TIMESHEET_DEFAULT_RANGE,
  HR_TIMESHEET_KPIS,
  HR_TIMESHEET_DAILY_COLUMNS,
  HR_TIMESHEET_COPY,
  HR_TIMESHEET_PUNCH_COLUMNS,
  HR_TIMESHEET_PUNCH_SORT,
  HR_TIMESHEET_ACTIVITY_COLUMNS,
  HR_TIMESHEET_ACTIVITY_SORT,
  HR_TIMESHEET_MONTHLY_COLUMNS,
  HR_TIMESHEET_VISUALS,
  formatYearsOfService,
  formatDateTime,
  formatDate,
  fullName,
  getEmail,
  initials,
  matchDiscipline,
  getStatusMeta,
  normalizeEmployee,
} from '../../config/hrEmployees.config'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve a heroicon name from string → component (falls back to UserIcon). */
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const C = HeroIcons[name] || HeroIcons.UserIcon
  return <C className={className} aria-hidden="true" />
}

// ─── Motion gate ────────────────────────────────────────────────────────────
// Driven by HR_UI.animationsEnabled. When animations are off we strip out
// every transition / animate-* / hover-transform class so the page renders
// as plain static records. Flip the config flag to bring motion back.
const ANIM = HR_UI?.animationsEnabled !== false
/** Return the given class string only when animations are enabled. */
const anim = (cls) => (ANIM ? cls : '')
/** Spinner that becomes a static glyph when animations are off. */
const Spinner = ({ className = 'w-4 h-4' }) =>
  ANIM
    ? <HeroIcons.ArrowPathIcon className={`${className} animate-spin`} aria-hidden="true" />
    : <HeroIcons.EllipsisHorizontalIcon className={className} aria-hidden="true" />

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
const KpiStrip = ({ employees, loading }) => {
  // Show only the "essential" KPIs by default to keep the page calm. Users
  // can reveal the rest with a single click. The split is driven by
  // HR_UI.essentialKpiIds — edit the config to change what's prominent.
  const [showAll, setShowAll] = useState(false)
  const essentialIds = HR_UI.essentialKpiIds || []
  const essentials   = HR_KPIS.filter(k => essentialIds.includes(k.id))
  const extras       = HR_KPIS.filter(k => !essentialIds.includes(k.id))
  const visible      = showAll ? [...essentials, ...extras] : essentials
  const useCalm      = HR_UI.calmKpis !== false

  return (
    <div className="space-y-2">
      <div className={`grid gap-3 ${showAll
        ? 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-8'
        : 'grid-cols-2 sm:grid-cols-4'}`}>
        {visible.map((kpi) => (
          <div
            key={kpi.id}
            className={useCalm
              ? `rounded-xl border ${kpi.calmTone || 'bg-slate-50 text-slate-700 border-slate-100'} p-4`
              : `relative overflow-hidden rounded-xl bg-gradient-to-br ${kpi.accent} text-white p-4 shadow-md`}
          >
            <div className="flex items-center justify-between">
              <Icon name={kpi.icon} className={useCalm ? 'w-5 h-5 opacity-80' : 'w-6 h-6 opacity-80'} />
              <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold truncate">{kpi.label}</span>
            </div>
            <div className="mt-2 text-3xl font-bold leading-tight tabular-nums">
              {loading
                ? (ANIM
                    ? <span className="inline-block w-10 h-7 bg-current opacity-20 animate-pulse rounded" />
                    : <span className="opacity-50">{HR_UI.staticLoadingPlaceholder || '…'}</span>)
                : kpi.compute(employees)}
            </div>
            <div className="mt-1 text-[11px] opacity-70 line-clamp-1">{kpi.sub}</div>
          </div>
        ))}
      </div>
      {extras.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            {showAll ? <HeroIcons.ChevronUpIcon className="w-3.5 h-3.5" /> : <HeroIcons.ChevronDownIcon className="w-3.5 h-3.5" />}
            {showAll ? 'Show fewer metrics' : `Show all ${HR_KPIS.length} metrics`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Filters Bar
// ─────────────────────────────────────────────────────────────────────────────
const FiltersBar = ({ employees, filterValues, setFilterValue, searchTerm, setSearchTerm, viewMode, setViewMode, onReset, onSubmitSearch, searching }) => {
  // Local draft so users can type freely and commit on Enter / Search button
  // click. Mirrors `searchTerm` so external resets (Reset button) still flow
  // back into the input. Filtering remains driven by the committed
  // `searchTerm` prop — no change to core filter logic in the parent.
  const [draft, setDraft] = useState(searchTerm)
  useEffect(() => { setDraft(searchTerm) }, [searchTerm])
  // Collapse the filter dropdowns by default — soft-coded in HR_UI. Active
  // filters bubble up as a count badge so nothing is hidden silently.
  const [filtersOpen, setFiltersOpen] = useState(!HR_UI.filtersCollapsedByDefault)
  const activeFilterCount = useMemo(
    () => HR_FILTERS.reduce((n, f) => n + (filterValues[f.id] && filterValues[f.id] !== 'all' ? 1 : 0), 0),
    [filterValues]
  )

  const commitSearch = (e) => {
    e?.preventDefault?.()
    const term = draft.trim()
    setSearchTerm(term)
    onSubmitSearch?.(term)
  }
  const clearSearch  = () => { setDraft(''); setSearchTerm('') }

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
        <form onSubmit={commitSearch} className="relative flex-1 flex gap-2" role="search">
          <div className="relative flex-1">
            <HeroIcons.MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={HR_COPY.searchPlaceholder}
              aria-label={HR_COPY.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {draft && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={HR_COPY.searchClearLabel}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${anim('transition')}`}
              >
                <HeroIcons.XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching}
            className={`inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait text-white text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${anim('transition')}`}
          >
            {searching
              ? <Spinner className="w-4 h-4" />
              : <HeroIcons.MagnifyingGlassIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">{HR_COPY.searchButtonLabel}</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border ${anim('transition')} ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
            aria-expanded={filtersOpen}
            aria-controls="hr-filters-panel"
          >
            <HeroIcons.AdjustmentsHorizontalIcon className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {activeFilterCount}
              </span>
            )}
            <HeroIcons.ChevronDownIcon className={`w-3 h-3 ${anim('transition-transform')} ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            {HR_VIEW_MODES.map(vm => (
              <button
                key={vm.id}
                type="button"
                onClick={() => setViewMode(vm.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${anim('transition')} ${
                  viewMode === vm.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={viewMode === vm.id}
              >
                <Icon name={vm.icon} className="w-4 h-4" />
                {vm.label}
              </button>
            ))}
          </div>
          {(activeFilterCount > 0 || searchTerm) && (
            <button
              type="button"
              onClick={onReset}
              className={`px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md ${anim('transition')}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter selects — collapsible to keep the toolbar clean */}
      {filtersOpen && (
        <div id="hr-filters-panel" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-100">
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
      )}
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
  <div className={`group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg p-4 flex flex-col ${anim('transition')}`}>
    <button
      type="button"
      onClick={() => onSelect(emp)}
      className="text-left flex-1 flex flex-col"
    >
      <div className="flex items-start gap-3">
        <Avatar emp={emp} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-slate-900 truncate">{fullName(emp)}</div>
            <StatusBadge status={emp.status} />
          </div>
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
    </button>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSelect(emp, 'timesheet') }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 text-blue-700 font-medium"
        title="Open consolidated time-sheet report"
      >
        <HeroIcons.ClockIcon className="w-3.5 h-3.5" /> Time Sheet
      </button>
      <button
        type="button"
        onClick={() => onSelect(emp)}
        className="text-blue-600 hover:underline"
      >
        View details →
      </button>
    </div>
  </div>
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
                        <div className="text-sm font-medium text-slate-900">{v}</div>
                      </div>
                    </td>
                  )
                }
                if (c.id === 'status') return <td key={c.id} className="px-3 py-2"><StatusBadge status={v} /></td>
                if (c.id === 'last_login') return <td key={c.id} className="px-3 py-2 text-xs text-slate-600">{formatDateTime(v)}</td>
                if (c.id === 'email') {
                  const mail = getEmail(emp)
                  return (
                    <td key={c.id} className="px-3 py-2 text-sm text-slate-700">
                      {mail
                        ? <a
                            href={`mailto:${mail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-700 hover:text-blue-900 hover:underline truncate inline-block max-w-[14rem]"
                            title={mail}
                          >
                            {mail}
                          </a>
                        : <span className="text-slate-400">—</span>}
                    </td>
                  )
                }
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
                className={`flex items-center gap-2 px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-full text-xs ${anim('transition')}`}
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

// ─────────────────────────────────────────────────────────────────────────────
// Per-user timesheet panel — rendered as a tab inside the drawer.
// Reuses the existing `/api/v1/timesheet/user/` endpoint (no core change).
// ─────────────────────────────────────────────────────────────────────────────
const HR_KPI_TONES = {
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  violet:  'bg-violet-50 text-violet-700 border-violet-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  sky:     'bg-sky-50 text-sky-700 border-sky-100',
  rose:    'bg-rose-50 text-rose-700 border-rose-100',
}

const _toISO = (d) => d.toISOString().slice(0, 10)
const _rangeToDates = (rangeId) => {
  const today = new Date()
  const cfg = HR_TIMESHEET_RANGES.find(r => r.id === rangeId) || HR_TIMESHEET_RANGES[0]
  if (cfg.preset === 'mtd') {
    return { from: _toISO(new Date(today.getFullYear(), today.getMonth(), 1)), to: _toISO(today) }
  }
  if (cfg.preset === 'ytd') {
    return { from: _toISO(new Date(today.getFullYear(), 0, 1)), to: _toISO(today) }
  }
  const from = new Date(today)
  from.setDate(today.getDate() - (cfg.days - 1))
  return { from: _toISO(from), to: _toISO(today) }
}

const _formatMonth = (ym) => {
  if (!ym || ym.length < 7) return ym || '—'
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
}

// ─── Visual sub-components (pure CSS/SVG — no chart library) ────────────────
// Soft-coded via HR_TIMESHEET_VISUALS: change colours / target / ring size
// in the config and these renderers update without a code change.

const _bandFor = (hours) => {
  for (const b of HR_TIMESHEET_VISUALS.hourBands) {
    if (hours <= b.upTo) return b
  }
  return HR_TIMESHEET_VISUALS.hourBands[HR_TIMESHEET_VISUALS.hourBands.length - 1]
}

const UtilisationRing = ({ value, max, label, sublabel }) => {
  const size   = HR_TIMESHEET_VISUALS.ringSize
  const stroke = HR_TIMESHEET_VISUALS.ringStroke
  const r      = (size - stroke) / 2
  const c      = 2 * Math.PI * r
  const pct    = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const dash   = c * pct
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="white" strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={ANIM ? { transition: 'stroke-dasharray 600ms ease' } : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="text-3xl font-extrabold leading-none tabular-nums">{value.toFixed(0)}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-80 mt-0.5">{label}</div>
        {sublabel && <div className="text-[10px] opacity-70 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  )
}

const ActivityBars = ({ rows }) => {
  const target = HR_TIMESHEET_VISUALS.targetHoursPerDay || 8
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-slate-500 italic px-1 py-4">{HR_TIMESHEET_COPY.emptyActivity}</div>
  }
  // Show the most recent N days first (latest at top of the list, but we
  // sort ascending so the visual reads left-to-right by date naturally).
  const sorted = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const maxHours = Math.max(target * 1.25, ...sorted.map(r => Number(r.hours_worked ?? r.hours ?? 0)))
  return (
    <div className="space-y-1.5">
      {sorted.map(r => {
        const h = Number(r.hours_worked ?? r.hours ?? 0)
        const pct = maxHours > 0 ? (h / maxHours) * 100 : 0
        const band = _bandFor(h)
        const d = new Date(r.date)
        const dayName = isNaN(d) ? '' : d.toLocaleDateString(undefined, { weekday: 'short' })
        return (
          <div key={r.date} className="grid grid-cols-[80px_1fr_60px] items-center gap-2 group">
            <div className="text-[11px] text-slate-500 font-mono">
              <span className="text-slate-700 font-semibold">{r.date}</span>
              <span className="ml-1 opacity-60">{dayName}</span>
            </div>
            <div className="relative h-5 bg-slate-100 rounded overflow-hidden">
              <div
                className={`h-full ${band.color} ${anim('transition-all duration-500 ease-out')}`}
                style={{ width: `${pct}%` }}
                title={`${h.toFixed(2)}h — ${band.label}`}
              />
              {/* Target marker */}
              <div
                className="absolute top-0 bottom-0 w-px bg-slate-400/60"
                style={{ left: `${Math.min(100, (target / maxHours) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] font-semibold text-slate-700 tabular-nums text-right">
              {h > 0 ? `${h.toFixed(1)}h` : '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const HourBandLegend = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
    {HR_TIMESHEET_VISUALS.hourBands.map(b => (
      <div key={b.label} className="inline-flex items-center gap-1">
        <span className={`inline-block w-2.5 h-2.5 rounded ${b.color}`} />
        <span>{b.label}</span>
      </div>
    ))}
  </div>
)

const EmployeeTimesheetPanel = ({ emp }) => {
  const [rangeId, setRangeId] = useState(HR_TIMESHEET_DEFAULT_RANGE)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPunches, setShowPunches] = useState(false)

  // Hand the backend every identifier we know about. It will OR-match on
  // biometric `employee_code` and `email`, and resolve any missing piece from
  // the RAD AI UserProfile via `user_id` — so even users whose RAD AI
  // `employee_id` doesn't equal their Matrix code still get their report.
  const lookup = useMemo(() => ({
    user_id:       emp?.id || emp?.user?.id || '',
    employee_code: emp?.employee_id || emp?.employee_code || '',
    email:         getEmail(emp),
  }), [emp])

  useEffect(() => {
    if (!emp) return
    if (!lookup.user_id && !lookup.employee_code && !lookup.email) {
      setData(null); setError(null); return
    }
    let cancelled = false
    const { from, to } = _rangeToDates(rangeId)
    setLoading(true); setError(null)
    fetchUserHistory({
      user_id:         lookup.user_id       || undefined,
      employee_code:   lookup.employee_code || undefined,
      email:           lookup.email         || undefined,
      from, to,
      include_punches: showPunches ? 'true' : undefined,
    })
      .then(res => { if (!cancelled) setData(res) })
      .catch(err => { if (!cancelled) setError(err?.response?.data?.error || err?.message || 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [emp?.id, rangeId, showPunches, lookup.user_id, lookup.employee_code, lookup.email])

  const summary  = data?.summary  || {}
  const monthly  = data?.monthly_breakdown || []
  const daily    = data?.rows || []
  const punches  = data?.punches || []
  const resolved = data?.resolved || {}
  const diag     = data?.diagnostic || null
  const noMatch  = !loading && !error && data && daily.length === 0 && (summary.range_days || 0) > 0

  const exportCsv = () => {
    if (!daily.length) return
    const header = HR_TIMESHEET_DAILY_COLUMNS.map(c => c.label).join(',')
    const lines  = daily.map(r => HR_TIMESHEET_DAILY_COLUMNS.map(c => String(c.accessor(r)).replace(/,/g, ' ')).join(','))
    const blob   = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href = url
    a.download = `timesheet_${lookup.employee_code || lookup.email}_${data?.from || ''}_${data?.to || ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!lookup.user_id && !lookup.employee_code && !lookup.email) {
    return <div className="text-sm text-slate-500 italic">{HR_TIMESHEET_COPY.noMatchState}</div>
  }

  // ─── Derived metrics for hero band ──────────────────────────────────────
  const totalHours    = Number(summary.hours_worked || 0)
  const daysPresent   = Number(summary.days_present || 0)
  const rangeDays     = Number(summary.range_days || 0)
  const avgPerDay     = daysPresent > 0 ? totalHours / daysPresent : 0
  const targetHours   = rangeDays * HR_TIMESHEET_VISUALS.targetHoursPerDay
  const utilisationPc = targetHours > 0 ? Math.round((totalHours / targetHours) * 100) : 0

  return (
    <div className="space-y-5">
      {/* ─── Hero band ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative p-5 flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Ring */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <UtilisationRing
              value={totalHours}
              max={targetHours || totalHours || 1}
              label="hours"
              sublabel={targetHours ? `${utilisationPc}% of target` : ''}
            />
          </div>

          {/* Stats row */}
          <div className="flex-1 grid grid-cols-3 gap-3 min-w-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
              <div className="text-[10px] uppercase tracking-wider opacity-80">Total Hours</div>
              <div className="mt-1 text-3xl font-extrabold tabular-nums leading-none">{totalHours.toFixed(1)}</div>
              <div className="mt-1 text-[11px] opacity-75">across {rangeDays} day{rangeDays === 1 ? '' : 's'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
              <div className="text-[10px] uppercase tracking-wider opacity-80">Days Present</div>
              <div className="mt-1 text-3xl font-extrabold tabular-nums leading-none">{daysPresent}</div>
              <div className="mt-1 text-[11px] opacity-75">
                {rangeDays > 0 ? `${Math.round((daysPresent / rangeDays) * 100)}% attendance` : ''}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
              <div className="text-[10px] uppercase tracking-wider opacity-80">Avg per Day</div>
              <div className="mt-1 text-3xl font-extrabold tabular-nums leading-none">{avgPerDay.toFixed(2)}</div>
              <div className="mt-1 text-[11px] opacity-75">target {HR_TIMESHEET_VISUALS.targetHoursPerDay}h</div>
            </div>
          </div>
        </div>

        {/* Controls strip */}
        <div className="relative px-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full pl-3 pr-1 py-1 border border-white/20">
            <span className="text-[10px] uppercase tracking-wider opacity-90 font-semibold">
              {HR_TIMESHEET_COPY.rangeLabel}
            </span>
            <select
              value={rangeId}
              onChange={(e) => setRangeId(e.target.value)}
              className="text-xs font-semibold bg-white/95 text-slate-800 rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {HR_TIMESHEET_RANGES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPunches(v => !v)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm ${anim('transition')}`}
            >
              {showPunches ? HR_TIMESHEET_COPY.hidePunches : HR_TIMESHEET_COPY.showPunches}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!daily.length}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-sm ${anim('transition')}`}
            >
              <HeroIcons.ArrowDownTrayIcon className="w-3.5 h-3.5" />
              {HR_TIMESHEET_COPY.exportCsv}
            </button>
          </div>
        </div>
      </div>

      {/* Loading / error / empty states */}
      {loading && (
        <div className="text-sm text-slate-500 flex items-center gap-2 px-1">
          <Spinner className="w-4 h-4" />
          {HR_TIMESHEET_COPY.loadingState}
        </div>
      )}
      {error && !loading && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {HR_TIMESHEET_COPY.errorState} <span className="opacity-70">({String(error)})</span>
        </div>
      )}
      {noMatch && !loading && !error && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <div>{HR_TIMESHEET_COPY.noMatchState}</div>
          {(resolved.employee_code || resolved.email) && (
            <div className="mt-1 text-[11px] text-amber-600 font-mono">
              Tried: {resolved.employee_code ? `code=${resolved.employee_code}` : ''}
              {resolved.employee_code && resolved.email ? '  ·  ' : ''}
              {resolved.email ? `email=${resolved.email}` : ''}
            </div>
          )}
          {diag && (
            <details className="mt-2 text-[11px]">
              <summary className="cursor-pointer text-amber-700 hover:text-amber-900 font-medium">
                Diagnostic details (for IT)
              </summary>
              <div className="mt-1.5 font-mono text-amber-800 space-y-0.5">
                <div>Input email: <span className="text-amber-900">{diag.input_email || '—'}</span></div>
                <div>Input code:  <span className="text-amber-900">{diag.input_code  || '—'}</span></div>
                <div>RAD profile matched: <span className="text-amber-900">{diag.profile_matched ? 'yes' : 'no'}</span></div>
                <div>Master rows by email: <span className="text-amber-900">{(diag.master_email_hits || []).length}</span></div>
                <div>Master rows by code:  <span className="text-amber-900">{(diag.master_code_hits  || []).length}</span></div>
                <div>Name-resolver used:   <span className="text-amber-900">{diag.name_resolver_used ? 'yes' : 'no'}</span></div>
                <div>Resolved aliases (emails): <span className="text-amber-900">{(diag.final_emails || []).join(', ') || '—'}</span></div>
                <div>Resolved aliases (codes):  <span className="text-amber-900">{(diag.final_codes  || []).join(', ') || '—'}</span></div>
                <div>Matched events in range:   <span className="text-amber-900">{diag.matched_events_in_range ?? '—'}</span></div>
                <div>Matched events all time:   <span className="text-amber-900">{diag.matched_events_all_time ?? '—'}</span></div>
                {(diag.master_email_hits || []).length === 0 && (diag.master_code_hits || []).length === 0 && (
                  <div className="mt-1 text-rose-700">
                    Likely cause: BiometricUserMaster has no row matching this user&apos;s email or code.
                    Run the office-side <span className="font-bold">timesheet_mirror_sync.py --users</span> backfill once.
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ─── KPI tiles (wider grid when drawer is large) ───────────────── */}
      {!loading && !error && data && daily.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {HR_TIMESHEET_KPIS.map(k => (
            <div
              key={k.id}
              className={`relative overflow-hidden rounded-xl border p-3 flex items-start gap-2.5 ${anim('hover:-translate-y-0.5 transition-transform')} ${HR_KPI_TONES[k.tone] || HR_KPI_TONES.blue}`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center">
                <Icon name={k.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 truncate">{k.label}</div>
                <div className="text-xl font-extrabold leading-tight tabular-nums truncate">{k.accessor(summary)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Two-column body on wide drawers ────────────────────────────── */}
      {!loading && daily.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* LEFT: Daily activity table + monthly breakdown table (plain text) */}
          <div className="xl:col-span-3 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {HR_TIMESHEET_COPY.activityTitle}
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      {HR_TIMESHEET_ACTIVITY_COLUMNS.map(c => (
                        <th key={c.id} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...daily]
                      .map(r => {
                        // Attach the band label so the soft-coded accessor
                        // can render a plain-text status without re-running
                        // the band lookup in the component.
                        const h = Number(r.hours_worked ?? r.hours ?? 0)
                        return { ...r, __bandLabel: _bandFor(h)?.label || '' }
                      })
                      .sort((a, b) => {
                        const av = String(a.date || '')
                        const bv = String(b.date || '')
                        return HR_TIMESHEET_ACTIVITY_SORT === 'asc'
                          ? av.localeCompare(bv)
                          : bv.localeCompare(av)
                      })
                      .map(r => (
                        <tr key={r.date}>
                          {HR_TIMESHEET_ACTIVITY_COLUMNS.map(c => (
                            <td
                              key={c.id}
                              className={`px-3 py-1.5 text-slate-700 whitespace-nowrap ${c.mono ? 'font-mono' : ''}`}
                            >
                              {c.accessor(r)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {monthly.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {HR_TIMESHEET_COPY.monthlyTitle}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {HR_TIMESHEET_MONTHLY_COLUMNS.map(c => (
                          <th key={c.id} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthly.map(m => {
                        // Attach the human-readable month label so the
                        // accessor stays purely declarative.
                        const row = { ...m, __monthLabel: _formatMonth(m.month) }
                        return (
                          <tr key={m.month}>
                            {HR_TIMESHEET_MONTHLY_COLUMNS.map(c => (
                              <td
                                key={c.id}
                                className={`px-3 py-1.5 text-slate-700 whitespace-nowrap ${c.mono ? 'font-mono' : ''}`}
                              >
                                {c.accessor(row)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Daily table */}
          <div className="xl:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {HR_TIMESHEET_COPY.dailyTitle}
              </div>
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      {HR_TIMESHEET_DAILY_COLUMNS.map(c => (
                        <th key={c.id} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daily.map(r => (
                      <tr key={r.date} className="hover:bg-blue-50/40">
                        {HR_TIMESHEET_DAILY_COLUMNS.map(c => (
                          <td key={c.id} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                            {c.accessor(r)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hourly raw punches — plain text records (no chips/colours) ── */}
      {!loading && showPunches && punches.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-4 pt-3 pb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {HR_TIMESHEET_COPY.punchesTitle}
            </div>
            {HR_TIMESHEET_COPY.punchesSubtitle && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {HR_TIMESHEET_COPY.punchesSubtitle} · {punches.length} record{punches.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {HR_TIMESHEET_PUNCH_COLUMNS.map(c => (
                    <th key={c.id} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-slate-500">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...punches]
                  .sort((a, b) => {
                    const av = String(a.event_time || a.date || '')
                    const bv = String(b.event_time || b.date || '')
                    return HR_TIMESHEET_PUNCH_SORT === 'asc'
                      ? av.localeCompare(bv)
                      : bv.localeCompare(av)
                  })
                  .map((p, i) => (
                    <tr key={`${p.event_time}-${i}`}>
                      {HR_TIMESHEET_PUNCH_COLUMNS.map(c => (
                        <td
                          key={c.id}
                          className={`px-3 py-1.5 text-slate-700 whitespace-nowrap ${c.mono ? 'font-mono' : ''}`}
                        >
                          {c.accessor(p)}
                        </td>
                      ))}
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

const DetailDrawer = ({ emp, loading, onClose, initialTab = null }) => {
  const [tab, setTab] = useState(initialTab || HR_DEFAULT_DETAIL_TAB)
  useEffect(() => { setTab(initialTab || HR_DEFAULT_DETAIL_TAB) }, [emp?.id, initialTab])

  if (!emp) return null
  const ep = emp.engineer_profile || {}
  // Soft-coded width: tabs with dense data (timesheet, competency, access)
  // get a wider canvas; everything else stays compact. Adding a tab id to
  // HR_DRAWER_WIDTH_BY_TAB in the config widens the drawer for that tab.
  const widthClass = HR_DRAWER_WIDTH_BY_TAB[tab] || HR_DRAWER_WIDTH_DEFAULT

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
      />
      <aside className={`w-full ${widthClass} bg-white shadow-2xl flex flex-col ${anim('transition-[max-width] duration-300 ease-out')}`}>
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="flex items-start gap-4">
            <Avatar emp={emp} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold truncate">{fullName(emp)}</div>
              <div className="text-sm opacity-90 truncate">{emp.job_title || 'No designation'}</div>
              <div className="text-xs opacity-75 truncate">{getEmail(emp)}</div>
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
          {loading && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] opacity-80">
              <Spinner className="w-3 h-3" />
              Loading full profile…
            </div>
          )}
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
              <Field label="Email" value={getEmail(emp)} />
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

          {tab === 'timesheet' && (
            <EmployeeTimesheetPanel emp={emp} />
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
          {getEmail(emp) && (
            <a
              href={`mailto:${getEmail(emp)}`}
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
  const [selectedTab, setSelectedTab] = useState(null)  // optional initial tab when opening drawer
  const [exporting, setExporting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const openEmp = useCallback((emp, tab = null) => {
    setSelectedTab(tab)
    setSelectedEmp(emp)
  }, [])

  // ──────── Data load ────────
  // Always normalise so downstream code can rely on a single shape (nested
  // `user`, `roles`, `modules`, `engineer_profile`) regardless of whether
  // the backend served the lightweight list or the rich detail serializer.
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await rbacService.getUsers({ page_size: HR_DATA_FETCH_PAGE_SIZE })
      const list = extractUserList(resp).map(normalizeEmployee)
      setEmployees(list)
    } catch (err) {
      console.error('[HR] Failed to load employees:', err)
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // ──────── Lazy-load full detail when drawer opens ────────
  // The list endpoint returns a thin payload (no roles list, modules,
  // engineer_profile, MFA, security fields). Fetch the full record on demand
  // so the drawer renders the rich detail tabs without bloating the list.
  const [detailLoading, setDetailLoading] = useState(false)
  useEffect(() => {
    if (!selectedEmp?.id) return
    let cancelled = false
    setDetailLoading(true)
    rbacService.getUserById(selectedEmp.id)
      .then((resp) => {
        if (cancelled) return
        const full = normalizeEmployee(resp?.data ?? resp)
        // Merge — keep any list-only fields, overlay the rich fields
        setSelectedEmp(prev => prev && prev.id === full.id ? { ...prev, ...full } : prev)
      })
      .catch((err) => console.error('[HR] Failed to load employee detail:', err))
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmp?.id])

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
      // Search — `employee_id` covers RAD AI codes; if the user types a pure
      // numeric badge number the parent component additionally fires a
      // reverse-lookup against the biometric backend (see handleSubmitSearch).
      const hay = [
        fullName(emp),
        getEmail(emp),
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

  // ──────── Biometric badge-code reverse lookup ────────
  // When the user types a pure-numeric query that doesn't match anything
  // locally (e.g. `22972`), ask the timesheet backend who owns that badge
  // and auto-open the matching RAD AI employee drawer. Pattern + copy come
  // from HR_COPY so the feature stays soft-coded.
  const [searching, setSearching] = useState(false)
  const [searchNotice, setSearchNotice] = useState(null)  // {kind:'info'|'warn'|'error', text}
  const handleSubmitSearch = useCallback(async (term) => {
    setSearchNotice(null)
    const t = (term || '').trim()
    if (!t || !HR_COPY.searchBiometricCodePattern.test(t)) return
    // If local list already finds it via employee_id, no need to call backend.
    const localHit = employees.find(e =>
      String(e.employee_id || '').toLowerCase() === t.toLowerCase()
    )
    if (localHit) { openEmp(localHit); return }
    setSearching(true)
    try {
      const resp = await lookupByCode(t)
      if (!resp?.found) {
        setSearchNotice({ kind: 'warn', text: `${HR_COPY.searchLookupMissingTitle}: ${HR_COPY.searchLookupMissingBody}` })
        return
      }
      const email = String(resp.employee_email || '').toLowerCase().trim()
      const name  = String(resp.employee_name  || '').toLowerCase().trim()
      // Try email exact first, then full-name fuzzy.
      let match = email ? employees.find(e => getEmail(e).toLowerCase() === email) : null
      if (!match && name) {
        const tokens = name.split(/\s+/).filter(t => t.length >= 3)
        match = employees.find(e => {
          const hay = `${fullName(e)}`.toLowerCase()
          return tokens.length && tokens.every(tok => hay.includes(tok))
        })
      }
      if (match) {
        openEmp(match)
      } else {
        const body = HR_COPY.searchLookupUnmappedBody
          .replace('{name}', resp.employee_name || '—')
          .replace('{email}', resp.employee_email || '—')
        setSearchNotice({ kind: 'warn', text: `${HR_COPY.searchLookupUnmappedTitle}: ${body}` })
      }
    } catch (err) {
      console.error('[HR] biometric lookup failed:', err)
      setSearchNotice({ kind: 'error', text: err?.response?.data?.error || err?.message || 'Lookup failed' })
    } finally {
      setSearching(false)
    }
  }, [employees, openEmp])

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
        {/* Cross-link nav (Profile / HR Directory / User Management) */}
        <PeopleNav activeId="hr" />

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
              {loading
                ? <Spinner className="w-4 h-4" />
                : <HeroIcons.ArrowPathIcon className="w-4 h-4" />} Refresh
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
        {viewMode !== 'timesheet' && <KpiStrip employees={employees} loading={loading} />}

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
          onSubmitSearch={handleSubmitSearch}
          searching={searching}
        />

        {searchNotice && (
          <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm border ${
            searchNotice.kind === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <HeroIcons.ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="flex-1">{searchNotice.text}</span>
            <button
              type="button"
              onClick={() => setSearchNotice(null)}
              className="flex-shrink-0 p-0.5 hover:bg-black/5 rounded"
              aria-label="Dismiss"
            >
              <HeroIcons.XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Time Sheet view replaces the directory body entirely */}
        {viewMode === 'timesheet' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <TimeSheetAnalytics />
          </div>
        )}

        {viewMode !== 'timesheet' && (<>
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
          ANIM
            ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-44 animate-pulse" />
                ))}
              </div>
            )
            : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500 inline-flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                Loading employees…
              </div>
            )
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
                  <EmployeeCard key={emp.id} emp={emp} onSelect={openEmp} />
                ))}
              </div>
            )}
            {viewMode === 'table' && (
              <EmployeesTable employees={paginated} onSelect={openEmp} />
            )}
            {viewMode === 'dept' && (
              <DepartmentsView employees={filteredEmployees} onSelect={openEmp} />
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
        </>)}
      </div>

      {/* Detail drawer */}
      {selectedEmp && (
        <DetailDrawer
          emp={selectedEmp}
          loading={detailLoading}
          initialTab={selectedTab}
          onClose={() => { setSelectedEmp(null); setSelectedTab(null) }}
        />
      )}
    </div>
  )
}
