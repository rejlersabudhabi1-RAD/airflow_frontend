/**
 * HR · Consolidated Command Center (`/hr`)
 * ----------------------------------------
 * The HR Vice President's single-pane real-time dashboard.
 *
 * Data sources (all existing — NO core logic was modified):
 *   • timesheetService.fetchLive()    → live IN/OUT summary + roster
 *   • timesheetService.fetchDaily()   → today's per-user hours
 *   • timesheetService.fetchMonthly() → month-to-date rollup
 *   • rbacService.getUsers()          → workforce master directory
 *
 * Every label, KPI, polling interval, colour, section and link is read from
 * `frontend/src/config/hrDashboard.config.js`. The component is intentionally
 * a thin renderer over that config so HR can re-tune the dashboard without
 * any JSX edits.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'

import rbacService from '../../services/rbac.service'
import timesheetService from '../../services/timesheet.service'

import {
  HR_DASHBOARD_POLL_MS,
  HR_DASHBOARD_FETCH_PAGE_SIZE,
  HR_DASHBOARD_COPY,
  HR_DASHBOARD_KPIS,
  HR_DASHBOARD_SECTIONS,
  HR_DASHBOARD_QUICK_LINKS,
  buildDepartmentBreakdown,
  buildDisciplineBreakdown,
  buildTodayPunctuality,
  buildMonthRollup,
  buildRecentJoiners,
  buildLiveFeed,
  buildStatusDistribution,
  formatPunchTime,
  getGreeting,
} from '../../config/hrDashboard.config'

import {
  fullName,
  initials,
  normalizeEmployee,
  getEmail,
  formatDate,
} from '../../config/hrEmployees.config'

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers — kept local so the page stays self-contained.
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const C = HeroIcons[name] || HeroIcons.QuestionMarkCircleIcon
  return <C className={className} aria-hidden="true" />
}

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: top KPI tile
// ─────────────────────────────────────────────────────────────────────────────
const KpiTile = ({ kpi, value }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.accent} text-white p-5 shadow-md hover:shadow-lg transition-shadow`}
  >
    <div className="flex items-start justify-between">
      <div className="opacity-90">
        <Icon name={kpi.icon} className="w-7 h-7" />
      </div>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{kpi.sub}</span>
    </div>
    <div className="mt-3 text-3xl font-bold leading-tight">
      {value === null || value === undefined ? '—' : value}
    </div>
    <div className="mt-1 text-sm font-medium opacity-95">{kpi.label}</div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: section card wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Section = ({ title, hint, icon, children, action }) => (
  <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
    <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Icon name={icon} className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">{title}</h2>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
    <div className="p-5">{children}</div>
  </section>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: horizontal bar chart (no chart library — pure tailwind)
// ─────────────────────────────────────────────────────────────────────────────
const BarChart = ({ items, emptyMessage }) => {
  if (!items || items.length === 0) {
    return <div className="text-sm text-slate-500 italic py-6 text-center">{emptyMessage}</div>
  }
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const pct = Math.max(2, Math.round((item.count / max) * 100))
        return (
          <div key={item.label} className="grid grid-cols-12 gap-2 items-center text-sm">
            <div className="col-span-5 truncate text-slate-700" title={item.label}>
              {item.label}
            </div>
            <div className="col-span-6">
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${item.accent || 'from-blue-400 to-blue-600'} rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="col-span-1 text-right font-semibold text-slate-900">{item.count}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: status distribution stack bar
// ─────────────────────────────────────────────────────────────────────────────
const StatusStack = ({ items, total }) => {
  if (!items || items.length === 0 || total === 0) {
    return <div className="text-sm text-slate-500 italic">No status data</div>
  }
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
        {items.map((s) => {
          const pct = Math.max(0.5, (s.count / total) * 100)
          return (
            <div
              key={s.code}
              className={s.bar}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${s.count}`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {items.map((s) => (
          <div key={s.code} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.bar}`} />
            <span className={`font-medium ${s.text}`}>{s.label}</span>
            <span className="text-slate-500">({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: live activity feed row
// ─────────────────────────────────────────────────────────────────────────────
const LiveFeedRow = ({ row }) => {
  const t = formatPunchTime(row)
  const type = (row.punch_type || '').toString().toUpperCase()
  const isIn = type === 'IN' || type === '1'
  const name = row.radai_full_name || row.name || row.employee_name || row.employee_code
  const dept = row.radai_department || row.department || ''
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
          isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
        }`}
      >
        {(name || '?').toString().slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
        <div className="text-xs text-slate-500 truncate">{dept || row.employee_code}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
            isIn
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Icon
            name={isIn ? 'ArrowRightOnRectangleIcon' : 'ArrowLeftOnRectangleIcon'}
            className="w-3 h-3"
          />
          {isIn ? 'IN' : 'OUT'}
        </div>
        <div className={`text-[11px] mt-0.5 ${t.stale ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.time}
          {t.minutesAgo !== null && t.minutesAgo < 999 && (
            <span className="ml-1 text-slate-400">· {t.minutesAgo}m ago</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: recent joiner card
// ─────────────────────────────────────────────────────────────────────────────
const JoinerCard = ({ emp }) => (
  <Link
    to="/hr/employees"
    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-colors"
  >
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initials(emp)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-slate-900 truncate">{fullName(emp)}</div>
      <div className="text-xs text-slate-500 truncate">{getEmail(emp) || emp.department || '—'}</div>
    </div>
    <div className="text-[11px] text-slate-500 flex-shrink-0">
      {formatDate(emp.created_at)}
    </div>
  </Link>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: quick link tile
// ─────────────────────────────────────────────────────────────────────────────
const QuickLink = ({ link }) => (
  <Link
    to={link.to}
    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${link.tone}`}
  >
    <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
      <Icon name={link.icon} className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-sm font-semibold">{link.label}</div>
      <div className="text-xs opacity-80 mt-0.5">{link.description}</div>
    </div>
  </Link>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function HRDashboard() {
  const currentUser = useSelector((state) => state.auth?.user)
  const [workforce, setWorkforce] = useState([])
  const [live, setLive] = useState(null)
  const [daily, setDaily] = useState(null)
  const [monthly, setMonthly] = useState(null)

  const [loadingWorkforce, setLoadingWorkforce] = useState(true)
  const [loadingLive, setLoadingLive] = useState(true)
  const [workforceError, setWorkforceError] = useState(null)
  const [timesheetError, setTimesheetError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [now, setNow] = useState(new Date())

  // ── Fetch workforce (one-time on mount; doesn't need to poll every 30s)
  const loadWorkforce = useCallback(async () => {
    setLoadingWorkforce(true)
    setWorkforceError(null)
    try {
      const resp = await rbacService.getUsers({ page_size: HR_DASHBOARD_FETCH_PAGE_SIZE })
      const raw = Array.isArray(resp?.data?.results)
        ? resp.data.results
        : Array.isArray(resp?.results)
          ? resp.results
          : Array.isArray(resp?.data)
            ? resp.data
            : Array.isArray(resp)
              ? resp
              : []
      setWorkforce(raw.map(normalizeEmployee))
    } catch (err) {
      console.warn('[HRDashboard] workforce load failed', err)
      setWorkforceError(err)
      setWorkforce([])
    } finally {
      setLoadingWorkforce(false)
    }
  }, [])

  // ── Fetch live + today + month rollup (polled)
  const loadTimesheets = useCallback(async () => {
    setLoadingLive(true)
    setTimesheetError(null)
    try {
      const [liveResp, dailyResp, monthlyResp] = await Promise.allSettled([
        timesheetService.fetchLive(),
        timesheetService.fetchDaily(),
        timesheetService.fetchMonthly(),
      ])
      if (liveResp.status === 'fulfilled') setLive(liveResp.value)
      if (dailyResp.status === 'fulfilled') setDaily(dailyResp.value)
      if (monthlyResp.status === 'fulfilled') setMonthly(monthlyResp.value)
      const anyOk =
        liveResp.status === 'fulfilled' ||
        dailyResp.status === 'fulfilled' ||
        monthlyResp.status === 'fulfilled'
      if (!anyOk) setTimesheetError(liveResp.reason || new Error('Timesheet unavailable'))
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('[HRDashboard] timesheet load failed', err)
      setTimesheetError(err)
    } finally {
      setLoadingLive(false)
    }
  }, [])

  // ── Initial mount
  useEffect(() => {
    loadWorkforce()
    loadTimesheets()
  }, [loadWorkforce, loadTimesheets])

  // ── Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(loadTimesheets, HR_DASHBOARD_POLL_MS)
    return () => clearInterval(id)
  }, [autoRefresh, loadTimesheets])

  // ── Live clock for the header
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Derived data (memoised so re-renders stay cheap)
  const ctx = useMemo(
    () => ({ workforce, live, daily, monthly }),
    [workforce, live, daily, monthly]
  )
  const liveFeed = useMemo(() => buildLiveFeed(live), [live])
  const deptBars = useMemo(() => buildDepartmentBreakdown(workforce), [workforce])
  const disciplineBars = useMemo(
    () => buildDisciplineBreakdown(workforce).slice(0, 8).map((d) => ({
      label: d.label,
      count: d.count,
      accent: 'from-rose-400 to-pink-600',
    })),
    [workforce]
  )
  const statusDist = useMemo(() => buildStatusDistribution(workforce), [workforce])
  const punctuality = useMemo(() => buildTodayPunctuality(daily?.rows), [daily])
  const monthRollup = useMemo(() => buildMonthRollup(monthly?.rows), [monthly])
  const joiners = useMemo(() => buildRecentJoiners(workforce), [workforce])

  const greeting = getGreeting()
  const userFirstName =
    currentUser?.first_name ||
    (currentUser?.full_name ? currentUser.full_name.split(/\s+/)[0] : '') ||
    'there'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                <Icon name="PresentationChartBarIcon" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {HR_DASHBOARD_COPY.pageTitle}
                </h1>
                <p className="text-sm text-slate-600">
                  {greeting}, <span className="font-semibold">{userFirstName}</span>.{' '}
                  {HR_DASHBOARD_COPY.pageSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 font-mono">
              {formatTime(now)}
            </div>
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={`Polling every ${Math.round(HR_DASHBOARD_POLL_MS / 1000)}s`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {autoRefresh ? HR_DASHBOARD_COPY.autoRefreshOn : HR_DASHBOARD_COPY.autoRefreshOff}
            </button>
            <button
              type="button"
              onClick={loadTimesheets}
              disabled={loadingLive}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Icon name="ArrowPathIcon" className={`w-3.5 h-3.5 inline mr-1 ${loadingLive ? 'animate-spin' : ''}`} />
              {loadingLive ? HR_DASHBOARD_COPY.refreshing : HR_DASHBOARD_COPY.manualRefresh}
            </button>
            {lastUpdated && (
              <div className="text-[11px] text-slate-500 ml-1">
                {HR_DASHBOARD_COPY.lastUpdated}: {formatTime(lastUpdated)}
              </div>
            )}
          </div>
        </header>

        {/* ── Error banners ────────────────────────────────────────────── */}
        {(workforceError || timesheetError) && (
          <div className="space-y-2">
            {workforceError && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
                <Icon name="ExclamationTriangleIcon" className="w-5 h-5 flex-shrink-0" />
                <span>{HR_DASHBOARD_COPY.workforceError}</span>
              </div>
            )}
            {timesheetError && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
                <Icon name="InformationCircleIcon" className="w-5 h-5 flex-shrink-0" />
                <span>{HR_DASHBOARD_COPY.timesheetUnavailable}</span>
              </div>
            )}
          </div>
        )}

        {/* ── KPI tile strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
          {HR_DASHBOARD_KPIS.map((kpi) => (
            <KpiTile key={kpi.id} kpi={kpi} value={kpi.compute(ctx)} />
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Live activity feed (spans 1 col, tall) */}
          {HR_DASHBOARD_SECTIONS.liveFeed && (
            <div className="lg:row-span-2">
              <Section
                title={HR_DASHBOARD_COPY.sectionLive}
                hint={HR_DASHBOARD_COPY.sectionLiveHint}
                icon="SignalIcon"
                action={
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {HR_DASHBOARD_COPY.liveBadge}
                  </span>
                }
              >
                {liveFeed.length === 0 ? (
                  <div className="text-sm text-slate-500 italic py-6 text-center">
                    {HR_DASHBOARD_COPY.emptyLive}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 -my-2">
                    {liveFeed.map((row, i) => (
                      <LiveFeedRow key={`${row.employee_code || i}-${row.punch_time || i}`} row={row} />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* Today punctuality */}
          {HR_DASHBOARD_SECTIONS.todayPunctuality && (
            <Section
              title={HR_DASHBOARD_COPY.sectionToday}
              hint={HR_DASHBOARD_COPY.sectionTodayHint}
              icon="ClockIcon"
            >
              {punctuality.total === 0 ? (
                <div className="text-sm text-slate-500 italic py-6 text-center">
                  {HR_DASHBOARD_COPY.emptyDaily}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                      <div className="text-2xl font-bold text-emerald-700">{punctuality.onTime}</div>
                      <div className="text-[11px] text-emerald-600 uppercase tracking-wider mt-0.5">On time</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <div className="text-2xl font-bold text-amber-700">{punctuality.late}</div>
                      <div className="text-[11px] text-amber-600 uppercase tracking-wider mt-0.5">Late</div>
                    </div>
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <div className="text-2xl font-bold text-blue-700">{punctuality.full}</div>
                      <div className="text-[11px] text-blue-600 uppercase tracking-wider mt-0.5">Full day</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-600">On-time rate</span>
                      <span className="font-semibold text-slate-900">{punctuality.onTimePct}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-600">Full-day rate</span>
                      <span className="font-semibold text-slate-900">{punctuality.fullPct}</span>
                    </div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Month-to-date */}
          {HR_DASHBOARD_SECTIONS.monthRollup && (
            <Section
              title={HR_DASHBOARD_COPY.sectionMonth}
              hint={HR_DASHBOARD_COPY.sectionMonthHint}
              icon="CalendarIcon"
            >
              {monthRollup.employees === 0 ? (
                <div className="text-sm text-slate-500 italic py-6 text-center">
                  {HR_DASHBOARD_COPY.emptyMonthly}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-2xl font-bold text-slate-900">{monthRollup.totalHours.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Total hours</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-2xl font-bold text-slate-900">{monthRollup.avgHoursPerEmployee}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Avg hrs / emp</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <div className="text-2xl font-bold text-blue-700">{monthRollup.totalFull.toLocaleString()}</div>
                    <div className="text-[11px] text-blue-600 uppercase tracking-wider mt-0.5">Full days</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <div className="text-2xl font-bold text-amber-700">{monthRollup.totalLate.toLocaleString()}</div>
                    <div className="text-[11px] text-amber-600 uppercase tracking-wider mt-0.5">Late arrivals</div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Workforce composition — Status + Department */}
          {HR_DASHBOARD_SECTIONS.workforceComposition && (
            <Section
              title={HR_DASHBOARD_COPY.sectionWorkforce}
              hint={HR_DASHBOARD_COPY.sectionWorkforceHint}
              icon="UsersIcon"
              action={
                <Link to="/hr/employees" className="text-xs font-semibold text-blue-600 hover:underline">
                  View directory →
                </Link>
              }
            >
              {loadingWorkforce ? (
                <div className="text-sm text-slate-500 italic py-6 text-center">
                  {HR_DASHBOARD_COPY.loading}
                </div>
              ) : workforce.length === 0 ? (
                <div className="text-sm text-slate-500 italic py-6 text-center">
                  {HR_DASHBOARD_COPY.emptyDept}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Status distribution</div>
                    <StatusStack items={statusDist} total={workforce.length} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Top departments</div>
                    <BarChart items={deptBars} emptyMessage={HR_DASHBOARD_COPY.emptyDept} />
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Discipline coverage */}
          {HR_DASHBOARD_SECTIONS.workforceComposition && (
            <Section
              title="Engineering disciplines"
              hint="Workforce spread across Oil & Gas EPC specialisations"
              icon="BeakerIcon"
            >
              {loadingWorkforce ? (
                <div className="text-sm text-slate-500 italic py-6 text-center">
                  {HR_DASHBOARD_COPY.loading}
                </div>
              ) : (
                <BarChart items={disciplineBars} emptyMessage={HR_DASHBOARD_COPY.emptyDiscipline} />
              )}
            </Section>
          )}
        </div>

        {/* ── Recent joiners ─────────────────────────────────────────── */}
        {HR_DASHBOARD_SECTIONS.recentJoiners && (
          <Section
            title={HR_DASHBOARD_COPY.sectionJoiners}
            hint={HR_DASHBOARD_COPY.sectionJoinersHint}
            icon="SparklesIcon"
          >
            {joiners.length === 0 ? (
              <div className="text-sm text-slate-500 italic py-6 text-center">
                {HR_DASHBOARD_COPY.emptyJoiners}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {joiners.map((emp) => (
                  <JoinerCard key={emp.id || emp.user?.id || emp.employee_id} emp={emp} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Quick links ─────────────────────────────────────────────── */}
        {HR_DASHBOARD_SECTIONS.quickLinks && (
          <Section title={HR_DASHBOARD_COPY.sectionLinks} icon="BoltIcon">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {HR_DASHBOARD_QUICK_LINKS.map((link) => (
                <QuickLink key={link.id} link={link} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          Data sources: RBAC users · biometric timesheet · activity feed —
          auto-refresh every {Math.round(HR_DASHBOARD_POLL_MS / 1000)} seconds
        </div>
      </div>
    </div>
  )
}
