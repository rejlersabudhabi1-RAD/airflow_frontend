/**
 * HR Vice President — Consolidated Real-Time Dashboard
 * -----------------------------------------------------
 * Soft-coded configuration for `/hr` — the single landing surface designed
 * for the HR Vice President to see workforce + attendance + onboarding
 * activity at a glance.
 *
 * NO core logic is modified — every value on the dashboard is derived from
 * existing endpoints:
 *   • timesheetService.fetchLive()    → live IN/OUT roster + summary
 *   • timesheetService.fetchDaily()   → today's per-user hours
 *   • timesheetService.fetchMonthly() → month-to-date hours / late / full day
 *   • rbacService.getUsers()          → workforce master (status, MFA, dept)
 *
 * Everything visible on the page — labels, polling intervals, KPI compute
 * functions, section visibility, colours, accent gradients, empty-state
 * copy, quick-link buttons — lives in this file. Tweak here, no JSX edits.
 */

import {
  HR_DISCIPLINES,
  matchDiscipline,
} from './hrEmployees.config'

// ─────────────────────────────────────────────────────────────────────────────
// 1. POLLING — how often the live tiles refresh (ms)
//    Overridable via env var so production can dial it up/down without a rebuild
//    of the page component.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DASHBOARD_POLL_MS = Number(
  import.meta.env?.VITE_HR_DASHBOARD_POLL_MS || 30000
)

// Maximum employees to pull for workforce analytics. Matches the page-size used
// by /hr/employees so caching can be shared if a future enhancement adds it.
export const HR_DASHBOARD_FETCH_PAGE_SIZE = 500

// Number of recent punches to show in the live activity feed.
export const HR_DASHBOARD_LIVE_FEED_LIMIT = 8

// Number of recent joiners (last N days) to show.
export const HR_DASHBOARD_RECENT_JOINER_DAYS = 30
export const HR_DASHBOARD_RECENT_JOINER_LIMIT = 6

// Threshold (in days) above which a punch's "last seen" turns grey/old.
export const HR_DASHBOARD_STALE_PUNCH_MIN = 120

// ─────────────────────────────────────────────────────────────────────────────
// 2. COPY — headings, sub-headings, empty states. All English-localisable.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DASHBOARD_COPY = {
  pageTitle: 'HR Command Center',
  pageSubtitle:
    'Real-time workforce overview — attendance, headcount, onboarding and engagement at a single glance.',
  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',
  refreshing: 'Refreshing…',
  liveBadge: 'LIVE',
  autoRefreshOn: 'Auto-refresh on',
  autoRefreshOff: 'Auto-refresh off',
  manualRefresh: 'Refresh now',
  lastUpdated: 'Last updated',
  loading: 'Loading workforce signals…',
  emptyLive: 'No biometric punches recorded today yet.',
  emptyDaily: 'No attendance data captured for today.',
  emptyMonthly: 'Month-to-date rollup is empty.',
  emptyJoiners: `No new joiners in the last ${HR_DASHBOARD_RECENT_JOINER_DAYS} days.`,
  emptyDept: 'No department data available.',
  emptyDiscipline: 'No discipline mapping available.',
  workforceError: 'Could not load the workforce directory.',
  timesheetError: 'Could not load biometric attendance data.',
  timesheetUnavailable: 'Biometric attendance is not configured for this environment.',
  sectionLive: 'Live attendance pulse',
  sectionLiveHint: 'Auto-updates from the biometric feed.',
  sectionWorkforce: 'Workforce composition',
  sectionWorkforceHint: 'All registered employees in RAD AI.',
  sectionToday: "Today's punctuality",
  sectionTodayHint: 'Derived from today\'s biometric report.',
  sectionMonth: 'Month-to-date rollup',
  sectionMonthHint: 'Hours, full days and late arrivals so far this month.',
  sectionJoiners: 'Recent joiners',
  sectionJoinersHint: `New employees added in the last ${HR_DASHBOARD_RECENT_JOINER_DAYS} days.`,
  sectionLinks: 'Quick actions',
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TOP KPI TILES (real-time strip across the top)
//    Each tile is a pure compute over { workforce, live, daily, monthly }.
//    Returning `null` from `compute` hides the tile (graceful degradation
//    when a data source isn't configured).
// ─────────────────────────────────────────────────────────────────────────────
const pct = (num, den) => (den > 0 ? `${Math.round((num / den) * 100)}%` : '0%')

export const HR_DASHBOARD_KPIS = [
  {
    id: 'headcount',
    label: 'Total Headcount',
    sub: 'All registered employees',
    icon: 'UsersIcon',
    accent: 'from-blue-500 to-indigo-600',
    compute: ({ workforce }) => workforce.length,
  },
  {
    id: 'active',
    label: 'Active Employees',
    sub: 'Currently working',
    icon: 'CheckBadgeIcon',
    accent: 'from-emerald-500 to-teal-600',
    compute: ({ workforce }) => workforce.filter((e) => e.status === 'active').length,
  },
  {
    id: 'currently_in',
    label: 'Currently IN',
    sub: 'Punched in right now',
    icon: 'ArrowRightOnRectangleIcon',
    accent: 'from-green-500 to-emerald-600',
    compute: ({ live }) => live?.summary?.currently_in ?? null,
  },
  {
    id: 'currently_out',
    label: 'Currently OUT',
    sub: 'Off-site / not punched',
    icon: 'ArrowLeftOnRectangleIcon',
    accent: 'from-slate-500 to-slate-700',
    compute: ({ live }) => live?.summary?.currently_out ?? null,
  },
  {
    id: 'late_today',
    label: 'Late Today',
    sub: 'Arrived after grace period',
    icon: 'ClockIcon',
    accent: 'from-amber-500 to-orange-600',
    compute: ({ live }) => live?.summary?.late_today ?? null,
  },
  {
    id: 'attendance_rate',
    label: 'Attendance Today',
    sub: 'Seen vs active employees',
    icon: 'PresentationChartLineIcon',
    accent: 'from-cyan-500 to-blue-600',
    compute: ({ live, workforce }) => {
      const seen = live?.summary?.total_seen_today ?? 0
      const active = workforce.filter((e) => e.status === 'active').length
      return pct(seen, active)
    },
  },
  {
    id: 'pending_onboarding',
    label: 'Pending Onboarding',
    sub: 'Awaiting first login',
    icon: 'UserPlusIcon',
    accent: 'from-purple-500 to-fuchsia-600',
    compute: ({ workforce }) => workforce.filter((e) => e.status === 'pending').length,
  },
  {
    id: 'mfa_adoption',
    label: 'MFA Adoption',
    sub: 'Two-factor enabled',
    icon: 'ShieldCheckIcon',
    accent: 'from-indigo-500 to-violet-600',
    compute: ({ workforce }) =>
      workforce.length === 0
        ? '0%'
        : pct(workforce.filter((e) => e.is_mfa_enabled).length, workforce.length),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. SECTIONS — declarative visibility flag. Flip to `false` to hide a card
//    without touching the page component.
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DASHBOARD_SECTIONS = {
  liveFeed: true,
  workforceComposition: true,
  todayPunctuality: true,
  monthRollup: true,
  recentJoiners: true,
  quickLinks: true,
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEPARTMENT / DISCIPLINE BREAKDOWN
//    Returns ordered [{label, count, accent}, ...]
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_BAR_ACCENT = 'from-slate-400 to-slate-600'

export const buildDepartmentBreakdown = (workforce, topN = 8) => {
  const map = new Map()
  for (const e of workforce) {
    const key = (e.department || 'Unassigned').trim() || 'Unassigned'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, count]) => ({ label, count, accent: DEFAULT_BAR_ACCENT }))
}

export const buildDisciplineBreakdown = (workforce) => {
  const map = new Map()
  for (const e of workforce) {
    const d = matchDiscipline(e.engineer_profile?.discipline || e.department)
    const key = d?.label || 'Other / Unmapped'
    const tone = d?.tone || 'bg-slate-100 text-slate-700'
    if (!map.has(key)) map.set(key, { count: 0, tone })
    map.get(key).count += 1
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, count: v.count, tone: v.tone }))
    .sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TODAY PUNCTUALITY — derived from daily report rows
// ─────────────────────────────────────────────────────────────────────────────
export const buildTodayPunctuality = (dailyRows) => {
  const rows = Array.isArray(dailyRows) ? dailyRows : []
  const total = rows.length
  const late = rows.filter((r) => r.is_late).length
  const full = rows.filter((r) => r.is_full_day).length
  const half = total - full
  return {
    total,
    late,
    onTime: total - late,
    full,
    half,
    onTimePct: pct(total - late, total),
    fullPct: pct(full, total),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MONTH-TO-DATE ROLLUP — derived from monthly report rows
// ─────────────────────────────────────────────────────────────────────────────
export const buildMonthRollup = (monthlyRows) => {
  const rows = Array.isArray(monthlyRows) ? monthlyRows : []
  let totalHours = 0
  let totalDays = 0
  let totalLate = 0
  let totalFull = 0
  let totalHalf = 0
  for (const r of rows) {
    totalHours += Number(r.total_hours || 0)
    totalDays += Number(r.days_present || 0)
    totalLate += Number(r.late_arrivals || 0)
    totalFull += Number(r.full_days || 0)
    totalHalf += Number(r.half_days || 0)
  }
  const employees = rows.length
  return {
    employees,
    totalHours: Math.round(totalHours),
    avgHoursPerEmployee: employees > 0 ? (totalHours / employees).toFixed(1) : '0.0',
    avgDaysPerEmployee: employees > 0 ? (totalDays / employees).toFixed(1) : '0.0',
    totalLate,
    totalFull,
    totalHalf,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. RECENT JOINERS — last N days
// ─────────────────────────────────────────────────────────────────────────────
export const buildRecentJoiners = (workforce) => {
  const cutoff = Date.now() - HR_DASHBOARD_RECENT_JOINER_DAYS * 86400000
  return workforce
    .filter((e) => {
      const t = new Date(e.created_at || 0).getTime()
      return !Number.isNaN(t) && t >= cutoff
    })
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, HR_DASHBOARD_RECENT_JOINER_LIMIT)
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. LIVE ACTIVITY FEED — latest punches sorted newest-first
// ─────────────────────────────────────────────────────────────────────────────
export const buildLiveFeed = (live) => {
  const rows = Array.isArray(live?.rows) ? live.rows : []
  // live.rows already returns latest-per-employee; sort by time desc for the feed.
  return [...rows]
    .sort((a, b) => {
      const ta = new Date(a.punch_time || a.login_time || a.logout_time || 0).getTime()
      const tb = new Date(b.punch_time || b.login_time || b.logout_time || 0).getTime()
      return tb - ta
    })
    .slice(0, HR_DASHBOARD_LIVE_FEED_LIMIT)
}

// Convenience: format a punch row's time + minute-since-now badge.
export const formatPunchTime = (row) => {
  const raw = row?.punch_time || row?.login_time || row?.logout_time
  if (!raw) return { time: '—', minutesAgo: null, stale: true }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return { time: String(raw), minutesAgo: null, stale: true }
  const minutesAgo = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    minutesAgo,
    stale: minutesAgo > HR_DASHBOARD_STALE_PUNCH_MIN,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. QUICK LINKS
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DASHBOARD_QUICK_LINKS = [
  {
    id: 'employees',
    label: 'Employee Directory',
    description: 'Browse the full workforce',
    to: '/hr/employees',
    icon: 'UserGroupIcon',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
  },
  {
    id: 'timesheet',
    label: 'Time Sheet Analytics',
    description: 'Live, daily and monthly biometric reports',
    to: '/hr/employees?tab=timesheet',
    icon: 'ClockIcon',
    tone: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
  },
  {
    id: 'admin',
    label: 'User Management',
    description: 'Manage roles and access control',
    to: '/admin/users',
    icon: 'ShieldCheckIcon',
    tone: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
  },
  {
    id: 'profile',
    label: 'My Profile',
    description: 'Personal details and security',
    to: '/profile',
    icon: 'UserCircleIcon',
    tone: 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 11. STATUS DISTRIBUTION (donut-style chip strip)
// ─────────────────────────────────────────────────────────────────────────────
export const HR_DASHBOARD_STATUS_PALETTE = {
  active:    { label: 'Active',    bar: 'bg-emerald-500', text: 'text-emerald-700' },
  pending:   { label: 'Pending',   bar: 'bg-amber-500',   text: 'text-amber-700' },
  inactive:  { label: 'Inactive',  bar: 'bg-slate-400',   text: 'text-slate-600' },
  suspended: { label: 'Suspended', bar: 'bg-red-500',     text: 'text-red-700' },
  on_leave:  { label: 'On Leave',  bar: 'bg-blue-500',    text: 'text-blue-700' },
}

export const buildStatusDistribution = (workforce) => {
  const map = new Map()
  for (const e of workforce) {
    const s = e.status || 'inactive'
    map.set(s, (map.get(s) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([code, count]) => ({
      code,
      count,
      ...(HR_DASHBOARD_STATUS_PALETTE[code] || {
        label: code,
        bar: 'bg-slate-300',
        text: 'text-slate-600',
      }),
    }))
    .sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. GREETING HELPER (shown in header)
// ─────────────────────────────────────────────────────────────────────────────
export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return HR_DASHBOARD_COPY.greetingMorning
  if (h < 17) return HR_DASHBOARD_COPY.greetingAfternoon
  return HR_DASHBOARD_COPY.greetingEvening
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. EXPORT BUNDLE
// ─────────────────────────────────────────────────────────────────────────────
export default {
  HR_DASHBOARD_POLL_MS,
  HR_DASHBOARD_FETCH_PAGE_SIZE,
  HR_DASHBOARD_LIVE_FEED_LIMIT,
  HR_DASHBOARD_RECENT_JOINER_DAYS,
  HR_DASHBOARD_RECENT_JOINER_LIMIT,
  HR_DASHBOARD_STALE_PUNCH_MIN,
  HR_DASHBOARD_COPY,
  HR_DASHBOARD_KPIS,
  HR_DASHBOARD_SECTIONS,
  HR_DASHBOARD_QUICK_LINKS,
  HR_DASHBOARD_STATUS_PALETTE,
  HR_DISCIPLINES,
  buildDepartmentBreakdown,
  buildDisciplineBreakdown,
  buildTodayPunctuality,
  buildMonthRollup,
  buildRecentJoiners,
  buildLiveFeed,
  buildStatusDistribution,
  formatPunchTime,
  getGreeting,
}
