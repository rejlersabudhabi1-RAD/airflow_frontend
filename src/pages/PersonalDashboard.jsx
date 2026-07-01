/**
 * PersonalDashboard — Role-based personalized dashboard.
 * Rendered inside Dashboard.jsx for all non-super-admin users.
 * Thin renderer: all layout decisions driven by personalDashboard.config.js.
 *
 * Data flow (apiService baseURL already includes /api/v1):
 *   GET /dashboard/personal/          → role-scoped bundle (polls every 60s)
 *   GET /dashboard/personal/insights/ → AI insights (once on mount)
 */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'

import { PERSONAL_DASHBOARD_CONFIG, ROLE_LAYOUTS } from '../config/personalDashboard.config'

import WelcomeHero          from './PersonalDashboard/WelcomeHero'
import AIInsightsStrip      from './PersonalDashboard/AIInsightsStrip'
import MyModulesGrid        from './PersonalDashboard/MyModulesGrid'
import ActivityFeed         from './PersonalDashboard/ActivityFeed'
import PendingActionsWidget from './PersonalDashboard/PendingActionsWidget'
import UsageStatsChart      from './PersonalDashboard/UsageStatsChart'

import apiService from '../services/api.service'

// ─── API helpers ─────────────────────────────────────────────────────────────
const fetchPersonalDashboard = () =>
  apiService.get('/dashboard/personal/')

const fetchPersonalInsights = () =>
  apiService.get('/dashboard/personal/insights/')
// ─────────────────────────────────────────────────────────────────────────────

// Team snapshot inline component
function TeamSnapshotCard({ teamSnapshot }) {
  if (!teamSnapshot) return null
  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        👥 <span>Team Snapshot</span>
        <span className="ml-auto text-xs font-normal text-gray-400 normal-case">{teamSnapshot.department}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <p className="text-2xl font-bold text-indigo-700">{teamSnapshot.team_total}</p>
          <p className="text-xs text-indigo-500 mt-0.5">Team Members</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{teamSnapshot.active_today}</p>
          <p className="text-xs text-green-500 mt-0.5">Active Today</p>
        </div>
      </div>
    </div>
  )
}

// Notifications preview inline component
function NotificationsCard({ notifications }) {
  if (!notifications?.recent?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        🔔 <span>Notifications</span>
        {notifications.unread_count > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {notifications.unread_count}
          </span>
        )}
      </h2>
      <div className="space-y-2">
        {notifications.recent.slice(0, 4).map(n => (
          <div key={n.id} className={`flex gap-2 p-2 rounded-lg ${n.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{n.title}</p>
              <p className="text-xs text-gray-500 truncate">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function PersonalDashboard() {
  const { user } = useSelector(s => s.auth)

  const [dashData, setDashData]       = useState(null)
  const [insights, setInsights]       = useState([])
  const [loadingMain, setLoadingMain] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [error, setError]             = useState(null)
  const pollRef                       = useRef(null)

  // Determine role layout
  const roleCode   = dashData?.user_context?.role_code || 'default'
  const layout     = ROLE_LAYOUTS[roleCode] || ROLE_LAYOUTS.default

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetchPersonalDashboard()
      // 204 = super admin, shouldn't reach here but guard anyway
      if (res.status === 204) return
      setDashData(res.data)
      setError(null)
    } catch (err) {
      if (err?.response?.status !== 204) {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoadingMain(false)
    }
  }, [])

  const loadInsights = useCallback(async () => {
    try {
      const res = await fetchPersonalInsights()
      setInsights(res.data?.insights || [])
    } catch {
      setInsights([])
    } finally {
      setLoadingInsights(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboard()
    loadInsights()
  }, [loadDashboard, loadInsights])

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(loadDashboard, PERSONAL_DASHBOARD_CONFIG.pollIntervalMs)
    return () => clearInterval(pollRef.current)
  }, [loadDashboard])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-3 text-sm text-blue-600 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const d = dashData || {}

  return (
    <div className="space-y-6 pb-8">

      {/* 1. Welcome Hero */}
      <WelcomeHero
        userContext={d.user_context}
        kpis={d.kpis}
        roleLayout={layout}
        loading={loadingMain}
      />

      {/* 2. AI Insights Strip */}
      <AIInsightsStrip
        insights={insights}
        loading={loadingInsights}
      />

      {/* 3. My Modules Grid */}
      <MyModulesGrid
        modules={d.my_modules}
        loading={loadingMain}
      />

      {/* 4. Middle row — context-sensitive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed — always visible, takes 2 cols */}
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={d.activity_feed}
            loading={loadingMain}
          />
        </div>

        {/* Right column: notifications or team snapshot */}
        <div className="space-y-4">
          {layout.showTeamSnapshot && (
            <TeamSnapshotCard teamSnapshot={d.team_snapshot} />
          )}
          <NotificationsCard notifications={d.notifications} />
        </div>
      </div>

      {/* 5. Bottom row — pending actions + usage chart */}
      {(layout.showPendingActions || layout.showUsageChart) && (
        <div className={`grid grid-cols-1 gap-6 ${layout.showPendingActions && layout.showUsageChart ? 'lg:grid-cols-2' : ''}`}>
          {layout.showPendingActions && (
            <PendingActionsWidget
              actions={d.pending_actions}
              loading={loadingMain}
            />
          )}
          {layout.showUsageChart && (
            <UsageStatsChart
              usageStats={d.usage_stats}
              loading={loadingMain}
            />
          )}
        </div>
      )}

    </div>
  )
}
