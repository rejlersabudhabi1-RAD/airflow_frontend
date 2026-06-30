/**
 * ActivityFeed — User's own recent activity timeline.
 * Shows last 10 actions with type icon, description, and relative time.
 */
import React from 'react'
import { ACTIVITY_META } from '../../config/personalDashboard.config'

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff  = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 animate-pulse py-2">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 w-48 bg-gray-100 rounded mb-1" />
        <div className="h-2 w-20 bg-gray-50 rounded" />
      </div>
    </div>
  )
}

export default function ActivityFeed({ activities, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h2>
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">🕐 Recent Activity</h2>
        <p className="text-sm text-gray-400 text-center py-4">No recent activity. Start using the platform!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        🕐 <span>Recent Activity</span>
        <span className="ml-auto text-xs font-normal text-gray-400 normal-case">your actions only</span>
      </h2>
      <div className="divide-y divide-gray-50">
        {activities.map((act, idx) => {
          const meta = ACTIVITY_META[act.type] || ACTIVITY_META.default
          return (
            <div key={act.id ?? idx} className="flex items-start gap-3 py-2.5">
              {/* Icon bubble */}
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                {meta.icon}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-snug truncate">
                  {act.description || meta.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(act.timestamp)}</p>
              </div>
              {/* Success indicator */}
              {act.success === false && (
                <span className="text-xs text-red-400 flex-shrink-0">failed</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
