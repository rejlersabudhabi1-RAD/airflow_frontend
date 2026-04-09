import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  CloudArrowUpIcon,
  StopCircleIcon,
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
  {
    value: 'wrench_to_s3',
    label: 'Wrench → AWS S3',
    description: 'Export Wrench data to your S3 bucket (batch or real-time)',
    icon: '☁️',
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

// Direction value that maps to the dedicated S3 Export tab — kept soft-coded so a
// rename here is the only change needed if the value ever changes.
const _S3_SYNC_DIRECTION = 'wrench_to_s3'

const SyncPanel = ({ logs, onTrigger, onGoToS3Tab }) => {
  const [direction, setDirection] = useState('wrench_to_radai')
  const [entityType, setEntityType] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showDetails, setShowDetails] = useState(null)

  const isS3Direction = direction === _S3_SYNC_DIRECTION

  const handleSync = async () => {
    // S3 export is handled by the dedicated S3 Export tab, not this sync endpoint
    if (isS3Direction) {
      onGoToS3Tab?.()
      return
    }
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

          {/* S3 direction info banner */}
          {isS3Direction && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200 text-sm">
              <CloudArrowUpIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Use the S3 Export tab for this direction</p>
                <p className="text-orange-700 mt-0.5">Wrench → AWS S3 supports both batch and real-time export with dedicated controls. Click below to go there.</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition ${
              isS3Direction
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {syncing ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : isS3Direction ? (
              <CloudArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowsRightLeftIcon className="w-4 h-4" />
            )}
            {syncing ? 'Syncing…' : isS3Direction ? 'Go to S3 Export →' : 'Run Sync'}
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

// ─── Documents & Transmittals Panel ──────────────────────────────────────────

// Soft-coded column priority list — matched against whatever fields the Wrench API returns.
// First keys found in the data win; remaining slots are filled from any extra fields.
const TRANSMITTAL_COL_PRIORITY = [
  // ── Fields confirmed from this Wrench instance (highest priority) ──
  { key: 'TRANS_REF_NO',       label: 'Trans. Ref No.' },
  { key: 'TRANS_ID',           label: 'Trans. ID' },
  { key: 'ORDER_NO',           label: 'Order No.' },
  { key: 'ORDER_DESCRIPTION',  label: 'Order Description' },
  { key: 'TRANS_DESC',         label: 'Description' },
  { key: 'DIST_LIST_DESC',     label: 'Distribution List' },
  { key: 'PROJECT_ID',         label: 'Project ID' },
  // ── Generic fallbacks for other Wrench instances ──
  { key: 'TRANS_NO',           label: 'Trans. No.' },
  { key: 'TRANSMITTAL_NO',     label: 'Trans. No.' },
  { key: 'NO',                 label: 'No.' },
  { key: 'TRANS_TITLE',        label: 'Title' },
  { key: 'TITLE',              label: 'Title' },
  { key: 'DESCRIPTION',        label: 'Description' },
  { key: 'TRANS_DATE',         label: 'Date' },
  { key: 'ISSUED_DATE',        label: 'Date' },
  { key: 'DATE',               label: 'Date' },
  { key: 'SENDER',             label: 'Sender' },
  { key: 'FROM',               label: 'From' },
  { key: 'RECIPIENT',          label: 'Recipient' },
  { key: 'TO',                 label: 'To' },
  { key: 'STATUS',             label: 'Status' },
  { key: 'TRANS_STATUS',       label: 'Status' },
  { key: 'DOC_COUNT',          label: 'Docs' },
  { key: 'DOCUMENT_COUNT',     label: 'Docs' },
  { key: 'PROJECT',            label: 'Project' },
  { key: 'PROJECT_NAME',       label: 'Project' },
]

// Soft-coded limits
const MAX_TABLE_COLS = 7
const TRANSMITTAL_PAGE_SIZE = 100

// Soft-coded: the field in a transmittal row that links it to its documents in Wrench.
// Wrench uses ORDER_NO as the common join key between GetTransmittalList and GetDocumentList.
const TRANS_DOC_LINK_FIELD = 'ORDER_NO'

// Soft-coded column priority for the per-transmittal document sub-table.
// First keys found in the returned data win; remaining slots fill from any extra fields.
const TRANS_DOC_COL_PRIORITY = [
  { key: 'DOC_NO',            label: 'Doc No.' },
  { key: 'DOCUMENT_NO',       label: 'Doc No.' },       // alias used by some instances
  { key: 'DOC_DESCRIPTION',   label: 'Description' },
  { key: 'DISCIPLINE',        label: 'Discipline' },
  { key: 'REVISION',          label: 'Rev.' },
  { key: 'REVISION_NO',       label: 'Rev.' },
  { key: 'STATUS',            label: 'Status' },
  { key: 'DOC_STATUS',        label: 'Status' },
  { key: 'WF_TEAM_NAME',      label: 'WF Team' },
  { key: 'CREATED_BY_USER',   label: 'Created By' },
]
// Soft-coded: max document columns shown in the sub-table
const TRANS_DOC_MAX_COLS = 5

// Soft-coded document columns for the SearchObject API result
const DOC_COLUMNS = [
  { key: 'DOC_NO',           label: 'Doc No.' },
  { key: 'DOC_DESCRIPTION',  label: 'Description' },
  { key: 'ORDER_NO',         label: 'Order' },
  { key: 'GENEALOGY_STRING', label: 'Path / Genealogy' },
  { key: 'CREATED_BY_USER',  label: 'Created By' },
  { key: 'WF_TEAM_NAME',     label: 'WF Team' },
  { key: 'IDOC_ID',          label: 'IDOC' },
]

// Derive display columns from the first data row using the priority list
function deriveColumns(rows, priorityList, maxCols) {
  if (!rows || rows.length === 0) return []
  const available = new Set(Object.keys(rows[0]))
  const cols = []
  for (const c of priorityList) {
    if (available.has(c.key) && !cols.find((x) => x.key === c.key)) {
      cols.push(c)
      if (cols.length >= maxCols) break
    }
  }
  if (cols.length < maxCols) {
    for (const key of available) {
      if (!cols.find((c) => c.key === key)) {
        cols.push({ key, label: key.replace(/_/g, ' ') })
        if (cols.length >= maxCols) break
      }
    }
  }
  return cols
}

// ─── Transmittals browser ─────────────────────────────────────────────────────

const TransmittalsSection = ({ configured, onGoToConfig }) => {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loadingTrans, setLoadingTrans] = useState(false)
  const [transError, setTransError] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [derivedCols, setDerivedCols] = useState([])

  // Expand / collapse: keyed by the ORDER_NO of the expanded row (null = none)
  const [expandedOrderNo, setExpandedOrderNo] = useState(null)
  // Per-transmittal document cache: { [orderNo]: { loading, error, documents, cols } }
  const [docCache, setDocCache] = useState({})

  const fetchDocs = useCallback(async (orderNo, row = {}) => {
    if (!orderNo) return
    // Soft-coded: candidate field names for the transmittal ID — backend tries all of them
    const transId = row['TRANS_ID'] || row['TRANS_REF_NO'] || row['TRANSMITTAL_ID'] || ''
    setDocCache((prev) => ({ ...prev, [orderNo]: { loading: true, error: null, documents: null, cols: [] } }))
    try {
      const res = await wrenchService.getTransmittalDocuments(orderNo, transId)
      const docs = res.data?.documents ?? []
      const cols = deriveColumns(docs, TRANS_DOC_COL_PRIORITY, TRANS_DOC_MAX_COLS)
      setDocCache((prev) => ({ ...prev, [orderNo]: { loading: false, error: null, documents: docs, cols } }))
    } catch (err) {
      setDocCache((prev) => ({
        ...prev,
        [orderNo]: { loading: false, error: err.response?.data?.detail || 'Failed to load documents.', documents: [], cols: [] },
      }))
    }
  }, [])

  const handleRowClick = useCallback((orderNo, row) => {
    if (!orderNo) return
    setExpandedOrderNo((prev) => {
      const next = prev === orderNo ? null : orderNo
      // Fetch only if not yet cached, passing the full row so TRANS_ID can be extracted
      if (next && !docCache[next]) fetchDocs(next, row)
      return next
    })
  }, [docCache, fetchDocs])

  const load = useCallback(async (targetPage = 1) => {
    setLoadingTrans(true)
    setTransError(null)
    try {
      const res = await wrenchService.listTransmittals(targetPage, TRANSMITTAL_PAGE_SIZE)
      setData(res.data)
      setPage(targetPage)
      if (res.data?.transmittals?.length > 0) {
        setDerivedCols(deriveColumns(res.data.transmittals, TRANSMITTAL_COL_PRIORITY, MAX_TABLE_COLS))
      }
    } catch (err) {
      setTransError(err.response?.data?.detail || 'Failed to load transmittals from Wrench.')
    } finally {
      setLoadingTrans(false)
    }
  }, [])

  useEffect(() => { if (configured) load(1) }, [configured, load])

  const filtered = useMemo(() => {
    if (!data?.transmittals) return []
    if (!filterText.trim()) return data.transmittals
    const q = filterText.toLowerCase()
    return data.transmittals.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [data, filterText])

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Cog6ToothIcon className="w-12 h-12 text-gray-300" />
        <p className="text-sm text-gray-500">Configure Wrench first to browse transmittals.</p>
        <button
          onClick={onGoToConfig}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
        >
          <Cog6ToothIcon className="w-4 h-4" /> Go to Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter loaded results…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <button
          type="button"
          onClick={() => load(1)}
          disabled={loadingTrans}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loadingTrans ? 'animate-spin' : ''}`} />
          {loadingTrans ? 'Loading…' : 'Reload'}
        </button>
      </div>

      {transError && <Alert type="error" message={transError} />}

      {/* Spinner on first load */}
      {loadingTrans && !data && (
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loadingTrans && data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4 text-gray-400" />
              {filterText.trim()
                ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} (page ${page} of ${data.total})`
                : `Showing ${data.transmittals?.length ?? 0} of ${data.total?.toLocaleString()} total`}
            </span>
            {data.total > TRANSMITTAL_PAGE_SIZE && (
              <span className="text-xs text-gray-400">Page {page}</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              {filterText.trim()
                ? 'No transmittals match your filter.'
                : 'No transmittals returned from Wrench.'}
            </div>
          ) : derivedCols.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Data received but field structure is unexpected. Check sync logs for details.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* Expand toggle column header */}
                    <th className="px-3 py-2.5 w-8" />
                    {derivedCols.map((col) => (
                      <th key={col.key} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row, idx) => {
                    const orderNo = row[TRANS_DOC_LINK_FIELD]
                    const isExpanded = expandedOrderNo === orderNo
                    const cache = docCache[orderNo] || {}
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`transition cursor-pointer ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          onClick={() => handleRowClick(orderNo, row)}
                        >
                          {/* Chevron toggle */}
                          <td className="px-3 py-2.5 text-gray-400">
                            <ChevronDownIcon
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                            />
                          </td>
                          {derivedCols.map((col) => (
                            <td
                              key={col.key}
                              className="px-4 py-2.5 text-gray-700 max-w-[220px] truncate"
                              title={String(row[col.key] ?? '')}
                            >
                              {row[col.key] != null && row[col.key] !== ''
                                ? String(row[col.key])
                                : <span className="text-gray-300">&mdash;</span>}
                            </td>
                          ))}
                        </tr>

                        {/* ── Expanded document sub-table ─────────────────── */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={derivedCols.length + 1} className="px-0 py-0 bg-blue-50">
                              <div className="mx-6 my-3 border border-blue-200 rounded-lg overflow-hidden">
                                {/* Sub-table header */}
                                <div className="px-4 py-2 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
                                  <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                                    <DocumentTextIcon className="w-3.5 h-3.5" />
                                    Documents for {orderNo}
                                    {cache.documents != null && (
                                      <span className="ml-1 font-normal text-blue-600">
                                        ({cache.documents.length} doc{cache.documents.length !== 1 ? 's' : ''})
                                      </span>
                                    )}
                                  </span>
                                  {cache.loading && (
                                    <ArrowPathIcon className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                                  )}
                                </div>

                                {/* Loading */}
                                {cache.loading && (
                                  <div className="px-4 py-4 text-xs text-gray-400">Loading documents…</div>
                                )}

                                {/* Error */}
                                {cache.error && !cache.loading && (
                                  <div className="px-4 py-3 text-xs text-red-600">{cache.error}</div>
                                )}

                                {/* Empty */}
                                {!cache.loading && !cache.error && cache.documents?.length === 0 && (
                                  <div className="px-4 py-3 text-xs text-gray-400">
                                    No documents found for this transmittal via ORDER_NO filter.
                                  </div>
                                )}

                                {/* Document rows */}
                                {!cache.loading && cache.documents?.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead className="bg-blue-50 border-b border-blue-200">
                                        <tr>
                                          {cache.cols.map((c) => (
                                            <th key={c.key} className="px-3 py-2 text-left font-semibold text-blue-700 whitespace-nowrap">
                                              {c.label}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-blue-100 bg-white">
                                        {cache.documents.map((doc, di) => (
                                          <tr key={di} className="hover:bg-blue-50 transition">
                                            {cache.cols.map((c) => (
                                              <td
                                                key={c.key}
                                                className="px-3 py-2 text-gray-700 max-w-[200px] truncate"
                                                title={String(doc[c.key] ?? '')}
                                              >
                                                {doc[c.key] != null && doc[c.key] !== ''
                                                  ? <span className={c.key === 'DOC_NO' || c.key === 'DOCUMENT_NO' ? 'font-mono font-semibold text-blue-700' : ''}>{String(doc[c.key])}</span>
                                                  : <span className="text-gray-300">&mdash;</span>}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.total > TRANSMITTAL_PAGE_SIZE && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => load(page - 1)}
                disabled={page === 1 || loadingTrans}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-500">Page {page}</span>
              <button
                type="button"
                onClick={() => load(page + 1)}
                disabled={(data.transmittals?.length ?? 0) < TRANSMITTAL_PAGE_SIZE || loadingTrans}
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

// ─── Document Search section ──────────────────────────────────────────────────

// Soft-coded: page size options offered in the rows-per-page selector
const DOC_PAGE_SIZE_OPTIONS = [25, 50, 100, 200]

// Soft-coded fallback discipline list — used when DocumentSearch API is unreachable.
// These cover the standard O&G engineering disciplines. Edit here to add project-specific ones.
const _FALLBACK_DISCIPLINES = [
  'ARCH', 'CIVIL', 'COMM', 'CONTROL', 'ELEC', 'FIRE',
  'HVAC', 'INST', 'MECH', 'PIPING', 'PROCESS', 'SAFETY',
  'STRUCTURAL', 'TELECOM', 'GENERAL',
]

// Convert a native date-input value ('YYYY-MM-DD') to Wrench format ('YYYY/MM/DD HH:MM')
const _toWrenchDate = (isoDate, endOfDay = false) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '/') + (endOfDay ? ' 23:59' : ' 00:00')
}

const DocumentSearchSection = ({ config, onGoToConfig }) => {
  const hasSvcUrl = Boolean(config?.svc_url)

  // Choices loaded once on mount from the backend sample endpoint
  const [choices, setChoices] = useState({ disciplines: [], doc_numbers: [], svc_url_required: false })
  const [choicesLoading, setChoicesLoading] = useState(false)

  // Filter state — discipline/doc_no hold the display value; dates are ISO 'YYYY-MM-DD'
  const [discipline, setDiscipline]   = useState('')
  const [docNoInput, setDocNoInput]   = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [pageSize, setPageSize]       = useState(50)

  const [page, setPage]         = useState(1)
  const [results, setResults]   = useState(null)
  const [searching, setSearching] = useState(false)
  const [alert, setAlert]       = useState(null)

  // Derived: doc numbers shown in datalist — filtered by what user has typed
  const filteredDocNumbers = docNoInput.length >= 1
    ? choices.doc_numbers.filter((d) => d.toLowerCase().includes(docNoInput.toLowerCase())).slice(0, 100)
    : choices.doc_numbers.slice(0, 100)

  // Effective disciplines: real Wrench data when available, fallback list otherwise
  const effectiveDisciplines = choices.disciplines.length > 0
    ? choices.disciplines
    : _FALLBACK_DISCIPLINES

  // needsSvcUrl is only true when the backend explicitly reports both REST and DocumentSearch failed
  const needsSvcUrl = Boolean(choices.svc_url_required)

  // ── Load choices on mount ────────────────────────────────────────────────
  useEffect(() => {
    setChoicesLoading(true)
    wrenchService.getDocumentChoices()
      .then((res) => setChoices(res.data || { disciplines: [], doc_numbers: [], svc_url_required: false }))
      .catch(() => {/* silent — form still works with fallback list */})
      .finally(() => setChoicesLoading(false))
  }, [])

  // ── Search handler ───────────────────────────────────────────────────────
  const handleSearch = async (targetPage = 1) => {
    setSearching(true)
    setAlert(null)
    try {
      const res = await wrenchService.searchDocuments({
        discipline: discipline || undefined,
        doc_no:     docNoInput || undefined,
        date_from:  _toWrenchDate(dateFrom, false) || undefined,
        date_to:    _toWrenchDate(dateTo,   true)  || undefined,
        page:       targetPage,
        page_size:  pageSize,
      })
      setResults(res.data)
      setPage(targetPage)
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Document search failed. Check server logs.',
      })
    } finally {
      setSearching(false)
    }
  }

  const handleClear = () => {
    setDiscipline('')
    setDocNoInput('')
    setDateFrom('')
    setDateTo('')
    setResults(null)
    setAlert(null)
    setPage(1)
  }

  const totalPages = results ? Math.ceil(results.total / pageSize) : 0

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white'
  const selectClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white appearance-none'

  return (
    <div className="space-y-5">
      {/* Both REST and DocumentSearch failed — show a soft info note */}
      {needsSvcUrl && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <InformationCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800">Could not reach the Wrench document API</p>
            <p className="mt-1 text-blue-700">
              Using the standard O&G discipline list. You can still type any Document Number manually.
              If your Wrench instance uses a dedicated DocumentSearch server, add its URL in Configuration.
            </p>
          </div>
        </div>
      )}

      {/* Filter card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Document Search</h3>
                <p className="text-xs text-gray-500">
                  {choicesLoading
                    ? 'Connecting to Wrench…'
                    : choices.disciplines.length > 0
                      ? `${choices.disciplines.length} disciplines · ${choices.doc_numbers.length} docs loaded from Wrench`
                      : 'Query the Wrench document repository'}
                </p>
              </div>
            </div>
            {choicesLoading && (
              <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {alert && <Alert type={alert.type} message={alert.message} />}

          <div className="grid grid-cols-2 gap-4">

            {/* ── Discipline dropdown ──────────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Discipline
                <span className="ml-1 text-gray-400 font-normal">
                  {choices.disciplines.length > 0
                    ? `(${choices.disciplines.length} from Wrench)`
                    : `(${_FALLBACK_DISCIPLINES.length} standard)`}
                </span>
              </label>
              <div className="relative">
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— All Disciplines —</option>
                  {effectiveDisciplines.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {/* Allow free-typed value even if not in list */}
                  {discipline && !effectiveDisciplines.includes(discipline) && (
                    <option value={discipline}>{discipline} (custom)</option>
                  )}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* ── Document No. combobox (datalist) ────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document No.
                {choices.doc_numbers.length > 0 && (
                  <span className="ml-1 text-gray-400 font-normal">({choices.doc_numbers.length} available)</span>
                )}
              </label>
              <input
                list="wrench-doc-numbers"
                type="text"
                value={docNoInput}
                onChange={(e) => setDocNoInput(e.target.value)}
                placeholder={
                  choices.doc_numbers.length > 0
                    ? 'Type or select a Doc No.'
                    : needsSvcUrl
                      ? 'Type a Doc No. (live list available after SVC URL is set)'
                      : 'e.g. P16093-30-76-08'
                }
                className={inputClass}
              />
              <datalist id="wrench-doc-numbers">
                {filteredDocNumbers.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* ── Approved From (date picker) ──────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approved From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass}
              />
              {dateFrom && (
                <p className="mt-0.5 text-xs text-gray-400 font-mono">→ {_toWrenchDate(dateFrom, false)}</p>
              )}
            </div>

            {/* ── Approved To (date picker) ─────────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approved To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
              {dateTo && (
                <p className="mt-0.5 text-xs text-gray-400 font-mono">→ {_toWrenchDate(dateTo, true)}</p>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {DOC_PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              {(discipline || docNoInput || dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700 underline transition"
                >
                  Clear filters
                </button>
              )}
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
            {totalPages > 1 && <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>}
          </div>

          {results.documents.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No documents match the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{DOC_COLUMNS.map((col) => (
                    <th key={col.key} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{col.label}</th>
                  ))}</tr>
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

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <button type="button" onClick={() => handleSearch(page - 1)} disabled={page === 1 || searching}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">← Previous</button>
              <button type="button" onClick={() => handleSearch(page + 1)} disabled={page >= totalPages || searching}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Combined Documents Panel (inner tabs) ────────────────────────────────────

const DOC_INNER_TABS = [
  { id: 'transmittals', label: 'Transmittals', icon: ArrowsRightLeftIcon },
  { id: 'doc_search',   label: 'Document Search', icon: MagnifyingGlassIcon },
]

const DocumentSearchPanel = ({ config, configured, onGoToConfig }) => {
  const [innerTab, setInnerTab] = useState('transmittals')

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Cog6ToothIcon className="w-9 h-9 text-amber-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Wrench Not Configured</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Set up your Wrench SmartProject credentials in the Configuration tab to start browsing documents.
          </p>
        </div>
        <button onClick={onGoToConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          <Cog6ToothIcon className="w-4 h-4" /> Go to Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Inner tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {DOC_INNER_TABS.map((t) => (
          <button key={t.id} onClick={() => setInnerTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              innerTab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {innerTab === 'transmittals' && (
        <TransmittalsSection configured={configured} onGoToConfig={onGoToConfig} />
      )}
      {innerTab === 'doc_search' && (
        <DocumentSearchSection config={config} onGoToConfig={onGoToConfig} />
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

// ─── S3 Export Panel ─────────────────────────────────────────────────────────

const S3_MODES = [
  {
    value: 'batch',
    label: 'Batch Export',
    icon: '📦',
    description: 'Full one-off export of all Wrench data to S3. Processes all pages then completes.',
  },
  {
    value: 'realtime',
    label: 'Real-time',
    icon: '🔄',
    description: 'Continuous polling — exports new pages to S3 every 30 s until you stop it.',
  },
]

const S3_ENTITY_TYPES = [
  { value: 'transmittals', label: 'Transmittals' },
  { value: 'documents',    label: 'Documents' },
  { value: 'all',          label: 'All Entities' },
]

const S3_STATUS_STYLES = {
  pending:     'bg-yellow-100 text-yellow-800 border border-yellow-200',
  in_progress: 'bg-blue-100  text-blue-800  border border-blue-200',
  success:     'bg-green-100 text-green-800 border border-green-200',
  failed:      'bg-red-100   text-red-800   border border-red-200',
  stopped:     'bg-gray-100  text-gray-700  border border-gray-200',
}

const DEFAULT_S3_PREFIX    = 'wrench/'
const S3_BUCKET_DISPLAY    = 'wrench-radai'  // cosmetic label only
const S3_POLL_INTERVAL_MS  = 5000            // auto-refresh when a job is in_progress

const S3SyncPanel = ({ configured, onGoToConfig }) => {
  const [jobs, setJobs]                   = useState([])
  const [loadingJobs, setLoadingJobs]     = useState(false)
  const [starting, setStarting]           = useState(false)
  const [alert, setAlert]                 = useState(null)
  const [mode, setMode]                   = useState('batch')
  const [entityType, setEntityType]       = useState('transmittals')
  const [s3Prefix, setS3Prefix]           = useState(DEFAULT_S3_PREFIX)
  const [showAdvanced, setShowAdvanced]   = useState(false)

  const loadJobs = useCallback(async () => {
    try {
      const res = await wrenchService.getS3Jobs()
      setJobs(res.data || [])
    } catch {
      // silent — don't overwrite user-facing alerts during background polls
    }
  }, [])

  useEffect(() => {
    if (!configured) return
    setLoadingJobs(true)
    loadJobs().finally(() => setLoadingJobs(false))
  }, [configured, loadJobs])

  // Auto-refresh while any job is pending / in_progress
  useEffect(() => {
    if (!configured) return
    const hasActive = jobs.some((j) => j.status === 'in_progress' || j.status === 'pending')
    if (!hasActive) return
    const timer = setInterval(loadJobs, S3_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [jobs, configured, loadJobs])

  const handleStart = async () => {
    setStarting(true)
    setAlert(null)
    try {
      await wrenchService.startS3Sync({ mode, entity_type: entityType, s3_prefix: s3Prefix })
      setAlert({ type: 'success', message: `${mode === 'batch' ? 'Batch' : 'Real-time'} export job started successfully.` })
      await loadJobs()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to start the export job.' })
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async (jobId) => {
    setAlert(null)
    try {
      await wrenchService.stopS3Job(jobId)
      setAlert({ type: 'info', message: `Job #${jobId} stop signal sent.` })
      await loadJobs()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to stop the job.' })
    }
  }

  const activeRealtimeJob = jobs.find(
    (j) => j.mode === 'realtime' && (j.status === 'in_progress' || j.status === 'pending'),
  )

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Cog6ToothIcon className="w-9 h-9 text-amber-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Wrench Not Configured</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Configure and verify your Wrench credentials before exporting data to S3.
          </p>
        </div>
        <button
          onClick={onGoToConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Cog6ToothIcon className="w-4 h-4" /> Go to Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Control card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <CloudArrowUpIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Export to AWS S3</h3>
                <p className="text-xs text-gray-500">Wrench → RADAI → S3 pipeline</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-orange-50 text-orange-700 border border-orange-200">
              s3://{S3_BUCKET_DISPLAY}/
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {alert && <Alert type={alert.type} message={alert.message} />}

          {/* Mode selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {S3_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === m.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entity type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data to Export</label>
            <div className="flex flex-wrap gap-2">
              {S3_ENTITY_TYPES.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEntityType(e.value)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition ${
                    entityType === e.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-400'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced: S3 prefix */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              {showAdvanced
                ? <ChevronUpIcon className="w-3.5 h-3.5" />
                : <ChevronDownIcon className="w-3.5 h-3.5" />}
              Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  S3 Key Prefix
                  <span className="ml-1 font-normal text-gray-400">(e.g. wrench/ or project-x/wrench/)</span>
                </label>
                <input
                  type="text"
                  value={s3Prefix}
                  onChange={(e) => setS3Prefix(e.target.value)}
                  placeholder="wrench/"
                  className="w-full max-w-xs px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-400">
                  S3 path:{' '}
                  <span className="font-mono">
                    s3://{S3_BUCKET_DISPLAY}/{s3Prefix || DEFAULT_S3_PREFIX}{entityType}/year=…/
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Conflict warning */}
          {mode === 'realtime' && activeRealtimeJob && (
            <Alert
              type="warning"
              message={`A real-time job (ID #${activeRealtimeJob.id}) is already running. Stop it before starting a new one.`}
            />
          )}

          {/* Start button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || (mode === 'realtime' && Boolean(activeRealtimeJob))}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            {starting
              ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
              : <CloudArrowUpIcon className="w-4 h-4" />}
            {starting ? 'Starting…' : `Start ${mode === 'batch' ? 'Batch Export' : 'Real-time Export'}`}
          </button>
        </div>
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            Export Jobs
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{jobs.length} recent jobs</span>
            <button
              type="button"
              onClick={loadJobs}
              disabled={loadingJobs}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            No export jobs yet. Configure the mode above and click Start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['ID', 'Mode', 'Entity', 'Status', 'Exported', 'Pages', 'Started', 'Duration', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 text-gray-500 font-mono">#{job.id}</td>
                    <td className="px-4 py-2.5">
                      <span className="capitalize font-medium text-gray-700">
                        {job.mode === 'realtime' ? '🔄 Real-time' : '📦 Batch'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 capitalize">{job.entity_type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${S3_STATUS_STYLES[job.status] || ''}`}>
                        {job.status === 'in_progress' && <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />}
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono">
                      {job.records_exported != null ? job.records_exported.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono">{job.pages_processed ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {job.started_at ? new Date(job.started_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {job.duration_seconds != null ? `${Number(job.duration_seconds).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {(job.status === 'in_progress' || job.status === 'pending') && job.mode === 'realtime' && (
                        <button
                          type="button"
                          onClick={() => handleStop(job.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                        >
                          <StopCircleIcon className="w-3.5 h-3.5" />
                          Stop
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: InformationCircleIcon },
  { id: 'config',     label: 'Configuration',  icon: WrenchScrewdriverIcon },
  { id: 'sync',       label: 'Sync',           icon: ArrowsRightLeftIcon },
  { id: 's3_export',  label: 'S3 Export',      icon: CloudArrowUpIcon },
  { id: 'documents',  label: 'Documents',      icon: DocumentTextIcon },
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
              <SyncPanel logs={syncLogs} onTrigger={handleSyncTrigger} onGoToS3Tab={() => setActiveTab('s3_export')} />
            ) : (
              <Alert
                type="warning"
                message="Please configure and verify the Wrench connection in the Configuration tab before running a sync."
              />
            )
          )}

          {activeTab === 's3_export' && (
            <S3SyncPanel configured={configured} onGoToConfig={() => setActiveTab('config')} />
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
