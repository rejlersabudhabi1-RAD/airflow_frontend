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
  const activePct = teamSnapshot.team_total
    ? Math.round((teamSnapshot.active_today / teamSnapshot.team_total) * 100)
    : 0
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-indigo-100 blur-2xl opacity-70" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-md">👥</div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">Team Snapshot</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{teamSnapshot.department}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-purple-100 border border-indigo-200 p-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Members</p>
            <p className="text-2xl font-black text-indigo-800 leading-tight mt-0.5">{teamSnapshot.team_total}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 p-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700">Active</p>
            <p className="text-2xl font-black text-emerald-800 leading-tight mt-0.5">{teamSnapshot.active_today}</p>
          </div>
        </div>

        {/* Active-today progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500">Active today</span>
            <span className="text-[11px] font-bold text-slate-700">{activePct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
              style={{ width: `${activePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Notifications preview inline component
function NotificationsCard({ notifications }) {
  const items = notifications?.recent || []
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-base shadow-md">
            🔔
            {notifications?.unread_count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                {notifications.unread_count > 9 ? '9+' : notifications.unread_count}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">Notifications</h2>
            <p className="text-[11px] text-slate-500">
              {notifications?.unread_count > 0
                ? <><span className="font-bold text-rose-600">{notifications.unread_count}</span> unread</>
                : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-1 opacity-60">📭</div>
          <p className="text-xs text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map(n => (
            <div
              key={n.id}
              className={`flex gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                n.is_read
                  ? 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  : 'bg-blue-50/60 border-blue-100 hover:bg-blue-100/60'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-slate-300' : 'bg-blue-500 animate-pulse'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-snug truncate ${n.is_read ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'}`}>
                  {n.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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
      <div className="p-10 text-center bg-white rounded-2xl border border-red-200 shadow-sm max-w-md mx-auto mt-8">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-800 font-semibold mb-1">Something went wrong</p>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Try again
        </button>
      </div>
    )
  }

  const d = dashData || {}

  return (
    <div className="relative min-h-full">
      {/* Ambient decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 -left-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-200/10 blur-3xl" />
      </div>

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

        {/* 4. Middle row — activity + notifications/team */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed
              activities={d.activity_feed}
              loading={loadingMain}
            />
          </div>
          <div className="space-y-6">
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
    </div>
  )
}
