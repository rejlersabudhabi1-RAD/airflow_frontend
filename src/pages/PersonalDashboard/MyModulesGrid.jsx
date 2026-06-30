/**
 * MyModulesGrid — Accessible module tiles sorted by last-used.
 * Clicking navigates to the module. Unused modules are shown dimmed.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_META } from '../../config/personalDashboard.config'

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 30)   return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function SkeletonTile() {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-gray-200 mb-3" />
      <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
  )
}

export default function MyModulesGrid({ modules, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <SkeletonTile key={i} />)}
        </div>
      </div>
    )
  }

  if (!modules || modules.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Modules</h2>
        <p className="text-sm text-gray-400">No modules assigned. Contact your administrator.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        🧩 <span>My Modules</span>
        <span className="ml-auto text-xs font-normal text-gray-400 normal-case">{modules.length} accessible</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {modules.map((mod) => {
          const meta    = MODULE_META[mod.code] || { icon: '📦', label: mod.name, route: '/dashboard' }
          const used    = Boolean(mod.last_used)
          const ago     = timeAgo(mod.last_used)

          return (
            <button
              key={mod.code}
              onClick={() => navigate(meta.route)}
              className={`rounded-xl border text-left p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400
                ${used ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-gray-50 border-gray-100 opacity-70 hover:opacity-90'}`}
            >
              <div className="text-2xl mb-2">{meta.icon}</div>
              <p className="font-semibold text-gray-800 text-sm leading-snug">{meta.label || mod.name}</p>
              <p className={`text-xs mt-0.5 ${used ? 'text-blue-500' : 'text-gray-400'}`}>
                {used ? ago : 'Not used yet'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
