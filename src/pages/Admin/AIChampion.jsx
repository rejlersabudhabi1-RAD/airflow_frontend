import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  SparklesIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import analyticsService from '../../services/analyticsService';
import { isUserAdmin } from '../../utils/rbac.utils';

/**
 * AI Champion of the Month — gamified leaderboard, real-time activity tracking,
 * AI cost analytics, and historical winners. All thresholds and weights are
 * soft-coded so SuperAdmin can rebalance scoring without touching code.
 *
 * Backend: /rbac/ai-champion/* (Django + DRF + Celery)
 * AWS reference architecture documented in apps/rbac/ai_champion_models.py.
 */

// ---------------------------------------------------------------------------
// Soft-coded UI configuration
// ---------------------------------------------------------------------------
const TIME_WINDOWS = [
  { id: 'today',   label: 'Today',     days: 1 },
  { id: 'week',    label: 'This Week', days: 7 },
  { id: 'month',   label: 'This Month',days: 30 },
  { id: 'quarter', label: 'Quarter',   days: 90 },
];

const REFRESH_INTERVAL_MS = 60_000;
const LEADERBOARD_LIMIT = 20;

// Tier visual styling (matches backend BADGE_TIERS thresholds)
const TIER_STYLES = {
  diamond:  { ring: 'from-cyan-400 via-blue-500 to-indigo-600',  pill: 'bg-gradient-to-r from-cyan-100 to-blue-100 text-blue-700 border-blue-200',     emoji: '💎' },
  platinum: { ring: 'from-slate-300 via-slate-400 to-slate-600', pill: 'bg-slate-100 text-slate-700 border-slate-300',                                emoji: '🏆' },
  gold:     { ring: 'from-yellow-300 via-amber-400 to-orange-500', pill: 'bg-yellow-50 text-yellow-700 border-yellow-200',                            emoji: '🥇' },
  silver:   { ring: 'from-gray-200 via-gray-300 to-gray-500',    pill: 'bg-gray-100 text-gray-700 border-gray-300',                                  emoji: '🥈' },
  bronze:   { ring: 'from-amber-300 via-amber-500 to-orange-700', pill: 'bg-amber-50 text-amber-700 border-amber-200',                               emoji: '🥉' },
  rookie:   { ring: 'from-emerald-200 via-emerald-300 to-teal-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',                       emoji: '🌱' },
};

// Cost-card colour ramp (USD/day)
const COST_TONE = (cost) => {
  if (cost >= 100) return 'text-rose-600';
  if (cost >= 25)  return 'text-amber-600';
  if (cost >  0)   return 'text-emerald-600';
  return 'text-slate-400';
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getInitials = (name = '', email = '') => {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

const fmtUSD = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => (Number(n) || 0).toLocaleString();
const tierStyle = (id) => TIER_STYLES[id] || TIER_STYLES.rookie;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const AIChampion = () => {
  const navigate = useNavigate();
  const authUser = useSelector((s) => s.auth?.user);
  const rbacRoles = useSelector((s) => s.rbac?.userRoles || []);

  const [windowId, setWindowId] = useState('month');
  const [leaderboard, setLeaderboard] = useState(null);
  const [champion, setChampion] = useState(null);
  const [costReport, setCostReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = useMemo(() => {
    if (isUserAdmin && isUserAdmin(authUser)) return true;
    const adminRoles = ['super_admin', 'admin'];
    return Array.isArray(rbacRoles) && rbacRoles.some((r) => adminRoles.includes(r?.role_code || r?.code || r));
  }, [authUser, rbacRoles]);

  const days = useMemo(
    () => (TIME_WINDOWS.find((w) => w.id === windowId) || TIME_WINDOWS[2]).days,
    [windowId]
  );

  // ------------------------------ Data loading ------------------------------
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [lb, ch, cost, hist] = await Promise.all([
        analyticsService.getChampionLeaderboard(days, LEADERBOARD_LIMIT).catch(() => null),
        analyticsService.getCurrentChampion().catch(() => null),
        analyticsService.getCostReport(days).catch(() => null),
        analyticsService.getChampionHistory(12).catch(() => ({ results: [] })),
      ]);
      setLeaderboard(lb);
      setChampion(ch);
      setCostReport(cost);
      setHistory(hist?.results || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || 'Failed to load AI Champion data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    if (!isAdmin) return;
    load(false);
    const id = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAdmin, load]);

  // ------------------------------ CSV export ------------------------------
  const handleExport = async () => {
    try {
      const blob = await analyticsService.exportLeaderboardCSV(days);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-champion-leaderboard-${days}d.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + (err?.message || 'unknown error'));
    }
  };

  // ------------------------------ Recompute (admin) ------------------------------
  const handleRecompute = async () => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth(); // previous month
    if (!confirm(`Recompute AI Champion for ${year}-${String(month).padStart(2, '0')}?`)) return;
    try {
      await analyticsService.recomputeChampion(year, month);
      await load(false);
    } catch (err) {
      setError('Recompute failed: ' + (err?.message || 'unknown error'));
    }
  };

  // ------------------------------ Guard ------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <TrophyIcon className="w-12 h-12 mx-auto text-amber-400 mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Admin Access Required</h2>
          <p className="text-slate-600 mb-4">AI Champion analytics are restricted to administrators.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const podium = champion?.podium || [];
  const top = champion?.champion;
  const ranked = leaderboard?.results || [];
  const totals = costReport?.totals || {};
  const byProvider = costReport?.by_provider || [];
  const byApp = costReport?.by_application || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ------------------------------ Header ------------------------------ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                AI Champion of the Month
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Real-time engagement leaderboard · AI cost analytics · gamified recognition
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {TIME_WINDOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => setWindowId(w.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  windowId === w.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {w.label}
              </button>
            ))}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:border-slate-400 flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:border-slate-400 flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleRecompute}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5"
              title="Recompute previous month champion"
            >
              <SparklesIcon className="w-4 h-4" />
              Recompute
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ------------------------------ Champion banner ------------------------------ */}
        {top ? (
          <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 flex items-center gap-5">
                <div className={`p-1 rounded-full bg-gradient-to-br ${tierStyle(top.tier).ring} shadow-xl`}>
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white text-amber-600 text-3xl md:text-4xl font-black flex items-center justify-center">
                    {getInitials(top.user?.name, top.user?.email)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-80 mb-1">
                    {champion.live ? 'Live · current month-to-date' : `Champion · ${champion.period?.year}-${String(champion.period?.month).padStart(2, '0')}`}
                  </div>
                  <div className="text-2xl md:text-3xl font-black">{top.user?.name || top.user?.email}</div>
                  <div className="text-sm opacity-90 mt-0.5">{top.user?.email}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">
                      {tierStyle(top.tier).emoji} {top.tier_label || top.tier}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">
                      Score {Number(top.champion_score).toFixed(1)}/100
                    </span>
                  </div>
                  {top.citation && (
                    <p className="mt-3 text-sm opacity-95 max-w-xl">{top.citation}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <Stat label="AI Requests" value={fmtNum(top.stats?.total_ai_requests)} />
                <Stat label="Actions"     value={fmtNum(top.stats?.total_actions)} />
                <Stat label="Features"    value={fmtNum(top.stats?.distinct_features_used)} />
                <Stat label="AI Spend"    value={fmtUSD(top.stats?.total_ai_cost_usd)} />
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="rounded-3xl p-8 bg-slate-100 text-slate-500 text-center">
            No champion data yet. Once users start interacting with AI features, the leaderboard will populate.
          </div>
        )}

        {/* ------------------------------ Cost analytics ------------------------------ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            label={`Total AI Spend (${days}d)`}
            value={fmtUSD(totals.cost_usd)}
            tone={COST_TONE(totals.cost_usd)}
          />
          <KPICard
            icon={<BoltIcon className="w-5 h-5" />}
            label="AI Requests"
            value={fmtNum(totals.requests)}
            tone="text-blue-600"
          />
          <KPICard
            icon={<CpuChipIcon className="w-5 h-5" />}
            label="Total Tokens"
            value={fmtNum(totals.tokens)}
            tone="text-indigo-600"
          />
          <KPICard
            icon={<ChartBarIcon className="w-5 h-5" />}
            label="Avg Latency"
            value={`${Math.round(totals.avg_latency_ms || 0)} ms`}
            tone="text-slate-700"
          />
        </div>

        {/* ------------------------------ Cost breakdown rows ------------------------------ */}
        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="Cost by Provider" icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />}>
            {byProvider.length === 0 ? (
              <Empty text="No AI usage in this window." />
            ) : (
              <div className="space-y-2">
                {byProvider.map((r) => (
                  <BreakdownRow
                    key={r.provider}
                    label={r.provider}
                    cost={r.cost}
                    requests={r.requests}
                    max={byProvider[0]?.cost || 1}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Cost by Application" icon={<ChartBarIcon className="w-5 h-5 text-blue-600" />}>
            {byApp.length === 0 ? (
              <Empty text="No application-attributed AI usage yet." />
            ) : (
              <div className="space-y-2">
                {byApp.map((r) => (
                  <BreakdownRow
                    key={r.application}
                    label={r.application}
                    cost={r.cost}
                    requests={r.requests}
                    max={byApp[0]?.cost || 1}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ------------------------------ Podium ------------------------------ */}
        {podium.length > 0 && (
          <Panel title="Podium" icon={<TrophyIcon className="w-5 h-5 text-amber-500" />}>
            <div className="grid md:grid-cols-3 gap-4">
              {podium.slice(0, 3).map((p) => {
                const ts = tierStyle(p.tier);
                return (
                  <div key={p.rank} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-0.5 rounded-full bg-gradient-to-br ${ts.ring}`}>
                        <div className="w-12 h-12 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center">
                          {getInitials(p.user?.name, p.user?.email)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{p.user?.name || p.user?.email}</div>
                        <div className="text-xs text-slate-500 truncate">{p.user?.email}</div>
                      </div>
                      <div className="ml-auto text-2xl">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full border font-medium ${ts.pill}`}>{p.tier_label || p.tier}</span>
                      <span className="font-bold text-slate-700">{Number(p.champion_score).toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* ------------------------------ Leaderboard table ------------------------------ */}
        <Panel
          title={`Leaderboard · top ${ranked.length}`}
          icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
          right={<span className="text-xs text-slate-500">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span>}
        >
          {loading ? (
            <Empty text="Loading…" />
          ) : ranked.length === 0 ? (
            <Empty text="No engaged users yet for this window." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                    <th className="py-2 pr-3 text-right">AI Reqs</th>
                    <th className="py-2 pr-3 text-right">Tokens</th>
                    <th className="py-2 pr-3 text-right">Spend</th>
                    <th className="py-2 pr-3 text-right">Features</th>
                    <th className="py-2 pr-3 text-right">Success%</th>
                    <th className="py-2 pr-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((r) => {
                    const ts = tierStyle(r.tier);
                    return (
                      <tr key={r.user_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 pr-3 font-bold text-slate-500">{r.rank}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-0.5 rounded-full bg-gradient-to-br ${ts.ring}`}>
                              <div className="w-7 h-7 rounded-full bg-white text-[11px] font-bold text-slate-700 flex items-center justify-center">
                                {getInitials(r.user?.name, r.user?.email)}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 truncate max-w-[180px]">{r.user?.name || r.user?.email}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{r.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${ts.pill}`}>
                            {ts.emoji} {r.tier_label || r.tier}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(r.stats?.total_actions)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(r.stats?.total_ai_requests)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(r.stats?.total_tokens)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmtUSD(r.stats?.total_ai_cost_usd)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(r.stats?.distinct_features_used)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{Number(r.stats?.success_rate || 0).toFixed(1)}</td>
                        <td className="py-2 pr-3 text-right font-bold text-slate-800 tabular-nums">{Number(r.champion_score).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* ------------------------------ Hall of Fame ------------------------------ */}
        <Panel title="Hall of Fame" icon={<TrophyIcon className="w-5 h-5 text-amber-500" />}>
          {history.length === 0 ? (
            <Empty text="No prior champions yet — first month will be selected automatically on the 1st of next month." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map((h) => {
                const ts = tierStyle(h.tier);
                return (
                  <div key={`${h.period.year}-${h.period.month}`} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[11px] text-slate-500 mb-1">
                      {h.period.year}-{String(h.period.month).padStart(2, '0')}
                    </div>
                    <div className={`mx-auto p-0.5 rounded-full bg-gradient-to-br ${ts.ring} w-12 h-12`}>
                      <div className="w-full h-full rounded-full bg-white text-slate-700 text-xs font-bold flex items-center justify-center">
                        {getInitials(h.user?.name, h.user?.email)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-800 truncate">{h.user?.name || h.user?.email}</div>
                    <div className="text-[11px] text-slate-500">{Number(h.champion_score).toFixed(0)} pts</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* ------------------------------ Scoring transparency ------------------------------ */}
        {leaderboard?.weights && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Scoring formula:</span>{' '}
            {Object.entries(leaderboard.weights).map(([k, v], i, arr) => (
              <span key={k}>
                <span className="text-slate-700 font-medium">{k}</span> × {(v * 100).toFixed(0)}%
                {i < arr.length - 1 ? ' + ' : ''}
              </span>
            ))}
            <span className="mx-2">·</span>
            All weights and badge tiers are soft-coded in <code>apps/rbac/ai_champion_service.py</code>.
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const Stat = ({ label, value }) => (
  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
    <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
    <div className="text-xl font-bold tabular-nums">{value}</div>
  </div>
);

const KPICard = ({ icon, label, value, tone = 'text-slate-700' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-xs">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
  </div>
);

const Panel = ({ title, icon, right, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
    <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
      {icon}
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <div className="ml-auto">{right}</div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Empty = ({ text }) => (
  <div className="text-sm text-slate-400 text-center py-6">{text}</div>
);

const BreakdownRow = ({ label, cost, requests, max }) => {
  const pct = max > 0 ? Math.max(2, Math.round((Number(cost) / Number(max)) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-0.5">
        <span className="font-medium text-slate-700 capitalize">{label}</span>
        <span className="text-slate-500">
          <span className="tabular-nums">{fmtNum(requests)}</span> reqs ·{' '}
          <span className="tabular-nums font-semibold text-slate-700">{fmtUSD(cost)}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default AIChampion;
