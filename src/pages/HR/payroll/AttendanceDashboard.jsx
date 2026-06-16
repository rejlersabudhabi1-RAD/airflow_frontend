/**
 * Attendance Dashboard — HR Manager Consolidated View
 * ====================================================
 * 5 sub-views:  Overview · Daily · Monthly · Yearly · Reports
 *
 * Data comes entirely from the existing timesheet service (SQL Server biometric).
 * All config, thresholds, colours and labels live in hrAttendance.config.js.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import ts from '../../../services/timesheet.service'
import payrollService from '../../../services/payroll.service'
import {
  ATTENDANCE_VIEWS, ATTENDANCE_DEFAULT_VIEW,
  ATTENDANCE_STATUS, ATTENDANCE_KPIS,
  ATTENDANCE_DAILY_COLS, ATTENDANCE_MONTHLY_COLS,
  DEPT_COLORS, MONTH_SHORT, MONTH_FULL,
  ATT_GOOD_RATE_PCT, ATT_WARN_RATE_PCT, ATT_TOP_ABSENT_LIMIT,
  ATT_STANDARD_DAILY_HOURS, ATT_COMPANY_NAME, fmtDiff,
  classifyDay, workingDaysInMonth, rateColor, empName, empDept,
  fmtTime, ATT_COPY, filterEmployeeRow,
} from '../../../config/hrAttendance.config'
import { getLeaveType, ABSENT_SYMBOL } from '../../../config/hrLeave.config'

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components  (defined outside main component — stable references)
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const StatusBadge = ({ status }) => {
  const m = ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.absent
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

const KpiTile = ({ kpi }) => {
  const Icon = HeroIcons[kpi.icon] || HeroIcons.ChartBarIcon
  return (
    <div className={`${kpi.bgLight} rounded-xl p-4 border border-white/80 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600">{kpi.label}</span>
        <Icon className={`w-4 h-4 ${kpi.textColor}`} />
      </div>
      <div className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{kpi.sub}</div>
    </div>
  )
}

const EmptyState = ({ icon: IconName = 'InboxIcon', msg, loading, loadingMsg }) => {
  const Icon = HeroIcons[IconName] || HeroIcons.InboxIcon
  if (loading) return (
    <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-sm">
      <Spinner />{loadingMsg || ATT_COPY.loading}
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
      <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />
      {msg || ATT_COPY.noData}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryTab — Consolidated Monthly Time Sheet  (matches Rejlers report format)
// Each row = one employee; columns = calendar days 1–31 showing hours worked.
// Summary columns: Total · Days · Normal Hours · Difference
// All thresholds read from hrAttendance.config.js — no magic numbers here.
// ─────────────────────────────────────────────────────────────────────────────
function SummaryTab() {
  const initNow = new Date()
  const [year,          setYear]          = useState(initNow.getFullYear())
  const [month,         setMonth]         = useState(initNow.getMonth() + 1)
  const [search,        setSearch]        = useState('')
  const [resp,          setResp]          = useState(null)
  const [busy,          setBusy]          = useState(false)
  const [err,           setErr]           = useState('')
  const [leaveCalendar, setLeaveCalendar] = useState({})  // { employee_code: { 'YYYY-MM-DD': {code,name,...} } }

  // Fetch biometric attendance
  useEffect(() => {
    setBusy(true)
    setErr('')
    ts.fetchMonthly(year, month)
      .then(d => setResp(d))
      .catch(e => setErr(e?.message || 'Failed to load attendance data'))
      .finally(() => setBusy(false))
  }, [year, month])

  // Fetch approved leave calendar — overlay on top of attendance
  useEffect(() => {
    payrollService.getLeaveCalendar(year, month)
      .then(d => setLeaveCalendar(d?.calendar || {}))
      .catch(() => setLeaveCalendar({}))
  }, [year, month])

  const rows        = resp?.rows || []
  const workingDays = resp?.working_days_in_month || workingDaysInMonth(year, month)
  const daysInMonth = new Date(year, month, 0).getDate()         // last day of month
  const days        = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  )
  const periodLabel = `1.${month}.${year} – ${daysInMonth}.${month}.${year}`
  const yearOpts    = useMemo(() => [year - 2, year - 1, year].filter(y => y > 2020), [year])
  const round2      = (v) => Math.round(v * 100) / 100

  // Soft-coded: compute day-of-week for any date in the selected month.
  // 0 = Sunday, 6 = Saturday (standard JS)
  const dayOfWeek   = (d) => new Date(year, month - 1, d).getDay()
  const isSaturday  = (d) => dayOfWeek(d) === 6
  const isSunday    = (d) => dayOfWeek(d) === 0
  const isWeekend   = (d) => isSaturday(d) || isSunday(d)

  // Build pivot: employee × day → slot object { type:'worked'|'leave', hours?, code?, ... }
  const pivotRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows
      // Remove non-employee biometric records (facility names, visitor badges, etc.)
      .filter(filterEmployeeRow)
      .filter(r => !q ||
        empName(r).toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q))
      .map(r => {
        const dayMap = {}
        ;(r.days_detail || []).forEach(d => {
          const day = parseInt(d.date ? d.date.split('-')[2] : '0', 10)
          if (day > 0) dayMap[day] = { type: 'worked', hours: d.hours || 0 }
        })
        // Overlay approved leave — only on days WITHOUT biometric data
        const empCode  = r.employee_code || ''
        const empLeave = leaveCalendar[empCode] || {}
        Object.entries(empLeave).forEach(([dateStr, lv]) => {
          const day = parseInt(dateStr.split('-')[2], 10)
          if (day > 0 && !dayMap[day]) {
            dayMap[day] = { type: 'leave', code: lv.code, name: lv.name, badge_bg: lv.badge_bg, badge_text: lv.badge_text }
          }
        })
        const totalHrs  = round2(r.total_hours || 0)
        const normalHrs = workingDays * ATT_STANDARD_DAILY_HOURS
        return {
          name:        empName(r),
          dept:        empDept(r),
          code:        empCode,
          dayMap,
          totalHrs,
          daysPresent: r.days_present || 0,
          normalHrs,
          diff:        round2(totalHrs - normalHrs),
        }
      })
  }, [rows, search, workingDays, leaveCalendar])

  // Column totals row
  const totals = useMemo(() => {
    const dayMap = {}
    let totalHrs = 0, normalHrs = 0, daysPresent = 0
    pivotRows.forEach(r => {
      Object.entries(r.dayMap).forEach(([d, slot]) => {
        const day  = parseInt(d, 10)
        const hrs  = slot?.type === 'worked' ? (slot.hours || 0) : 0
        dayMap[day] = round2((dayMap[day] || 0) + hrs)
      })
      totalHrs    += r.totalHrs
      normalHrs   += r.normalHrs
      daysPresent += r.daysPresent
    })
    totalHrs  = round2(totalHrs)
    normalHrs = round2(normalHrs)
    return { dayMap, totalHrs, daysPresent, normalHrs, diff: round2(totalHrs - normalHrs) }
  }, [pivotRows])

  return (
    <div className="space-y-4">
      {/* Report header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HeroIcons.TableCellsIcon className="w-5 h-5 text-blue-500" />
              Time Sheet Summary — {ATT_COMPANY_NAME}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {/* Month */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {MONTH_FULL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            {/* Year */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {/* Search */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Search</label>
              <div className="relative">
                <HeroIcons.MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Name or department…" autoComplete="off"
                  className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-44" />
              </div>
            </div>
            {/* Quick exports (re-use existing backend endpoints) */}
            <button type="button"
              onClick={() => ts.downloadMonthlyExcel(year, month).catch(() => {})}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
              <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" /> Excel
            </button>
            <button type="button"
              onClick={() => ts.downloadMonthlyPdf(year, month).catch(() => {})}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition">
              <HeroIcons.DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
        {/* Stats strip */}
        <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          <span><span className="font-semibold text-slate-700">{busy ? '…' : pivotRows.length}</span> employees</span>
          <span><span className="font-semibold text-slate-700">{workingDays}</span> working days in period</span>
          <span>Standard <span className="font-semibold text-slate-700">{ATT_STANDARD_DAILY_HOURS} h/day</span></span>
          <span className="ml-auto flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {ATT_COPY.sourceTag}
          </span>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 flex items-center gap-2">
          <HeroIcons.ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}

      {/* Loading skeleton */}
      {busy && !resp && <EmptyState loading icon="TableCellsIcon" loadingMsg={ATT_COPY.loading} />}

      {/* Empty state */}
      {!busy && !err && pivotRows.length === 0 && (
        <EmptyState icon="TableCellsIcon" msg={ATT_COPY.monthlyEmpty} />
      )}

      {/* ══ Cross-tab pivot table ══ */}
      {pivotRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>

              {/* Column headers: Employee | 1–31 | Total | Days | Normal Hours | Difference */}
              <thead>
                {/* Row 1: day numbers */}
                <tr className="bg-slate-700 text-white">
                  <th className="sticky left-0 z-20 bg-slate-700 px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-slate-500" style={{ minWidth: '200px' }}>
                    Employee
                  </th>
                  {days.map(d => {
                    const sat = isSaturday(d)
                    const sun = isSunday(d)
                    return (
                      <th key={d}
                        title={sat ? 'Saturday' : sun ? 'Sunday' : ''}
                        className={[
                          'py-2 text-center font-semibold border-r',
                          sat ? 'bg-amber-600 border-amber-700' : '',
                          sun ? 'bg-rose-700  border-rose-800'  : '',
                          !sat && !sun ? 'border-slate-600' : '',
                        ].join(' ')}
                        style={{ minWidth: '2.6rem' }}>
                        {d}
                      </th>
                    )
                  })}
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap border-l-2 border-slate-500 bg-slate-800">Total</th>
                  <th className="px-3 py-2.5 text-center font-semibold whitespace-nowrap bg-slate-800">Days</th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap bg-slate-800 border-r border-slate-600">
                    Normal Hrs
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap bg-slate-800">Difference</th>
                </tr>
                {/* Row 2: Sa / Su labels */}
                <tr className="bg-slate-600 text-[9px] uppercase tracking-wide">
                  <td className="sticky left-0 z-20 bg-slate-600 border-r border-slate-500" />
                  {days.map(d => {
                    const sat = isSaturday(d)
                    const sun = isSunday(d)
                    return (
                      <td key={d}
                        className={[
                          'text-center border-r font-bold leading-none py-0.5',
                          sat ? 'bg-amber-500 text-white border-amber-600' : '',
                          sun ? 'bg-rose-600  text-white border-rose-700'  : '',
                          !sat && !sun ? 'text-transparent border-slate-500' : '',
                        ].join(' ')}>
                        {sat ? 'Sa' : sun ? 'Su' : '·'}
                      </td>
                    )
                  })}
                  <td colSpan={4} className="bg-slate-600 border-l-2 border-slate-500" />
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {pivotRows.map((r, i) => (
                  <tr key={i}
                    className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}>
                    {/* Sticky name cell */}
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-800 whitespace-nowrap border-r border-slate-200">
                      <div className="leading-tight">{r.name}</div>
                      {r.dept && <div className="text-[10px] text-slate-400 font-normal">{r.dept}</div>}
                    </td>
                    {/* Day cells */}
                    {days.map(d => {
                      const slot   = r.dayMap[d]
                      const sat    = isSaturday(d)
                      const sun    = isSunday(d)
                      const wkd    = sat || sun
                      const today  = new Date()
                      const isFuture = new Date(year, month - 1, d) > today

                      let cellContent
                      if (slot?.type === 'worked') {
                        cellContent = (
                          <span className={`font-medium tabular-nums ${
                            wkd ? (sat ? 'text-amber-700' : 'text-rose-700') : 'text-slate-700'
                          }`}>{slot.hours.toFixed(2)}</span>
                        )
                      } else if (slot?.type === 'leave') {
                        const lt = getLeaveType(slot.code)
                        cellContent = (
                          <span
                            className={`text-[9px] font-bold px-0.5 py-0.5 rounded ${lt.cellBg} ${lt.cellText}`}
                            title={slot.name}
                          >{slot.code}</span>
                        )
                      } else if (!wkd && !isFuture) {
                        cellContent = (
                          <span className="font-bold text-rose-600" style={{ fontSize: 9 }}>{ABSENT_SYMBOL}</span>
                        )
                      } else {
                        cellContent = (
                          <span className={wkd ? (sat ? 'text-amber-200' : 'text-rose-200') : 'text-slate-300'} style={{ fontSize: 9 }}>—</span>
                        )
                      }

                      return (
                        <td key={d}
                          className={[
                            'py-1.5 text-center border-r',
                            sat ? 'bg-amber-50 border-amber-200' : '',
                            sun ? 'bg-rose-50  border-rose-200'  : '',
                            !wkd ? 'border-slate-100' : '',
                          ].join(' ')}
                          style={{ minWidth: '2.6rem' }}>
                          {cellContent}
                        </td>
                      )
                    })}
                    {/* Summary cells */}
                    <td className="px-3 py-1.5 text-right font-bold text-slate-800 border-l-2 border-slate-300 whitespace-nowrap tabular-nums bg-slate-50">
                      {r.totalHrs.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-center font-semibold text-slate-700 bg-slate-50">
                      {r.daysPresent}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-600 bg-slate-50 whitespace-nowrap tabular-nums border-r border-slate-200">
                      {r.normalHrs} h
                    </td>
                    <td className={`px-3 py-1.5 text-right font-semibold whitespace-nowrap bg-slate-50 tabular-nums ${
                      r.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {fmtDiff(r.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals footer */}
              <tfoot>
                <tr className="bg-slate-800 text-white border-t-2 border-slate-500 font-bold">
                  <td className="sticky left-0 z-10 bg-slate-800 px-3 py-2.5 whitespace-nowrap border-r border-slate-600">
                    Total
                  </td>
                  {days.map(d => {
                    const h   = totals.dayMap[d]
                    const sat = isSaturday(d)
                    const sun = isSunday(d)
                    const wkd = sat || sun
                    return (
                      <td key={d}
                        className={[
                          'py-2.5 text-center border-r',
                          sat ? 'bg-amber-700 border-amber-800' : '',
                          sun ? 'bg-rose-800  border-rose-900'  : '',
                          !wkd ? 'border-slate-700' : '',
                        ].join(' ')}
                        style={{ minWidth: '2.6rem' }}>
                        {h !== undefined
                          ? <span className="font-semibold tabular-nums">{h.toFixed(2)}</span>
                          : <span className="opacity-25">—</span>
                        }
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 text-right border-l-2 border-slate-600 tabular-nums">
                    {totals.totalHrs.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center">{totals.daysPresent}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-slate-600">
                    {totals.normalHrs} h
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${
                    totals.diff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {fmtDiff(totals.diff)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Footer note */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Normal Hours = {workingDays} working days × {ATT_STANDARD_DAILY_HOURS} h  ·  {ATT_COPY.absenceNote}</span>
            <span>{pivotRows.length} of {rows.length} employees shown</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportsTab — has local form state so defined as standalone component
// ─────────────────────────────────────────────────────────────────────────────
function ReportsTab({ todayStr }) {
  const now = new Date()
  const [dlDate,    setDlDate]    = useState(todayStr)
  const [dlYear,    setDlYear]    = useState(now.getFullYear())
  const [dlMonth,   setDlMonth]   = useState(now.getMonth() + 1)
  const [busy,      setBusy]      = useState('')
  const [exportMsg, setExportMsg] = useState('')

  const download = useCallback(async (type) => {
    setBusy(type); setExportMsg('')
    try {
      if (type === 'daily-excel')   await ts.downloadDailyExcel(dlDate)
      if (type === 'monthly-excel') await ts.downloadMonthlyExcel(dlYear, dlMonth)
      if (type === 'monthly-pdf')   await ts.downloadMonthlyPdf(dlYear, dlMonth)
      setExportMsg(ATT_COPY.exportOk)
    } catch (e) {
      setExportMsg(`Export failed: ${e.message}`)
    } finally {
      setBusy('')
    }
  }, [dlDate, dlYear, dlMonth])

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
        <HeroIcons.InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        {ATT_COPY.exportHint}
      </div>

      {exportMsg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${
          exportMsg.startsWith('Export failed')
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>{exportMsg}</div>
      )}

      {/* Daily */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <HeroIcons.CalendarDaysIcon className="w-4 h-4 text-slate-400" /> Daily Report
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date</label>
            <input type="date" value={dlDate} max={todayStr}
              onChange={e => setDlDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="button" onClick={() => download('daily-excel')} disabled={!!busy}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition">
            <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" />
            {busy === 'daily-excel' ? 'Exporting…' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Monthly */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <HeroIcons.CalendarIcon className="w-4 h-4 text-slate-400" /> Monthly Report
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Month</label>
            <select value={dlMonth} onChange={e => setDlMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {MONTH_FULL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Year</label>
            <select value={dlYear} onChange={e => setDlYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {[dlYear - 1, dlYear].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => download('monthly-excel')} disabled={!!busy}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition">
            <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" />
            {busy === 'monthly-excel' ? 'Exporting…' : 'Download Excel'}
          </button>
          <button type="button" onClick={() => download('monthly-pdf')} disabled={!!busy}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-60 transition">
            <HeroIcons.DocumentArrowDownIcon className="w-4 h-4" />
            {busy === 'monthly-pdf' ? 'Exporting…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const NOW          = new Date()
const TODAY_STR    = NOW.toISOString().slice(0, 10)
const ALL_DEPT     = 'all'
const ALL_STATUS   = 'all'

export default function AttendanceDashboard() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [view,         setView]         = useState(ATTENDANCE_DEFAULT_VIEW)
  const [selectedDate, setSelectedDate] = useState(TODAY_STR)
  const [selMonth,     setSelMonth]     = useState(NOW.getMonth() + 1)
  const [selYear,      setSelYear]      = useState(NOW.getFullYear())
  const [deptFilter,   setDeptFilter]   = useState(ALL_DEPT)
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS)

  // ── Data state ──────────────────────────────────────────────────────────────
  const [liveData,    setLiveData]    = useState([])
  const [dailyData,   setDailyData]   = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [yearlyData,  setYearlyData]  = useState([])  // Array[12] of monthly arrays
  const [trendData,   setTrendData]   = useState([])  // 6-month overview chart

  const [loadingDaily,   setLoadingDaily]   = useState(false)
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingYearly,  setLoadingYearly]  = useState(false)

  // ── Always-on: fetch live for total active count (KPI denominator) ──────────
  useEffect(() => {
    ts.fetchLive()
      .then(d => setLiveData((d?.rows || (Array.isArray(d) ? d : [])).filter(filterEmployeeRow)))
      .catch(() => {})
  }, [])

  // ── Daily data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'daily' && view !== 'overview') return
    setLoadingDaily(true)
    ts.fetchDaily(selectedDate)
      .then(d => setDailyData((d?.rows || (Array.isArray(d) ? d : [])).filter(filterEmployeeRow)))
      .catch(() => setDailyData([]))
      .finally(() => setLoadingDaily(false))
  }, [selectedDate, view])

  // ── Monthly data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'monthly' && view !== 'overview') return
    setLoadingMonthly(true)
    ts.fetchMonthly(selYear, selMonth)
      .then(d => setMonthlyData((d?.rows || (Array.isArray(d) ? d : [])).filter(filterEmployeeRow)))
      .catch(() => setMonthlyData([]))
      .finally(() => setLoadingMonthly(false))
  }, [selYear, selMonth, view])

  // ── 6-month trend for Overview ───────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'overview') return
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - (5 - i), 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
    Promise.all(months.map(({ year, month }) =>
      ts.fetchMonthly(year, month).catch(() => ({}))
    )).then(results => {
      setTrendData(results.map((employees, i) => {
        const arr = (employees?.rows || (Array.isArray(employees) ? employees : [])).filter(filterEmployeeRow)
        const wd  = workingDaysInMonth(months[i].year, months[i].month)
        const tp  = arr.reduce((s, e) => s + (e.days_present || 0), 0)
        const max = arr.length * wd
        return {
          month: MONTH_SHORT[months[i].month - 1],
          rate:  max > 0 ? Math.round((tp / max) * 100) : 0,
          count: arr.length,
        }
      }))
    }).catch(() => {})
  }, [view])

  // ── Yearly: fetch all 12 months in parallel ──────────────────────────────────
  useEffect(() => {
    if (view !== 'yearly') return
    setLoadingYearly(true)
    setYearlyData([])
    Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        ts.fetchMonthly(selYear, i + 1).catch(() => ({}))
      )
    ).then(results => {
      setYearlyData(results.map(d => (d?.rows || (Array.isArray(d) ? d : [])).filter(filterEmployeeRow)))
    }).finally(() => setLoadingYearly(false))
  }, [selYear, view])

  // ── Working days in currently selected month ─────────────────────────────────
  const workingDays = useMemo(
    () => workingDaysInMonth(selYear, selMonth),
    [selYear, selMonth]
  )

  // ── Departments list (from whichever data is available) ──────────────────────
  const departments = useMemo(() => {
    const src = dailyData.length > 0 ? dailyData : monthlyData
    return [...new Set(src.map(empDept))].filter(Boolean).sort()
  }, [dailyData, monthlyData])

  // ── Enriched monthly rows  (_absent, _rate appended) ─────────────────────────
  const enrichedMonthly = useMemo(() => {
    const filtered = deptFilter === ALL_DEPT
      ? monthlyData
      : monthlyData.filter(r => empDept(r) === deptFilter)
    return filtered.map(r => ({
      ...r,
      _absent: Math.max(0, workingDays - (r.days_present || 0)),
      _rate:   workingDays > 0
        ? Math.round(((r.days_present || 0) / workingDays) * 100)
        : 0,
    }))
  }, [monthlyData, workingDays, deptFilter])

  // ── Filtered daily rows ───────────────────────────────────────────────────────
  const filteredDaily = useMemo(() => {
    let d = deptFilter === ALL_DEPT ? dailyData : dailyData.filter(r => empDept(r) === deptFilter)
    if (statusFilter !== ALL_STATUS) d = d.filter(r => classifyDay(r) === statusFilter)
    return d
  }, [dailyData, deptFilter, statusFilter])

  // ── Daily status counts for summary bar ─────────────────────────────────────
  const dailyStatusCounts = useMemo(() => {
    const c = { present: 0, late: 0, half_day: 0, absent: 0 }
    dailyData.forEach(r => {
      const s = classifyDay(r)
      if (s in c) c[s]++
    })
    return c
  }, [dailyData])

  // ── KPI values ───────────────────────────────────────────────────────────────
  const kpiValues = useMemo(() =>
    ATTENDANCE_KPIS.map(k => ({
      ...k,
      ...k.compute({ daily: dailyData, totalActive: liveData.length, monthly: monthlyData }),
    })),
    [dailyData, liveData, monthlyData]
  )

  // ── Daily dept breakdown for charts ─────────────────────────────────────────
  const dailyDeptBreakdown = useMemo(() => {
    const map = {}
    dailyData.forEach(r => {
      const dept = empDept(r)
      if (!map[dept]) map[dept] = { dept, present: 0, late: 0, half_day: 0, absent: 0 }
      const s = classifyDay(r)
      map[dept][s] = (map[dept][s] || 0) + 1
    })
    return Object.values(map).sort((a, b) => (b.present + b.late + b.half_day) - (a.present + a.late + a.half_day))
  }, [dailyData])

  // ── Monthly dept breakdown for charts ────────────────────────────────────────
  const monthlyDeptBreakdown = useMemo(() => {
    const map = {}
    enrichedMonthly.forEach(r => {
      const dept = empDept(r)
      if (!map[dept]) map[dept] = { dept, present: 0, absent: 0, late: 0, employees: 0 }
      map[dept].employees++
      map[dept].present += r.days_present || 0
      map[dept].absent  += r._absent      || 0
      map[dept].late    += r.late_arrivals || 0
    })
    return Object.values(map).sort((a, b) => b.employees - a.employees)
  }, [enrichedMonthly])

  // ── Top absent employees (monthly) for alerts ────────────────────────────────
  const topAbsent = useMemo(() =>
    [...enrichedMonthly]
      .filter(r => (r._absent || 0) > 0)
      .sort((a, b) => (b._absent || 0) - (a._absent || 0))
      .slice(0, ATT_TOP_ABSENT_LIMIT),
    [enrichedMonthly]
  )

  // ── Yearly aggregation ───────────────────────────────────────────────────────
  const { yearlyEmployees, yearlyTrend } = useMemo(() => {
    if (yearlyData.length === 0) return { yearlyEmployees: [], yearlyTrend: [] }
    const map = {}
    yearlyData.forEach((employees, mi) => {
      ;(employees || []).forEach(emp => {
        const key = emp.employee_code || empName(emp)
        if (!map[key]) {
          map[key] = {
            code: key, name: empName(emp), dept: empDept(emp),
            months: Array(12).fill(null), totalPresent: 0,
          }
        }
        const wd = workingDaysInMonth(selYear, mi + 1)
        map[key].months[mi] = {
          present: emp.days_present || 0,
          wd,
          rate: wd > 0 ? Math.round(((emp.days_present || 0) / wd) * 100) : 0,
        }
        map[key].totalPresent += emp.days_present || 0
      })
    })
    const totalWd = MONTH_SHORT.reduce((s, _, i) => s + workingDaysInMonth(selYear, i + 1), 0)
    const employees = Object.values(map).map(e => ({
      ...e,
      yearRate: totalWd > 0 ? Math.round((e.totalPresent / totalWd) * 100) : 0,
    })).sort((a, b) => a.name.localeCompare(b.name))

    const trend = yearlyData.map((arr, i) => {
      const wd  = workingDaysInMonth(selYear, i + 1)
      const tp  = (arr || []).reduce((s, e) => s + (e.days_present || 0), 0)
      const max = (arr || []).length * wd
      return { month: MONTH_SHORT[i], rate: max > 0 ? Math.round((tp / max) * 100) : 0, employees: (arr || []).length }
    })
    return { yearlyEmployees: employees, yearlyTrend: trend }
  }, [yearlyData, selYear])

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW: OVERVIEW
  // ────────────────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiValues.map(k => <KpiTile key={k.id} kpi={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 6-month rate trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <HeroIcons.ChartBarIcon className="w-4 h-4 text-blue-500" />
            6-Month Attendance Rate
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v, n) => [`${v}%`, 'Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={loadingMonthly} loadingMsg="Building trend…" icon="ChartBarIcon" />
          )}
        </div>

        {/* Today dept breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <HeroIcons.BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
            Today by Department
          </h3>
          {dailyDeptBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyDeptBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present"  name="Present"  fill="#10b981" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="late"     name="Late"     fill="#f59e0b" stackId="a" />
                <Bar dataKey="half_day" name="Half Day" fill="#f97316" stackId="a" />
                <Bar dataKey="absent"   name="Absent"   fill="#ef4444" stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={loadingDaily} icon="BuildingOfficeIcon" msg="No punch data for today yet" />
          )}
        </div>
      </div>

      {/* Late arrivals alert strip */}
      {dailyData.filter(r => r.is_late).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <HeroIcons.ClockIcon className="w-4 h-4" />
            Late Arrivals Today — {dailyData.filter(r => r.is_late).length} employee{dailyData.filter(r => r.is_late).length !== 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            {dailyData.filter(r => r.is_late).map((r, i) => (
              <span key={i} className="bg-white text-amber-800 text-xs px-2.5 py-1 rounded-full border border-amber-200">
                {empName(r)} — {fmtTime(r.first_in)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW: DAILY
  // ────────────────────────────────────────────────────────────────────────────
  const renderDaily = () => (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Date</label>
          <input type="date" value={selectedDate} max={TODAY_STR}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="min-w-44">
          <label className="block text-xs text-slate-500 mb-1">Department</label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value={ALL_DEPT}>All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {[ALL_STATUS, 'present', 'late', 'half_day', 'absent'].map(s => {
            const label = s === ALL_STATUS
              ? `All (${dailyData.length})`
              : `${ATTENDANCE_STATUS[s].label} (${dailyStatusCounts[s] ?? 0})`
            return (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{label}</button>
            )
          })}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['present','late','half_day','absent'].map(s => {
          const m = ATTENDANCE_STATUS[s]
          return (
            <div key={s} className={`${m.bg} rounded-xl p-4 border ${m.border} text-center`}>
              <div className={`text-2xl font-bold ${m.text}`}>{dailyStatusCounts[s] ?? 0}</div>
              <div className={`text-xs font-medium ${m.text} mt-1`}>{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      {loadingDaily ? (
        <EmptyState loading icon="CalendarDaysIcon" loadingMsg={ATT_COPY.loading} />
      ) : filteredDaily.length === 0 ? (
        <EmptyState icon="CalendarDaysIcon" msg={ATT_COPY.dailyEmpty} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filteredDaily.length} employees · {selectedDate}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              {ATT_COPY.sourceTag}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {ATTENDANCE_DAILY_COLS.map(c => (
                    <th key={c.id} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDaily.map((r, i) => {
                  const status  = classifyDay(r)
                  const rowTone = ATTENDANCE_STATUS[status]?.row || ''
                  return (
                    <tr key={i} className={`${rowTone} hover:bg-slate-50 transition-colors`}>
                      {ATTENDANCE_DAILY_COLS.map(c => {
                        const v = c.accessor(r)
                        if (c.cellType === 'att_status') {
                          return <td key={c.id} className="px-3 py-2.5"><StatusBadge status={v} /></td>
                        }
                        return <td key={c.id} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{v}</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-400">{ATT_COPY.absenceNote}</p>
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW: MONTHLY
  // ────────────────────────────────────────────────────────────────────────────
  const renderMonthly = () => {
    const pieData = (() => {
      const n = enrichedMonthly.length
      if (n === 0) return []
      const good = enrichedMonthly.filter(r => r._rate >= ATT_GOOD_RATE_PCT).length
      const warn = enrichedMonthly.filter(r => r._rate >= ATT_WARN_RATE_PCT && r._rate < ATT_GOOD_RATE_PCT).length
      const poor = n - good - warn
      return [
        { name: `Good  ≥${ATT_GOOD_RATE_PCT}%`, value: good, fill: '#10b981' },
        { name: `Warn  ≥${ATT_WARN_RATE_PCT}%`, value: warn, fill: '#f59e0b' },
        { name: `Poor  <${ATT_WARN_RATE_PCT}%`, value: poor, fill: '#ef4444' },
      ].filter(d => d.value > 0)
    })()

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Month</label>
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {MONTH_FULL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Year</label>
            <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              {[selYear - 1, selYear, selYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="min-w-44">
            <label className="block text-xs text-slate-500 mb-1">Department</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value={ALL_DEPT}>All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="ml-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold">{workingDays}</span> working days in {MONTH_FULL[selMonth - 1]} {selYear}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Days Present vs Absent by Department</h3>
            {monthlyDeptBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyDeptBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="present" name="Present Days" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="absent"  name="Absent Days"  fill="#f87171" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState loading={loadingMonthly} icon="ChartBarIcon" msg={ATT_COPY.monthlyEmpty} />
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Attendance Rate Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} employees`, name]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState loading={loadingMonthly} icon="ChartPieIcon" msg={ATT_COPY.monthlyEmpty} />
            )}
          </div>
        </div>

        {/* Top absent alert */}
        {topAbsent.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-1.5">
              <HeroIcons.ExclamationTriangleIcon className="w-4 h-4" />
              High Absence — {MONTH_FULL[selMonth - 1]} {selYear}
            </h3>
            <div className="flex flex-wrap gap-2">
              {topAbsent.map((r, i) => (
                <span key={i} className="bg-white text-rose-700 text-xs px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                  {empName(r)}
                  <span className="font-bold">{r._absent}d</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Monthly employee table */}
        {loadingMonthly ? (
          <EmptyState loading icon="CalendarIcon" loadingMsg={ATT_COPY.loading} />
        ) : enrichedMonthly.length === 0 ? (
          <EmptyState icon="CalendarIcon" msg={ATT_COPY.monthlyEmpty} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">{enrichedMonthly.length} employees · {MONTH_FULL[selMonth - 1]} {selYear}</span>
              <span className="text-xs text-slate-400">{workingDays} working days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {ATTENDANCE_MONTHLY_COLS.map(c => (
                      <th key={c.id} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedMonthly.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      {ATTENDANCE_MONTHLY_COLS.map(c => {
                        const v = c.accessor(r)
                        if (c.cellType === 'att_rate') {
                          return (
                            <td key={c.id} className="px-3 py-2.5">
                              <span className={`font-semibold ${rateColor(v)}`}>{v}%</span>
                            </td>
                          )
                        }
                        if (c.cellType === 'absent_count') {
                          return (
                            <td key={c.id} className="px-3 py-2.5">
                              <span className={v > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}>{v}</span>
                            </td>
                          )
                        }
                        if (c.cellType === 'late_count') {
                          return (
                            <td key={c.id} className="px-3 py-2.5">
                              <span className={v > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>{v}</span>
                            </td>
                          )
                        }
                        return <td key={c.id} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{v}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400">{ATT_COPY.absenceNote} · {ATT_COPY.leaveNote}</p>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW: YEARLY
  // ────────────────────────────────────────────────────────────────────────────
  const renderYearly = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Year</label>
          <select value={selYear}
            onChange={e => { setSelYear(Number(e.target.value)); setYearlyData([]) }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            {[selYear - 2, selYear - 1, selYear].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="min-w-44">
          <label className="block text-xs text-slate-500 mb-1">Department</label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value={ALL_DEPT}>All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {loadingYearly && (
          <div className="flex items-center gap-2 text-xs text-blue-600 ml-auto">
            <Spinner /> {ATT_COPY.yearlyLoading}
          </div>
        )}
      </div>

      {/* Yearly trend line chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <HeroIcons.ChartBarIcon className="w-4 h-4 text-blue-500" />
          {selYear} — Monthly Attendance Rate
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyTrend} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, name) => [
                name === 'rate' ? `${v}%` : `${v} employees`,
                name === 'rate' ? 'Attendance Rate' : 'Active Employees',
              ]}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}
              formatter={v => v === 'rate' ? 'Attendance Rate' : 'Active Employees'} />
            <Line yAxisId="left"  type="monotone" dataKey="rate"      stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="employees" stroke="#10b981" strokeWidth={1} dot={{ r: 3 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-employee yearly grid */}
      {loadingYearly && yearlyEmployees.length === 0 ? (
        <EmptyState loading icon="CalendarIcon" loadingMsg={ATT_COPY.yearlyLoading} />
      ) : yearlyEmployees.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{yearlyEmployees.filter(e => deptFilter === ALL_DEPT || e.dept === deptFilter).length} employees · {selYear}</span>
            <span className="text-xs text-slate-400">Rate = Present / Working days · Green ≥{ATT_GOOD_RATE_PCT}% · Amber ≥{ATT_WARN_RATE_PCT}%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-50 z-10">Employee</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Dept</th>
                  {MONTH_SHORT.map(m => (
                    <th key={m} className="text-center px-2 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">{m}</th>
                  ))}
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlyEmployees
                  .filter(e => deptFilter === ALL_DEPT || e.dept === deptFilter)
                  .map((emp, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-slate-100">{emp.name}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{emp.dept}</td>
                      {emp.months.map((m, mi) => (
                        <td key={mi} className="px-2 py-2 text-center">
                          {m ? (
                            <span className={`font-semibold text-xs ${rateColor(m.rate)}`}>{m.rate}%</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center bg-slate-50">
                        <span className={`font-bold text-sm ${rateColor(emp.yearRate)}`}>{emp.yearRate}%</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loadingYearly && (
        <EmptyState icon="CalendarIcon" msg={ATT_COPY.noData} />
      )}
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* View switcher tabs */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex gap-1 overflow-x-auto">
        {ATTENDANCE_VIEWS.map(v => {
          const Icon    = HeroIcons[v.icon] || HeroIcons.CalendarIcon
          const isActive = view === v.id
          return (
            <button key={v.id} type="button" onClick={() => setView(v.id)} title={v.description}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}>
              <Icon className="w-4 h-4" />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* Render active view */}
      {view === 'overview' && renderOverview()}
      {view === 'summary'  && <SummaryTab />}
      {view === 'daily'    && renderDaily()}
      {view === 'monthly'  && renderMonthly()}
      {view === 'yearly'   && renderYearly()}
      {view === 'reports'  && <ReportsTab todayStr={TODAY_STR} />}
    </div>
  )
}
