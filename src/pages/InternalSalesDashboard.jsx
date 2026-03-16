/**
 * Internal Sales Dashboard
 * Real-time platform usage analytics for internal sales intelligence.
 * Shows: active users, requests per discipline, top users, usage trends.
 * Soft-coded: time ranges, refresh interval, and discipline colors live in CONFIG below.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import internalSalesService from '../../services/internalSales.service';

// ─── Soft-coded configuration ───────────────────────────────────────────────
const CONFIG = {
  refreshIntervalMs: 60_000,        // auto-refresh every 60 s
  activeNowRefreshMs: 15_000,       // active-now updates every 15 s
  timeRanges: [
    { key: '1d',  label: 'Today' },
    { key: '7d',  label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ],
  disciplineColors: {
    'Process (P&ID)':          '#3b82f6',
    'Digitization (PFD)':      '#8b5cf6',
    'Process Datasheet':       '#06b6d4',
    'Electrical Datasheet':    '#f59e0b',
    'CRS Documents':           '#10b981',
    'DesignIQ':                '#ec4899',
    'Finance':                 '#6366f1',
    'Procurement':             '#f97316',
    'QHSE':                    '#14b8a6',
    'Project Control':         '#84cc16',
    'Sales':                   '#ef4444',
    'Admin / RBAC':            '#64748b',
    'User Management':         '#94a3b8',
    'Other':                   '#cbd5e1',
  },
  topUsersLimit: 10,
};
// ────────────────────────────────────────────────────────────────────────────

const fmt = n => (n ?? 0).toLocaleString();
const pct = n => `${(n ?? 0).toFixed(1)}%`;
const badge = label => CONFIG.disciplineColors[label] ?? '#64748b';

// KPI card component
function KpiCard({ icon, label, value, sub, pulse }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`text-3xl mt-0.5 ${pulse ? 'animate-pulse' : ''}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function InternalSalesDashboard() {
  const [range, setRange]             = useState('7d');
  const [overview, setOverview]       = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [topUsers, setTopUsers]       = useState([]);
  const [trends, setTrends]           = useState([]);
  const [activeNow, setActiveNow]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError]             = useState(null);

  const activeNowTimer = useRef(null);
  const mainTimer      = useRef(null);

  // Fetch all dashboard data
  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const trendRange = range === '1d' ? '7d' : range; // trends need at least a week for a meaningful chart
      const [ov, disc, users, tr] = await Promise.all([
        internalSalesService.getOverview(range),
        internalSalesService.getDisciplines(range),
        internalSalesService.getTopUsers(range, CONFIG.topUsersLimit),
        internalSalesService.getTrends(trendRange),
      ]);
      setOverview(ov);
      setDisciplines(disc);
      setTopUsers(users);
      setTrends(tr);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Usage dashboard fetch error:', e);
      setError('Could not load analytics. Backend may still be starting up.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  // Fetch active users separately (fast refresh)
  const fetchActive = useCallback(async () => {
    try {
      const data = await internalSalesService.getActiveNow();
      setActiveNow(data);
    } catch (_) {}
  }, []);

  // On range change or mount
  useEffect(() => {
    setLoading(true);
    fetchAll();
    fetchActive();

    clearInterval(mainTimer.current);
    clearInterval(activeNowTimer.current);

    mainTimer.current      = setInterval(fetchAll,   CONFIG.refreshIntervalMs);
    activeNowTimer.current = setInterval(fetchActive, CONFIG.activeNowRefreshMs);

    return () => {
      clearInterval(mainTimer.current);
      clearInterval(activeNowTimer.current);
    };
  }, [fetchAll, fetchActive]);

  const topDiscipline = disciplines[0]?.discipline_label ?? '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-md">
              📊
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                Platform Usage Intelligence
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Internal analytics — real-time user &amp; discipline utilization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Time range selector */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              {CONFIG.timeRanges.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    range === key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Refresh indicator */}
            <div className="text-right text-xs text-gray-400">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                Live
              </div>
              <div>{lastRefresh.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm font-medium flex gap-3 items-center">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !error && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading analytics…</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon="🟢" label="Active Now"
                value={fmt(activeNow.length)}
                sub="users in last 15 min"
                pulse
              />
              <KpiCard
                icon="👤" label="Users Today"
                value={fmt(overview?.today_users)}
                sub={`${fmt(overview?.total_users)} in period`}
              />
              <KpiCard
                icon="⚡" label="Requests Today"
                value={fmt(overview?.today_requests)}
                sub={`${fmt(overview?.total_requests)} in period`}
              />
              <KpiCard
                icon="🏆" label="Top Discipline"
                value={topDiscipline}
                sub={`${pct(overview?.success_rate)} success · ${fmt(overview?.avg_response_ms)} ms avg`}
              />
            </div>

            {/* ── Middle row: Discipline bars + Active users ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Discipline bar chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <SectionHeader
                  icon="🏭"
                  title="Usage by Discipline"
                  subtitle={`Requests per engineering area — ${CONFIG.timeRanges.find(r => r.key === range)?.label}`}
                />
                {disciplines.length === 0 ? (
                  <p className="text-gray-400 text-sm py-10 text-center">No data yet — start using the platform to see stats.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={disciplines}
                      layout="vertical"
                      margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="discipline_label"
                        width={150}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(v, name) => [fmt(v), name === 'total_requests' ? 'Requests' : 'Users']}
                        labelStyle={{ fontWeight: 700 }}
                      />
                      <Legend formatter={v => (v === 'total_requests' ? 'Requests' : 'Unique Users')} />
                      <Bar dataKey="total_requests" name="total_requests" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="unique_users"   name="unique_users"   fill="#a5b4fc" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Active Now panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <SectionHeader
                  icon="🟢"
                  title="Active Right Now"
                  subtitle="Users active in the last 15 minutes"
                />
                <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
                  {activeNow.length === 0 ? (
                    <p className="text-gray-400 text-sm py-8 text-center">No users active right now</p>
                  ) : (
                    activeNow.map((u, i) => (
                      <div key={u.user_email} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {u.user_full_name?.[0] || u.user_email?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {u.user_full_name || u.user_email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.last_discipline}</p>
                        </div>
                        <span className="ml-auto text-xs text-gray-400 font-medium flex-shrink-0">
                          {fmt(u.requests)} req
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Trends chart ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <SectionHeader
                icon="📈"
                title="Usage Trends"
                subtitle="Daily requests and unique users over time"
              />
              {trends.length === 0 ? (
                <p className="text-gray-400 text-sm py-10 text-center">Not enough data yet to show trends.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trends} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [fmt(v), n === 'requests' ? 'Requests' : 'Users']} />
                    <Legend formatter={v => (v === 'requests' ? 'Requests' : 'Unique Users')} />
                    <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#gradReq)"   strokeWidth={2} name="requests" />
                    <Area type="monotone" dataKey="users"    stroke="#10b981" fill="url(#gradUsers)" strokeWidth={2} name="users" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Top Users table ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <SectionHeader
                icon="👥"
                title="Top Users"
                subtitle={`Most active users — ${CONFIG.timeRanges.find(r => r.key === range)?.label}`}
              />
              {topUsers.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No user data for this period.</p>
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
                              i === 1 ? 'bg-gray-100 text-gray-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'text-gray-400'
                            }`}>
                              {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-gray-900">{u.user_full_name || '—'}</p>
                            <p className="text-xs text-gray-400">{u.user_email}</p>
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold text-indigo-700">
                            {fmt(u.total_requests)}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-600">
                            {u.disciplines_used}
                          </td>
                          <td className="py-3 text-right text-gray-500">
                            {fmt(u.avg_response_ms)} ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Discipline detail badges ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <SectionHeader icon="🏷️" title="Discipline Breakdown" subtitle="All modules accessed in period" />
              <div className="flex flex-wrap gap-2">
                {disciplines.map(d => (
                  <div
                    key={d.discipline_key}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: badge(d.discipline_label) }}
                  >
                    <span>{d.discipline_label}</span>
                    <span className="bg-white bg-opacity-25 rounded-full px-1.5 py-0.5">
                      {fmt(d.total_requests)}
                    </span>
                    <span className="text-white/70">·</span>
                    <span className="text-white/80">{d.unique_users} users</span>
                  </div>
                ))}
                {disciplines.length === 0 && (
                  <p className="text-gray-400 text-sm">No discipline data yet.</p>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
