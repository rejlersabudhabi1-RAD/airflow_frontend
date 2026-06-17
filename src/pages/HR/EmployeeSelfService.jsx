/**
 * Employee Self-Service (ESS) Portal
 * Route: /hr/leave
 * ============================================================
 * A standalone employee-facing dashboard. Read-only integration
 * with existing payroll, timesheet, and RBAC services.
 *
 * ZERO modification to payroll / attendance / employee business logic.
 * All data is consumed via existing service layer (read-only where applicable).
 *
 * Sections:
 *  0 — Overview (profile header + today's status + AI insights)
 *  1 — Leave (balance cards + request form)
 *  2 — Attendance (charts + calendar heatmap)
 *  3 — Timesheet (hours breakdown + trends)
 *  4 — Payroll (read-only snapshot)
 *  5 — Team Calendar (team availability)
 *  6 — Digital Twin (health scores)
 *  7 — Notifications
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import PeopleNav from '../../components/PeopleNav/PeopleNav'
import rbacService   from '../../services/rbac.service'
import payrollService from '../../services/payroll.service'
import timesheetSvc   from '../../services/timesheet.service'
import { fmtCurrency } from '../../config/hrPayroll.config'
import { ESS_LEAVE_TYPE_CONFIG, LEAVE_YEAR } from '../../config/hrLeave.config'

// ─────────────────────────────────────────────────────────────────────────────
// Soft-coded configuration
// ─────────────────────────────────────────────────────────────────────────────

const ESS_TABS = [
  { id: 'overview',    label: 'Overview',        icon: 'HomeIcon' },
  { id: 'leave',       label: 'Leave',           icon: 'CalendarDaysIcon' },
  { id: 'attendance',  label: 'Attendance',      icon: 'ClipboardDocumentCheckIcon' },
  { id: 'timesheet',   label: 'Timesheet',       icon: 'ClockIcon' },
  { id: 'payroll',     label: 'Payroll',         icon: 'BanknotesIcon' },
  { id: 'team',        label: 'Team',            icon: 'UserGroupIcon' },
  { id: 'twin',        label: 'Digital Twin',    icon: 'SparklesIcon' },
  { id: 'notifications', label: 'Notifications', icon: 'BellIcon' },
]

// Leave type config sourced from hrLeave.config.js — single source of truth
const LEAVE_TYPE_CONFIG = ESS_LEAVE_TYPE_CONFIG

const ATTENDANCE_STATUS_MAP = {
  present:   { label: 'Present',         dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  absent:    { label: 'Absent',          dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  leave:     { label: 'On Leave',        dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  remote:    { label: 'Remote Work',     dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  weekend:   { label: 'Weekend',         dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-500 border-slate-200' },
  holiday:   { label: 'Public Holiday',  dot: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  missing:   { label: 'Missing',         dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SCORE_CONFIG = [
  { id: 'attendance',   label: 'Attendance',           color: '#3b82f6', icon: 'ClipboardDocumentCheckIcon' },
  { id: 'productivity', label: 'Productivity',          color: '#10b981', icon: 'ChartBarIcon' },
  { id: 'timesheet',    label: 'Timesheet Compliance', color: '#f59e0b', icon: 'ClockIcon' },
  { id: 'leave',        label: 'Leave Utilization',    color: '#8b5cf6', icon: 'CalendarDaysIcon' },
  { id: 'payroll',      label: 'Payroll Consistency',  color: '#ef4444', icon: 'BanknotesIcon' },
]

const STANDARD_DAILY_HOURS = 9
const STANDARD_MONTHLY_HOURS = 198   // ~22 days × 9 h
const NOTIFICATION_PRIORITY = {
  high:   { badge: 'bg-rose-100 text-rose-700',   dot: 'bg-rose-500' },
  medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low:    { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components (stable references outside main component)
// ─────────────────────────────────────────────────────────────────────────────

const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return (
    <svg className={`animate-spin ${s} text-blue-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

const Icon = ({ name, className = 'w-5 h-5' }) => {
  const C = HeroIcons[name] || HeroIcons.QuestionMarkCircleIcon
  return <C className={className} aria-hidden="true" />
}

const KpiCard = ({ icon, label, value, sub, tone = 'blue', trend = null }) => {
  const tones = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   icon: 'text-blue-500' },
    green:  { bg: 'bg-emerald-50',border: 'border-emerald-100',text: 'text-emerald-700',icon: 'text-emerald-500' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-700',  icon: 'text-amber-500' },
    purple: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', icon: 'text-violet-500' },
    rose:   { bg: 'bg-rose-50',   border: 'border-rose-100',   text: 'text-rose-700',   icon: 'text-rose-500' },
    slate:  { bg: 'bg-slate-50',  border: 'border-slate-100',  text: 'text-slate-700',  icon: 'text-slate-500' },
  }
  const t = tones[tone] || tones.blue
  return (
    <div className={`${t.bg} ${t.border} border rounded-xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon name={icon} className={`w-4 h-4 ${t.icon}`} />
      </div>
      <div className={`text-2xl font-bold ${t.text}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
      {trend !== null && (
        <div className={`text-xs flex items-center gap-1 mt-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          <Icon name={trend >= 0 ? 'ArrowUpIcon' : 'ArrowDownIcon'} className="w-3 h-3" />
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}

const SectionCard = ({ title, subtitle, icon, action, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} className="w-5 h-5 text-slate-500" />}
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
)

const ProgressBar = ({ value, max, color = 'bg-blue-500', label, showPct = false }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{showPct ? `${pct}%` : `${value} / ${max}`}</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const SkeletonBox = ({ className = '' }) => (
  <div className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
)

const EmptyNotice = ({ icon = 'InboxIcon', message = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
    <Icon name={icon} className="w-8 h-8 opacity-50" />
    <span className="text-sm">{message}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10)
const nowYear  = () => new Date().getFullYear()
const nowMonth = () => new Date().getMonth() + 1

const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtHours = (h) => {
  if (h === null || h === undefined) return '—'
  const n = Number(h)
  if (isNaN(n)) return '—'
  const hrs = Math.floor(n)
  const mins = Math.round((n - hrs) * 60)
  return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`
}

const avatarInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

// Soft-coded: role entries from /rbac/users/me/ can be either a string or an
// object { id, name, code, level }. Centralise the extraction here so no
// component ever renders a raw object as a React child.
const ROLE_LABEL_FIELDS = ['name', 'code', 'label']
const roleLabel = (role) => {
  if (!role) return ''
  if (typeof role === 'string') return role
  for (const field of ROLE_LABEL_FIELDS) {
    if (role[field] && typeof role[field] === 'string') return role[field]
  }
  return String(role.id ?? '')
}

// Build a simple AI insight engine from live data
const generateInsights = ({ leaveRecord, monthlyTs, today, slips }) => {
  const insights = []
  const now = new Date()

  if (leaveRecord) {
    const bal = Number(leaveRecord.leave_balance) || 0
    const rate = leaveRecord.total_earned > 0
      ? Math.round((leaveRecord.total_taken / leaveRecord.total_earned) * 100)
      : 0
    insights.push({
      id: 'leave_balance',
      icon: 'CalendarDaysIcon',
      severity: bal < 3 ? 'warning' : 'info',
      title: `${bal.toFixed(1)} annual leave days remaining`,
      description: bal < 3
        ? 'Your leave balance is running low. Plan your time off accordingly.'
        : `You have used ${rate}% of your annual leave entitlement this year.`,
    })
  }

  if (monthlyTs) {
    const totalHrs = Number(monthlyTs.total_hours) || 0
    const otHrs    = Number(monthlyTs.total_overtime) || 0
    const days     = Number(monthlyTs.working_days) || 0
    const attRate  = days > 0 && monthlyTs.present_days != null
      ? Math.round((monthlyTs.present_days / days) * 100)
      : null

    if (attRate !== null) {
      insights.push({
        id: 'attendance_rate',
        icon: 'ClipboardDocumentCheckIcon',
        severity: attRate >= 95 ? 'success' : attRate >= 80 ? 'warning' : 'error',
        title: `Attendance rate this month: ${attRate}%`,
        description: attRate >= 95
          ? 'Excellent attendance — keep it up!'
          : `Your attendance is below target. ${days - (monthlyTs.present_days || 0)} working days were missed.`,
      })
    }

    if (otHrs > 0) {
      insights.push({
        id: 'overtime',
        icon: 'ClockIcon',
        severity: 'info',
        title: `${fmtHours(otHrs)} overtime worked this month`,
        description: otHrs > 20
          ? `High overtime detected. ${fmtHours(otHrs)} extra hours logged — consider discussing workload with your manager.`
          : `You logged ${fmtHours(otHrs)} overtime hours this month.`,
      })
    }

    if (totalHrs < STANDARD_MONTHLY_HOURS * 0.8 && days > 10) {
      insights.push({
        id: 'low_hours',
        icon: 'ExclamationCircleIcon',
        severity: 'warning',
        title: 'Total hours below expected',
        description: `You have logged ${fmtHours(totalHrs)} this month. Expected: ~${fmtHours(STANDARD_MONTHLY_HOURS)}.`,
      })
    }
  }

  if (slips && slips.length > 0) {
    const latest = slips[0]
    const net = parseFloat(latest.net_salary) || 0
    if (net > 0) {
      insights.push({
        id: 'payslip',
        icon: 'BanknotesIcon',
        severity: 'info',
        title: `Latest payslip: ${fmtCurrency(net)} net`,
        description: `Your most recent salary slip (${MONTH_SHORT[(latest.month || 1) - 1]} ${latest.year}) has status: ${latest.status || 'generated'}.`,
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'all_good',
      icon: 'CheckCircleIcon',
      severity: 'success',
      title: 'Everything looks good!',
      description: 'No outstanding items require your attention right now.',
    })
  }

  return insights
}

const INSIGHT_TONES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error:   'bg-rose-50 border-rose-200 text-rose-800',
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Employee Profile Header
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeProfileHeader = ({ profile, leaveRecord, monthlyTs, salaryInfo, loading }) => {
  const name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
    : null
  const initials = name ? avatarInitials(name) : '??'

  const quickStats = [
    {
      label: 'Leave Balance',
      value: leaveRecord ? `${Number(leaveRecord.leave_balance).toFixed(1)} d` : '—',
      icon: 'CalendarDaysIcon',
      tone: 'blue',
    },
    {
      label: 'Month Hours',
      value: monthlyTs ? fmtHours(monthlyTs.total_hours) : '—',
      icon: 'ClockIcon',
      tone: 'green',
    },
    {
      label: 'Month OT',
      value: monthlyTs ? fmtHours(monthlyTs.total_overtime) : '—',
      icon: 'ArrowTrendingUpIcon',
      tone: 'amber',
    },
    {
      label: 'Basic Salary',
      value: salaryInfo ? fmtCurrency(salaryInfo.basic_salary) : '—',
      icon: 'BanknotesIcon',
      tone: 'purple',
    },
  ]

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 border-4 border-white/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow" title="Active" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <SkeletonBox className="h-6 w-48 bg-white/20" />
                <SkeletonBox className="h-4 w-32 bg-white/20" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white truncate">{name || 'Employee'}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-blue-100 text-sm">
                  {profile?.employee_id && (
                    <span className="flex items-center gap-1">
                      <Icon name="IdentificationIcon" className="w-4 h-4" />
                      {profile.employee_id}
                    </span>
                  )}
                  {(profile?.engineer_profile?.designation || profile?.designation) && (
                    <span className="flex items-center gap-1">
                      <Icon name="BriefcaseIcon" className="w-4 h-4" />
                      {profile?.engineer_profile?.designation || profile?.designation}
                    </span>
                  )}
                  {profile?.department && (
                    <span className="flex items-center gap-1">
                      <Icon name="BuildingOfficeIcon" className="w-4 h-4" />
                      {profile.department}
                    </span>
                  )}
                  {profile?.email && (
                    <span className="flex items-center gap-1">
                      <Icon name="EnvelopeIcon" className="w-4 h-4" />
                      {profile.email}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-medium border border-emerald-300/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {profile?.is_active !== false ? 'Active Employee' : 'Inactive'}
                  </span>
                  {profile?.roles?.[0] && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/20">
                      {roleLabel(profile.roles[0])}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ESS badge */}
          <div className="hidden lg:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
              <Icon name="SparklesIcon" className="w-5 h-5 text-blue-200" />
              <div>
                <div className="text-white font-semibold text-sm">My Workspace</div>
                <div className="text-blue-200 text-xs">Employee Self-Service</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {quickStats.map((s) => (
            <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-200 text-xs">{s.label}</span>
                <Icon name={s.icon} className="w-4 h-4 text-blue-200" />
              </div>
              <div className="text-white font-bold text-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Today's Status
// ─────────────────────────────────────────────────────────────────────────────

const TodayStatusCard = ({ todayData, loading }) => {
  const status = todayData?.status || 'missing'
  const sm = ATTENDANCE_STATUS_MAP[status] || ATTENDANCE_STATUS_MAP.missing
  const checkin  = todayData?.check_in_time  || todayData?.first_in
  const checkout = todayData?.check_out_time || todayData?.last_out
  const hours    = Number(todayData?.total_hours) || 0
  const ot       = Number(todayData?.overtime_hours) || 0
  const utilPct  = hours > 0 ? Math.min(100, Math.round((hours / STANDARD_DAILY_HOURS) * 100)) : 0

  return (
    <SectionCard
      title="Today's Status"
      subtitle={fmtDate(new Date())}
      icon="SunIcon"
    >
      {loading ? (
        <div className="space-y-3">
          <SkeletonBox className="h-10 w-full" />
          <SkeletonBox className="h-6 w-3/4" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${sm.dot}`} />
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${sm.badge}`}>
              {sm.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Icon name="ArrowRightCircleIcon" className="w-3.5 h-3.5 text-emerald-500" />
                Check-In
              </div>
              <div className="font-bold text-slate-800">{checkin || '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Icon name="ArrowLeftCircleIcon" className="w-3.5 h-3.5 text-rose-500" />
                Check-Out
              </div>
              <div className="font-bold text-slate-800">{checkout || '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Icon name="ClockIcon" className="w-3.5 h-3.5 text-blue-500" />
                Total Hours
              </div>
              <div className="font-bold text-slate-800">{hours > 0 ? fmtHours(hours) : '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Icon name="ArrowTrendingUpIcon" className="w-3.5 h-3.5 text-amber-500" />
                Overtime
              </div>
              <div className="font-bold text-slate-800">{ot > 0 ? fmtHours(ot) : '—'}</div>
            </div>
          </div>

          <div>
            <ProgressBar
              value={utilPct}
              max={100}
              color={utilPct >= 100 ? 'bg-emerald-500' : utilPct >= 70 ? 'bg-blue-500' : 'bg-amber-500'}
              label={`Day Utilization`}
              showPct
            />
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: AI Insights
// ─────────────────────────────────────────────────────────────────────────────

const AIInsightsPanel = ({ insights, loading }) => (
  <SectionCard
    title="AI Insights"
    subtitle="Powered by RADAI Employee Intelligence"
    icon="SparklesIcon"
  >
    {loading ? (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <SkeletonBox key={i} className="h-14 w-full" />)}
      </div>
    ) : insights.length === 0 ? (
      <EmptyNotice icon="LightBulbIcon" message="No insights yet — check back after data loads." />
    ) : (
      <div className="space-y-3">
        {insights.map((ins) => (
          <div key={ins.id} className={`border rounded-xl p-3 ${INSIGHT_TONES[ins.severity] || INSIGHT_TONES.info}`}>
            <div className="flex items-start gap-2">
              <Icon name={ins.icon} className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{ins.title}</div>
                <div className="text-xs opacity-80 mt-0.5">{ins.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
)

// ─────────────────────────────────────────────────────────────────────────────
// Section: Leave Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const LeaveBalanceSection = ({ leaveRecord, requests, loading }) => {
  const taken     = Number(leaveRecord?.total_taken)    || 0
  const earned    = Number(leaveRecord?.total_earned)   || 0
  const encashed  = Number(leaveRecord?.total_encashed) || 0
  const balance   = Number(leaveRecord?.leave_balance)  || 0

  const leaveTypes = Object.entries(LEAVE_TYPE_CONFIG).map(([key, cfg]) => ({
    ...cfg,
    key,
    balance: key === 'annual' ? balance : 0,
    taken:   key === 'annual' ? taken : 0,
  }))

  const pieData = [
    { name: 'Taken',    value: taken,   fill: '#3b82f6' },
    { name: 'Balance',  value: balance, fill: '#10b981' },
    { name: 'Encashed', value: encashed, fill: '#f59e0b' },
  ].filter(d => d.value > 0)

  const pending  = (requests || []).filter(r => r.status === 'pending')
  const approved = (requests || []).filter(r => r.status === 'approved')
  const upcoming = approved.filter(r => new Date(r.start_date) >= new Date())

  return (
    <div className="space-y-5">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon="CalendarDaysIcon" label="Annual Balance"  value={`${balance.toFixed(1)} d`}  sub={`${earned.toFixed(1)} earned`} tone="blue" />
        <KpiCard icon="ClipboardDocumentCheckIcon" label="Days Taken" value={`${taken.toFixed(1)} d`} sub="This year" tone="green" />
        <KpiCard icon="BanknotesIcon" label="Encashed" value={`${encashed.toFixed(1)} d`} sub="Leave encashment" tone="amber" />
        <KpiCard icon="ClockIcon" label="Pending Requests" value={pending.length} sub="Awaiting approval" tone={pending.length > 0 ? 'rose' : 'slate'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Leave type cards */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaveTypes.map((lt) => (
            <div key={lt.key} className={`${lt.bg} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`text-sm font-semibold ${lt.text}`}>{lt.label}</div>
                {lt.entitlement > 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${lt.text}`}>
                    {lt.entitlement} d/yr
                  </span>
                )}
              </div>
              {lt.key === 'annual' ? (
                <>
                  <div className={`text-3xl font-bold ${lt.text}`}>{balance.toFixed(1)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">days remaining</div>
                  <div className="mt-3">
                    <ProgressBar
                      value={taken}
                      max={lt.entitlement}
                      color={lt.bar}
                      label="Used"
                    />
                  </div>
                </>
              ) : (
                <div className={`text-xl font-bold ${lt.text} opacity-50`}>N/A</div>
              )}
            </div>
          ))}
        </div>

        {/* Pie chart */}
        <SectionCard title="Leave Distribution" icon="ChartPieIcon">
          {loading ? (
            <SkeletonBox className="h-40 w-full" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} d`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyNotice icon="ChartPieIcon" message="No leave data" />
          )}
        </SectionCard>
      </div>

      {/* Upcoming approved leaves */}
      {upcoming.length > 0 && (
        <SectionCard title="Upcoming Approved Leave" icon="CalendarDaysIcon">
          <div className="divide-y divide-slate-100">
            {upcoming.slice(0, 5).map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.leave_type_display || r.leave_type || 'Leave'}</div>
                  <div className="text-xs text-slate-400">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {r.duration_days || '?'} day{r.duration_days !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Leave Request Form
// ─────────────────────────────────────────────────────────────────────────────

const LeaveRequestForm = ({ leaveTypes, leaveRecord, requests, onSubmit, submitting, submitResult }) => {
  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    half_day: false,
    reason: '',
  })
  const [calcDays, setCalcDays] = useState(null)
  const [conflict, setConflict] = useState(false)

  const balance = Number(leaveRecord?.leave_balance) || 0

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    if (!form.start_date || !form.end_date) { setCalcDays(null); return }
    const s = new Date(form.start_date)
    const e = new Date(form.end_date)
    if (e < s) { setCalcDays(null); return }
    let days = 0
    const d = new Date(s)
    while (d <= e) {
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) days++
      d.setDate(d.getDate() + 1)
    }
    if (form.half_day) days = Math.max(0.5, days - 0.5)
    setCalcDays(days)

    // Conflict detection against approved requests
    const hasConflict = (requests || []).some(r => {
      if (!['approved', 'pending'].includes(r.status)) return false
      const rs = new Date(r.start_date)
      const re = new Date(r.end_date)
      return s <= re && e >= rs
    })
    setConflict(hasConflict)
  }, [form.start_date, form.end_date, form.half_day, requests])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.leave_type || !form.start_date || !form.end_date) return
    onSubmit(form)
  }

  const insufficient = form.leave_type === 'annual' && calcDays !== null && calcDays > balance

  const defaultTypes = [
    { id: 'annual', name: 'Annual Leave' },
    { id: 'sick',   name: 'Sick Leave' },
    { id: 'emergency', name: 'Emergency Leave' },
    { id: 'compensatory', name: 'Compensatory Leave' },
    { id: 'unpaid', name: 'Unpaid Leave' },
  ]
  const types = leaveTypes?.length > 0 ? leaveTypes : defaultTypes

  return (
    <SectionCard title="Apply for Leave" subtitle="Submit a new leave request" icon="PencilSquareIcon">
      {submitResult?.success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm flex items-center gap-2">
          <Icon name="CheckCircleIcon" className="w-4 h-4 flex-shrink-0" />
          {submitResult.message || 'Leave request submitted successfully!'}
        </div>
      )}
      {submitResult?.error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm flex items-center gap-2">
          <Icon name="ExclamationCircleIcon" className="w-4 h-4 flex-shrink-0" />
          {submitResult.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Leave type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Leave Type *</label>
            <select
              value={form.leave_type}
              onChange={(e) => set('leave_type', e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">Select leave type…</option>
              {types.map(t => (
                <option key={t.id || t.name} value={t.id || t.name}>{t.name || t.label}</option>
              ))}
            </select>
          </div>

          {/* Half day toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('half_day', !form.half_day)}
                className={`w-10 h-5 rounded-full transition-colors ${form.half_day ? 'bg-blue-500' : 'bg-slate-200'} relative`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.half_day ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-600">Half Day</span>
            </label>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date *</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              required
              min={todayStr()}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date *</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              required
              min={form.start_date || todayStr()}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            rows={3}
            placeholder="Briefly describe your reason for leave…"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        {/* Impact preview */}
        {calcDays !== null && (
          <div className={`rounded-xl p-3 border text-sm ${
            insufficient ? 'bg-rose-50 border-rose-200 text-rose-700'
            : conflict    ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Icon name={insufficient ? 'ExclamationCircleIcon' : conflict ? 'ExclamationTriangleIcon' : 'InformationCircleIcon'} className="w-4 h-4" />
              Leave Impact Preview
            </div>
            <div className="text-xs space-y-0.5">
              <div>Duration: <strong>{calcDays} working day{calcDays !== 1 ? 's' : ''}</strong></div>
              {form.leave_type === 'annual' && (
                <div>Balance after approval: <strong>{(balance - calcDays).toFixed(1)} days</strong></div>
              )}
              {conflict && <div>⚠ Overlapping leave request detected</div>}
              {insufficient && <div>✗ Insufficient annual leave balance</div>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400">
            Request will go to your manager for approval
          </div>
          <button
            type="submit"
            disabled={submitting || insufficient || !form.leave_type || !form.start_date || !form.end_date}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : <Icon name="PaperAirplaneIcon" className="w-4 h-4" />}
            Submit Request
          </button>
        </div>
      </form>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Attendance Analytics
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceAnalytics = ({ monthlyTs, loading }) => {
  // Build chart data from monthly timesheet
  const trendData = useMemo(() => {
    if (!monthlyTs?.daily_breakdown) return []
    return (monthlyTs.daily_breakdown || []).slice(-30).map((d) => ({
      date:  d.date?.slice(5) || '',
      hours: Number(d.hours_worked) || 0,
      ot:    Number(d.overtime) || 0,
    }))
  }, [monthlyTs])

  // Monthly summary stats
  const presentDays = monthlyTs?.present_days || 0
  const workingDays = monthlyTs?.working_days || monthlyTs?.total_working_days || 22
  const absentDays  = workingDays - presentDays
  const attRate     = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0

  const summaryData = [
    { name: 'Present',  value: presentDays, fill: '#10b981' },
    { name: 'Absent',   value: absentDays > 0 ? absentDays : 0, fill: '#ef4444' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon="CheckCircleIcon" label="Present Days" value={presentDays} sub={`of ${workingDays} working days`} tone="green" />
        <KpiCard icon="XCircleIcon" label="Absent Days" value={Math.max(0, absentDays)} sub="This month" tone={absentDays > 3 ? 'rose' : 'slate'} />
        <KpiCard icon="ChartBarIcon" label="Attendance Rate" value={`${attRate}%`} sub={attRate >= 95 ? 'Excellent' : attRate >= 80 ? 'Good' : 'Needs attention'} tone={attRate >= 95 ? 'green' : attRate >= 80 ? 'amber' : 'rose'} />
        <KpiCard icon="ArrowTrendingUpIcon" label="Overtime Hours" value={fmtHours(monthlyTs?.total_overtime)} sub="This month" tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Daily hours trend */}
        <div className="xl:col-span-2">
          <SectionCard title="Daily Hours Trend" subtitle="Working hours per day this month" icon="ClockIcon">
            {loading ? (
              <SkeletonBox className="h-52 w-full" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 14]} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} h`]} />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" fill="#dbeafe" name="Hours Worked" strokeWidth={2} />
                  <Area type="monotone" dataKey="ot" stroke="#f59e0b" fill="#fef3c7" name="Overtime" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyNotice icon="ChartBarIcon" message="No daily data available for this month" />
            )}
          </SectionCard>
        </div>

        {/* Attendance pie */}
        <SectionCard title="Month Summary" subtitle={`${MONTH_SHORT[nowMonth() - 1]} ${nowYear()}`} icon="ChartPieIcon">
          {loading ? (
            <SkeletonBox className="h-52 w-full" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={summaryData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {summaryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {summaryData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                      {s.name}
                    </div>
                    <span className="font-semibold">{s.value} days</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Timesheet Insights
// ─────────────────────────────────────────────────────────────────────────────

const TimesheetInsights = ({ monthlyTs, userHistory, loading }) => {
  const totalHrs    = Number(monthlyTs?.total_hours) || 0
  const totalOt     = Number(monthlyTs?.total_overtime) || 0
  const billable    = Number(monthlyTs?.billable_hours) || 0
  const utilPct     = STANDARD_MONTHLY_HOURS > 0 ? Math.min(100, Math.round((totalHrs / STANDARD_MONTHLY_HOURS) * 100)) : 0

  // Weekly trend from user history
  const weeklyData = useMemo(() => {
    if (!userHistory?.weekly_summary) return []
    return (userHistory.weekly_summary || []).slice(-8).map((w) => ({
      week:  `W${w.week_number || '?'}`,
      hours: Number(w.total_hours) || 0,
    }))
  }, [userHistory])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon="ClockIcon" label="Total Hours" value={fmtHours(totalHrs)} sub={`of ~${fmtHours(STANDARD_MONTHLY_HOURS)} expected`} tone="blue" />
        <KpiCard icon="ArrowTrendingUpIcon" label="Overtime" value={fmtHours(totalOt)} sub="This month" tone="amber" />
        <KpiCard icon="CurrencyDollarIcon" label="Billable Hours" value={billable > 0 ? fmtHours(billable) : '—'} sub="Chargeable to projects" tone="green" />
        <KpiCard icon="ChartBarIcon" label="Utilization" value={`${utilPct}%`} sub={utilPct >= 90 ? 'On track' : 'Below target'} tone={utilPct >= 90 ? 'green' : utilPct >= 70 ? 'amber' : 'rose'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Monthly utilization gauge */}
        <SectionCard title="Monthly Utilization" subtitle="Hours worked vs expected" icon="ChartBarSquareIcon">
          <div className="flex flex-col items-center py-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={utilPct >= 90 ? '#10b981' : utilPct >= 70 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50 * utilPct / 100} ${2 * Math.PI * 50}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{utilPct}%</span>
                <span className="text-xs text-slate-400">Utilization</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              <div className="text-center bg-slate-50 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-800">{fmtHours(totalHrs)}</div>
                <div className="text-xs text-slate-400">Worked</div>
              </div>
              <div className="text-center bg-slate-50 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-800">{fmtHours(STANDARD_MONTHLY_HOURS)}</div>
                <div className="text-xs text-slate-400">Expected</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Weekly trend */}
        <SectionCard title="Weekly Hours Trend" subtitle="Last 8 weeks" icon="CalendarIcon">
          {loading ? (
            <SkeletonBox className="h-52 w-full" />
          ) : weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} h`, 'Hours']} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyNotice icon="CalendarIcon" message="Weekly data not available" />
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Payroll Snapshot (read-only)
// ─────────────────────────────────────────────────────────────────────────────

const PayrollSnapshot = ({ salaryInfo, slips, loading }) => {
  const latest = slips?.[0] || null
  const basic  = parseFloat(salaryInfo?.basic_salary)           || 0
  const gross  = parseFloat(latest?.gross_salary)               || 0
  const net    = parseFloat(latest?.net_salary)                 || 0
  const ot     = parseFloat(latest?.overtime_pay)               || 0
  const deductions = parseFloat(latest?.total_deductions)       || 0

  const history = useMemo(() => {
    return (slips || []).slice(0, 6).reverse().map((s) => ({
      label: `${MONTH_SHORT[(s.month || 1) - 1]} ${s.year || ''}`,
      net:   parseFloat(s.net_salary) || 0,
      gross: parseFloat(s.gross_salary) || 0,
    }))
  }, [slips])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard icon="BanknotesIcon"     label="Basic Salary"    value={basic > 0 ? fmtCurrency(basic) : '—'} sub="Monthly" tone="blue" />
        <KpiCard icon="ArrowUpIcon"       label="Gross Earnings"  value={gross > 0 ? fmtCurrency(gross) : '—'} sub={latest ? `${MONTH_SHORT[(latest.month||1)-1]} ${latest.year}` : 'Latest'} tone="green" />
        <KpiCard icon="ArrowTrendingUpIcon" label="Overtime Pay"  value={ot > 0 ? fmtCurrency(ot) : '—'} sub="Included in gross" tone="amber" />
        <KpiCard icon="MinusCircleIcon"   label="Deductions"      value={deductions > 0 ? fmtCurrency(deductions) : '—'} sub="This month" tone="rose" />
        <KpiCard icon="CurrencyDollarIcon" label="Net Salary"     value={net > 0 ? fmtCurrency(net) : '—'} sub={latest?.status || '—'} tone="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Salary trend chart */}
        <SectionCard title="Salary History" subtitle="Net vs Gross (last 6 months)" icon="ChartBarIcon">
          {loading ? (
            <SkeletonBox className="h-52 w-full" />
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmtCurrency(v)]} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="gross" name="Gross" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net"   name="Net"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyNotice icon="ChartBarIcon" message="No salary history available" />
          )}
        </SectionCard>

        {/* Payslip list */}
        <SectionCard
          title="Recent Payslips"
          icon="DocumentTextIcon"
          action={
            <span className="text-xs text-blue-600 font-medium">Read-only</span>
          }
        >
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-10" />)}</div>
          ) : (slips || []).length > 0 ? (
            <div className="divide-y divide-slate-100">
              {(slips || []).slice(0, 6).map((s) => {
                const statusMeta = {
                  approved: 'bg-emerald-50 text-emerald-700',
                  sent:     'bg-purple-50 text-purple-700',
                  pending_approval: 'bg-amber-50 text-amber-700',
                  generated: 'bg-blue-50 text-blue-700',
                }[s.status] || 'bg-slate-50 text-slate-600'
                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {MONTH_SHORT[(s.month || 1) - 1]} {s.year}
                      </div>
                      <div className="text-xs text-slate-400">Net: {fmtCurrency(s.net_salary)}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta}`}>
                      {s.status?.replace(/_/g, ' ') || 'generated'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyNotice icon="DocumentTextIcon" message="No payslips available" />
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Team Availability Calendar
// ─────────────────────────────────────────────────────────────────────────────

const TeamCalendar = ({ calendarData, loading }) => {
  const [viewMonth, setViewMonth] = useState({ year: nowYear(), month: nowMonth() })

  const prevMonth = () => setViewMonth(({ year, month }) =>
    month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  const nextMonth = () => setViewMonth(({ year, month }) =>
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })

  // Build calendar grid
  const days = useMemo(() => {
    const { year, month } = viewMonth
    const first = new Date(year, month - 1, 1).getDay()
    const total = new Date(year, month, 0).getDate()
    const grid = []
    for (let i = 0; i < first; i++) grid.push(null)
    for (let d = 1; d <= total; d++) grid.push(d)
    return grid
  }, [viewMonth])

  // Map leave events: { 'YYYY-MM-DD': [name, ...] }
  const leaveMap = useMemo(() => {
    const m = {}
    ;(calendarData || []).forEach(ev => {
      const key = ev.date || ev.leave_date
      if (!key) return
      if (!m[key]) m[key] = []
      m[key].push(ev.employee_name || ev.name || 'Employee')
    })
    return m
  }, [calendarData])

  const { year, month } = viewMonth
  const todayD = new Date()
  const isToday = (d) => d === todayD.getDate() && month === todayD.getMonth() + 1 && year === todayD.getFullYear()

  const dayKey = (d) => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  return (
    <SectionCard
      title="Team Availability Calendar"
      subtitle="Who's on leave this month"
      icon="CalendarDaysIcon"
      action={
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <Icon name="ChevronLeftIcon" className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[90px] text-center">
            {MONTH_SHORT[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <Icon name="ChevronRightIcon" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      }
    >
      {loading ? (
        <SkeletonBox className="h-64 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const key    = d ? dayKey(d) : null
              const events = key ? leaveMap[key] || [] : []
              const isWknd = d ? [0, 6].includes(new Date(year, month - 1, d).getDay()) : false

              return (
                <div
                  key={i}
                  className={`min-h-[56px] rounded-lg p-1 text-xs border transition-colors ${
                    !d ? 'bg-transparent border-transparent'
                    : isToday(d) ? 'bg-blue-50 border-blue-200'
                    : isWknd ? 'bg-slate-50 border-slate-100'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {d && (
                    <>
                      <div className={`font-semibold mb-1 ${isToday(d) ? 'text-blue-600' : isWknd ? 'text-slate-400' : 'text-slate-700'}`}>
                        {d}
                      </div>
                      {events.slice(0, 2).map((name, ei) => (
                        <div key={ei} className="bg-amber-100 text-amber-700 rounded px-0.5 py-0.5 text-[10px] truncate mb-0.5">
                          {name}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[10px] text-slate-400">+{events.length - 2} more</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Today</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" /> On Leave</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-100" /> Weekend</div>
          </div>
        </>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Notifications
// ─────────────────────────────────────────────────────────────────────────────

const NotificationsCenter = ({ requests, loading }) => {
  const [readIds, setReadIds] = useState(new Set())

  const notifications = useMemo(() => {
    const items = []

    ;(requests || []).forEach(r => {
      if (r.status === 'approved') {
        items.push({
          id: `leave_approved_${r.id}`,
          type: 'leave',
          priority: 'medium',
          title: 'Leave Request Approved',
          message: `Your ${r.leave_type_display || 'leave'} request (${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}) has been approved.`,
          icon: 'CheckCircleIcon',
          time: r.approved_at || r.updated_at,
        })
      }
      if (r.status === 'rejected') {
        items.push({
          id: `leave_rejected_${r.id}`,
          type: 'leave',
          priority: 'high',
          title: 'Leave Request Rejected',
          message: `Your ${r.leave_type_display || 'leave'} request was rejected.${r.rejection_note ? ` Reason: ${r.rejection_note}` : ''}`,
          icon: 'XCircleIcon',
          time: r.updated_at,
        })
      }
      if (r.status === 'pending') {
        items.push({
          id: `leave_pending_${r.id}`,
          type: 'leave',
          priority: 'low',
          title: 'Leave Request Pending',
          message: `Your leave request for ${fmtDate(r.start_date)} is awaiting manager approval.`,
          icon: 'ClockIcon',
          time: r.created_at,
        })
      }
    })

    return items.sort((a, b) => {
      const pri = { high: 0, medium: 1, low: 2 }
      return (pri[a.priority] || 2) - (pri[b.priority] || 2)
    })
  }, [requests])

  const unread = notifications.filter(n => !readIds.has(n.id)).length

  return (
    <SectionCard
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
      icon="BellIcon"
      action={
        unread > 0 ? (
          <button
            onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all read
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <SkeletonBox key={i} className="h-14" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyNotice icon="BellSlashIcon" message="No notifications at this time" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const isRead = readIds.has(n.id)
            const pm = NOTIFICATION_PRIORITY[n.priority] || NOTIFICATION_PRIORITY.low
            return (
              <div
                key={n.id}
                className={`rounded-xl border p-3 cursor-pointer transition-colors ${isRead ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}
                onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pm.badge}`}>
                    <Icon name={n.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${isRead ? 'text-slate-500' : 'text-slate-800'}`}>{n.title}</span>
                      {!isRead && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pm.dot}`} />}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    {n.time && <div className="text-[10px] text-slate-400 mt-1">{fmtDate(n.time)}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Employee Digital Twin
// ─────────────────────────────────────────────────────────────────────────────

const DigitalTwin = ({ monthlyTs, leaveRecord, slips, requests, loading }) => {
  const scores = useMemo(() => {
    const workingDays   = monthlyTs?.working_days || 22
    const presentDays   = monthlyTs?.present_days || 0
    const attScore      = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0

    const totalHrs      = Number(monthlyTs?.total_hours) || 0
    const prodScore     = STANDARD_MONTHLY_HOURS > 0
      ? Math.min(100, Math.round((totalHrs / STANDARD_MONTHLY_HOURS) * 100)) : 0

    const tsScore       = totalHrs > 0 ? Math.min(100, prodScore + 5) : 0

    const balance       = Number(leaveRecord?.leave_balance) || 0
    const earned        = Number(leaveRecord?.total_earned) || 0
    const leaveScore    = earned > 0 ? Math.min(100, Math.round((balance / earned) * 100)) : 50

    const paySlipCount  = (slips || []).filter(s => s.status === 'approved' || s.status === 'sent').length
    const payScore      = (slips || []).length > 0
      ? Math.min(100, Math.round((paySlipCount / Math.min(12, (slips || []).length)) * 100))
      : 0

    return [
      { ...SCORE_CONFIG[0], score: attScore },
      { ...SCORE_CONFIG[1], score: prodScore },
      { ...SCORE_CONFIG[2], score: tsScore },
      { ...SCORE_CONFIG[3], score: leaveScore },
      { ...SCORE_CONFIG[4], score: payScore },
    ]
  }, [monthlyTs, leaveRecord, slips])

  const healthIndex = scores.length > 0
    ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
    : 0

  const healthColor = healthIndex >= 80 ? '#10b981' : healthIndex >= 60 ? '#f59e0b' : '#ef4444'
  const healthLabel = healthIndex >= 80 ? 'Excellent' : healthIndex >= 60 ? 'Good' : 'Needs Attention'

  const radialData = [{ name: 'Health', value: healthIndex, fill: healthColor }]

  return (
    <div className="space-y-5">
      {/* Health Index */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <SectionCard title="RADAI Employee Health Index" subtitle="Composite score" icon="SparklesIcon">
          <div className="flex flex-col items-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={healthColor}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50 * healthIndex / 100} ${2 * Math.PI * 50}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: healthColor }}>{healthIndex}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>
            <div className="mt-3 font-semibold text-base" style={{ color: healthColor }}>{healthLabel}</div>
            <div className="text-xs text-slate-400 mt-1">Employee Health Score</div>
          </div>
        </SectionCard>

        {/* Score breakdown */}
        <div className="xl:col-span-2">
          <SectionCard title="Score Breakdown" subtitle="Individual performance dimensions" icon="ChartBarSquareIcon">
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonBox key={i} className="h-10" />)}</div>
            ) : (
              <div className="space-y-4">
                {scores.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon name={s.icon} className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{s.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: s.color }}>{s.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${s.score}%`, background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {scores.map((s) => {
          const tone = s.score >= 80 ? 'green' : s.score >= 60 ? 'amber' : 'rose'
          return (
            <KpiCard
              key={s.id}
              icon={s.icon}
              label={s.label}
              value={`${s.score}%`}
              sub={s.score >= 80 ? 'Excellent' : s.score >= 60 ? 'Good' : 'Attention'}
              tone={tone}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function EmployeeSelfService() {
  const { user: authUser } = useSelector((s) => s.auth) || {}
  const { currentUser }    = useSelector((s) => s.rbac) || {}
  const authProfile = currentUser || authUser

  const now = new Date()
  const [activeTab, setActiveTab] = useState('overview')

  // ── Data state ──────────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState(null)
  const [monthlyTs,    setMonthlyTs]    = useState(null)
  const [todayTs,      setTodayTs]      = useState(null)
  const [userHistory,  setUserHistory]  = useState(null)
  const [leaveRecord,  setLeaveRecord]  = useState(null)
  const [leaveTypes,   setLeaveTypes]   = useState([])
  const [leaveRequests,setLeaveRequests]= useState([])
  const [calendarData, setCalendarData] = useState([])
  const [salaryInfo,   setSalaryInfo]   = useState(null)
  const [slips,        setSlips]        = useState([])

  // ── Loading / error state ───────────────────────────────────────────────────
  const [loadingProfile,  setLoadingProfile]  = useState(true)
  const [loadingTs,       setLoadingTs]       = useState(true)
  const [loadingLeave,    setLoadingLeave]    = useState(true)
  const [loadingPayroll,  setLoadingPayroll]  = useState(true)
  const [loadingCalendar, setLoadingCalendar] = useState(true)

  // ── Leave form state ────────────────────────────────────────────────────────
  const [submitting,    setSubmitting]    = useState(false)
  const [submitResult,  setSubmitResult]  = useState(null)

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingProfile(true)
    rbacService.getCurrentUser()
      .then(r => setProfile(r?.data || r))
      .catch(() => setProfile(authProfile))
      .finally(() => setLoadingProfile(false))
  }, [])

  // ── Load timesheet data for current user ────────────────────────────────────
  useEffect(() => {
    setLoadingTs(true)
    const employeeCode = profile?.employee_code || profile?.engineer_profile?.employee_code || profile?.username

    Promise.all([
      timesheetSvc.fetchMonthly(now.getFullYear(), now.getMonth() + 1).catch(() => null),
      timesheetSvc.fetchDaily(todayStr()).catch(() => null),
      employeeCode
        ? timesheetSvc.fetchUserHistory({ code: employeeCode, limit: 60 }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([monthly, daily, history]) => {
      // Filter monthly data to current user if the response contains all employees
      if (monthly && Array.isArray(monthly)) {
        const code = employeeCode?.toString().toLowerCase()
        const match = monthly.find(e =>
          e.employee_code?.toString().toLowerCase() === code ||
          e.code?.toString().toLowerCase() === code
        )
        setMonthlyTs(match || null)
      } else {
        setMonthlyTs(monthly)
      }

      // Today's record
      if (daily && Array.isArray(daily)) {
        const code = employeeCode?.toString().toLowerCase()
        const todayRec = daily.find(e =>
          e.employee_code?.toString().toLowerCase() === code ||
          e.code?.toString().toLowerCase() === code
        )
        setTodayTs(todayRec || null)
      } else {
        setTodayTs(daily)
      }

      setUserHistory(history)
    }).finally(() => setLoadingTs(false))
  }, [profile])

  // ── Load leave data ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingLeave(true)
    const employeeName = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
      : null

    Promise.all([
      payrollService.getLeaveTypes().catch(() => []),
      payrollService.getLeaveRequests({ page_size: 50 }).catch(() => ({ results: [] })),
      employeeName
        ? payrollService.getLeaveRecords({ search: employeeName, page_size: 5 }).catch(() => ({ results: [] }))
        : Promise.resolve({ results: [] }),
    ]).then(([types, reqRes, recRes]) => {
      setLeaveTypes(Array.isArray(types) ? types : types?.results || [])

      const reqs = Array.isArray(reqRes) ? reqRes : reqRes?.results || []
      // Filter to current user's requests only
      const userId = profile?.id
      setLeaveRequests(userId ? reqs.filter(r => r.employee === userId || r.employee_id === userId) : reqs)

      const recs = Array.isArray(recRes) ? recRes : recRes?.results || []
      setLeaveRecord(recs.length > 0 ? recs[0] : null)
    }).finally(() => setLoadingLeave(false))
  }, [profile])

  // ── Load payroll data ───────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingPayroll(true)
    const userId = profile?.id

    Promise.all([
      userId
        ? payrollService.getSalarySlips({ employee: userId, page_size: 12 }).catch(() => ({ results: [] }))
        : payrollService.getSalarySlips({ page_size: 12 }).catch(() => ({ results: [] })),
      userId
        ? payrollService.getEmployeeSalaryInfo({ employee: userId }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([slipRes, info]) => {
      const slipList = Array.isArray(slipRes) ? slipRes : slipRes?.results || []
      setSlips(slipList)
      const infoList = Array.isArray(info) ? info : info?.results || [info]
      setSalaryInfo(infoList.find(Boolean) || null)
    }).finally(() => setLoadingPayroll(false))
  }, [profile])

  // ── Load team calendar ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingCalendar(true)
    payrollService.getLeaveCalendar(now.getFullYear(), now.getMonth() + 1)
      .then(data => setCalendarData(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setCalendarData([]))
      .finally(() => setLoadingCalendar(false))
  }, [])

  // ── Derived: AI insights ────────────────────────────────────────────────────
  const insights = useMemo(() => generateInsights({
    leaveRecord,
    monthlyTs,
    today: todayTs,
    slips,
  }), [leaveRecord, monthlyTs, todayTs, slips])

  // ── Leave request submit ────────────────────────────────────────────────────
  const handleLeaveSubmit = useCallback(async (form) => {
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const userId = profile?.id
      const payload = {
        ...form,
        ...(userId ? { employee: userId } : {}),
      }
      await payrollService.createLeaveRequest(payload)
      setSubmitResult({ success: true, message: 'Leave request submitted successfully! Awaiting manager approval.' })
      // Reload requests
      const reqRes = await payrollService.getLeaveRequests({ page_size: 50 }).catch(() => ({ results: [] }))
      const reqs   = Array.isArray(reqRes) ? reqRes : reqRes?.results || []
      setLeaveRequests(userId ? reqs.filter(r => r.employee === userId || r.employee_id === userId) : reqs)
    } catch (err) {
      const msg = err?.response?.data?.detail ||
                  err?.response?.data?.non_field_errors?.[0] ||
                  Object.values(err?.response?.data || {})?.[0]?.[0] ||
                  'Failed to submit leave request. Please try again.'
      setSubmitResult({ error: msg })
    } finally {
      setSubmitting(false)
    }
  }, [profile])

  // ── Tab notification badges ─────────────────────────────────────────────────
  const pendingLeave   = leaveRequests.filter(r => r.status === 'pending').length
  const unreadNotifs   = leaveRequests.filter(r => ['approved','rejected'].includes(r.status)).length

  const tabBadges = {
    leave:         pendingLeave > 0 ? pendingLeave : null,
    notifications: unreadNotifs > 0 ? unreadNotifs : null,
  }

  // ── Section renders ─────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <TodayStatusCard todayData={todayTs} loading={loadingTs} />
              </div>
              <AIInsightsPanel insights={insights} loading={loadingTs || loadingLeave || loadingPayroll} />
            </div>

            {/* Quick leave balance preview */}
            <SectionCard title="Leave Balance Snapshot" icon="CalendarDaysIcon">
              {loadingLeave ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-16" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon="CalendarDaysIcon" label="Annual Balance" value={`${Number(leaveRecord?.leave_balance||0).toFixed(1)} d`} sub="Remaining" tone="blue" />
                  <KpiCard icon="CheckCircleIcon" label="Days Taken" value={`${Number(leaveRecord?.total_taken||0).toFixed(1)} d`} sub="This year" tone="green" />
                  <KpiCard icon="ClockIcon" label="Pending" value={pendingLeave} sub="Awaiting approval" tone={pendingLeave ? 'amber' : 'slate'} />
                  <KpiCard icon="BanknotesIcon" label="Encashed" value={`${Number(leaveRecord?.total_encashed||0).toFixed(1)} d`} sub="Leave encashment" tone="purple" />
                </div>
              )}
            </SectionCard>
          </div>
        )

      case 'leave':
        return (
          <div className="space-y-5">
            <LeaveBalanceSection
              leaveRecord={leaveRecord}
              requests={leaveRequests}
              loading={loadingLeave}
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <LeaveRequestForm
                leaveTypes={leaveTypes}
                leaveRecord={leaveRecord}
                requests={leaveRequests}
                onSubmit={handleLeaveSubmit}
                submitting={submitting}
                submitResult={submitResult}
              />
              <SectionCard title="My Leave Requests" subtitle="Recent requests" icon="ClipboardDocumentListIcon">
                {loadingLeave ? (
                  <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-12" />)}</div>
                ) : leaveRequests.length === 0 ? (
                  <EmptyNotice icon="CalendarDaysIcon" message="No leave requests found" />
                ) : (
                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {leaveRequests.slice(0, 15).map(r => {
                      const sm = {
                        pending:  'bg-amber-50 text-amber-700 border-amber-200',
                        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                        cancelled:'bg-slate-50 text-slate-500 border-slate-200',
                      }[r.status] || 'bg-slate-50 text-slate-500 border-slate-200'
                      return (
                        <div key={r.id} className="py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                {r.leave_type_display || r.leave_type || 'Leave'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                                {r.duration_days ? ` · ${r.duration_days}d` : ''}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sm}`}>
                              {r.status}
                            </span>
                          </div>
                          {r.reason && <div className="text-xs text-slate-400 mt-0.5 truncate">{r.reason}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )

      case 'attendance':
        return <AttendanceAnalytics monthlyTs={monthlyTs} loading={loadingTs} />

      case 'timesheet':
        return <TimesheetInsights monthlyTs={monthlyTs} userHistory={userHistory} loading={loadingTs} />

      case 'payroll':
        return <PayrollSnapshot salaryInfo={salaryInfo} slips={slips} loading={loadingPayroll} />

      case 'team':
        return <TeamCalendar calendarData={calendarData} loading={loadingCalendar} />

      case 'twin':
        return (
          <DigitalTwin
            monthlyTs={monthlyTs}
            leaveRecord={leaveRecord}
            slips={slips}
            requests={leaveRequests}
            loading={loadingTs || loadingLeave || loadingPayroll}
          />
        )

      case 'notifications':
        return <NotificationsCenter requests={leaveRequests} loading={loadingLeave} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* People nav cross-link */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-4">
        <PeopleNav activeId="ess" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* ── Profile Header ── */}
        <EmployeeProfileHeader
          profile={profile}
          leaveRecord={leaveRecord}
          monthlyTs={monthlyTs}
          salaryInfo={salaryInfo}
          loading={loadingProfile}
        />

        {/* ── Tab Navigation ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {ESS_TABS.map(tab => {
              const isActive = tab.id === activeTab
              const badge    = tabBadges[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    whitespace-nowrap transition-colors flex-shrink-0 relative
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  <Icon name={tab.icon} className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                  {badge && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Active Section ── */}
        <div>
          {renderSection()}
        </div>

        {/* ── Footer ── */}
        <div className="pb-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <Icon name="ShieldCheckIcon" className="w-3.5 h-3.5 text-emerald-400" />
          You are viewing your own personal workspace. Data is securely scoped to your account.
        </div>
      </div>
    </div>
  )
}
