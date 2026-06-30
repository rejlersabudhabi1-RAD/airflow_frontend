/**
 * AIInsightsStrip — Horizontally scrollable AI-generated insight cards.
 * Each card shows icon, type badge, title, and one-line body.
 * Loaded from GET /api/v1/dashboard/personal/insights/
 */
import React from 'react'
import { INSIGHT_STYLES } from '../../config/personalDashboard.config'

const ICON_EMOJI = {
  lightbulb: '💡',
  trophy:    '🏆',
  bell:      '🔔',
  sparkles:  '✨',
  chart:     '📊',
  rocket:    '🚀',
  star:      '⭐',
  check:     '✅',
}

const TYPE_LABELS = {
  tip:         'Productivity Tip',
  achievement: 'Achievement',
  alert:       'Usage Alert',
  suggestion:  'Feature Suggestion',
}

function SkeletonCard() {
  return (
    <div className="min-w-[260px] max-w-[300px] rounded-xl border bg-gray-50 border-gray-200 p-4 animate-pulse flex-shrink-0">
      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-full bg-gray-100 rounded mb-1" />
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  )
}

export default function AIInsightsStrip({ insights, loading }) {
  if (loading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          ✨ <span>AI Insights for You</span>
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          ✨ <span>AI Insights for You</span>
        </h2>
        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-gray-400 text-sm">
          AI insights will appear here after your first active day — powered by GPT-4o
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        ✨ <span>AI Insights for You</span>
        <span className="ml-auto text-xs text-gray-400 normal-case font-normal">Powered by GPT-4o · refreshes nightly</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {insights.map((ins) => {
          const style = INSIGHT_STYLES[ins.insight_type] || INSIGHT_STYLES.tip
          return (
            <div
              key={ins.id}
              className={`min-w-[260px] max-w-[300px] flex-shrink-0 rounded-xl border p-4 ${style.bg} ${style.border}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{ICON_EMOJI[ins.icon_key] || '💡'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                  {TYPE_LABELS[ins.insight_type] || ins.insight_type}
                </span>
              </div>
              {/* Title */}
              <p className="font-semibold text-gray-800 text-sm leading-snug mb-1">{ins.title}</p>
              {/* Body */}
              <p className="text-gray-600 text-xs leading-relaxed">{ins.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
