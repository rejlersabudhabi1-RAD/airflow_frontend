/**
 * UsageStatsChart — Personal 30-day AI usage bar chart + discipline breakdown.
 * SVG-rendered horizontal bars, same pattern as Dashboard.jsx.
 * Data from usage_stats.by_discipline in the personal dashboard bundle.
 */
import React, { useMemo } from 'react'

// ─── Soft-coded bar colours per discipline ───────────────────────────────────
const DISCIPLINE_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#84CC16', // lime
]
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonBar({ width = '60%' }) {
  return (
    <div className="flex items-center gap-2 mb-2 animate-pulse">
      <div className="w-28 h-3 bg-gray-100 rounded" />
      <div className="flex-1 h-5 bg-gray-100 rounded-full" style={{ maxWidth: width }} />
      <div className="w-8 h-3 bg-gray-50 rounded" />
    </div>
  )
}

export default function UsageStatsChart({ usageStats, loading }) {
  const disciplines = usageStats?.by_discipline || []
  const total30d    = usageStats?.total_30d || 0
  const today       = usageStats?.today || 0

  const maxCount = useMemo(() => {
    if (!disciplines.length) return 1
    return Math.max(...disciplines.map(d => d.count || 0), 1)
  }, [disciplines])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        {[...Array(4)].map((_, i) => <SkeletonBar key={i} width={`${30 + i * 15}%`} />)}
      </div>
    )
  }

  if (!disciplines.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          📈 <span>My AI Usage</span>
        </h2>
        <p className="text-sm text-gray-400 text-center py-4">No usage data yet for this month.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          📈 <span>My AI Usage</span>
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span><strong className="text-gray-800">{today}</strong> today</span>
          <span><strong className="text-gray-800">{total30d.toLocaleString()}</strong> / 30 days</span>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-2">
        {disciplines.map((d, idx) => {
          const pct   = Math.round((d.count / maxCount) * 100)
          const color = DISCIPLINE_COLORS[idx % DISCIPLINE_COLORS.length]
          const label = d.discipline_label || d.discipline_key || 'Unknown'

          return (
            <div key={d.discipline_key || idx} className="flex items-center gap-2 group">
              {/* Label */}
              <span className="w-32 text-xs text-gray-600 truncate text-right flex-shrink-0 group-hover:text-gray-900 transition-colors">
                {label}
              </span>
              {/* Bar */}
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              {/* Count */}
              <span className="w-8 text-xs text-gray-500 text-right flex-shrink-0">
                {d.count}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">Last 30 days · your activity only</p>
    </div>
  )
}
