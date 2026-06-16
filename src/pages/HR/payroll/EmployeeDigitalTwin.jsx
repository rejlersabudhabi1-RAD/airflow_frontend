/**
 * Employee Digital Twin — live profile with HR, Timesheet, Payroll & AI Insights
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import rbacService from '../../../services/rbac.service'
import timesheetService from '../../../services/timesheet.service'
import payrollService from '../../../services/payroll.service'
import {
  PAYROLL_AI_INSIGHT_RULES, PAYROLL_AUDIT_THRESHOLDS,
  PAYROLL_COPY, PAYROLL_VALIDATION_SEVERITY,
  fmtCurrency, riskColor,
} from '../../../config/hrPayroll.config'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

// Run all AI insight rules against the available data
const computeInsights = (employee, monthlyTs, prevMonthTs, slip) =>
  PAYROLL_AI_INSIGHT_RULES
    .map((rule) => {
      try {
        const result = rule.compute({ employee, monthlyTs, prevMonthTs, slip })
        if (!result) return null
        return { ...result, id: rule.id, label: rule.label, icon: rule.icon }
      } catch { return null }
    })
    .filter(Boolean)

const InsightCard = ({ insight }) => {
  const Icon = HeroIcons[insight.icon] || HeroIcons.LightBulbIcon
  const tone = PAYROLL_VALIDATION_SEVERITY[insight.severity]?.tone ?? 'bg-slate-50 border-slate-200 text-slate-600'
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold">{insight.label}</span>
      </div>
      <p className="text-xs font-bold">{insight.title}</p>
      <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-xs font-medium text-slate-800">{value ?? '—'}</span>
  </div>
)

export default function EmployeeDigitalTwin() {
  const now = new Date()
  const [employees, setEmployees]   = useState([])
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [tsData, setTsData]         = useState(null)
  const [prevTsData, setPrevTsData] = useState(null)
  const [salaryInfo, setSalaryInfo] = useState(null)
  const [latestSlip, setLatestSlip] = useState(null)
  const [insights, setInsights]     = useState([])

  // Load employee list
  useEffect(() => {
    rbacService.getUsers(1, 500).then((r) => {
      setEmployees(r?.results ?? r ?? [])
    }).finally(() => setLoadingList(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return employees
    return employees.filter((e) =>
      [e.first_name, e.last_name, e.email, e.employee_id].some((v) => (v ?? '').toLowerCase().includes(q))
    )
  }, [employees, search])

  const selectEmployee = useCallback(async (emp) => {
    setSelected(emp)
    setLoadingDetail(true)
    setTsData(null); setPrevTsData(null); setSalaryInfo(null); setLatestSlip(null); setInsights([])
    try {
      const month     = now.getMonth() + 1
      const year      = now.getFullYear()
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear  = month === 1 ? year - 1 : year

      const [ts, prevTs, si, slips] = await Promise.allSettled([
        timesheetService.fetchMonthly(year, month),
        timesheetService.fetchMonthly(prevYear, prevMonth),
        payrollService.getEmployeeSalaryInfo({ search: emp.email }),
        payrollService.getSalarySlips({ page_size: 1, ordering: '-created_at' }),
      ])

      const tsRows    = ts.value?.rows ?? []
      const empCode   = emp.employee_code || emp.username
      const empRow    = tsRows.find((r) => r.employee_code === empCode || r.radai_email === emp.email)
      const prevRows  = prevTs.value?.rows ?? []
      const prevRow   = prevRows.find((r) => r.employee_code === empCode || r.radai_email === emp.email)
      const siList    = si.value?.results ?? si.value ?? []
      const siRecord  = siList[0] ?? null
      const slipList  = slips.value?.results ?? slips.value ?? []
      const slip      = slipList[0] ?? null

      setTsData(empRow ?? null)
      setPrevTsData(prevRow ?? null)
      setSalaryInfo(siRecord)
      setLatestSlip(slip)
      setInsights(computeInsights(emp, empRow, prevRow, slip))
    } finally {
      setLoadingDetail(false)
    }
  }, [])  // eslint-disable-line

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: Employee list */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <HeroIcons.MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={PAYROLL_COPY.searchEmployeePlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{filtered.length} employees</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center h-24"><Spinner /></div>
          ) : filtered.map((e) => {
            const name = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || e.email
            const isActive = selected?.id === e.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => selectEmployee(e)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{e.email}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            <div className="text-center">
              <HeroIcons.UserCircleIcon className="w-14 h-14 mx-auto mb-2 opacity-30" />
              <p>{PAYROLL_COPY.noEmployeeSelected}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {(`${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim() || selected.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{`${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim() || selected.email}</h2>
                  <p className="text-blue-200 text-sm">{selected.email}</p>
                  <p className="text-blue-100 text-xs mt-0.5">{selected.employee_id ?? 'No employee ID'}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Digital Twin</span>
                </div>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center h-32 text-slate-400 gap-2 text-sm">
                <Spinner /> Loading profile data…
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* HR Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <HeroIcons.IdentificationIcon className="w-4 h-4" /> HR Info
                  </h3>
                  <InfoRow label="Email"       value={selected.email} />
                  <InfoRow label="Employee ID" value={selected.employee_id} />
                  <InfoRow label="Department"  value={selected.department} />
                  <InfoRow label="Job Title"   value={selected.job_title} />
                  <InfoRow label="Location"    value={selected.location} />
                  <InfoRow label="Status"      value={selected.is_active ? 'Active' : 'Inactive'} />
                </div>

                {/* Timesheet */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <HeroIcons.ClockIcon className="w-4 h-4" /> Timesheet — {`${now.getMonth()+1}/${now.getFullYear()}`}
                  </h3>
                  {tsData ? <>
                    <InfoRow label="Days Present"   value={tsData.days_present} />
                    <InfoRow label="Full Days"       value={tsData.full_days} />
                    <InfoRow label="Total Hours"     value={tsData.total_hours ? `${Number(tsData.total_hours).toFixed(1)}h` : null} />
                    <InfoRow label="Avg Hours/Day"   value={tsData.avg_hours_per_day ? `${Number(tsData.avg_hours_per_day).toFixed(1)}h` : null} />
                    <InfoRow label="Late Arrivals"   value={tsData.late_arrivals} />
                  </> : (
                    <p className="text-xs text-slate-400">No timesheet data found for this month.</p>
                  )}
                </div>

                {/* Payroll */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <HeroIcons.BanknotesIcon className="w-4 h-4" /> Payroll Data
                  </h3>
                  {salaryInfo ? <>
                    <InfoRow label="Basic Salary"    value={fmtCurrency(salaryInfo.basic_salary, salaryInfo.currency)} />
                    <InfoRow label="Department"      value={salaryInfo.department} />
                    <InfoRow label="Designation"     value={salaryInfo.designation} />
                    <InfoRow label="Bank"            value={salaryInfo.bank_name} />
                  </> : <p className="text-xs text-slate-400">No salary structure found.</p>}
                  {latestSlip && <>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <InfoRow label="Latest Slip"   value={latestSlip.slip_number} />
                      <InfoRow label="Gross"         value={fmtCurrency(latestSlip.gross_salary)} />
                      <InfoRow label="Net"           value={fmtCurrency(latestSlip.net_salary)} />
                    </div>
                  </>}
                </div>

                {/* AI Insights */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <HeroIcons.SparklesIcon className="w-4 h-4" /> AI Insights
                    <span className="ml-auto text-[10px] text-slate-400 font-normal">Rule-based · No LLM</span>
                  </h3>
                  {insights.length === 0 ? (
                    <p className="text-xs text-slate-400">No data available for AI analysis this month.</p>
                  ) : (
                    <div className="space-y-2">
                      {insights.map((ins) => <InsightCard key={ins.id} insight={ins} />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
