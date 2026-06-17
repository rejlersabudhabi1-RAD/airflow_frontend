/**
 * Payroll Intelligence Platform — Main Shell
 * Route: /hr/payroll
 *
 * Tab container for all 6 payroll modules.
 * Hoists shared state (activeRunId, selectedEmployee) and passes down as props.
 */
import { useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import {
  PAYROLL_TABS,
  PAYROLL_DEFAULT_TAB,
  PAYROLL_COPY,
} from '../../config/hrPayroll.config'

// Lazy-import modules (all exist in the payroll/ subfolder)
import PayrollDashboard      from './payroll/PayrollDashboard'
import AttendanceDashboard   from './payroll/AttendanceDashboard'
import LeaveDashboard        from './payroll/LeaveDashboard'
import PayrollEngine         from './payroll/PayrollEngine'
import SalaryManagement      from './payroll/SalaryManagement'
import PayrollAuditor        from './payroll/PayrollAuditor'
import PayrollChatbot        from './payroll/PayrollChatbot'

const TAB_COMPONENTS = {
  dashboard:  PayrollDashboard,
  attendance: AttendanceDashboard,
  leave:      LeaveDashboard,
  engine:     PayrollEngine,
  salary:     SalaryManagement,
  auditor:    PayrollAuditor,
  assistant:  PayrollChatbot,
}

export default function Payroll() {
  const [activeTab,    setActiveTab]    = useState(PAYROLL_DEFAULT_TAB)
  const [activeRunId,  setActiveRunId]  = useState(null)

  const ActiveModule = TAB_COMPONENTS[activeTab]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HeroIcons.BanknotesIcon className="w-6 h-6 text-blue-600" />
                {PAYROLL_COPY.pageTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">{PAYROLL_COPY.pageSubtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <HeroIcons.ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
              PostgreSQL · AWS S3 · Rule-based AI
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-1 overflow-x-auto pb-px">
            {PAYROLL_TABS.map((tab) => {
              const Icon = HeroIcons[tab.icon] || HeroIcons.ChartBarIcon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Module Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {ActiveModule ? (
          <ActiveModule
            activeRunId={activeRunId}
            onSelectRun={(run) => {
              const id = typeof run === 'string' ? run : run?.id
              setActiveRunId(id)
            }}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-14 text-center text-slate-400">
            <HeroIcons.CpuChipIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Module not found</p>
          </div>
        )}
      </div>
    </div>
  )
}
