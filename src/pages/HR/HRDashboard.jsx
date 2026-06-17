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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'

import rbacService from '../../services/rbac.service'
import timesheetService from '../../services/timesheet.service'
import analyticsService from '../../services/analyticsService'
import payrollService from '../../services/payroll.service'
import { fmtCurrency } from '../../config/hrPayroll.config'

import {
  HR_DASHBOARD_POLL_MS,
  HR_DASHBOARD_FETCH_PAGE_SIZE,
  HR_DASHBOARD_COPY,
  HR_DASHBOARD_KPIS,
  HR_DASHBOARD_PAYROLL_KPIS,
  HR_DASHBOARD_SECTIONS,
  HR_DASHBOARD_QUICK_LINKS,
  HR_DASHBOARD_AI_CHAMPION,
  HR_DASHBOARD_PENDING_TYPES,
  getAIChampionTierStyle,
  buildAIChampionPodium,
  buildTotalPending,
  formatAICost,
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
// Sub-component: payroll / pending KPI tile (compact secondary strip)
// ─────────────────────────────────────────────────────────────────────────────
const PayrollKpiTile = ({ kpi, value, onClick }) => {
  const isUrgent = kpi.urgent && value > 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-4 text-left w-full transition-all shadow-sm hover:shadow-md
        ${isUrgent
          ? `bg-gradient-to-br ${kpi.accent} text-white`
          : 'bg-white border border-slate-200 text-slate-800'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon name={kpi.icon} className={`w-5 h-5 ${isUrgent ? 'text-white/90' : 'text-slate-500'}`} />
        {isUrgent && (
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
      </div>
      <div className={`text-2xl font-bold ${isUrgent ? 'text-white' : 'text-slate-900'}`}>
        {value === null || value === undefined ? '—' : value}
      </div>
      <div className={`text-xs mt-0.5 font-medium ${isUrgent ? 'text-white/80' : 'text-slate-500'}`}>
        {kpi.label}
      </div>
    </button>
  )
}

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
// Sub-component: pending action card (one per category)
// ─────────────────────────────────────────────────────────────────────────────
const PendingActionCard = ({ type, pending, navigate }) => {
  const count   = type.getCount(pending)
  const items   = type.getItems(pending)
  const hasItems = count > 0
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${hasItems ? `${type.bg} ${type.border}` : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasItems ? 'bg-white/70' : 'bg-slate-100'}`}>
            <Icon name={type.icon} className={`w-4 h-4 ${hasItems ? type.text : 'text-slate-400'}`} />
          </div>
          <span className={`text-sm font-semibold ${hasItems ? type.text : 'text-slate-500'}`}>{type.label}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${hasItems ? type.badge : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
          {count}
        </span>
      </div>
      {/* Item list (top 3) */}
      {hasItems ? (
        <div className="space-y-2">
          {items.map((r, i) => (
            <div key={r.id || i} className="flex items-start gap-2 text-sm">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${type.dot}`} />
              <div className="min-w-0">
                <div className={`font-medium truncate ${type.text}`}>{type.getRowLabel(r)}</div>
                <div className="text-xs text-slate-500 truncate">{type.getRowSub(r)}</div>
              </div>
            </div>
          ))}
          {count > items.length && (
            <div className={`text-xs ${type.text} opacity-70`}>+ {count - items.length} more</div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400">{type.zeroMsg}</p>
      )}
      {/* CTA */}
      <button
        type="button"
        onClick={() => navigate(type.route)}
        className={`mt-auto text-xs font-semibold py-1.5 px-3 rounded-lg border transition-colors
          ${hasItems
            ? 'bg-white/80 border-white/50 hover:bg-white ' + type.text
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
      >
        {type.actionLabel} →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: notification dropdown (bell click)
// ─────────────────────────────────────────────────────────────────────────────
const NotifDropdown = ({ pending, total, navigate, onClose }) => (
  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <Icon name="BellIcon" className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-800">{HR_DASHBOARD_COPY.notifTitle}</span>
      </div>
      {total > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">{total}</span>
      )}
      <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">
        <Icon name="XMarkIcon" className="w-4 h-4" />
      </button>
    </div>
    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
          <Icon name="CheckCircleIcon" className="w-8 h-8 text-emerald-400" />
          <span className="text-sm">{HR_DASHBOARD_COPY.notifClear}</span>
        </div>
      ) : (
        HR_DASHBOARD_PENDING_TYPES.map((type) => {
          const count = type.getCount(pending)
          if (count === 0) return null
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => { navigate(type.route); onClose() }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:${type.bg} transition-colors text-left`}
            >
              <div className={`w-8 h-8 rounded-lg ${type.bg} ${type.border} border flex items-center justify-center flex-shrink-0`}>
                <Icon name={type.icon} className={`w-4 h-4 ${type.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${type.text}`}>{type.label}</div>
                <div className="text-xs text-slate-500">
                  {count} {count === 1 ? type.singularMsg : type.pluralMsg}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${type.badge}`}>{count}</span>
            </button>
          )
        })
      )}
    </div>
    <div className="px-4 py-3 border-t border-slate-100">
      <button
        type="button"
        onClick={() => { navigate('/hr/payroll'); onClose() }}
        className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        Open Payroll & Salary →
      </button>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: AI Champion podium card
// Pure presentational — receives already-shaped rows from buildAIChampionPodium
// ─────────────────────────────────────────────────────────────────────────────
const PodiumCard = ({ row, highlight }) => {
  const style = getAIChampionTierStyle(row.tier)
  const isFirst = row.rank === 1
  return (
    <div
      className={`relative rounded-2xl border bg-white p-4 transition-shadow ${
        isFirst || highlight
          ? 'border-amber-200 shadow-lg ring-2 ring-amber-100'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.ring} flex items-center justify-center text-white font-bold text-lg shadow-md`}
            title={`${row.tier} tier`}
          >
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{(row.name || '?').slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
            #{row.rank}
          </span>
        </div>
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">{row.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${style.pill}`}
              title={`Tier: ${row.tier}`}
            >
              {style.emoji} {row.tier}
            </span>
          </div>
          {row.department && (
            <div className="text-xs text-slate-500 truncate">{row.department}</div>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Icon name="BoltIcon" className="w-3 h-3 text-amber-500" />
              {row.activityCount.toLocaleString()} actions
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="SparklesIcon" className="w-3 h-3 text-purple-500" />
              {row.aiInteractions.toLocaleString()} AI
            </span>
          </div>
        </div>
        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-slate-900">
            {Math.round(row.score).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">score</div>
        </div>
      </div>
      {isFirst && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          👑 CHAMPION
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function HRDashboard() {
  const currentUser = useSelector((state) => state.auth?.user)
  const navigate = useNavigate()
  const notifRef = useRef(null)

  const [workforce, setWorkforce] = useState([])
  const [live, setLive] = useState(null)
  const [daily, setDaily] = useState(null)
  const [monthly, setMonthly] = useState(null)

  // Payroll / leave / salary pending data (from 4.2 + 4.3)
  const [pending, setPending] = useState({
    pendingLeave: [], pendingLeaveCount: 0,
    pendingAlerts: [], pendingAlertsCount: 0,
    pendingSalary: [], pendingSalaryCount: 0,
    pendingSlips: [], pendingSlipsCount: 0,
    payrollSummary: null,
  })
  const [notifOpen, setNotifOpen] = useState(false)
  const [loadingPayroll, setLoadingPayroll] = useState(false)

  const [loadingWorkforce, setLoadingWorkforce] = useState(true)
  const [loadingLive, setLoadingLive] = useState(true)
  const [workforceError, setWorkforceError] = useState(null)
  const [timesheetError, setTimesheetError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [now, setNow] = useState(new Date())

  // AI Champion spotlight state (gracefully optional — never blocks the page)
  const [aiChampion, setAiChampion] = useState(null)
  const [aiLeaderboard, setAiLeaderboard] = useState([])
  const [aiCost, setAiCost] = useState(null)
  const [aiForbidden, setAiForbidden] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Close notif dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

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

  // ── Fetch pending actions from 4.2 Payroll + 4.3 Leave/Salary (polled)
  const loadPayrollData = useCallback(async () => {
    if (!HR_DASHBOARD_SECTIONS.pendingActions && !HR_DASHBOARD_SECTIONS.payrollSnapshot) return
    setLoadingPayroll(true)
    try {
      const [leaveRes, alertsRes, salaryRes, slipsRes, summaryRes] = await Promise.allSettled([
        payrollService.getLeaveRequests({ status: 'PENDING', page_size: 10 }),
        payrollService.getAuditAlerts({ status: 'open', page_size: 10 }),
        payrollService.getPendingSalaryStructures(),
        payrollService.getSalarySlips({ status: 'pending_approval', page_size: 10 }),
        payrollService.getDashboardSummary(),
      ])

      const leaveList   = leaveRes.status   === 'fulfilled' ? (leaveRes.value?.results   ?? leaveRes.value   ?? []) : []
      const alertsList  = alertsRes.status  === 'fulfilled' ? (alertsRes.value?.results  ?? alertsRes.value  ?? []) : []
      const salaryList  = salaryRes.status  === 'fulfilled' ? (salaryRes.value?.results  ?? Array.isArray(salaryRes.value) ? salaryRes.value : []) : []
      const slipsList   = slipsRes.status   === 'fulfilled' ? (slipsRes.value?.results   ?? slipsRes.value   ?? []) : []
      const summary     = summaryRes.status === 'fulfilled' ? summaryRes.value : null

      setPending({
        pendingLeave:        Array.isArray(leaveList)  ? leaveList  : [],
        pendingLeaveCount:   leaveRes.status  === 'fulfilled' ? (leaveRes.value?.count  ?? leaveList.length)  : 0,
        pendingAlerts:       Array.isArray(alertsList) ? alertsList : [],
        pendingAlertsCount:  alertsRes.status === 'fulfilled' ? (alertsRes.value?.count ?? alertsList.length) : 0,
        pendingSalary:       Array.isArray(salaryList) ? salaryList : [],
        pendingSalaryCount:  Array.isArray(salaryList) ? salaryList.length : 0,
        pendingSlips:        Array.isArray(slipsList)  ? slipsList  : [],
        pendingSlipsCount:   slipsRes.status  === 'fulfilled' ? (slipsRes.value?.count  ?? slipsList.length)  : 0,
        payrollSummary:      summary,
      })
    } catch (err) {
      console.warn('[HRDashboard] payroll data load failed', err)
    } finally {
      setLoadingPayroll(false)
    }
  }, [])

  // ── Initial mount
  useEffect(() => {
    loadWorkforce()
    loadTimesheets()
    loadPayrollData()
  }, [loadWorkforce, loadTimesheets, loadPayrollData])

  // ── Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(() => {
      loadTimesheets()
      loadPayrollData()
    }, HR_DASHBOARD_POLL_MS)
    return () => clearInterval(id)
  }, [autoRefresh, loadTimesheets, loadPayrollData])

  // ── Live clock for the header
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── AI Champion spotlight (read-only, optional, never blocks the page)
  const loadAIChampion = useCallback(async () => {
    if (!HR_DASHBOARD_SECTIONS.aiChampion) return
    setAiLoading(true)
    try {
      const days = HR_DASHBOARD_AI_CHAMPION.windowDays
      const [champRes, lbRes, costRes] = await Promise.allSettled([
        analyticsService.getCurrentChampion(),
        analyticsService.getChampionLeaderboard(days, HR_DASHBOARD_AI_CHAMPION.podiumSize),
        analyticsService.getCostReport(days),
      ])
      // Detect 403 across any call — fold into a single "forbidden" flag
      const forbidden = [champRes, lbRes, costRes].some(
        (r) => r.status === 'rejected' && (r.reason?.response?.status === 403 || r.reason?.status === 403)
      )
      setAiForbidden(forbidden)
      if (champRes.status === 'fulfilled') setAiChampion(champRes.value)
      if (lbRes.status === 'fulfilled') setAiLeaderboard(buildAIChampionPodium(lbRes.value))
      if (costRes.status === 'fulfilled') setAiCost(costRes.value)
    } catch (err) {
      console.warn('[HRDashboard] AI champion load failed', err)
    } finally {
      setAiLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAIChampion()
  }, [loadAIChampion])

  useEffect(() => {
    if (!autoRefresh || !HR_DASHBOARD_SECTIONS.aiChampion) return undefined
    const id = setInterval(loadAIChampion, HR_DASHBOARD_AI_CHAMPION.pollMs)
    return () => clearInterval(id)
  }, [autoRefresh, loadAIChampion])
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

  // Derived pending counts (update with each `pending` state change)
  const totalPending = useMemo(() => buildTotalPending(pending), [pending])
  const payrollKpiValues = useMemo(
    () =>
      HR_DASHBOARD_PAYROLL_KPIS.map((kpi) =>
        kpi.compute({
          pendingLeaveCount:  pending.pendingLeaveCount,
          pendingAlertsCount: pending.pendingAlertsCount,
          pendingSalaryCount: pending.pendingSalaryCount,
          pendingSlipsCount:  pending.pendingSlipsCount,
          payrollSummary:     pending.payrollSummary,
        })
      ),
    [pending]
  )

  const greeting = getGreeting()
  const userFirstName =
    currentUser?.first_name ||
    (currentUser?.full_name ? currentUser.full_name.split(/\s+/)[0] : '') ||
    'there'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 sm:p-6 lg:p-8 xl:px-10 2xl:px-12">
      <div className="max-w-screen-2xl mx-auto space-y-6">

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

            {/* ── Notification Bell ─────────────────────────────────── */}
            {HR_DASHBOARD_SECTIONS.pendingActions && (
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative px-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  title="Pending actions"
                >
                  <Icon name="BellIcon" className="w-4 h-4" />
                  {totalPending > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 shadow">
                      {totalPending > 99 ? '99+' : totalPending}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <NotifDropdown
                    pending={pending}
                    total={totalPending}
                    navigate={navigate}
                    onClose={() => setNotifOpen(false)}
                  />
                )}
              </div>
            )}

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
              onClick={() => { loadTimesheets(); loadPayrollData() }}
              disabled={loadingLive || loadingPayroll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Icon name="ArrowPathIcon" className={`w-3.5 h-3.5 inline mr-1 ${loadingLive || loadingPayroll ? 'animate-spin' : ''}`} />
              {loadingLive || loadingPayroll ? HR_DASHBOARD_COPY.refreshing : HR_DASHBOARD_COPY.manualRefresh}
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

        {/* ── Payroll Snapshot KPI strip (secondary row) ───────────────── */}
        {HR_DASHBOARD_SECTIONS.payrollSnapshot && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {HR_DASHBOARD_COPY.sectionPayrollSnapshot}
              </span>
              {loadingPayroll && (
                <Icon name="ArrowPathIcon" className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HR_DASHBOARD_PAYROLL_KPIS.map((kpi, idx) => (
                <PayrollKpiTile
                  key={kpi.id}
                  kpi={kpi}
                  value={payrollKpiValues[idx]}
                  onClick={() => navigate('/hr/payroll')}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Pending Actions inbox ────────────────────────────────────── */}
        {HR_DASHBOARD_SECTIONS.pendingActions && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{HR_DASHBOARD_COPY.sectionPending}</h2>
                <p className="text-xs text-slate-500">{HR_DASHBOARD_COPY.sectionPendingHint}</p>
              </div>
              {totalPending === 0 && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <Icon name="CheckCircleIcon" className="w-4 h-4" />
                  {HR_DASHBOARD_COPY.emptyPending}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {HR_DASHBOARD_PENDING_TYPES.map((type) => (
                <PendingActionCard key={type.id} type={type} pending={pending} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

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

        {/* ── AI Champion spotlight ───────────────────────────────────── */}
        {HR_DASHBOARD_SECTIONS.aiChampion && (
          <Section
            title={HR_DASHBOARD_COPY.sectionAIChampion}
            hint={HR_DASHBOARD_COPY.sectionAIChampionHint}
            icon="TrophyIcon"
            action={
              <Link
                to={HR_DASHBOARD_AI_CHAMPION.fullConsoleRoute}
                className="text-xs font-semibold text-amber-700 hover:underline inline-flex items-center gap-1"
              >
                {HR_DASHBOARD_COPY.aiChampionLinkLabel} →
              </Link>
            }
          >
            {aiForbidden ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Icon name="TrophyIcon" className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div className="text-sm text-amber-800 min-w-0">
                    {HR_DASHBOARD_COPY.aiChampionForbidden}
                  </div>
                </div>
                <Link
                  to={HR_DASHBOARD_AI_CHAMPION.fullConsoleRoute}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex-shrink-0"
                >
                  Open console
                </Link>
              </div>
            ) : aiLoading && aiLeaderboard.length === 0 ? (
              <div className="text-sm text-slate-500 italic py-6 text-center">
                {HR_DASHBOARD_COPY.loading}
              </div>
            ) : aiLeaderboard.length === 0 ? (
              <div className="text-sm text-slate-500 italic py-6 text-center">
                {HR_DASHBOARD_COPY.emptyAIChampion}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mini KPI strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {HR_DASHBOARD_AI_CHAMPION.kpis.map((kpi) => {
                    let value = '—'
                    if (kpi.id === 'champion') {
                      const c =
                        aiChampion?.user_full_name ||
                        aiChampion?.full_name ||
                        aiLeaderboard[0]?.name ||
                        '—'
                      value = c.split(/\s+/).slice(0, 2).join(' ')
                    } else if (kpi.id === 'players') {
                      value = (aiChampion?.total_participants ?? aiLeaderboard.length ?? 0).toLocaleString()
                    } else if (kpi.id === 'activity') {
                      value = aiLeaderboard
                        .reduce((acc, r) => acc + (r.activityCount || 0), 0)
                        .toLocaleString()
                    } else if (kpi.id === 'savings') {
                      value = formatAICost(aiCost)
                    }
                    return (
                      <div
                        key={kpi.id}
                        className={`rounded-xl bg-gradient-to-br ${kpi.accent} text-white p-3 shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon name={kpi.icon} className="w-5 h-5 opacity-90" />
                          <span className="text-[10px] uppercase tracking-wider opacity-80">
                            {kpi.label}
                          </span>
                        </div>
                        <div className="mt-2 text-lg font-bold truncate" title={String(value)}>
                          {value}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Podium */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiLeaderboard.map((row) => (
                    <PodiumCard key={row.email || row.rank} row={row} />
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  Rolling window: last {HR_DASHBOARD_AI_CHAMPION.windowDays} days · auto-refresh
                  every {Math.round(HR_DASHBOARD_AI_CHAMPION.pollMs / 60000)} min
                </div>
              </div>
            )}
          </Section>
        )}

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
