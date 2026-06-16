/**
 * Payroll Intelligence Platform — Soft-Coded Configuration
 * =========================================================
 * All thresholds, colours, labels, column definitions, validation rules,
 * AI insight rules, and chatbot patterns live here.
 * No magic values in component code.
 *
 * Pattern mirrors hrEmployees.config.js for consistency.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. TABS
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_TABS = [
  { id: 'dashboard',   label: 'Dashboard',      icon: 'ChartBarIcon',               description: 'Executive KPI overview' },
  { id: 'attendance',  label: 'Attendance',     icon: 'ClipboardDocumentCheckIcon', description: 'HR Attendance — Daily · Monthly · Yearly' },
  { id: 'leave',       label: 'Leave',          icon: 'CalendarDaysIcon',           description: 'Leave balances imported from HR Excel' },
  { id: 'engine',      label: 'Payroll Engine', icon: 'CpuChipIcon',                description: 'Salary slips & approvals' },
  { id: 'auditor',     label: 'AI Auditor',     icon: 'MagnifyingGlassIcon',        description: 'Anomaly detection' },
  { id: 'assistant',   label: 'AI Assistant',   icon: 'ChatBubbleLeftIcon',         description: 'Payroll chatbot' },
]
export const PAYROLL_DEFAULT_TAB = 'dashboard'

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATUS MAPS
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_SLIP_STATUS = {
  draft:            { label: 'Draft',            tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  generated:        { label: 'Generated',        tone: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending_approval: { label: 'Pending Approval', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved:         { label: 'Approved',         tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:         { label: 'Rejected',         tone: 'bg-rose-100 text-rose-700 border-rose-200' },
  sent:             { label: 'Sent',             tone: 'bg-purple-100 text-purple-700 border-purple-200' },
  archived:         { label: 'Archived',         tone: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export const PAYROLL_RUN_STATUS = {
  draft:      { label: 'Draft',      tone: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Processing', tone: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Completed',  tone: 'bg-emerald-100 text-emerald-700' },
  failed:     { label: 'Failed',     tone: 'bg-rose-100 text-rose-700' },
}

export const PAYROLL_ALERT_SEVERITY = {
  low:      { label: 'Low',      tone: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  medium:   { label: 'Medium',   tone: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  high:     { label: 'High',     tone: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  critical: { label: 'Critical', tone: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500' },
}

export const PAYROLL_VALIDATION_SEVERITY = {
  error:   { label: 'Error',   tone: 'bg-rose-50 border-rose-200 text-rose-700',     icon: 'XCircleIcon' },
  warning: { label: 'Warning', tone: 'bg-amber-50 border-amber-200 text-amber-700',  icon: 'ExclamationTriangleIcon' },
  info:    { label: 'Info',    tone: 'bg-blue-50 border-blue-200 text-blue-700',      icon: 'InformationCircleIcon' },
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. KPI TILES
// ─────────────────────────────────────────────────────────────────────────────
// compute() receives the dashboardSummary object from the API
export const PAYROLL_KPIS = [
  {
    id: 'employees',
    label: 'Active Employees',
    icon: 'UsersIcon',
    tone: 'bg-blue-50 text-blue-700',
    compute: (s) => s?.total_employees ?? '—',
    suffix: '',
  },
  {
    id: 'gross',
    label: 'Current Month Gross',
    icon: 'BanknotesIcon',
    tone: 'bg-emerald-50 text-emerald-700',
    compute: (s) => fmtCurrency(s?.current_month_gross),
    suffix: '',
  },
  {
    id: 'net',
    label: 'Current Month Net',
    icon: 'CurrencyDollarIcon',
    tone: 'bg-teal-50 text-teal-700',
    compute: (s) => fmtCurrency(s?.current_month_net),
    suffix: '',
  },
  {
    id: 'pending',
    label: 'Pending Approvals',
    icon: 'ClockIcon',
    tone: 'bg-amber-50 text-amber-700',
    compute: (s) => s?.pending_approvals ?? 0,
    suffix: ' slips',
  },
  {
    id: 'ytd',
    label: 'YTD Payroll',
    icon: 'ChartBarIcon',
    tone: 'bg-purple-50 text-purple-700',
    compute: (s) => fmtCurrency(s?.ytd_payroll),
    suffix: '',
  },
  {
    id: 'alerts',
    label: 'Open Alerts',
    icon: 'BellAlertIcon',
    tone: 'bg-rose-50 text-rose-700',
    compute: (s) => (s?.open_validations ?? 0) + (s?.open_alerts ?? 0),
    suffix: ' issues',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. TABLE COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_RUN_COLUMNS = [
  { id: 'run_code',    label: 'Run Code',   accessor: (r) => r.run_code },
  { id: 'period',      label: 'Period',     accessor: (r) => `${String(r.month).padStart(2,'0')}/${r.year}` },
  { id: 'employees',   label: 'Employees',  accessor: (r) => r.total_employees ?? 0 },
  { id: 'gross',       label: 'Gross',      accessor: (r) => fmtCurrency(r.total_gross_salary) },
  { id: 'net',         label: 'Net',        accessor: (r) => fmtCurrency(r.total_net_salary) },
  { id: 'status',      label: 'Status',     accessor: (r) => r.status, cellType: 'run_status' },
]

export const PAYROLL_SLIP_COLUMNS = [
  { id: 'slip_number', label: 'Slip #',     accessor: (r) => r.slip_number },
  { id: 'employee',    label: 'Employee',   accessor: (r) => r.employee_name || r.employee_salary_info },
  { id: 'basic',       label: 'Basic',      accessor: (r) => fmtCurrency(r.basic_salary) },
  { id: 'allowances',  label: 'Allowances', accessor: (r) => fmtCurrency(r.total_allowances) },
  { id: 'deductions',  label: 'Deductions', accessor: (r) => fmtCurrency(r.total_deductions) },
  { id: 'net',         label: 'Net Salary', accessor: (r) => fmtCurrency(r.net_salary) },
  { id: 'status',      label: 'Status',     accessor: (r) => r.status, cellType: 'slip_status' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUDIT THRESHOLDS — soft-coded, override without touching component code
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_AUDIT_THRESHOLDS = {
  spikePercent:     20,    // % change in net salary that triggers a spike alert
  overtimeHours:    60,    // hours/month above which overtime alert fires
  minPresentDays:   15,    // days below which attendance anomaly fires
  minHoursPerDay:   4,     // hours below which a day is not counted as present
  burnoutHoursMonth: 200,  // monthly hours above which burnout risk fires
  lowUtilPercent:   50,    // utilization % below which productivity alert fires
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────
// check(slips, employees) → returns array of finding objects
export const PAYROLL_VALIDATION_RULES = [
  {
    id: 'missing_salary_structure',
    label: 'Missing Salary Structure',
    severity: 'error',
    check: (slips, employees) =>
      employees
        .filter((e) => !e.basic_salary || Number(e.basic_salary) <= 0)
        .map((e) => ({
          employee: e,
          description: `${e.employee_id || e.user?.email} has no basic salary configured.`,
          suggested_action: 'Open the employee salary profile and set basic salary.',
        })),
  },
  {
    id: 'negative_net_salary',
    label: 'Negative Net Salary',
    severity: 'error',
    check: (slips) =>
      slips
        .filter((s) => Number(s.net_salary) < 0)
        .map((s) => ({
          slip: s,
          description: `Slip ${s.slip_number} has a negative net salary (${fmtCurrency(s.net_salary)}).`,
          suggested_action: 'Review deduction amounts — total deductions exceed gross salary.',
        })),
  },
  {
    id: 'duplicate_slip',
    label: 'Duplicate Salary Slip',
    severity: 'error',
    check: (slips) => {
      const seen = {}
      const dupes = []
      for (const s of slips) {
        const key = `${s.employee_salary_info}-${s.month}-${s.year}`
        if (seen[key]) {
          dupes.push({
            slip: s,
            description: `Duplicate slip detected for employee ${s.slip_number} in ${s.month}/${s.year}.`,
            suggested_action: 'Delete the duplicate slip before approving.',
          })
        }
        seen[key] = true
      }
      return dupes
    },
  },
  {
    id: 'pending_approval_overdue',
    label: 'Approval Overdue (>3 days)',
    severity: 'warning',
    check: (slips) => {
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
      return slips
        .filter((s) => s.status === 'pending_approval' && s.created_at &&
          Date.now() - new Date(s.created_at).getTime() > THREE_DAYS_MS)
        .map((s) => ({
          slip: s,
          description: `Slip ${s.slip_number} has been pending approval for more than 3 days.`,
          suggested_action: 'Escalate to approver or reassign.',
        }))
    },
  },
  {
    id: 'missing_present_days',
    label: 'Missing Attendance Data',
    severity: 'warning',
    check: (slips) =>
      slips
        .filter((s) => s.status !== 'draft' && (s.present_days === null || s.present_days === undefined))
        .map((s) => ({
          slip: s,
          description: `Slip ${s.slip_number}: attendance data (present days) is missing.`,
          suggested_action: 'Sync attendance data before finalising payroll.',
        })),
  },
  {
    id: 'zero_gross',
    label: 'Zero Gross Salary',
    severity: 'warning',
    check: (slips) =>
      slips
        .filter((s) => Number(s.gross_salary) === 0)
        .map((s) => ({
          slip: s,
          description: `Slip ${s.slip_number} has zero gross salary.`,
          suggested_action: 'Check if all salary components are correctly mapped.',
        })),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 7. AI INSIGHT RULES (client-side, rule-based)
// ─────────────────────────────────────────────────────────────────────────────
// compute({ employee, monthlyTs, slip, prevMonthTs }) → { title, description, severity, value }
export const PAYROLL_AI_INSIGHT_RULES = [
  {
    id: 'attendance_anomaly',
    type: 'attendance_anomaly',
    label: 'Attendance Anomaly',
    icon: 'ExclamationCircleIcon',
    compute: ({ monthlyTs }) => {
      const days = monthlyTs?.days_present ?? null
      if (days === null) return null
      if (days < PAYROLL_AUDIT_THRESHOLDS.minPresentDays) {
        return {
          severity: 'warning',
          title: 'Low Attendance',
          description: `Only ${days} days present this month (threshold: ${PAYROLL_AUDIT_THRESHOLDS.minPresentDays}).`,
          value: days,
        }
      }
      return { severity: 'info', title: 'Attendance Normal', description: `${days} days present.`, value: days }
    },
  },
  {
    id: 'missing_timesheet',
    type: 'missing_timesheet',
    label: 'Missing Timesheet',
    icon: 'ClockIcon',
    compute: ({ monthlyTs }) => {
      if (!monthlyTs) {
        return { severity: 'error', title: 'No Timesheet Data', description: 'No timesheet record found for this month.', value: 0 }
      }
      const hours = monthlyTs.total_hours ?? 0
      if (hours === 0) {
        return { severity: 'warning', title: 'Zero Hours Logged', description: 'Timesheet exists but shows 0 hours.', value: 0 }
      }
      return null
    },
  },
  {
    id: 'overtime_alert',
    type: 'overtime_alert',
    label: 'Overtime Alert',
    icon: 'FireIcon',
    compute: ({ monthlyTs }) => {
      const hours = monthlyTs?.total_hours ?? 0
      if (hours > PAYROLL_AUDIT_THRESHOLDS.overtimeHours) {
        return {
          severity: 'warning',
          title: 'Excessive Overtime',
          description: `${hours.toFixed(1)}h logged — exceeds ${PAYROLL_AUDIT_THRESHOLDS.overtimeHours}h threshold.`,
          value: hours,
        }
      }
      return null
    },
  },
  {
    id: 'burnout_risk',
    type: 'burnout_risk',
    label: 'Burnout Risk',
    icon: 'HeartIcon',
    compute: ({ monthlyTs }) => {
      const hours = monthlyTs?.total_hours ?? 0
      if (hours > PAYROLL_AUDIT_THRESHOLDS.burnoutHoursMonth) {
        return {
          severity: 'error',
          title: 'Burnout Risk',
          description: `${hours.toFixed(1)}h/month exceeds burnout threshold of ${PAYROLL_AUDIT_THRESHOLDS.burnoutHoursMonth}h.`,
          value: hours,
        }
      }
      return null
    },
  },
  {
    id: 'payroll_risk',
    type: 'payroll_risk',
    label: 'Payroll Risk Score',
    icon: 'ShieldExclamationIcon',
    compute: ({ monthlyTs, slip }) => {
      let score = 0
      const days = monthlyTs?.days_present ?? PAYROLL_AUDIT_THRESHOLDS.minPresentDays
      if (days < PAYROLL_AUDIT_THRESHOLDS.minPresentDays) score += 30
      if (!monthlyTs) score += 40
      if (slip && Number(slip.net_salary) < 0) score += 30
      const severity = score >= 70 ? 'error' : score >= 40 ? 'warning' : 'info'
      return {
        severity,
        title: `Risk Score: ${score}/100`,
        description: score >= 70 ? 'High risk — review before processing.'
          : score >= 40 ? 'Moderate risk — verify attendance and salary data.'
          : 'Low risk — payroll looks healthy.',
        value: score,
      }
    },
  },
  {
    id: 'productivity_trend',
    type: 'productivity_trend',
    label: 'Productivity Trend',
    icon: 'ArrowTrendingUpIcon',
    compute: ({ monthlyTs, prevMonthTs }) => {
      if (!monthlyTs || !prevMonthTs) return null
      const curr = monthlyTs.total_hours ?? 0
      const prev = prevMonthTs.total_hours ?? 0
      if (prev === 0) return null
      const change = ((curr - prev) / prev) * 100
      return {
        severity: change >= 0 ? 'info' : 'warning',
        title: change >= 0 ? `+${change.toFixed(1)}% vs last month` : `${change.toFixed(1)}% vs last month`,
        description: `Hours: ${curr.toFixed(1)}h this month vs ${prev.toFixed(1)}h last month.`,
        value: change,
      }
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 8. CHATBOT PATTERNS (keyword → intent → response generator)
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_CHATBOT_PATTERNS = [
  {
    id: 'show_payslip',
    keywords: ['payslip', 'salary slip', 'my slip', 'pay slip'],
    quickLabel: 'Show my payslip',
    intent: 'show_payslip',
    respond: (data) => data?.latestSlip
      ? `Your latest payslip (${data.latestSlip.slip_number}) for ${data.latestSlip.month}/${data.latestSlip.year}:\n• Gross: ${fmtCurrency(data.latestSlip.gross_salary)}\n• Deductions: ${fmtCurrency(data.latestSlip.total_deductions)}\n• Net: ${fmtCurrency(data.latestSlip.net_salary)}\nStatus: ${PAYROLL_SLIP_STATUS[data.latestSlip.status]?.label ?? data.latestSlip.status}`
      : 'No salary slip found for the current period.',
  },
  {
    id: 'overtime',
    keywords: ['overtime', 'over time', 'extra hours'],
    quickLabel: 'Overtime this month',
    intent: 'overtime',
    respond: (data) => {
      const hours = data?.monthlyTs?.total_hours ?? 0
      const standard = 8 * (data?.monthlyTs?.days_present ?? 22)
      const ot = Math.max(0, hours - standard)
      return ot > 0
        ? `You have logged ${ot.toFixed(1)} overtime hours this month (${hours.toFixed(1)}h total vs ${standard}h standard).`
        : 'No overtime recorded this month.'
    },
  },
  {
    id: 'leave_balance',
    keywords: ['leave', 'leave balance', 'annual leave', 'vacation'],
    quickLabel: 'Leave balance',
    intent: 'leave_balance',
    respond: () => 'Leave balance data is managed in Sympa HRMS. Please check your HR portal for current leave balances.',
  },
  {
    id: 'deduction',
    keywords: ['deduction', 'why deducted', 'deduct', 'minus'],
    quickLabel: 'Why was salary deducted',
    intent: 'deduction',
    respond: (data) => {
      const breakdown = data?.latestSlip?.deductions_breakdown
      if (!breakdown || Object.keys(breakdown).length === 0) return 'No deduction breakdown available for the current period.'
      const lines = Object.entries(breakdown).map(([k, v]) => `• ${k}: ${fmtCurrency(v)}`)
      return `Deduction breakdown for your latest slip:\n${lines.join('\n')}`
    },
  },
  {
    id: 'payroll_summary',
    keywords: ['payroll summary', 'team payroll', 'department payroll', 'total payroll'],
    quickLabel: 'Payroll summary',
    intent: 'payroll_summary',
    persona: ['finance', 'manager', 'hr'],
    respond: (data) =>
      data?.summary
        ? `Current month payroll summary:\n• Employees: ${data.summary.total_employees}\n• Gross: ${fmtCurrency(data.summary.current_month_gross)}\n• Net: ${fmtCurrency(data.summary.current_month_net)}\n• Pending approvals: ${data.summary.pending_approvals}`
        : 'Payroll summary is not available yet.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 9. COPY
// ─────────────────────────────────────────────────────────────────────────────
export const PAYROLL_COPY = {
  pageTitle:            'Payroll Intelligence',
  pageSubtitle:         'AI-powered payroll management — validation, auditing, and real-time insights.',
  noRunSelected:        'Select a payroll run to view salary slips.',
  noSlipsFound:         'No salary slips found for this run.',
  noEmployeeSelected:   'Select an employee to view their Digital Twin.',
  validationEmpty:      'No validation findings. Payroll looks healthy.',
  auditorEmpty:         'No audit alerts for this run.',
  projectsComingSoon:   'Project Costing requires Valueframe integration.',
  chatWelcome:          'Hello! I\'m your Payroll Assistant. Ask me anything about your salary, overtime, or payroll status.',
  searchEmployeePlaceholder: 'Search employee name, code, email…',
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
// Soft-coded currency — change default here to affect every component
const DEFAULT_CURRENCY = 'AED'

export const fmtCurrency = (v, currency = DEFAULT_CURRENCY) => {
  const n = parseFloat(v) || 0
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const fmtPercent = (v) => {
  const n = parseFloat(v) || 0
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

export const riskColor = (score) => {
  if (score >= 70) return 'text-rose-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-emerald-600'
}

export const severityTone = (s) =>
  PAYROLL_VALIDATION_SEVERITY[s]?.tone ?? 'bg-slate-50 border-slate-200 text-slate-600'

export const slipStatusMeta = (s) => PAYROLL_SLIP_STATUS[s] ?? { label: s, tone: 'bg-slate-100 text-slate-600 border-slate-200' }
export const runStatusMeta  = (s) => PAYROLL_RUN_STATUS[s]  ?? { label: s, tone: 'bg-slate-100 text-slate-600' }
