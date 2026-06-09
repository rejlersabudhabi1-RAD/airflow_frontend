/**
 * HR Employees Configuration (Soft-Coded)
 * ----------------------------------------
 * Centralised, framework-friendly configuration for the HR > Employees page
 * (`/hr/employees`). Every threshold, filter option, KPI definition, status
 * label, column, view-mode and tab is defined here — the page component
 * should consume this config and stay free of magic values.
 *
 * Domain context: oil & gas EPC consultancy, multi-discipline engineering
 * workforce, multi-organisation (legal entities), long employee tenures.
 *
 * To extend:
 *   - Add a new KPI → push to HR_KPIS (provide id, label, icon, compute)
 *   - Add a new filter → push to HR_FILTERS
 *   - Add a new view mode → push to HR_VIEW_MODES + handle render in the page
 *   - Add a new detail tab → push to HR_DETAIL_TABS + add a renderer
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATUSES — keep in sync with backend UserProfile.STATUS_CHOICES
// ─────────────────────────────────────────────────────────────────────────────
export const HR_STATUSES = {
  active:    { label: 'Active',     dot: 'bg-emerald-500', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inactive',   dot: 'bg-slate-400',   tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  suspended: { label: 'Suspended',  dot: 'bg-red-500',     tone: 'bg-red-100 text-red-700 border-red-200' },
  pending:   { label: 'Pending',    dot: 'bg-amber-500',   tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  on_leave:  { label: 'On Leave',   dot: 'bg-blue-500',    tone: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export const getStatusMeta = (status) =>
  HR_STATUSES[status] || { label: status || 'Unknown', dot: 'bg-slate-400', tone: 'bg-slate-100 text-slate-600 border-slate-200' }

// ─────────────────────────────────────────────────────────────────────────────
// 2. ENGINEERING DISCIPLINES — Oil & Gas EPC taxonomy
//    These are surfaced as filters and as colour tags on employee cards.
//    Source field: rbac/users → engineer_profile.discipline (free text fallback
//    to UserProfile.department).
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DISCIPLINES = [
  { code: 'process',      label: 'Process',           tone: 'bg-purple-100 text-purple-700' },
  { code: 'piping',       label: 'Piping',            tone: 'bg-cyan-100 text-cyan-700' },
  { code: 'mechanical',   label: 'Mechanical',        tone: 'bg-orange-100 text-orange-700' },
  { code: 'electrical',   label: 'Electrical',        tone: 'bg-yellow-100 text-yellow-700' },
  { code: 'instrument',   label: 'Instrumentation',   tone: 'bg-pink-100 text-pink-700' },
  { code: 'civil',        label: 'Civil & Structural', tone: 'bg-stone-100 text-stone-700' },
  { code: 'safety',       label: 'HSE / Loss Prev.',  tone: 'bg-red-100 text-red-700' },
  { code: 'quality',      label: 'Quality / QA-QC',   tone: 'bg-lime-100 text-lime-700' },
  { code: 'project',      label: 'Project Management', tone: 'bg-indigo-100 text-indigo-700' },
  { code: 'procurement',  label: 'Procurement',       tone: 'bg-teal-100 text-teal-700' },
  { code: 'commissioning', label: 'Commissioning',    tone: 'bg-rose-100 text-rose-700' },
  { code: 'admin',        label: 'Admin & Support',   tone: 'bg-slate-100 text-slate-700' },
  { code: 'hr',           label: 'Human Resources',   tone: 'bg-fuchsia-100 text-fuchsia-700' },
  { code: 'finance',      label: 'Finance',           tone: 'bg-emerald-100 text-emerald-700' },
  { code: 'it',           label: 'IT / Digital',      tone: 'bg-sky-100 text-sky-700' },
]

export const matchDiscipline = (raw) => {
  if (!raw) return null
  const needle = String(raw).toLowerCase()
  return HR_DISCIPLINES.find(d => needle.includes(d.code) || needle.includes(d.label.toLowerCase().split(/[\s/]/)[0])) || null
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMPLOYMENT TYPES — soft-coded so HR can add new contract categories.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_EMPLOYMENT_TYPES = [
  { code: 'permanent',  label: 'Permanent' },
  { code: 'contract',   label: 'Contract' },
  { code: 'consultant', label: 'Consultant' },
  { code: 'intern',     label: 'Intern' },
  { code: 'secondment', label: 'Secondment' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. KPI CARDS — each KPI is a pure function over the loaded employee list
// ─────────────────────────────────────────────────────────────────────────────
const daysAgo = (iso, n) => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && (Date.now() - t) <= n * 86400000
}

const yearsSince = (iso) => {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, (Date.now() - t) / (365.25 * 86400000))
}

export const HR_KPIS = [
  {
    id: 'headcount',
    label: 'Total Headcount',
    accent: 'from-blue-500 to-indigo-600',
    icon: 'UsersIcon',
    compute: (list) => list.length,
    sub: 'All registered employees',
  },
  {
    id: 'active',
    label: 'Active',
    accent: 'from-emerald-500 to-teal-600',
    icon: 'CheckBadgeIcon',
    compute: (list) => list.filter(e => e.status === 'active').length,
    sub: 'Currently working',
  },
  {
    id: 'pending_onboarding',
    label: 'Pending Onboarding',
    accent: 'from-amber-500 to-orange-600',
    icon: 'ClockIcon',
    compute: (list) => list.filter(e => e.status === 'pending').length,
    sub: 'Awaiting first login / setup',
  },
  {
    id: 'new_joiners_30d',
    label: 'New Joiners (30d)',
    accent: 'from-purple-500 to-fuchsia-600',
    icon: 'SparklesIcon',
    compute: (list) => list.filter(e => daysAgo(e.created_at, 30)).length,
    sub: 'Joined in the last 30 days',
  },
  {
    id: 'departments',
    label: 'Departments',
    accent: 'from-cyan-500 to-blue-600',
    icon: 'BuildingOffice2Icon',
    compute: (list) => new Set(list.map(e => (e.department || '').trim()).filter(Boolean)).size,
    sub: 'Distinct department codes',
  },
  {
    id: 'disciplines',
    label: 'Disciplines Covered',
    accent: 'from-rose-500 to-pink-600',
    icon: 'BeakerIcon',
    compute: (list) => new Set(list.map(e => matchDiscipline(e.engineer_profile?.discipline || e.department)?.code).filter(Boolean)).size,
    sub: 'Engineering specialisations',
  },
  {
    id: 'mfa_adoption',
    label: 'MFA Adoption',
    accent: 'from-indigo-500 to-violet-600',
    icon: 'ShieldCheckIcon',
    compute: (list) => list.length === 0 ? '0%' : `${Math.round((list.filter(e => e.is_mfa_enabled).length / list.length) * 100)}%`,
    sub: 'Two-factor enabled accounts',
  },
  {
    id: 'long_tenure',
    label: 'Veterans (10y+)',
    accent: 'from-yellow-500 to-amber-600',
    icon: 'TrophyIcon',
    compute: (list) => list.filter(e => yearsSince(e.created_at) >= 10).length,
    sub: '10+ years of service',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 5. FILTERS — declarative. The page renders a select per entry.
//    `optionsFrom: 'static'` uses `options` verbatim, otherwise the page derives
//    options from the loaded data using `optionsFrom` as the row accessor.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_FILTERS = [
  {
    id: 'status',
    label: 'Status',
    optionsFrom: 'static',
    options: [
      { value: 'all', label: 'All statuses' },
      ...Object.entries(HR_STATUSES).map(([v, m]) => ({ value: v, label: m.label })),
    ],
    match: (emp, val) => val === 'all' || emp.status === val,
  },
  {
    id: 'department',
    label: 'Department',
    optionsFrom: (emp) => emp.department,
    placeholder: 'All departments',
    match: (emp, val) => val === 'all' || (emp.department || '') === val,
  },
  {
    id: 'discipline',
    label: 'Discipline',
    optionsFrom: 'static',
    options: [
      { value: 'all', label: 'All disciplines' },
      ...HR_DISCIPLINES.map(d => ({ value: d.code, label: d.label })),
    ],
    match: (emp, val) => val === 'all' || matchDiscipline(emp.engineer_profile?.discipline || emp.department)?.code === val,
  },
  {
    id: 'organization',
    label: 'Organisation',
    optionsFrom: (emp) => emp.organization_name,
    placeholder: 'All organisations',
    match: (emp, val) => val === 'all' || (emp.organization_name || '') === val,
  },
  {
    id: 'location',
    label: 'Location',
    optionsFrom: (emp) => emp.location,
    placeholder: 'All locations',
    match: (emp, val) => val === 'all' || (emp.location || '') === val,
  },
  {
    id: 'role',
    label: 'Role',
    optionsFrom: (emp) => (emp.roles && emp.roles[0]?.name) || null,
    placeholder: 'All roles',
    match: (emp, val) => val === 'all' || (emp.roles || []).some(r => r.name === val),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 6. VIEW MODES
// ─────────────────────────────────────────────────────────────────────────────
export const HR_VIEW_MODES = [
  { id: 'cards',     label: 'Cards',          icon: 'Squares2X2Icon' },
  { id: 'table',     label: 'Table',          icon: 'TableCellsIcon' },
  { id: 'dept',      label: 'Departments',    icon: 'BuildingOffice2Icon' },
  { id: 'timesheet', label: 'Time Sheet',     icon: 'ClockIcon' },
]
export const HR_DEFAULT_VIEW_MODE = 'cards'

// ─────────────────────────────────────────────────────────────────────────────
// 7. CARD FIELDS — controls which secondary lines appear on the employee card
// ─────────────────────────────────────────────────────────────────────────────
export const HR_CARD_FIELDS = [
  { id: 'job_title',   icon: 'BriefcaseIcon',         accessor: (e) => e.job_title || '—' },
  { id: 'department',  icon: 'BuildingOffice2Icon',   accessor: (e) => e.department || '—' },
  { id: 'email',       icon: 'EnvelopeIcon',          accessor: (e) => e.user?.email || '—' },
  { id: 'phone',       icon: 'PhoneIcon',             accessor: (e) => e.phone || '—' },
  { id: 'location',    icon: 'MapPinIcon',            accessor: (e) => e.location || '—' },
  { id: 'employee_id', icon: 'IdentificationIcon',    accessor: (e) => e.employee_id || '—' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 8. TABLE COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
export const HR_TABLE_COLUMNS = [
  { id: 'name',         label: 'Employee',     accessor: (e) => `${e.user?.first_name || ''} ${e.user?.last_name || ''}`.trim() || e.user?.email },
  { id: 'employee_id',  label: 'Employee ID',  accessor: (e) => e.employee_id || '—' },
  { id: 'job_title',    label: 'Designation',  accessor: (e) => e.job_title || '—' },
  { id: 'department',   label: 'Department',   accessor: (e) => e.department || '—' },
  { id: 'discipline',   label: 'Discipline',   accessor: (e) => matchDiscipline(e.engineer_profile?.discipline || e.department)?.label || '—' },
  { id: 'organization', label: 'Organisation', accessor: (e) => e.organization_name || '—' },
  { id: 'location',     label: 'Location',     accessor: (e) => e.location || '—' },
  { id: 'status',       label: 'Status',       accessor: (e) => e.status },
  { id: 'last_login',   label: 'Last Login',   accessor: (e) => e.last_login_at },
]

// ─────────────────────────────────────────────────────────────────────────────
// 9. DETAIL DRAWER TABS
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DETAIL_TABS = [
  { id: 'overview',    label: 'Overview',     icon: 'UserCircleIcon' },
  { id: 'employment',  label: 'Employment',   icon: 'BriefcaseIcon' },
  { id: 'competency',  label: 'Competency',   icon: 'AcademicCapIcon' },
  { id: 'access',      label: 'Roles & Access', icon: 'KeyIcon' },
  { id: 'security',    label: 'Security & Activity', icon: 'ShieldCheckIcon' },
]
export const HR_DEFAULT_DETAIL_TAB = 'overview'

// ─────────────────────────────────────────────────────────────────────────────
// 10. PAGINATION & DATA LOAD
// ─────────────────────────────────────────────────────────────────────────────
export const HR_PAGE_SIZES = [12, 24, 48, 96]
export const HR_DEFAULT_PAGE_SIZE = 24

// Backend `/rbac/users/` returns paginated results. Use a generous fetch size
// so all KPIs and the departments view reflect the full org, not just one page.
export const HR_DATA_FETCH_PAGE_SIZE = 500

// ─────────────────────────────────────────────────────────────────────────────
// 11. EXPORT FORMATS — reuses rbacService.exportUsers under the hood
// ─────────────────────────────────────────────────────────────────────────────
export const HR_EXPORT_FORMATS = [
  { value: 'csv',  label: 'Export CSV',  ext: 'csv'  },
  { value: 'xlsx', label: 'Export Excel', ext: 'xlsx' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 12. ADMIN DEEP LINKS — keep create/edit flows on the dedicated admin page
//     instead of duplicating them here. HR users get read-rich view + drill-in.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_ADMIN_USER_LINK = (id) => `/admin/users/${id}`
export const HR_ADMIN_USERS_LIST_LINK = '/admin/users'

// ─────────────────────────────────────────────────────────────────────────────
// 13. UI COPY — single point of edit for headlines / empty states
// ─────────────────────────────────────────────────────────────────────────────
export const HR_COPY = {
  pageTitle:        'Employee Management',
  pageSubtitle:     'Workforce directory, competency map and HR analytics',
  loadingMessage:   'Loading workforce data…',
  emptyTitle:       'No employees match the current filters',
  emptySubtitle:    'Try clearing filters or use the search box above.',
  errorTitle:       'Could not load employee data',
  searchPlaceholder: 'Search name, email, employee ID, department, designation…',
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. HELPERS — exported so the page stays purely declarative
// ─────────────────────────────────────────────────────────────────────────────
export const formatYearsOfService = (iso) => {
  const y = yearsSince(iso)
  if (y < 1) return `${Math.floor(y * 12)} months`
  return `${y.toFixed(1)} years`
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export const fullName = (emp) => {
  const first = emp.user?.first_name || emp.first_name || ''
  const last = emp.user?.last_name || emp.last_name || ''
  const joined = `${first} ${last}`.trim()
  return joined || emp.full_name || emp.user?.email || emp.email || 'Unnamed user'
}

export const initials = (emp) => {
  const name = fullName(emp)
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || '?'
}

/**
 * Normalise an employee record so the rest of the UI can rely on a single
 * shape, regardless of whether it came from:
 *   - the lightweight list endpoint (flat: { email, full_name, primary_role })
 *   - the rich detail endpoint     (nested: { user: {...}, roles: [...] })
 *
 * The function is **idempotent** — calling it on an already-normalised record
 * returns the same shape.
 *
 * Soft-coded: extend this helper if the backend list serializer ever exposes
 * new fields the UI consumes; no component code needs to change.
 */
export const normalizeEmployee = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  // Build nested `user` if missing — happens with the list serializer's flat shape.
  const user = raw.user && typeof raw.user === 'object'
    ? raw.user
    : {
        id: raw.user_id || null,
        email: raw.email || '',
        first_name: raw.first_name || (raw.full_name ? raw.full_name.split(/\s+/)[0] : ''),
        last_name: raw.last_name || (raw.full_name ? raw.full_name.split(/\s+/).slice(1).join(' ') : ''),
        is_active: raw.is_active ?? true,
      }
  // Build `roles` from `primary_role` if the rich list isn't present.
  let roles = Array.isArray(raw.roles) ? raw.roles : []
  if (roles.length === 0 && raw.primary_role && typeof raw.primary_role === 'object') {
    roles = [{ id: raw.primary_role.id, name: raw.primary_role.name, is_primary: true }]
  }
  return {
    ...raw,
    user,
    roles,
    modules: Array.isArray(raw.modules) ? raw.modules : [],
    engineer_profile: raw.engineer_profile || {},
  }
}

export default {
  HR_STATUSES,
  HR_DISCIPLINES,
  HR_EMPLOYMENT_TYPES,
  HR_KPIS,
  HR_FILTERS,
  HR_VIEW_MODES,
  HR_CARD_FIELDS,
  HR_TABLE_COLUMNS,
  HR_DETAIL_TABS,
  HR_PAGE_SIZES,
  HR_DEFAULT_PAGE_SIZE,
  HR_DATA_FETCH_PAGE_SIZE,
  HR_EXPORT_FORMATS,
  HR_COPY,
  HR_ADMIN_USER_LINK,
  HR_ADMIN_USERS_LIST_LINK,
  formatYearsOfService,
  formatDateTime,
  formatDate,
  fullName,
  initials,
  matchDiscipline,
  getStatusMeta,
  normalizeEmployee,
}
