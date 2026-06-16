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
}

export default payrollService
