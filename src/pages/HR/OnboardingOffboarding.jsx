/**
 * Onboarding & Offboarding Management
 * Employee lifecycle management — joining, exit, equipment, documents, access provisioning
 * 
 * ✅ MIGRATED: Now uses EmployeeMaster backend (employee_master_id, auto-generated employee_number)
 */
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'
import apiClient from '../../services/api.service'

// ── Soft-coded API endpoints ──────────────────────────────────────────────
// Note: apiClient baseURL already includes /api/v1, so paths are relative to that
const API_ENDPOINTS = {
  onboarding: '/onboarding',
  employees: '/users/employees',
  documents: '/onboarding/documents',
}

const API_BASE = API_ENDPOINTS.onboarding

// ── Soft-coded quick-edit fields for list view ────────────────────────────
const QUICK_EDIT_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'text', source: 'employee_master' },
  { key: 'last_name', label: 'Last Name', type: 'text', source: 'employee_master' },
  { key: 'email', label: 'Email', type: 'email', source: 'employee_master' },
  { key: 'job_title_uae', label: 'Job Title (UAE)', type: 'text', source: 'employee_master' },
  { key: 'division', label: 'Division', type: 'text', source: 'employee_master' },
  { key: 'department', label: 'Department', type: 'text', source: 'employee_master' },
]

// ── Soft-coded status badges ──────────────────────────────────────────────
const ONBOARDING_STATUS_CONFIG = {
  initiated: { label: 'Initiated', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  documentation: { label: 'Documentation', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  equipment: { label: 'Equipment', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  access_provisioning: { label: 'Access Setup', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  training: { label: 'Training', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const OFFBOARDING_STATUS_CONFIG = {
  initiated: { label: 'Initiated', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  access_revocation: { label: 'Access Revoked', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  equipment_return: { label: 'Equipment Return', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  exit_interview: { label: 'Exit Interview', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  final_settlement: { label: 'Final Settlement', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const EXIT_REASON_CONFIG = {
  resignation: { label: 'Resignation', icon: HeroIcons.UserMinusIcon },
  termination: { label: 'Termination', icon: HeroIcons.ExclamationTriangleIcon },
  contract_end: { label: 'Contract End', icon: HeroIcons.DocumentTextIcon },
  retirement: { label: 'Retirement', icon: HeroIcons.SparklesIcon },
  relocation: { label: 'Relocation', icon: HeroIcons.GlobeAltIcon },
  health: { label: 'Health', icon: HeroIcons.HeartIcon },
  performance: { label: 'Performance', icon: HeroIcons.ChartBarIcon },
  redundancy: { label: 'Redundancy', icon: HeroIcons.MinusCircleIcon },
  other: { label: 'Other', icon: HeroIcons.QuestionMarkCircleIcon },
}

const BRANCH_CONFIG = {
  RAD: { label: 'Rejlers Abu Dhabi', color: 'text-blue-600' },
  RIN: { label: 'Rejlers India', color: 'text-emerald-600' },
}

// ── Spinner Component ──────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

// ── Main Component ─────────────────────────────────────────────────────────
export default function OnboardingOffboarding() {
  const user = useSelector((state) => state.auth.user)
  const [activeTab, setActiveTab] = useState('overview')

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: HeroIcons.ChartBarIcon },
    { id: 'onboarding', label: 'Onboarding List', icon: HeroIcons.UserPlusIcon },
    { id: 'offboarding', label: 'Offboarding List', icon: HeroIcons.UserMinusIcon },
    { id: 'create', label: 'Create New Employee', icon: HeroIcons.PlusCircleIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HeroIcons.UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Onboarding | Offboarding</h1>
            <p className="text-sm text-slate-500">Employee lifecycle management — joining, exit, equipment, documents, access</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-all duration-200 whitespace-nowrap min-w-fit ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/30 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'onboarding' && <OnboardingListTab />}
        {activeTab === 'offboarding' && <OffboardingListTab />}
        {activeTab === 'create' && <CreateEmployeeTab />}
      </div>
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab() {
  const [onboardingStats, setOnboardingStats] = useState(null)
  const [offboardingStats, setOffboardingStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = () => {
    setLoading(true)
    Promise.all([
      apiClient.get(`${API_BASE}/onboarding/statistics/`),
      apiClient.get(`${API_BASE}/offboarding/statistics/`),
    ])
      .then(([onRes, offRes]) => {
        setOnboardingStats(onRes.data)
        setOffboardingStats(offRes.data)
      })
      .catch((err) => console.error('Failed to load statistics:', err))
      .finally(() => setLoading(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
        <span className="ml-2 text-slate-500">Loading statistics...</span>
      </div>
    )
  }

  const totalActive = (onboardingStats?.total ?? 0) + (offboardingStats?.total ?? 0)
  const totalUrgent = (onboardingStats?.overdue ?? 0) + (offboardingStats?.overdue ?? 0)

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium opacity-90 mb-1">Total Active Processes</div>
            <div className="text-4xl font-bold">{totalActive}</div>
            <div className="text-xs opacity-75 mt-1">
              {onboardingStats?.total ?? 0} onboarding • {offboardingStats?.total ?? 0} offboarding
            </div>
          </div>
          <div>
            <div className="text-sm font-medium opacity-90 mb-1">Upcoming Actions</div>
            <div className="text-4xl font-bold">
              {(onboardingStats?.upcoming_joiners ?? 0) + (offboardingStats?.upcoming_exits ?? 0)}
            </div>
            <div className="text-xs opacity-75 mt-1">Next 30 days</div>
          </div>
          <div>
            <div className="text-sm font-medium opacity-90 mb-1 flex items-center gap-2">
              {totalUrgent > 0 && <HeroIcons.ExclamationTriangleIcon className="w-4 h-4 animate-pulse" />}
              Urgent Attention
            </div>
            <div className="text-4xl font-bold">{totalUrgent}</div>
            <div className="text-xs opacity-75 mt-1">
              {totalUrgent > 0 ? 'Overdue items requiring action' : 'All on track'}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <HeroIcons.UserPlusIcon className="w-6 h-6 text-white" />
            </div>
            Onboarding Pipeline
          </h2>
          <button
            onClick={() => window.location.hash = '#onboarding'}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
          >
            View All
            <HeroIcons.ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <EnhancedKPICard
            label="Total Active"
            value={onboardingStats?.total ?? 0}
            icon={HeroIcons.UsersIcon}
            color="blue"
            bgColor="bg-blue-50"
            textColor="text-blue-700"
            iconBg="bg-blue-100"
          />
          <EnhancedKPICard
            label="Joining Soon"
            value={onboardingStats?.upcoming_joiners ?? 0}
            icon={HeroIcons.CalendarDaysIcon}
            color="violet"
            bgColor="bg-violet-50"
            textColor="text-violet-700"
            iconBg="bg-violet-100"
            subtitle="Next 30 days"
          />
          <EnhancedKPICard
            label="Overdue"
            value={onboardingStats?.overdue ?? 0}
            icon={HeroIcons.ExclamationCircleIcon}
            color="rose"
            bgColor="bg-rose-50"
            textColor="text-rose-700"
            iconBg="bg-rose-100"
            urgent={onboardingStats?.overdue > 0}
          />
          <EnhancedKPICard
            label="Completed"
            value={onboardingStats?.completed_this_month ?? 0}
            icon={HeroIcons.CheckCircleIcon}
            color="emerald"
            bgColor="bg-emerald-50"
            textColor="text-emerald-700"
            iconBg="bg-emerald-100"
            subtitle="This month"
          />
        </div>

        {/* Status Pipeline */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Status Pipeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {Object.entries(onboardingStats?.by_status ?? {}).map(([status, count]) => {
              const cfg = ONBOARDING_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
              return (
                <div key={status} className={`rounded-lg border px-3 py-3 text-center hover:shadow-md transition-all cursor-pointer ${cfg.color}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-[10px] font-semibold opacity-80 mt-1 uppercase tracking-wide">{cfg.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Branch Breakdown */}
        {onboardingStats?.by_branch && Object.keys(onboardingStats.by_branch).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">By Branch</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(onboardingStats.by_branch).map(([branch, count]) => {
                const branchCfg = BRANCH_CONFIG[branch] || { label: branch, color: 'text-slate-600' }
                return (
                  <div key={branch} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xs font-medium ${branchCfg.color}`}>{branchCfg.label}</div>
                        <div className="text-2xl font-bold text-slate-700 mt-1">{count}</div>
                      </div>
                      <HeroIcons.BuildingOfficeIcon className={`w-8 h-8 opacity-20 ${branchCfg.color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Offboarding Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md">
              <HeroIcons.UserMinusIcon className="w-6 h-6 text-white" />
            </div>
            Offboarding Pipeline
          </h2>
          <button
            onClick={() => window.location.hash = '#offboarding'}
            className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
          >
            View All
            <HeroIcons.ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <EnhancedKPICard
            label="Total Active"
            value={offboardingStats?.total ?? 0}
            icon={HeroIcons.UsersIcon}
            color="slate"
            bgColor="bg-slate-50"
            textColor="text-slate-700"
            iconBg="bg-slate-100"
          />
          <EnhancedKPICard
            label="Leaving Soon"
            value={offboardingStats?.upcoming_exits ?? 0}
            icon={HeroIcons.CalendarDaysIcon}
            color="amber"
            bgColor="bg-amber-50"
            textColor="text-amber-700"
            iconBg="bg-amber-100"
            subtitle="Next 30 days"
          />
          <EnhancedKPICard
            label="Overdue"
            value={offboardingStats?.overdue ?? 0}
            icon={HeroIcons.ExclamationCircleIcon}
            color="rose"
            bgColor="bg-rose-50"
            textColor="text-rose-700"
            iconBg="bg-rose-100"
            urgent={offboardingStats?.overdue > 0}
          />
          <EnhancedKPICard
            label="Completed"
            value={offboardingStats?.completed_this_month ?? 0}
            icon={HeroIcons.CheckCircleIcon}
            color="emerald"
            bgColor="bg-emerald-50"
            textColor="text-emerald-700"
            iconBg="bg-emerald-100"
            subtitle="This month"
          />
        </div>

        {/* Status Pipeline */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Status Pipeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {Object.entries(offboardingStats?.by_status ?? {}).map(([status, count]) => {
              const cfg = OFFBOARDING_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
              return (
                <div key={status} className={`rounded-lg border px-3 py-3 text-center hover:shadow-md transition-all cursor-pointer ${cfg.color}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-[10px] font-semibold opacity-80 mt-1 uppercase tracking-wide">{cfg.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Exit Reasons */}
        {offboardingStats?.by_exit_reason && Object.keys(offboardingStats.by_exit_reason).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Exit Reasons Analysis</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
              {Object.entries(offboardingStats.by_exit_reason).map(([reason, count]) => {
                const cfg = EXIT_REASON_CONFIG[reason] || { label: reason, icon: HeroIcons.QuestionMarkCircleIcon }
                const Icon = cfg.icon
                return (
                  <div key={reason} className="bg-white rounded-lg border border-slate-200 px-2 py-3 text-center hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer group">
                    <Icon className="w-6 h-6 mx-auto text-slate-500 mb-2 group-hover:text-rose-600 transition-colors" />
                    <div className="text-xl font-bold text-slate-700">{count}</div>
                    <div className="text-[9px] text-slate-500 mt-1 font-medium">{cfg.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Branch Breakdown */}
        {offboardingStats?.by_branch && Object.keys(offboardingStats.by_branch).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">By Branch</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(offboardingStats.by_branch).map(([branch, count]) => {
                const branchCfg = BRANCH_CONFIG[branch] || { label: branch, color: 'text-slate-600' }
                return (
                  <div key={branch} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xs font-medium ${branchCfg.color}`}>{branchCfg.label}</div>
                        <div className="text-2xl font-bold text-slate-700 mt-1">{count}</div>
                      </div>
                      <HeroIcons.BuildingOfficeIcon className={`w-8 h-8 opacity-20 ${branchCfg.color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onboarding List Tab ────────────────────────────────────────────────────
function OnboardingListTab() {
  const [employees, setEmployees] = useState([])
  const [fieldGroups, setFieldGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [viewMode, setViewMode] = useState('compact') // 'cards' or 'compact'
  const [editingRow, setEditingRow] = useState(null) // userId of row being edited
  const [editFormData, setEditFormData] = useState({}) // Form data for inline editing

  useEffect(() => {
    loadEmployees()
  }, [searchQuery])

  const loadEmployees = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)

    apiClient
      .get(`${API_ENDPOINTS.employees}/active_employees/?${params}`)
      .then((res) => {
        setEmployees(res.data.results || [])
        setFieldGroups(res.data.field_groups || [])
      })
      .catch((err) => console.error('Failed to load employees:', err))
      .finally(() => setLoading(false))
  }

  const handleEdit = (userId, field, currentValue, source) => {
    setEditingField({ userId, field, source })
    setEditValue(currentValue || '')
  }

  const handleSave = () => {
    if (!editingField) return
    
    setSaving(true)
    const { userId, field, source } = editingField

    apiClient
      .patch(`${API_ENDPOINTS.employees}/${userId}/update_profile_field/`, {
        field,
        value: editValue,
        source,
      })
      .then(() => {
        setAlert({ type: 'success', message: 'Field updated successfully' })
        loadEmployees() // Reload to show updated data
        setEditingField(null)
        setTimeout(() => setAlert(null), 3000)
      })
      .catch((err) => {
        setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to update field' })
        setTimeout(() => setAlert(null), 5000)
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  // ── Quick Edit Functions (for list view) ────────────────────────────────────
  const handleQuickEdit = (employee) => {
    setEditingRow(employee.user_id)
    // Initialize edit form with current values
    const formData = {}
    QUICK_EDIT_FIELDS.forEach(field => {
      formData[field.key] = employee[field.key] || ''
    })
    setEditFormData(formData)
  }

  const handleQuickSave = (userId) => {
    setSaving(true)
    
    // Prepare updates for each changed field
    const updates = []
    QUICK_EDIT_FIELDS.forEach(field => {
      const currentValue = employees.find(e => e.user_id === userId)?.[field.key] || ''
      const newValue = editFormData[field.key] || ''
      if (currentValue !== newValue) {
        updates.push(
          apiClient.patch(`${API_ENDPOINTS.employees}/${userId}/update_profile_field/`, {
            field: field.key,
            value: newValue,
            source: field.source,
          })
        )
      }
    })

    if (updates.length === 0) {
      setEditingRow(null)
      setSaving(false)
      return
    }

    Promise.all(updates)
      .then(() => {
        setAlert({ type: 'success', message: `Updated ${updates.length} field(s) successfully` })
        loadEmployees() // Reload to show updated data
        setEditingRow(null)
        setEditFormData({})
        setTimeout(() => setAlert(null), 3000)
      })
      .catch((err) => {
        setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to update fields' })
        setTimeout(() => setAlert(null), 5000)
      })
      .finally(() => setSaving(false))
  }

  const handleQuickCancel = () => {
    setEditingRow(null)
    setEditFormData({})
  }

  const handleFieldChange = (fieldKey, value) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const renderFieldValue = (employee, field) => {
    const value = employee[field.key]
    const isEmpty = !value || value === ''
    const isEditing = editingField?.userId === employee.user_id && editingField?.field === field.key

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            title="Save"
          >
            <HeroIcons.CheckIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
            title="Cancel"
          >
            <HeroIcons.XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }

    if (isEmpty) {
      return (
        <div className="flex items-center gap-2 group">
          <span className="text-slate-400 italic text-xs">Empty</span>
          <button
            onClick={() => handleEdit(employee.user_id, field.key, value, field.source)}
            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="Edit"
          >
            <HeroIcons.PencilIcon className="w-3 h-3" />
          </button>
        </div>
      )
    }

    // Display value based on type
    if (field.type === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className="text-xs text-slate-700">{value}</span>
        <button
          onClick={() => handleEdit(employee.user_id, field.key, value, field.source)}
          className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
          title="Edit"
        >
          <HeroIcons.PencilIcon className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alert */}
      {alert && (
        <div className={`rounded-lg border p-3 flex items-center gap-2 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {alert.type === 'success' ? (
            <HeroIcons.CheckCircleIcon className="w-5 h-5" />
          ) : (
            <HeroIcons.ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Search & View Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <HeroIcons.MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, employee number, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <HeroIcons.Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'compact'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Compact View"
            >
              <HeroIcons.ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg font-medium">
            {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
          </div>
        </div>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <Spinner />
          <span className="ml-2 text-slate-500 mt-2">Loading employees...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-dashed border-slate-300 p-16 text-center">
          <HeroIcons.InboxIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No employees found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <div
              key={employee.user_id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-violet-500 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-base">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    {employee.preferred_given_name && (
                      <p className="text-xs text-blue-100 mt-0.5">
                        "{employee.preferred_given_name}"
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/20 text-xs font-medium backdrop-blur-sm">
                        <HeroIcons.IdentificationIcon className="w-3 h-3 mr-1" />
                        {employee.employee_number || 'No ID'}
                      </span>
                      {employee.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/90 text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <HeroIcons.UserIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Email */}
                <div className="flex items-center gap-2">
                  <HeroIcons.EnvelopeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 truncate">{employee.email}</span>
                </div>

                {/* Manager */}
                {employee.manager_name && (
                  <div className="flex items-center gap-2">
                    <HeroIcons.UserCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600">
                      Reports to: <span className="font-medium text-slate-700">{employee.manager_name}</span>
                    </span>
                  </div>
                )}

                {/* Organization */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Department</p>
                    <p className="text-xs text-slate-700 font-medium truncate">
                      {employee.division || employee.department || <span className="text-slate-400 italic">—</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Title</p>
                    <p className="text-xs text-slate-700 font-medium truncate">
                      {employee.job_title_uae || employee.job_title_finland || <span className="text-slate-400 italic">—</span>}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setExpandedRow(expandedRow === employee.user_id ? null : employee.user_id)}
                  className="w-full mt-3 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border border-slate-200 hover:border-blue-300"
                >
                  {expandedRow === employee.user_id ? (
                    <>
                      <HeroIcons.ChevronUpIcon className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <HeroIcons.ChevronDownIcon className="w-4 h-4" />
                      View Full Details
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedRow === employee.user_id && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-4">
                  <div className="space-y-4">
                    {/* Employee Fields Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {fieldGroups.map((group) => (
                        <div key={group.group} className="bg-white rounded-lg border border-slate-200 p-3">
                          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <HeroIcons.TagIcon className="w-3.5 h-3.5 text-blue-500" />
                            {group.group}
                          </h4>
                          <div className="space-y-2 mt-2">
                            {group.fields.map((field) => (
                              <div key={field.key} className="flex justify-between items-start gap-2 py-1">
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide flex-shrink-0 pt-0.5">
                                  {field.label}:
                                </span>
                                <div className="flex-1 text-right">
                                  {renderFieldValue(employee, field)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Document Upload Section */}
                    <DocumentManagementSection employeeId={employee.user_id} employeeEmail={employee.email} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {employees.map((employee) => (
            <div key={employee.user_id} className="hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4 p-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </div>

                {/* Info Grid */}
                <div className="flex-1 min-w-0">
                  {editingRow === employee.user_id ? (
                    /* Edit Mode */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">First Name</label>
                        <input
                          type="text"
                          value={editFormData.first_name || ''}
                          onChange={(e) => handleFieldChange('first_name', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editFormData.last_name || ''}
                          onChange={(e) => handleFieldChange('last_name', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last Name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Job Title</label>
                        <input
                          type="text"
                          value={editFormData.job_title_uae || ''}
                          onChange={(e) => handleFieldChange('job_title_uae', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Job Title"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Division</label>
                        <input
                          type="text"
                          value={editFormData.division || ''}
                          onChange={(e) => handleFieldChange('division', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Division"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Department</label>
                        <input
                          type="text"
                          value={editFormData.department || ''}
                          onChange={(e) => handleFieldChange('department', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Department"
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-1 items-center">
                      {/* Name & Email */}
                      <div className="md:col-span-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{employee.email}</p>
                      </div>
                      
                      {/* Employee # */}
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Emp #</p>
                        <p className="text-xs text-slate-700 font-medium">{employee.employee_number || '—'}</p>
                      </div>
                      
                      {/* Manager */}
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Manager</p>
                        <p className="text-xs text-slate-700 truncate">{employee.manager_name || '—'}</p>
                      </div>
                      
                      {/* Department */}
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Department</p>
                        <p className="text-xs text-slate-700 truncate">{employee.division || employee.department || '—'}</p>
                      </div>
                      
                      {/* Job Title */}
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Job Title</p>
                        <p className="text-xs text-slate-700 truncate">{employee.job_title_uae || employee.job_title_finland || '—'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingRow === employee.user_id ? (
                    /* Edit Mode Actions */
                    <>
                      <button
                        onClick={() => handleQuickSave(employee.user_id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save Changes"
                      >
                        <HeroIcons.CheckIcon className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleQuickCancel}
                        disabled={saving}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="Cancel"
                      >
                        <HeroIcons.XMarkIcon className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    /* View Mode Actions */
                    <>
                      {employee.is_active && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide hidden lg:inline">Active</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleQuickEdit(employee)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <HeroIcons.PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setExpandedRow(expandedRow === employee.user_id ? null : employee.user_id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={expandedRow === employee.user_id ? "Hide Details" : "Show Details"}
                      >
                        {expandedRow === employee.user_id ? (
                          <HeroIcons.ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <HeroIcons.ChevronDownIcon className="w-5 h-5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRow === employee.user_id && (
                <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/20 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fieldGroups.map((group) => (
                      <div key={group.group} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <HeroIcons.TagIcon className="w-3.5 h-3.5 text-blue-500" />
                          {group.group}
                        </h4>
                        <div className="space-y-1.5 mt-2">
                          {group.fields.map((field) => (
                            <div key={field.key} className="flex justify-between items-start gap-2 py-0.5">
                              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide flex-shrink-0">
                                {field.label}:
                              </span>
                              <div className="text-right flex-1">
                                {renderFieldValue(employee, field)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <DocumentManagementSection employeeId={employee.user_id} employeeEmail={employee.email} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Offboarding List Tab ───────────────────────────────────────────────────
function OffboardingListTab() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', branch: '', exit_reason: '', search: '' })
  const [expandedRow, setExpandedRow] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    loadRecords()
  }, [filters])

  const loadRecords = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.branch) params.append('branch', filters.branch)
    if (filters.exit_reason) params.append('exit_reason', filters.exit_reason)
    if (filters.search) params.append('search', filters.search)

    apiClient
      .get(`${API_BASE}/offboarding/?${params}`)
      .then((res) => {
        // Handle both paginated response (res.data.results) and direct array (res.data)
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setRecords(data)
      })
      .catch((err) => console.error('Failed to load offboarding records:', err))
      .finally(() => setLoading(false))
  }

  const handleEdit = (recordId, field, currentValue) => {
    setEditingField({ recordId, field })
    setEditValue(currentValue || '')
  }

  const handleSave = () => {
    if (!editingField) return
    
    setSaving(true)
    const { recordId, field } = editingField

    apiClient
      .patch(`${API_BASE}/offboarding/${recordId}/`, {
        [field]: editValue,
      })
      .then(() => {
        setAlert({ type: 'success', message: 'Field updated successfully' })
        loadRecords() // Reload to show updated data
        setEditingField(null)
        setTimeout(() => setAlert(null), 3000)
      })
      .catch((err) => {
        setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to update field' })
        setTimeout(() => setAlert(null), 5000)
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  const renderFieldValue = (record, field, label, type = 'text') => {
    const value = record[field]
    const isEmpty = !value || value === ''
    const isEditing = editingField?.recordId === record.id && editingField?.field === field

    // Non-editable fields (system fields)
    const nonEditableFields = ['id', 'user', 'created_by', 'assigned_to', 'created_at', 'updated_at', 'initiated_date', 'actual_completion_date', 'progress_percentage']
    const isEditable = !nonEditableFields.includes(field)

    if (isEditing && isEditable) {
      if (type === 'date') {
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleSave} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Save">
              <HeroIcons.CheckIcon className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} disabled={saving} className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors" title="Cancel">
              <HeroIcons.XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )
      } else if (type === 'textarea') {
        return (
          <div className="flex flex-col gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="3"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors">
                Save
              </button>
              <button onClick={handleCancel} disabled={saving} className="px-3 py-1 text-xs bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleSave} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Save">
              <HeroIcons.CheckIcon className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} disabled={saving} className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors" title="Cancel">
              <HeroIcons.XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )
      }
    }

    if (isEmpty && isEditable) {
      return (
        <div className="flex items-center gap-2 group">
          <span className="text-slate-400 italic text-xs">Empty</span>
          <button
            onClick={() => handleEdit(record.id, field, value)}
            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="Edit"
          >
            <HeroIcons.PencilIcon className="w-3 h-3" />
          </button>
        </div>
      )
    }

    // Display value based on type
    if (type === 'date' && value) {
      return (
        <div className="flex items-center gap-2 group">
          <span className="text-xs text-slate-700">{new Date(value).toLocaleDateString()}</span>
          {isEditable && (
            <button
              onClick={() => handleEdit(record.id, field, value)}
              className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
              title="Edit"
            >
              <HeroIcons.PencilIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className="text-xs text-slate-700">{value || '—'}</span>
        {isEditable && value && (
          <button
            onClick={() => handleEdit(record.id, field, value)}
            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="Edit"
          >
            <HeroIcons.PencilIcon className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alert */}
      {alert && (
        <div className={`rounded-lg border p-3 flex items-center gap-2 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {alert.type === 'success' ? (
            <HeroIcons.CheckCircleIcon className="w-5 h-5" />
          ) : (
            <HeroIcons.ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(OFFBOARDING_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {Object.entries(BRANCH_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filters.exit_reason}
            onChange={(e) => setFilters({ ...filters, exit_reason: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Exit Reasons</option>
            {Object.entries(EXIT_REASON_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-2 text-slate-500">Loading offboarding records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <HeroIcons.InboxIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No offboarding records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Working Day</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Exit Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Progress</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const statusCfg = OFFBOARDING_STATUS_CONFIG[record.status] || OFFBOARDING_STATUS_CONFIG.initiated
                  const branchCfg = BRANCH_CONFIG[record.branch] || BRANCH_CONFIG.RAD
                  const exitCfg = EXIT_REASON_CONFIG[record.exit_reason] || EXIT_REASON_CONFIG.other
                  const daysUntil = record.days_until_exit
                  const isUrgent = daysUntil <= 7 && daysUntil >= 0

                  return (
                    <>
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{record.employee_name}</p>
                            <p className="text-xs text-slate-500">{record.employee_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{record.position}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${branchCfg.color}`}>{branchCfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-slate-700">{new Date(record.last_working_day).toLocaleDateString()}</p>
                            <p className={`text-xs ${isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                              {daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? 'Today' : `${Math.abs(daysUntil)} days ago`}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                            {exitCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full transition-all"
                                style={{ width: `${record.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{record.progress_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 mx-auto"
                          >
                            {expandedRow === record.id ? (
                              <>
                                <HeroIcons.ChevronUpIcon className="w-4 h-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <HeroIcons.ChevronDownIcon className="w-4 h-4" />
                                Show All
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedRow === record.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="8" className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Employee Information */}
                              <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <HeroIcons.UserIcon className="w-4 h-4 text-rose-500" />
                                  Employee Information
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Employee ID</span>
                                    <div className="mt-1">{renderFieldValue(record, 'employee_id', 'Employee ID')}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Department</span>
                                    <div className="mt-1">{renderFieldValue(record, 'department', 'Department')}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Reporting Manager</span>
                                    <div className="mt-1">{renderFieldValue(record, 'reporting_manager', 'Reporting Manager')}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Exit Information */}
                              <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <HeroIcons.ArrowRightOnRectangleIcon className="w-4 h-4 text-rose-500" />
                                  Exit Information
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Notice Period (Days)</span>
                                    <div className="mt-1">{renderFieldValue(record, 'notice_period_days', 'Notice Period')}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Exit Reason Detail</span>
                                    <div className="mt-1">{renderFieldValue(record, 'exit_reason_detail', 'Exit Reason Detail', 'textarea')}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Target Completion</span>
                                    <div className="mt-1">{renderFieldValue(record, 'target_completion_date', 'Target Completion', 'date')}</div>
                                  </div>
                                  {record.actual_completion_date && (
                                    <div>
                                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Actual Completion</span>
                                      <div className="mt-1">
                                        <span className="text-xs text-slate-700">{new Date(record.actual_completion_date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Tracking & Notes */}
                              <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <HeroIcons.DocumentTextIcon className="w-4 h-4 text-rose-500" />
                                  Tracking & Notes
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Equipment Count</span>
                                    <div className="mt-1">
                                      <span className="text-xs text-slate-700">{record.equipment_count || 0}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Documents Count</span>
                                    <div className="mt-1">
                                      <span className="text-xs text-slate-700">{record.documents_count || 0}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Checklist</span>
                                    <div className="mt-1">
                                      <span className="text-xs text-slate-700">
                                        {record.checklist_completed_count || 0} / {record.checklist_count || 0} completed
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Notes</span>
                                    <div className="mt-1">{renderFieldValue(record, 'notes', 'Notes', 'textarea')}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Create Employee Tab ────────────────────────────────────────────────────
function CreateEmployeeTab() {
  const [formData, setFormData] = useState({
    // Contact Information
    first_name: '',
    surname: '',
    preferred_given_name: '',
    manager_id: '',
    country: '',
    
    // Other Information
    mobile_phone: '',
    email: '',
    initials: '',
    employee_number: '',
    employee_code: '',
    account_name: '',
    employment_id: '',
    candidate_id: '',
    
    // Organization Information
    company: '',
    business_unit: '',
    division: '',
    business_area: '',
    office: '',
    job_title_finland: '',
    job_title_uae: '',
    
    // Flags
    protected_identity: false,
    is_test_person: false,
    not_signed: false,
    
    // Testing fields
    implementation_test: '',
    hrm_test: '',
    process_testing: '',
    
    // Onboarding
    joining_date: '',
    branch: 'RAD',
    notes: ''
  })
  
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  // Passport photo upload states
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  // Document upload states
  const [documents, setDocuments] = useState([])
  const [createdEmployeeId, setCreatedEmployeeId] = useState(null)
  
  // Soft-coded document types
  const DOCUMENT_TYPES = [
    { value: 'passport', label: 'Passport Copy' },
    { value: 'visa', label: 'Visa' },
    { value: 'emirates_id', label: 'Emirates ID' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'degree', label: 'Educational Certificates' },
    { value: 'certificate', label: 'Professional Certificate' },
    { value: 'experience', label: 'Experience Letters' },
    { value: 'bank_details', label: 'Bank Account Details' },
    { value: 'medical', label: 'Medical/Insurance Forms' },
    { value: 'vaccination', label: 'Vaccination Certificate' },
    { value: 'other', label: 'Other' },
  ]
  
  useEffect(() => {
    // Load managers list from active employees (EmployeeMaster)
    apiClient.get('/users/employees/active_employees/')
      .then((res) => {
        // Response includes results array with employee data
        const employees = res.data.results || []
        // All active employees can potentially be managers
        setManagers(employees)
      })
      .catch((err) => console.error('Failed to load managers:', err))
  }, [])
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  // Handle passport photo selection with preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG or PNG)')
        return
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setError('Photo size must be less than 5MB')
        return
      }
      
      setPhoto(file)
      
      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }
  
  // Remove selected photo
  const handleRemovePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Use FormData for file upload support
      const submitData = new FormData()
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key])
        }
      })
      
      // Append passport photo if selected
      if (photo) {
        submitData.append('photo', photo)
      }
      
      const response = await apiClient.post(`${API_BASE}/onboarding/create_employee/`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setSuccess(true)
      setError(null)
      
      // Store created employee/onboarding record IDs for document uploads
      // Response includes: user_id, employee_master_id (UUID), onboarding_id, employee_number (auto-generated), email
      const onboardingRecordId = response.data.onboarding_id
      setCreatedEmployeeId(onboardingRecordId)
      
      // Upload documents if any
      if (documents.length > 0 && onboardingRecordId) {
        await uploadDocuments(onboardingRecordId)
      }
      
      // Reset form
      setFormData({
        first_name: '',
        surname: '',
        preferred_given_name: '',
        manager_id: '',
        country: '',
        mobile_phone: '',
        email: '',
        initials: '',
        employee_number: '',
        employee_code: '',
        account_name: '',
        employment_id: '',
        candidate_id: '',
        company: '',
        business_unit: '',
        division: '',
        business_area: '',
        office: '',
        job_title_finland: '',
        job_title_uae: '',
        protected_identity: false,
        is_test_person: false,
        not_signed: false,
        implementation_test: '',
        hrm_test: '',
        process_testing: '',
        joining_date: '',
        branch: 'RAD',
        notes: ''
      })
      setDocuments([])
      setPhoto(null)
      setPhotoPreview(null)
      
      // Show success message with auto-generated employee numbers and manager info
      const successDetails = [
        `✅ Employee Created Successfully!`,
        ``,
        `📧 Email: ${response.data.email}`,
        `🔢 Employee Number: ${response.data.employee_number}`,
        `🆔 Employee Code: ${response.data.employee_code}`,
        `🏢 Branch: ${response.data.branch}`,
        response.data.reporting_manager ? `👤 Reports to: ${response.data.reporting_manager}` : '',
        `📋 Onboarding ID: ${response.data.onboarding_id}`,
        documents.length > 0 ? `📎 ${documents.length} document(s) uploaded` : ''
      ].filter(Boolean).join('\n')
      
      alert(successDetails)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }
  
  const addDocument = () => {
    setDocuments([...documents, {
      id: Date.now(),
      document_type: 'emirates_id',
      document_name: '',
      file: null
    }])
  }
  
  const removeDocument = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }
  
  const updateDocument = (id, field, value) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ))
  }
  
  const uploadDocuments = async (onboardingRecordId) => {
    const uploadPromises = documents.map(async (doc) => {
      if (!doc.file) return
      
      const docFormData = new FormData()
      docFormData.append('file', doc.file)
      docFormData.append('document_type', doc.document_type)
      docFormData.append('document_name', doc.document_name || doc.file.name)
      docFormData.append('onboarding_record', onboardingRecordId)
      
      return apiClient.post(`${API_ENDPOINTS.documents}/`, docFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    })
    
    await Promise.all(uploadPromises)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <HeroIcons.CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">Employee created successfully!</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-rose-700">
            <HeroIcons.ExclamationCircleIcon className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {/* Contact Information */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <HeroIcons.UserIcon className="w-5 h-5 text-blue-600" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
          {/* Left Side - All Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                First Names <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter first names"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Surname <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter surname"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Preferred Given Name
              </label>
              <input
                type="text"
                name="preferred_given_name"
                value={formData.preferred_given_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Optional"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Manager
              </label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">--Select Reporting Manager--</option>
                {managers.map(mgr => (
                  <option key={mgr.user_id} value={mgr.user_id}>
                    {mgr.first_name} {mgr.last_name} - {mgr.designation || 'Employee'} ({mgr.employee_number})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                👤 Select the direct manager this employee will report to
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">--Select Country--</option>
                <option value="UAE">United Arab Emirates</option>
                <option value="Finland">Finland</option>
                <option value="India">India</option>
                <option value="Sweden">Sweden</option>
              </select>
            </div>
          </div>
          
          {/* Right Side - Passport Photo */}
          <div className="flex flex-col items-center justify-center md:pl-6 md:border-l border-blue-200">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handlePhotoChange}
              className="hidden"
              id="passport-photo-upload"
            />
            <label
              htmlFor="passport-photo-upload"
              className="w-44 h-56 bg-white rounded-xl border-2 border-dashed border-blue-300 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group relative"
              title="Click to upload passport photo"
            >
              {photoPreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoPreview}
                    alt="Passport Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemovePhoto()
                    }}
                    className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-700 hover:scale-110"
                    title="Remove photo"
                  >
                    <HeroIcons.XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 group-hover:text-blue-600 transition-all">
                  <div className="w-20 h-20 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-3 transition-all">
                    <HeroIcons.CameraIcon className="w-10 h-10" />
                  </div>
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs text-slate-400 mt-1">Photo</span>
                </div>
              )}
            </label>
            <div className="mt-3 text-center">
              <p className="text-xs font-medium text-slate-600">Passport Size</p>
              <p className="text-xs text-slate-500">3.5 × 4.5 cm</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Other Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HeroIcons.IdentificationIcon className="w-5 h-5 text-violet-600" />
          Other Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail Address (Rejlers) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mobile Phone (Work)
            </label>
            <input
              type="text"
              name="mobile_phone"
              value={formData.mobile_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Initials
            </label>
            <input
              type="text"
              name="initials"
              value={formData.initials}
              onChange={handleChange}
              maxLength={10}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employee Number
              <span className="ml-2 text-xs text-green-600 font-normal">(✓ Auto-generated)</span>
            </label>
            <input
              type="text"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleChange}
              placeholder="Leave empty for auto-generation (e.g., EMP20267890)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              📦 Leave empty - system will generate unique employee number
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employee Code (Finance/Payroll)
              <span className="ml-2 text-xs text-amber-600 font-normal">(⚠️ Recommended)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                placeholder="e.g., EMP-2026-001 or REJAD-001"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  // Generate employee code based on email or name
                  const firstName = formData.first_name.substring(0, 3).toUpperCase()
                  const lastName = formData.surname.substring(0, 3).toUpperCase()
                  const year = new Date().getFullYear()
                  const random = Math.floor(Math.random() * 999) + 1
                  const code = `${firstName}${lastName}-${year}-${String(random).padStart(3, '0')}`
                  setFormData(prev => ({ ...prev, employee_code: code }))
                }}
                disabled={!formData.first_name || !formData.surname}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                title="Generate employee code from name"
              >
                <HeroIcons.SparklesIcon className="w-4 h-4" />
                Generate
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              🎯 Used for payroll, finance systems, and official documents
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employment ID (from HRM)
            </label>
            <input
              type="text"
              name="employment_id"
              value={formData.employment_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Candidate ID
            </label>
            <input
              type="text"
              name="candidate_id"
              value={formData.candidate_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Organization Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HeroIcons.BuildingOfficeIcon className="w-5 h-5 text-emerald-600" />
          Organisation Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business Unit
            </label>
            <input
              type="text"
              name="business_unit"
              value={formData.business_unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Division
            </label>
            <input
              type="text"
              name="division"
              value={formData.division}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business Area
            </label>
            <input
              type="text"
              name="business_area"
              value={formData.business_area}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Office
            </label>
            <input
              type="text"
              name="office"
              value={formData.office}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Title (Finland)
            </label>
            <input
              type="text"
              name="job_title_finland"
              value={formData.job_title_finland}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Title (UAE)
            </label>
            <input
              type="text"
              name="job_title_uae"
              value={formData.job_title_uae}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Onboarding Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HeroIcons.CalendarDaysIcon className="w-5 h-5 text-amber-600" />
          Onboarding Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Joining Date
            </label>
            <input
              type="date"
              name="joining_date"
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Branch
            </label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RAD">Rejlers Abu Dhabi</option>
              <option value="RIN">Rejlers India</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Flags */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Flags & Testing</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="protected_identity"
              checked={formData.protected_identity}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Protected Identity</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_test_person"
              checked={formData.is_test_person}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Test Person</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="not_signed"
              checked={formData.not_signed}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Not Signed</span>
          </label>
        </div>
      </div>
      
      {/* Document Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <HeroIcons.DocumentTextIcon className="w-5 h-5 text-violet-600" />
            Upload Documents (Optional)
          </h3>
          <button
            type="button"
            onClick={addDocument}
            className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <HeroIcons.PlusIcon className="w-4 h-4" />
            Add Document
          </button>
        </div>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <HeroIcons.DocumentIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No documents added yet</p>
            <p className="text-xs text-slate-400 mt-1">You can add documents like Emirates ID, certificates, etc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Document #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Remove"
                  >
                    <HeroIcons.TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
                    <select
                      value={doc.document_type}
                      onChange={(e) => updateDocument(doc.id, 'document_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Document Name</label>
                    <input
                      type="text"
                      value={doc.document_name}
                      onChange={(e) => updateDocument(doc.id, 'document_name', e.target.value)}
                      placeholder="e.g., Emirates ID - John Doe"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      File {!doc.file && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => updateDocument(doc.id, 'file', e.target.files[0])}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                {doc.file && (
                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                    <HeroIcons.CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    <span>{doc.file.name} ({(doc.file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          <HeroIcons.InformationCircleIcon className="w-4 h-4 inline mr-1" />
          Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
        </p>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              <span>Creating Employee...</span>
            </>
          ) : (
            <>
              <HeroIcons.PlusCircleIcon className="w-5 h-5" />
              <span>Create Employee</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ── Document Management Section ────────────────────────────────────────────
function DocumentManagementSection({ employeeId, employeeEmail }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    document_type: 'offer_letter',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    notes: '',
    file: null,
  })
  const [alert, setAlert] = useState(null)

  // ✅ UNIFIED DOCUMENT SYSTEM: Fetch document types from ProfileDocument API (onboarding-filtered)
  // This ensures both Profile and Onboarding pages use the SAME database table (rbac.ProfileDocument)
  const [documentTypes, setDocumentTypes] = useState([])
  
  useEffect(() => {
    loadDocumentTypes()
    loadDocuments()
  }, [employeeId])
  
  const loadDocumentTypes = () => {
    apiClient
      .get('/rbac/profile-documents/document-types/onboarding/')
      .then((res) => {
        setDocumentTypes(res.data || [])
      })
      .catch((err) => console.error('Failed to load document types:', err))
  }

  const loadDocuments = () => {
    setLoading(true)
    // ✅ UNIFIED API: Fetch documents from ProfileDocument table
    // Filter by user_profile (linked via employee_id)
    apiClient
      .get(`/rbac/profile-documents/?user_profile__user=${employeeId}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setDocuments(data)
      })
      .catch((err) => console.error('Failed to load documents:', err))
      .finally(() => setLoading(false))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadData({ ...uploadData, file })
    }
  }

  const handleUpload = async () => {
    if (!uploadData.file) {
      setAlert({ type: 'error', message: 'Please select a file to upload' })
      setTimeout(() => setAlert(null), 3000)
      return
    }

    setUploading(true)

    try {
      // ✅ UNIFIED API: Upload to ProfileDocument table
      // Backend auto-assigns user_profile based on authenticated user
      const formData = new FormData()
      formData.append('document_file', uploadData.file)
      formData.append('document_type', uploadData.document_type)
      
      if (uploadData.document_number) formData.append('document_number', uploadData.document_number)
      if (uploadData.issue_date) formData.append('issue_date', uploadData.issue_date)
      if (uploadData.expiry_date) formData.append('expiry_date', uploadData.expiry_date)
      if (uploadData.issuing_authority) formData.append('issuing_authority', uploadData.issuing_authority)
      if (uploadData.notes) formData.append('notes', uploadData.notes)

      // Upload to ProfileDocument API (same table as user profile documents)
      await apiClient.post('/rbac/profile-documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setAlert({ type: 'success', message: 'Document uploaded successfully!' })
      setTimeout(() => setAlert(null), 3000)
      
      // Reset form and reload documents
      setUploadData({
        document_type: 'offer_letter',
        document_number: '',
        issue_date: '',
        expiry_date: '',
        issuing_authority: '',
        notes: '',
        file: null
      })
      setShowUploadForm(false)
      loadDocuments()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.detail || err.response?.data?.error || 'Failed to upload document' })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (document) => {
    try {
      // ✅ UNIFIED API: ProfileDocument stores files in S3, presigned URL in document_file_url
      if (document.document_file_url) {
        window.open(document.document_file_url, '_blank')
      } else {
        setAlert({ type: 'error', message: 'Document file not available' })
        setTimeout(() => setAlert(null), 3000)
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to download document' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      // ✅ UNIFIED API: Delete from ProfileDocument table
      await apiClient.delete(`/rbac/profile-documents/${documentId}/`)
      setAlert({ type: 'success', message: 'Document deleted successfully' })
      setTimeout(() => setAlert(null), 3000)
      loadDocuments()
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete document' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <HeroIcons.DocumentTextIcon className="w-5 h-5 text-violet-500" />
          Document Management
        </h4>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
        >
          {showUploadForm ? (
            <>
              <HeroIcons.XMarkIcon className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <HeroIcons.PlusIcon className="w-4 h-4" />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`rounded-lg border p-2 mb-3 flex items-center gap-2 text-xs ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {alert.type === 'success' ? (
            <HeroIcons.CheckCircleIcon className="w-4 h-4" />
          ) : (
            <HeroIcons.ExclamationCircleIcon className="w-4 h-4" />
          )}
          <span className="font-medium">{alert.message}</span>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
              <select
                value={uploadData.document_type}
                onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {documentTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.icon} {type.label} {type.required_for_onboarding && '(Required)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {documentTypes.find(t => t.code === uploadData.document_type)?.description}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Document Number (Optional)</label>
              <input
                type="text"
                value={uploadData.document_number}
                onChange={(e) => setUploadData({ ...uploadData, document_number: e.target.value })}
                placeholder="e.g., Passport number, Contract number"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Issue Date (Optional)</label>
                <input
                  type="date"
                  value={uploadData.issue_date}
                  onChange={(e) => setUploadData({ ...uploadData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={uploadData.expiry_date}
                  onChange={(e) => setUploadData({ ...uploadData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issuing Authority (Optional)</label>
              <input
                type="text"
                value={uploadData.issuing_authority}
                onChange={(e) => setUploadData({ ...uploadData, issuing_authority: e.target.value })}
                placeholder="e.g., UAE Government, Ministry of Labor"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">File</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Accepted formats: {documentTypes.find(t => t.code === uploadData.document_type)?.allowed_formats?.join(', ').toUpperCase()} (Max {documentTypes.find(t => t.code === uploadData.document_type)?.max_file_size_mb}MB)
              </p>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Spinner />
                  Uploading...
                </>
              ) : (
                <>
                  <HeroIcons.CloudArrowUpIcon className="w-5 h-5" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <HeroIcons.DocumentIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const docType = documentTypes.find(t => t.code === doc.document_type) || { label: doc.document_type, icon: '📄', bg_color: 'bg-slate-100' }
            
            // Verification status badges
            const statusBadges = {
              pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-300' },
              verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
              rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700 border-rose-300' },
              expired: { label: 'Expired', className: 'bg-slate-100 text-slate-700 border-slate-300' },
            }
            const statusBadge = statusBadges[doc.verification_status] || statusBadges.pending
            
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${docType.bg_color} flex items-center justify-center`}>
                    <span className="text-xl">{docType.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      {docType.label}
                      {doc.document_number && (
                        <span className="text-xs text-slate-500 font-normal">({doc.document_number})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      {doc.document_file_name && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{doc.document_file_name}</span>
                        </>
                      )}
                      {doc.expiry_date && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className={`text-xs ${doc.is_expired ? 'text-rose-600 font-medium' : doc.expires_soon ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.document_file_url && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <HeroIcons.TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── KPI Card Component ─────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium opacity-70">{label}</div>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

// Enhanced KPI Card with more visual appeal and optional features
function EnhancedKPICard({ label, value, icon: Icon, bgColor, textColor, iconBg, subtitle, urgent = false }) {
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${bgColor} hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className={`text-xs font-semibold ${textColor} opacity-80 uppercase tracking-wide`}>{label}</div>
          {subtitle && (
            <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${urgent ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${textColor} ${urgent ? 'text-4xl' : ''}`}>
        {value}
      </div>
      {urgent && value > 0 && (
        <div className="mt-2 text-[10px] font-medium text-rose-600 flex items-center gap-1">
          <HeroIcons.ExclamationTriangleIcon className="w-3 h-3" />
          Requires attention
        </div>
      )}
    </div>
  )
}
