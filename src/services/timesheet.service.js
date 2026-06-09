/**
 * Time Sheet Analytics — API service layer
 * -----------------------------------------
 * Thin axios wrappers around the backend's /api/v1/timesheet/* endpoints.
 * Every URL is read from `timesheet.config.js` — no hard-coded paths.
 */
import apiClient from './api.service'
import { TIMESHEET_ENDPOINTS } from '../config/timesheet.config'

const unwrap = (p) => p.then((r) => r.data)

// Health + Setup wizard --------------------------------------------------------
export const fetchHealth     = ()                  => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.health))
export const listDatabases   = ()                  => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.databases))
export const listTables      = (database)          => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.tables,  { params: { database } }))
export const listColumns     = (database, table)   => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.columns, { params: { database, table } }))
export const previewTable    = (database, table, limit = 5) =>
  unwrap(apiClient.get(TIMESHEET_ENDPOINTS.preview, { params: { database, table, limit } }))

// Reports ----------------------------------------------------------------------
export const fetchLive       = ()                  => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.live))
export const fetchDaily      = (date)              => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.daily,   { params: date ? { date } : {} }))
export const fetchMonthly    = (year, month)       => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.monthly, { params: { year, month } }))
export const fetchUserHistory = (params)           => unwrap(apiClient.get(TIMESHEET_ENDPOINTS.user,    { params }))

// Exports — return blob; callers handle download --------------------------------
const downloadBlob = (url, params, filename) =>
  apiClient.get(url, { params, responseType: 'blob' }).then((resp) => {
    const blob = new Blob([resp.data], { type: resp.headers['content-type'] })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  })

export const downloadDailyExcel    = (date)        => downloadBlob(TIMESHEET_ENDPOINTS.exportDaily,      date ? { date } : {}, `timesheet_daily_${date || 'today'}.xlsx`)
export const downloadMonthlyExcel  = (year, month) => downloadBlob(TIMESHEET_ENDPOINTS.exportMonthly,    { year, month },      `timesheet_monthly_${year}_${month}.xlsx`)
export const downloadMonthlyPdf    = (year, month) => downloadBlob(TIMESHEET_ENDPOINTS.exportMonthlyPdf, { year, month },      `timesheet_monthly_${year}_${month}.pdf`)

export default {
  fetchHealth, listDatabases, listTables, listColumns, previewTable,
  fetchLive, fetchDaily, fetchMonthly, fetchUserHistory,
  downloadDailyExcel, downloadMonthlyExcel, downloadMonthlyPdf,
}
