/**
 * Internal Sales Intelligence Dashboard  ·  /sales
 * ══════════════════════════════════════════════════
 * Three tabs: Overview | Sales Pipeline | Platform Usage
 *
 * SOFT-CODED:
 *   • CONFIG      — tabs, pipeline stages, tiers, colours, refresh timers
 *   • CATEGORY_UI — event-category icon / colour map
 *   • STATUS_STYLE — user-status badge colours
 *
 * To add a tab      → push to CONFIG.tabs, add a case in <TabContent>
 * To add a stage    → push to CONFIG.pipelineStages — nothing else changes
 * To add a colour   → edit CONFIG.disciplineColors
 * To add a category → edit CATEGORY_UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, Legend,
} from 'recharts';
import internalSalesService from '../services/internalSales.service';
import salesService          from '../services/sales.service';

// ─────────────────────────────────────────────────────────────────────────────
// ① SOFT-CODED CONFIG — change ALL behaviour / colours / tabs here ONLY
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  defaultTab: 'overview',

  // Tab definitions — add a new object here to add a tab
  tabs: [
    { key: 'overview',  label: 'Overview',        icon: '🏠' },
    { key: 'pipeline',  label: 'Sales Pipeline',  icon: '🚀' },
    { key: 'usage',     label: 'Platform Usage',  icon: '📊' },
  ],

  // Time-range selector
  timeRanges: [
    { key: '1d',  label: 'Today'   },
    { key: '7d',  label: '7 Days'  },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ],

  // Pipeline stages — reorder / add here; JSX auto-renders from this array
  pipelineStages: [
    { key: 'lead',        label: 'Lead',        color: '#94a3b8', badge: 'bg-slate-100 text-slate-700'      },
    { key: 'qualified',   label: 'Qualified',   color: '#3b82f6', badge: 'bg-blue-100 text-blue-700'       },
    { key: 'proposal',    label: 'Proposal',    color: '#8b5cf6', badge: 'bg-violet-100 text-violet-700'   },
    { key: 'negotiation', label: 'Negotiation', color: '#f59e0b', badge: 'bg-amber-100 text-amber-700'     },
    { key: 'closed_won',  label: 'Won ✓',       color: '#10b981', badge: 'bg-emerald-100 text-emerald-700' },
    { key: 'closed_lost', label: 'Lost',        color: '#ef4444', badge: 'bg-red-100 text-red-700'         },
  ],

  // Client tier badge styles
  tierStyle: {
    enterprise: 'bg-purple-100 text-purple-700',
    premium:    'bg-indigo-100 text-indigo-700',
    standard:   'bg-blue-100 text-blue-700',
    basic:      'bg-gray-100 text-gray-600',
  },

  // Discipline chart colours
  disciplineColors: {
    'Process (P&ID)':       '#3b82f6',
    'Digitization (PFD)':   '#8b5cf6',
    'Process Datasheet':    '#06b6d4',
    'Electrical Datasheet': '#f59e0b',
    'CRS Documents':        '#10b981',
    'DesignIQ':             '#ec4899',
    'Finance':              '#6366f1',
    'Procurement':          '#f97316',
    'QHSE':                 '#14b8a6',
    'Project Control':      '#84cc16',
    'Sales':                '#ef4444',
    'Admin / RBAC':         '#64748b',
    'User Management':      '#94a3b8',
    'Other':                '#cbd5e1',
  },

  // Auto-refresh timers (ms)
  refreshIntervalMs:  60_000,
  activeNowRefreshMs: 15_000,
  sessionsRefreshMs:  30_000,
  topUsersLimit:      10,
};

// Soft-coded event-category → icon / colour
const CATEGORY_UI = {
  authentication:   { icon: '🔐', color: 'bg-blue-50 text-blue-700 border-blue-100'      },
  authorization:    { icon: '🛡️', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  data_management:  { icon: '🗂️', color: 'bg-teal-50 text-teal-700 border-teal-100'      },
  system_operation: { icon: '⚙️', color: 'bg-gray-50 text-gray-700 border-gray-200'      },
  security:         { icon: '🚨', color: 'bg-red-50 text-red-700 border-red-100'          },
  api:              { icon: '🔌', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  ml_ai:            { icon: '🤖', color: 'bg-pink-50 text-pink-700 border-pink-100'       },
  communication:    { icon: '📨', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  maintenance:      { icon: '🔧', color: 'bg-orange-50 text-orange-700 border-orange-100' },
};

// User-status badge colours (mirrors rbac STATUS_CHOICES)
const STATUS_STYLE = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// ② PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt      = n => (n  ?? 0).toLocaleString();
const fmtCurr  = n => n  != null
  ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  : '—';
const pct      = n => `${(n ?? 0).toFixed(1)}%`;
const discColor = lbl => CONFIG.disciplineColors[lbl] ?? '#64748b';
const safeArr  = v => (Array.isArray(v) ? v : v?.results ?? v?.data ?? []);

// ─────────────────────────────────────────────────────────────────────────────
// ③ MICRO-COMPONENTS (shared across all tabs)
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, pulse }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`text-3xl mt-0.5 select-none ${pulse ? 'animate-pulse' : ''}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl select-none">{icon}</span>
      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ icon = '📭', message }) {
  return (
    <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
      <span className="text-4xl select-none">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Loading…</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm flex gap-2 items-center justify-between">
      <span className="flex gap-2 items-center"><span className="select-none">⚠️</span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-4 text-xs font-semibold underline hover:text-amber-900 whitespace-nowrap">
          Retry
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ④ PIPELINE TAB — stage cards, deals table, client grid, AI insights
// ─────────────────────────────────────────────────────────────────────────────
function StageCard({ stage, summary = {} }) {
  const count = summary.deal_count  ?? summary.count ?? 0;
  const value = summary.total_value ?? summary.value ?? 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${stage.badge}`}>{stage.label}</span>
        <span className="text-xs text-gray-400 font-medium">{count} deal{count !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{fmtCurr(value)}</p>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: count > 0 ? '100%' : '6px', backgroundColor: stage.color, minWidth: '6px' }}
        />
      </div>
    </div>
  );
}

function DealsTable({ deals }) {
  const stageMap = Object.fromEntries(CONFIG.pipelineStages.map(s => [s.key, s]));
  if (!deals.length) return <EmptyState icon="🤝" message="No deals found. Add your first deal to get started." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <th className="pb-3 pr-4">Deal</th>
            <th className="pb-3 pr-4">Client</th>
            <th className="pb-3 pr-4">Stage</th>
            <th className="pb-3 pr-4 text-right">Value</th>
            <th className="pb-3 pr-4 text-center">Win %</th>
            <th className="pb-3 text-right">Close Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {deals.map((d, i) => {
            const stage = stageMap[d.stage] ?? { badge: 'bg-gray-100 text-gray-600', label: d.stage };
            const winP  = d.win_probability ?? d.win_prob ?? null;
            return (
              <tr key={d.id ?? i} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-gray-900 truncate max-w-[200px]">{d.title || d.name || '—'}</p>
                  {d.priority && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      d.priority === 'high'   ? 'bg-red-50 text-red-600' :
                      d.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                                'bg-gray-50 text-gray-500'
                    }`}>{d.priority}</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600 text-xs truncate max-w-[130px]">
                  {d.client_name || d.client || '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stage.badge}`}>
                    {stage.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-semibold text-indigo-700">
                  {fmtCurr(d.value ?? d.deal_value)}
                </td>
                <td className="py-3 pr-4 text-center">
                  {winP != null ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winP}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{winP}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3 text-right text-xs text-gray-400">
                  {(d.expected_close_date || d.close_date)
                    ? new Date(d.expected_close_date ?? d.close_date).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClientGrid({ clients }) {
  const { tierStyle } = CONFIG;
  if (!clients.length) return <EmptyState icon="🏢" message="No client data available." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <th className="pb-3 pr-4">Client</th>
            <th className="pb-3 pr-4">Industry</th>
            <th className="pb-3 pr-4">Tier</th>
            <th className="pb-3 pr-4 text-right">Revenue</th>
            <th className="pb-3 pr-4 text-center">Health</th>
            <th className="pb-3 text-center">Churn Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {clients.map((c, i) => {
            const churn  = c.churn_probability ?? c.churn_risk ?? 0;
            const health = c.health_score ?? 0;
            return (
              <tr key={c.id ?? i} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-gray-900">{c.name || c.company_name || '—'}</p>
                  {c.primary_contact && <p className="text-xs text-gray-400">{c.primary_contact}</p>}
                </td>
                <td className="py-3 pr-4 text-gray-600 text-xs">{c.industry || '—'}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${tierStyle[c.tier] ?? tierStyle.basic}`}>
                    {c.tier || 'basic'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-semibold text-indigo-700">
                  {fmtCurr(c.total_revenue ?? c.annual_revenue)}
                </td>
                <td className="py-3 pr-4 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${health}%`,
                          backgroundColor: health > 70 ? '#10b981' : health > 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{health}%</span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    churn > 70 ? 'bg-red-100 text-red-700' :
                    churn > 40 ? 'bg-amber-100 text-amber-700' :
                                 'bg-green-100 text-green-700'
                  }`}>
                    {churn > 70 ? 'High' : churn > 40 ? 'Medium' : 'Low'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AIInsightsPanel({ insights }) {
  if (!insights.length) return <EmptyState icon="🤖" message="No AI insights available yet." />;
  return (
    <div className="space-y-3">
      {insights.map((ins, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            ins.priority === 'high'   ? 'bg-red-50 border-red-100'      :
            ins.priority === 'medium' ? 'bg-amber-50 border-amber-100'  :
                                        'bg-blue-50 border-blue-100'
          }`}
        >
          <span className="text-2xl flex-shrink-0 mt-0.5 select-none">
            {ins.type === 'warning'        ? '⚠️' :
             ins.type === 'opportunity'    ? '💡' :
             ins.type === 'recommendation' ? '🎯' : '🤖'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm">{ins.title || ins.insight || ins.message}</p>
            {ins.description && <p className="text-xs text-gray-600 mt-0.5">{ins.description}</p>}
            {ins.action       && <p className="text-xs text-indigo-600 font-medium mt-1">→ {ins.action}</p>}
          </div>
          {ins.priority && (
            <span className={`ml-auto flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
              ins.priority === 'high'   ? 'bg-red-100 text-red-700'     :
              ins.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                          'bg-blue-100 text-blue-700'
            }`}>
              {ins.priority}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑤ PLATFORM USAGE TAB — sessions, DB events, all-users (preserved logic)
// ─────────────────────────────────────────────────────────────────────────────
function SessionsPanel({ sessions }) {
  const { active_sessions = [], recent_sessions = [], active_count = 0 } = sessions;
  const [tab, setTab] = useState('active');
  const rows = tab === 'active' ? active_sessions : recent_sessions;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <SectionHeader
          icon="🖥️"
          title="User Sessions"
          subtitle={`${active_count} active now · browser, OS, device & current page`}
        />
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {[['active', `Active (${active_count})`], ['recent', 'Last 7 Days']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 font-semibold transition-colors ${
                tab === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🖥️" message={tab === 'active' ? 'No users active right now.' : 'No session data for the last 7 days.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Browser / OS</th>
                <th className="pb-3 pr-4">Device</th>
                <th className="pb-3 pr-4">IP Address</th>
                <th className="pb-3 pr-4">Current Page</th>
                <th className="pb-3 pr-4 text-right">Duration</th>
                <th className="pb-3 text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.user_name || '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{s.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    <p>{s.browser}</p>
                    <p className="text-xs text-gray-400">{s.os}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      {s.device_type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{s.ip_address || '—'}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs truncate max-w-[160px]">{s.current_page || '—'}</td>
                  <td className="py-3 pr-4 text-right text-gray-500 text-xs">{s.duration_label}</td>
                  <td className="py-3 text-right text-gray-400 text-xs">
                    {new Date(s.last_activity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DbEventsPanel({ dbEvents, evtCategory, setEvtCategory }) {
  const { events = [], total_in_period = 0, category_summary = [] } = dbEvents;
  const filtered = evtCategory ? events.filter(e => e.category === evtCategory) : events;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <SectionHeader
          icon="🗄️"
          title="Database Events"
          subtitle={`${fmt(total_in_period)} total events in period — logins, uploads, AI calls, errors & more`}
        />
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={() => setEvtCategory('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !evtCategory ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {category_summary.map(c => {
            const ui = CATEGORY_UI[c.category] ?? { icon: '📋', color: 'bg-gray-50 text-gray-700 border-gray-200' };
            return (
              <button
                key={c.category}
                onClick={() => setEvtCategory(prev => prev === c.category ? '' : c.category)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  evtCategory === c.category
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : `${ui.color} hover:opacity-80`
                }`}
              >
                <span>{ui.icon}</span>
                <span>{c.label}</span>
                <span className="opacity-70">({fmt(c.count)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗄️" message="No events for this filter." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Event</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4 text-center">Status</th>
                <th className="pb-3 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ev => {
                const ui = CATEGORY_UI[ev.category] ?? { icon: '📋', color: 'bg-gray-50 text-gray-700 border-gray-200' };
                return (
                  <tr key={ev.id} className={`hover:bg-gray-50 transition-colors ${!ev.success ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2.5 pr-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${ui.color}`}>
                        <span>{ui.icon}</span><span>{ev.category_label}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {ev.activity_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-800 truncate max-w-[130px]">
                        {ev.user_full_name || ev.user_email || 'System'}
                      </p>
                      {ev.ip_address && <p className="text-xs font-mono text-gray-400">{ev.ip_address}</p>}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 max-w-[240px] truncate">{ev.description}</td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ev.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ev.success ? 'OK' : 'Fail'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-gray-400">
                      {ev.duration_ms != null ? `${ev.duration_ms} ms` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AllUsersPanel({ allUsers, userSearch, setUserSearch }) {
  const query    = userSearch.trim().toLowerCase();
  const filtered = query
    ? allUsers.filter(u =>
        u.full_name.toLowerCase().includes(query)  ||
        u.email.toLowerCase().includes(query)      ||
        u.department.toLowerCase().includes(query) ||
        u.job_title.toLowerCase().includes(query)
      )
    : allUsers;

  const activeCount  = allUsers.filter(u => u.total_requests > 0).length;
  const dormantCount = allUsers.length - activeCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <SectionHeader
          icon="👥"
          title="All Registered Users"
          subtitle={`${activeCount} engaged · ${dormantCount} dormant · ${allUsers.length} total`}
        />
        <input
          type="text"
          placeholder="Search by name, email, department…"
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👥" message={userSearch ? 'No users match your search.' : 'No user profiles in the system.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Department / Title</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4 text-center">Status</th>
                <th className="pb-3 pr-4 text-right">Requests</th>
                <th className="pb-3 pr-4 text-right">Disciplines</th>
                <th className="pb-3 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => {
                const initials  = u.full_name
                  ? u.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  : u.email[0].toUpperCase();
                const isEngaged = u.total_requests > 0;
                return (
                  <tr key={u.email} className={`transition-colors ${isEngaged ? 'hover:bg-indigo-50' : 'opacity-60 hover:bg-gray-50'}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isEngaged ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{u.full_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-700 truncate">{u.department || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.job_title || ''}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0
                          ? u.roles.slice(0, 2).map(r => (
                              <span key={r} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">{r}</span>
                            ))
                          : <span className="text-gray-400 text-xs">—</span>
                        }
                        {u.roles.length > 2 && <span className="text-xs text-gray-400">+{u.roles.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[u.status] ?? STATUS_STYLE.inactive}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={`font-semibold ${isEngaged ? 'text-indigo-700' : 'text-gray-300'}`}>
                        {fmt(u.total_requests)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-500">{u.disciplines_used || '—'}</td>
                    <td className="py-3 text-right text-gray-400 text-xs">
                      {u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ TAB CONTENT ROUTER — add a new `if (tab === 'xyz')` block to add a tab
// ─────────────────────────────────────────────────────────────────────────────
function TabContent({ tab, state, actions }) {
  const {
    range, overview, disciplines, topUsers, trends, activeNow,
    allUsers, userSearch, dbEvents, evtCategory, sessions,
    pipeline, clients, aiInsights, activities,
    pipelineLoading, pipelineError,
  } = state;
  const { setUserSearch, setEvtCategory, fetchPipeline } = actions;

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  if (tab === 'overview') {
    const topDiscipline  = disciplines[0]?.discipline_label ?? '—';
    const byStage        = pipeline?.by_stage ?? [];

    return (
      <div className="space-y-6">

        {/* KPI row — usage + pipeline */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon="🟢" label="Active Now"     value={fmt(activeNow.length)}                     sub="last 15 min" pulse />
          <KpiCard icon="👤" label="Users Today"    value={fmt(overview?.today_users)}                sub={`${fmt(overview?.total_users)} in period`} />
          <KpiCard icon="⚡" label="Requests"       value={fmt(overview?.today_requests)}             sub={`${fmt(overview?.total_requests)} in period`} />
          <KpiCard icon="💰" label="Pipeline Value" value={fmtCurr(pipeline?.total_pipeline_value ?? pipeline?.total_value)} sub={`${fmt(pipeline?.total_deals ?? pipeline?.deal_count)} deals`} />
          <KpiCard icon="🏆" label="Win Rate"       value={pct(pipeline?.win_rate ?? 0)}              sub={topDiscipline} />
        </div>

        {/* Trends + Active Now */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader icon="📈" title="Usage Trends" subtitle="Daily requests & active users" />
            {trends.length === 0 ? (
              <EmptyState icon="📈" message="Not enough data to show trends yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'requests' ? 'Requests' : 'Users']} />
                  <Legend formatter={v => v === 'requests' ? 'Requests' : 'Unique Users'} />
                  <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#gradReq)"   strokeWidth={2} name="requests" />
                  <Area type="monotone" dataKey="users"    stroke="#10b981" fill="url(#gradUsers)" strokeWidth={2} name="users" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <SectionHeader icon="🟢" title="Active Right Now" subtitle="Users active in last 15 min" />
            <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
              {activeNow.length === 0 ? (
                <EmptyState icon="😴" message="No users active right now" />
              ) : activeNow.map((u, i) => (
                <div key={u.user_email ?? i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {u.user_full_name?.[0] || u.user_email?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.user_full_name || u.user_email}</p>
                    <p className="text-xs text-gray-500 truncate">{u.last_discipline}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 font-medium flex-shrink-0">{fmt(u.requests)} req</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline snapshot (bar chart, soft-rendered from CONFIG.pipelineStages) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="🚀" title="Pipeline Snapshot" subtitle="Deal counts by stage" />
          {pipelineError ? <ErrorBanner message={pipelineError} onRetry={fetchPipeline} /> :
           byStage.length === 0 ? <EmptyState icon="🚀" message="No pipeline data. Visit Sales Pipeline tab to manage deals." /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byStage} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [fmt(v), n === 'deal_count' ? 'Deals' : 'Value']} />
                <Bar dataKey="deal_count" name="deal_count" radius={[4, 4, 0, 0]}>
                  {byStage.map((entry, i) => {
                    const stg = CONFIG.pipelineStages.find(s => s.key === entry.stage);
                    return <Cell key={i} fill={stg?.color ?? '#6366f1'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI Insights preview */}
        {aiInsights.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader icon="🤖" title="AI Insights" subtitle="Top recommendations from your CRM engine" />
            <AIInsightsPanel insights={aiInsights.slice(0, 3)} />
          </div>
        )}
      </div>
    );
  }

  // ── SALES PIPELINE ────────────────────────────────────────────────────────
  if (tab === 'pipeline') {
    const stageMap = Object.fromEntries((pipeline?.by_stage ?? []).map(s => [s.stage, s]));
    return (
      <div className="space-y-6">

        {pipelineLoading && <Spinner />}
        {pipelineError   && <ErrorBanner message={pipelineError} onRetry={fetchPipeline} />}

        {/* Stage cards — auto-driven from CONFIG.pipelineStages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CONFIG.pipelineStages.map(stage => (
            <StageCard key={stage.key} stage={stage} summary={stageMap[stage.key] ?? {}} />
          ))}
        </div>

        {/* Pipeline KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="💰" label="Total Pipeline" value={fmtCurr(pipeline?.total_pipeline_value ?? pipeline?.total_value)}           sub="all open deals" />
          <KpiCard icon="✅" label="Won (Period)"   value={fmtCurr(pipeline?.won_value ?? pipeline?.closed_won_value ?? 0)}            sub={`${fmt(pipeline?.won_deals ?? 0)} deals won`} />
          <KpiCard icon="📊" label="Win Rate"       value={pct(pipeline?.win_rate)}                                                    sub="closed_won vs all closed" />
          <KpiCard icon="⏱️" label="Avg Deal Life"  value={`${fmt(pipeline?.avg_deal_days ?? pipeline?.avg_cycle_days ?? 0)} days`}   sub="lead to close" />
        </div>

        {/* Deals table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="🤝" title="All Deals" subtitle={`${fmt(pipeline?.total_deals ?? 0)} deals in pipeline`} />
          <DealsTable deals={safeArr(pipeline?.deals)} />
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="🏢" title="Top Clients" subtitle="Ranked by revenue · health score · churn risk" />
          <ClientGrid clients={clients.top} />
        </div>

        {/* At-risk clients */}
        {clients.atRisk.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <SectionHeader icon="🚨" title="At-Risk Clients" subtitle="High churn probability — requires immediate attention" />
            <ClientGrid clients={clients.atRisk} />
          </div>
        )}

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="🤖" title="AI Recommendations" subtitle="Powered by your CRM intelligence engine" />
          <AIInsightsPanel insights={aiInsights} />
        </div>

        {/* Upcoming activities */}
        {activities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader icon="📅" title="Upcoming Activities" subtitle="Next 7 days" />
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div key={a.id ?? i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                  <span className="text-xl flex-shrink-0 select-none">
                    {a.type === 'call' ? '📞' : a.type === 'email' ? '📧' : a.type === 'meeting' ? '🗓️' : '📌'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{a.title || a.subject || a.description}</p>
                    {a.client_name && <p className="text-xs text-gray-500">{a.client_name}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {(a.due_date || a.scheduled_at)
                      ? new Date(a.due_date ?? a.scheduled_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PLATFORM USAGE ────────────────────────────────────────────────────────
  if (tab === 'usage') {
    return (
      <div className="space-y-6">

        {/* Discipline bar chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader
            icon="🏭"
            title="Usage by Discipline"
            subtitle={`Requests per engineering area — ${CONFIG.timeRanges.find(r => r.key === range)?.label}`}
          />
          {disciplines.length === 0 ? (
            <EmptyState icon="📊" message="No data yet — start using the platform to see stats." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, disciplines.length * 36)}>
              <BarChart data={disciplines} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="discipline_label" width={155} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [fmt(v), n === 'total_requests' ? 'Requests' : 'Users']} />
                <Legend formatter={v => v === 'total_requests' ? 'Requests' : 'Unique Users'} />
                <Bar dataKey="total_requests" name="total_requests" radius={[0, 4, 4, 0]}>
                  {disciplines.map((d, i) => <Cell key={i} fill={discColor(d.discipline_label)} />)}
                </Bar>
                <Bar dataKey="unique_users" name="unique_users" fill="#a5b4fc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Discipline badge pills */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="🏷️" title="Discipline Breakdown" subtitle="All modules accessed in period" />
          <div className="flex flex-wrap gap-2">
            {disciplines.length === 0
              ? <p className="text-gray-400 text-sm">No discipline data yet.</p>
              : disciplines.map(d => (
                  <div
                    key={d.discipline_key}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: discColor(d.discipline_label) }}
                  >
                    <span>{d.discipline_label}</span>
                    <span className="bg-white/25 rounded-full px-1.5 py-0.5">{fmt(d.total_requests)}</span>
                    <span className="text-white/70">·</span>
                    <span className="text-white/80">{d.unique_users} users</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon="⭐" title="Top Users" subtitle={`Most active — ${CONFIG.timeRanges.find(r => r.key === range)?.label}`} />
          {topUsers.length === 0 ? (
            <EmptyState icon="👤" message="No user data for this period." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4 text-right">Requests</th>
                    <th className="pb-3 pr-4 text-right">Disciplines</th>
                    <th className="pb-3 text-right">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topUsers.map((u, i) => (
                    <tr key={u.user_email} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-600'    :
                          i === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                        }`}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900">{u.user_full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.user_email}</p>
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-indigo-700">{fmt(u.total_requests)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{u.disciplines_used}</td>
                      <td className="py-3 text-right text-gray-500">{fmt(u.avg_response_ms)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All-users roster */}
        <AllUsersPanel
          allUsers={allUsers}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
        />

        {/* Sessions */}
        <SessionsPanel sessions={sessions} />

        {/* DB Events */}
        <DbEventsPanel
          dbEvents={dbEvents}
          evtCategory={evtCategory}
          setEvtCategory={setEvtCategory}
        />
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑦ ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function InternalSalesDashboard() {

  // ── Platform usage state ─────────────────────────────────────────────────
  const [range, setRange]             = useState('7d');
  const [overview, setOverview]       = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [topUsers, setTopUsers]       = useState([]);
  const [trends, setTrends]           = useState([]);
  const [activeNow, setActiveNow]     = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [userSearch, setUserSearch]   = useState('');
  const [dbEvents, setDbEvents]       = useState({ events: [], total_in_period: 0, category_summary: [] });
  const [evtCategory, setEvtCategory] = useState('');
  const [sessions, setSessions]       = useState({ active_sessions: [], recent_sessions: [], active_count: 0 });
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError]   = useState(null);

  // ── CRM / pipeline state ─────────────────────────────────────────────────
  const [pipeline, setPipeline]             = useState(null);
  const [clients, setClients]               = useState({ top: [], atRisk: [] });
  const [aiInsights, setAiInsights]         = useState([]);
  const [activities, setActivities]         = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineError, setPipelineError]   = useState(null);
  const [pipelineLoaded, setPipelineLoaded] = useState(false); // lazy — load once

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState(CONFIG.defaultTab);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const mainTimer      = useRef(null);
  const activeNowTimer = useRef(null);
  const sessionsTimer  = useRef(null);

  // ── Fetch: platform usage (tied to range) ────────────────────────────────
  const fetchUsage = useCallback(async () => {
    try {
      setUsageError(null);
      const trendRange = range === '1d' ? '7d' : range;
      const [ov, disc, users, tr, allU, evts] = await Promise.all([
        internalSalesService.getOverview(range),
        internalSalesService.getDisciplines(range),
        internalSalesService.getTopUsers(range, CONFIG.topUsersLimit),
        internalSalesService.getTrends(trendRange),
        internalSalesService.getAllUsers(range),
        internalSalesService.getDbEvents(range, { limit: 100 }),
      ]);
      setOverview(ov);
      setDisciplines(disc);
      setTopUsers(users);
      setTrends(tr);
      setAllUsers(allU);
      setDbEvents(evts);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Usage fetch error:', e);
      setUsageError('Could not load analytics. Backend may still be starting up.');
    } finally {
      setUsageLoading(false);
    }
  }, [range]);

  const fetchActive = useCallback(async () => {
    try { setActiveNow(await internalSalesService.getActiveNow()); } catch (_) {}
  }, []);

  const fetchSessions = useCallback(async () => {
    try { setSessions(await internalSalesService.getSessions()); } catch (_) {}
  }, []);

  // ── Fetch: CRM data — lazy, loads once when pipeline tab is first visited ─
  const fetchPipeline = useCallback(async () => {
    if (pipelineLoaded) return;
    setPipelineLoading(true);
    setPipelineError(null);
    try {
      const [summary, topC, atRisk, insights, upcoming] = await Promise.allSettled([
        salesService.getPipelineSummary(),
        salesService.getTopClients({ limit: 20 }),
        salesService.getAtRiskClients(),
        salesService.getAIInsights(),
        salesService.getUpcomingActivities(7),
      ]);

      if (summary.status  === 'fulfilled') setPipeline(summary.value);
      if (topC.status     === 'fulfilled') setClients(prev => ({ ...prev, top:    safeArr(topC.value)    }));
      if (atRisk.status   === 'fulfilled') setClients(prev => ({ ...prev, atRisk: safeArr(atRisk.value)  }));
      if (insights.status === 'fulfilled') setAiInsights(safeArr(insights.value?.insights ?? insights.value));
      if (upcoming.status === 'fulfilled') setActivities(safeArr(upcoming.value));

      if (summary.status === 'rejected') {
        // Don't mark loaded — allows auto-retry on next tab visit
        setPipelineError('Connecting to analytics engine… switching to this tab will retry automatically.');
        return;
      }

      setPipelineLoaded(true);
    } catch (e) {
      setPipelineError('Failed to load sales pipeline data.');
    } finally {
      setPipelineLoading(false);
    }
  }, [pipelineLoaded]);

  // ── Lifecycle — usage polling ─────────────────────────────────────────────
  useEffect(() => {
    setUsageLoading(true);
    fetchUsage();
    fetchActive();
    fetchSessions();

    clearInterval(mainTimer.current);
    clearInterval(activeNowTimer.current);
    clearInterval(sessionsTimer.current);

    mainTimer.current      = setInterval(fetchUsage,    CONFIG.refreshIntervalMs);
    activeNowTimer.current = setInterval(fetchActive,   CONFIG.activeNowRefreshMs);
    sessionsTimer.current  = setInterval(fetchSessions, CONFIG.sessionsRefreshMs);

    return () => {
      clearInterval(mainTimer.current);
      clearInterval(activeNowTimer.current);
      clearInterval(sessionsTimer.current);
    };
  }, [fetchUsage, fetchActive, fetchSessions]);

  // ── Lazy-load CRM when Sales Pipeline or Overview tab is first opened ────
  useEffect(() => {
    if (activeTab === 'pipeline' || activeTab === 'overview') fetchPipeline();
  }, [activeTab, fetchPipeline]);

  // ── Bundle state / actions for TabContent ───────────────────────────────
  const tabState = {
    range, overview, disciplines, topUsers, trends, activeNow,
    allUsers, userSearch, dbEvents, evtCategory, sessions,
    pipeline, clients, aiInsights, activities,
    pipelineLoading, pipelineError,
  };
  const tabActions = { setUserSearch, setEvtCategory, fetchPipeline };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* Logo + title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-md select-none">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                  Internal Sales Intelligence
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Platform analytics · CRM pipeline · live user activity
                </p>
              </div>
            </div>

            {/* Time range + live indicator */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                {CONFIG.timeRanges.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      range === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-right text-xs text-gray-400">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  Live
                </div>
                <div>{lastRefresh.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          {/* Tab bar — auto-rendered from CONFIG.tabs */}
          <div className="flex gap-1 mt-5 pt-4 border-t border-gray-100">
            {CONFIG.tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all select-none ${
                  activeTab === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error / Loading ── */}
        {usageError && <ErrorBanner message={usageError} />}
        {usageLoading && !usageError && <Spinner />}

        {/* ── Tab content ── */}
        {!usageLoading && !usageError && (
          <TabContent tab={activeTab} state={tabState} actions={tabActions} />
        )}

      </div>
    </div>
  );
}
