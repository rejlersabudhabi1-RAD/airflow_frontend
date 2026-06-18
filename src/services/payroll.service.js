/**
 * Payroll Intelligence — API Service
 * All calls go through the existing apiClient (axios instance with auth headers).
 * Base path: /api/v1/payroll/
 */
import apiClient from './api.service'

const BASE = '/payroll'
const FINANCE = '/finance'

const unwrap = (p) => p.then((r) => r.data)

const payrollService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardSummary: () =>
    unwrap(apiClient.get(`${BASE}/dashboard-summary/`)),

  // ── Validation Logs ────────────────────────────────────────────────────────
  getValidationLogs: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/validation-logs/`, { params })),

  resolveValidation: (id) =>
    unwrap(apiClient.post(`${BASE}/validation-logs/${id}/resolve/`)),

  bulkCreateValidations: (items) =>
    unwrap(apiClient.post(`${BASE}/validation-logs/bulk-create/`, items)),

  // ── Audit Alerts ───────────────────────────────────────────────────────────
  getAuditAlerts: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/audit-alerts/`, { params })),

  acknowledgeAlert: (id) =>
    unwrap(apiClient.post(`${BASE}/audit-alerts/${id}/acknowledge/`)),

  resolveAlert: (id) =>
    unwrap(apiClient.post(`${BASE}/audit-alerts/${id}/resolve/`)),

  // ── Project Cost Allocations ───────────────────────────────────────────────
  getProjectCosts: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/project-costs/`, { params })),

  getDeptCostSummary: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/project-costs/department-summary/`, { params })),

  createProjectCost: (data) =>
    unwrap(apiClient.post(`${BASE}/project-costs/`, data)),

  // ── AI Insight Snapshots ───────────────────────────────────────────────────
  getAIInsights: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/ai-insights/`, { params })),

  saveAIInsight: (data) =>
    unwrap(apiClient.post(`${BASE}/ai-insights/`, data)),

  clearExpiredInsights: () =>
    unwrap(apiClient.delete(`${BASE}/ai-insights/clear-expired/`)),

  // ── Chatbot Messages ───────────────────────────────────────────────────────
  getChatHistory: (sessionId) =>
    unwrap(apiClient.get(`${BASE}/chatbot-messages/`, { params: { session_id: sessionId } })),

  saveChatMessage: (data) =>
    unwrap(apiClient.post(`${BASE}/chatbot-messages/`, data)),

  // ── Leave Records (imported from HR Excel) ─────────────────────────────────
  getLeaveRecords: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/leave-records/`, { params })),

  getLeaveRecord: (id) =>
    unwrap(apiClient.get(`${BASE}/leave-records/${id}/`)),

  // ── Leave Types (master list) ──────────────────────────────────────────────
  getLeaveTypes: () =>
    unwrap(apiClient.get(`${BASE}/leave-types/`)),

  // ── Leave Requests (CRUD + workflow) ──────────────────────────────────────
  getLeaveRequests: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/leave-requests/`, { params })),

  getLeaveRequest: (id) =>
    unwrap(apiClient.get(`${BASE}/leave-requests/${id}/`)),

  createLeaveRequest: (data) =>
    unwrap(apiClient.post(`${BASE}/leave-requests/`, data)),

  approveLeaveRequest: (id, note = '') =>
    unwrap(apiClient.post(`${BASE}/leave-requests/${id}/approve/`, { note })),

  rejectLeaveRequest: (id, note = '') =>
    unwrap(apiClient.post(`${BASE}/leave-requests/${id}/reject/`, { note })),

  cancelLeaveRequest: (id) =>
    unwrap(apiClient.post(`${BASE}/leave-requests/${id}/cancel/`)),

  // ── Leave Calendar (approved leave per employee per day) ──────────────────
  getLeaveCalendar: (year, month) =>
    unwrap(apiClient.get(`${BASE}/leave-calendar/`, { params: { year, month } })),

  // ── Branch employee codes (flat list — used for attendance branch filter) ──
  // Returns { branch, year, codes: string[] } — lightweight, no pagination
  getBranchEmployeeCodes: (branch, year) =>
    unwrap(apiClient.get(`${BASE}/branch-employee-codes/`, { params: { branch, year } })),

  // ── Public Holidays (Abu Dhabi / UAE official calendar + HR-added) ────────
  // List: any authenticated user may read.
  // Create/update/deactivate: HR Manager only (enforced by backend).
  getPublicHolidays: (year, params = {}) =>
    unwrap(apiClient.get(`${BASE}/public-holidays/`, { params: { year, ...params } })),

  createPublicHoliday: (data) =>
    unwrap(apiClient.post(`${BASE}/public-holidays/`, data)),

  updatePublicHoliday: (id, data) =>
    unwrap(apiClient.patch(`${BASE}/public-holidays/${id}/`, data)),

  deactivatePublicHoliday: (id) =>
    unwrap(apiClient.delete(`${BASE}/public-holidays/${id}/`)),

  // ── Attendance Overrides (HR Manager manual cell corrections) ─────────────
  // Returns active overrides for a given year+month.
  // Backend enforces HR Manager permission for write operations.
  getAttendanceOverrides: (year, month, params = {}) =>
    unwrap(apiClient.get(`${BASE}/attendance-overrides/`, { params: { year, month, ...params } })),

  createAttendanceOverride: (data) =>
    unwrap(apiClient.post(`${BASE}/attendance-overrides/`, data)),

  updateAttendanceOverride: (id, data) =>
    unwrap(apiClient.patch(`${BASE}/attendance-overrides/${id}/`, data)),

  // ── Finance payroll endpoints (reused from finance.service) ────────────────
  getPayrollRuns: (params = {}) =>
    unwrap(apiClient.get(`${FINANCE}/payroll-runs/`, { params })),

  getSalarySlips: (params = {}) =>
    unwrap(apiClient.get(`${FINANCE}/salary-slips/`, { params })),

  getSalarySlip: (id) =>
    unwrap(apiClient.get(`${FINANCE}/salary-slips/${id}/`)),

  getSalarySlipStats: () =>
    unwrap(apiClient.get(`${FINANCE}/salary-slips/stats/`)),

  getEmployeeSalaryInfo: (params = {}) =>
    unwrap(apiClient.get(`${FINANCE}/employee-salary-info/`, { params })),

  approveSalarySlip: (id, data = {}) =>
    unwrap(apiClient.post(`${FINANCE}/salary-slips/${id}/approve/`, data)),

  rejectSalarySlip: (id, data = {}) =>
    unwrap(apiClient.post(`${FINANCE}/salary-slips/${id}/reject/`, data)),

  sendSalarySlipEmail: (id) =>
    unwrap(apiClient.post(`${FINANCE}/salary-slips/${id}/send-email/`)),

  processPayrollRun: (id) =>
    unwrap(apiClient.post(`${FINANCE}/payroll-runs/${id}/process/`)),

  // ── Salary Components ──────────────────────────────────────────────────────
  getSalaryComponents: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/salary-components/`, { params })),

  createSalaryComponent: (data) =>
    unwrap(apiClient.post(`${BASE}/salary-components/`, data)),

  updateSalaryComponent: (id, data) =>
    unwrap(apiClient.patch(`${BASE}/salary-components/${id}/`, data)),

  deactivateSalaryComponent: (id) =>
    unwrap(apiClient.delete(`${BASE}/salary-components/${id}/`)),

  // ── Salary Structures ──────────────────────────────────────────────────────
  getSalaryStructures: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/salary-structures/`, { params })),

  getSalaryStructure: (id) =>
    unwrap(apiClient.get(`${BASE}/salary-structures/${id}/`)),

  createSalaryStructure: (data) =>
    unwrap(apiClient.post(`${BASE}/salary-structures/`, data)),

  updateSalaryStructure: (id, data) =>
    unwrap(apiClient.patch(`${BASE}/salary-structures/${id}/`, data)),

  deactivateSalaryStructure: (id) =>
    unwrap(apiClient.delete(`${BASE}/salary-structures/${id}/`)),

  submitSalaryStructure: (id) =>
    unwrap(apiClient.post(`${BASE}/salary-structures/${id}/submit/`)),

  approveSalaryStructure: (id, data = {}) =>
    unwrap(apiClient.post(`${BASE}/salary-structures/${id}/approve/`, data)),

  rejectSalaryStructure: (id, data = {}) =>
    unwrap(apiClient.post(`${BASE}/salary-structures/${id}/reject/`, data)),

  getPendingSalaryStructures: () =>
    unwrap(apiClient.get(`${BASE}/salary-structures/pending/`)),

  getSalarySummary: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/salary-structures/summary/`, { params })),

  // ── Salary History ─────────────────────────────────────────────────────────
  getSalaryHistory: (params = {}) =>
    unwrap(apiClient.get(`${BASE}/salary-history/`, { params })),

  // ── Annual Leave Balance Summary ───────────────────────────────────────────
  // Returns per-employee YTD balance as of end of (year, month).
  // Response: { year, month, balances: { employee_code: {...} }, balances_by_name: { norm_name: {...} } }
  getAnnualLeaveBalanceSummary: (year, month, params = {}) =>
    unwrap(apiClient.get(`${BASE}/annual-leave-balance/`, { params: { year, month, ...params } })),

  // ── Sync Leave Data (HR Manager upload) ────────────────────────────────────
  // POST multipart with field "file" (xlsx). Imports + computes accruals.
  syncLeaveData: (formData) =>
    unwrap(apiClient.post(`${BASE}/sync-leave-data/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })),
}

export default payrollService
