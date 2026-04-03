import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import CrossRecommendationPanel from '../../../components/recommendations/CrossRecommendationPanel';
import {
  Upload as UploadIcon, FileText, CheckCircle, AlertTriangle,
  Loader, X, Download, Activity, Shield, GitBranch, Cpu, Clock,
  RefreshCw, FolderPlus, Package, Layers, ChevronRight, Edit,
  Trash2, ArrowLeft, BarChart2, Save, Zap, Tag, Link, Sliders,
  Ruler, ScanLine, Brain, CircleDot, Type, ChevronDown, ChevronUp,
  Lightbulb, Eye, EyeOff, Hash, ClipboardList, Boxes,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & layout primitives  (identical to PIDUpload.jsx)
// ─────────────────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.06)} }
  @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.04)} }
  @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,35px) scale(1.05)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes scanLine { 0%{top:0%} 100%{top:100%} }
  @keyframes nodeGlow { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.35);opacity:1} }
  @keyframes factSlide { 0%{opacity:0;transform:translateY(8px)} 15%,85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
  @keyframes checkPop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes cardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pipeFlow { 0%{stroke-dashoffset:100} 100%{stroke-dashoffset:0} }
  @keyframes drillPulse { 0%,100%{transform:scaleY(1);opacity:0.8} 50%{transform:scaleY(1.15);opacity:1} }
  @keyframes dropletFall { 0%{transform:translateY(-8px);opacity:0} 60%{opacity:1} 100%{transform:translateY(8px);opacity:0} }
  @keyframes railIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes panelSlide { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
  @keyframes orbitA { 0%{transform:rotate(0deg) translateX(52px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(52px) rotate(-360deg)} }
  @keyframes orbitB { 0%{transform:rotate(120deg) translateX(52px) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(52px) rotate(-480deg)} }
  @keyframes orbitC { 0%{transform:rotate(240deg) translateX(52px) rotate(-240deg)} 100%{transform:rotate(600deg) translateX(52px) rotate(-600deg)} }
`;

const T = {
  bg:    'linear-gradient(135deg, #f8faff 0%, #eef2ff 45%, #f0f9ff 75%, #fffbeb 100%)',
  blobs: [
    { color:'rgba(59,130,246,0.09)',  size:'520px', top:'-80px',    left:'18%',    anim:'floatA 14s ease-in-out infinite'    },
    { color:'rgba(168,85,247,0.07)',  size:'430px', top:'28%',      right:'-60px', anim:'floatB 17s ease-in-out infinite'    },
    { color:'rgba(245,158,11,0.07)',  size:'380px', bottom:'-60px', left:'32%',    anim:'floatC 12s ease-in-out infinite'    },
    { color:'rgba(6,182,212,0.06)',   size:'300px', top:'62%',      left:'-40px',  anim:'floatA 10s ease-in-out infinite 3s' },
  ],
  card:  { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)' },
  cardH: { boxShadow:'0 10px 30px rgba(0,0,0,0.10),0 2px 8px rgba(0,0,0,0.05)', borderColor:'#93c5fd' },
  panel: { background:'rgba(255,255,255,0.85)', border:'1px solid #e8edf5', backdropFilter:'blur(12px)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  modal: { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  input: { background:'#f8fafc', border:'1px solid #e2e8f0' },
};

const DarkBg = ({ children }) => (
  <div className="min-h-screen relative overflow-hidden" style={{ background: T.bg }}>
    <style>{KEYFRAMES}</style>
    <div className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage:'radial-gradient(circle, rgba(99,102,241,0.055) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
    {T.blobs.map((b, i) => (
      <div key={i} className="absolute rounded-full pointer-events-none"
        style={{ width:b.size, height:b.size, top:b.top, bottom:b.bottom, left:b.left, right:b.right,
          background:`radial-gradient(circle, ${b.color} 0%, transparent 70%)`, animation:b.anim }} />
    ))}
    <div className="absolute inset-x-0 top-0 h-1 pointer-events-none"
      style={{ background:'linear-gradient(90deg,#3b82f6,#6366f1,#f59e0b,#3b82f6)', backgroundSize:'200% auto', animation:'gradShift 4s linear infinite' }} />
    <div className="relative z-10">{children}</div>
  </div>
);

const DarkModal = ({ show, onClose, title, subtitle, iconEl, children }) =>
  show ? (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      style={{ background:'rgba(15,23,42,0.45)' }}>
      <div className="rounded-2xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col" style={T.modal}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {iconEl}
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const API_PREFIX = `${API_BASE_URL}/pid-verification`;

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  major:    'bg-orange-100 text-orange-800 border-orange-300',
  minor:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  info:     'bg-green-100 text-green-800 border-green-300',
};

const CATEGORY_LABELS = {
  tag:          'Tag Issues',
  connectivity: 'Connectivity',
  valve:        'Valve & Equipment',
  line_size:    'Line Size',
};

// Soft-coded: categories excluded from the view, overlay, and PDF export.
// Extend this set to suppress additional categories without touching rule logic.
// 'connectivity' is excluded: orphan-node graph checks produce too many
// false-positives on scanned drawings and are not useful for process engineers.
const HIDDEN_CATEGORIES = new Set(['notes', 'connectivity']);

// Soft-coded: all rule IDs that represent duplicate pipeline line designations.
// Add new duplicate-detection rule IDs here to automatically propagate them to:
//   • the Duplicate Line Summary Banner above the report table
//   • sky-blue row highlight in the report table
//   • "Duplicate Line" sub-label in the Category column
//   • "Locate on drawing" button in the Evidence column
// No other code needs changing when a new rule is added.
const DUP_LINE_RULES = new Set(['LSZ-006', 'LSZ-007', 'LSZ-008', 'LSZ-009', 'LSZ-010']);

// Soft-coded: rule IDs that indicate a cloud-truncation duplicate (shown with
// a special amber badge in the Category column to draw reviewer attention).
const CLOUD_TRUNC_RULES = new Set(['LSZ-009']);

// Soft-coded: rule IDs that indicate a shared-suffix / copy-paste numbering error
// (LSZ-010 family — different pipeline identities sharing the same sequence suffix).
// These get an orange badge distinct from cloud-truncation (amber) and normal dup (sky).
const SHARED_SUFFIX_RULES = new Set(['LSZ-010']);

// ── Soft-coded duplicate-line highlight overlay appearance ───────────────────
// These constants control the glow rectangles drawn on the drawing image for
// every duplicate-line finding.  Adjust without touching any render logic.
//
//   DUP_HIGHLIGHT_W_PCT  / DUP_HIGHLIGHT_H_PCT
//       Width and height of each highlight box as a % of the drawing container.
//       Larger values create a wider "zone" marker; smaller values are more precise.
//
//   DUP_HIGHLIGHT_ALPHA
//       Background opacity of the highlight (0 = invisible, 1 = fully opaque).
//       0.15 is subtle enough to see the drawing underneath.
//
//   DUP_HIGHLIGHT_BORDER_PX
//       Border thickness in pixels.
//
// Colour per severity is computed dynamically from the finding.severity string;
// no constant needed — it maps to the same CSS palette used by the dot markers.
const DUP_HIGHLIGHT_W_PCT     = 7;    // box width  (% of drawing width)
const DUP_HIGHLIGHT_H_PCT     = 3.5;  // box height (% of drawing height)
const DUP_HIGHLIGHT_ALPHA     = 0.18; // fill opacity
const DUP_HIGHLIGHT_BORDER_PX = 2;    // border thickness in pixels
// Colour map: severity string -> { fill (RGB), border (RGB) }
// Soft-coded — add a new severity level here to extend colour support.
const DUP_HIGHLIGHT_COLORS = {
  critical: { fill: '220,38,38',   border: '185,28,28'   },  // red-600 / red-700
  major:    { fill: '249,115,22',  border: '234,88,12'   },  // orange-500 / orange-600
  minor:    { fill: '251,191,36',  border: '245,158,11'  },  // amber-400 / amber-500
  info:     { fill: '59,130,246',  border: '37,99,235'   },  // blue-500 / blue-600
};

const authHeader = () => {
  const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// SOFT-CODED: Processing loader configuration
// Edit ANALYSIS_STAGES to add/remove/reorder stages.
// Edit PID_FACTS to add engineering trivia shown during processing.
// ─────────────────────────────────────────────────────────────────────────────
const ANALYSIS_STAGES = [
  { id: 'ocr',        label: 'OCR text extraction',          icon: ScanLine,   durationMs: 6000  },
  { id: 'tags',       label: 'Tag pattern recognition',      icon: Tag,        durationMs: 8000  },
  { id: 'conn',       label: 'Connectivity graph build',     icon: Link,       durationMs: 10000 },
  { id: 'valves',     label: 'Valve & equipment checks',     icon: Sliders,    durationMs: 12000 },
  { id: 'linesizes',  label: 'Line size validation',         icon: Ruler,      durationMs: 15000 },
  { id: 'rules',      label: 'Deterministic rule engine',    icon: Brain,      durationMs: 18000 },
  { id: 'report',     label: 'Building findings report',     icon: FileText,   durationMs: 22000 },
];

const PID_FACTS = [
  'A typical offshore P&ID can contain 2,000+ instrument tags across 80+ drawings.',
  'ISA 5.1 defines the standard symbols for instruments used in P&IDs worldwide.',
  'Line designation tables link every pipe segment to its service, size and material.',
  'PSVs (Pressure Safety Valves) are critical — a missing or wrong tag is a Safety-critical finding.',
  'HOLD annotations mark items awaiting client or vendor approval before finalisation.',
  'DN (Diameter Nominal) and NPS (Nominal Pipe Size) use different numbering — DN50 ≈ NPS 2".',
  'Connectivity checks trace fluid paths from source to destination through all inline equipment.',
  'A 6" valve on a 4" line is a classic P&ID inconsistency that this engine catches automatically.',
  'IEC 62424 and ISO 10628-2 govern how P&IDs are structured for international projects.',
  'Early detection of tag duplicates can prevent costly field rework and commissioning delays.',
];

// ─────────────────────────────────────────────────────────────────────────────
// AnalysisLoader — shown while backend processes the P&ID
// Props: elapsedSec (number), fileName (string)
// ─────────────────────────────────────────────────────────────────────────────
const AnalysisLoader = ({ elapsedSec, fileName }) => {
  const [factIdx, setFactIdx] = React.useState(0);
  const [factKey, setFactKey] = React.useState(0);

  // Rotate facts every 5 seconds
  React.useEffect(() => {
    const t = setInterval(() => {
      setFactIdx(i => (i + 1) % PID_FACTS.length);
      setFactKey(k => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Which stages are "done" based on elapsed time
  const completedStages = ANALYSIS_STAGES.filter(s => elapsedSec * 1000 >= s.durationMs);
  const activeIdx = Math.min(completedStages.length, ANALYSIS_STAGES.length - 1);

  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  return (
    <div className="mt-5 rounded-2xl overflow-hidden border border-indigo-200"
      style={{ background: 'linear-gradient(135deg,#eef2ff 0%,#eff6ff 50%,#f0f9ff 100%)', animation: 'fadeUp 0.4s ease-out both' }}>

      {/* Top bar — timer + filename */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4 flex-wrap border-b border-indigo-100/60">
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-indigo-500" style={{ animation: 'pulse2 1.4s ease-in-out infinite' }} />
          <span className="text-sm font-bold text-slate-800">Analysing P&amp;ID…</span>
          {fileName && (
            <span className="text-xs text-slate-400 truncate max-w-[180px]">{fileName}</span>
          )}
        </div>
        {/* Elapsed timer */}
        <div className="flex items-center gap-1.5 bg-white/70 border border-indigo-200 rounded-xl px-3 py-1.5 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-sm font-bold text-indigo-700">{mins}:{secs}</span>
        </div>
      </div>

      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left — orbiting animation + central icon */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Centre circle */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center z-10"
              style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', boxShadow: '0 0 24px rgba(99,102,241,0.45)' }}>
              <Cpu className="w-7 h-7 text-white" />
            </div>
            {/* Orbiting dots */}
            {[
              { color: '#ef4444', anim: 'orbitA 2.4s linear infinite' },
              { color: '#f59e0b', anim: 'orbitB 2.4s linear infinite' },
              { color: '#10b981', anim: 'orbitC 2.4s linear infinite' },
            ].map((o, i) => (
              <span key={i} className="absolute w-3 h-3 rounded-full"
                style={{ background: o.color, animation: o.anim,
                  boxShadow: `0 0 8px ${o.color}`, top: '50%', left: '50%',
                  marginTop: '-6px', marginLeft: '-6px' }} />
            ))}
          </div>
          {/* Scan-line progress bar */}
          <div className="w-full relative h-2 bg-white/60 rounded-full overflow-hidden border border-indigo-100">
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-[2500ms] ease-out"
              style={{
                width: `${Math.min(98, (completedStages.length / ANALYSIS_STAGES.length) * 100 + 4)}%`,
                background: 'linear-gradient(90deg,#6366f1,#3b82f6,#06b6d4)',
                boxShadow: '0 0 8px rgba(99,102,241,0.5)',
              }} />
          </div>
          <p className="text-xs text-slate-500 text-center">
            {completedStages.length} of {ANALYSIS_STAGES.length} stages complete
          </p>
        </div>

        {/* Right — rule checklist */}
        <div className="space-y-1.5">
          {ANALYSIS_STAGES.map((stage, i) => {
            const done    = elapsedSec * 1000 >= stage.durationMs;
            const running = i === activeIdx && !done;
            const Icon    = stage.icon;
            return (
              <div key={stage.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-500 ${
                  done    ? 'bg-emerald-50/80 border border-emerald-200/60'
                  : running ? 'bg-indigo-50 border border-indigo-300/60'
                  :            'bg-white/40 border border-transparent'
                }`}>
                {done ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0"
                    style={{ animation: 'checkPop 0.35s ease-out both' }} />
                ) : running ? (
                  <Loader className="w-4 h-4 text-indigo-500 flex-shrink-0 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${
                  done ? 'text-emerald-700' : running ? 'text-indigo-700' : 'text-slate-400'
                }`}>{stage.label}</span>
                {done && (
                  <span className="ml-auto text-[10px] text-emerald-500 font-semibold">✓</span>
                )}
                {running && (
                  <span className="ml-auto text-[10px] text-indigo-400 font-semibold"
                    style={{ animation: 'pulse2 1s ease-in-out infinite' }}>running</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom — rotating P&ID fact */}
      <div className="px-5 pb-4">
        <div className="bg-white/60 border border-indigo-100 rounded-xl px-4 py-3 min-h-[52px] flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          <p key={factKey} className="text-xs text-slate-600 leading-relaxed"
            style={{ animation: 'factSlide 5s ease-in-out forwards' }}>
            <span className="font-semibold text-amber-600">Did you know? </span>
            {PID_FACTS[factIdx]}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IndexTagsEquipmentPanel — standalone component, no API calls, pure derivation
// ─────────────────────────────────────────────────────────────────────────────
const SEV_DOT = {
  critical: 'bg-red-500',
  major:    'bg-orange-400',
  minor:    'bg-yellow-400',
  info:     'bg-blue-400',
};
const SEV_PILL = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  major:    'bg-orange-100 text-orange-700 border-orange-200',
  minor:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  info:     'bg-blue-100 text-blue-700 border-blue-200',
};

function IndexTagsEquipmentPanel({ masterIndex, tagList, equipList, CATEGORY_LABELS, accent }) {
  const [sub, setSub]         = useState('index');  // 'index' | 'tags' | 'equip'
  const [search, setSearch]   = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const q = search.trim().toLowerCase();

  // filtered data for each sub-tab
  const filteredIndex = masterIndex.filter(r => {
    if (sevFilter !== 'all' && r.severity !== sevFilter) return false;
    if (!q) return true;
    return (r.issue || '').toLowerCase().includes(q) ||
           (r.evidence || '').toLowerCase().includes(q) ||
           (r.rule_id || '').toLowerCase().includes(q) ||
           (r.drawing || '').toLowerCase().includes(q);
  });
  const filteredTags  = tagList.filter(t =>
    !q || t.id.toLowerCase().includes(q)
  );
  const filteredEquip = equipList.filter(e =>
    !q || e.id.toLowerCase().includes(q)
  );

  const TABS = [
    { id:'index', label:'Index',     icon: Hash,          count: masterIndex.length },
    { id:'tags',  label:'Tag Nos.',  icon: Tag,           count: tagList.length },
    { id:'equip', label:'Equipment', icon: Boxes,         count: equipList.length },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', animation:'panelSlide 0.25s ease-out both' }}>

      {/* ── Panel header ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)' }}>
          <ClipboardList className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900">Index · Tags · Equipment</h2>
          <p className="text-xs text-slate-500">
            {masterIndex.length} findings · {tagList.length} tags · {equipList.length} equipment items
          </p>
        </div>
      </div>

      {/* ── Sub-tab switcher ── */}
      <div className="flex border-b border-slate-100 bg-slate-50/60">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = sub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setSub(t.id); setSearch(''); setSevFilter('all'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                active ? 'text-indigo-600 border-indigo-500 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
              }`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search bar (shared) ── */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={sub === 'index' ? 'Search findings, rules, drawing…' : sub === 'tags' ? 'Search tag IDs…' : 'Search equipment…'}
            className="w-full text-xs pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {sub === 'index' && (
          <select
            value={sevFilter}
            onChange={e => setSevFilter(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer hover:border-slate-400"
          >
            <option value="all">All</option>
            {['critical','major','minor','info'].map(s => (
              <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="overflow-y-auto" style={{ maxHeight:'65vh' }}>

        {/* ─ INDEX sub-tab ─ */}
        {sub === 'index' && (
          filteredIndex.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No findings match your filters.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                <tr>
                  {['#','Drawing','Rule','Severity','Finding'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredIndex.map((r, i) => (
                  <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">{r.globalIdx}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">{r.drawing}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">{r.rule_id}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${SEV_PILL[r.severity] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[r.severity] || 'bg-slate-400'}`} />
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 max-w-xs">
                      <span className="line-clamp-2">{r.issue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* ─ TAGS sub-tab ─ */}
        {sub === 'tags' && (
          filteredTags.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No instrument / equipment tag IDs detected in findings text.</div>
          ) : (
            <div className="p-4 grid gap-2" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))' }}>
              {filteredTags.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all p-3 flex flex-col gap-1.5 group">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{t.id}</code>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">
                      {t.drawings.length} dwg
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.severities.map(s => (
                      <span key={s} className={`text-[9px] font-bold px-1 py-0.5 rounded border ${SEV_PILL[s] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{s}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate" title={t.drawings.join(', ')}>
                    {t.drawings.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─ EQUIPMENT sub-tab ─ */}
        {sub === 'equip' && (
          filteredEquip.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No equipment items detected in findings text.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                <tr>
                  {['Equipment Tag','Type / Category','Referenced In'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEquip.map((e, i) => (
                  <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono font-bold text-slate-800">{e.id}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        {CATEGORY_LABELS[e.category] || e.category || 'Equipment'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {e.drawings.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

      </div>

      {/* ── Footer count bar ── */}
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
        <span style={{ color: accent }}>
          {sub === 'index' ? `${filteredIndex.length} of ${masterIndex.length} findings` :
           sub === 'tags'  ? `${filteredTags.length} of ${tagList.length} tags` :
                             `${filteredEquip.length} of ${equipList.length} items`}
        </span>
        {sub === 'index' && sevFilter !== 'all' && (
          <button onClick={() => setSevFilter('all')} className="text-indigo-500 hover:text-indigo-700 underline">clear filter</button>
        )}
      </div>

    </div>
  );
}

const PIDVerification = () => {

  // ── Project management state ──────────────────────────────────────────────
  const [projects,         setProjects]         = useState([]);
  const [loadingProjects,  setLoadingProjects]  = useState(true);
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [newProjectName,   setNewProjectName]   = useState('');
  const [newProjectDesc,   setNewProjectDesc]   = useState('');
  const [creatingProject,  setCreatingProject]  = useState(false);
  const [showEditModal,    setShowEditModal]     = useState(false);
  const [editingProject,   setEditingProject]   = useState(null);
  const [editName,         setEditName]         = useState('');
  const [editDesc,         setEditDesc]         = useState('');
  const [updatingProject,  setUpdatingProject]  = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);
  const [deletingProject,  setDeletingProject]  = useState(null);
  const [isDeleting,       setIsDeleting]       = useState(false);
  const [message,          setMessage]          = useState({ type: '', text: '' });

  // ── Upload / verification state ───────────────────────────────────────────
  const [file,         setFile]         = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [polling,      setPolling]      = useState(false);
  const [documentId,   setDocumentId]   = useState(null);
  const [docStatus,    setDocStatus]    = useState(null);
  const [results,      setResults]      = useState(null);
  const [error,        setError]        = useState('');
  const [activeDrawing,setActiveDrawing]= useState(null);
  const pollRef    = useRef(null);
  // ── Elapsed-time timer for the processing loader ──────────────────────────
  const [elapsedSec,   setElapsedSec]   = useState(0);
  const timerRef   = useRef(null);

  // ── Engineer review overrides ─────────────────────────────────────────────
  const [overrides,       setOverrides]       = useState({});
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overridesSaved,  setOverridesSaved]  = useState(false);  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadingPdf,  setDownloadingPdf]  = useState(false);
  const [lineTagsExpanded, setLineTagsExpanded] = useState(false);
  const [lineTagSearch,    setLineTagSearch]    = useState('');
  const [showLineTagOverlay, setShowLineTagOverlay] = useState(true);
  const [focusedLineTagKey,  setFocusedLineTagKey]  = useState(null);
  // Duplicate-line highlight overlay: semi-transparent glow rectangles drawn at
  // the exact OCR coordinates of every duplicate-line finding on the drawing.
  // Toggled independently from the dot markers so the engineer can switch it off
  // when the colour wash makes small details hard to read.
  const [showDupLineHighlights, setShowDupLineHighlights] = useState(true);
  // ── History (documents in project) ───────────────────────────────────────
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [legendFile,      setLegendFile]      = useState(null);
  const [legendKnowledge, setLegendKnowledge] = useState(null);
  const [buildingLegend,  setBuildingLegend]  = useState(false);
  const [runningCompare,  setRunningCompare]  = useState(false);
  const [comparison,      setComparison]      = useState(null);
  const [showUncertainHighlights, setShowUncertainHighlights] = useState(false);
  const [focusedFindingId, setFocusedFindingId] = useState(null);
  // ── Tag Naming & Acronym Check ────────────────────────────────────────────
  const [checkingNaming,   setCheckingNaming]   = useState(false);
  const [namingResults,    setNamingResults]    = useState(null);
  const [namingPanelOpen,  setNamingPanelOpen]  = useState(true);
  // ── Active panel (right-rail navigation) ─────────────────────────────────
  // 'drawing' | 'findings' | 'lines' | 'naming' | 'comparison' | 'cross'
  const [activePanel, setActivePanel] = useState('drawing');
  // ── Drawing image (lazy-loaded for overlay) ───────────────────────────────
  const [drawingImageUrl,     setDrawingImageUrl]     = useState(null);
  const [drawingImageLoading, setDrawingImageLoading] = useState(false);
  // ── Findings filters (soft-coded, additive) ───────────────────────────────
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('all');

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchProjects(); }, []);

  // ── Drawing image loader — refetch whenever the active drawing changes ─────
  useEffect(() => {
    let objectUrl = null;
    const docId = documentId || results?.document_id;
    if (!docId || !activeDrawingData) {
      setDrawingImageUrl(null);
      return;
    }
    const pageIndex = activeDrawingData.page_index ?? 0;
    setDrawingImageLoading(true);
    setDrawingImageUrl(null);
    axios.get(
      `${API_PREFIX}/drawing-image/${docId}/${pageIndex}/`,
      { headers: authHeader(), responseType: 'blob', timeout: 30000 }
    ).then(res => {
      objectUrl = URL.createObjectURL(res.data);
      setDrawingImageUrl(objectUrl);
    }).catch(() => {
      setDrawingImageUrl(null);
    }).finally(() => {
      setDrawingImageLoading(false);
    });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [documentId, activeDrawing, results?.document_id]);

  // ── Project API ───────────────────────────────────────────────────────────
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.get(`${API_PREFIX}/projects/`, { headers: authHeader() });
      setProjects(res.data || []);
    } catch (e) {
      flash('error', 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchHistory = async (projectId) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_PREFIX}/list/?project_id=${projectId}`, { headers: authHeader() });
      setHistory(res.data || []);
    } catch (e) {
      // non-fatal
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchLegendKnowledge = async () => {
    try {
      const res = await axios.get(`${API_PREFIX}/legend-knowledge/`, { headers: authHeader() });
      setLegendKnowledge(res.data?.legend_knowledge || null);
    } catch (_) {
      // non-fatal
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await axios.post(`${API_PREFIX}/projects/`, {
        project_name: newProjectName, description: newProjectDesc,
      }, { headers: authHeader() });
      const p = res.data;
      setProjects(prev => [p, ...prev]);
      setShowCreateModal(false);
      setNewProjectName(''); setNewProjectDesc('');
      flash('success', `Project "${p.project_name}" created`);
    } catch (e) {
      flash('error', e.response?.data?.project_name?.[0] || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setUpdatingProject(true);
    try {
      const res = await axios.put(`${API_PREFIX}/projects/${editingProject.project_id}/`, {
        project_name: editName, description: editDesc,
      }, { headers: authHeader() });
      setProjects(prev => prev.map(p => p.project_id === editingProject.project_id ? res.data : p));
      if (selectedProject?.project_id === editingProject.project_id) setSelectedProject(res.data);
      setShowEditModal(false);
      flash('success', 'Project updated');
    } catch (e) {
      flash('error', 'Failed to update project');
    } finally {
      setUpdatingProject(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_PREFIX}/projects/${deletingProject.project_id}/`, { headers: authHeader() });
      setProjects(prev => prev.filter(p => p.project_id !== deletingProject.project_id));
      setShowDeleteConfirm(false);
      flash('success', 'Project deleted');
    } catch (e) {
      flash('error', 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProject = (p) => {
    setSelectedProject(p);
    resetUpload();
    setResults(null);
    fetchHistory(p.project_id);
    fetchLegendKnowledge();
  };

  const handleBackToProjects = () => {
    clearInterval(pollRef.current);
    setSelectedProject(null);
    setHistory([]);
    resetUpload();
    setResults(null);
    setComparison(null);
    setLegendFile(null);
    setMessage({ type:'', text:'' });
  };

  const handleBuildLegend = async () => {
    if (!legendFile) {
      flash('error', 'Please choose a legend sheet file first.');
      return;
    }
    setBuildingLegend(true);
    try {
      const fd = new FormData();
      fd.append('file', legendFile);
      const res = await axios.post(`${API_PREFIX}/legend-knowledge/build/`, fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setLegendKnowledge(res.data?.legend_knowledge || null);
      flash('success', 'Legend knowledge updated and stored for future recognition.');
    } catch (e) {
      flash('error', e?.response?.data?.error || 'Failed to build legend knowledge');
    } finally {
      setBuildingLegend(false);
    }
  };

  // ── Tag Naming & Acronym Check handler ───────────────────────────────────
  // Soft-coded: page_index = 0 (first drawing page) and run_ai = true.
  // Change these defaults here without touching any backend code.
  const NAMING_CHECK_PAGE  = 0;
  const NAMING_CHECK_RUN_AI = true;

  const runNamingCheck = async () => {
    const docId = documentId || results?.document_id;
    if (!docId) { flash('error', 'No processed document available.'); return; }
    if (checkingNaming) return;
    setCheckingNaming(true);
    setNamingResults(null);
    try {
      const res = await axios.post(
        `${API_PREFIX}/check-naming/${docId}/`,
        { page_index: NAMING_CHECK_PAGE, run_ai: NAMING_CHECK_RUN_AI },
        { headers: authHeader(), timeout: 180000 },
      );
      setNamingResults(res.data);
      setNamingPanelOpen(true);
      const total = res.data?.total ?? 0;
      flash(total > 0 ? 'error' : 'success',
        total > 0
          ? `Naming check found ${total} issue${total !== 1 ? 's' : ''} — see panel below`
          : 'Naming check passed — no naming or acronym violations detected');
    } catch (e) {
      flash('error', e?.response?.data?.error || 'Naming check failed — ' + e.message);
    } finally {
      setCheckingNaming(false);
    }
  };

  const runAccuracyCompare = async () => {
    const docId = documentId || results?.document_id;
    if (!docId) {
      flash('error', 'No processed document available for comparison.');
      return;
    }
    setRunningCompare(true);
    try {
      const res = await axios.post(`${API_PREFIX}/compare/${docId}/`, {}, { headers: authHeader(), timeout: 180000 });
      setComparison(res.data?.comparison || null);
      flash('success', 'Legend-backed accuracy comparison completed.');
    } catch (e) {
      flash('error', e?.response?.data?.error || 'Failed to run accuracy comparison');
    } finally {
      setRunningCompare(false);
    }
  };

  // ── Upload / verification API ─────────────────────────────────────────────
  const handleFileChange = (e) => { setFile(e.target.files[0] || null); setError(''); };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(''); }
  }, []);

  const handleUpload = async () => {
    if (!file) { setError('Please select a P&ID file first.'); return; }
    setError(''); setUploading(true); setResults(null); setDocStatus(null); setDocumentId(null);

    const fd = new FormData();
    fd.append('file', file);
    if (selectedProject) fd.append('project_id', selectedProject.project_id);

    try {
      const res = await axios.post(`${API_PREFIX}/upload-pid/`, fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const { document_id, status: s } = res.data;
      setDocumentId(document_id);
      setDocStatus(s);
      if (s === 'completed') {
        await fetchResults(document_id);
      } else {
        startPolling(document_id);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const startPolling = (docId) => {
    setPolling(true);
    setElapsedSec(0);
    // Start the elapsed-time ticker (1 s resolution, purely cosmetic)
    timerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1);
    }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_PREFIX}/status/${docId}/`, { headers: authHeader(), timeout: 15000 });
        const s = res.data.status;
        setDocStatus(s);
        if (s === 'completed') {
          clearInterval(pollRef.current); clearInterval(timerRef.current); setPolling(false);
          await fetchResults(docId);
          if (selectedProject) fetchHistory(selectedProject.project_id);
        } else if (s === 'failed') {
          clearInterval(pollRef.current); clearInterval(timerRef.current); setPolling(false);
          setError(res.data.error_message || 'Processing failed.');
        }
      } catch (_) {}
    }, 3000);
  };

  const fetchResults = async (docId) => {
    try {
      const res = await axios.get(`${API_PREFIX}/results/${docId}/`, { headers: authHeader(), timeout: 30000 });
      setResults(res.data);
      if (res.data.drawings?.length > 0) setActiveDrawing(res.data.drawings[0].drawing_id);
    } catch (e) {
      setError('Failed to load results.');
    }
  };

  const resetUpload = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    setFile(null); setDocumentId(null); setDocStatus(null);
    setError(''); setPolling(false); setActiveDrawing(null);
    setElapsedSec(0);
    setOverrides({}); setOverridesSaved(false);
    setComparison(null);
  };

  const handleOverrideChange = (findingId, field, value) => {
    setOverrides(prev => ({ ...prev, [findingId]: { ...prev[findingId], [field]: value } }));
    setOverridesSaved(false);
  };

  const handleSaveOverrides = async () => {
    setSavingOverrides(true);
    const count = Object.keys(overrides).length;
    try {
      await Promise.all(
        Object.entries(overrides).map(([id, changes]) =>
          axios.patch(`${API_PREFIX}/findings/${id}/`, changes, { headers: authHeader() })
        )
      );
      setOverridesSaved(true);
      setOverrides({});
      await fetchResults(documentId);
      flash('success', `${count} finding${count !== 1 ? 's' : ''} updated — exports will reflect your review`);
    } catch (e) {
      flash('error', 'Failed to save overrides');
    } finally {
      setSavingOverrides(false);
    }
  };

  const downloadExcel = async () => {
    if (downloadingXlsx) return;
    setDownloadingXlsx(true);
    try {
      const res = await axios.get(`${API_PREFIX}/export/excel/${documentId}/`, {
        headers: { ...authHeader() },
        responseType: 'blob',
        timeout: 120000,
      });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      const safeName = (results?.file_name || documentId).replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
      a.href     = url;
      a.download = `pidv_findings_${safeName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      flash('error', 'Excel export failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setDownloadingXlsx(false);
    }
  };

  const downloadPDF = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const res = await axios.get(`${API_PREFIX}/export/pdf/${documentId}/`, {
        headers: { ...authHeader() },
        responseType: 'blob',
        timeout: 120000,
      });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      const safeName = (results?.file_name || documentId).replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
      a.href     = url;
      a.download = `pidv_report_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      flash('error', 'PDF export failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type:'', text:'' }), 3500);
  };

  const activeDrawingData = results?.drawings?.find(d => d.drawing_id === activeDrawing);
  const extractionSummary = activeDrawingData?.metadata?.extraction_summary || null;

  // Override-aware helpers — use local draft until saved
  const getVal = (f, field) => overrides[f.id]?.[field] ?? f[field];
  const pendingCount = Object.keys(overrides).length;
  const allIssues    = results?.drawings?.flatMap(d => d.issues ?? []) ?? [];
  const totalIssues   = results?.total_issues ?? allIssues.length;
  const criticalCount = allIssues.filter(f => getVal(f, 'severity') === 'critical').length;
  const majorCount    = allIssues.filter(f => getVal(f, 'severity') === 'major').length;

  // Soft-coded overlay helpers (frontend only): infer confidence and pseudo-position from evidence.
  const bandRank = { low: 1, medium: 2, high: 3 };

  const detectConfidenceBand = (finding) => {
    const txt = `${finding.issue_observed || ''}`;
    const explicit = txt.match(/confidence:\s*(high|medium|low)/i)?.[1]?.toLowerCase();
    if (explicit) return explicit;

    const sev = getVal(finding, 'severity');
    if (sev === 'critical' || sev === 'major') return 'high';
    if (sev === 'minor') return 'medium';
    return 'low';
  };

  const inferEvidenceKey = (finding) => {
    if (finding.evidence?.trim()) return finding.evidence.trim();
    const quoted = (finding.issue_observed || '').match(/'([^']+)'/)?.[1];
    if (quoted) return quoted;
    return `${finding.rule_id}-${finding.sl_no}`;
  };

  const stableUnit = (str, salt) => {
    let h = 2166136261 ^ salt;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const n = (h >>> 0) % 10000;
    return n / 10000;
  };

  const buildOverlayNodes = (issues = []) => {
    // v4: real coords (exact) > NPS extracted from evidence string > hash fallback.
    const realPositions = activeDrawingData?.metadata?.tag_positions || {};

    // Normalize curly/smart quotes → straight ASCII " for consistent key lookup.
    const normKey = (k) =>
      (k || '').replace(/[\u201c\u201d\u2018\u2019]/g, '"').trim();

    // Extract all NPS pipe-size keys from an evidence string.
    // Handles both straight (") and smart (" ") quote characters.
    // e.g. 'SUCTION KOD 6" 4"-BD-4860-033842-X-N ...' -> ['6"', '4"']
    const extractNpsKeys = (str) => {
      const keys = [];
      // Original proven regex: \b ensures we match NPS sizes as standalone
      // tokens (avoids false matches inside longer numbers).
      // Character class: straight quote, two smart-quote Unicode variants.
      const re = /\b(\d+(?:\.\d+)?)\s*["\u201c\u201d\u2033]/g;
      let m;
      while ((m = re.exec(str)) !== null) {
        keys.push(m[1] + '"');        // normalise to straight quote (matches backend key format)
      }
      return [...new Set(keys)];
    };

    // Soft-coded: regex that matches ISA 5.1-style instrument / equipment tag IDs.
    // Covers: PI-3610-16, FV-001, LT-42A, TIC-101, PSV-1234A, FE-3610-16-01, etc.
    // Add new patterns here to extend instrument tag resolution without changing render logic.
    const INSTR_TAG_RE = /\b([A-Z]{1,4}[A-Z]?)\s*[-–]\s*(\d{2,6}(?:[A-Z]?(?:[-–]\d{1,4})?)?)\b/g;

    const extractInstrTags = (str) => {
      const tags = [];
      const re = new RegExp(INSTR_TAG_RE.source, 'g');
      let m;
      while ((m = re.exec(str)) !== null) {
        const canonical = `${m[1]}-${m[2]}`; // e.g. "PI-3610-16"
        tags.push(canonical);
        tags.push(m[0].trim()); // raw match (might have spaces around dash)
        // Some backends store without sub-suffix: PI-3610
        const short = `${m[1]}-${m[2].split(/[-–]/)[0]}`;
        if (short !== canonical) tags.push(short);
      }
      return [...new Set(tags)];
    };

    // Resolve the best real position for a finding.
    // Priority 1 : exact normalised key match
    // Priority 2 : NPS size keys extracted from evidence (e.g. "8\"", "3\"")
    // Priority 3 : instrument / equipment tag IDs extracted from evidence (e.g. "PI-3610-16")
    // Priority 4 : null → hash-based heuristic position
    const resolveReal = (nk, rawKey) => {
      // P1: exact match on normalised key or original raw key
      let r = realPositions[nk] ?? realPositions[rawKey] ?? null;
      if (r) return r;

      // P2: NPS size keys — try both the normalised key and original raw string
      //     so that smart-quote variants don't slip through normalisation
      for (const src of [nk, rawKey]) {
        for (const nps of extractNpsKeys(src)) {
          r = realPositions[nps] ?? realPositions[normKey(nps)] ?? null;
          if (r) return r;
        }
      }

      // P3: instrument / equipment tag IDs extracted from evidence text
      for (const src of [nk, rawKey]) {
        for (const tag of extractInstrTags(src)) {
          r = realPositions[tag] ?? realPositions[normKey(tag)] ?? null;
          if (r) return r;
        }
      }

      return null;
    };

    // Group findings by normalised evidence key; keep highest-severity band.
    const grouped = new Map();
    for (const f of issues) {
      const rawKey = inferEvidenceKey(f);
      const nk = normKey(rawKey);
      const band = detectConfidenceBand(f);
      const cur = grouped.get(nk);
      if (!cur || bandRank[band] > bandRank[cur.band]) {
        grouped.set(nk, { finding: f, band, key: nk, rawKey });
      }
    }

    const nodes = [];
    for (const [nk, x] of grouped) {
      const real = resolveReal(nk, x.rawKey);

      // One marker per unique finding group — use primary coord (x_pct/y_pct).
      // real.all contains every OCR occurrence; we intentionally ignore it here
      // so that dot count == finding count, not occurrence count.
      if (real) {
        const xp = real.x_pct ?? real.all?.[0]?.x_pct;
        const yp = real.y_pct ?? real.all?.[0]?.y_pct;
        nodes.push({
          ...x,
          left: Math.min(95, Math.max(5, xp)),
          top:  Math.min(95, Math.max(5, yp)),
          anchored: true,
        });
      } else {
        // Deterministic pseudo-position from FNV-1a hash (dashed marker).
        const seed = `${activeDrawing || 'drawing'}:${nk}`;
        nodes.push({
          ...x,
          left: 8  + (stableUnit(seed, 11) * 84),
          top:  10 + (stableUnit(seed, 29) * 78),
          anchored: false,
        });
      }
    }
    return nodes;
  };

  const overlayNodes = buildOverlayNodes(
    (activeDrawingData?.issues || []).filter(f => !HIDDEN_CATEGORIES.has(f.category))
  );
  const visibleOverlayNodes = overlayNodes.filter(n => showUncertainHighlights || n.band !== 'low');

  const jumpToFinding = (findingId) => {
    setFocusedFindingId(findingId);
    const el = document.getElementById(`finding-row-${findingId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Flash banner
  // ─────────────────────────────────────────────────────────────────────────
  const FlashBanner = () => message.text ? (
    <div className={`mb-5 p-4 rounded-xl border flex items-center gap-3 ${
      message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm">{message.text}</span>
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 1 — Project selection
  // ─────────────────────────────────────────────────────────────────────────
  if (!selectedProject) {
    return (
      <DarkBg>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page header */}
          <div className="mb-10" style={{ animation:'fadeUp 0.6s ease-out both' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 rounded-full" style={{ background:'linear-gradient(180deg,#3b82f6,#6366f1)' }} />
              <span className="text-blue-600 text-xs font-bold tracking-[0.3em] uppercase">AIFlow · Engineering Suite</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              P&amp;ID Verification
              <span className="block" style={{ background:'linear-gradient(90deg,#3b82f6,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Quality Checker
              </span>
            </h1>
            <p className="text-slate-500 max-w-xl text-sm sm:text-base">
              Deterministic rule engine — 20+ engineering compliance checks per drawing. Tag, connectivity, valve &amp; line size validation.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon:'🏷️', label:'Tag Validation',      cls:'bg-blue-50 border-blue-200 text-blue-700'       },
                { icon:'🔗', label:'Connectivity Checks',  cls:'bg-indigo-50 border-indigo-200 text-indigo-700' },
                { icon:'🔧', label:'Valve Compliance',     cls:'bg-purple-50 border-purple-200 text-purple-700' },
                { icon:'📐', label:'Line Size Rules',      cls:'bg-amber-50 border-amber-200 text-amber-700'    },
              ].map(b => (
                <span key={b.label} className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-medium ${b.cls}`}>
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </div>

          <FlashBanner />

          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <p className="text-slate-500 text-sm">
              {projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''} — select one to upload a drawing` : 'Create your first project to get started'}
            </p>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-all text-sm text-white hover:-translate-y-px"
              style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
              <FolderPlus className="w-4 h-4" />New Project
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-2 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Loading projects…</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={T.card}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-50 border border-blue-100">
                <Package className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Projects Yet</h3>
              <p className="text-slate-500 text-sm mb-6">Create a project to start uploading and verifying P&amp;ID drawings</p>
              <button onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-white hover:-translate-y-px transition-all"
                style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
                <FolderPlus className="w-5 h-5" />Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {projects.map((p, idx) => (
                <div key={p.project_id} onClick={() => handleSelectProject(p)}
                  className="group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 overflow-hidden"
                  style={{ ...T.card, animation:`fadeUp 0.5s ease-out ${idx * 0.07}s both` }}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, T.cardH)}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = T.card.boxShadow; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background:'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-1">{p.project_name}</h3>
                  {p.description && <p className="text-xs text-slate-400 line-clamp-2 mb-4">{p.description}</p>}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mb-4">
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{p.document_count ?? 0} drawings</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={ev => { ev.stopPropagation(); setEditingProject(p); setEditName(p.project_name); setEditDesc(p.description||''); setShowEditModal(true); }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                      <Edit className="w-3.5 h-3.5" />Edit
                    </button>
                    <button onClick={ev => { ev.stopPropagation(); setDeletingProject(p); setShowDeleteConfirm(true); }}
                      className="flex-1 px-3 py-1.5 bg-red-50 border border-red-100 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create modal */}
          <DarkModal show={showCreateModal} onClose={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
            title="Create New Project" subtitle="Set up a folder for your P&ID verification drawings"
            iconEl={<div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center"><FolderPlus className="w-4 h-4 text-blue-600" /></div>}>
            <form onSubmit={handleCreateProject} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Project Name *</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g., ADNOC Trunkline Project"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-400/40 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all" style={T.input} required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief project description…" rows="3"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-400/40 text-slate-900 placeholder-slate-400 text-sm resize-none outline-none transition-all" style={T.input} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={creatingProject}
                  className="flex-1 px-4 py-2.5 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-px"
                  style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                  {creatingProject ? <><Loader className="w-4 h-4 animate-spin" />Creating…</> : <><CheckCircle className="w-4 h-4" />Create Project</>}
                </button>
              </div>
            </form>
          </DarkModal>

          {/* Edit modal */}
          <DarkModal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project"
            iconEl={<div className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center"><Edit className="w-4 h-4 text-indigo-600" /></div>}>
            <form onSubmit={handleUpdateProject} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Project Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-400/40 text-slate-900 text-sm outline-none transition-all" style={T.input} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows="3"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-400/40 text-slate-900 text-sm resize-none outline-none transition-all" style={T.input} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={updatingProject}
                  className="flex-1 px-4 py-2.5 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-px"
                  style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                  {updatingProject ? <><Loader className="w-4 h-4 animate-spin" />Updating…</> : 'Update Project'}
                </button>
              </div>
            </form>
          </DarkModal>

          {/* Delete confirm */}
          <DarkModal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Project"
            iconEl={<div className="w-9 h-9 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-500" /></div>}>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-slate-600 mb-1">Permanently deleting:</p>
              <p className="font-bold text-slate-900">{deletingProject?.project_name}</p>
              <p className="text-xs text-red-500 mt-2">All drawings in this project will become unassigned. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
                {isDeleting ? <><Loader className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </DarkModal>

        </div>
      </DarkBg>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 2 — Upload + Results (inside a project)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DarkBg>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-6">

        {/* ── Dashboard hero header ────────────────────────────────────────── */}
        <div className="rounded-2xl mb-6 overflow-hidden" style={{ background:'linear-gradient(135deg,rgba(239,246,255,0.98),rgba(238,242,255,0.98))', border:'1px solid #bfdbfe', backdropFilter:'blur(16px)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', animation:'fadeUp 0.4s ease-out both' }}>
          <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
            {/* Back */}
            <button onClick={handleBackToProjects}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all text-sm shadow-sm flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />Projects
            </button>
            <div className="w-px h-8 bg-blue-200 flex-shrink-0 hidden sm:block" />
            {/* Project icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-bold tracking-widest uppercase leading-none mb-0.5">P&amp;ID Quality Review · Engineering Suite</p>
              <h1 className="text-xl font-black text-slate-900 truncate leading-tight">{selectedProject.project_name}</h1>
            </div>
            {/* Feature pills */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {[
                { label:'20+ Checks', cls:'text-blue-700 bg-blue-50 border-blue-200' },
                { label:'ISA-5.1',    cls:'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { label:'AI Vision',  cls:'text-purple-700 bg-purple-50 border-purple-200' },
              ].map(p => (
                <span key={p.label} className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${p.cls}`}>{p.label}</span>
              ))}
            </div>
            {/* History */}
            <button onClick={() => fetchHistory(selectedProject.project_id)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all text-sm shadow-sm flex-shrink-0">
              <BarChart2 className="w-4 h-4" />History
            </button>
          </div>
          {/* Animated accent line */}
          <div className="h-0.5" style={{ background:'linear-gradient(90deg,#3b82f6,#6366f1,#a855f7,#3b82f6)', backgroundSize:'200% auto', animation:'gradShift 4s linear infinite' }} />
        </div>

        <FlashBanner />

        {/* Upload card — two-column on lg+ screens */}
        {!results && (
          <div className="rounded-2xl p-5 sm:p-6 mb-5" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ── Left: drop-zone + selected file chip ─────────────── */}
              <div className="flex flex-col gap-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">P&amp;ID Drawing (PDF) *</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('pidv-file-input').click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer flex-1 ${
                    dragOver ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-200/60'
                    : file    ? 'border-emerald-400 bg-emerald-50'
                    :            'border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/40'
                  }`}>
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                    dragOver ? 'bg-amber-100 animate-bounce' : file ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    {file ? <FileText className="w-7 h-7 text-emerald-500" /> : <UploadIcon className={`w-7 h-7 ${dragOver ? 'text-amber-500' : 'text-blue-500'}`} />}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    {file ? file.name : dragOver ? 'Drop your P&ID here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-slate-400">{file ? `${(file.size/1024/1024).toFixed(2)} MB` : 'PDF, PNG, JPG, TIFF, DWG · Max 50 MB'}</p>
                  <input id="pidv-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.dwg" className="hidden" onChange={handleFileChange} />
                </div>
                {file && (
                  <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-4 py-2.5">
                    <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-800 truncate flex-1">{file.name}</span>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right: legend knowledge panel ────────────────────── */}
              <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 h-fit">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                  style={{ background:'linear-gradient(135deg,#f8faff,#eef2ff)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-none">Legend Knowledge</p>
                    <p className="text-xs text-slate-400 mt-0.5">Upload once · reuse across all drawings in this project</p>
                  </div>
                </div>
                <div className="p-4 bg-white flex flex-col gap-3">
                  {/* Prefix counters */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500">Instrument prefixes</span>
                      <span className="text-sm font-bold text-slate-700 ml-2">{legendKnowledge?.instrument_prefixes?.length ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500">Valve prefixes</span>
                      <span className="text-sm font-bold text-slate-700 ml-2">{legendKnowledge?.valve_prefixes?.length ?? 0}</span>
                    </div>
                  </div>
                  {/* File picker */}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setLegendFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {/* Build button */}
                  <button
                    onClick={handleBuildLegend}
                    disabled={buildingLegend || !legendFile}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-px"
                    style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 3px 10px rgba(37,99,235,0.25)' }}
                  >
                    {buildingLegend ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {buildingLegend ? 'Building…' : 'Build Legend Knowledge'}
                  </button>
                  {legendKnowledge?.sources?.length > 0 && (
                    <p className="text-xs text-slate-400">
                      Sources: {legendKnowledge.sources.join(', ')}
                    </p>
                  )}
                </div>
              </div>

            </div>{/* end grid */}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button onClick={handleUpload} disabled={uploading || !file}
              className={`mt-4 w-full py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                uploading || !file ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'text-white shadow-lg hover:-translate-y-px active:translate-y-0'
              }`}
              style={uploading || !file ? undefined : { background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
              {uploading ? <><Loader className="w-4 h-4 animate-spin" />Uploading…</> : <><Cpu className="w-4 h-4" />Run P&amp;ID Verification</>}
            </button>

            {(polling || docStatus === 'processing') && (
              <AnalysisLoader elapsedSec={elapsedSec} fileName={file?.name} />
            )}
          </div>
        )}

        {/* Results panel — icon rail navigation */}
        {results && (() => {
          // ── Soft-coded panel definitions ──────────────────────────────────
          // Add a new entry here to add a new panel tab. No other code changes needed.
          const PANELS = [
            {
              id: 'drawing',
              label: 'Drawing',
              icon: ({ cls }) => (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={cls}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9"/><circle cx="15" cy="15" r="2" /><path d="M13.5 15h-7"/>
                </svg>
              ),
              badge: null,
              accent: '#3b82f6',
              glow: 'rgba(59,130,246,0.25)',
            },
            {
              id: 'findings',
              label: 'Findings',
              icon: ({ cls }) => <GitBranch className={cls} />,
              badge: totalIssues || null,
              badgeCls: totalIssues > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white',
              accent: '#ef4444',
              glow: 'rgba(239,68,68,0.25)',
            },
            {
              id: 'lines',
              label: 'Lines',
              icon: ({ cls }) => <Ruler className={cls} />,
              badge: (activeDrawingData?.metadata?.line_tags || []).length || null,
              badgeCls: 'bg-teal-500 text-white',
              accent: '#0d9488',
              glow: 'rgba(13,148,136,0.25)',
            },
            {
              id: 'naming',
              label: 'Naming',
              icon: ({ cls }) => <Type className={cls} />,
              badge: namingResults ? (namingResults.total || '✓') : null,
              badgeCls: namingResults?.total > 0 ? 'bg-violet-500 text-white' : 'bg-emerald-500 text-white',
              accent: '#7c3aed',
              glow: 'rgba(124,58,237,0.25)',
            },
            {
              id: 'comparison',
              label: 'Compare',
              icon: ({ cls }) => <Shield className={cls} />,
              badge: comparison ? '✓' : null,
              badgeCls: 'bg-teal-500 text-white',
              accent: '#0f766e',
              glow: 'rgba(15,118,110,0.25)',
            },
            {
              id: 'cross',
              label: 'Cross-Ref',
              icon: ({ cls }) => <Activity className={cls} />,
              badge: null,
              accent: '#f59e0b',
              glow: 'rgba(245,158,11,0.25)',
            },
            {
              id: 'index',
              label: 'Index',
              icon: ({ cls }) => <ClipboardList className={cls} />,
              badge: (() => {
                const allD = results?.drawings ?? [];
                const total = allD.reduce((s,d) => s + (d.issues?.length ?? 0), 0);
                return total || null;
              })(),
              badgeCls: 'bg-indigo-500 text-white',
              accent: '#6366f1',
              glow: 'rgba(99,102,241,0.25)',
            },
          ];

          const activePanelDef = PANELS.find(p => p.id === activePanel) || PANELS[0];

          return (
          <div className="flex gap-4 items-start flex-row-reverse" style={{ animation:'fadeUp 0.5s ease-out 0.05s both' }}>

            {/* CONTENT — visually right (flex-row-reverse puts DOM-first on right) */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* ── Sticky top stats bar ───────────────────────────────── */}
              <div className="rounded-2xl p-4" style={{ ...T.panel, animation:'fadeUp 0.4s ease-out 0.08s both' }}>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Icon + filename */}
                  <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                      style={{ background: totalIssues > 0 ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                               border: `1px solid ${totalIssues > 0 ? '#fca5a5' : '#86efac'}` }}>
                      {totalIssues > 0 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active File</p>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[220px]" title={results.file_name}>{results.file_name}</p>
                    </div>
                  </div>
                  {/* Separator */}
                  <div className="hidden sm:block w-px h-10 bg-slate-200 flex-shrink-0" />
                  {/* Stat chips */}
                  {[
                    { v: results.drawings?.length ?? 0, label:'Drawings', color:'text-blue-600', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.18)' },
                    { v: totalIssues, label:'Issues', color: totalIssues > 0 ? 'text-red-600' : 'text-green-600', bg: totalIssues > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: totalIssues > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)' },
                    { v: criticalCount, label:'Critical', color:'text-red-700', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.15)' },
                    { v: majorCount, label:'Major', color:'text-orange-600', bg:'rgba(234,88,12,0.08)', border:'rgba(234,88,12,0.15)' },
                    { v: (results.drawings ?? []).reduce((s,d) => s + (d.overrides_applied ?? 0), 0), label:'Overridden', color:'text-slate-600', bg:'rgba(100,116,139,0.08)', border:'rgba(100,116,139,0.15)' },
                  ].map(chip => (
                    <div key={chip.label} className="rounded-xl px-3 py-2 text-center flex-shrink-0"
                      style={{ background:chip.bg, border:`1px solid ${chip.border}`, minWidth:'62px' }}>
                      <p className={`font-bold text-lg leading-none ${chip.color}`}>{chip.v}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{chip.label}</p>
                    </div>
                  ))}
                  {/* Spacer + action buttons */}
                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <button onClick={downloadExcel} disabled={downloadingXlsx}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl transition-all hover:-translate-y-px disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#059669,#10b981)', boxShadow:'0 3px 10px rgba(16,185,129,0.25)' }}>
                      {downloadingXlsx ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Excel
                    </button>
                    <button onClick={downloadPDF} disabled={downloadingPdf}
                      className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl transition-all hover:-translate-y-px disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow:'0 3px 10px rgba(239,68,68,0.25)' }}>
                      {downloadingPdf ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      PDF
                    </button>
                    <button onClick={() => { resetUpload(); setResults(null); }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all">
                      <RefreshCw className="w-3.5 h-3.5" />New
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Drawing tabs (always visible when multiple drawings) ── */}
              {results.drawings?.length > 1 && (
                <div className="flex gap-2 flex-wrap" style={{ animation:'fadeUp 0.5s ease-out 0.12s both' }}>
                  {results.drawings.map(d => (
                    <button key={d.drawing_id} onClick={() => setActiveDrawing(d.drawing_id)}
                      className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
                        activeDrawing === d.drawing_id ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                      }`}
                      style={activeDrawing === d.drawing_id ? { background:'linear-gradient(135deg,#3b82f6,#6366f1)' } : undefined}>
                      {d.drawing_id}<span className={`ml-1.5 text-xs font-semibold ${activeDrawing === d.drawing_id ? 'text-blue-200' : 'text-slate-400'}`}>({d.issue_count})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── No drawings warning ─────────────────────────────────── */}
              {results.drawings?.length === 0 && (
                <div className="rounded-2xl p-6 border" style={{ ...T.panel }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">No drawing pages detected</h3>
                      <p className="text-xs text-slate-600 mt-1">Processing completed, but this file produced zero segmented drawings. Try re-uploading as PNG/JPG or use a PDF export with visible vector/text content.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════
                  PANEL BODIES — only the active one renders
              ════════════════════════════════════════════════ */}
              <div key={activePanel} style={{ animation:'panelSlide 0.25s ease-out both' }}>

              {/* ─── DRAWING panel ───────────────────────────────────── */}
              {activePanel === 'drawing' && activeDrawingData && (
              <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.1s both' }}>
                {/* Drawing panel header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{activeDrawing}</h2>
                      <p className="text-xs text-slate-500">{activeDrawingData.issues?.length ?? 0} findings · Drawing View</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overridesSaved && pendingCount === 0 && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />Review saved
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <>
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                          {pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''}
                        </span>
                        <button onClick={handleSaveOverrides} disabled={savingOverrides}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50 transition-all hover:-translate-y-px"
                          style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 2px 8px rgba(245,158,11,0.35)' }}>
                          {savingOverrides
                            ? <><Loader className="w-3 h-3 animate-spin" />Saving…</>
                            : <><Save className="w-3 h-3" />Save Review</>
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Drawing-panel stat chips */}
                <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="rounded-xl p-2.5 text-center" style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)' }}>
                    <p className="font-bold text-xl text-blue-600">{results.drawings?.length ?? 0}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Drawings</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: totalIssues > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border:`1px solid ${totalIssues > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}` }}>
                    <p className={`font-bold text-xl ${totalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalIssues}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Issues</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)' }}>
                    <p className="font-bold text-xl text-red-700">{criticalCount}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Critical</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background:'rgba(234,88,12,0.08)', border:'1px solid rgba(234,88,12,0.15)' }}>
                    <p className="font-bold text-xl text-orange-600">{majorCount}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Major</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background:'rgba(100,116,139,0.08)', border:'1px solid rgba(100,116,139,0.15)' }}>
                    <p className="font-bold text-xl text-slate-600">
                      {(results.drawings ?? []).reduce((s, d) => s + (d.overrides_applied ?? 0), 0)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Overridden</p>
                  </div>
                </div>

                {/* Extraction summary */}
                {extractionSummary && (
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Extraction Summary</p>
                      <p className="text-xs text-slate-500">Raw OCR length: {extractionSummary.raw_text_length ?? 0}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">Tags: <span className="font-bold text-slate-800">{extractionSummary.tags ?? 0}</span></div>
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">Instr: <span className="font-bold text-slate-800">{extractionSummary.instruments ?? 0}</span></div>
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">Valves: <span className="font-bold text-slate-800">{extractionSummary.valves ?? 0}</span></div>
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">Equip: <span className="font-bold text-slate-800">{extractionSummary.equipment ?? 0}</span></div>
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">Sizes: <span className="font-bold text-slate-800">{extractionSummary.line_sizes ?? 0}</span></div>
                      <div className={`rounded-lg px-2 py-1.5 border ${ (extractionSummary.line_tags ?? 0) > 0 ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600' }`}>
                        Line Tags: <span className="font-bold">{extractionSummary.line_tags ?? 0}</span>
                        {(extractionSummary.line_tags_multi_angle ?? 0) > 0 && (
                          <span className="ml-1 text-[10px] font-bold bg-teal-200 text-teal-800 px-1 rounded">H+V {extractionSummary.line_tags_multi_angle}</span>
                        )}
                      </div>
                    </div>
                    {extractionSummary.no_text_detected && (
                      <p className="mt-2 text-xs text-amber-600">No OCR text was detected on this page. The source may be low-contrast scan/title sheet.</p>
                    )}
                  </div>
                )}

                {/* Drawing Overlay */}
                {activeDrawingData.issues?.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-100 bg-white">
                    {/* ── Header row ── */}
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <div>
                        {(() => {
                          const hasReal = Object.keys(activeDrawingData?.metadata?.tag_positions || {}).length > 0;
                          return (
                            <>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Drawing Overlay
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${hasReal ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {hasReal ? 'Diagram-Anchored' : 'Heuristic'}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {hasReal
                                  ? 'Markers pinned to exact tag coordinates extracted from the drawing.'
                                  : 'No real coordinates — markers use stable heuristic positions. Re-process to anchor them.'}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={showUncertainHighlights}
                          onChange={e => setShowUncertainHighlights(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Show low-confidence
                      </label>
                    </div>

                    {/* ── Overlay legend ── */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[10px] text-slate-500">
                      {/* Severity colours */}
                      {[
                        { bg:'#dc2626', label:'Critical' },
                        { bg:'#f97316', label:'Major' },
                        { bg:'#fbbf24', label:'Minor' },
                        { bg:'#3b82f6', label:'Info' },
                      ].map(s => (
                        <span key={s.label} className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-full border border-white/50 flex-shrink-0" style={{ background:s.bg, boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                          {s.label}
                        </span>
                      ))}
                      <span className="w-px h-3 bg-slate-300 self-center" />
                      {/* Shape meanings */}
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-400 bg-slate-300 flex-shrink-0" />
                        Line / Valve / Tag
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 border-2 border-slate-400 bg-slate-300 flex-shrink-0" style={{ borderRadius:'2px', transform:'rotate(45deg)' }} />
                        Instrument / Equipment
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-dashed border-slate-400 flex-shrink-0" />
                        Heuristic (no coords)
                      </span>
                    </div>

                    {/* ── Drawing + overlay ── */}
                    {/* DEBUG: overlay node count — remove after confirming markers work */}
                    <div className="mb-2 text-[10px] text-slate-500 font-mono">
                      Overlay: {overlayNodes.length} total · {visibleOverlayNodes.length} visible
                      · {visibleOverlayNodes.filter(n => n.anchored).length} anchored
                      · {visibleOverlayNodes.filter(n => !n.anchored).length} heuristic
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                      {drawingImageLoading && (
                        <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs">
                          <Loader className="w-4 h-4 animate-spin" />Loading drawing…
                        </div>
                      )}

                      {!drawingImageLoading && !drawingImageUrl && (
                        <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs">
                          <AlertTriangle className="w-4 h-4" />Drawing preview unavailable
                        </div>
                      )}

                      {!drawingImageLoading && drawingImageUrl && (
                        <div className="overflow-auto" style={{ maxHeight: '72vh' }}>
                          <div className="relative w-full" style={{ lineHeight: 0 }}>
                            <img
                              src={drawingImageUrl}
                              alt={activeDrawing}
                              draggable={false}
                              className="w-full block"
                              style={{ height: 'auto', background: '#f8fafc', userSelect: 'none' }}
                            />
                            {/* Overlay wrapper */}
                            <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                              {visibleOverlayNodes.map((n) => {
                                const isFocused = focusedFindingId === n.finding.id;
                                const sev = (n.finding?.severity || '').toLowerCase();
                                const cat = (n.finding?.category || '').toLowerCase();

                                // Soft-coded: severity → fill/border colours
                                const SEV_COLOR = {
                                  critical: { bg:'#dc2626', border:'#991b1b', glow:'rgba(220,38,38,0.5)' },
                                  major:    { bg:'#f97316', border:'#c2410c', glow:'rgba(249,115,22,0.5)' },
                                  minor:    { bg:'#fbbf24', border:'#d97706', glow:'rgba(251,191,36,0.4)' },
                                  info:     { bg:'#3b82f6', border:'#1d4ed8', glow:'rgba(59,130,246,0.4)' },
                                };
                                const col = SEV_COLOR[sev] || SEV_COLOR.info;

                                // Soft-coded: category → shape
                                // line_size / valve / tag use circle; all other categories use diamond
                                const INSTR_CATS = new Set(['tag','valve','line_size']);
                                const isInstrEquip = !INSTR_CATS.has(cat);
                                // Scale factor for focus state (embedded in transform, avoids CSS scale property)
                                const scaleFactor = isFocused ? 1.6 : 1;
                                // Diamond = rotated square; circle = border-radius 50%
                                const shapeStyle = isInstrEquip
                                  ? { borderRadius:'3px', transform:`translate(-50%,-50%) rotate(45deg) scale(${scaleFactor})`, width:'13px', height:'13px' }
                                  : { borderRadius:'50%', transform:`translate(-50%,-50%) scale(${scaleFactor})`, width:'16px', height:'16px' };

                                const anchorStyle = n.anchored
                                  ? {}
                                  : { outline: '2px dashed rgba(100,116,139,0.7)', outlineOffset: '3px' };

                                return (
                                  <button
                                    key={n.key}
                                    onClick={() => jumpToFinding(n.finding.id)}
                                    title={`[${cat}] ${n.key} · ${n.finding.issue_observed}`}
                                    className={`absolute border-2 transition-all ${isFocused ? 'z-20 ring-4 ring-white/80' : 'z-10 hover:opacity-90'}`}
                                    style={{
                                      left: `${n.left}%`,
                                      top:  `${n.top}%`,
                                      backgroundColor: col.bg,
                                      borderColor: col.border,
                                      boxShadow: isFocused
                                        ? `0 0 0 4px ${col.glow}, 0 2px 8px rgba(0,0,0,0.5)`
                                        : `0 1px 4px rgba(0,0,0,0.4)`,
                                      pointerEvents: 'all',
                                      ...shapeStyle,
                                      ...anchorStyle,
                                    }}
                                  />
                                );
                              })}

                              {/* Duplicate-Line Highlight Overlay */}
                              {showDupLineHighlights && (() => {
                                const dupNodes = visibleOverlayNodes.filter(
                                  n => DUP_LINE_RULES.has(n.finding?.rule_id)
                                );
                                const ltags = activeDrawingData?.metadata?.line_tags || [];
                                const tagHighlights = [];
                                for (const tag of ltags) {
                                  if ((tag.count || (tag.occurrences || []).length) < 2) continue;
                                  for (const occ of (tag.occurrences || [])) {
                                    if (occ.x_pct == null || occ.y_pct == null) continue;
                                    tagHighlights.push({
                                      key: `th-${tag.text}-${occ.direction}-${occ.x_pct}`,
                                      left: Math.min(93, Math.max(7, occ.x_pct)),
                                      top:  Math.min(95, Math.max(5, occ.y_pct)),
                                      sev:  'minor',
                                      isTagOcc: true,
                                      label: tag.text,
                                    });
                                  }
                                }
                                return (
                                  <>
                                    {dupNodes.map(n => {
                                      const sev = (n.finding?.severity || 'info').toLowerCase();
                                      const col = DUP_HIGHLIGHT_COLORS[sev] || DUP_HIGHLIGHT_COLORS.info;
                                      const isFocused = focusedFindingId === n.finding.id;
                                      return (
                                        <div
                                          key={`dh-${n.key}`}
                                          title={`${n.finding.rule_id}: ${n.finding.issue_observed}`}
                                          style={{
                                            position: 'absolute',
                                            left:   `${n.left}%`,
                                            top:    `${n.top}%`,
                                            width:  `${DUP_HIGHLIGHT_W_PCT}%`,
                                            height: `${DUP_HIGHLIGHT_H_PCT}%`,
                                            transform: 'translate(-50%, -50%)',
                                            background: `rgba(${col.fill}, ${isFocused ? DUP_HIGHLIGHT_ALPHA * 2.5 : DUP_HIGHLIGHT_ALPHA})`,
                                            border: `${DUP_HIGHLIGHT_BORDER_PX}px solid rgba(${col.border}, ${isFocused ? 0.9 : 0.55})`,
                                            borderRadius: '4px',
                                            boxShadow: isFocused
                                              ? `0 0 0 3px rgba(${col.fill}, 0.35), 0 0 12px rgba(${col.fill}, 0.4)`
                                              : `0 0 6px rgba(${col.fill}, 0.25)`,
                                            pointerEvents: 'none',
                                            zIndex: isFocused ? 8 : 6,
                                            transition: 'all 0.15s',
                                          }}
                                        />
                                      );
                                    })}
                                    {tagHighlights.map(h => (
                                      <div
                                        key={h.key}
                                        title={`Duplicate tag: ${h.label}`}
                                        style={{
                                          position: 'absolute',
                                          left:   `${h.left}%`,
                                          top:    `${h.top}%`,
                                          width:  `${DUP_HIGHLIGHT_W_PCT * 1.1}%`,
                                          height: `${DUP_HIGHLIGHT_H_PCT}%`,
                                          transform: 'translate(-50%, -50%)',
                                          background: `rgba(14,165,233, ${DUP_HIGHLIGHT_ALPHA * 0.8})`,
                                          border: `${DUP_HIGHLIGHT_BORDER_PX}px solid rgba(3,105,161, 0.5)`,
                                          borderRadius: '4px',
                                          boxShadow: '0 0 5px rgba(14,165,233,0.3)',
                                          pointerEvents: 'none',
                                          zIndex: 6,
                                        }}
                                      />
                                    ))}
                                  </>
                                );
                              })()}

                              {/* Line Tag Duplicate Overlay */}
                              {showLineTagOverlay && (() => {
                                const ltags = activeDrawingData?.metadata?.line_tags || [];
                                if (ltags.length === 0) return null;
                                const occNodes = [];
                                for (const tag of ltags) {
                                  if ((tag.count || (tag.occurrences || []).length) < 2) continue;
                                  for (const occ of (tag.occurrences || [])) {
                                    if (occ.x_pct == null || occ.y_pct == null) continue;
                                    occNodes.push({
                                      tagKey: tag.text,
                                      direction: occ.direction,
                                      left: Math.min(95, Math.max(5, occ.x_pct)),
                                      top:  Math.min(95, Math.max(5, occ.y_pct)),
                                      multi: tag.multi_angle,
                                      label: `${tag.size} ${tag.fluid_code}-${tag.area_code}-${tag.sequence_no}`,
                                    });
                                  }
                                }
                                const connectors = [];
                                for (const tag of ltags) {
                                  if (!tag.multi_angle) continue;
                                  const occs = (tag.occurrences || []).filter(o => o.x_pct != null && o.y_pct != null);
                                  const hOcc = occs.find(o => o.direction === 'H');
                                  const vOcc = occs.find(o => o.direction === 'V');
                                  if (hOcc && vOcc) {
                                    connectors.push({
                                      x1: Math.min(95, Math.max(5, hOcc.x_pct)),
                                      y1: Math.min(95, Math.max(5, hOcc.y_pct)),
                                      x2: Math.min(95, Math.max(5, vOcc.x_pct)),
                                      y2: Math.min(95, Math.max(5, vOcc.y_pct)),
                                      tagKey: tag.text,
                                      focused: focusedLineTagKey === tag.text,
                                    });
                                  }
                                }
                                return (
                                  <>
                                    <svg className="absolute inset-0 overflow-visible" style={{ width: '100%', height: '100%', pointerEvents: 'none', zIndex: 12 }}>
                                      {connectors.map((c, ci) => (
                                        <line
                                          key={ci}
                                          x1={`${c.x1}%`} y1={`${c.y1}%`}
                                          x2={`${c.x2}%`} y2={`${c.y2}%`}
                                          stroke={c.focused ? '#0d9488' : 'rgba(20,184,166,0.6)'}
                                          strokeWidth={c.focused ? 2.5 : 1.5}
                                          strokeDasharray="6 4"
                                        />
                                      ))}
                                    </svg>
                                    {occNodes.map((n, ni) => {
                                      const focused = focusedLineTagKey === n.tagKey;
                                      return (
                                        <button
                                          key={ni}
                                          onClick={() => {
                                            setFocusedLineTagKey(prev => prev === n.tagKey ? null : n.tagKey);
                                            if (!lineTagsExpanded) setLineTagsExpanded(true);
                                            setTimeout(() => {
                                              const el = document.getElementById(`line-tag-row-${CSS.escape(n.tagKey)}`);
                                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 150);
                                          }}
                                          title={`Duplicate: ${n.label} · found in ${n.direction} orientation${n.multi ? ' (H+V confirmed)' : ''}`}
                                          style={{
                                            position: 'absolute',
                                            left: `${n.left}%`,
                                            top:  `${n.top}%`,
                                            width: focused ? '16px' : '13px',
                                            height: focused ? '16px' : '13px',
                                            transform: 'translate(-50%, -50%) rotate(45deg)',
                                            background: focused ? '#0284c7' : '#0ea5e9',
                                            border: '2px solid #0369a1',
                                            borderRadius: '2px',
                                            pointerEvents: 'all',
                                            zIndex: focused ? 25 : 13,
                                            boxShadow: focused
                                              ? '0 0 0 4px rgba(14,165,233,0.4), 0 2px 8px rgba(0,0,0,0.4)'
                                              : '0 1px 4px rgba(0,0,0,0.35)',
                                            outline: n.multi ? '2px solid rgba(45,212,191,0.9)' : 'none',
                                            outlineOffset: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                          }}
                                        />
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600" style={{ pointerEvents: 'none' }}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />Critical</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Major</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Minor</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Info</span>
                                <span className="text-slate-400">·</span>
                                <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-sky-500" style={{transform:'rotate(45deg)'}} />Dup Line</span>
                                <span className="inline-flex items-center gap-1"><span className="inline-block w-5 h-2.5 rounded-sm border border-sky-400" style={{background:'rgba(14,165,233,0.18)'}} />Dup Zone</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500">Dashed = estimate</span>
                                <span className="text-slate-400">·</span>
                                <button
                                  onClick={() => setShowLineTagOverlay(v => !v)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold border transition-colors ${showLineTagOverlay ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'}`}
                                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                >
                                  <span className="inline-block w-2 h-2 rounded-[1px]" style={{ background: showLineTagOverlay ? '#fff' : '#14b8a6', transform:'rotate(45deg)' }} />
                                  Line Tags {showLineTagOverlay ? 'ON' : 'OFF'}
                                </button>
                                <button
                                  onClick={() => setShowDupLineHighlights(v => !v)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold border transition-colors ${showDupLineHighlights ? 'bg-sky-500 text-white border-sky-600' : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'}`}
                                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                >
                                  <span className="inline-block w-2 h-2 rounded-[1px]" style={{ background: showDupLineHighlights ? '#fff' : '#0ea5e9', transform:'rotate(45deg)' }} />
                                  Dup Zones {showDupLineHighlights ? 'ON' : 'OFF'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDrawingData.issues?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-semibold text-slate-700">No issues detected</p>
                    <p className="text-sm text-slate-400 mt-1">This drawing passed all verification checks.</p>
                  </div>
                )}
              </div>
              )}
              {/* ─── end DRAWING panel ─────────────────────────────────── */}

              {/* ─── FINDINGS panel ─────────────────────────────────────── */}
              {activePanel === 'findings' && activeDrawingData && (
              <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.1s both' }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{activeDrawing} — Findings</h2>
                      <p className="text-xs text-slate-500">{activeDrawingData.issues?.length ?? 0} total findings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overridesSaved && pendingCount === 0 && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />Review saved
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <>
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                          {pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''}
                        </span>
                        <button onClick={handleSaveOverrides} disabled={savingOverrides}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50 transition-all hover:-translate-y-px"
                          style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 2px 8px rgba(245,158,11,0.35)' }}>
                          {savingOverrides
                            ? <><Loader className="w-3 h-3 animate-spin" />Saving…</>
                            : <><Save className="w-3 h-3" />Save Review</>
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {activeDrawingData.issues?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-semibold text-slate-700">No issues detected</p>
                    <p className="text-sm text-slate-400 mt-1">This drawing passed all verification checks.</p>
                  </div>
                ) : (
                  <div>
                    {/* ── Filter bar ── */}
                    {/* ── Filter bar ── */}
                    {(() => {
                      const visibleIssues = activeDrawingData.issues.filter(f => !HIDDEN_CATEGORIES.has(f.category));
                      const availableCategories = [...new Set(visibleIssues.map(f => f.category))];
                      const filteredIssues = visibleIssues.filter(f => {
                        if (filterSeverity !== 'all' && (overrides[f.id]?.severity || f.severity) !== filterSeverity) return false;
                        if (filterCategory !== 'all' && f.category !== filterCategory) return false;
                        if (filterStatus   !== 'all' && (overrides[f.id]?.status   || f.status)   !== filterStatus)   return false;
                        return true;
                      });
                      const activeFilterCount = [filterSeverity, filterCategory, filterStatus].filter(v => v !== 'all').length;
                      return (
                        <>
                          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</span>

                            {/* Severity filter */}
                            {/* Severity filter */}
                            <select
                              value={filterSeverity}
                              onChange={e => setFilterSeverity(e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer outline-none hover:border-slate-400 transition-colors">
                              <option value="all">All Severities</option>
                              {['critical','major','minor','info'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                              ))}
                            </select>

                            {/* Category filter */}
                            <select
                              value={filterCategory}
                              onChange={e => setFilterCategory(e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer outline-none hover:border-slate-400 transition-colors">
                              <option value="all">All Categories</option>
                              {availableCategories.map(c => (
                                <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                              ))}
                            </select>

                            {/* Status filter */}
                            <select
                              value={filterStatus}
                              onChange={e => setFilterStatus(e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer outline-none hover:border-slate-400 transition-colors">
                              <option value="all">All Statuses</option>
                              {['open','reviewed','resolved'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                              ))}
                            </select>

                            <span className="text-xs text-slate-400 ml-auto">
                              {filteredIssues.length} of {visibleIssues.length} finding{visibleIssues.length !== 1 ? 's' : ''}
                              {activeFilterCount > 0 && (
                                <button
                                  onClick={() => { setFilterSeverity('all'); setFilterCategory('all'); setFilterStatus('all'); }}
                                  className="ml-2 text-indigo-500 hover:text-indigo-700 underline">
                                  clear filters
                                </button>
                              )}
                            </span>
                          </div>

                          {/* ── Duplicate Line Summary Banner ── */}
                          {(() => {
                            const dupFindings  = visibleIssues.filter(f => DUP_LINE_RULES.has(f.rule_id));
                            if (dupFindings.length === 0) return null;
                            // Tags referenced by any duplicate finding (works for all rule IDs)
                            const dupTags = [...new Set(
                              dupFindings.flatMap(f =>
                                (activeDrawingData?.metadata?.line_tags || []).filter(lt =>
                                  (f.evidence || '').includes(lt.text) || (f.issue_observed || '').includes(lt.text)
                                ).map(lt => lt.text)
                              )
                            )];
                            // Cloud-truncation tags (LSZ-009): drives amber chip colouring
                            const cloudTruncTags = new Set(
                              dupFindings
                                .filter(f => CLOUD_TRUNC_RULES.has(f.rule_id))
                                .flatMap(f =>
                                  (activeDrawingData?.metadata?.line_tags || []).filter(lt =>
                                    (f.evidence || '').includes(lt.text) || (f.issue_observed || '').includes(lt.text)
                                  ).map(lt => lt.text)
                                )
                            );
                            // Shared-suffix tags (LSZ-010): drives orange chip colouring
                            const sharedSuffixTags = new Set(
                              dupFindings
                                .filter(f => SHARED_SUFFIX_RULES.has(f.rule_id))
                                .flatMap(f =>
                                  (activeDrawingData?.metadata?.line_tags || []).filter(lt =>
                                    (f.evidence || '').includes(lt.text) || (f.issue_observed || '').includes(lt.text)
                                  ).map(lt => lt.text)
                                )
                            );
                            const cloudTruncCount  = dupFindings.filter(f => CLOUD_TRUNC_RULES.has(f.rule_id)).length;
                            const sharedSuffixCount = dupFindings.filter(f => SHARED_SUFFIX_RULES.has(f.rule_id)).length;
                            const hvCount = (activeDrawingData?.metadata?.line_tags || []).filter(lt => lt.multi_angle).length;
                            return (
                              <div className="mx-5 my-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 flex flex-wrap items-start gap-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="inline-block w-4 h-4 rounded-[2px] bg-sky-500 flex-shrink-0" style={{transform:'rotate(45deg)'}} />
                                  <div>
                                    <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">Duplicate Line Designations Detected</p>
                                    <p className="text-xs text-sky-700 mt-0.5">
                                      {dupFindings.length} finding{dupFindings.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                                      {dupTags.length > 0 && <>{dupTags.length} unique tag{dupTags.length !== 1 ? 's' : ''} affected</>}
                                      {hvCount > 0 && <> &nbsp;·&nbsp; <span className="font-semibold">{hvCount} confirmed H &amp; V</span></>}
                                      {cloudTruncCount > 0 && (
                                        <> &nbsp;·&nbsp; <span className="font-semibold text-amber-700">⚠ {cloudTruncCount} cloud-truncated (CRITICAL)</span></>
                                      )}
                                      {sharedSuffixCount > 0 && (
                                        <> &nbsp;·&nbsp; <span className="font-semibold text-orange-700">⊘ {sharedSuffixCount} shared-suffix copy-paste (MAJOR)</span></>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {dupTags.slice(0, 6).map(tk => (
                                    <button
                                      key={tk}
                                      onClick={() => {
                                        setFocusedLineTagKey(prev => prev === tk ? null : tk);
                                        setShowLineTagOverlay(true);
                                        if (!lineTagsExpanded) setLineTagsExpanded(true);
                                        setTimeout(() => {
                                          const el = document.getElementById(`line-tag-row-${CSS.escape(tk)}`);
                                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 150);
                                      }}
                                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                                        focusedLineTagKey === tk
                                          ? cloudTruncTags.has(tk)
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : sharedSuffixTags.has(tk)
                                              ? 'bg-orange-500 text-white border-orange-600'
                                              : 'bg-sky-500 text-white border-sky-600'
                                          : cloudTruncTags.has(tk)
                                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                            : sharedSuffixTags.has(tk)
                                              ? 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100'
                                              : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-100'
                                      }`}
                                    >
                                      {cloudTruncTags.has(tk) && <span className="mr-0.5">⚠</span>}
                                      {sharedSuffixTags.has(tk) && <span className="mr-0.5">⊘</span>}
                                      {tk}
                                    </button>
                                  ))}
                                  {dupTags.length > 6 && (
                                    <span className="text-xs text-sky-500">+{dupTags.length - 6} more</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead style={{ background:'#f8fafc' }}>
                                <tr>
                                  {['SL', 'Category', 'Rule', 'Issue Observed', 'Action Required', 'Evidence', 'Severity', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {filteredIssues.length === 0 ? (
                                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">No findings match the current filters.</td></tr>
                                ) : filteredIssues.map(f => {
                                  const isDupRule      = DUP_LINE_RULES.has(f.rule_id);
                                  const isCloudTrunc   = CLOUD_TRUNC_RULES.has(f.rule_id);
                                  const isSharedSuffix = SHARED_SUFFIX_RULES.has(f.rule_id);
                                  // Extract tag text from evidence to find matching line tag.
                                  // For LSZ-009 evidence IS the tag text; for LSZ-006/007/008/010
                                  // the tag text is embedded in the evidence / issue string.
                                  const dupTagKey = isDupRule
                                    ? (activeDrawingData?.metadata?.line_tags || []).find(lt =>
                                        (f.evidence || '').includes(lt.text) || (f.issue_observed || '').includes(lt.text)
                                      )?.text || null
                                    : null;
                                  return (
                                  <tr id={`finding-row-${f.id}`} key={f.id}
                                    className={`hover:bg-slate-50/70 transition-colors ${
                                      focusedFindingId === f.id ? 'bg-indigo-50/60'
                                      : isCloudTrunc   ? 'bg-amber-50/50'
                                      : isSharedSuffix ? 'bg-orange-50/50'
                                      : isDupRule      ? 'bg-sky-50/40'
                                      : ''
                                    }`}>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{f.sl_no}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                                        {CATEGORY_LABELS[f.category] || f.category}
                                      </span>
                                      {isDupRule && (
                                        <span className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${
                                          isCloudTrunc   ? 'text-amber-700'
                                          : isSharedSuffix ? 'text-orange-700'
                                          : 'text-sky-700'
                                        }`}>
                                          <span className={`inline-block w-2 h-2 rounded-[1px] ${
                                            isCloudTrunc   ? 'bg-amber-500'
                                            : isSharedSuffix ? 'bg-orange-500'
                                            : 'bg-sky-500'
                                          }`} style={{transform:'rotate(45deg)'}} />
                                          {isCloudTrunc   ? 'Cloud-Truncated Dup.'
                                           : isSharedSuffix ? 'Shared-Suffix (Copy-Paste?)'
                                           : 'Duplicate Line'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.rule_id}</td>
                                    <td className="px-4 py-3 text-slate-800 text-xs max-w-xs">{f.issue_observed}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{f.action_required}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[140px]">
                                      <span className="block truncate" title={f.evidence}>{f.evidence}</span>
                                      {isDupRule && dupTagKey && (
                                        <button
                                          onClick={() => {
                                            setFocusedLineTagKey(prev => prev === dupTagKey ? null : dupTagKey);
                                            setShowLineTagOverlay(true);
                                            if (!lineTagsExpanded) setLineTagsExpanded(true);
                                            setTimeout(() => {
                                              const el = document.getElementById(`line-tag-row-${CSS.escape(dupTagKey)}`);
                                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 150);
                                          }}
                                          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors ${
                                            isCloudTrunc
                                              ? 'text-amber-700 hover:text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100'
                                              : isSharedSuffix
                                                ? 'text-orange-700 hover:text-orange-900 border-orange-300 bg-orange-50 hover:bg-orange-100'
                                                : 'text-sky-600 hover:text-sky-800 border-sky-200 bg-sky-50 hover:bg-sky-100'
                                          }`}
                                        >
                                          <span className={`inline-block w-1.5 h-1.5 rounded-[1px] ${
                                            isCloudTrunc ? 'bg-amber-500' : isSharedSuffix ? 'bg-orange-500' : 'bg-sky-500'
                                          }`} style={{transform:'rotate(45deg)'}} />
                                          {isCloudTrunc ? 'Inspect on drawing' : isSharedSuffix ? 'Compare on drawing' : 'Locate on drawing'}
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={getVal(f, 'severity')}
                                        onChange={e => handleOverrideChange(f.id, 'severity', e.target.value)}
                                        className={`text-xs px-2 py-1 rounded-full border font-semibold uppercase cursor-pointer outline-none transition-all ${SEVERITY_STYLES[getVal(f, 'severity')] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {['critical', 'major', 'minor', 'info'].map(s => (
                                          <option key={s} value={s}>{s.toUpperCase()}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={getVal(f, 'status')}
                                        onChange={e => handleOverrideChange(f.id, 'status', e.target.value)}
                                        className={`text-xs px-2.5 py-1 rounded-lg border cursor-pointer capitalize outline-none transition-all ${
                                          getVal(f, 'status') === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : getVal(f, 'status') === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {['open', 'reviewed', 'resolved'].map(s => (
                                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            {/* ─── end FINDINGS panel ─── */}

            {/* ─── LINES panel ─── */}
            {activePanel === 'lines' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
            {(() => {
              const lineTags = activeDrawingData?.metadata?.line_tags || [];
              if (lineTags.length === 0) return <div className="p-8 text-center text-slate-400 text-sm">No line tags extracted for this drawing.</div>;
              const multiAngleCount = lineTags.filter(lt => lt.multi_angle).length;
              const npsSet = [...new Set(lineTags.map(lt => lt.size).filter(Boolean))];
              const fluidSet = [...new Set(lineTags.map(lt => lt.fluid_code).filter(Boolean))];
              const query = lineTagSearch.trim().toLowerCase();
              const filtered = query ? lineTags.filter(lt =>
                lt.text?.toLowerCase().includes(query) ||
                lt.fluid_code?.toLowerCase().includes(query) ||
                lt.area_code?.toLowerCase().includes(query) ||
                lt.size?.toLowerCase().includes(query)
              ) : lineTags;
              return (
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#0d9488,#14b8a6)' }}>
                      <Ruler className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Pipeline Line Designations</h2>
                      <p className="text-xs text-slate-500">
                        {lineTags.length} tags · {npsSet.length} NPS · {fluidSet.length} fluid codes
                        {multiAngleCount > 0 ? ` · ${multiAngleCount} H+V confirmed` : ''}
                      </p>
                    </div>
                  </div>
                  {/* Search */}
                  <div className="px-5 py-3 border-b border-slate-100">
                    <div className="relative">
                      <input
                        type="text"
                        value={lineTagSearch}
                        onChange={e => setLineTagSearch(e.target.value)}
                        placeholder={`Search ${lineTags.length} designations…`}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-teal-200 bg-white/80 text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-300/50"
                      />
                      <ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" />
                      {lineTagSearch && (
                        <button onClick={() => setLineTagSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Card grid */}
                  <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight:'70vh' }}>
                    <div className="grid gap-2" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))' }}>
                      {filtered.map((lt, idx) => {
                        const isFocused = focusedLineTagKey === lt.text;
                        return (
                          <div
                            key={lt.text}
                            id={`line-tag-row-${lt.text}`}
                            onClick={() => { setFocusedLineTagKey(prev => prev === lt.text ? null : lt.text); setShowLineTagOverlay(true); }}
                            className={`relative rounded-xl border cursor-pointer transition-all duration-200 p-3 flex flex-col gap-1.5 overflow-hidden ${
                              isFocused ? 'border-teal-400 bg-teal-50 shadow-md shadow-teal-100'
                              : lt.multi_angle ? 'border-teal-200 bg-white hover:border-teal-400'
                              : 'border-slate-200 bg-white hover:border-teal-300'
                            }`}
                            style={{ animation:`cardIn 0.25s ease-out ${Math.min(idx * 0.02, 0.4)}s both` }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{
                              background: lt.multi_angle || isFocused
                                ? 'linear-gradient(90deg,#0d9488,#14b8a6,#06b6d4)'
                                : 'linear-gradient(90deg,#e2e8f0,#cbd5e1)'
                            }} />
                            <code className={`text-[11px] font-mono font-bold ${isFocused ? 'text-teal-700' : 'text-slate-800'}`}>{lt.text}</code>
                            <div className="flex items-center gap-1 flex-wrap">
                              {lt.size && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{lt.size}"</span>}
                              {lt.fluid_code && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{lt.fluid_code}</span>}
                              {lt.area_code && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{lt.area_code}</span>}
                              {lt.pipe_class && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">{lt.pipe_class}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end LINES panel ─── */}

            {/* ─── NAMING panel ─── */}
            {activePanel === 'naming' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
            {(() => {
              const NAMING_SEV_BADGE = {
                critical:'bg-red-100 text-red-800 border border-red-300',
                major:'bg-orange-100 text-orange-800 border border-orange-300',
                minor:'bg-yellow-100 text-yellow-800 border border-yellow-300',
                info:'bg-green-100 text-green-800 border border-green-300',
              };
              const SOURCE_BADGE = {
                deterministic:{ label:'Rule', style:'bg-blue-50 text-blue-700 border border-blue-200' },
                ai_vision:{ label:'AI Vision', style:'bg-purple-50 text-purple-700 border border-purple-200' },
              };
              const RULE_LABEL = {
                'NAM-001':'Wrong Separator',
                'NAM-002':'Unknown Acronym',
                'NAM-003':'Incomplete Tag',
                'NAM-004':'Inconsistent Format',
                'NAM-AI':'AI Visual Finding',
              };
              return (
                <div>
                  {/* Header + Run button */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                        <Type className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Tag Naming &amp; Acronym Check</h2>
                        {namingResults
                          ? <p className="text-xs text-slate-500">{namingResults.total} issue{namingResults.total !== 1 ? 's' : ''} found</p>
                          : <p className="text-xs text-slate-400">Not yet run</p>}
                      </div>
                    </div>
                    <button
                      onClick={runNamingCheck}
                      disabled={checkingNaming}
                      className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl disabled:opacity-60 transition-all hover:-translate-y-px"
                      style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow:'0 4px 14px rgba(109,40,217,0.3)' }}
                    >
                      {checkingNaming ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
                      {checkingNaming ? 'Checking…' : 'Run Check'}
                    </button>
                  </div>
                  {!namingResults ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Type className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">Click "Run Check" to analyse tag naming</p>
                    </div>
                  ) : namingResults.total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                      <p className="font-semibold text-slate-700">No naming issues found</p>
                    </div>
                  ) : (
                    <div className="px-5 py-4 space-y-2">
                      {namingResults.naming_issues.map((iss, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${NAMING_SEV_BADGE[iss.severity] || 'bg-slate-100 text-slate-600'}`}>
                              {iss.severity?.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {iss.rule_id}
                            </span>
                            {RULE_LABEL[iss.rule_id] && <span className="text-xs text-slate-500">{RULE_LABEL[iss.rule_id]}</span>}
                            {iss.source && SOURCE_BADGE[iss.source] && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_BADGE[iss.source].style}`}>
                                {SOURCE_BADGE[iss.source].label}
                              </span>
                            )}
                            {iss.tag_found && (
                              <code className="ml-auto text-xs font-mono font-bold bg-violet-50 text-violet-800 border border-violet-200 px-2 py-0.5 rounded">
                                {iss.tag_found}
                              </code>
                            )}
                          </div>
                          <p className="text-sm text-slate-700">{iss.description}</p>
                          <div className="flex items-start gap-3 flex-wrap">
                            {iss.suggested_fix && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span className="text-slate-500">Fix: </span>
                                <code className="font-mono font-semibold text-emerald-700">{iss.suggested_fix}</code>
                              </div>
                            )}
                            {iss.location_hint && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Eye className="w-3 h-3" />
                                <span>{iss.location_hint}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end NAMING panel ─── */}

            {/* ─── COMPARISON panel ─── */}
            {activePanel === 'comparison' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)' }}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Legend-Backed Accuracy Comparison</h2>
                    {comparison
                      ? <p className="text-xs text-slate-500">Comparison complete</p>
                      : <p className="text-xs text-slate-400">Not yet run</p>}
                  </div>
                </div>
                <button
                  onClick={runAccuracyCompare}
                  disabled={runningCompare}
                  className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl disabled:opacity-60 transition-all hover:-translate-y-px"
                  style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)', boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}
                >
                  {runningCompare ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  {runningCompare ? 'Comparing…' : 'Run Compare'}
                </button>
              </div>
              {!comparison ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Shield className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Click "Run Compare" to analyse accuracy</p>
                </div>
              ) : (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-700 mb-2">Before (Defaults)</p>
                    <p className="text-slate-500">Instruments: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.instruments ?? 0}</span></p>
                    <p className="text-slate-500">Valves: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.valves ?? 0}</span></p>
                    <p className="text-slate-500">Line sizes: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.line_sizes ?? 0}</span></p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-emerald-700 mb-2">After (Legend-Backed)</p>
                    <p className="text-emerald-700">Instruments: <span className="font-bold">{comparison?.after_legend_backed?.summary?.instruments ?? 0}</span></p>
                    <p className="text-emerald-700">Valves: <span className="font-bold">{comparison?.after_legend_backed?.summary?.valves ?? 0}</span></p>
                    <p className="text-emerald-700">Line sizes: <span className="font-bold">{comparison?.after_legend_backed?.summary?.line_sizes ?? 0}</span></p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="font-semibold text-blue-700 mb-2">Delta (After − Before)</p>
                    <p className="text-blue-700">Instruments: <span className="font-bold">{comparison?.delta_after_minus_before?.instruments ?? 0}</span></p>
                    <p className="text-blue-700">Valves: <span className="font-bold">{comparison?.delta_after_minus_before?.valves ?? 0}</span></p>
                    <p className="text-blue-700">Line sizes: <span className="font-bold">{comparison?.delta_after_minus_before?.line_sizes ?? 0}</span></p>
                  </div>
                </div>
              )}
            </div>
            )}
            {/* ─── end COMPARISON panel ─── */}

            {/* ─── CROSS-REF panel ─── */}
            {activePanel === 'cross' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
              <CrossRecommendationPanel
                sourceType="pid"
                documentId={documentId || results?.document_id}
                projectId={selectedProject?.project_id || results?.project_id}
                fileName={results?.file_name}
              />
            </div>
            )}
            {/* ─── end CROSS-REF panel ─── */}

            {/* ─── INDEX / TAGS / EQUIPMENT panel ─── */}
            {activePanel === 'index' && (() => {
              // ── Build data from all drawings — pure derivation, no API calls ──
              const allDrawings = results?.drawings ?? [];

              // 1. Master serial index: every finding across all drawings
              const masterIndex = allDrawings.flatMap((d, di) =>
                (d.issues ?? []).map((f, fi) => ({
                  globalIdx: allDrawings.slice(0, di).reduce((s,x) => s + (x.issues?.length ?? 0), 0) + fi + 1,
                  sl_no:     f.sl_no,
                  drawing:   d.drawing_id,
                  category:  f.category,
                  rule_id:   f.rule_id,
                  severity:  f.severity,
                  issue:     f.issue_observed,
                  evidence:  f.evidence,
                }))
              );

              // 2. Tag inventory: extract instrument/equipment tag IDs from evidence + issue text
              // P&ID tags follow patterns like PT-1234, FV-001, LT-42A, TIC-101, etc.
              const TAG_RE = /\b([A-Z]{1,4}(?:[A-Z])?[-_]?\d{2,6}[A-Z]?)\b/g;
              const tagMap = {}; // tagId → { drawings: Set, severities: Set, rules: Set }
              allDrawings.forEach(d => {
                (d.issues ?? []).forEach(f => {
                  const text = `${f.evidence || ''} ${f.issue_observed || ''}`;
                  const found = [...new Set(text.match(TAG_RE) || [])];
                  found.forEach(t => {
                    if (!tagMap[t]) tagMap[t] = { drawings: new Set(), severities: new Set(), rules: new Set() };
                    tagMap[t].drawings.add(d.drawing_id);
                    tagMap[t].severities.add(f.severity);
                    tagMap[t].rules.add(f.rule_id);
                  });
                });
              });
              const tagList = Object.entries(tagMap)
                .map(([id, m]) => ({ id, drawings: [...m.drawings], severities: [...m.severities], rules: [...m.rules] }))
                .sort((a, b) => b.drawings.length - a.drawings.length || a.id.localeCompare(b.id));

              // 3. Equipment list: findings with category === 'valve' or patterns like *-V-*, *-E-*, *-P-*, *-K-*
              const EQUIP_PREFIXES = /^([A-Z]+-)?([PVEKCTFD])[A-Z]?[-_]\d/;
              const equipMap = {};
              allDrawings.forEach(d => {
                (d.issues ?? []).forEach(f => {
                  const text = `${f.evidence || ''} ${f.issue_observed || ''}`;
                  const found = [...new Set(text.match(TAG_RE) || [])].filter(t => EQUIP_PREFIXES.test(t));
                  found.forEach(t => {
                    if (!equipMap[t]) equipMap[t] = { drawings: new Set(), category: f.category };
                    equipMap[t].drawings.add(d.drawing_id);
                  });
                });
              });
              const equipList = Object.entries(equipMap)
                .map(([id, m]) => ({ id, drawings: [...m.drawings], category: m.category }))
                .sort((a, b) => a.id.localeCompare(b.id));

              return (
              <IndexTagsEquipmentPanel
                masterIndex={masterIndex}
                tagList={tagList}
                equipList={equipList}
                CATEGORY_LABELS={CATEGORY_LABELS}
                accent="#6366f1"
              />
              );
            })()}
            {/* ─── end INDEX / TAGS / EQUIPMENT panel ─── */}

            </div>

            </div>

            {/* ══ RIGHT ICON RAIL ══ */}
            <div
              className="flex-shrink-0 sticky top-4 self-start"
              style={{ width:'76px', animation:'railIn 0.4s ease-out both' }}
            >
              {/* Oil & gas animated header */}
              <div className="mb-3 rounded-2xl overflow-hidden" style={{
                background:'linear-gradient(180deg,#0f172a 0%,#1e3a5f 100%)',
                padding:'10px 6px 8px',
                boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
              }}>
                <svg width="64" height="44" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Vertical pipe */}
                  <rect x="29" y="2" width="6" height="40" rx="3" fill="url(#pipeGradV)" style={{ animation:'pipeFlow 2s ease-in-out infinite' }}/>
                  {/* Horizontal pipe */}
                  <rect x="8" y="19" width="48" height="6" rx="3" fill="url(#pipeGradH)" style={{ animation:'pipeFlow 2s ease-in-out infinite 0.5s' }}/>
                  {/* Valve symbol */}
                  <polygon points="32,15 39,22 32,29 25,22" fill="#38bdf8" opacity="0.9" style={{ animation:'drillPulse 1.8s ease-in-out infinite' }}/>
                  {/* Droplets */}
                  <circle cx="32" cy="6" r="2.5" fill="#06b6d4" style={{ animation:'dropletFall 1.5s ease-in-out infinite' }}/>
                  <circle cx="32" cy="38" r="2" fill="#0e7490" opacity="0.7" style={{ animation:'dropletFall 1.5s ease-in-out infinite 0.75s' }}/>
                  <defs>
                    <linearGradient id="pipeGradV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8"/>
                      <stop offset="100%" stopColor="#0284c7"/>
                    </linearGradient>
                    <linearGradient id="pipeGradH" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0284c7"/>
                      <stop offset="100%" stopColor="#38bdf8"/>
                    </linearGradient>
                  </defs>
                </svg>
                <p className="text-[8px] font-black text-center text-sky-300 uppercase tracking-widest mt-0.5">P&amp;ID Nav</p>
              </div>
              {/* Panel buttons */}
              <div className="space-y-1.5">
                {PANELS.map(tab => {
                  const isActive = activePanel === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePanel(tab.id)}
                      title={tab.label}
                      className="w-full flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border transition-all duration-200 group"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg,${tab.accent}22,${tab.accent}11)`
                          : 'rgba(255,255,255,0.9)',
                        border: isActive
                          ? `1.5px solid ${tab.accent}60`
                          : '1.5px solid rgba(203,213,225,0.6)',
                        boxShadow: isActive
                          ? `0 4px 16px ${tab.glow || 'rgba(0,0,0,0.1)'}`
                          : '0 1px 4px rgba(0,0,0,0.05)',
                        transform: isActive ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <tab.icon
                        cls={`w-5 h-5 transition-colors ${isActive ? '' : 'text-slate-400 group-hover:text-slate-600'}`}
                        style={isActive ? { color: tab.accent } : undefined}
                      />
                      <span
                        className="text-[9px] font-black uppercase tracking-widest leading-none"
                        style={{ color: isActive ? tab.accent : '#94a3b8' }}
                      >
                        {tab.label}
                      </span>
                      {tab.badge != null && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${tab.badgeCls || 'bg-slate-200 text-slate-600'}`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* ══ end RIGHT ICON RAIL ══ */}

          </div>
          );
        })()}

        {/* History panel */}
        {!results && history.length > 0 && (
          <div className="rounded-2xl overflow-hidden mt-5" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.25s both' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Previous Uploads</h2>
                <p className="text-xs text-slate-500">{history.length} document{history.length !== 1 ? 's' : ''} in this project</p>
              </div>
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-sm">
                <Loader className="w-4 h-4 animate-spin" />Loading…
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {history.map(d => (
                  <div key={d.document_id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      d.status === 'completed' ? 'bg-green-500' : d.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{d.file_name}</p>
                      <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()} · {d.total_issues ?? 0} issues · {d.total_drawings ?? 0} drawings</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      d.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200'
                      : d.status === 'failed'  ? 'bg-red-50 text-red-600 border-red-200'
                      :                          'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{d.status}</span>
                    {d.status === 'completed' && d.excel_s3_url && (
                      <a href={d.excel_s3_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex-shrink-0">Excel</a>
                    )}
                    {d.status === 'completed' && d.pdf_s3_url && (
                      <a href={d.pdf_s3_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:underline flex-shrink-0">PDF</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </DarkBg>
  );
};

export default PIDVerification;
