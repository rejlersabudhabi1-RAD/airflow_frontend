/**
 * WelcomeHero — Personalized greeting card with KPI summary.
 * Shows gradient banner, avatar, role badge, and top 3 KPI stats.
 */
import React from 'react'
import { ROLE_GRADIENTS, KPI_COLORS } from '../../config/personalDashboard.config'

// Icon key → emoji mapping (no external icon lib dependency)
const KPI_ICONS = {
  sparkles: '✨',
  chart:    '📊',
  bell:     '🔔',
  check:    '✅',
  rocket:   '🚀',
  star:     '⭐',
  trophy:   '🏆',
  default:  '📌',
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeHero({ userContext, kpis, roleLayout, loading }) {
  const greeting = getTimeOfDay()
  const firstName = userContext?.name?.split(' ')[0] || 'there'
  const roleCode  = userContext?.role_code || 'default'
  const gradient  = ROLE_GRADIENTS[roleCode] || ROLE_GRADIENTS.default

  const topKpis = (kpis || []).slice(0, 3)

  if (loading) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 animate-pulse`}>
        <div className="h-8 w-48 bg-white/20 rounded-lg mb-2" />
        <div className="h-4 w-32 bg-white/15 rounded mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white/10 rounded-xl h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg`}>
      <div className="flex items-start justify-between mb-6">
        {/* Greeting */}
        <div className="flex items-center gap-4">
          {userContext?.avatar_url ? (
            <img
              src={userContext.avatar_url}
              alt="avatar"
              className="w-14 h-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {firstName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting},</p>
            <h1 className="text-white text-2xl font-bold leading-tight">{userContext?.name || 'Welcome'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium capitalize">
                {(userContext?.role_code || 'user').replace('_', ' ')}
              </span>
              {userContext?.department && (
                <span className="text-xs text-white/60">{userContext.department}</span>
              )}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="text-right hidden sm:block">
          <p className="text-white/50 text-xs">
            {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI row */}
      {topKpis.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {topKpis.map((kpi) => (
            <div key={kpi.key} className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{KPI_ICONS[kpi.icon] || KPI_ICONS.default}</span>
                <span className="text-white/70 text-xs font-medium truncate">{kpi.label}</span>
              </div>
              <p className="text-white text-2xl font-bold leading-none">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
