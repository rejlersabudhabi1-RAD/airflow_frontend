/**
 * PendingActionsWidget — Items needing the user's attention.
 * Shown for Manager and Reviewer roles.
 * Sources: APPROVAL-category notifications.
 */
import React from 'react'

const PRIORITY_STYLES = {
  HIGH:    'bg-red-100 text-red-700',
  URGENT:  'bg-red-200 text-red-800 font-bold',
  NORMAL:  'bg-blue-100 text-blue-700',
  LOW:     'bg-gray-100 text-gray-500',
  CRITICAL:'bg-orange-200 text-orange-800 font-bold',
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff  = Date.now() - new Date(isoStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (hours < 1)  return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function PendingActionsWidget({ actions, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <div className="w-6 h-6 rounded bg-gray-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-40 bg-gray-100 rounded mb-1" />
              <div className="h-2 w-24 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          ✅ <span>Pending Actions</span>
        </h2>
        <p className="text-sm text-gray-400 text-center py-4">All caught up! No pending actions.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        ⏳ <span>Pending Actions</span>
        <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {actions.length}
        </span>
      </h2>
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <div key={action.id ?? idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
              {action.type === 'approval' ? '📋' : '📌'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 leading-snug truncate">{action.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{action.message}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(action.created_at)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.NORMAL}`}>
              {action.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
