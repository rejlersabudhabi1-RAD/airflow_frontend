import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { isUserAdmin } from '../utils/rbac.utils'
import wrenchService from '../services/wrench.service'
import {
  WrenchScrewdriverIcon,
  LinkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  KeyIcon,
  GlobeAltIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  FolderIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  LockClosedIcon,
  ServerIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

// ─── Constants ───────────────────────────────────────────────────────────────

const SYNC_DIRECTIONS = [
  {
    value: 'wrench_to_radai',
    label: 'Wrench → RADAI',
    description: 'Pull projects and documents from Wrench into RADAI',
    icon: '⬇️',
  },
  {
    value: 'radai_to_wrench',
    label: 'RADAI → Wrench',
    description: 'Push RADAI analysis results to Wrench',
    icon: '⬆️',
  },
]

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities', icon: ArrowsRightLeftIcon },
  { value: 'project', label: 'Projects', icon: FolderIcon },
  { value: 'document', label: 'Documents', icon: DocumentTextIcon },
  { value: 'transmittal', label: 'Transmittals', icon: ArrowsRightLeftIcon },
  { value: 'user', label: 'Users', icon: UsersIcon },
]

const STATUS_STYLES = {
  success: 'bg-green-100 text-green-800 border border-green-200',
  failed: 'bg-red-100 text-red-800 border border-red-200',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  partial: 'bg-orange-100 text-orange-800 border border-orange-200',
}

const STATUS_ICONS = {
  success: CheckCircleIcon,
  failed: XCircleIcon,
  in_progress: ArrowPathIcon,
  pending: ClockIcon,
  partial: ExclamationTriangleIcon,
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const Icon = STATUS_ICONS[status] || ClockIcon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || ''}`}>
      <Icon className="w-3 h-3" />
      {status?.replace('_', ' ')}
    </span>
  )
}

const Alert = ({ type = 'info', message }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  const Icon = type === 'success' ? CheckCircleIcon : type === 'error' ? XCircleIcon :
    type === 'warning' ? ExclamationTriangleIcon : InformationCircleIcon
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Configuration Panel ─────────────────────────────────────────────────────

const ConfigPanel = ({ config, onSaved, onVerify }) => {
  const [form, setForm] = useState({
    base_url: config?.base_url || '',
    svc_url: config?.svc_url || '',
    server_id: config?.server_id ?? 1,
    login_name: config?.login_name || '',
    password: '',           // always blank – write-only, never returned by API
    is_password_encrypted: config?.is_password_encrypted ?? 0,
    otp: '',                // never persisted server-side; sent only at login time
    language: config?.language || '',
    time_zone_id: config?.time_zone_id || '',
    workstation_name: config?.workstation_name ?? 'RADAI',
    organization_name: config?.organization_name || '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.password && !config) {
      setAlert({ type: 'error', message: 'Password is required for new configurations.' })
      return
    }
    setSaving(true)
    setAlert(null)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password  // keep existing encrypted password on update
      await wrenchService.saveConfig(payload)
      setAlert({ type: 'success', message: 'Configuration saved successfully.' })
      setForm((prev) => ({ ...prev, password: '' }))  // clear password from component state
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {}).flat().join(' ')
        || 'Failed to save configuration.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setAlert(null)
    const result = await onVerify()
    setAlert({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
    setVerifying(false)
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Connection Settings</h3>
            <p className="text-xs text-gray-500">Wrench REST API endpoint &amp; credentials</p>
          </div>
        </div>
        {config?.connection_verified && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <CheckCircleIcon className="w-4 h-4" /> Verified
          </span>
        )}
      </div>

      {/* Security notice */}
      <div className="mx-6 mt-5">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Passwords are encrypted at rest using Fernet symmetric encryption. Session tokens are
            refreshed with every API call (rolling token). Credentials are never logged or returned.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <GlobeAltIcon className="w-4 h-4 inline mr-1 text-gray-400" />
            Wrench WebAPI Server URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={form.base_url}
            onChange={handleChange('base_url')}
            placeholder="https://your-org.wrenchproject.com"
            required
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Must use HTTPS. Used for login and document operations.</p>
        </div>

        {/* SVC URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <GlobeAltIcon className="w-4 h-4 inline mr-1 text-gray-400" />
            Document Search Service URL
            <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={form.svc_url}
            onChange={handleChange('svc_url')}
            placeholder="https://svc.wrenchproject.com"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank if DocumentSearch runs on the same host as the WebAPI.</p>
        </div>

        {/* Server ID + Login Name (row) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ServerIcon className="w-4 h-4 inline mr-1 text-gray-400" />
              Server ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.server_id}
              onChange={(e) => setForm((p) => ({ ...p, server_id: parseInt(e.target.value, 10) || 1 }))}
              placeholder="1"
              required
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Wrench SERVER_ID for login</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserCircleIcon className="w-4 h-4 inline mr-1 text-gray-400" />
              Login Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.login_name}
              onChange={handleChange('login_name')}
              placeholder="ADMIN"
              required
              className={inputClass}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <LockClosedIcon className="w-4 h-4 inline mr-1 text-gray-400" />
            Password {!config && <span className="text-red-500">*</span>}
            {config && <span className="text-gray-400 font-normal"> (leave blank to keep existing)</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              placeholder={config ? '••••••••••••••••' : 'Enter Wrench account password'}
              className={`${inputClass} pr-20`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Organisation Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
          <input
            type="text"
            value={form.organization_name}
            onChange={handleChange('organization_name')}
            placeholder="e.g. Rejlers Abu Dhabi"
            className={inputClass}
          />
        </div>

        {/* ── Advanced / Optional Login Parameters ── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Advanced Login Parameters
              <span className="text-xs text-gray-400 font-normal">(optional – from SmartProject API spec)</span>
            </span>
            {showAdvanced
              ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
              : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-4 bg-white border-t border-gray-200">

              {/* IS_PASSWORD_ENCRYPTED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IS_PASSWORD_ENCRYPTED
                </label>
                <select
                  value={form.is_password_encrypted}
                  onChange={(e) => setForm((p) => ({ ...p, is_password_encrypted: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value={0}>0 – Plain-text password (default)</option>
                  <option value={1}>1 – Pre-encrypted password</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Set to 1 only if the Wrench server expects a pre-hashed password.
                </p>
              </div>

              {/* OTP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP <span className="text-gray-400 font-normal">(one-time password)</span>
                </label>
                <input
                  type="text"
                  value={form.otp}
                  onChange={handleChange('otp')}
                  placeholder="Leave blank if MFA is not enabled"
                  className={inputClass}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Required only if your Wrench server enforces MFA via GenerateOTP.
                </p>
              </div>

              {/* Language + Timezone (row) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LANGUAGE
                  </label>
                  <input
                    type="text"
                    value={form.language}
                    onChange={handleChange('language')}
                    placeholder="e.g. en-US"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank for server default.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TIME_ZONE_ID
                  </label>
                  <input
                    type="text"
                    value={form.time_zone_id}
                    onChange={handleChange('time_zone_id')}
                    placeholder="e.g. Asia/Dubai"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank for server default.</p>
                </div>
              </div>

              {/* Workstation Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WORKSTATION_NAME
                </label>
                <input
                  type="text"
                  value={form.workstation_name}
                  onChange={handleChange('workstation_name')}
                  placeholder="RADAI"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Client identifier sent to Wrench on login. Defaults to "RADAI".
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>

          {config && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {verifying ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
              {verifying ? 'Testing…' : 'Test Connection'}
            </button>
          )}
        </div>
      </form>

      {/* Last verified */}
      {config?.last_verified_at && (
        <div className="px-6 pb-4 text-xs text-gray-400 flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          Last verified: {new Date(config.last_verified_at).toLocaleString()}
        </div>
      )}
    </div>
  )
}

// ─── Sync Panel ───────────────────────────────────────────────────────────────

const SyncPanel = ({ logs, onTrigger }) => {
  const [direction, setDirection] = useState('wrench_to_radai')
  const [entityType, setEntityType] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showDetails, setShowDetails] = useState(null)

  const handleSync = async () => {
    setSyncing(true)
    setAlert(null)
    try {
      await onTrigger(direction, entityType)
      setAlert({ type: 'success', message: 'Sync completed. Logs updated below.' })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Sync failed. Check the log below.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Trigger card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Data Synchronisation</h3>
              <p className="text-xs text-gray-500">Pull or push data between RADAI and Wrench</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {alert && <Alert type={alert.type} message={alert.message} />}

          {/* Direction selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sync Direction</label>
            <div className="grid grid-cols-2 gap-3">
              {SYNC_DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDirection(d.value)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    direction === d.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-lg mb-1">{d.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{d.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entity selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <div className="flex flex-wrap gap-2">
              {ENTITY_TYPES.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEntityType(e.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${
                    entityType === e.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-400'
                  }`}
                >
                  <e.icon className="w-3.5 h-3.5" />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            {syncing ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowsRightLeftIcon className="w-4 h-4" />
            )}
            {syncing ? 'Syncing…' : 'Run Sync'}
          </button>
        </div>
      </div>

      {/* Sync log table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            Sync History
          </h3>
          <span className="text-xs text-gray-400">{logs.length} recent logs</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            No sync logs yet. Run your first sync above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={log.status} />
                    <span className="text-sm text-gray-700">
                      {log.direction.replace('_', ' → ')} · {log.entity_type}
                    </span>
                    {log.records_synced > 0 && (
                      <span className="text-xs text-gray-400">
                        {log.records_synced} / {log.records_requested} records
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(log.started_at).toLocaleString()}
                    </span>
                    {log.duration_seconds != null && (
                      <span className="text-xs text-gray-400">{log.duration_seconds.toFixed(1)}s</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showDetails === log.id ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {showDetails === log.id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                    {log.triggered_by_email && (
                      <p><span className="font-medium">Triggered by:</span> {log.triggered_by_email}</p>
                    )}
                    {log.error_message && (
                      <p className="text-red-600"><span className="font-medium">Error:</span> {log.error_message}</p>
                    )}
                    {Object.keys(log.sync_details || {}).length > 0 && (
                      <pre className="bg-white rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.sync_details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Document Search Panel ────────────────────────────────────────────────────

const DOC_COLUMNS = [
  { key: 'DOC_NO', label: 'Doc No.' },
  { key: 'DOC_DESCRIPTION', label: 'Description' },
  { key: 'ORDER_NO', label: 'Order' },
  { key: 'GENEALOGY_STRING', label: 'Path / Genealogy' },
  { key: 'CREATED_BY_USER', label: 'Created By' },
  { key: 'WF_TEAM_NAME', label: 'WF Team' },
  { key: 'IDOC_ID', label: 'IDOC' },
]

const DocumentSearchPanel = ({ config, configured, onGoToConfig }) => {
  const [filters, setFilters] = useState({
    discipline: '',
    doc_no: '',
    date_from: '',
    date_to: '',
    page_size: 50,
  })
  const [page, setPage] = useState(1)
  const [results, setResults] = useState(null)  // { total, documents }
  const [searching, setSearching] = useState(false)
  const [alert, setAlert] = useState(null)

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'

  const handleSearch = async (targetPage = 1) => {
    setSearching(true)
    setAlert(null)
    try {
      const res = await wrenchService.searchDocuments({
        ...filters,
        page: targetPage,
      })
      setResults(res.data)
      setPage(targetPage)
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Document search failed. Check the server logs.',
      })
    } finally {
      setSearching(false)
    }
  }

  const totalPages = results ? Math.ceil(results.total / filters.page_size) : 0

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Cog6ToothIcon className="w-9 h-9 text-amber-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Wrench Not Configured</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Set up your Wrench SmartProject credentials in the Configuration tab to start searching documents.
          </p>
        </div>
        <button
          onClick={onGoToConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Go to Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filter card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Document Search</h3>
              <p className="text-xs text-gray-500">Query the Wrench SmartProject document repository</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {alert && <Alert type={alert.type} message={alert.message} />}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discipline</label>
              <input
                type="text"
                value={filters.discipline}
                onChange={(e) => setFilters((f) => ({ ...f, discipline: e.target.value }))}
                placeholder="e.g. INST, PIPING, ELEC"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Document No.</label>
              <input
                type="text"
                value={filters.doc_no}
                onChange={(e) => setFilters((f) => ({ ...f, doc_no: e.target.value }))}
                placeholder="Exact DOC_NO match"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approved From</label>
              <input
                type="text"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                placeholder="YYYY/MM/DD HH:MM"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approved To</label>
              <input
                type="text"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                placeholder="YYYY/MM/DD HH:MM"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Rows per page:</label>
              <select
                value={filters.page_size}
                onChange={(e) => setFilters((f) => ({ ...f, page_size: Number(e.target.value) }))}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleSearch(1)}
              disabled={searching}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {searching
                ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                : <MagnifyingGlassIcon className="w-4 h-4" />}
              {searching ? 'Searching…' : 'Search Documents'}
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4 text-gray-400" />
              {results.total.toLocaleString()} document{results.total !== 1 ? 's' : ''} found
            </span>
            {totalPages > 1 && (
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            )}
          </div>

          {results.documents.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No documents match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {DOC_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.documents.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      {DOC_COLUMNS.map((col) => (
                        <td key={col.key} className="px-4 py-2.5 text-gray-700 max-w-[200px] truncate" title={doc[col.key] || ''}>
                          {doc[col.key] || <span className="text-gray-300">&mdash;</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSearch(page - 1)}
                disabled={page === 1 || searching}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={() => handleSearch(page + 1)}
                disabled={page >= totalPages || searching}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Overview Stats ───────────────────────────────────────────────────────────

const OverviewStats = ({ config, logs }) => {
  const total = logs.length
  const success = logs.filter((l) => l.status === 'success').length
  const failed = logs.filter((l) => l.status === 'failed').length
  const lastSync = logs[0]

  const stats = [
    { label: 'Total Syncs', value: total, color: 'text-gray-900' },
    { label: 'Successful', value: success, color: 'text-green-700' },
    { label: 'Failed', value: failed, color: 'text-red-700' },
    {
      label: 'Integration Status',
      value: config?.connection_verified ? 'Active' : config ? 'Unverified' : 'Not Configured',
      color: config?.connection_verified ? 'text-green-700' : 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
  { id: 'config', label: 'Configuration', icon: WrenchScrewdriverIcon },
  { id: 'sync', label: 'Sync', icon: ArrowsRightLeftIcon },
  { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
]

const WrenchIntegration = () => {
  const { user } = useSelector((state) => state.auth)
  const admin = isUserAdmin(user)

  const [activeTab, setActiveTab] = useState('overview')
  const [config, setConfig] = useState(null)
  const [configured, setConfigured] = useState(false)
  const [syncLogs, setSyncLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageAlert, setPageAlert] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setPageAlert(null)
    try {
      const [cfgRes, logsRes] = await Promise.all([
        wrenchService.getConfig(),
        wrenchService.getSyncLogs(),
      ])
      setConfigured(cfgRes.data?.configured || false)
      setConfig(cfgRes.data?.config || null)
      setSyncLogs(logsRes.data || [])
      setRetrying(false)
    } catch (err) {
      const status = err.response?.status
      const errCode = err.response?.data?.error

      if (status === 503 || errCode === 'backend_unavailable') {
        // Backend is still starting – auto-retry once after 4 seconds
        setPageAlert({
          type: 'warning',
          message: 'Backend is starting up. Retrying in a few seconds…',
        })
        setRetrying(true)
        setTimeout(() => loadData({ silent: true }), 4000)
      } else if (status === 401 || status === 403) {
        setPageAlert({
          type: 'error',
          message: 'Access denied. Admin permissions are required to view Wrench Integration.',
        })
      } else {
        setPageAlert({
          type: 'error',
          message: 'Failed to load Wrench integration data. Check your permissions.',
        })
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleVerify = async () => {
    try {
      const res = await wrenchService.verifyConnection()
      await loadData()
      return res.data
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Connection test failed.',
      }
    }
  }

  const handleSyncTrigger = async (direction, entityType) => {
    const res = await wrenchService.triggerSync(direction, entityType)
    await loadData()
    return res.data
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldCheckIcon className="w-16 h-16 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-600">Admin Access Required</h2>
        <p className="text-sm text-gray-400">Only administrators can access the Wrench Integration settings.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow">
            <WrenchScrewdriverIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Wrench Integration</h1>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Connect RADAI with the Wrench Project Management Platform
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              config?.connection_verified
                ? 'bg-green-50 text-green-700 border-green-200'
                : configured
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config?.connection_verified ? 'bg-green-500' : configured ? 'bg-yellow-400' : 'bg-gray-400'
              }`}
            />
            {config?.connection_verified
              ? `Connected · ${config.organization_name || config.base_url}`
              : configured
              ? 'Configured – not verified'
              : 'Not configured'}
          </span>
        </div>
      </div>

      {pageAlert && (
        <div className="mb-6 flex items-start gap-3">
          <div className="flex-1">
            <Alert type={pageAlert.type} message={pageAlert.message} />
          </div>
          {!retrying && (
            <button
              type="button"
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition shrink-0 mt-0.5"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retry
            </button>
          )}
          {retrying && (
            <div className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 shrink-0 mt-0.5">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Retrying…
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="max-w-4xl">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <OverviewStats config={config} logs={syncLogs} />

              {/* Integration guide */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                  Integration Guide
                </h3>
                <ol className="space-y-3 text-sm text-gray-600">
                  {[
                    'Go to the Configuration tab and enter the Wrench WebAPI Server URL, Server ID, login name, and password.',
                    'Optionally enter the DocumentSearch Service URL if it runs on a different host than the WebAPI.',
                    'Click “Test Connection” to verify RADAI can authenticate with Wrench (a real login is performed).',
                    'Use the Sync tab to pull documents from Wrench or push RADAI analysis results back.',
                    'Use the Documents tab to search and browse the Wrench document repository directly.',
                    'All activity is recorded in the Sync History and in the RBAC Audit Log.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Recent activity */}
              {syncLogs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Recent Sync Activity</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {syncLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={log.status} />
                          <span className="text-sm text-gray-700">
                            {log.direction.replace(/_/g, ' → ')} · {log.entity_type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.started_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!configured && (
                <Alert
                  type="warning"
                  message="Wrench integration is not configured yet. Go to the Configuration tab to get started."
                />
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <ConfigPanel
              config={config}
              onSaved={loadData}
              onVerify={handleVerify}
            />
          )}

          {activeTab === 'sync' && (
            configured ? (
              <SyncPanel logs={syncLogs} onTrigger={handleSyncTrigger} />
            ) : (
              <Alert
                type="warning"
                message="Please configure and verify the Wrench connection in the Configuration tab before running a sync."
              />
            )
          )}

          {activeTab === 'documents' && (
            <DocumentSearchPanel
              config={config}
              configured={configured}
              onGoToConfig={() => setActiveTab('config')}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default WrenchIntegration
