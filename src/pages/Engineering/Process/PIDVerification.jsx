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
  Lightbulb, Eye, EyeOff, Hash, ClipboardList, Boxes, MapPin, Wrench, Network,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & layout primitives  (identical to PIDUpload.jsx)
// ─────────────────────────────────────────────────────────────────────────────
// Soft-coded: ping ring final scale — injected into markerPing keyframe below.
// Increase to make the ripple expand further; decrease for a tighter pulse.
const OVERLAY_MARKER_ANIM_PING_SCALE = 2.5;

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
  @keyframes markerPing {
    0%   { transform: translate(-50%,-50%) scale(1);                              opacity: 0;   }
    12%  { transform: translate(-50%,-50%) scale(1.05);                           opacity: 0.85; }
    100% { transform: translate(-50%,-50%) scale(${OVERLAY_MARKER_ANIM_PING_SCALE}); opacity: 0;   }
  }
  @keyframes markerGlow {
    0%, 100% { opacity: 1;    filter: brightness(1);   }
    50%      { opacity: 0.55; filter: brightness(1.35); }
  }
  @keyframes navTabIn {
    from { opacity: 0; transform: translateX(18px) scale(0.92); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }
  @keyframes activeBarSlide {
    from { transform: scaleY(0); opacity: 0; }
    to   { transform: scaleY(1); opacity: 1; }
  }
`;

// ── Soft-coded: icon rail nav button appearance ───────────────────────────────
// NAV_RAIL_ENTRY_DELAY_MS   : stagger between each button's entry animation (ms)
// NAV_RAIL_ENTRY_DURATION_MS: duration of the slide-in animation (ms)
// NAV_RAIL_ACTIVE_BAR_W     : width of the coloured left-side active indicator bar (px)
// NAV_RAIL_WIDTH            : total width of the sticky right nav rail (px)
const NAV_RAIL_ENTRY_DELAY_MS    = 55;
const NAV_RAIL_ENTRY_DURATION_MS = 320;
const NAV_RAIL_ACTIVE_BAR_W      = 3;    // px — the left accent bar on active tab
const NAV_RAIL_WIDTH             = 152;  // px — total rail column width

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
  tag:              'Tag Issues',
  connectivity:     'Connectivity',
  valve:            'Valve & Equipment',
  line_size:        'Line Size',
  line_designation: 'Line Designation',
  equipment:        'Equipment',
  notes:            'Notes / HOLDs',
};

// Soft-coded: categories excluded from the view, overlay, and PDF export.
// Extend this set to suppress additional categories without touching rule logic.
// 'connectivity' is excluded: orphan-node graph checks produce too many
// false-positives on scanned drawings and are not useful for process engineers.
const HIDDEN_CATEGORIES = new Set(['notes', 'connectivity']);

// Soft-coded: severity levels excluded from the view, overlay, and master index.
// INFO-level findings are observational notes with no required action; they add
// noise to the report and are hidden by default.  Add other severity labels here
// to suppress them globally without touching any rule logic.
const HIDDEN_SEVERITIES = new Set(['info']);

// Soft-coded: when false, the native browser tooltip (recommendation text) that
// appears on hover over every overlay marker on the drawing is suppressed.
// Set to true to re-enable tooltips. Core overlay logic is NOT affected.
const OVERLAY_SHOW_MARKER_TOOLTIP = false;

// Soft-coded: overlay marker dot animation.
// Set OVERLAY_MARKER_ANIM_ENABLED to false to disable the pulsing ring entirely.
// OVERLAY_MARKER_ANIM_DURATION_MS controls one full ping cycle length (ms).
const OVERLAY_MARKER_ANIM_ENABLED     = true;   // toggle ping animation on/off
const OVERLAY_MARKER_ANIM_DURATION_MS = 2200;   // ping cycle duration (ms)

// Soft-coded: localStorage key for coordinate calibration corrections recorded by
// engineers during drawing review. Each entry is keyed 'drawingId:findingId' and
// stores the original resolved % position alongside the corrected % position.
// Corrections automatically override resolved/heuristic positions on re-render.
const CALIB_STORAGE_KEY = 'pid_calib_corrections';

// Soft-coded: localStorage key for per-drawing resolution tier statistics.
// Records P1/P2/P3/P4/P5/FH/CX counts for every drawing viewed — export via the
// '↓ Export Data' button to build a training corpus for improving OCR extraction.
const CALIB_STATS_KEY = 'pid_calib_stats';

// Soft-coded: when true, renders the resolution tier (P1/P2/P3/P4/P5/CX/FH) as
// a tiny label beside each overlay marker so engineers can see exactly which
// resolution strategy placed it. Set to false (default) for production.
const SHOW_RESOLUTION_DEBUG = false;

// Soft-coded: set to true to re-enable the Compare panel in the icon rail.
// The comparison logic, API call, and panel render are fully preserved —
// only the navigation button and its panel content are hidden when false.
const SHOW_COMPARE_PANEL = false;

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

// ── Soft-coded: duplicate overlay cross-verification guard ───────────────────
// When true: tagHighlights (Duplicate-Line Highlight Overlay) and the Line Tag
// Duplicate Overlay (blue diamond buttons) only render for line_tag entries that
// satisfy BOTH conditions:
//   1. Tag text is referenced in ≥1 DUP_LINE_RULES finding — rule engine confirmed.
//   2. Tag has ≥ DUP_OVERLAY_MIN_SECTIONS populated section fields (all sections match).
// Set false to revert to legacy count≥2 behaviour (shows all repeated tags).
const DUP_OVERLAY_REQUIRE_FINDING = true;
// Ordered list of line-tag section fields used for the completeness check.
// A tag is only eligible when ALL of these are non-empty strings.
// Sections: NPS size · fluid code · area/sequence · sequence no · pipe class · insulation
const DUP_OVERLAY_SECTION_KEYS = ['size', 'fluid_code', 'area_code', 'sequence_no', 'pipe_class', 'insulation'];
// Minimum number of the above fields that must be non-empty.
// Default 5 of 6 — allows insulation to be absent on bare/uninsulated lines.
const DUP_OVERLAY_MIN_SECTIONS = 5;

// ── Soft-coded: Findings table — drawing-anchored filter ─────────────────────
// When true: the FINDINGS table lists ONLY findings whose marker has been
// resolved to a real drawing position (tiers P1–P5 or CX — genuine OCR/tag match).
// Findings whose marker falls back to a hash-derived pseudo-position (tier FH,
// meaning the system could not locate the tag on the canvas) are hidden from
// the table, keeping the list aligned with what is actually visible on the drawing.
// Set false to restore the legacy behaviour (all findings shown regardless).
const FINDINGS_TABLE_ANCHORED_ONLY = true;
// Resolution tiers considered "anchored on the drawing".
// FH = full heuristic fallback (random hash position — not on the drawing).
const FINDINGS_ANCHORED_TIERS = new Set(['P1', 'P2', 'P3', 'P4', 'P5', 'CX']);
// PERF_TIER_WEIGHT: contribution of each resolution tier to the placement-
//   confidence score (0 = no confidence, 1 = perfect).  Adjust per tier
//   without touching any computation logic.
const PERF_TIER_WEIGHT = {
  P1: 1.00,  // exact tag-position match from OCR
  P2: 0.85,  // NPS / centroid-biased position
  P3: 0.70,  // pattern heuristic
  P4: 0.65,  // line-tag match
  P5: 0.50,  // centroid fallback
  CX: 0.95,  // manually corrected by engineer
  FH: 0.30,  // full heuristic / unresolved
};

// PERF_TIER_COLOR: hex fill per tier for progress bars in the Performance panel.
const PERF_TIER_COLOR = {
  P1: '#10b981',  // emerald
  P2: '#3b82f6',  // blue
  P3: '#8b5cf6',  // violet
  P4: '#f59e0b',  // amber
  P5: '#f97316',  // orange
  CX: '#06b6d4',  // cyan  (manually corrected)
  FH: '#94a3b8',  // slate (unresolved heuristic)
};

// PERF_TIER_LABEL: short human-readable description per tier.
const PERF_TIER_LABEL = {
  P1: 'Exact Tag Match',
  P2: 'Position-Based',
  P3: 'Pattern Heuristic',
  P4: 'Line Tag Match',
  P5: 'Centroid Fallback',
  CX: 'Manual Correction',
  FH: 'Full Heuristic',
};

// PERF_SCORE_THRESHOLDS: confidence % breakpoints for colour-coding the score gauge.
// [high, moderate] — anything below 'moderate' is shown as red.
const PERF_SCORE_THRESHOLDS = { high: 80, moderate: 55 };

// PERF_ANCHOR_THRESHOLDS: anchor-rate % breakpoints.
const PERF_ANCHOR_THRESHOLDS = { high: 70, moderate: 40 };

// PERF_DOC_ACCURACY_THRESHOLDS: overall document accuracy % breakpoints.
const PERF_DOC_ACCURACY_THRESHOLDS = { high: 75, moderate: 50 };

// PERF_DOC_ACCURACY_WEIGHTS: weights that blend the sub-scores into the
// final Document Accuracy Rate shown at the top of the Performance panel.
//   ocr      — how much OCR text coverage contributes (raw_text_length proxy)
//   placement — weighted marker placement confidence
//   anchor   — percentage of markers with a hard-anchored position
// Must sum to 1.0.
const PERF_DOC_ACCURACY_WEIGHTS = { ocr: 0.30, placement: 0.45, anchor: 0.25 };

// PERF_OCR_GOOD_THRESHOLD: raw_text_length above which OCR is considered "good".
// Documents shorter than this get a proportional OCR score.
const PERF_OCR_GOOD_THRESHOLD = 500;

// PERF_TOP_RULES_COUNT: number of top-triggered rules shown in the panel.
const PERF_TOP_RULES_COUNT = 8;

// PERF_TOP_CATS_COUNT: number of top categories shown in the category breakdown bar.
const PERF_TOP_CATS_COUNT = 6;

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
  // Sub-tab within the Lines panel: 'qc' | 'designations'
  const [lineQcSubTab, setLineQcSubTab] = useState('qc');
  // QC Checks sub-tab filters
  const [qcSearch,     setQcSearch]     = useState('');
  const [qcSevFilter,  setQcSevFilter]  = useState('all');
  const [qcRuleFilter, setQcRuleFilter] = useState('all');
  const [lineTagSearch,    setLineTagSearch]    = useState('');
  // Lines panel — sort, view & expand state
  const [linesSortBy,       setLinesSortBy]       = useState('issues');   // 'name'|'size'|'fluid'|'issues'
  const [linesViewMode,     setLinesViewMode]      = useState('grid');    // 'grid'|'list'
  const [expandedFindingId, setExpandedFindingId] = useState(null);       // expanded QC card id
  // Equipment panel state
  const [equipSubTab,    setEquipSubTab]    = useState('all');
  const [equipTagSearch, setEquipTagSearch] = useState('');
  const [selectedEquipTag, setSelectedEquipTag] = useState(null); // detail drawer
  const [equipViewMode,  setEquipViewMode]  = useState('grid');   // 'grid' | 'list'
  // Equipment panel — view tab (top-level navigation) + sort
  const [equipViewTab,  setEquipViewTab]   = useState('register'); // 'insights'|'register'|'analytics'
  const [equipSortBy,   setEquipSortBy]    = useState('issues');   // 'issues'|'name'|'type'|'family'
  // Instrumentation panel — per-check manual override states
  // '' = AI auto | 'pass' = manually confirmed | 'fail' = manually flagged | 'na' = N/A
  const [instrCheckStates, setInstrCheckStates] = useState({});  // { [checkId]: 'pass'|'fail'|'na' }
  const [instrActiveView, setInstrActiveView]  = useState('checklist'); // 'checklist'|'summary'
  // Piping panel — per-check manual override states
  const [pipCheckStates, setPipCheckStates]   = useState({});   // { [checkId]: 'pass'|'fail'|'na' }
  const [pipActiveView,  setPipActiveView]    = useState('checklist'); // 'checklist'|'summary'
  // Naming panel filters
  const [namingSearch,   setNamingSearch]   = useState('');
  const [namingSevFilter, setNamingSevFilter] = useState('all');
  // Soft-coded: both duplicate-line overlays default OFF so the drawing canvas
  // is clean on first load.  Engineers can enable them via the toggle buttons.
  // Previously true — caused every repeated pipeline label (normal on P&IDs) to
  // show blue diamond dots / glow rectangles even when no real error existed.
  const [showLineTagOverlay, setShowLineTagOverlay] = useState(false);
  const [focusedLineTagKey,  setFocusedLineTagKey]  = useState(null);
  // Duplicate-line highlight overlay: semi-transparent glow rectangles drawn at
  // the exact OCR coordinates of every duplicate-line finding on the drawing.
  // Toggled independently from the dot markers so the engineer can switch it off
  // when the colour wash makes small details hard to read.
  const [showDupLineHighlights, setShowDupLineHighlights] = useState(false);
  // ── History (documents in project) ───────────────────────────────────────
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [legendFile,      setLegendFile]      = useState(null);
  const [legendKnowledge, setLegendKnowledge] = useState(null);
  const [buildingLegend,  setBuildingLegend]  = useState(false);
  // Per-project legend status: 'project' | 'global' | null
  const [legendScope,     setLegendScope]     = useState(null);
  const [legendBuiltAt,   setLegendBuiltAt]   = useState(null);
  const [clearingLegend,  setClearingLegend]  = useState(false);
  const [runningCompare,  setRunningCompare]  = useState(false);
  const [comparison,      setComparison]      = useState(null);
  const [showUncertainHighlights, setShowUncertainHighlights] = useState(false);
  const [focusedFindingId, setFocusedFindingId] = useState(null);
  // Correction mode — when true, clicking the drawing canvas records the clicked
  // % position as the corrected location for the currently focused finding.
  // Persists to localStorage and is applied automatically on next render.
  const [correctionMode, setCorrectionMode] = useState(false);
  // Stored engineer corrections, keyed 'drawingId:findingId'. Loaded from
  // localStorage on mount; each entry overrides the resolved marker position.
  const [calibCorrections, setCalibCorrections] = useState({});
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

  // Load stored calibration corrections from localStorage on component mount.
  // Corrections are supplementary — they don't affect any backend data.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CALIB_STORAGE_KEY);
      if (raw) setCalibCorrections(JSON.parse(raw));
    } catch { /* non-fatal */ }
  }, []);

  // ── Auto-run naming check when results arrive ─────────────────────────────
  // Fires automatically after verification completes so the user never needs
  // to press "Run Check" manually. Guards: only if results exist, no prior
  // namingResults, and not already running.
  useEffect(() => {
    const docId = documentId || results?.document_id;
    if (!docId || !results || namingResults || checkingNaming) return;
    // Soft-coded delay (ms) — gives the UI time to settle before the API call.
    const AUTO_NAMING_DELAY_MS = 800;
    const t = setTimeout(() => { runNamingCheck(); }, AUTO_NAMING_DELAY_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results?.document_id, documentId]);

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

  // Atomically persist calibration corrections to state and localStorage.
  const saveCalibration = (next) => {
    setCalibCorrections(next);
    try { localStorage.setItem(CALIB_STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  // Remove all stored corrections for the currently active drawing only.
  const clearDrawingCorrections = () => {
    if (!activeDrawing) return;
    const next = { ...calibCorrections };
    for (const k of Object.keys(next)) {
      if (k.startsWith(`${activeDrawing}:`)) delete next[k];
    }
    saveCalibration(next);
  };

  // Export all calibration corrections and tier stats as a downloadable JSON file.
  // Engineers can share this data to improve coordinate extraction accuracy over time.
  const exportCalibrationData = () => {
    try {
      const corrections = JSON.parse(localStorage.getItem(CALIB_STORAGE_KEY) || '{}');
      const stats      = JSON.parse(localStorage.getItem(CALIB_STATS_KEY)    || '{}');
      const payload = { exportedAt: new Date().toISOString(), corrections, stats };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `pid_calibration_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const fetchLegendKnowledge = async (projectId) => {
    try {
      const url = projectId
        ? `${API_PREFIX}/projects/${projectId}/legend/`
        : `${API_PREFIX}/legend-knowledge/`;
      const res = await axios.get(url, { headers: authHeader() });
      setLegendKnowledge(res.data?.legend_knowledge || null);
      setLegendScope(res.data?.scope || (projectId ? 'project' : 'global'));
      setLegendBuiltAt(res.data?.legend_built_at || null);
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
    fetchLegendKnowledge(p.project_id);
  };

  const handleBackToProjects = () => {
    clearInterval(pollRef.current);
    setSelectedProject(null);
    setHistory([]);
    resetUpload();
    setResults(null);
    setComparison(null);
    setLegendFile(null);
    setLegendKnowledge(null);
    setLegendScope(null);
    setLegendBuiltAt(null);
    setMessage({ type:'', text:'' });
  };

  const handleBuildLegend = async () => {
    if (!legendFile) {
      flash('error', 'Please choose a legend sheet file first.');
      return;
    }
    if (!selectedProject?.project_id) {
      flash('error', 'No project selected.');
      return;
    }
    setBuildingLegend(true);
    try {
      const fd = new FormData();
      fd.append('file', legendFile);
      const res = await axios.post(
        `${API_PREFIX}/projects/${selectedProject.project_id}/legend/build/`,
        fd,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
      );
      setLegendKnowledge(res.data?.legend_knowledge || null);
      setLegendScope('project');
      setLegendBuiltAt(res.data?.legend_built_at || null);
      setLegendFile(null);
      flash('success', 'Project legend built — this P&ID project will now use its own legend during analysis.');
    } catch (e) {
      flash('error', e?.response?.data?.error || 'Failed to build legend knowledge');
    } finally {
      setBuildingLegend(false);
    }
  };

  const handleClearProjectLegend = async () => {
    if (!selectedProject?.project_id) return;
    setClearingLegend(true);
    try {
      await axios.delete(
        `${API_PREFIX}/projects/${selectedProject.project_id}/legend/build/`,
        { headers: authHeader() }
      );
      setLegendKnowledge(null);
      setLegendScope(null);
      setLegendBuiltAt(null);
      flash('success', 'Project legend cleared — will fall back to global legend.');
      // Reload so we get the global fallback data
      fetchLegendKnowledge(selectedProject.project_id);
    } catch (e) {
      flash('error', 'Failed to clear project legend');
    } finally {
      setClearingLegend(false);
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
    // v5: accurate overlay positioning with smart occurrence selection.
    // ── Soft-coded calibration constants ────────────────────────────────────
    // Shift ALL anchored markers by these amounts (% of image dimensions).
    // Set to 0 to disable. Positive = shift right / down.
    // Tune these if a run of real-position markers is consistently offset in one
    // direction across the whole drawing (systematic canvas origin mismatch).
    const OVERLAY_CALIB_X_PCT = 0;
    const OVERLAY_CALIB_Y_PCT = 0;

    // Drawing content area bounds (% of page).  Positions outside this band are
    // likely in the title block / border — exclude them when picking the best
    // occurrence from an NPS size's 'all' array.
    // Typical P&ID (landscape A1): title block occupies right ~12% & bottom ~12%.
    const AREA_X_MIN = 1;
    const AREA_X_MAX = 96;
    const AREA_Y_MIN = 1;
    const AREA_Y_MAX = 87;

    // Drawing main-content centroid — used as the reference point when selecting
    // the single best occurrence from a tag's 'all' occurrences array. Biased
    // slightly above & left of page centre as instrument fields cluster there.
    const CONTENT_CX = 50;
    const CONTENT_CY = 40;
    // ────────────────────────────────────────────────────────────────────────

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

    // Pick the single best {x_pct, y_pct} from a position-entry (may have 'all').
    // Strategy: filter to main drawing area first, then pick the occurrence
    // whose Euclidean distance to the content centroid is smallest.
    // For position entries WITHOUT an 'all' array (direct tag hits), the entry
    // itself is returned unchanged — those are already single, precise points.
    const pickBestOcc = (pos) => {
      if (!pos) return null;
      if (!pos.all || pos.all.length === 0) {
        // Direct tag position (no 'all' array) — use as-is
        return (pos.x_pct != null && pos.y_pct != null) ? pos : null;
      }
      // Filter to drawing content area (excludes title block corners)
      const inArea = pos.all.filter(o =>
        o.x_pct >= AREA_X_MIN && o.x_pct <= AREA_X_MAX &&
        o.y_pct >= AREA_Y_MIN && o.y_pct <= AREA_Y_MAX
      );
      const pool = inArea.length > 0 ? inArea : pos.all;
      // Pick the occurrence nearest the drawing content centroid
      let best = pool[0];
      let bestDist = Infinity;
      for (const o of pool) {
        const dx = o.x_pct - CONTENT_CX;
        const dy = o.y_pct - CONTENT_CY;
        const d  = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; best = o; }
      }
      return { x_pct: best.x_pct, y_pct: best.y_pct };
    };

    // Prefer H-direction occurrence for line_tags (horizontal labels are the
    // primary pipeline designation text — more precisely rendered than rotated V).
    const pickBestLineTagOcc = (lt) => {
      const occs = (lt.occurrences || []).filter(o => o.x_pct != null && o.y_pct != null);
      if (occs.length === 0) return null;
      const hOcc = occs.find(o => o.direction === 'H');
      const candidate = hOcc ?? occs[0];
      return { x_pct: candidate.x_pct, y_pct: candidate.y_pct };
    };

    // Apply soft-coded calibration offset and clamp to visible canvas.
    const applyCalib = (xp, yp) => ({
      left: Math.min(AREA_X_MAX, Math.max(AREA_X_MIN, xp + OVERLAY_CALIB_X_PCT)),
      top:  Math.min(AREA_Y_MAX, Math.max(AREA_Y_MIN, yp + OVERLAY_CALIB_Y_PCT)),
    });

    // Resolve the best real position for a finding.
    // Priority 1 : exact normalised key match
    // Priority 2 : NPS size keys extracted from evidence (e.g. "8\"", "3\"")
    // Priority 3 : instrument / equipment tag IDs extracted from evidence (e.g. "PI-3610-16")
    // Priority 4 : line_tags fuzzy match (exact → sep-normalised → partial)
    // Priority 5 : red_annotations text match
    // Fallback    : null → deterministic hash-based heuristic position
    const resolveReal = (nk, rawKey) => {
      // P1: exact match on normalised key or original raw key
      //     pickBestOcc selects the nearest-to-centroid occurrence from the
      //     'all' array so the marker lands on an actual text element, not
      //     the arithmetic average of all occurrences.
      const r1 = pickBestOcc(realPositions[nk] ?? realPositions[rawKey] ?? null);
      if (r1) return { ...r1, tier: 'P1' };

      // P2: NPS size keys — try both the normalised key and original raw string
      //     so that smart-quote variants don't slip through normalisation
      for (const src of [nk, rawKey]) {
        for (const nps of extractNpsKeys(src)) {
          const r2 = pickBestOcc(realPositions[nps] ?? realPositions[normKey(nps)] ?? null);
          if (r2) return { ...r2, tier: 'P2' };
        }
      }

      // P3: instrument / equipment tag IDs extracted from evidence text
      for (const src of [nk, rawKey]) {
        for (const tag of extractInstrTags(src)) {
          const r3 = pickBestOcc(realPositions[tag] ?? realPositions[normKey(tag)] ?? null);
          if (r3) return { ...r3, tier: 'P3' };
        }
      }

      // P4: line_tags text match — resolves LN-001, LN-002, LSZ-010 findings
      // whose evidence is a pipeline designation like '4"-BD-4860-033842-X-N'.
      // Split by " · " to handle multi-tag evidence strings (LSZ-010).
      const lineTagsArr = activeDrawingData?.metadata?.line_tags || [];
      if (lineTagsArr.length > 0) {
        const candidates = [...new Set(
          [nk, normKey(rawKey)]
            .flatMap(s => s.split(/\s*[·\u00b7]\s*/).map(p => p.trim()))
            .filter(Boolean)
        )];

        // P4-exact: strict normalised key match
        for (const cand of candidates) {
          for (const lt of lineTagsArr) {
            const ltText = normKey(lt.text || '');
            if (!ltText) continue;
            if (ltText === cand || cand === ltText) {
              const occ = pickBestLineTagOcc(lt);
              if (occ) return { ...occ, tier: 'P4' };
            }
          }
        }

        // P4-norm: separator-normalised comparison — handles OCR reading '_' for '-'
        // or extra spaces introduced when joining splits across font runs.
        const normSep = (s) => s.replace(/[\s_]+/g, '-').replace(/-{2,}/g, '-').toUpperCase();
        for (const cand of candidates) {
          const nc = normSep(cand);
          if (nc.length < 8) continue;
          for (const lt of lineTagsArr) {
            const nltText = normSep(normKey(lt.text || ''));
            if (!nltText) continue;
            if (nltText === nc) {
              const occ = pickBestLineTagOcc(lt);
              if (occ) return { ...occ, tier: 'P4' };
            }
          }
        }

        // P4-partial: substring match for fragment evidence (min 8 chars to avoid noise).
        for (const cand of candidates) {
          if (cand.length < 8) continue;
          for (const lt of lineTagsArr) {
            const ltText = normKey(lt.text || '');
            if (!ltText || ltText.length < 8) continue;
            if (ltText.includes(cand) || cand.includes(ltText)) {
              const occ = pickBestLineTagOcc(lt);
              if (occ) return { ...occ, tier: 'P4' };
            }
          }
        }
      }

      // P5: red_annotations text match — resolves RED-001 findings and any
      // annotation-based findings (ANN-001, VLV-002/003) whose evidence text
      // appears as a red span on the drawing with a known bounding-box position.
      const redAnnsArr = activeDrawingData?.metadata?.red_annotations || [];
      if (redAnnsArr.length > 0) {
        const evNk = normKey(rawKey);
        for (const ra of redAnnsArr) {
          const raNk = normKey(ra.text || '');
          if (!raNk) continue;
          if (evNk.includes(raNk) || raNk.includes(evNk)) {
            if (ra.x_pct != null && ra.y_pct != null) {
              return { x_pct: ra.x_pct, y_pct: ra.y_pct, tier: 'P5' };
            }
          }
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

      // Apply any stored engineer correction for this finding — always wins over
      // extracted / heuristic positions. Keyed 'drawingId:findingId'.
      const corrKey = `${activeDrawing || 'drawing'}:${x.finding.id}`;
      const storedCorr = calibCorrections[corrKey];
      if (storedCorr) {
        nodes.push({ ...x, left: storedCorr.correctedLeft, top: storedCorr.correctedTop, anchored: true, tier: 'CX' });
        continue;
      }

      // One marker per unique finding group — use primary coord (x_pct/y_pct).
      // real.all contains every OCR occurrence; pickBestOcc already selected the
      // best single point so we read x_pct/y_pct directly here.
      if (real) {
        const xp = real.x_pct ?? real.all?.[0]?.x_pct;
        const yp = real.y_pct ?? real.all?.[0]?.y_pct;
        const pos = applyCalib(xp, yp);
        nodes.push({ ...x, ...pos, anchored: true, tier: real.tier || 'P?' });
      } else {
        // Deterministic pseudo-position from FNV-1a hash (dashed marker).
        const seed = `${activeDrawing || 'drawing'}:${nk}`;
        nodes.push({
          ...x,
          left: 8  + (stableUnit(seed, 11) * 84),
          top:  10 + (stableUnit(seed, 29) * 78),
          anchored: false,
          tier: 'FH',
        });
      }
    }
    return nodes;
  };

  const overlayNodes = buildOverlayNodes(
    (activeDrawingData?.issues || []).filter(f =>
      !HIDDEN_CATEGORIES.has(f.category) &&
      !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase())
    )
  );
  const visibleOverlayNodes = overlayNodes.filter(n => showUncertainHighlights || n.band !== 'low');

  // ── Anchored-findings filter ──────────────────────────────────────────────
  // Inline evidence-key normalizer — mirrors normKey defined inside buildOverlayNodes.
  // Strips smart/curly quotes so keys from different sources compare equal.
  const _normEvKey = (k) => (k || '').replace(/[\u201c\u201d\u2018\u2019]/g, '"').trim();
  // Build the set of normalized evidence keys for findings that have a REAL
  // drawing position (tier in FINDINGS_ANCHORED_TIERS, i.e. P1–P5 or CX).
  // This set is consumed by the Findings table IIFE below to restrict the list
  // to findings actually visible as markers on the canvas.
  const anchoredEvidenceKeys = FINDINGS_TABLE_ANCHORED_ONLY
    ? new Set(
        overlayNodes
          .filter(n => FINDINGS_ANCHORED_TIERS.has(n.tier))
          .map(n => _normEvKey(inferEvidenceKey(n.finding)))
      )
    : null;

  // Auto-record per-drawing resolution tier statistics to localStorage.
  // Accumulates across all P&IDs tested and can be exported for model training.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeDrawing || overlayNodes.length === 0) return;
    try {
      const tc = {};
      for (const n of overlayNodes) { const t = n.tier || 'FH'; tc[t] = (tc[t] || 0) + 1; }
      const rawStats = localStorage.getItem(CALIB_STATS_KEY);
      const allStats = rawStats ? JSON.parse(rawStats) : {};
      allStats[activeDrawing] = {
        drawingId: activeDrawing, timestamp: new Date().toISOString(),
        totalFindings: overlayNodes.length, tierCounts: tc,
        anchoredCount: overlayNodes.filter(n => n.anchored).length,
        correctedCount: overlayNodes.filter(n => n.tier === 'CX').length,
      };
      localStorage.setItem(CALIB_STATS_KEY, JSON.stringify(allStats));
    } catch { /* non-fatal */ }
  }, [activeDrawing]); // re-records whenever drawing changes

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
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-none">Legend Sheet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Per-project · overrides global legend during analysis</p>
                  </div>
                  {/* Scope badge */}
                  {legendScope === 'project' && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Project</span>
                  )}
                  {legendScope === 'global' && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Global fallback</span>
                  )}
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
                  {/* Built-at info */}
                  {legendScope === 'project' && legendBuiltAt && (
                    <p className="text-xs text-emerald-600">
                      Project legend built {new Date(legendBuiltAt).toLocaleDateString()}
                    </p>
                  )}
                  {/* File picker — any format */}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp"
                    onChange={e => setLegendFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {legendFile && (
                    <p className="text-xs text-slate-500 truncate">Selected: {legendFile.name}</p>
                  )}
                  {/* Build button */}
                  <button
                    onClick={handleBuildLegend}
                    disabled={buildingLegend || !legendFile}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-px"
                    style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 3px 10px rgba(37,99,235,0.25)' }}
                  >
                    {buildingLegend ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {buildingLegend ? 'Building…' : 'Build Project Legend'}
                  </button>
                  {/* Clear project legend (only if project legend is active) */}
                  {legendScope === 'project' && (
                    <button
                      onClick={handleClearProjectLegend}
                      disabled={clearingLegend}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-all"
                    >
                      {clearingLegend ? <Loader className="w-3 h-3 animate-spin" /> : null}
                      {clearingLegend ? 'Clearing…' : 'Clear Project Legend'}
                    </button>
                  )}
                  {legendKnowledge?.sources?.length > 0 && (
                    <p className="text-xs text-slate-400 truncate">
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
            ...( SHOW_COMPARE_PANEL ? [{
              id: 'comparison',
              label: 'Compare',
              icon: ({ cls }) => <BarChart2 className={cls} />,
              badge: comparison ? '✓' : null,
              badgeCls: 'bg-teal-500 text-white',
              accent: '#0f766e',
              glow: 'rgba(15,118,110,0.25)',
            }] : []),
            {
              id: 'equipment',
              label: 'Equipment',
              icon: ({ cls }) => <Cpu className={cls} />,
              badge: (() => {
                const tp = activeDrawingData?.metadata?.tag_positions || {};
                const k = Object.keys(tp).length;
                return k || (activeDrawingData?.metadata?.extraction_summary?.tags > 0 ? activeDrawingData.metadata.extraction_summary.tags : null);
              })(),
              badgeCls: 'bg-violet-500 text-white',
              accent: '#7c3aed',
              glow: 'rgba(124,58,237,0.25)',
            },
            {
              id: 'instrumentation',
              label: 'Instr.',
              icon: ({ cls }) => <Wrench className={cls} />,
              badge: (() => {
                // Show count of AI-detected issues from instr-relevant findings
                const instrCats = new Set(['instrument','tag','valve']);
                const cnt = (activeDrawingData?.issues || []).filter(f => instrCats.has(f.category)).length;
                return cnt || null;
              })(),
              badgeCls: 'bg-amber-500 text-white',
              accent: '#d97706',
              glow: 'rgba(217,119,6,0.25)',
            },
            {
              id: 'piping',
              label: 'Piping',
              icon: ({ cls }) => <Network className={cls} />,
              badge: (() => {
                const pipCats = new Set(['piping','line','spec','insulation','valve']);
                const cnt = (activeDrawingData?.issues || []).filter(f => pipCats.has(f.category)).length;
                return cnt || null;
              })(),
              badgeCls: 'bg-cyan-500 text-white',
              accent: '#0891b2',
              glow: 'rgba(8,145,178,0.25)',
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
            {
              id: 'performance',
              label: 'Perf.',
              icon: ({ cls }) => <Zap className={cls} />,
              badge: null,
              accent: '#10b981',
              glow: 'rgba(16,185,129,0.25)',
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
                      {/* Correction mode controls + calibration data export */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setCorrectionMode(v => !v)}
                          disabled={!focusedFindingId}
                          title={focusedFindingId
                            ? 'Click the drawing to place the marker at the exact location of the focused finding'
                            : 'Select (click) a finding in the table first to enable correction mode'}
                          className={`text-[10px] px-2 py-1 rounded border font-semibold transition-colors ${
                            correctionMode
                              ? 'bg-amber-400 text-white border-amber-500'
                              : focusedFindingId
                                ? 'bg-white text-slate-600 border-slate-300 hover:border-amber-400 hover:text-amber-700'
                                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          {correctionMode ? '⊕ Click drawing…' : '⊕ Correct Marker'}
                        </button>
                        <button
                          onClick={exportCalibrationData}
                          title="Export all correction records and resolution tier statistics as JSON for model training"
                          className="text-[10px] px-2 py-1 rounded border font-semibold bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          ↓ Export Data
                        </button>
                        {activeDrawing && Object.keys(calibCorrections).some(k => k.startsWith(`${activeDrawing}:`)) && (
                          <button
                            onClick={clearDrawingCorrections}
                            title="Remove all stored corrections for this drawing"
                            className="text-[10px] px-2 py-1 rounded border font-semibold bg-white text-red-400 border-red-200 hover:border-red-400 transition-colors"
                          >
                            ✕ Clear Fixes
                          </button>
                        )}
                      </div>
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
                      {visibleOverlayNodes.filter(n => n.tier === 'CX').length > 0 && (
                        <span className="ml-1 text-amber-600 font-bold">
                          · {visibleOverlayNodes.filter(n => n.tier === 'CX').length} corrected
                        </span>
                      )}
                      {SHOW_RESOLUTION_DEBUG && ' · ' + (() => {
                        const tc = {};
                        for (const n of overlayNodes) { const t = n.tier || 'FH'; tc[t] = (tc[t] || 0) + 1; }
                        return Object.entries(tc).sort().map(([t, c]) => `${t}:${c}`).join(' ');
                      })()}
                    </div>

                    {/* Correction mode active banner */}
                    {correctionMode && focusedFindingId && (
                      <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-semibold">
                        <span className="text-amber-500 text-base leading-none flex-shrink-0">⊕</span>
                        <span>
                          Click the <strong>exact location</strong> on the drawing to pin the marker
                          for <strong>{visibleOverlayNodes.find(n => n.finding.id === focusedFindingId)?.key ?? 'focused finding'}</strong>.
                        </span>
                        <button
                          onClick={() => setCorrectionMode(false)}
                          className="ml-auto text-amber-500 hover:text-amber-700 font-bold text-sm leading-none flex-shrink-0"
                        >✕</button>
                      </div>
                    )}

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
                          <div
                            className="relative w-full"
                            style={{
                              lineHeight: 0,
                              cursor: correctionMode && focusedFindingId ? 'crosshair' : 'default',
                            }}
                            onClick={(e) => {
                              if (!correctionMode || !focusedFindingId) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clL = Math.min(96, Math.max(1, ((e.clientX - rect.left)  / rect.width)  * 100));
                              const clT = Math.min(87, Math.max(1, ((e.clientY - rect.top)   / rect.height) * 100));
                              const corrKey  = `${activeDrawing || 'drawing'}:${focusedFindingId}`;
                              const existing = overlayNodes.find(n => n.finding.id === focusedFindingId);
                              saveCalibration({
                                ...calibCorrections,
                                [corrKey]: {
                                  drawingId:     activeDrawing,
                                  findingId:     focusedFindingId,
                                  ruleId:        existing?.finding?.rule_id,
                                  evidenceKey:   existing?.key,
                                  tier:          existing?.tier,
                                  originalLeft:  existing?.left  ?? null,
                                  originalTop:   existing?.top   ?? null,
                                  correctedLeft: clL,
                                  correctedTop:  clT,
                                  timestamp:     new Date().toISOString(),
                                },
                              });
                              setCorrectionMode(false);
                            }}
                          >
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
                                  <React.Fragment key={n.key}>
                                    {/* Ping ripple ring — cosmetic only, pointer-events disabled */}
                                    {OVERLAY_MARKER_ANIM_ENABLED && !isFocused && (
                                      <div
                                        aria-hidden="true"
                                        style={{
                                          position:      'absolute',
                                          left:          `${n.left}%`,
                                          top:           `${n.top}%`,
                                          width:         '18px',
                                          height:        '18px',
                                          borderRadius:  '50%',
                                          border:        `2.5px solid ${col.bg}`,
                                          backgroundColor: 'transparent',
                                          animation:     `markerPing ${OVERLAY_MARKER_ANIM_DURATION_MS}ms ease-out infinite`,
                                          pointerEvents: 'none',
                                          zIndex:        8,
                                        }}
                                      />
                                    )}
                                    <button
                                      onClick={() => jumpToFinding(n.finding.id)}
                                      title={OVERLAY_SHOW_MARKER_TOOLTIP ? `[${cat}] ${n.key} · ${n.finding.issue_observed}` : undefined}
                                      className={`absolute border-2 transition-all ${isFocused ? 'z-20 ring-4 ring-white/80' : 'z-10 hover:opacity-90'}`}
                                      style={{
                                        left: `${n.left}%`,
                                        top:  `${n.top}%`,
                                        backgroundColor: col.bg,
                                        borderColor: col.border,
                                        boxShadow: isFocused
                                          ? `0 0 0 4px ${col.glow}, 0 2px 8px rgba(0,0,0,0.5)`
                                          : `0 1px 4px rgba(0,0,0,0.4)`,
                                        animation: OVERLAY_MARKER_ANIM_ENABLED && !isFocused
                                          ? `markerGlow ${OVERLAY_MARKER_ANIM_DURATION_MS}ms ease-in-out infinite`
                                          : undefined,
                                        pointerEvents: 'all',
                                        ...shapeStyle,
                                        ...anchorStyle,
                                      }}
                                    />
                                  </React.Fragment>
                                );
                              })}

                              {/* Duplicate-Line Highlight Overlay */}
                              {showDupLineHighlights && (() => {
                                const dupNodes = visibleOverlayNodes.filter(
                                  n => DUP_LINE_RULES.has(n.finding?.rule_id)
                                );
                                const ltags = activeDrawingData?.metadata?.line_tags || [];
                                // Cross-verify: only show highlight markers for tags confirmed
                                // by at least one DUP_LINE_RULES rule-engine finding.
                                // This prevents false-positive blue rectangles from appearing
                                // for legitimate repeated labels (same pipe run) or OCR multi-
                                // pass near-duplicates that never triggered an actual finding.
                                const _allIssuesHL = (activeDrawingData?.issues || []).filter(f =>
                                  !HIDDEN_CATEGORIES.has(f.category) &&
                                  !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase())
                                );
                                const _dupHLConfirmed = DUP_OVERLAY_REQUIRE_FINDING
                                  ? new Set(
                                      _allIssuesHL
                                        .filter(f => DUP_LINE_RULES.has(f.rule_id))
                                        .flatMap(f =>
                                          ltags.filter(lt =>
                                            (f.evidence || '').includes(lt.text) ||
                                            (f.issue_observed || '').includes(lt.text)
                                          ).map(lt => lt.text)
                                        )
                                    )
                                  : null;
                                const tagHighlights = [];
                                for (const tag of ltags) {
                                  if ((tag.count || (tag.occurrences || []).length) < 2) continue;
                                  // Guard 1: must be referenced by a confirmed DUP_LINE_RULES finding
                                  if (DUP_OVERLAY_REQUIRE_FINDING && _dupHLConfirmed && !_dupHLConfirmed.has(tag.text)) continue;
                                  // Guard 2: all key sections must be fully parsed — eliminates OCR
                                  // artefacts and cloud-truncated partials that lack pipe_class/insulation
                                  if (DUP_OVERLAY_REQUIRE_FINDING) {
                                    const pop = DUP_OVERLAY_SECTION_KEYS.filter(k => tag[k] && String(tag[k]).trim()).length;
                                    if (pop < DUP_OVERLAY_MIN_SECTIONS) continue;
                                  }
                                  for (const [occIdx, occ] of (tag.occurrences || []).entries()) {
                                    if (occ.x_pct == null || occ.y_pct == null) continue;
                                    tagHighlights.push({
                                      key: `th-${occIdx}-${tag.text}-${occ.direction}-${occ.x_pct}-${occ.y_pct}`,
                                      left: Math.min(96, Math.max(1, occ.x_pct)),
                                      top:  Math.min(87, Math.max(1, occ.y_pct)),
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
                                          title={OVERLAY_SHOW_MARKER_TOOLTIP ? `${n.finding.rule_id}: ${n.finding.issue_observed}` : undefined}
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
                                        title={OVERLAY_SHOW_MARKER_TOOLTIP ? `Duplicate tag: ${h.label}` : undefined}
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
                                // Cross-verify: build confirmed-duplicate set from rule-engine findings.
                                // A line_tag is only a true duplicate if ALL its sections (size, fluid,
                                // area, sequence, pipe_class, insulation) match AND the rule engine
                                // has flagged it under a DUP_LINE_RULES rule ID.  Tags where any
                                // section differs, or where no finding was raised, are excluded so
                                // that legitimate repeated labels and OCR near-dupes don't produce dots.
                                const _allIssuesOcc = (activeDrawingData?.issues || []).filter(f =>
                                  !HIDDEN_CATEGORIES.has(f.category) &&
                                  !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase())
                                );
                                const _dupOccConfirmed = DUP_OVERLAY_REQUIRE_FINDING
                                  ? new Set(
                                      _allIssuesOcc
                                        .filter(f => DUP_LINE_RULES.has(f.rule_id))
                                        .flatMap(f =>
                                          ltags.filter(lt =>
                                            (f.evidence || '').includes(lt.text) ||
                                            (f.issue_observed || '').includes(lt.text)
                                          ).map(lt => lt.text)
                                        )
                                    )
                                  : null;
                                const occNodes = [];
                                for (const tag of ltags) {
                                  if ((tag.count || (tag.occurrences || []).length) < 2) continue;
                                  // Guard 1: confirmed by a rule-engine DUP_LINE_RULES finding
                                  if (DUP_OVERLAY_REQUIRE_FINDING && _dupOccConfirmed && !_dupOccConfirmed.has(tag.text)) continue;
                                  // Guard 2: all key sections must be fully parsed (eliminates noise tags)
                                  if (DUP_OVERLAY_REQUIRE_FINDING) {
                                    const pop = DUP_OVERLAY_SECTION_KEYS.filter(k => tag[k] && String(tag[k]).trim()).length;
                                    if (pop < DUP_OVERLAY_MIN_SECTIONS) continue;
                                  }
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
                                  // Cross-verify: only connect confirmed duplicate tags
                                  if (DUP_OVERLAY_REQUIRE_FINDING && _dupOccConfirmed && !_dupOccConfirmed.has(tag.text)) continue;
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
                                          title={OVERLAY_SHOW_MARKER_TOOLTIP ? `Duplicate: ${n.label} · found in ${n.direction} orientation${n.multi ? ' (H+V confirmed)' : ''}` : undefined}
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
                      const visibleIssues = activeDrawingData.issues.filter(f =>
                        !HIDDEN_CATEGORIES.has(f.category) &&
                        !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase()) &&
                        // Only include findings whose evidence key maps to a confirmed
                        // anchored drawing marker (tiers P1–P5 / CX); FH-only findings
                        // have no real canvas position and are hidden when the filter is on.
                        (!anchoredEvidenceKeys || anchoredEvidenceKeys.has(_normEvKey(inferEvidenceKey(f))))
                      );
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
                              {['critical','major','minor'].map(s => (
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
                              {filteredIssues.length} of {visibleIssues.length} {FINDINGS_TABLE_ANCHORED_ONLY ? 'on-drawing ' : ''}finding{visibleIssues.length !== 1 ? 's' : ''}
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
              const allIssuesHere = activeDrawingData?.issues || [];

              // ── Soft-coded: LSZ rule catalogue ─────────────────────────────────────
              const LINE_QC_RULES = {
                'LSZ-001': { short: 'Missing size annotation',      desc: 'Pipeline detected without an NPS size label — size is mandatory on line designations.',                                    checkName: 'Size Completeness',  icon: '📏', fix: 'Add the NPS size label to the affected line designation on the P&ID.' },
                'LSZ-002': { short: 'Conflicting sizes on segment', desc: 'Two or more different NPS sizes recorded on the same pipeline segment — inspect for mis-reads.',                          checkName: 'Size Consistency',   icon: '⚠️', fix: 'Verify the OCR extraction and check the drawing for any size reduction notation.' },
                'LSZ-003': { short: 'Valve bore mismatch',         desc: 'A valve bore size does not match the adjacent line size — spec break or wrong tag.',                                      checkName: 'Valve Bore',         icon: '🔧', fix: 'Confirm the valve bore spec in the instrument index or ISS and update the tag.' },
                'LSZ-004': { short: 'Inline size conflict',        desc: 'Multiple distinct NPS sizes appear on a single OCR line reference — possible scan artefact.',                             checkName: 'Annotation Clarity', icon: '🔍', fix: 'Check for scan artefacts or overlapping text; re-issue the drawing at higher resolution.' },
                'LSZ-005': { short: '3+ distinct NPS on drawing',  desc: '3 or more different pipe sizes found on this drawing — check for undocumented spec-breaks.',                              checkName: 'NPS Diversity',      icon: '📐', fix: 'Add spec-break symbols at all NPS transitions and document them in the line list.' },
                'LSZ-006': { short: 'NPS conflict — same base',    desc: 'Same pipeline designation base exists with conflicting NPS sizes — strong indicator of duplication.',                     checkName: 'Duplicate (NPS)',    icon: '🚨', fix: 'Reconcile the duplicate base designation; assign unique sequence numbers to each line.' },
                'LSZ-007': { short: 'Designation ×3 (same axis)',  desc: 'Identical pipeline designation appears 3+ times in the same orientation — likely copy-paste or OCR repeat.',              checkName: 'Duplicate (Count)',  icon: '🔁', fix: 'Review the drawing for copy-paste errors and ensure each pipeline has a unique tag.' },
                'LSZ-008': { short: 'H + V confirmed duplicate',   desc: 'Pipeline designation confirmed in both horizontal and vertical orientations — strong duplicate signal.',                   checkName: 'Duplicate (H+V)',    icon: '↕️', fix: 'Cross-check against the line list and remove the duplicate tag from the P&ID.' },
                'LSZ-009': { short: 'Cloud-boundary truncation',   desc: 'A cloud revision mark is masking part of a line designation — ensure the tag is fully visible.',                          checkName: 'Cloud Truncation',   icon: '☁️', fix: 'Move the revision cloud boundary so the line designation is fully exposed.' },
                'LSZ-010': { short: 'Shared suffix — copy-paste',  desc: 'Different pipeline identities share the same sequence/pipe-class/insulation suffix — copy-paste numbering error.',        checkName: 'Suffix Sharing',     icon: '📋', fix: 'Assign a unique sequence number to each pipeline and update both the P&ID and line list.' },
              };

              // ── Soft-coded: AI insight generators ──────────────────────────────────
              // Each entry is a pure function: (tags, findings) → insight | null.
              // Returns null when the condition is not met (hidden automatically).
              // Add new insight detectors here without touching the render logic.
              const LINE_AI_INSIGHT_GENERATORS = [
                // Multi-spec indicator: 3+ distinct NPS sizes is an elevated engineering risk
                (tags, _f) => {
                  const sizes = [...new Set(tags.map(t => t.size).filter(Boolean))];
                  if (sizes.length < 3) return null;
                  return { level: 'warning', icon: '📐', title: `${sizes.length} distinct pipe sizes detected`,
                    detail: `NPS ${sizes.slice(0,5).join(', ')}${sizes.length > 5 ? ' …' : ''}. Multi-spec drawings require spec-break symbols at all NPS transitions.` };
                },
                // Dominant fluid risk: warn if >60 % of lines carry a hazardous fluid code
                (tags, _f) => {
                  if (tags.length < 4) return null;
                  const counts = {};
                  tags.forEach(t => { if (t.fluid_code) counts[t.fluid_code] = (counts[t.fluid_code] || 0) + 1; });
                  const [topFluid, topCnt] = Object.entries(counts).sort((a,b) => b[1]-a[1])[0] || [];
                  const pct = topFluid ? Math.round(topCnt / tags.length * 100) : 0;
                  const HAZARDOUS_FLUID_CODES = new Set(['HC','H2S','HCL','NH3','SO2','CL2','CO','H2']); // soft-coded
                  if (!topFluid || pct < 60 || !HAZARDOUS_FLUID_CODES.has(topFluid.toUpperCase())) return null;
                  return { level: 'critical', icon: '⚠️', title: `${pct}% of lines carry ${topFluid} (hazardous)`,
                    detail: `${topCnt} of ${tags.length} pipeline designations use fluid code ${topFluid}. Verify all associated safety interlocks are in place.` };
                },
                // Copy-paste risk: many lines in same area with same pipe class
                (tags, _f) => {
                  if (tags.length < 5) return null;
                  const combos = {};
                  tags.forEach(t => {
                    const k = `${t.area_code || ''}|${t.pipe_class || ''}`;
                    if (t.area_code && t.pipe_class) combos[k] = (combos[k] || 0) + 1;
                  });
                  const maxCombo = Math.max(0, ...Object.values(combos));
                  if (maxCombo < 4) return null;
                  const [topKey] = Object.entries(combos).find(([,v]) => v === maxCombo) || [];
                  const [area, pc] = (topKey || '|').split('|');
                  return { level: 'info', icon: '📋', title: `${maxCombo} lines share area ${area} + class ${pc}`,
                    detail: `High repetition in one area/class group is a copy-paste risk marker. Verify all sequence numbers are unique.` };
                },
                // Duplicate lines detected message
                (_tags, findings) => {
                  const dupCnt = findings.filter(f => DUP_LINE_RULES.has(f.rule_id)).length;
                  if (dupCnt < 2) return null;
                  return { level: 'warning', icon: '🔁', title: `${dupCnt} duplicate-line findings need review`,
                    detail: `Duplicate designations inflate the line list and can indicate copy-paste errors or an OCR artefact. Review each finding before issuing the document.` };
                },
                // All-clear
                (_tags, findings) => {
                  const lineFds = findings.filter(f => LINE_ISSUE_CATEGORIES_CONST.has(f.category) || (f.rule_id||'').startsWith('LSZ'));
                  if (lineFds.length > 0) return null;
                  return { level: 'success', icon: '✅', title: 'All pipeline designations pass QC',
                    detail: `${_tags.length} line designations were extracted and verified against all 10 LSZ rules with zero findings.` };
                },
              ];

              // Soft-coded: which finding categories count as "line" quality issues.
              const LINE_ISSUE_CATEGORIES_CONST = new Set(['line_size']);
              const isLineFinding = (f) =>
                LINE_ISSUE_CATEGORIES_CONST.has(f.category) || (f.rule_id || '').startsWith('LSZ');

              // Soft-coded sub-tabs for the Lines panel.
              const LINE_SUBTABS = [
                { id: 'insights',     label: 'AI Insights',   icon: Brain,   color: '#7c3aed' },
                { id: 'qc',          label: 'QC Checks',     icon: Shield,  color: '#0d9488' },
                { id: 'designations',label: 'Designations',  icon: Ruler,   color: '#0891b2' },
                { id: 'analytics',   label: 'Analytics',     icon: BarChart2, color: '#6366f1' },
              ];

              // Soft-coded: sort options for the Designations sub-tab.
              const DESIGNATION_SORT_OPTIONS = [
                { v: 'issues', label: '⚡ Issues first' },
                { v: 'name',   label: 'A–Z Name' },
                { v: 'size',   label: 'NPS size' },
                { v: 'fluid',  label: 'Fluid code' },
              ];

              // Derived data
              const lineFindings = allIssuesHere.filter(isLineFinding);
              const criticalLF   = lineFindings.filter(f => f.severity === 'critical').length;
              const majorLF      = lineFindings.filter(f => f.severity === 'major').length;
              const minorLF      = lineFindings.filter(f => f.severity === 'minor').length;
              const multiAngleCount = lineTags.filter(lt => lt.multi_angle).length;
              const npsSet   = [...new Set(lineTags.map(lt => lt.size).filter(Boolean))];
              const fluidSet = [...new Set(lineTags.map(lt => lt.fluid_code).filter(Boolean))];
              const areaSet  = [...new Set(lineTags.map(lt => lt.area_code).filter(Boolean))];
              const dupCount = lineFindings.filter(f => DUP_LINE_RULES.has(f.rule_id)).length;

              // Map each line tag text → its related findings
              const tagFindingsMap = new Map();
              for (const f of lineFindings) {
                const ev = (f.evidence || f.issue || '').toLowerCase();
                for (const lt of lineTags) {
                  if (lt.text && ev.includes(lt.text.toLowerCase())) {
                    if (!tagFindingsMap.has(lt.text)) tagFindingsMap.set(lt.text, []);
                    tagFindingsMap.get(lt.text).push(f);
                  }
                }
              }

              // Highest severity for a tag
              const sevRank = { critical: 4, major: 3, minor: 2, info: 1 };
              const tagMaxSev = (text) => {
                const fds = tagFindingsMap.get(text) || [];
                if (!fds.length) return null;
                return fds.reduce((best, f) =>
                  (sevRank[f.severity] || 0) > (sevRank[best] || 0) ? f.severity : best, fds[0].severity);
              };

              const SEV_DOT_COLOR = {
                critical: '#dc2626', major: '#f97316', minor: '#fbbf24', info: '#3b82f6',
              };
              const SEV_BADGE_CLS = {
                critical: 'bg-red-100 text-red-800 border-red-300',
                major:    'bg-orange-100 text-orange-800 border-orange-300',
                minor:    'bg-yellow-100 text-yellow-800 border-yellow-300',
                info:     'bg-green-100 text-green-800 border-green-300',
              };
              const INSIGHT_LEVEL_STYLE = {
                critical: { bg: '#fef2f2', border: '#fca5a5', titleColor: '#991b1b', bar: '#dc2626' },
                warning:  { bg: '#fffbeb', border: '#fcd34d', titleColor: '#92400e', bar: '#f59e0b' },
                info:     { bg: '#eff6ff', border: '#93c5fd', titleColor: '#1e40af', bar: '#3b82f6' },
                success:  { bg: '#f0fdf4', border: '#86efac', titleColor: '#166534', bar: '#22c55e' },
              };

              // Search filter (designations tab)
              const query = lineTagSearch.trim().toLowerCase();

              // Apply sort + search to designations
              const sortedTags = [...lineTags].sort((a, b) => {
                if (linesSortBy === 'issues') {
                  const aHas = tagFindingsMap.has(a.text) ? 1 : 0;
                  const bHas = tagFindingsMap.has(b.text) ? 1 : 0;
                  if (aHas !== bHas) return bHas - aHas;
                  const aRank = sevRank[tagMaxSev(a.text)] || 0;
                  const bRank = sevRank[tagMaxSev(b.text)] || 0;
                  return bRank - aRank;
                }
                if (linesSortBy === 'size') return (a.size || '').localeCompare(b.size || '', undefined, { numeric: true });
                if (linesSortBy === 'fluid') return (a.fluid_code || '').localeCompare(b.fluid_code || '');
                return (a.text || '').localeCompare(b.text || ''); // 'name'
              });
              const filteredTags = query ? sortedTags.filter(lt =>
                lt.text?.toLowerCase().includes(query) ||
                lt.fluid_code?.toLowerCase().includes(query) ||
                lt.area_code?.toLowerCase().includes(query) ||
                lt.size?.toLowerCase().includes(query) ||
                lt.pipe_class?.toLowerCase().includes(query)
              ) : sortedTags;

              // QC findings filters
              const qcQ = qcSearch.trim().toLowerCase();
              const filteredFindings = lineFindings.filter(f => {
                if (qcSevFilter !== 'all' && f.severity !== qcSevFilter) return false;
                if (qcRuleFilter !== 'all' && f.rule_id !== qcRuleFilter) return false;
                if (!qcQ) return true;
                return (f.issue || '').toLowerCase().includes(qcQ) ||
                       (f.evidence || '').toLowerCase().includes(qcQ) ||
                       (f.rule_id || '').toLowerCase().includes(qcQ);
              });
              const uniqueRules = [...new Set(lineFindings.map(f => f.rule_id).filter(Boolean))].sort();

              // Group filteredFindings by rule_id for grouped QC view
              const findingsByRule = {};
              for (const f of filteredFindings) {
                const r = f.rule_id || 'OTHER';
                if (!findingsByRule[r]) findingsByRule[r] = [];
                findingsByRule[r].push(f);
              }

              // AI Insights — evaluate all generators
              const aiInsights = LINE_AI_INSIGHT_GENERATORS
                .map(gen => { try { return gen(lineTags, lineFindings); } catch { return null; } })
                .filter(Boolean);

              // Analytics distributions
              const npsDist   = npsSet.map(s => ({ label: `${s}"`, count: lineTags.filter(t => t.size === s).length }))
                                      .sort((a,b) => b.count - a.count);
              const fluidDist = fluidSet.map(fc => ({ label: fc, count: lineTags.filter(t => t.fluid_code === fc).length }))
                                        .sort((a,b) => b.count - a.count);
              const areaDist  = areaSet.map(ac => ({ label: ac, count: lineTags.filter(t => t.area_code === ac).length }))
                                       .sort((a,b) => b.count - a.count);
              const maxNpsCnt   = Math.max(1, ...npsDist.map(d => d.count));
              const maxFluidCnt = Math.max(1, ...fluidDist.map(d => d.count));
              const maxAreaCnt  = Math.max(1, ...areaDist.map(d => d.count));
              const cleanCount  = lineTags.length - tagFindingsMap.size;
              const qcScore     = lineTags.length > 0 ? Math.round(cleanCount / lineTags.length * 100) : 100;

              // ── QC score colour ─────────────────────────────────────────────────────
              // Soft-coded: score thresholds for colour grading.
              const QC_SCORE_EXCELLENT = 90;  // ≥ 90% → green
              const QC_SCORE_GOOD      = 70;  // ≥ 70% → teal
              const QC_SCORE_FAIR      = 50;  // ≥ 50% → amber
              // below → red
              const qcScoreColor = qcScore >= QC_SCORE_EXCELLENT ? '#22c55e'
                                 : qcScore >= QC_SCORE_GOOD      ? '#0d9488'
                                 : qcScore >= QC_SCORE_FAIR      ? '#f59e0b'
                                 : '#dc2626';

              if (lineTags.length === 0 && lineFindings.length === 0)
                return <div className="p-10 text-center text-slate-400 text-sm">No line designations or quality findings for this drawing.</div>;

              return (
                <div>
                  {/* ══ Panel header ══ */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
                    style={{ background: 'linear-gradient(to right, rgba(13,148,136,0.04), transparent)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow:'0 4px 12px rgba(13,148,136,0.3)' }}>
                      <Ruler className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Pipeline Lines
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>AI</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lineTags.length} designations · {lineFindings.length} QC finding{lineFindings.length !== 1 ? 's' : ''}
                        {multiAngleCount > 0 ? ` · ${multiAngleCount} H+V confirmed` : ''}
                        {` · ${npsSet.length} NPS size${npsSet.length !== 1 ? 's' : ''}`}
                        {` · ${fluidSet.length} fluid code${fluidSet.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {/* QC score ring */}
                    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
                      <div className="relative w-12 h-12">
                        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                          <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="22" cy="22" r="17" fill="none" stroke={qcScoreColor} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 17 * qcScore / 100} ${2 * Math.PI * 17 * (1 - qcScore / 100)}`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color: qcScoreColor }}>{qcScore}%</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">QC Score</span>
                    </div>
                    {/* Traffic-light badges */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {criticalLF > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{criticalLF} CRIT</span>}
                      {majorLF   > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">{majorLF} MAJ</span>}
                      {minorLF   > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">{minorLF} MIN</span>}
                      {lineFindings.length === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All Pass</span>}
                    </div>
                  </div>

                  {/* ══ QC summary stat bar ══ */}
                  <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {[
                      { v: lineTags.length,  label: 'Total Lines',  color:'#0d9488', bg:'rgba(13,148,136,0.08)',  border:'rgba(13,148,136,0.2)' },
                      { v: cleanCount,        label: 'Clean',        color:'#16a34a', bg:'rgba(22,163,74,0.08)',   border:'rgba(22,163,74,0.2)'  },
                      { v: criticalLF,        label: 'Critical',     color:'#dc2626', bg:'rgba(220,38,38,0.07)',   border:'rgba(220,38,38,0.2)'  },
                      { v: majorLF,           label: 'Major',        color:'#ea580c', bg:'rgba(234,88,12,0.07)',   border:'rgba(234,88,12,0.2)'  },
                      { v: dupCount,          label: 'Duplicates',   color:'#0284c7', bg:'rgba(2,132,199,0.07)',   border:'rgba(2,132,199,0.2)'  },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-2.5 text-center relative overflow-hidden"
                        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        {/* Subtle background progress bar */}
                        {lineTags.length > 0 && (
                          <div className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-700"
                            style={{ width: `${c.v / lineTags.length * 100}%`, background: c.color, opacity: 0.5 }} />
                        )}
                        <p className="font-black text-xl leading-none" style={{ color: c.color }}>{c.v}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ══ Sub-tab switcher ══ */}
                  <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    {LINE_SUBTABS.map(tab => {
                      const TabIcon = tab.icon;
                      const active  = lineQcSubTab === tab.id;
                      const cnt = tab.id === 'qc' ? lineFindings.length
                                : tab.id === 'designations' ? lineTags.length
                                : tab.id === 'insights' ? aiInsights.length
                                : null;
                      return (
                        <button key={tab.id}
                          onClick={() => setLineQcSubTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                            active ? 'border-b-2 bg-white shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          style={active ? { color: tab.color, borderColor: tab.color } : undefined}>
                          <TabIcon className="w-3.5 h-3.5" />
                          {tab.label}
                          {cnt !== null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                              active ? 'text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                            style={active ? { background: tab.color } : undefined}>
                              {cnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ════════════════════════════════════
                      AI INSIGHTS sub-tab
                  ════════════════════════════════════ */}
                  {lineQcSubTab === 'insights' && (
                    <div className="p-5 flex flex-col gap-3">
                      {/* Intro banner */}
                      <div className="flex items-start gap-3 p-3 rounded-xl border"
                        style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(99,102,241,0.04))', borderColor:'rgba(124,58,237,0.2)' }}>
                        <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7c3aed' }} />
                        <div>
                          <p className="text-xs font-bold text-violet-800">AI Line Analysis</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Automated pattern recognition across {lineTags.length} pipeline designations and {lineFindings.length} QC findings.
                            Insights are generated by soft-coded heuristic rules — no external call needed.
                          </p>
                        </div>
                      </div>
                      {aiInsights.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                          <CheckCircle className="w-10 h-10 text-emerald-400" />
                          <p className="text-sm font-semibold">No actionable AI insights</p>
                          <p className="text-xs">All pattern checks passed for this drawing.</p>
                        </div>
                      ) : (
                        aiInsights.map((ins, i) => {
                          const st = INSIGHT_LEVEL_STYLE[ins.level] || INSIGHT_LEVEL_STYLE.info;
                          return (
                            <div key={i} className="rounded-xl border p-4 flex gap-3 transition-all"
                              style={{ background: st.bg, borderColor: st.border, animation:`cardIn 0.2s ease-out ${i*0.06}s both` }}>
                              {/* Left accent bar */}
                              <div className="w-1 rounded-full flex-shrink-0" style={{ background: st.bar }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base leading-none">{ins.icon}</span>
                                  <p className="text-xs font-bold leading-snug" style={{ color: st.titleColor }}>{ins.title}</p>
                                  <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full text-white uppercase"
                                    style={{ background: st.bar }}>{ins.level}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{ins.detail}</p>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Checklist of all rules run */}
                      <div className="mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rules Engine — 10 LSZ checks run</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(LINE_QC_RULES).map(([rid, def]) => {
                            const cnt = lineFindings.filter(f => f.rule_id === rid).length;
                            return (
                              <div key={rid} title={def.desc}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                  cnt > 0 ? 'border-orange-200 bg-orange-50 text-orange-700'
                                  : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                }`}>
                                <span>{cnt > 0 ? def.icon : '✅'}</span>
                                <code className="font-mono">{rid}</code>
                                {cnt > 0 && <span className="ml-0.5 bg-orange-200 text-orange-800 px-1 rounded-full font-black">{cnt}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════
                      QC CHECKS sub-tab
                  ════════════════════════════════════ */}
                  {lineQcSubTab === 'qc' && (
                    <div>
                      {lineFindings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #86efac' }}>
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                          </div>
                          <p className="text-base font-bold text-slate-700">All Line Designations Pass QC</p>
                          <p className="text-xs text-slate-400 text-center max-w-xs">
                            The rule engine found no line-designation quality issues on this drawing.
                            {lineTags.length > 0 && ` ${lineTags.length} pipeline designations were extracted and verified.`}
                          </p>
                        </div>
                      ) : (
                        <div>
                          {/* Rule chips */}
                          <div className="px-5 pt-4 pb-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter by Rule</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {Object.entries(LINE_QC_RULES).map(([rid, def]) => {
                                const cnt = lineFindings.filter(f => f.rule_id === rid).length;
                                const active = qcRuleFilter === rid;
                                return (
                                  <button key={rid}
                                    onClick={() => setQcRuleFilter(r => r === rid ? 'all' : rid)}
                                    title={def.desc}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                      cnt > 0
                                        ? active ? 'text-white border-transparent shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:shadow-sm'
                                        : 'bg-slate-50 border-slate-100 text-slate-400 cursor-default'
                                    }`}
                                    disabled={cnt === 0}
                                    style={cnt > 0 && active ? { background:'linear-gradient(135deg,#0d9488,#0891b2)' } : undefined}>
                                    <span>{def.icon}</span>
                                    <code className="font-mono">{rid}</code>
                                    {cnt > 0 && (
                                      <span className={`ml-0.5 px-1 rounded-full font-black ${active ? 'bg-white/25 text-white' : 'bg-teal-50 text-teal-700'}`}>{cnt}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Search + severity filter */}
                          <div className="px-5 py-2 border-t border-slate-100 flex gap-2 items-center flex-wrap">
                            <div className="relative flex-1 min-w-[180px]">
                              <input type="text" value={qcSearch} onChange={e => setQcSearch(e.target.value)}
                                placeholder="Search findings, evidence, rule…"
                                className="w-full text-xs pl-7 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition" />
                              <ScanLine className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" />
                              {qcSearch && <button onClick={() => setQcSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                            </div>
                            <select value={qcSevFilter} onChange={e => setQcSevFilter(e.target.value)}
                              className="text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer hover:border-teal-300">
                              <option value="all">All severities</option>
                              {['critical','major','minor','info'].map(s => (
                                <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>
                              ))}
                            </select>
                            {(qcSevFilter !== 'all' || qcRuleFilter !== 'all' || qcSearch) && (
                              <button onClick={() => { setQcSevFilter('all'); setQcRuleFilter('all'); setQcSearch(''); }}
                                className="text-xs text-teal-600 hover:text-teal-800 font-semibold underline">clear filters</button>
                            )}
                            <span className="text-[10px] text-slate-400 ml-auto">{filteredFindings.length} of {lineFindings.length} findings</span>
                          </div>

                          {/* Findings list — expandable cards */}
                          <div className="overflow-y-auto" style={{ maxHeight: '56vh' }}>
                            {filteredFindings.length === 0 ? (
                              <div className="py-12 text-center text-slate-400 text-sm">No findings match current filters.</div>
                            ) : (
                              <div className="divide-y divide-slate-50">
                                {filteredFindings.map((f, idx) => {
                                  const ruleDef  = LINE_QC_RULES[f.rule_id] || {};
                                  const isDup    = DUP_LINE_RULES.has(f.rule_id);
                                  const isCloud  = CLOUD_TRUNC_RULES.has(f.rule_id);
                                  const isSuffix = SHARED_SUFFIX_RULES.has(f.rule_id);
                                  const isExpanded = expandedFindingId === (f.id || idx);
                                  return (
                                    <div key={f.id || idx}
                                      className={`transition-all duration-200 ${isExpanded ? 'bg-teal-50/40' : 'hover:bg-slate-50/70'}`}
                                      style={{ animation:`cardIn 0.2s ease-out ${Math.min(idx*0.025,0.4)}s both` }}>
                                      {/* Main row — always visible */}
                                      <div className="px-5 py-3 cursor-pointer"
                                        onClick={() => setExpandedFindingId(prev => prev === (f.id||idx) ? null : (f.id||idx))}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <code className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border"
                                            style={{ background:'rgba(13,148,136,0.07)', borderColor:'rgba(13,148,136,0.2)', color:'#0d9488' }}>
                                            {f.rule_id}
                                          </code>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_BADGE_CLS[f.severity] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {f.severity?.toUpperCase()}
                                          </span>
                                          {ruleDef.checkName && (
                                            <span className="text-[10px] text-slate-500 font-semibold">{ruleDef.icon} {ruleDef.checkName}</span>
                                          )}
                                          {isDup && !isCloud && !isSuffix && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-300">Duplicate</span>
                                          )}
                                          {isCloud && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">☁️ Cloud</span>
                                          )}
                                          {isSuffix && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">📋 Suffix</span>
                                          )}
                                          <div className="ml-auto flex items-center gap-2">
                                            <button className="text-[10px] flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-medium"
                                              onClick={e => { e.stopPropagation(); setActivePanel('findings'); setFocusedFindingId(f.id); setTimeout(() => jumpToFinding(f.id), 150); }}>
                                              <Eye className="w-3 h-3" /> Locate
                                            </button>
                                            <span className="text-slate-300">{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
                                          </div>
                                        </div>
                                        {ruleDef.short && <p className="text-[10px] font-semibold text-teal-700 mt-1">{ruleDef.short}</p>}
                                        <p className="text-xs text-slate-700 leading-relaxed mt-0.5 line-clamp-1">{f.issue}</p>
                                      </div>

                                      {/* Expanded detail */}
                                      {isExpanded && (
                                        <div className="px-5 pb-4 space-y-2 border-t border-teal-100/60"
                                          style={{ animation:'fadeUp 0.18s ease-out both' }}>
                                          {/* Full issue text */}
                                          <p className="text-xs text-slate-700 leading-relaxed pt-2">{f.issue}</p>
                                          {/* Evidence tag */}
                                          {f.evidence && (
                                            <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                                              <Tag className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                                              <code className="font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 break-all">{f.evidence}</code>
                                            </div>
                                          )}
                                          {/* Rule description */}
                                          {ruleDef.desc && (
                                            <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                                              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-400" />
                                              <span className="leading-relaxed">{ruleDef.desc}</span>
                                            </div>
                                          )}
                                          {/* AI Fix recommendation */}
                                          {ruleDef.fix && (
                                            <div className="flex items-start gap-1.5 p-2 rounded-lg border text-[10px]"
                                              style={{ background:'rgba(124,58,237,0.04)', borderColor:'rgba(124,58,237,0.15)' }}>
                                              <Brain className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'#7c3aed' }} />
                                              <div>
                                                <span className="font-bold text-violet-700">AI Recommendation: </span>
                                                <span className="text-slate-600">{ruleDef.fix}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════════════════════════════════
                      DESIGNATIONS sub-tab
                  ════════════════════════════════════ */}
                  {lineQcSubTab === 'designations' && (
                    <div>
                      {/* Toolbar: search + sort + view mode */}
                      <div className="px-5 py-3 border-b border-slate-100 space-y-2">
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <input type="text" value={lineTagSearch} onChange={e => setLineTagSearch(e.target.value)}
                              placeholder={`Search ${lineTags.length} designations…`}
                              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-teal-200 bg-white/80 text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-300/50" />
                            <ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" />
                            {lineTagSearch && <button onClick={() => setLineTagSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                          </div>
                          {/* Sort selector */}
                          <select value={linesSortBy} onChange={e => setLinesSortBy(e.target.value)}
                            className="text-xs px-2 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer hover:border-teal-300 flex-shrink-0">
                            {DESIGNATION_SORT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                          {/* Grid / List toggle */}
                          <div className="flex rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                            {[{m:'grid',ic:'⊞'},{m:'list',ic:'≡'}].map(({m,ic}) => (
                              <button key={m} onClick={() => setLinesViewMode(m)}
                                className={`px-2.5 py-1.5 text-xs font-bold transition-all ${linesViewMode === m ? 'bg-teal-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {npsSet.length} NPS sizes · {fluidSet.length} fluid codes · {areaSet.length} area codes
                          {multiAngleCount > 0 && ` · ${multiAngleCount} H+V confirmed`}
                          {tagFindingsMap.size > 0 && <span className="ml-2 text-orange-500 font-semibold">· {tagFindingsMap.size} tags with issues</span>}
                        </p>
                      </div>

                      {/* Cards / List */}
                      <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: '62vh' }}>
                        {filteredTags.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">No designations match search.</div>
                        ) : linesViewMode === 'grid' ? (
                          <div className="grid gap-2" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(165px,1fr))' }}>
                            {filteredTags.map((lt, idx) => {
                              const isFocused = focusedLineTagKey === lt.text;
                              const maxSev    = tagMaxSev(lt.text);
                              const hasIssue  = !!maxSev;
                              const issueCnt  = (tagFindingsMap.get(lt.text) || []).length;
                              return (
                                <div key={lt.text}
                                  id={`line-tag-row-${lt.text}`}
                                  onClick={() => { setFocusedLineTagKey(prev => prev === lt.text ? null : lt.text); setShowLineTagOverlay(true); }}
                                  className={`relative rounded-xl border cursor-pointer transition-all duration-200 p-3 flex flex-col gap-1.5 overflow-hidden ${
                                    isFocused  ? 'border-teal-400 bg-teal-50 shadow-lg shadow-teal-100/60'
                                    : hasIssue  ? 'border-orange-200 bg-orange-50/40 hover:border-orange-400 hover:shadow-md'
                                    : lt.multi_angle ? 'border-teal-200 bg-white hover:border-teal-400 hover:shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'
                                  }`}
                                  style={{ animation:`cardIn 0.25s ease-out ${Math.min(idx*0.02,0.4)}s both` }}>
                                  {/* Top colour bar */}
                                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{
                                    background: hasIssue        ? `linear-gradient(90deg,${SEV_DOT_COLOR[maxSev]},${SEV_DOT_COLOR[maxSev]}88)`
                                               : isFocused || lt.multi_angle ? 'linear-gradient(90deg,#0d9488,#14b8a6,#06b6d4)'
                                               : 'linear-gradient(90deg,#e2e8f0,#cbd5e1)'
                                  }} />
                                  <div className="flex items-center justify-between gap-1">
                                    <code className={`text-[11px] font-mono font-bold truncate flex-1 ${isFocused ? 'text-teal-700' : hasIssue ? 'text-orange-800' : 'text-slate-800'}`}>
                                      {lt.text}
                                    </code>
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ background: hasIssue ? SEV_DOT_COLOR[maxSev] : '#10b981',
                                        boxShadow: `0 0 5px ${hasIssue ? SEV_DOT_COLOR[maxSev] : '#10b981'}88` }}
                                      title={hasIssue ? `${issueCnt} issue(s): ${maxSev}` : 'QC pass'} />
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {lt.size       && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{lt.size}"</span>}
                                    {lt.fluid_code && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{lt.fluid_code}</span>}
                                    {lt.area_code  && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{lt.area_code}</span>}
                                    {lt.pipe_class && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">{lt.pipe_class}</span>}
                                  </div>
                                  {hasIssue && (
                                    <p className="text-[10px] text-orange-600 font-semibold">{issueCnt} QC issue{issueCnt !== 1 ? 's' : ''} · {maxSev}</p>
                                  )}
                                  {lt.multi_angle && !hasIssue && (
                                    <p className="text-[10px] text-teal-600 font-semibold">↕️ H+V confirmed</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* List view */
                          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                            {/* List header */}
                            <div className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2 bg-slate-50"
                              style={{ gridTemplateColumns: '1fr 60px 60px 60px 70px 80px' }}>
                              <span>Designation</span><span>NPS</span><span>Fluid</span><span>Area</span><span>Class</span><span>QC Status</span>
                            </div>
                            {filteredTags.map((lt, idx) => {
                              const maxSev   = tagMaxSev(lt.text);
                              const hasIssue = !!maxSev;
                              const issueCnt = (tagFindingsMap.get(lt.text) || []).length;
                              const isFocused = focusedLineTagKey === lt.text;
                              return (
                                <div key={lt.text}
                                  onClick={() => { setFocusedLineTagKey(prev => prev === lt.text ? null : lt.text); setShowLineTagOverlay(true); }}
                                  className={`grid items-center text-xs px-4 py-2.5 cursor-pointer transition-all ${
                                    isFocused ? 'bg-teal-50 border-l-2 border-teal-400' : 'hover:bg-slate-50/80 border-l-2 border-transparent'
                                  }`}
                                  style={{ gridTemplateColumns: '1fr 60px 60px 60px 70px 80px', animation:`cardIn 0.2s ease-out ${Math.min(idx*0.015,0.3)}s both` }}>
                                  <code className={`font-mono font-bold text-[11px] truncate ${isFocused ? 'text-teal-700' : hasIssue ? 'text-orange-800' : 'text-slate-800'}`}>{lt.text}</code>
                                  <span className="text-[10px] font-bold text-blue-600">{lt.size ? `${lt.size}"` : '—'}</span>
                                  <span className="text-[10px] font-semibold text-amber-700">{lt.fluid_code || '—'}</span>
                                  <span className="text-[10px] text-slate-500">{lt.area_code || '—'}</span>
                                  <span className="text-[10px] text-purple-600">{lt.pipe_class || '—'}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ background: hasIssue ? SEV_DOT_COLOR[maxSev] : '#10b981' }} />
                                    <span className={`text-[10px] font-semibold ${hasIssue ? 'text-orange-600' : 'text-emerald-600'}`}>
                                      {hasIssue ? `${issueCnt} issue${issueCnt!==1?'s':''}` : 'Pass'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="px-5 py-2 border-t border-slate-100 text-[10px] text-slate-400">
                        {filteredTags.length} of {lineTags.length} designations shown · sorted by {DESIGNATION_SORT_OPTIONS.find(o=>o.v===linesSortBy)?.label}
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════
                      ANALYTICS sub-tab
                  ════════════════════════════════════ */}
                  {lineQcSubTab === 'analytics' && (
                    <div className="p-5 space-y-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                      {/* ── Overall QC score ── */}
                      <div className="rounded-xl border p-4 flex items-center gap-5"
                        style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(139,92,246,0.04))', borderColor:'rgba(99,102,241,0.2)' }}>
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                            <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                            <circle cx="22" cy="22" r="17" fill="none" stroke={qcScoreColor} strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black leading-none" style={{ color: qcScoreColor }}>{qcScore}%</span>
                            <span className="text-[9px] text-slate-400 font-medium">QC</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 mb-1">Line Designation Quality Score</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {cleanCount} of {lineTags.length} designations pass all checks.
                            {criticalLF > 0 && ` ${criticalLF} critical finding${criticalLF!==1?'s':''} require immediate attention.`}
                            {majorLF   > 0 && ` ${majorLF} major finding${majorLF!==1?'s':''} need review before issue.`}
                          </p>
                          <div className="flex gap-3 mt-2">
                            {[['Clean', cleanCount, '#22c55e'],['Critical',criticalLF,'#dc2626'],['Major',majorLF,'#ea580c'],['Minor',minorLF,'#f59e0b']].map(([l,v,c])=>(
                              <div key={l} className="text-center">
                                <p className="text-sm font-black leading-none" style={{color:c}}>{v}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── NPS Distribution ── */}
                      {npsDist.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                            <span className="text-base">📏</span> NPS Size Distribution
                            <span className="ml-auto text-[10px] font-normal text-slate-400">{npsSet.length} sizes across {lineTags.length} lines</span>
                          </p>
                          <div className="space-y-2">
                            {npsDist.slice(0, 10).map(({label, count}) => (
                              <div key={label} className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-blue-700 w-10 text-right flex-shrink-0">{label}</span>
                                <div className="flex-1 bg-blue-50 rounded-full h-4 overflow-hidden">
                                  <div className="h-full rounded-full flex items-center pl-2 transition-all duration-700"
                                    style={{ width:`${count/maxNpsCnt*100}%`, background:'linear-gradient(90deg,#3b82f6,#60a5fa)', minWidth:'1.5rem' }}>
                                    <span className="text-[9px] font-black text-white leading-none">{count}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 w-10 flex-shrink-0">{Math.round(count/lineTags.length*100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Fluid Code Distribution ── */}
                      {fluidDist.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                            <span className="text-base">💧</span> Fluid Code Distribution
                            <span className="ml-auto text-[10px] font-normal text-slate-400">{fluidSet.length} fluid types</span>
                          </p>
                          <div className="grid gap-2" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))' }}>
                            {fluidDist.slice(0, 12).map(({label, count}) => (
                              <div key={label} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-amber-800">{label}</span>
                                  <span className="text-[10px] font-bold text-amber-600">{count}</span>
                                </div>
                                <div className="w-full bg-amber-100 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full" style={{ width:`${count/maxFluidCnt*100}%`, background:'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
                                </div>
                                <span className="text-[9px] text-amber-600">{Math.round(count/lineTags.length*100)}% of lines</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Area Code Coverage ── */}
                      {areaDist.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                            <span className="text-base">🗺️</span> Area Code Coverage
                            <span className="ml-auto text-[10px] font-normal text-slate-400">{areaSet.length} areas</span>
                          </p>
                          <div className="space-y-1.5">
                            {areaDist.slice(0, 8).map(({label, count}) => (
                              <div key={label} className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-slate-600 w-14 text-right flex-shrink-0">{label}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                  <div className="h-full rounded-full flex items-center pl-1.5 transition-all duration-700"
                                    style={{ width:`${count/maxAreaCnt*100}%`, background:'linear-gradient(90deg,#6366f1,#818cf8)', minWidth:'1.5rem' }}>
                                    <span className="text-[9px] font-black text-white leading-none">{count}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 w-8 flex-shrink-0">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── QC by Rule breakdown ── */}
                      {lineFindings.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                            <span className="text-base">🔍</span> QC Findings by Rule
                          </p>
                          <div className="space-y-2">
                            {Object.entries(LINE_QC_RULES).map(([rid, def]) => {
                              const cnt = lineFindings.filter(f => f.rule_id === rid).length;
                              if (!cnt) return null;
                              const maxCnt = Math.max(1, ...Object.entries(LINE_QC_RULES).map(([r]) => lineFindings.filter(f=>f.rule_id===r).length));
                              return (
                                <button key={rid} onClick={() => { setLineQcSubTab('qc'); setQcRuleFilter(rid); }}
                                  className="w-full flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-all group text-left">
                                  <code className="text-[10px] font-mono font-bold text-teal-700 w-16 flex-shrink-0">{rid}</code>
                                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width:`${cnt/maxCnt*100}%`, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-teal-700 w-6 text-right flex-shrink-0">{cnt}</span>
                                  <span className="text-[10px] text-slate-400 flex-1 truncate group-hover:text-teal-600">{def.short}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══ Footer ══ */}
                  <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span style={{ color:'#0d9488' }}>
                      {lineQcSubTab === 'qc'          ? `${filteredFindings.length} of ${lineFindings.length} quality findings`
                       : lineQcSubTab === 'designations' ? `${filteredTags.length} of ${lineTags.length} designations`
                       : lineQcSubTab === 'insights'      ? `${aiInsights.length} AI insight${aiInsights.length!==1?'s':''}`
                       : `QC score: ${qcScore}%`}
                    </span>
                    <span>LSZ-001 – LSZ-010 · 10 line quality rules · AI analysis active</span>
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
              // ── Soft-coded: NAM rule catalogue ──────────────────────────────────────
              // Add/edit ruleId entries here — nothing else needs to change.
              const NAMING_QC_RULES = {
                'NAM-001': { short: 'Wrong separator',     desc: 'Tag uses wrong delimiter character (e.g. "." or space instead of "-").',    icon: '🔡', checkName: 'Separator Format'   },
                'NAM-002': { short: 'Unknown acronym',     desc: 'Instrument function acronym is not in the project or ISA 5.1 dictionary.', icon: '❓', checkName: 'Acronym Registry'  },
                'NAM-003': { short: 'Incomplete tag',      desc: 'Tag is missing one or more mandatory fields (prefix, loop, suffix).',       icon: '⚠️', checkName: 'Tag Completeness' },
                'NAM-004': { short: 'Inconsistent format', desc: 'Tag format deviates from the dominant format pattern on this drawing.',     icon: '🔄', checkName: 'Format Consistency'},
                'NAM-AI':  { short: 'AI visual finding',   desc: 'AI vision model detected a potential tag-naming issue not found by rules.', icon: '🤖', checkName: 'AI Vision Check'   },
              };
              const NAMING_SEV_BADGE = {
                critical:'bg-red-100 text-red-800 border border-red-300',
                major:'bg-orange-100 text-orange-800 border border-orange-300',
                minor:'bg-yellow-100 text-yellow-800 border border-yellow-300',
                info:'bg-emerald-100 text-emerald-800 border border-emerald-300',
              };
              const SOURCE_BADGE = {
                deterministic:{ label:'📐 Rule Engine', style:'bg-blue-50 text-blue-700 border border-blue-200' },
                ai_vision:{ label:'🤖 AI Vision', style:'bg-purple-50 text-purple-700 border border-purple-200' },
              };
              // Derived
              const issues = namingResults?.naming_issues || [];
              const bySev = namingResults?.by_severity || {};
              const critN  = bySev.critical || 0;
              const majN   = bySev.major    || 0;
              const minN   = bySev.minor    || 0;
              const aiN    = issues.filter(i => i.source === 'ai_vision').length;
              const nmQ    = namingSearch.trim().toLowerCase();
              const filteredNaming = issues.filter(iss => {
                if (namingSevFilter !== 'all' && iss.severity !== namingSevFilter) return false;
                if (!nmQ) return true;
                return (iss.description || '').toLowerCase().includes(nmQ) ||
                       (iss.tag_found   || '').toLowerCase().includes(nmQ) ||
                       (iss.rule_id     || '').toLowerCase().includes(nmQ) ||
                       (iss.suggested_fix || '').toLowerCase().includes(nmQ);
              });
              const uniqueNamingRules = [...new Set(issues.map(i => i.rule_id).filter(Boolean))];
              return (
                <div>
                  {/* ── Header (auto-run — no manual button) ── */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                        {checkingNaming
                          ? <Loader className="w-4 h-4 text-white animate-spin" />
                          : <Type className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Tag Naming &amp; Acronym QC</h2>
                        {checkingNaming
                          ? <p className="text-xs text-violet-500 animate-pulse">Running check — analysing tags against ISA 5.1…</p>
                          : namingResults
                            ? <p className="text-xs text-slate-500">{namingResults.total} issue{namingResults.total !== 1 ? 's' : ''} · page {(namingResults.page_index ?? 0) + 1} · {namingResults.ai_used ? 'AI + Rules' : 'Rules only'}</p>
                            : <p className="text-xs text-slate-400">Awaiting analysis completion…</p>}
                      </div>
                    </div>
                    {/* Auto-run status chip */}
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: checkingNaming ? 'rgba(124,58,237,0.10)' : namingResults ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
                        color:      checkingNaming ? '#7c3aed' : namingResults ? '#059669' : '#64748b',
                        border:     `1px solid ${checkingNaming ? 'rgba(124,58,237,0.22)' : namingResults ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.14)'}`,
                      }}>
                      {checkingNaming
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />Scanning…</>
                        : namingResults
                          ? <><CheckCircle className="w-3 h-3" />Auto-completed</>
                          : <><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Queued</>}
                    </span>
                  </div>

                  {!namingResults ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #c4b5fd' }}>
                        {checkingNaming
                          ? <Loader className="w-8 h-8 text-violet-500 animate-spin" />
                          : <Type className="w-8 h-8 text-violet-400" />}
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {checkingNaming ? 'Analysing tag naming conventions…' : 'Tag Naming & Acronym Check'}
                      </p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        {checkingNaming
                          ? 'Running ISA 5.1 rule engine and AI vision — this may take a few seconds.'
                          : 'Check runs automatically once verification is complete. Validates P&ID tag names against ISA 5.1 conventions — separators, acronym registries, completeness, and format consistency.'}
                      </p>
                      {/* Soft-coded: show which checks will run */}
                      {!checkingNaming && (
                        <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                          {Object.entries(NAMING_QC_RULES).map(([rid, def]) => (
                            <span key={rid} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
                              {def.icon} {def.checkName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : namingResults.total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <CheckCircle className="w-12 h-12 text-emerald-500" />
                      <p className="font-bold text-slate-700">All tags pass naming conventions</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        {issues.length === 0 && namingResults.ai_used
                          ? 'Rule engine + AI vision found no naming or acronym violations.'
                          : 'Rule engine found no naming or acronym violations.'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* ── Stats bar ── */}
                      <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                        {[
                          { v: namingResults.total,         label:'Total',       color:'text-violet-600',  bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.18)' },
                          { v: critN,                       label:'Critical',     color:'text-red-600',     bg:'rgba(239,68,68,0.07)',  border:'rgba(239,68,68,0.18)'  },
                          { v: majN,                        label:'Major',        color:'text-orange-600',  bg:'rgba(234,88,12,0.07)',  border:'rgba(234,88,12,0.18)'  },
                          { v: minN,                        label:'Minor',        color:'text-yellow-700',  bg:'rgba(202,138,4,0.07)',  border:'rgba(202,138,4,0.18)'  },
                          { v: aiN,                         label:'AI-flagged',   color:'text-purple-600',  bg:'rgba(147,51,234,0.07)', border:'rgba(147,51,234,0.18)' },
                        ].map(c => (
                          <div key={c.label} className="rounded-xl p-2.5 text-center" style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                            <p className={`font-bold text-lg leading-none ${c.color}`}>{c.v}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* ── Rule chips ── */}
                      <div className="px-5 pt-3 pb-1 border-b border-slate-100">
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueNamingRules.map(rid => {
                            const def = NAMING_QC_RULES[rid] || {};
                            const cnt = issues.filter(i => i.rule_id === rid).length;
                            return (
                              <span key={rid}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 cursor-default"
                                title={def.desc}>
                                {def.icon || '🏷'} <code className="font-mono">{rid}</code> · {cnt}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* ── Filters ── */}
                      <div className="px-5 py-2 flex gap-2 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[180px]">
                          <input type="text" value={namingSearch} onChange={e => setNamingSearch(e.target.value)}
                            placeholder="Search tags, descriptions…"
                            className="w-full text-xs pl-7 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition" />
                          <Type className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400 pointer-events-none" />
                          {namingSearch && <button onClick={() => setNamingSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                        <select value={namingSevFilter} onChange={e => setNamingSevFilter(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer hover:border-violet-300">
                          <option value="all">All severities</option>
                          {['critical','major','minor','info'].map(s => <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                        </select>
                        <span className="text-[10px] text-slate-400 ml-auto">{filteredNaming.length} of {issues.length}</span>
                      </div>
                      {/* ── Issue cards ── */}
                      <div className="px-5 pb-4 space-y-2 overflow-y-auto" style={{ maxHeight:'58vh' }}>
                        {filteredNaming.length === 0 ? (
                          <div className="py-10 text-center text-slate-400 text-sm">No issues match filters.</div>
                        ) : filteredNaming.map((iss, idx) => {
                          const ruleDef = NAMING_QC_RULES[iss.rule_id] || {};
                          return (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col gap-1.5"
                            style={{ animation:`cardIn 0.2s ease-out ${Math.min(idx*0.025,0.4)}s both` }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NAMING_SEV_BADGE[iss.severity] || 'bg-slate-100 text-slate-600'}`}>
                                {iss.severity?.toUpperCase()}
                              </span>
                              <code className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border" style={{ background:'rgba(124,58,237,0.07)', borderColor:'rgba(124,58,237,0.2)', color:'#7c3aed' }}>
                                {iss.rule_id}
                              </code>
                              {ruleDef.checkName && <span className="text-[10px] text-slate-500 font-semibold">{ruleDef.icon} {ruleDef.checkName}</span>}
                              {iss.source && SOURCE_BADGE[iss.source] && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_BADGE[iss.source].style}`}>
                                  {SOURCE_BADGE[iss.source].label}
                                </span>
                              )}
                              {iss.tag_found && (
                                <code className="ml-auto text-[10px] font-mono font-bold bg-violet-50 text-violet-800 border border-violet-200 px-2 py-0.5 rounded">
                                  {iss.tag_found}
                                </code>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{iss.description}</p>
                            <div className="flex items-start gap-4 flex-wrap">
                              {iss.suggested_fix && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  <span className="text-slate-500">Suggested fix: </span>
                                  <code className="font-mono font-semibold text-emerald-700">{iss.suggested_fix}</code>
                                </div>
                              )}
                              {iss.location_hint && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <Eye className="w-3 h-3" />
                                  <span>{iss.location_hint}</span>
                                </div>
                              )}
                              {ruleDef.desc && (
                                <div className="flex items-start gap-1 text-[10px] text-slate-400">
                                  <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-400" />
                                  <span>{ruleDef.desc}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Footer */}
                  {namingResults && (
                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span style={{ color:'#7c3aed' }}>{filteredNaming.length} of {issues.length} findings</span>
                      <span>{Object.keys(NAMING_QC_RULES).length} naming rules active · {namingResults.ai_used ? 'AI + rules' : 'rules only'}</span>
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
            {(() => {
              // Soft-coded: all metrics shown in the comparison table.
              // Add a key here to make a new metric appear in all three columns automatically.
              const COMPARE_METRICS = [
                { key:'tags',        label:'Total Tags',   icon:'🏷', color:'#3b82f6' },
                { key:'instruments', label:'Instruments',  icon:'🔬', color:'#7c3aed' },
                { key:'valves',      label:'Valves',       icon:'🔧', color:'#0d9488' },
                { key:'equipment',   label:'Equipment',    icon:'⚙️', color:'#f59e0b' },
                { key:'line_sizes',  label:'Line Sizes',   icon:'📏', color:'#10b981' },
                { key:'notes',       label:'Notes',        icon:'📝', color:'#6366f1' },
                { key:'holds',       label:'Holds',        icon:'⏸',  color:'#ef4444' },
              ];
              const bef  = comparison?.before_defaults_only?.summary  || {};
              const aft  = comparison?.after_legend_backed?.summary   || {};
              const dlt  = comparison?.delta_after_minus_before        || {};
              const rep  = comparison?.report_findings                 || {};
              const legK = comparison?.legend_knowledge                || {};
              const befSizes = comparison?.before_defaults_only?.line_sizes_unique || [];
              const aftSizes = comparison?.after_legend_backed?.line_sizes_unique  || [];
              return (
                <div>
                  {/* Header + Run button */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)' }}>
                        <BarChart2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Legend-Backed Accuracy Comparison</h2>
                        {comparison
                          ? <p className="text-xs text-slate-500">Default prefixes vs legend-knowledge extraction · {rep.total_findings ?? 0} finding{rep.total_findings !== 1 ? 's' : ''}</p>
                          : <p className="text-xs text-slate-400">Not yet run — re-runs extraction with legend knowledge</p>}
                      </div>
                    </div>
                    <button
                      onClick={runAccuracyCompare}
                      disabled={runningCompare}
                      className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl disabled:opacity-60 transition-all hover:-translate-y-px"
                      style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)', boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}
                    >
                      {runningCompare ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
                      {runningCompare ? 'Comparing…' : comparison ? 'Re-run' : 'Run Compare'}
                    </button>
                  </div>

                  {!comparison ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#f0fdfa,#ccfbf1)', border:'1px solid #5eead4' }}>
                        <BarChart2 className="w-8 h-8 text-teal-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Legend-Backed Accuracy Comparison</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        Runs P&amp;ID extraction twice — once with default ISA prefixes and once
                        with legend-knowledge prefixes — then computes the delta to measure
                        how much the legend improves recognition accuracy.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto" style={{ maxHeight:'80vh' }}>
                      {/* ── Legend knowledge metadata ── */}
                      {legK.sources?.length > 0 && (
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Legend Knowledge Used</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {legK.sources.map((s, i) => (
                              <span key={i} className="px-2 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-medium">{s}</span>
                            ))}
                            {legK.instrument_prefixes?.length > 0 && (
                              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                {legK.instrument_prefixes.length} instr. prefixes
                              </span>
                            )}
                            {legK.valve_prefixes?.length > 0 && (
                              <span className="px-2 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                                {legK.valve_prefixes.length} valve prefixes
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Main comparison table ── */}
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Extraction Comparison — All Metrics</p>
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                          {/* Table header */}
                          <div className="grid grid-cols-4 bg-slate-700 text-white text-[10px] font-bold">
                            {['Metric','Before (Defaults)','After (Legend)','Δ Delta'].map(h => (
                              <div key={h} className="px-3 py-2.5">{h}</div>
                            ))}
                          </div>
                          {/* Rows — soft-coded from COMPARE_METRICS */}
                          {COMPARE_METRICS.map((m, idx) => {
                            const b = bef[m.key] ?? 0;
                            const a = aft[m.key] ?? 0;
                            const d = dlt[m.key] ?? (a - b);
                            const pct = b > 0 ? Math.round((d / b) * 100) : (d !== 0 ? 100 : 0);
                            return (
                              <div key={m.key}
                                className={`grid grid-cols-4 text-xs border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <div className="px-3 py-3 flex items-center gap-2 font-semibold text-slate-700">
                                  <span>{m.icon}</span> {m.label}
                                </div>
                                <div className="px-3 py-3 text-slate-600 font-mono">{b}</div>
                                <div className="px-3 py-3 font-mono" style={{ color: a > b ? '#059669' : a < b ? '#dc2626' : '#64748b' }}>
                                  {a}
                                </div>
                                <div className="px-3 py-3 flex items-center gap-1.5">
                                  <span className={`font-bold font-mono ${d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    {d > 0 ? '+' : ''}{d}
                                  </span>
                                  {d !== 0 && b > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                      d > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}>{pct > 0 ? '+' : ''}{pct}%</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Unique line sizes comparison ── */}
                      {(befSizes.length > 0 || aftSizes.length > 0) && (
                        <div className="px-5 pb-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Unique Line Sizes Detected</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-[10px] font-bold text-slate-500 mb-2">Before ({befSizes.length})</p>
                              <div className="flex flex-wrap gap-1">
                                {befSizes.map(s => <span key={s} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{s}</span>)}
                              </div>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                              <p className="text-[10px] font-bold text-emerald-600 mb-2">After ({aftSizes.length})</p>
                              <div className="flex flex-wrap gap-1">
                                {aftSizes.map(s => <span key={s} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700">{s}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Findings severity breakdown ── */}
                      {rep.total_findings > 0 && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Verification Findings Severity Breakdown</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(rep.severity_counts || {}).map(([sev, cnt]) => {
                              if (!cnt) return null;
                              const cols = { critical:'bg-red-100 text-red-800 border-red-300', major:'bg-orange-100 text-orange-800 border-orange-300', minor:'bg-yellow-100 text-yellow-800 border-yellow-300', info:'bg-emerald-100 text-emerald-800 border-emerald-300' };
                              return (
                                <div key={sev} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${cols[sev] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  <span className="text-lg leading-none">{cnt}</span>
                                  <span className="font-semibold normal-case">{sev}</span>
                                </div>
                              );
                            })}
                            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold bg-slate-100 text-slate-700 border-slate-200 ml-auto">
                              <span className="text-lg leading-none">{rep.total_findings}</span>
                              <span className="font-semibold">Total</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end COMPARISON panel ─── */}

            {/* ─── EQUIPMENT panel ─── */}
            {activePanel === 'equipment' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
            {(() => {
              // ── Soft-coded: ISA 5.1 instrument / valve / equipment families ──────────
              // Add or edit entries here to extend classification without changing any render logic.
              const EQUIP_FAMILIES = {
                // Instruments
                PT:  { label:'Pressure Transmitter',   type:'instrument', icon:'🔵', color:'#3b82f6' },
                PI:  { label:'Pressure Indicator',      type:'instrument', icon:'🔵', color:'#3b82f6' },
                PIC: { label:'Pressure IC',             type:'instrument', icon:'🔵', color:'#3b82f6' },
                PSV: { label:'Pressure Safety Valve',   type:'valve',      icon:'🔴', color:'#ef4444' },
                PSE: { label:'Pressure Safety Element', type:'instrument', icon:'🔵', color:'#3b82f6' },
                FT:  { label:'Flow Transmitter',        type:'instrument', icon:'🟢', color:'#22c55e' },
                FI:  { label:'Flow Indicator',          type:'instrument', icon:'🟢', color:'#22c55e' },
                FIC: { label:'Flow IC',                 type:'instrument', icon:'🟢', color:'#22c55e' },
                FE:  { label:'Flow Element',            type:'instrument', icon:'🟢', color:'#22c55e' },
                FCV: { label:'Flow Control Valve',      type:'valve',      icon:'🔴', color:'#ef4444' },
                LT:  { label:'Level Transmitter',       type:'instrument', icon:'🟡', color:'#eab308' },
                LI:  { label:'Level Indicator',         type:'instrument', icon:'🟡', color:'#eab308' },
                LIC: { label:'Level IC',                type:'instrument', icon:'🟡', color:'#eab308' },
                TT:  { label:'Temperature Transmitter', type:'instrument', icon:'🟠', color:'#f97316' },
                TI:  { label:'Temperature Indicator',   type:'instrument', icon:'🟠', color:'#f97316' },
                TIC: { label:'Temperature IC',          type:'instrument', icon:'🟠', color:'#f97316' },
                AT:  { label:'Analyser Transmitter',    type:'instrument', icon:'🟣', color:'#a855f7' },
                AI:  { label:'Analyser Indicator',      type:'instrument', icon:'🟣', color:'#a855f7' },
                WT:  { label:'Weight Transmitter',      type:'instrument', icon:'⚪', color:'#64748b' },
                // Valves
                FV:  { label:'Control Valve (Flow)',    type:'valve',      icon:'🔴', color:'#ef4444' },
                SDV: { label:'Shutdown Valve',          type:'valve',      icon:'🔴', color:'#ef4444' },
                BDV: { label:'Blowdown Valve',          type:'valve',      icon:'🔴', color:'#ef4444' },
                XV:  { label:'Solenoid/On-Off Valve',   type:'valve',      icon:'🔴', color:'#ef4444' },
                HV:  { label:'Hand Valve',              type:'valve',      icon:'🔴', color:'#ef4444' },
                SV:  { label:'Safety Valve',            type:'valve',      icon:'🔴', color:'#ef4444' },
                CV:  { label:'Check Valve',             type:'valve',      icon:'🔴', color:'#ef4444' },
                // Equipment
                P:   { label:'Pump',                    type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                E:   { label:'Heat Exchanger',          type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                V:   { label:'Vessel / Drum',           type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                T:   { label:'Tank',                    type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                K:   { label:'Compressor',              type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                C:   { label:'Column',                  type:'equipment',  icon:'⚙️',  color:'#0d9488' },
                F:   { label:'Filter/Strainer',         type:'equipment',  icon:'⚙️',  color:'#0d9488' },
              };

              // Soft-coded: severity rank for QC badge ordering
              const SEV_RANK  = { critical: 4, major: 3, minor: 2, info: 1 };
              const SEV_COLOR = { critical:'#dc2626', major:'#f97316', minor:'#d97706', info:'#3b82f6' };
              const SEV_BG    = { critical:'#fef2f2', major:'#fff7ed', minor:'#fffbeb', info:'#eff6ff' };

              // Soft-coded: sub-tabs
              const EQUIP_SUBTABS = [
                { id:'all',        label:'All'         },
                { id:'instrument', label:'Instruments' },
                { id:'valve',      label:'Valves'      },
                { id:'equipment',  label:'Equipment'   },
              ];

              // ── Build inventory ─────────────────────────────────────────────────────
              const tagPos    = activeDrawingData?.metadata?.tag_positions || {};
              const allTagIds = Object.keys(tagPos);
              const extSumm   = activeDrawingData?.metadata?.extraction_summary || {};

              const valveFindingsByTag = {};
              for (const f of (activeDrawingData?.issues || [])) {
                if (HIDDEN_CATEGORIES.has(f.category)) continue;
                const TAG_RE_LOCAL = /\b([A-Z]{1,4}[-_]?\d{2,6}[A-Z]?)\b/g;
                const text = (f.evidence || f.issue_observed || '').toUpperCase();
                for (const [, tid] of text.matchAll(TAG_RE_LOCAL)) {
                  if (!valveFindingsByTag[tid]) valveFindingsByTag[tid] = [];
                  valveFindingsByTag[tid].push(f);
                }
              }

              const classifyTag = (tagId) => {
                const upper = tagId.toUpperCase();
                const sortedPfx = Object.keys(EQUIP_FAMILIES).sort((a, b) => b.length - a.length);
                for (const pfx of sortedPfx) {
                  if (upper.startsWith(pfx)) return EQUIP_FAMILIES[pfx];
                }
                return { label:'Unknown', type:'instrument', icon:'❔', color:'#94a3b8' };
              };

              const tagInventory = allTagIds.map(id => ({
                id,
                cls:      classifyTag(id),
                pos:      tagPos[id],
                findings: valveFindingsByTag[id.toUpperCase()] || [],
              }));

              const instrItems = tagInventory.filter(t => t.cls.type === 'instrument');
              const valveItems = tagInventory.filter(t => t.cls.type === 'valve');
              const equpItems  = tagInventory.filter(t => t.cls.type === 'equipment');
              const issueCount = tagInventory.filter(t => t.findings.length > 0).length;

              const displayItems = {
                all:        tagInventory,
                instrument: instrItems,
                valve:      valveItems,
                equipment:  equpItems,
              }[equipSubTab] || tagInventory;

              const eqQuery = equipTagSearch.trim().toLowerCase();
              const filteredEquip = eqQuery
                ? displayItems.filter(t =>
                    t.id.toLowerCase().includes(eqQuery) ||
                    t.cls.label.toLowerCase().includes(eqQuery))
                : displayItems;

              // Detail for selected tag
              const detailTag = selectedEquipTag
                ? tagInventory.find(t => t.id === selectedEquipTag) || null
                : null;

              // Top severity helper
              const topSev = (findings) => findings.reduce((best, f) => {
                return (SEV_RANK[f.severity] || 0) > (SEV_RANK[best] || 0) ? f.severity : best;
              }, null);

              // ── Soft-coded: Equipment QC rule catalogue ─────────────────────────────
              // Each entry maps a rule_id prefix to a short description and an AI fix hint.
              // Extend this list to add coverage for new rule families without changing render logic.
              const EQUIP_QC_RULES = {
                'TAG': { short: 'Tag naming / format',   icon: '🏷️', fix: 'Verify the tag conforms to the project ISA 5.1 naming convention and update the instrument index.' },
                'VLV': { short: 'Valve designation',     icon: '🔧', fix: 'Confirm the valve tag and bore size against the instrument index and P&ID spec sheet.' },
                'CON': { short: 'Connection issue',      icon: '🔗', fix: 'Check the connecting pipe class, spec break notation, and update the line list accordingly.' },
                'NTS': { short: 'Note / annotation',     icon: '📝', fix: 'Review the note text against applicable project standards and revise the drawing note.' },
                'LSZ': { short: 'Line size',             icon: '📏', fix: 'See Lines panel — verify NPS, spec-break symbols, and update the line designation.' },
                'ANN': { short: 'Annotation quality',    icon: '🔍', fix: 'Re-check OCR extraction; re-issue drawing at higher scan resolution if text is illegible.' },
                'RED': { short: 'Redline / revision',    icon: '☁️', fix: 'Ensure revision cloud does not obscure any tag; move the cloud boundary if required.' },
              };
              const rulePrefix = (ruleId) => (ruleId || '').replace(/-?\d.*$/, '');

              // ── Soft-coded: AI insight generators for equipment ──────────────────────
              // Each entry is a pure function: (inventory, findings) → insight | null.
              // Returns null when the condition is not met.
              const EQUIP_AI_GENERATORS = [
                // High QC failure rate
                (inv, _f) => {
                  if (inv.length < 3) return null;
                  const failRate = Math.round(inv.filter(t => t.findings.length > 0).length / inv.length * 100);
                  if (failRate < 20) return null;
                  return { level: 'warning', icon: '⚠️', title: `${failRate}% of tags have QC findings`,
                    detail: `${inv.filter(t=>t.findings.length>0).length} of ${inv.length} equipment tags carry at least one quality finding. Review before issuing the document.` };
                },
                // Critical findings present
                (inv, _f) => {
                  const crit = inv.filter(t => t.findings.some(f => f.severity === 'critical'));
                  if (crit.length === 0) return null;
                  return { level: 'critical', icon: '🚨', title: `${crit.length} tag${crit.length!==1?'s':''} with critical findings`,
                    detail: `Critical issues require resolution before drawing issue: ${crit.slice(0,5).map(t=>t.id).join(', ')}${crit.length>5?' …':''}` };
                },
                // Safety valve coverage
                (inv, _f) => {
                  const SAFETY_PREFIXES = new Set(['PSV','PSE','SDV','BDV','SV']); // soft-coded
                  const safetyTags = inv.filter(t => SAFETY_PREFIXES.has(Object.keys(EQUIP_FAMILIES).find(p => t.id.toUpperCase().startsWith(p)) || ''));
                  if (safetyTags.length === 0) return null;
                  const withIssues = safetyTags.filter(t => t.findings.length > 0);
                  if (withIssues.length === 0) return { level:'success', icon:'🛡️', title:`${safetyTags.length} safety valve/element tag${safetyTags.length!==1?'s':''} — all pass QC`,
                    detail:`PSV, PSE, SDV, BDV, SV tags are verified. No QC issues on safety-critical items.` };
                  return { level:'critical', icon:'🛡️', title:`${withIssues.length} safety tag${withIssues.length!==1?'s':''} have QC issues`,
                    detail:`Safety-critical tags with issues: ${withIssues.map(t=>t.id).join(', ')}. These must be resolved before P&ID issue.` };
                },
                // Duplicate tag occurrences
                (inv, _f) => {
                  const MULTI_OCC_MIN = 2; // soft-coded minimum occurrences to flag
                  const multiOcc = inv.filter(t => (t.pos?.all || []).length >= MULTI_OCC_MIN);
                  if (multiOcc.length === 0) return null;
                  return { level:'info', icon:'🔁', title:`${multiOcc.length} tag${multiOcc.length!==1?'s':''} appear ≥${MULTI_OCC_MIN}× on drawing`,
                    detail:`Multiple occurrences may indicate a tag bubble repeated intentionally (e.g. continuation) or a copy-paste error. Review each: ${multiOcc.slice(0,5).map(t=>t.id).join(', ')}${multiOcc.length>5?' …':''}` };
                },
                // All clear
                (inv, _f) => {
                  if (inv.filter(t => t.findings.length > 0).length > 0) return null;
                  return { level:'success', icon:'✅', title:'All equipment tags pass QC',
                    detail:`${inv.length} tags extracted and verified — no quality findings raised by the rule engine.` };
                },
              ];

              // ── Soft-coded: AI insight level styles ─────────────────────────────────
              const INSIGHT_LEVEL_STYLE = {
                critical: { bg:'#fef2f2', border:'#fca5a5', titleColor:'#991b1b', bar:'#dc2626' },
                warning:  { bg:'#fffbeb', border:'#fcd34d', titleColor:'#92400e', bar:'#f59e0b' },
                info:     { bg:'#eff6ff', border:'#93c5fd', titleColor:'#1e40af', bar:'#3b82f6' },
                success:  { bg:'#f0fdf4', border:'#86efac', titleColor:'#166534', bar:'#22c55e' },
              };

              // ── Soft-coded: sort options for Register sub-tab ────────────────────────
              const EQUIP_SORT_OPTIONS = [
                { v:'issues', label:'⚡ Issues first' },
                { v:'name',   label:'A–Z Tag ID'     },
                { v:'type',   label:'Type'            },
                { v:'family', label:'Family'          },
              ];

              // ── Sorted + filtered display items ──────────────────────────────────────
              const sortedItems = [...displayItems].sort((a, b) => {
                if (equipSortBy === 'issues') {
                  const aHas = a.findings.length > 0 ? 1 : 0;
                  const bHas = b.findings.length > 0 ? 1 : 0;
                  if (aHas !== bHas) return bHas - aHas;
                  return (SEV_RANK[topSev(b.findings)] || 0) - (SEV_RANK[topSev(a.findings)] || 0);
                }
                if (equipSortBy === 'type')   return a.cls.type.localeCompare(b.cls.type);
                if (equipSortBy === 'family') return a.cls.label.localeCompare(b.cls.label);
                return a.id.localeCompare(b.id); // 'name'
              });
              const sortedFiltered = eqQuery ? sortedItems.filter(t =>
                t.id.toLowerCase().includes(eqQuery) ||
                t.cls.label.toLowerCase().includes(eqQuery)
              ) : sortedItems;

              // ── AI insights ───────────────────────────────────────────────────────────
              const allFindings = activeDrawingData?.issues || [];
              const aiInsights = EQUIP_AI_GENERATORS
                .map(gen => { try { return gen(tagInventory, allFindings); } catch { return null; } })
                .filter(Boolean);

              // ── Analytics distributions ───────────────────────────────────────────────
              const typeDist = [
                { label:'Instruments', count:instrItems.length, color:'#3b82f6' },
                { label:'Valves',      count:valveItems.length, color:'#ef4444' },
                { label:'Equipment',   count:equpItems.length,  color:'#0d9488' },
              ].filter(d => d.count > 0);
              const maxTypeCnt = Math.max(1, ...typeDist.map(d => d.count));

              // Family distribution (top 10)
              const familyDist = Object.entries(
                tagInventory.reduce((acc, t) => { acc[t.cls.label] = (acc[t.cls.label]||0)+1; return acc; }, {})
              ).map(([label, count]) => ({ label, count, color: tagInventory.find(t=>t.cls.label===label)?.cls?.color || '#94a3b8' }))
               .sort((a,b) => b.count-a.count)
               .slice(0, 10);
              const maxFamCnt = Math.max(1, ...familyDist.map(d => d.count));

              // QC findings by rule prefix
              const ruleDistMap = {};
              for (const t of tagInventory) {
                for (const f of t.findings) {
                  const pfx = rulePrefix(f.rule_id) || 'OTHER';
                  ruleDistMap[pfx] = (ruleDistMap[pfx] || 0) + 1;
                }
              }
              const ruleDist = Object.entries(ruleDistMap).sort((a,b)=>b[1]-a[1]);
              const maxRuleCnt = Math.max(1, ...ruleDist.map(([,c])=>c));

              // ── QC score ─────────────────────────────────────────────────────────────
              const cleanCount  = tagInventory.length - issueCount;
              const qcScore     = tagInventory.length > 0 ? Math.round(cleanCount / tagInventory.length * 100) : 100;
              const QC_SCORE_EXCELLENT = 90;
              const QC_SCORE_GOOD      = 70;
              const QC_SCORE_FAIR      = 50;
              const qcScoreColor = qcScore >= QC_SCORE_EXCELLENT ? '#22c55e'
                                 : qcScore >= QC_SCORE_GOOD      ? '#7c3aed'
                                 : qcScore >= QC_SCORE_FAIR      ? '#f59e0b'
                                 : '#dc2626';

              // ── Top-level view tabs (mirrors LINES panel design) ─────────────────────
              const EQUIP_VIEW_TABS = [
                { id:'insights',  label:'AI Insights',  icon: Brain,    color:'#7c3aed', cnt: aiInsights.length },
                { id:'register',  label:'Register',     icon: Cpu,      color:'#6366f1', cnt: tagInventory.length },
                { id:'drawing',   label:'Drawing View', icon: MapPin,   color:'#059669', cnt: tagInventory.filter(t=>t.pos?.x_pct!=null).length },
                { id:'analytics', label:'Analytics',    icon: BarChart2, color:'#0891b2', cnt: null },
              ];

              const critIssues = tagInventory.filter(t => t.findings.some(f=>f.severity==='critical')).length;
              const majIssues  = tagInventory.filter(t => t.findings.some(f=>f.severity==='major')).length;

              return (
                <div className="flex flex-col" style={{ minHeight: 0 }}>

                  {/* ══ Panel header ══ */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
                    style={{ background:'linear-gradient(to right, rgba(124,58,237,0.05), rgba(99,102,241,0.03), transparent)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow:'0 4px 14px rgba(124,58,237,0.35)' }}>
                      <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Equipment &amp; Instrument Register
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)' }}>AI</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        {tagInventory.length} tags · {instrItems.length} instruments · {valveItems.length} valves · {equpItems.length} equipment
                        {issueCount > 0 && <span className="text-orange-500 font-semibold"> · {issueCount} with QC issues</span>}
                      </p>
                    </div>
                    {/* QC score ring */}
                    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
                      <div className="relative w-12 h-12">
                        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                          <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="22" cy="22" r="17" fill="none" stroke={qcScoreColor} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color:qcScoreColor }}>{qcScore}%</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">QC Score</span>
                    </div>
                    {/* traffic-light */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {critIssues > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{critIssues} CRIT</span>}
                      {majIssues  > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">{majIssues} MAJ</span>}
                      {issueCount === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All Pass</span>}
                    </div>
                  </div>

                  {/* ══ Stat bar ══ */}
                  <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {[
                      { v:tagInventory.length, label:'Total Tags',   color:'#7c3aed', bg:'rgba(124,58,237,0.07)',  border:'rgba(124,58,237,0.2)'  },
                      { v:instrItems.length,   label:'Instruments',  color:'#3b82f6', bg:'rgba(59,130,246,0.07)',  border:'rgba(59,130,246,0.2)'  },
                      { v:valveItems.length,   label:'Valves',       color:'#ef4444', bg:'rgba(239,68,68,0.07)',   border:'rgba(239,68,68,0.2)'   },
                      { v:equpItems.length,    label:'Equipment',    color:'#0d9488', bg:'rgba(13,148,136,0.07)',  border:'rgba(13,148,136,0.2)'  },
                      { v:issueCount,          label:'QC Issues',    color:'#f97316', bg:'rgba(249,115,22,0.07)',  border:'rgba(249,115,22,0.2)'  },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-2.5 text-center relative overflow-hidden"
                        style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                        {tagInventory.length > 0 && (
                          <div className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-700"
                            style={{ width:`${c.v/tagInventory.length*100}%`, background:c.color, opacity:0.5 }} />
                        )}
                        <p className="font-black text-xl leading-none" style={{ color:c.color }}>{c.v}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ══ View tab switcher ══ */}
                  <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    {EQUIP_VIEW_TABS.map(tab => {
                      const TabIcon = tab.icon;
                      const active  = equipViewTab === tab.id;
                      return (
                        <button key={tab.id}
                          onClick={() => setEquipViewTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                            active ? 'bg-white shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          style={active ? { color:tab.color, borderColor:tab.color } : undefined}>
                          <TabIcon className="w-3.5 h-3.5" />
                          {tab.label}
                          {tab.cnt !== null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${active ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                              style={active ? { background:tab.color } : undefined}>
                              {tab.cnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {tagInventory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #c4b5fd' }}>
                        <Cpu className="w-8 h-8 text-violet-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No Equipment Tags Extracted</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        Equipment tag coordinates are extracted during P&amp;ID analysis.
                        Re-upload or reprocess the drawing to populate this panel.
                      </p>
                    </div>
                  ) : (
                    <>
                    {/* ════════════════════════════════════
                        AI INSIGHTS view
                    ════════════════════════════════════ */}
                    {equipViewTab === 'insights' && (
                      <div className="p-5 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight:'70vh' }}>
                        {/* Intro banner */}
                        <div className="flex items-start gap-3 p-3 rounded-xl border"
                          style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(99,102,241,0.04))', borderColor:'rgba(124,58,237,0.2)' }}>
                          <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:'#7c3aed' }} />
                          <div>
                            <p className="text-xs font-bold text-violet-800">AI Equipment Analysis</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Automated pattern recognition across {tagInventory.length} extracted tags and {allFindings.length} rule-engine findings.
                              Insights are generated by soft-coded heuristic detectors — no LLM call required.
                            </p>
                          </div>
                        </div>

                        {aiInsights.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                            <p className="text-sm font-semibold">No actionable AI insights</p>
                            <p className="text-xs">All pattern checks passed for this drawing.</p>
                          </div>
                        ) : (
                          aiInsights.map((ins, i) => {
                            const st = INSIGHT_LEVEL_STYLE[ins.level] || INSIGHT_LEVEL_STYLE.info;
                            return (
                              <div key={i} className="rounded-xl border p-4 flex gap-3"
                                style={{ background:st.bg, borderColor:st.border, animation:`cardIn 0.2s ease-out ${i*0.06}s both` }}>
                                <div className="w-1 rounded-full flex-shrink-0" style={{ background:st.bar }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base leading-none">{ins.icon}</span>
                                    <p className="text-xs font-bold leading-snug" style={{ color:st.titleColor }}>{ins.title}</p>
                                    <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full text-white uppercase"
                                      style={{ background:st.bar }}>{ins.level}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">{ins.detail}</p>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Rule family checklist */}
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rule Families Active</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(EQUIP_QC_RULES).map(([pfx, def]) => {
                              const cnt = tagInventory.reduce((s, t) => s + t.findings.filter(f => rulePrefix(f.rule_id) === pfx).length, 0);
                              return (
                                <div key={pfx} title={def.fix}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                    cnt > 0 ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                  }`}>
                                  <span>{cnt > 0 ? def.icon : '✅'}</span>
                                  <code className="font-mono">{pfx}</code>
                                  {cnt > 0 && <span className="ml-0.5 bg-orange-200 text-orange-800 px-1 rounded-full font-black">{cnt}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ════════════════════════════════════
                        REGISTER view (master / detail)
                    ════════════════════════════════════ */}
                    {equipViewTab === 'register' && (
                      <div className="flex flex-col" style={{ minHeight:0 }}>
                        {/* Toolbar: type tabs + sort + view toggle + search */}
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-white/60 flex flex-wrap items-center gap-2">
                          {/* Type filter chips */}
                          <div className="flex gap-0.5 flex-wrap">
                            {[
                              { id:'all',        label:'All',         cnt:tagInventory.length },
                              { id:'instrument', label:'Instruments', cnt:instrItems.length   },
                              { id:'valve',      label:'Valves',      cnt:valveItems.length   },
                              { id:'equipment',  label:'Equipment',   cnt:equpItems.length    },
                            ].map(tab => {
                              const active = equipSubTab === tab.id;
                              return (
                                <button key={tab.id}
                                  onClick={() => { setEquipSubTab(tab.id); setSelectedEquipTag(null); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                  style={{
                                    background: active ? '#7c3aed' : '#f8fafc',
                                    color:      active ? '#fff' : '#64748b',
                                    border:     active ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                                  }}>
                                  {tab.label}
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
                                    style={{ background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: active ? '#fff' : '#64748b' }}>
                                    {tab.cnt}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                            {/* Sort */}
                            <select value={equipSortBy} onChange={e => setEquipSortBy(e.target.value)}
                              className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer hover:border-violet-300 flex-shrink-0">
                              {EQUIP_SORT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                            </select>
                            {/* View toggle */}
                            <div className="flex rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                              {[{v:'grid',ic:'⊞'},{v:'list',ic:'≡'}].map(({v,ic}) => (
                                <button key={v} onClick={() => setEquipViewMode(v)}
                                  className={`px-2.5 py-1.5 text-xs font-bold transition-all ${equipViewMode===v ? 'bg-violet-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                                  {ic}
                                </button>
                              ))}
                            </div>
                            {/* Search */}
                            <div className="relative flex-shrink-0" style={{ width:'160px' }}>
                              <input type="text" value={equipTagSearch}
                                onChange={e => { setEquipTagSearch(e.target.value); setSelectedEquipTag(null); }}
                                placeholder="Search tags…"
                                className="w-full text-[11px] pl-7 pr-6 py-1.5 rounded-lg border border-violet-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-300/50" />
                              <Cpu className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400 pointer-events-none" />
                              {equipTagSearch && <button onClick={() => setEquipTagSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-3 h-3" /></button>}
                            </div>
                          </div>
                        </div>

                        {/* Master / Detail split */}
                        <div className="flex overflow-hidden" style={{ minHeight:0 }}>

                          {/* LEFT — tag list / grid */}
                          <div className="flex-1 overflow-y-auto border-r border-slate-100"
                            style={{ maxHeight:'62vh', minWidth:0 }}>
                            {sortedFiltered.length === 0 ? (
                              <div className="py-12 text-center text-slate-400 text-sm">No tags match search.</div>
                            ) : equipViewMode === 'grid' ? (
                              <div className="p-4 grid gap-2"
                                style={{ gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))' }}>
                                {sortedFiltered.map((t, idx) => {
                                  const maxS  = topSev(t.findings);
                                  const isSelected = selectedEquipTag === t.id;
                                  const hasIssue = !!maxS;
                                  return (
                                    <button key={t.id}
                                      onClick={() => setSelectedEquipTag(isSelected ? null : t.id)}
                                      className="relative text-left rounded-xl border p-3 flex flex-col gap-1.5 overflow-hidden transition-all"
                                      style={{
                                        animation:`cardIn 0.2s ease-out ${Math.min(idx*0.018,0.4)}s both`,
                                        border: isSelected ? `2px solid ${t.cls.color}` : hasIssue ? '1.5px solid #fed7aa' : '1.5px solid #e2e8f0',
                                        background: isSelected ? `${t.cls.color}12` : hasIssue ? '#fff7ed' : '#ffffff',
                                        boxShadow: isSelected ? `0 4px 16px ${t.cls.color}30` : '0 1px 4px rgba(0,0,0,0.04)',
                                      }}>
                                      <div className="absolute top-0 left-0 right-0 h-0.5"
                                        style={{ background: hasIssue ? (SEV_COLOR[maxS]||'#f97316') : t.cls.color }} />
                                      <div className="flex items-center justify-between gap-1 pt-0.5">
                                        <code className="text-[11px] font-mono font-black text-slate-800 truncate">{t.id}</code>
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                          style={{ background: hasIssue ? SEV_COLOR[maxS] : '#10b981',
                                            boxShadow:`0 0 5px ${hasIssue ? SEV_COLOR[maxS] : '#10b981'}88` }} />
                                      </div>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit"
                                        style={{ background:`${t.cls.color}18`, color:t.cls.color, border:`1px solid ${t.cls.color}30` }}>
                                        {t.cls.icon} {t.cls.label}
                                      </span>
                                      {t.pos?.x_pct != null && (
                                        <span className="text-[9px] text-slate-400 font-mono">📍 {t.pos.x_pct.toFixed(1)}%, {t.pos.y_pct?.toFixed(1)}%</span>
                                      )}
                                      {hasIssue && (
                                        <span className="text-[9px] font-bold" style={{ color:SEV_COLOR[maxS] }}>
                                          ⚠ {t.findings.length} issue{t.findings.length!==1?'s':''}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              /* List view */
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 sticky top-0">
                                    <th className="px-4 py-2.5 text-left">Tag ID</th>
                                    <th className="px-4 py-2.5 text-left">Type</th>
                                    <th className="px-4 py-2.5 text-left">Family</th>
                                    <th className="px-4 py-2.5 text-center">Position</th>
                                    <th className="px-4 py-2.5 text-center">QC</th>
                                    <th className="px-4 py-2.5 text-center">Occ.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedFiltered.map((t, i) => {
                                    const maxS = topSev(t.findings);
                                    const isSelected = selectedEquipTag === t.id;
                                    return (
                                      <tr key={t.id}
                                        onClick={() => setSelectedEquipTag(isSelected ? null : t.id)}
                                        className="border-t border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors"
                                        style={{ background: isSelected ? `${t.cls.color}10` : i%2===0 ? '#ffffff' : '#fafafa' }}>
                                        <td className="px-4 py-2.5">
                                          <code className="text-[11px] font-mono font-black text-slate-800">{t.id}</code>
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <span className="text-[9px] font-bold capitalize px-1.5 py-0.5 rounded"
                                            style={{ background:`${t.cls.color}15`, color:t.cls.color }}>{t.cls.type}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[10px] text-slate-600">{t.cls.icon} {t.cls.label}</td>
                                        <td className="px-4 py-2.5 text-center font-mono text-[9px] text-slate-400">
                                          {t.pos?.x_pct != null ? `${t.pos.x_pct.toFixed(1)}, ${t.pos.y_pct?.toFixed(1)}` : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          {maxS ? (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize"
                                              style={{ background:SEV_BG[maxS], color:SEV_COLOR[maxS], border:`1px solid ${SEV_COLOR[maxS]}40` }}>{maxS}</span>
                                          ) : (
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">OK</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-[10px] text-slate-500 font-mono">
                                          {(t.pos?.all||[]).length || (t.pos?.x_pct!=null?1:0)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>

                          {/* RIGHT — detail drawer (unchanged core logic) */}
                          <div style={{ width:detailTag?'300px':'0px', flexShrink:0, overflow:'hidden', transition:'width 0.25s ease' }}>
                            {detailTag && (
                              <div className="flex flex-col h-full overflow-y-auto bg-white border-l border-slate-100"
                                style={{ minWidth:'300px', maxHeight:'62vh' }}>
                                {/* Drawer header */}
                                <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2"
                                  style={{ background:`linear-gradient(135deg,${detailTag.cls.color}14,${detailTag.cls.color}06)` }}>
                                  <div>
                                    <code className="text-base font-mono font-black text-slate-900">{detailTag.id}</code>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{detailTag.cls.icon} {detailTag.cls.label}</p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block"
                                      style={{ background:`${detailTag.cls.color}20`, color:detailTag.cls.color, border:`1px solid ${detailTag.cls.color}30` }}>
                                      {detailTag.cls.type.toUpperCase()}
                                    </span>
                                  </div>
                                  <button onClick={() => setSelectedEquipTag(null)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Position section */}
                                <div className="px-4 py-3 border-b border-slate-100">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Position on Drawing</p>
                                  {detailTag.pos?.x_pct != null ? (
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500">X coordinate</span>
                                        <code className="text-[11px] font-mono font-bold text-slate-800">{detailTag.pos.x_pct.toFixed(2)}%</code>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500">Y coordinate</span>
                                        <code className="text-[11px] font-mono font-bold text-slate-800">{detailTag.pos.y_pct?.toFixed(2)}%</code>
                                      </div>
                                      {(detailTag.pos?.all||[]).length > 1 && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-slate-500">Occurrences</span>
                                          <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
                                            ×{detailTag.pos.all.length}
                                          </span>
                                        </div>
                                      )}
                                      {/* Mini position map */}
                                      <div className="mt-1 rounded-lg border border-slate-200 overflow-hidden"
                                        style={{ height:'72px', background:'#f1f5f9', position:'relative' }}>
                                        <div className="absolute inset-0" style={{
                                          backgroundImage:'radial-gradient(circle,rgba(99,102,241,0.08) 1px,transparent 1px)',
                                          backgroundSize:'12px 12px',
                                        }} />
                                        <div style={{
                                          position:'absolute',
                                          left:`${detailTag.pos.x_pct}%`, top:`${detailTag.pos.y_pct}%`,
                                          transform:'translate(-50%,-50%)',
                                          width:'10px', height:'10px', borderRadius:'50%',
                                          background: detailTag.cls.color,
                                          boxShadow:`0 0 0 3px ${detailTag.cls.color}40`, zIndex:2,
                                        }} />
                                        {(detailTag.pos?.all||[]).slice(1).map((occ,oi) => (
                                          <div key={oi} style={{
                                            position:'absolute',
                                            left:`${occ.x_pct??detailTag.pos.x_pct}%`, top:`${occ.y_pct??detailTag.pos.y_pct}%`,
                                            transform:'translate(-50%,-50%)',
                                            width:'7px', height:'7px', borderRadius:'50%',
                                            background:`${detailTag.cls.color}80`, zIndex:1,
                                          }} />
                                        ))}
                                        <p className="absolute bottom-1 right-1.5 text-[8px] text-slate-400 font-mono">drawing canvas</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 italic">No position data for this tag.</p>
                                  )}
                                </div>

                                {/* QC Findings section with AI Recommendation */}
                                <div className="px-4 py-3 flex-1">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    QC Findings
                                    <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                      style={{ background: detailTag.findings.length>0?'#fef2f2':'#f0fdf4',
                                               color:      detailTag.findings.length>0?'#dc2626':'#16a34a' }}>
                                      {detailTag.findings.length>0 ? `${detailTag.findings.length} issue${detailTag.findings.length!==1?'s':''}` : 'QC Pass ✓'}
                                    </span>
                                  </p>
                                  {detailTag.findings.length === 0 ? (
                                    <div className="rounded-xl p-3 flex items-center gap-2"
                                      style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                                      <span className="text-emerald-500 text-base">✓</span>
                                      <p className="text-[10px] text-emerald-700 font-semibold">No QC issues. Tag appears compliant.</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      {detailTag.findings.map((f, fi) => {
                                        const pfx     = rulePrefix(f.rule_id);
                                        const ruleDef = EQUIP_QC_RULES[pfx] || {};
                                        return (
                                          <div key={fi} className="rounded-xl p-3 flex flex-col gap-1.5"
                                            style={{ background:SEV_BG[f.severity]||'#fff', border:`1px solid ${SEV_COLOR[f.severity]||'#e2e8f0'}40` }}>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <code className="text-[9px] font-mono font-black text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">{f.rule_id}</code>
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize"
                                                style={{ background:`${SEV_COLOR[f.severity]}22`, color:SEV_COLOR[f.severity] }}>{f.severity}</span>
                                              {ruleDef.icon && <span className="text-[10px]">{ruleDef.icon} <span className="text-slate-500 text-[9px]">{ruleDef.short}</span></span>}
                                              <span className="text-[9px] text-slate-400 capitalize">{f.category?.replace(/_/g,' ')}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-700 leading-snug">{f.issue_observed}</p>
                                            {f.evidence && (
                                              <p className="text-[9px] text-slate-500 italic truncate">Evidence: {f.evidence}</p>
                                            )}
                                            {/* AI Recommendation block */}
                                            {ruleDef.fix && (
                                              <div className="flex items-start gap-1.5 p-1.5 rounded-lg border text-[9px]"
                                                style={{ background:'rgba(124,58,237,0.04)', borderColor:'rgba(124,58,237,0.15)' }}>
                                                <Brain className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'#7c3aed' }} />
                                                <div><span className="font-bold text-violet-700">AI: </span><span className="text-slate-600">{ruleDef.fix}</span></div>
                                              </div>
                                            )}
                                            <button
                                              onClick={() => { setActivePanel('drawing'); setTimeout(() => jumpToFinding(f.id), 150); }}
                                              className="self-start flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg transition-all hover:-translate-y-px"
                                              style={{ background:SEV_COLOR[f.severity]||'#6366f1', color:'#fff', boxShadow:`0 2px 6px ${SEV_COLOR[f.severity]||'#6366f1'}44` }}>
                                              <ScanLine className="w-3 h-3" /> Locate on Drawing
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {!detailTag && sortedFiltered.length > 0 && (
                              <div className="flex flex-col items-center justify-center h-full py-10 gap-2 px-4 text-center"
                                style={{ minWidth:'300px', maxHeight:'62vh', background:'#fafbff', borderLeft:'1px solid #e2e8f0' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                  style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #ddd6fe' }}>
                                  <Cpu className="w-6 h-6 text-violet-400" />
                                </div>
                                <p className="text-xs font-bold text-slate-600">Select a tag to view details</p>
                                <p className="text-[10px] text-slate-400">Position, classification, QC findings, and AI fix recommendations</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Register footer */}
                        <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 text-[9px] text-slate-400 flex items-center justify-between">
                          <span style={{ color:'#7c3aed' }}>{sortedFiltered.length} of {displayItems.length} tags shown</span>
                          <span>Sorted by {EQUIP_SORT_OPTIONS.find(o=>o.v===equipSortBy)?.label} · ISA 5.1</span>
                        </div>
                      </div>
                    )}

                    {/* ════════════════════════════════════
                        ANALYTICS view
                    ════════════════════════════════════ */}
                    {equipViewTab === 'analytics' && (
                      <div className="p-5 space-y-6 overflow-y-auto" style={{ maxHeight:'70vh' }}>

                        {/* QC Score banner */}
                        <div className="rounded-xl border p-4 flex items-center gap-5"
                          style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.05),rgba(99,102,241,0.04))', borderColor:'rgba(124,58,237,0.2)' }}>
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                              <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                              <circle cx="22" cy="22" r="17" fill="none" stroke={qcScoreColor} strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-xl font-black leading-none" style={{ color:qcScoreColor }}>{qcScore}%</span>
                              <span className="text-[9px] text-slate-400 font-medium">QC</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 mb-1">Equipment &amp; Instrument QC Score</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {cleanCount} of {tagInventory.length} tags pass all checks.
                              {critIssues > 0 && ` ${critIssues} critical item${critIssues!==1?'s':''} require immediate attention.`}
                              {majIssues  > 0 && ` ${majIssues} major item${majIssues!==1?'s':''} need review.`}
                            </p>
                            <div className="flex gap-3 mt-2">
                              {[['Clean',cleanCount,'#22c55e'],['Critical',critIssues,'#dc2626'],['Major',majIssues,'#ea580c'],['Issues',issueCount,'#f97316']].map(([l,v,c])=>(
                                <div key={l} className="text-center">
                                  <p className="text-sm font-black leading-none" style={{color:c}}>{v}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{l}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Tag type distribution */}
                        {typeDist.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                              <span className="text-base">⚙️</span> Tag Type Distribution
                              <span className="ml-auto text-[10px] font-normal text-slate-400">{tagInventory.length} tags total</span>
                            </p>
                            <div className="space-y-2">
                              {typeDist.map(({label, count, color}) => (
                                <div key={label} className="flex items-center gap-3">
                                  <span className="text-[11px] font-bold w-20 flex-shrink-0" style={{ color }}>{label}</span>
                                  <div className="flex-1 rounded-full h-4 overflow-hidden" style={{ background:`${color}15` }}>
                                    <div className="h-full rounded-full flex items-center pl-2 transition-all duration-700"
                                      style={{ width:`${count/maxTypeCnt*100}%`, background:`linear-gradient(90deg,${color},${color}cc)`, minWidth:'1.5rem' }}>
                                      <span className="text-[9px] font-black text-white leading-none">{count}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 w-10 flex-shrink-0">{Math.round(count/tagInventory.length*100)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Family distribution */}
                        {familyDist.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                              <span className="text-base">🏷️</span> Tag Family Breakdown
                              <span className="ml-auto text-[10px] font-normal text-slate-400">Top {familyDist.length} families</span>
                            </p>
                            <div className="grid gap-2" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))' }}>
                              {familyDist.map(({label, count, color}) => (
                                <div key={label} className="rounded-xl border p-3 flex flex-col gap-1"
                                  style={{ background:`${color}08`, borderColor:`${color}25` }}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black" style={{ color }}>{label}</span>
                                    <span className="text-[10px] font-bold" style={{ color }}>{count}</span>
                                  </div>
                                  <div className="w-full rounded-full h-1.5" style={{ background:`${color}20` }}>
                                    <div className="h-1.5 rounded-full" style={{ width:`${count/maxFamCnt*100}%`, background:`linear-gradient(90deg,${color},${color}aa)` }} />
                                  </div>
                                  <span className="text-[9px]" style={{ color }}>{Math.round(count/tagInventory.length*100)}% of tags</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* QC findings by rule family */}
                        {ruleDist.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                              <span className="text-base">🔍</span> QC Findings by Rule Family
                            </p>
                            <div className="space-y-2">
                              {ruleDist.map(([pfx, cnt]) => {
                                const def = EQUIP_QC_RULES[pfx] || { icon:'❔', short: pfx };
                                return (
                                  <button key={pfx}
                                    onClick={() => setEquipViewTab('register')}
                                    className="w-full flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-all group text-left">
                                    <span className="text-base leading-none flex-shrink-0">{def.icon}</span>
                                    <code className="text-[10px] font-mono font-bold text-violet-700 w-10 flex-shrink-0">{pfx}</code>
                                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                      <div className="h-full rounded-full"
                                        style={{ width:`${cnt/maxRuleCnt*100}%`, background:'linear-gradient(90deg,#7c3aed,#6366f1)' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-violet-700 w-5 text-right flex-shrink-0">{cnt}</span>
                                    <span className="text-[10px] text-slate-400 flex-1 truncate group-hover:text-violet-600">{def.short}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* ════════════════════════════════════
                        DRAWING VIEW — live coordinate map
                    ════════════════════════════════════ */}
                    {equipViewTab === 'drawing' && (() => {
                      // Soft-coded: marker size and color per state
                      const MARKER_SIZE_NORMAL   = 13; // px
                      const MARKER_SIZE_SELECTED = 19; // px
                      const MARKER_COLOR_CLEAN   = '#22c55e';
                      const MARKER_COLOR_GLOW_CLEAN = 'rgba(34,197,94,0.45)';

                      const tagsWithCoords = sortedFiltered.filter(t => t.pos?.x_pct != null && t.pos?.y_pct != null);
                      const tagsNoCoords   = sortedFiltered.length - tagsWithCoords.length;

                      return (
                        <div className="flex overflow-hidden" style={{ minHeight:0 }}>

                          {/* ── LEFT: drawing canvas ── */}
                          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                            {/* Type filter toolbar */}
                            <div className="px-4 py-2.5 border-b border-slate-100 bg-white/70 flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Filter:</span>
                              {[
                                { id:'all',        label:'All',         cnt:tagInventory.length },
                                { id:'instrument', label:'Instruments', cnt:instrItems.length   },
                                { id:'valve',      label:'Valves',      cnt:valveItems.length   },
                                { id:'equipment',  label:'Equipment',   cnt:equpItems.length    },
                              ].map(tab => {
                                const active = equipSubTab === tab.id;
                                return (
                                  <button key={tab.id}
                                    onClick={() => { setEquipSubTab(tab.id); setSelectedEquipTag(null); }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                    style={{
                                      background: active ? '#059669' : '#f8fafc',
                                      color:      active ? '#fff'    : '#64748b',
                                      border:     active ? '1px solid #059669' : '1px solid #e2e8f0',
                                    }}>
                                    {tab.label}
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
                                      style={{ background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: active ? '#fff' : '#64748b' }}>
                                      {tab.cnt}
                                    </span>
                                  </button>
                                );
                              })}
                              <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400 flex-shrink-0">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:MARKER_COLOR_CLEAN, boxShadow:`0 0 4px ${MARKER_COLOR_GLOW_CLEAN}` }} />
                                  QC Pass
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                                  Issues
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                                  Critical
                                </span>
                                {tagsNoCoords > 0 && (
                                  <span className="text-amber-500 font-semibold">{tagsNoCoords} hidden (no coords)</span>
                                )}
                              </div>
                            </div>

                            {/* Drawing + markers */}
                            <div className="overflow-auto bg-slate-100" style={{ maxHeight:'70vh' }}>
                              {drawingImageLoading && (
                                <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-xs">
                                  <Loader className="w-4 h-4 animate-spin" />Loading drawing image…
                                </div>
                              )}
                              {!drawingImageLoading && !drawingImageUrl && (
                                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                                  <p className="text-sm font-bold text-slate-600">Drawing preview not loaded</p>
                                  <p className="text-xs text-center max-w-xs text-slate-400">
                                    Open the Drawing panel first to load the image, then return here.
                                  </p>
                                  <button onClick={() => setActivePanel('drawing')}
                                    className="mt-1 px-4 py-1.5 text-xs font-bold text-white rounded-xl transition-all hover:-translate-y-px"
                                    style={{ background:'linear-gradient(135deg,#059669,#0d9488)', boxShadow:'0 3px 10px rgba(5,150,105,0.35)' }}>
                                    Open Drawing Panel
                                  </button>
                                </div>
                              )}
                              {!drawingImageLoading && drawingImageUrl && (
                                <div className="relative w-full" style={{ lineHeight:0 }}>
                                  <img
                                    src={drawingImageUrl}
                                    alt={activeDrawing}
                                    draggable={false}
                                    className="w-full block"
                                    style={{ height:'auto', background:'#f8fafc', userSelect:'none' }}
                                  />

                                  {/* Tag coordinate markers overlay */}
                                  <div className="absolute inset-0" style={{ pointerEvents:'none' }}>
                                    {tagsWithCoords.map(t => {
                                      const isSelected = selectedEquipTag === t.id;
                                      const maxS       = topSev(t.findings);
                                      const hasIssue   = !!maxS;

                                      // Soft-coded: tag dot colour
                                      const dotColor = hasIssue ? (SEV_COLOR[maxS] || '#f97316') : MARKER_COLOR_CLEAN;
                                      const dotGlow  = hasIssue ? `${SEV_COLOR[maxS]}55` : MARKER_COLOR_GLOW_CLEAN;

                                      const left = Math.min(97, Math.max(1, t.pos.x_pct));
                                      const top  = Math.min(94, Math.max(1, t.pos.y_pct));
                                      const size = isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE_NORMAL;

                                      return (
                                        <React.Fragment key={t.id}>
                                          {/* Pulse ring when selected */}
                                          {isSelected && (
                                            <div aria-hidden="true" style={{
                                              position:'absolute',
                                              left:`${left}%`, top:`${top}%`,
                                              width:'28px', height:'28px',
                                              borderRadius:'50%',
                                              transform:'translate(-50%,-50%)',
                                              border:`2.5px solid ${dotColor}`,
                                              animation:'markerPing 1.1s ease-out infinite',
                                              pointerEvents:'none',
                                              zIndex:9,
                                            }} />
                                          )}

                                          {/* The dot itself */}
                                          <button
                                            title={`${t.id} · ${t.cls.label}${hasIssue ? ` · ${t.findings.length} issue${t.findings.length!==1?'s':''}` : ' · QC pass'}`}
                                            onClick={() => setSelectedEquipTag(isSelected ? null : t.id)}
                                            style={{
                                              position:'absolute',
                                              left:`${left}%`, top:`${top}%`,
                                              transform:'translate(-50%,-50%)',
                                              width:`${size}px`, height:`${size}px`,
                                              borderRadius:'50%',
                                              background: dotColor,
                                              border:`2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.65)'}`,
                                              boxShadow: isSelected
                                                ? `0 0 0 3px ${dotGlow}, 0 3px 10px rgba(0,0,0,0.45)`
                                                : `0 1px 4px rgba(0,0,0,0.32)`,
                                              zIndex: isSelected ? 20 : 10,
                                              pointerEvents:'all',
                                              cursor:'pointer',
                                              transition:'all 0.15s ease',
                                            }}
                                          />

                                          {/* Floating label shown only when selected */}
                                          {isSelected && (
                                            <div style={{
                                              position:'absolute',
                                              left:`${left}%`,
                                              top:`calc(${top}% + ${MARKER_SIZE_SELECTED/2 + 4}px)`,
                                              transform:'translateX(-50%)',
                                              background:'rgba(0,0,0,0.82)',
                                              color:'#fff',
                                              fontSize:'10px',
                                              fontWeight:'bold',
                                              fontFamily:'monospace',
                                              padding:'2px 7px',
                                              borderRadius:'5px',
                                              whiteSpace:'nowrap',
                                              zIndex:21,
                                              pointerEvents:'none',
                                              boxShadow:'0 2px 6px rgba(0,0,0,0.35)',
                                            }}>
                                              {t.id}
                                            </div>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>

                                  {/* Drawing legend */}
                                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2"
                                    style={{ pointerEvents:'none' }}>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-600 flex-wrap">
                                      <span className="font-bold text-slate-700">Tag Markers</span>
                                      <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full inline-block" style={{ background:MARKER_COLOR_CLEAN, boxShadow:`0 0 5px ${MARKER_COLOR_GLOW_CLEAN}` }} />
                                        Clean
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                                        Major/Minor
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                                        Critical
                                      </span>
                                      <span className="text-slate-400">·</span>
                                      <span>{tagsWithCoords.length} of {sortedFiltered.length} tags mapped</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── RIGHT: tag detail sidebar ── */}
                          <div style={{ width:detailTag ? '290px' : '0px', flexShrink:0, overflow:'hidden', transition:'width 0.25s ease' }}>
                            {detailTag && (
                              <div className="flex flex-col h-full overflow-y-auto bg-white border-l border-slate-100"
                                style={{ minWidth:'290px', maxHeight:'70vh' }}>

                                {/* Sidebar header */}
                                <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2"
                                  style={{ background:`linear-gradient(135deg,${detailTag.cls.color}14,${detailTag.cls.color}06)` }}>
                                  <div>
                                    <code className="text-base font-mono font-black text-slate-900">{detailTag.id}</code>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{detailTag.cls.icon} {detailTag.cls.label}</p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block"
                                      style={{ background:`${detailTag.cls.color}20`, color:detailTag.cls.color, border:`1px solid ${detailTag.cls.color}30` }}>
                                      {detailTag.cls.type.toUpperCase()}
                                    </span>
                                  </div>
                                  <button onClick={() => setSelectedEquipTag(null)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Coordinates card */}
                                {detailTag.pos?.x_pct != null && (
                                  <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Coordinates on Drawing</p>
                                    <div className="flex gap-2 mb-2">
                                      <div className="flex-1 rounded-xl p-2.5 text-center"
                                        style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                                        <p className="text-[9px] text-emerald-600 font-bold">X</p>
                                        <code className="text-sm font-black text-emerald-700">{detailTag.pos.x_pct.toFixed(2)}%</code>
                                      </div>
                                      <div className="flex-1 rounded-xl p-2.5 text-center"
                                        style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                                        <p className="text-[9px] text-emerald-600 font-bold">Y</p>
                                        <code className="text-sm font-black text-emerald-700">{detailTag.pos.y_pct?.toFixed(2)}%</code>
                                      </div>
                                    </div>
                                    {/* Mini dot map */}
                                    <div className="rounded-lg border border-slate-200 overflow-hidden"
                                      style={{ height:'64px', background:'#f1f5f9', position:'relative' }}>
                                      <div className="absolute inset-0" style={{
                                        backgroundImage:'radial-gradient(circle,rgba(5,150,105,0.1) 1px,transparent 1px)',
                                        backgroundSize:'10px 10px',
                                      }} />
                                      <div style={{
                                        position:'absolute',
                                        left:`${detailTag.pos.x_pct}%`, top:`${detailTag.pos.y_pct}%`,
                                        transform:'translate(-50%,-50%)',
                                        width:'11px', height:'11px', borderRadius:'50%',
                                        background:MARKER_COLOR_CLEAN,
                                        boxShadow:`0 0 0 3px ${MARKER_COLOR_GLOW_CLEAN}`,
                                        zIndex:2,
                                      }} />
                                      <p className="absolute bottom-1 right-1.5 text-[8px] text-slate-400 font-mono">canvas</p>
                                    </div>
                                    {(detailTag.pos?.all||[]).length > 1 && (
                                      <p className="text-[10px] text-violet-600 font-bold mt-1.5">× {detailTag.pos.all.length} occurrences on drawing</p>
                                    )}
                                  </div>
                                )}

                                {/* QC findings */}
                                <div className="px-4 py-3 flex-1">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    QC Findings
                                    <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                      style={{ background: detailTag.findings.length>0?'#fef2f2':'#f0fdf4',
                                               color:      detailTag.findings.length>0?'#dc2626':'#16a34a' }}>
                                      {detailTag.findings.length>0 ? `${detailTag.findings.length} issue${detailTag.findings.length!==1?'s':''}` : 'QC Pass ✓'}
                                    </span>
                                  </p>
                                  {detailTag.findings.length === 0 ? (
                                    <div className="rounded-xl p-3 flex items-center gap-2"
                                      style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                                      <span className="text-emerald-500 text-base">✓</span>
                                      <p className="text-[10px] text-emerald-700 font-semibold">No QC issues. Tag appears compliant.</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      {detailTag.findings.map((f, fi) => {
                                        const pfx     = rulePrefix(f.rule_id);
                                        const ruleDef = EQUIP_QC_RULES[pfx] || {};
                                        return (
                                          <div key={fi} className="rounded-xl p-3 flex flex-col gap-1.5"
                                            style={{ background:SEV_BG[f.severity]||'#fff', border:`1px solid ${SEV_COLOR[f.severity]||'#e2e8f0'}40` }}>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <code className="text-[9px] font-mono font-black text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">{f.rule_id}</code>
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize"
                                                style={{ background:`${SEV_COLOR[f.severity]}22`, color:SEV_COLOR[f.severity] }}>{f.severity}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-700 leading-snug">{f.issue_observed}</p>
                                            {ruleDef.fix && (
                                              <div className="flex items-start gap-1.5 p-1.5 rounded-lg border text-[9px]"
                                                style={{ background:'rgba(124,58,237,0.04)', borderColor:'rgba(124,58,237,0.15)' }}>
                                                <Brain className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color:'#7c3aed' }} />
                                                <div><span className="font-bold text-violet-700">AI: </span><span className="text-slate-600">{ruleDef.fix}</span></div>
                                              </div>
                                            )}
                                            <button
                                              onClick={() => { setActivePanel('drawing'); setTimeout(() => jumpToFinding(f.id), 150); }}
                                              className="self-start flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg transition-all hover:-translate-y-px"
                                              style={{ background:SEV_COLOR[f.severity]||'#6366f1', color:'#fff', boxShadow:`0 2px 6px ${SEV_COLOR[f.severity]||'#6366f1'}44` }}>
                                              <ScanLine className="w-3 h-3" /> Locate Finding
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {!detailTag && (
                              <div className="flex flex-col items-center justify-center h-full py-12 gap-2 px-4 text-center"
                                style={{ minWidth:'290px', maxHeight:'70vh', background:'#fafbff', borderLeft:'1px solid #e2e8f0' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                  style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #bbf7d0' }}>
                                  <MapPin className="w-6 h-6 text-emerald-400" />
                                </div>
                                <p className="text-xs font-bold text-slate-600">Click a marker on the drawing</p>
                                <p className="text-[10px] text-slate-400">Tag details, coordinates, and QC findings will appear here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    </>
                  )}

                  {/* ══ Footer ══ */}
                  <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[9px] text-slate-400">
                    <span style={{ color:'#7c3aed' }}>
                      {equipViewTab === 'register'  ? `${sortedFiltered.length} of ${displayItems.length} tags shown`
                       : equipViewTab === 'insights' ? `${aiInsights.length} AI insight${aiInsights.length!==1?'s':''}`
                       : equipViewTab === 'drawing'  ? `${tagInventory.filter(t=>t.pos?.x_pct!=null).length} tags mapped on drawing`
                       : `QC score: ${qcScore}%`}
                    </span>
                    <span>{Object.keys(EQUIP_FAMILIES).length} families · ISA 5.1 · AI analysis active</span>
                  </div>

                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end EQUIPMENT panel ─── */}

            {/* ─── INSTRUMENTATION panel ─── */}
            {activePanel === 'instrumentation' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
            {(() => {
              // ══ Soft-coded: ISA 5.1 / IEC 62424 Instrumentation QC Checklist ══════════
              // Add, remove, or reorder items here without touching any render logic.
              // Each entry:
              //   id         — unique string key
              //   category   — logical grouping (used for section headers + analytics)
              //   title      — one-line requirement label
              //   detail     — verbose requirement text shown in expanded card
              //   standard   — applicable standard reference
              //   detectKeys — OCR/rule evidence keywords used for AI auto-detection
              //                presence in issues → 'warn' | absence → 'ok' (soft)
              //   severity   — 'critical'|'major'|'minor'|'info'
              const INSTR_CHECKS = [
                // ── Identification ──────────────────────────────────────────────────────
                {
                  id: 'IC-01',
                  category: 'Identification',
                  title: 'Instrumentation identification symbols, tag numbers and location designation',
                  detail: 'All instruments must carry ISA 5.1 identification symbols, correct tag numbers, and a clear location designation (field, DCS, local panel, unit control panel, ESD, etc.).',
                  standard: 'ISA 5.1 / IEC 62424',
                  severity: 'critical',
                  detectKeys: ['tag','symbol','location','dcs','field','panel','esd','identification'],
                },
                {
                  id: 'IC-02',
                  category: 'Identification',
                  title: 'PRV/PCV set-point marked near tag number',
                  detail: 'For all PRVs and PCVs (self-regulating), the set-point value must be annotated directly adjacent to the tag number on the P&ID.',
                  standard: 'ISA 5.1',
                  severity: 'major',
                  detectKeys: ['prv','pcv','set point','setpoint','self-regulating','set-point'],
                },
                {
                  id: 'IC-03',
                  category: 'Identification',
                  title: 'Upstream / downstream tapping of PRV/PCV correctly depicted',
                  detail: 'Upstream and downstream tapping points for PRVs/PCVs (self-regulating) shall be shown exactly as required by the project specification.',
                  standard: 'ISA 5.1',
                  severity: 'major',
                  detectKeys: ['upstream','downstream','tapping','prv','pcv'],
                },
                // ── Sensors & Transmitters ───────────────────────────────────────────────
                {
                  id: 'IC-04',
                  category: 'Sensors & Transmitters',
                  title: 'Temperature, pressure and flow sensors/transmitters identified; signal direction checked',
                  detail: 'All temperature sensors & transmitters (TE/TT), pressure sensors & transmitters (PE/PT), and flow meters & transmitters (FE/FT) must be individually identified. Signal flow direction arrows shall be shown and verified.',
                  standard: 'ISA 5.1 § 4.3',
                  severity: 'critical',
                  detectKeys: ['temperature','pressure','flow','transmitter','sensor','te','tt','pe','pt','fe','ft','signal','direction'],
                },
                {
                  id: 'IC-05',
                  category: 'Sensors & Transmitters',
                  title: 'Instrument isolation valve location identified',
                  detail: 'Instrument isolation valve locations must be explicit on the P&ID. Note: if not shown, they must be covered in typical hook-up drawings in the legend P&ID.',
                  standard: 'ISA 5.1 / Project Spec',
                  severity: 'major',
                  detectKeys: ['isolation valve','isv','hook-up','hook up','legend'],
                },
                // ── Control Systems ──────────────────────────────────────────────────────
                {
                  id: 'IC-06',
                  category: 'Control Systems',
                  title: 'DCS alarms shown; pre-alarm / monitoring signals indicated',
                  detail: 'DCS alarm set-points (high/low/high-high/low-low) shall be shown on the P&ID where process control is required. Pre-alarm and monitoring signals must also be indicated.',
                  standard: 'IEC 62424 / ISA-18.2',
                  severity: 'critical',
                  detectKeys: ['dcs','alarm','hh','ll','hi','lo','prealarm','pre-alarm','monitoring','control'],
                },
                {
                  id: 'IC-07',
                  category: 'Control Systems',
                  title: 'Logic functions shown',
                  detail: 'All logic functions (AND, OR, etc.) relevant to the control loop must be depicted on the P&ID.',
                  standard: 'ISA 5.1',
                  severity: 'minor',
                  detectKeys: ['logic','function','and gate','or gate'],
                },
                {
                  id: 'IC-08',
                  category: 'Control Systems',
                  title: 'Auxiliary control functions — resets, overrides, ESD, interlocks',
                  detail: 'Auxiliary control system functions including resets, overrides, emergency shutdown (ESD), and interlocks must be clearly indicated on the P&ID.',
                  standard: 'IEC 61511 / ISA-S84',
                  severity: 'critical',
                  detectKeys: ['reset','override','esd','interlock','emergency','shutdown','aux'],
                },
                // ── Physical / Installation ──────────────────────────────────────────────
                {
                  id: 'IC-09',
                  category: 'Physical / Installation',
                  title: 'Upstream/downstream straight run length for control valves and flow meters',
                  detail: 'The required upstream and downstream pipe straight run lengths for control valves and flow measuring devices must be dimensioned on the P&ID.',
                  standard: 'ISA 75.01 / Vendor Req.',
                  severity: 'major',
                  detectKeys: ['straight run','upstream length','downstream length','control valve','flow meter','diameters','pipe length'],
                },
                {
                  id: 'IC-10',
                  category: 'Physical / Installation',
                  title: 'Straight run requirements for flow elements indicated',
                  detail: 'Flow elements (orifice plates, venturis, Coriolis, ultrasonic) shall show the minimum straight-pipe upstream and downstream requirements in pipe diameters or millimetres.',
                  standard: 'ISO 5167 / Vendor Req.',
                  severity: 'major',
                  detectKeys: ['flow element','orifice','venturi','coriolis','ultrasonic','straight run','upstream','downstream'],
                },
                // ── Legend & Continuity ──────────────────────────────────────────────────
                {
                  id: 'IC-11',
                  category: 'Legend & Continuity',
                  title: 'MOVs, ESD valves and special instrument types covered in legend P&ID',
                  detail: 'All special instrument types including Motor Operated Valves (MOVs), ESD valves, and proprietary items must be defined with standard symbols in the legend P&ID.',
                  standard: 'ISA 5.1 § 3',
                  severity: 'major',
                  detectKeys: ['mov','esd valve','legend','special','motor operated'],
                },
                {
                  id: 'IC-12',
                  category: 'Legend & Continuity',
                  title: 'Instrument signal continuity from one P&ID to another verified',
                  detail: 'Instrument signal lines that continue to another P&ID sheet must be shown with correct continuation flags and matching tag references on both sheets.',
                  standard: 'ISA 5.1 § 5.5',
                  severity: 'critical',
                  detectKeys: ['continuity','continuation','sheet','reference','signal','cross-reference','inter-pid'],
                },
                {
                  id: 'IC-13',
                  category: 'Legend & Continuity',
                  title: 'All alarm set-points indicated on P&ID',
                  detail: 'Every instrument alarm (PAHH, PAH, PAL, PALL, etc.) must have its engineering-unit set-point value annotated on the P&ID.',
                  standard: 'ISA-18.2 / Project Spec',
                  severity: 'critical',
                  detectKeys: ['alarm','set-point','setpoint','pahh','pah','pal','pall','tahh','lahh','fahh'],
                },
              ];

              // ── Soft-coded: categories for section grouping ──────────────────────────
              const INSTR_CATEGORIES = [
                'Identification',
                'Sensors & Transmitters',
                'Control Systems',
                'Physical / Installation',
                'Legend & Continuity',
              ];

              // ── Soft-coded: severity colours (reuse same scheme as EQUIPMENT) ─────────
              const IS_SEV_COLOR = { critical:'#dc2626', major:'#f97316', minor:'#d97706', info:'#3b82f6' };
              const IS_SEV_BG    = { critical:'#fef2f2', major:'#fff7ed', minor:'#fffbeb', info:'#eff6ff' };
              const IS_STATUS_STYLE = {
                pass:  { bg:'#f0fdf4', border:'#86efac', dot:'#22c55e', label:'Pass',    icon:'✓' },
                fail:  { bg:'#fef2f2', border:'#fca5a5', dot:'#dc2626', label:'Fail',    icon:'✗' },
                warn:  { bg:'#fffbeb', border:'#fcd34d', dot:'#f59e0b', label:'Review',  icon:'⚠' },
                ok:    { bg:'#f0fdf4', border:'#bbf7d0', dot:'#22c55e', label:'AI: OK',  icon:'✓' },
                na:    { bg:'#f8fafc', border:'#cbd5e1', dot:'#94a3b8', label:'N/A',     icon:'—' },
                open:  { bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8', label:'Pending', icon:'?' },
              };

              // ── AI auto-detection: cross-reference rule-engine findings against detectKeys ──
              // For each check, scan all current drawing issues for keyword evidence.
              // Returns 'warn' if matching issues found, 'ok' if no issues and tags exist, 'open' if insufficient data.
              const allIssues = activeDrawingData?.issues || [];
              const tagCount  = Object.keys(activeDrawingData?.metadata?.tag_positions || {}).length;
              const hasData   = tagCount > 0 || allIssues.length > 0;

              const autoDetect = (check) => {
                if (!hasData) return 'open';
                const keys = check.detectKeys || [];
                const matched = allIssues.filter(f => {
                  const haystack = `${(f.issue_observed || '')} ${(f.evidence || '')} ${(f.category || '')} ${(f.rule_id || '')}`.toLowerCase();
                  return keys.some(k => haystack.includes(k));
                });
                return matched.length > 0 ? 'warn' : 'ok';
              };

              // ── Effective status (manual override wins over auto) ─────────────────────
              const effectiveStatus = (check) => {
                const manual = instrCheckStates[check.id];
                if (manual) return manual;
                return autoDetect(check);
              };

              // ── Summary stats ─────────────────────────────────────────────────────────
              const statCounts = INSTR_CHECKS.reduce((acc, c) => {
                const s = effectiveStatus(c);
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {});
              const total     = INSTR_CHECKS.length;
              const passCnt   = (statCounts.pass || 0) + (statCounts.ok || 0);
              const failCnt   = (statCounts.fail || 0);
              const warnCnt   = (statCounts.warn || 0);
              const pendCnt   = (statCounts.open || 0) + (statCounts.na || 0);
              const qcScore   = total > 0 ? Math.round(passCnt / total * 100) : 0;

              // Soft-coded thresholds
              const SCORE_EXCELLENT = 90;
              const SCORE_GOOD      = 70;
              const SCORE_FAIR      = 50;
              const scoreColor = qcScore >= SCORE_EXCELLENT ? '#22c55e'
                               : qcScore >= SCORE_GOOD      ? '#d97706'
                               : qcScore >= SCORE_FAIR      ? '#f59e0b'
                               : '#dc2626';

              return (
                <div className="flex flex-col" style={{ minHeight:0 }}>

                  {/* ══ Header ══ */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
                    style={{ background:'linear-gradient(to right, rgba(217,119,6,0.06), rgba(245,158,11,0.03), transparent)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,#d97706,#f59e0b)', boxShadow:'0 4px 14px rgba(217,119,6,0.35)' }}>
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Instrumentation QC Checklist
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ background:'linear-gradient(135deg,#d97706,#f59e0b)' }}>AI</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        {total} checks · ISA 5.1 / IEC 62424 / ISA-18.2
                        {failCnt > 0 && <span className="text-red-500 font-semibold"> · {failCnt} failed</span>}
                        {warnCnt > 0 && <span className="text-amber-500 font-semibold"> · {warnCnt} need review</span>}
                      </p>
                    </div>
                    {/* QC score ring */}
                    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
                      <div className="relative w-12 h-12">
                        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                          <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="22" cy="22" r="17" fill="none" stroke={scoreColor} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color:scoreColor }}>{qcScore}%</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">Score</span>
                    </div>
                    {/* Traffic light */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {failCnt > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{failCnt} FAIL</span>}
                      {warnCnt > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">{warnCnt} WARN</span>}
                      {failCnt === 0 && warnCnt === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All Clear</span>}
                    </div>
                  </div>

                  {/* ══ Stat bar ══ */}
                  <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {[
                      { v:total,   label:'Total',   color:'#d97706', bg:'rgba(217,119,6,0.07)',   border:'rgba(217,119,6,0.2)'    },
                      { v:passCnt, label:'Pass/OK',  color:'#22c55e', bg:'rgba(34,197,94,0.07)',   border:'rgba(34,197,94,0.2)'    },
                      { v:warnCnt, label:'Review',   color:'#f59e0b', bg:'rgba(245,158,11,0.07)',  border:'rgba(245,158,11,0.2)'   },
                      { v:failCnt, label:'Failed',   color:'#dc2626', bg:'rgba(220,38,38,0.07)',   border:'rgba(220,38,38,0.2)'    },
                      { v:pendCnt, label:'Pending',  color:'#94a3b8', bg:'rgba(148,163,184,0.07)', border:'rgba(148,163,184,0.2)'  },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-2.5 text-center relative overflow-hidden"
                        style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                        {total > 0 && (
                          <div className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-700"
                            style={{ width:`${c.v/total*100}%`, background:c.color, opacity:0.5 }} />
                        )}
                        <p className="font-black text-xl leading-none" style={{ color:c.color }}>{c.v}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ══ View switcher ══ */}
                  <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    {[
                      { id:'checklist', label:'Checklist', icon:ClipboardList, cnt:total },
                      { id:'summary',   label:'Summary',   icon:BarChart2,     cnt:null  },
                    ].map(tab => {
                      const TabIcon = tab.icon;
                      const active  = instrActiveView === tab.id;
                      return (
                        <button key={tab.id}
                          onClick={() => setInstrActiveView(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                            active ? 'bg-white shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          style={active ? { color:'#d97706', borderColor:'#d97706' } : undefined}>
                          <TabIcon className="w-3.5 h-3.5" />
                          {tab.label}
                          {tab.cnt !== null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${active ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                              style={active ? { background:'#d97706' } : undefined}>
                              {tab.cnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ════════════════════════════════════
                      CHECKLIST VIEW
                  ════════════════════════════════════ */}
                  {instrActiveView === 'checklist' && (
                    <div className="overflow-y-auto" style={{ maxHeight:'70vh' }}>
                      {/* AI confidence banner */}
                      {!hasData && (
                        <div className="mx-5 mt-4 flex items-start gap-3 p-3 rounded-xl border"
                          style={{ background:'rgba(245,158,11,0.06)', borderColor:'rgba(245,158,11,0.25)' }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                          <p className="text-[11px] text-slate-600">
                            <span className="font-bold text-amber-700">No drawing data loaded.</span> Process and analyse a P&ID drawing first; AI auto-detection will then highlight potential gaps. You can still manually override each check.
                          </p>
                        </div>
                      )}

                      {/* Grouped checklist sections */}
                      {INSTR_CATEGORIES.map(cat => {
                        const checks = INSTR_CHECKS.filter(c => c.category === cat);
                        return (
                          <div key={cat} className="mt-4 mx-5 mb-2">
                            {/* Category header */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-px flex-1" style={{ background:'linear-gradient(to right,#d9770640,transparent)' }} />
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ color:'#d97706', background:'rgba(217,119,6,0.1)', border:'1px solid rgba(217,119,6,0.2)' }}>
                                {cat}
                              </span>
                              <div className="h-px flex-1" style={{ background:'linear-gradient(to left,#d9770640,transparent)' }} />
                            </div>

                            {/* Check cards */}
                            <div className="flex flex-col gap-2">
                              {checks.map((check, ci) => {
                                const status = effectiveStatus(check);
                                const st     = IS_STATUS_STYLE[status] || IS_STATUS_STYLE.open;
                                const isManual = !!instrCheckStates[check.id];
                                // evidence items linked to this check (AI-detected)
                                const evidence = allIssues.filter(f => {
                                  const hay = `${f.issue_observed||''} ${f.evidence||''} ${f.category||''} ${f.rule_id||''}`.toLowerCase();
                                  return (check.detectKeys||[]).some(k => hay.includes(k));
                                });

                                return (
                                  <div key={check.id}
                                    className="rounded-xl border flex flex-col overflow-hidden"
                                    style={{ background:st.bg, borderColor:st.border, animation:`cardIn 0.2s ease-out ${ci*0.04}s both` }}>
                                    {/* Card top row */}
                                    <div className="flex items-start gap-3 p-3">
                                      {/* Status dot */}
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-black text-white"
                                        style={{ background:st.dot, boxShadow:`0 0 6px ${st.dot}55` }}>
                                        {st.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          <code className="text-[9px] font-mono font-black text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{check.id}</code>
                                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize"
                                            style={{ background:`${IS_SEV_COLOR[check.severity]}18`, color:IS_SEV_COLOR[check.severity] }}>
                                            {check.severity}
                                          </span>
                                          <span className="text-[9px] text-slate-400">{check.standard}</span>
                                          {isManual && <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">Manual Override</span>}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{check.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{check.detail}</p>

                                        {/* Evidence findings (AI-detected) */}
                                        {evidence.length > 0 && (
                                          <div className="mt-2 flex flex-col gap-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Evidence ({evidence.length})</p>
                                            {evidence.slice(0, 3).map((f, fi) => (
                                              <div key={fi} className="flex items-start gap-1.5 text-[9px] text-slate-600 bg-white/70 rounded-lg px-2 py-1 border border-slate-100">
                                                <span className="font-black mt-0.5" style={{ color:IS_SEV_COLOR[f.severity]||'#64748b' }}>⚑</span>
                                                <span className="truncate">{f.issue_observed}</span>
                                                <button
                                                  onClick={() => { setActivePanel('drawing'); setTimeout(() => jumpToFinding(f.id), 150); }}
                                                  className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                                  style={{ background:'#d97706', color:'#fff' }}>
                                                  Locate
                                                </button>
                                              </div>
                                            ))}
                                            {evidence.length > 3 && (
                                              <p className="text-[9px] text-slate-400 px-1">+{evidence.length - 3} more findings</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Manual override row */}
                                    <div className="flex items-center gap-1.5 px-3 pb-3">
                                      <span className="text-[9px] font-bold text-slate-400 mr-1">Override:</span>
                                      {[
                                        { v:'pass', label:'✓ Pass', color:'#22c55e' },
                                        { v:'fail', label:'✗ Fail', color:'#dc2626' },
                                        { v:'na',   label:'— N/A',  color:'#94a3b8' },
                                      ].map(opt => {
                                        const isActive = instrCheckStates[check.id] === opt.v;
                                        return (
                                          <button key={opt.v}
                                            onClick={() => setInstrCheckStates(prev => ({
                                              ...prev,
                                              [check.id]: isActive ? undefined : opt.v,
                                            }))}
                                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all"
                                            style={{
                                              background: isActive ? opt.color : 'white',
                                              color:      isActive ? '#fff'    : opt.color,
                                              borderColor: isActive ? opt.color : `${opt.color}60`,
                                            }}>
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {instrCheckStates[check.id] && (
                                        <button
                                          onClick={() => setInstrCheckStates(prev => { const n = {...prev}; delete n[check.id]; return n; })}
                                          className="text-[9px] text-slate-400 hover:text-slate-600 ml-auto">
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      <div className="h-6" />
                    </div>
                  )}

                  {/* ════════════════════════════════════
                      SUMMARY VIEW
                  ════════════════════════════════════ */}
                  {instrActiveView === 'summary' && (
                    <div className="p-5 space-y-6 overflow-y-auto" style={{ maxHeight:'70vh' }}>

                      {/* Score ring */}
                      <div className="rounded-xl border p-4 flex items-center gap-5"
                        style={{ background:'linear-gradient(135deg,rgba(217,119,6,0.05),rgba(245,158,11,0.04))', borderColor:'rgba(217,119,6,0.2)' }}>
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                            <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                            <circle cx="22" cy="22" r="17" fill="none" stroke={scoreColor} strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black leading-none" style={{ color:scoreColor }}>{qcScore}%</span>
                            <span className="text-[9px] text-slate-400 font-medium">QC</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 mb-1">Instrumentation QC Score</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {passCnt} of {total} checks passed or auto-cleared.
                            {failCnt > 0 && ` ${failCnt} check${failCnt!==1?'s':''} marked as failed — resolve before IFR/IFC issue.`}
                            {warnCnt > 0 && ` ${warnCnt} check${warnCnt!==1?'s':''} require engineer review.`}
                          </p>
                          <div className="flex gap-4 mt-2">
                            {[['Pass/OK',passCnt,'#22c55e'],['Review',warnCnt,'#f59e0b'],['Failed',failCnt,'#dc2626'],['Pending',pendCnt,'#94a3b8']].map(([l,v,c])=>(
                              <div key={l} className="text-center">
                                <p className="text-base font-black leading-none" style={{color:c}}>{v}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                          <span className="text-base">📋</span> Checks by Category
                        </p>
                        <div className="flex flex-col gap-2">
                          {INSTR_CATEGORIES.map(cat => {
                            const catChecks = INSTR_CHECKS.filter(c => c.category === cat);
                            const catPass   = catChecks.filter(c => ['pass','ok'].includes(effectiveStatus(c))).length;
                            const catFail   = catChecks.filter(c => effectiveStatus(c) === 'fail').length;
                            const catWarn   = catChecks.filter(c => effectiveStatus(c) === 'warn').length;
                            const catPct    = Math.round(catPass / catChecks.length * 100);
                            return (
                              <div key={cat} className="rounded-xl border p-3"
                                style={{ background: catFail>0 ? '#fef2f220' : catWarn>0 ? '#fffbeb40' : '#f0fdf430',
                                         borderColor: catFail>0 ? '#fca5a580' : catWarn>0 ? '#fcd34d80' : '#86efac80' }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-slate-700">{cat}</span>
                                  <div className="flex items-center gap-2">
                                    {catFail > 0 && <span className="text-[9px] font-black text-red-600">{catFail}✗</span>}
                                    {catWarn > 0 && <span className="text-[9px] font-black text-amber-600">{catWarn}⚠</span>}
                                    <span className="text-[9px] font-bold" style={{ color:catFail>0?'#dc2626':catWarn>0?'#f59e0b':'#22c55e' }}>{catPct}%</span>
                                  </div>
                                </div>
                                <div className="w-full rounded-full h-2" style={{ background:'rgba(0,0,0,0.08)' }}>
                                  <div className="h-2 rounded-full transition-all duration-700"
                                    style={{ width:`${catPct}%`, background: catFail>0 ? '#dc2626' : catWarn>0 ? '#f59e0b' : '#22c55e' }} />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1">{catPass} of {catChecks.length} checks OK</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Severity breakdown */}
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                          <span className="text-base">🔍</span> Failed / Review by Severity
                        </p>
                        {['critical','major','minor','info'].map(sev => {
                          const sevChecks = INSTR_CHECKS.filter(c => c.severity === sev);
                          const sevIssues = sevChecks.filter(c => ['fail','warn'].includes(effectiveStatus(c))).length;
                          if (sevIssues === 0 && sevChecks.length === 0) return null;
                          return (
                            <div key={sev} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                              <span className="text-[10px] font-black w-14 capitalize" style={{ color:IS_SEV_COLOR[sev] }}>{sev}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${sevIssues/Math.max(1,sevChecks.length)*100}%`, background:`linear-gradient(90deg,${IS_SEV_COLOR[sev]},${IS_SEV_COLOR[sev]}99)` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-16 text-right">{sevIssues} / {sevChecks.length}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reset all overrides */}
                      {Object.keys(instrCheckStates).length > 0 && (
                        <button
                          onClick={() => setInstrCheckStates({})}
                          className="w-full py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                          Reset all {Object.keys(instrCheckStates).length} manual override{Object.keys(instrCheckStates).length!==1?'s':''}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ══ Footer ══ */}
                  <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[9px] text-slate-400">
                    <span style={{ color:'#d97706' }}>
                      {instrActiveView === 'checklist'
                        ? `${total} checks · ${Object.keys(instrCheckStates).length} manual override${Object.keys(instrCheckStates).length!==1?'s':''}`
                        : `QC score: ${qcScore}%`}
                    </span>
                    <span>ISA 5.1 · IEC 62424 · ISA-18.2 · AI auto-detection active</span>
                  </div>

                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end INSTRUMENTATION panel ─── */}

            {/* ─── PIPING panel ─── */}
            {activePanel === 'piping' && (
            <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'panelSlide 0.25s ease-out both' }}>
            {(() => {
              // ══ Soft-coded: Piping QC Checklist ═══════════════════════════════════════
              // Add, remove, or reorder items here — no render logic changes needed.
              // Each entry:
              //   id          — unique string key
              //   category    — logical grouping (sections + analytics)
              //   title       — short requirement label
              //   detail      — full requirement text
              //   standard    — applicable standard / project reference
              //   detectKeys  — keywords scanned against AI rule-engine findings
              //   severity    — 'critical'|'major'|'minor'|'info'
              const PIPE_CHECKS = [
                // ── Line Identification ──────────────────────────────────────────────────
                {
                  id: 'PC-01',
                  category: 'Line Identification',
                  title: 'Line numbers, size, class and fluid code per legend P&ID',
                  detail: 'Each line on the P&ID must carry its line number, line size, piping class, and fluid code as defined in the legend P&ID. Missing or inconsistent line tags are non-conformance.',
                  standard: 'ISA 5.1 / Project Piping Spec',
                  severity: 'critical',
                  detectKeys: ['line number','line size','line class','fluid code','legend','pipe tag','tag number'],
                },
                // ── Specialty Items ──────────────────────────────────────────────────────
                {
                  id: 'PC-02',
                  category: 'Specialty Items',
                  title: 'Specialty piping (SP) items identified and numbered',
                  detail: 'Specialty piping items (e.g. strainers, injection quills, flame arrestors, etc.) must be uniquely tagged and numbered on the P&ID. Untagged specialty items are non-conformance.',
                  standard: 'Project Piping Spec',
                  severity: 'major',
                  detectKeys: ['strainer','injection quill','flame arrestor','specialty piping','sp ','special piping'],
                },
                {
                  id: 'PC-07',
                  category: 'Specialty Items',
                  title: 'Restriction orifices and miscellaneous piping special items tagged',
                  detail: 'All restriction orifices (RO) and other miscellaneous piping special items must be identified with their tag numbers on the P&ID.',
                  standard: 'Project Piping Spec / ISA 5.1',
                  severity: 'major',
                  detectKeys: ['restriction orifice','ro','orifice','miscellaneous','special item'],
                },
                {
                  id: 'PC-08',
                  category: 'Specialty Items',
                  title: 'Reducers (eccentric and concentric) identified',
                  detail: 'All pipe reducers must be shown and labelled as eccentric or concentric as required for draining, venting, or flow considerations.',
                  standard: 'Project Piping Spec',
                  severity: 'minor',
                  detectKeys: ['reducer','eccentric','concentric'],
                },
                // ── Line Routing ─────────────────────────────────────────────────────────
                {
                  id: 'PC-03',
                  category: 'Line Routing',
                  title: 'Underground (UG) / Aboveground (AG) lines and breaks represented',
                  detail: 'Underground and aboveground lines, including their transition break points, must be shown clearly on the P&ID with appropriate designation symbols.',
                  standard: 'Project Drafting Standard',
                  severity: 'major',
                  detectKeys: ['underground','aboveground','ug','ag','buried','break','transition'],
                },
                {
                  id: 'PC-05',
                  category: 'Line Routing',
                  title: 'Special routing — symmetrical piping, gravity flow, no pockets, slopes',
                  detail: 'Special routing requirements such as symmetrical piping, gravity flow, no-pocket constraints, and slop/drain slopes must be annotated on the P&ID.',
                  standard: 'Project P&ID Standard',
                  severity: 'minor',
                  detectKeys: ['symmetrical','gravity','pocket','slope','slop','drain','routing'],
                },
                {
                  id: 'PC-11',
                  category: 'Line Routing',
                  title: 'Slope within equipment to be indicated',
                  detail: "Equipment internal slopes (e.g. boot, sump, vessel bottom slope) must be indicated on the P&ID where required by process.",
                  standard: 'Project P&ID Standard',
                  severity: 'minor',
                  detectKeys: ['slope','gradient','vessel slope','equipment slope'],
                },
                // ── Pipe Specifications ───────────────────────────────────────────────────
                {
                  id: 'PC-06',
                  category: 'Pipe Specifications',
                  title: 'Pipe spec breaks shown with upstream/downstream protection or reason known',
                  detail: 'Pipe spec breaks must be shown as required. Relevant protections (e.g. PSVs, ESDVs) must be available upstream or downstream of each spec break, or the reason for the spec break must be clearly documented.',
                  standard: 'ASME B31.3 / Project Piping Spec',
                  severity: 'critical',
                  detectKeys: ['spec break','specification break','psv','esdv','protection','upstream','downstream'],
                },
                {
                  id: 'PC-09',
                  category: 'Pipe Specifications',
                  title: 'Insulation requirements and type clearly marked and consistent across P&IDs',
                  detail: 'Insulation type (heat conservation, cold insulation, personnel protection, etc.) and requirements must be unambiguously shown on all relevant lines and consistent across all P&ID sheets.',
                  standard: 'Project Insulation Spec',
                  severity: 'major',
                  detectKeys: ['insulation','heat conservation','cold insulation','personnel protection','consistent','insulation type'],
                },
                {
                  id: 'PC-12',
                  category: 'Pipe Specifications',
                  title: 'Steam/electrical tracing shown for process and freeze-protection requirements',
                  detail: 'Steam tracing and electrical tracing requirements for process temperature maintenance and freeze protection must be shown on all applicable lines on the P&ID.',
                  standard: 'Project Tracing Spec',
                  severity: 'major',
                  detectKeys: ['tracing','steam tracing','electrical tracing','heat tracing','freeze','heat maintenance'],
                },
                // ── Scope & Routing ───────────────────────────────────────────────────────
                {
                  id: 'PC-04',
                  category: 'Scope & Routing',
                  title: 'Future piping connections — valve or end flange for future modification',
                  detail: 'Where future piping connections are required, either a valve or an end flange (with blind) must be provided and clearly identified to facilitate future modification.',
                  standard: 'Project P&ID Standard',
                  severity: 'major',
                  detectKeys: ['future','future connection','end flange','future modification','blind flange'],
                },
                {
                  id: 'PC-10',
                  category: 'Scope & Routing',
                  title: 'Scope split (existing/new/future) or vendor/EPC boundary clearly indicated',
                  detail: "Scope boundaries — whether existing/new/future or vendor/EPC contractor boundaries — must be clearly indicated on the P&ID where applicable, using the project's standard scope-split notation.",
                  standard: 'Project P&ID Standard',
                  severity: 'major',
                  detectKeys: ['scope','existing','new scope','future scope','vendor','epc','contractor','battery limit','scope split','boundary'],
                },
                // ── Valve & Isolation ─────────────────────────────────────────────────────
                {
                  id: 'PC-13',
                  category: 'Valve & Isolation',
                  title: 'Double block and bleed requirements per DGS',
                  detail: 'Double block-and-bleed (DBB) valve arrangement requirements must be verified against the Design Guide Specification (DGS), and correct DBB configurations shown on the P&ID.',
                  standard: 'DGS (Design Guide Specification)',
                  severity: 'critical',
                  detectKeys: ['double block','bleed','dgs','dbb','block and bleed','double isolation'],
                },
                {
                  id: 'PC-14',
                  category: 'Valve & Isolation',
                  title: 'Vent/overflow lines at least one nominal size larger than incoming line',
                  detail: 'Vent and overflow lines must be specified at a minimum of one nominal pipe size (NPS) larger than the incoming line to ensure adequate flow capacity.',
                  standard: 'Project Piping Spec / Process Requirements',
                  severity: 'major',
                  detectKeys: ['vent','overflow','over flow','one size','line size','larger','higher','nominal'],
                },
              ];

              // ── Soft-coded: category display config ──────────────────────────────────
              const PIPE_CATEGORIES = [
                'Line Identification',
                'Specialty Items',
                'Line Routing',
                'Pipe Specifications',
                'Scope & Routing',
                'Valve & Isolation',
              ];
              const PIPE_CAT_STYLE = {
                'Line Identification': { color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc', icon:'🏷️' },
                'Specialty Items':     { color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', icon:'🔧' },
                'Line Routing':        { color:'#0d9488', bg:'#f0fdfa', border:'#99f6e4', icon:'↗️' },
                'Pipe Specifications': { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:'📋' },
                'Scope & Routing':     { color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:'🗺️' },
                'Valve & Isolation':   { color:'#f97316', bg:'#fff7ed', border:'#fed7aa', icon:'🔒' },
              };

              // ── Soft-coded: severity colours ─────────────────────────────────────────
              const PS_SEV_COLOR = { critical:'#dc2626', major:'#f97316', minor:'#d97706', info:'#3b82f6' };
              const PS_STATUS_STYLE = {
                pass: { bg:'#f0fdf4', border:'#86efac', dot:'#22c55e', label:'Pass',   icon:'✓' },
                fail: { bg:'#fef2f2', border:'#fca5a5', dot:'#dc2626', label:'Fail',   icon:'✗' },
                warn: { bg:'#fffbeb', border:'#fcd34d', dot:'#f59e0b', label:'Review', icon:'⚠' },
                ok:   { bg:'#f0fdf4', border:'#bbf7d0', dot:'#22c55e', label:'AI: OK', icon:'✓' },
                na:   { bg:'#f8fafc', border:'#cbd5e1', dot:'#94a3b8', label:'N/A',    icon:'—' },
                open: { bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8', label:'Pending',icon:'?' },
              };

              // ── AI evidence scan ─────────────────────────────────────────────────────
              const allIssues = activeDrawingData?.issues || [];
              const tagCount  = Object.keys(activeDrawingData?.metadata?.tag_positions || {}).length;
              const hasData   = tagCount > 0 || allIssues.length > 0;

              const autoDetect = (check) => {
                if (!hasData) return 'open';
                const keys = check.detectKeys || [];
                const matched = allIssues.filter(f => {
                  const hay = `${f.issue_observed||''} ${f.evidence||''} ${f.category||''} ${f.rule_id||''}`.toLowerCase();
                  return keys.some(k => hay.includes(k));
                });
                return matched.length > 0 ? 'warn' : 'ok';
              };

              // ── Effective status — manual override takes precedence ───────────────────
              const effectiveStatus = (check) => {
                const manual = pipCheckStates[check.id];
                if (manual) return manual;
                return autoDetect(check);
              };

              // ── Summary stats ─────────────────────────────────────────────────────────
              const statCounts = PIPE_CHECKS.reduce((acc, c) => {
                const s = effectiveStatus(c);
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {});
              const total   = PIPE_CHECKS.length;
              const passCnt = (statCounts.pass || 0) + (statCounts.ok || 0);
              const failCnt = statCounts.fail || 0;
              const warnCnt = statCounts.warn || 0;
              const pendCnt = (statCounts.open || 0) + (statCounts.na || 0);

              // Soft-coded score thresholds
              const SCORE_EXCELLENT = 90;
              const SCORE_GOOD      = 70;
              const SCORE_FAIR      = 50;
              const qcScore  = total > 0 ? Math.round(passCnt / total * 100) : 0;
              const scoreColor = qcScore >= SCORE_EXCELLENT ? '#22c55e'
                               : qcScore >= SCORE_GOOD      ? '#0891b2'
                               : qcScore >= SCORE_FAIR      ? '#f59e0b'
                               : '#dc2626';

              return (
                <div className="flex flex-col" style={{ minHeight:0 }}>

                  {/* ══ Header ══ */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
                    style={{ background:'linear-gradient(to right, rgba(8,145,178,0.06), rgba(6,182,212,0.03), transparent)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,#0891b2,#06b6d4)', boxShadow:'0 4px 14px rgba(8,145,178,0.35)' }}>
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Piping QC Checklist
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ background:'linear-gradient(135deg,#0891b2,#06b6d4)' }}>AI</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        {total} checks · ASME B31.3 / ISA 5.1 / DGS
                        {failCnt > 0 && <span className="text-red-500 font-semibold"> · {failCnt} failed</span>}
                        {warnCnt > 0 && <span className="text-amber-500 font-semibold"> · {warnCnt} need review</span>}
                      </p>
                    </div>
                    {/* QC score ring */}
                    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
                      <div className="relative w-12 h-12">
                        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                          <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="22" cy="22" r="17" fill="none" stroke={scoreColor} strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color:scoreColor }}>{qcScore}%</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">Score</span>
                    </div>
                    {/* Traffic light */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {failCnt > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{failCnt} FAIL</span>}
                      {warnCnt > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">{warnCnt} WARN</span>}
                      {failCnt === 0 && warnCnt === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All Clear</span>}
                    </div>
                  </div>

                  {/* ══ Stat bar ══ */}
                  <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {[
                      { v:total,   label:'Total',   color:'#0891b2', bg:'rgba(8,145,178,0.07)',   border:'rgba(8,145,178,0.2)'    },
                      { v:passCnt, label:'Pass/OK',  color:'#22c55e', bg:'rgba(34,197,94,0.07)',   border:'rgba(34,197,94,0.2)'    },
                      { v:warnCnt, label:'Review',   color:'#f59e0b', bg:'rgba(245,158,11,0.07)',  border:'rgba(245,158,11,0.2)'   },
                      { v:failCnt, label:'Failed',   color:'#dc2626', bg:'rgba(220,38,38,0.07)',   border:'rgba(220,38,38,0.2)'    },
                      { v:pendCnt, label:'Pending',  color:'#94a3b8', bg:'rgba(148,163,184,0.07)', border:'rgba(148,163,184,0.2)'  },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-2.5 text-center relative overflow-hidden"
                        style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                        {total > 0 && (
                          <div className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-700"
                            style={{ width:`${c.v/total*100}%`, background:c.color, opacity:0.5 }} />
                        )}
                        <p className="font-black text-xl leading-none" style={{ color:c.color }}>{c.v}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ══ View switcher ══ */}
                  <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    {[
                      { id:'checklist', label:'Checklist', icon:ClipboardList, cnt:total },
                      { id:'summary',   label:'Summary',   icon:BarChart2,     cnt:null  },
                    ].map(tab => {
                      const TabIcon = tab.icon;
                      const active  = pipActiveView === tab.id;
                      return (
                        <button key={tab.id}
                          onClick={() => setPipActiveView(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${
                            active ? 'bg-white shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          style={active ? { color:'#0891b2', borderColor:'#0891b2' } : undefined}>
                          <TabIcon className="w-3.5 h-3.5" />
                          {tab.label}
                          {tab.cnt !== null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${active ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                              style={active ? { background:'#0891b2' } : undefined}>
                              {tab.cnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ════════════════════════════════════
                      CHECKLIST VIEW
                  ════════════════════════════════════ */}
                  {pipActiveView === 'checklist' && (
                    <div className="overflow-y-auto" style={{ maxHeight:'70vh' }}>
                      {!hasData && (
                        <div className="mx-5 mt-4 flex items-start gap-3 p-3 rounded-xl border"
                          style={{ background:'rgba(8,145,178,0.06)', borderColor:'rgba(8,145,178,0.25)' }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-500" />
                          <p className="text-[11px] text-slate-600">
                            <span className="font-bold text-cyan-700">No drawing data loaded.</span> Analyse a P&ID drawing first — AI auto-detection will then highlight piping gaps. You can still manually override each check.
                          </p>
                        </div>
                      )}

                      {PIPE_CATEGORIES.map(cat => {
                        const checks = PIPE_CHECKS.filter(c => c.category === cat);
                        const catDef = PIPE_CAT_STYLE[cat] || PIPE_CAT_STYLE['Line Identification'];
                        return (
                          <div key={cat} className="mt-4 mx-5 mb-2">
                            {/* Category header */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-px flex-1" style={{ background:`linear-gradient(to right,${catDef.color}40,transparent)` }} />
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ color:catDef.color, background:catDef.bg, border:`1px solid ${catDef.border}` }}>
                                {catDef.icon} {cat}
                              </span>
                              <div className="h-px flex-1" style={{ background:`linear-gradient(to left,${catDef.color}40,transparent)` }} />
                            </div>

                            {/* Check cards */}
                            <div className="flex flex-col gap-2">
                              {checks.map((check, ci) => {
                                const status   = effectiveStatus(check);
                                const st       = PS_STATUS_STYLE[status] || PS_STATUS_STYLE.open;
                                const isManual = !!pipCheckStates[check.id];
                                const evidence = allIssues.filter(f => {
                                  const hay = `${f.issue_observed||''} ${f.evidence||''} ${f.category||''} ${f.rule_id||''}`.toLowerCase();
                                  return (check.detectKeys||[]).some(k => hay.includes(k));
                                });

                                return (
                                  <div key={check.id}
                                    className="rounded-xl border flex flex-col overflow-hidden"
                                    style={{ background:st.bg, borderColor:st.border, animation:`cardIn 0.2s ease-out ${ci*0.04}s both` }}>
                                    <div className="flex items-start gap-3 p-3">
                                      {/* Status dot */}
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-black text-white"
                                        style={{ background:st.dot, boxShadow:`0 0 6px ${st.dot}55` }}>
                                        {st.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          <code className="text-[9px] font-mono font-black text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200">{check.id}</code>
                                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize"
                                            style={{ background:`${PS_SEV_COLOR[check.severity]}18`, color:PS_SEV_COLOR[check.severity] }}>
                                            {check.severity}
                                          </span>
                                          <span className="text-[9px] text-slate-400">{check.standard}</span>
                                          {isManual && <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">Manual</span>}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{check.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{check.detail}</p>

                                        {/* AI evidence */}
                                        {evidence.length > 0 && (
                                          <div className="mt-2 flex flex-col gap-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Evidence ({evidence.length})</p>
                                            {evidence.slice(0, 3).map((f, fi) => (
                                              <div key={fi} className="flex items-start gap-1.5 text-[9px] text-slate-600 bg-white/70 rounded-lg px-2 py-1 border border-slate-100">
                                                <span className="font-black mt-0.5" style={{ color:PS_SEV_COLOR[f.severity]||'#64748b' }}>⚑</span>
                                                <span className="truncate">{f.issue_observed}</span>
                                                <button
                                                  onClick={() => { setActivePanel('drawing'); setTimeout(() => jumpToFinding(f.id), 150); }}
                                                  className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                                  style={{ background:'#0891b2', color:'#fff' }}>
                                                  Locate
                                                </button>
                                              </div>
                                            ))}
                                            {evidence.length > 3 && (
                                              <p className="text-[9px] text-slate-400 px-1">+{evidence.length - 3} more findings</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Manual override row */}
                                    <div className="flex items-center gap-1.5 px-3 pb-3">
                                      <span className="text-[9px] font-bold text-slate-400 mr-1">Override:</span>
                                      {[
                                        { v:'pass', label:'✓ Pass', color:'#22c55e' },
                                        { v:'fail', label:'✗ Fail', color:'#dc2626' },
                                        { v:'na',   label:'— N/A',  color:'#94a3b8' },
                                      ].map(opt => {
                                        const isActive = pipCheckStates[check.id] === opt.v;
                                        return (
                                          <button key={opt.v}
                                            onClick={() => setPipCheckStates(prev => ({
                                              ...prev,
                                              [check.id]: isActive ? undefined : opt.v,
                                            }))}
                                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all"
                                            style={{
                                              background: isActive ? opt.color : 'white',
                                              color:      isActive ? '#fff'    : opt.color,
                                              borderColor: isActive ? opt.color : `${opt.color}60`,
                                            }}>
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {pipCheckStates[check.id] && (
                                        <button
                                          onClick={() => setPipCheckStates(prev => { const n = {...prev}; delete n[check.id]; return n; })}
                                          className="text-[9px] text-slate-400 hover:text-slate-600 ml-auto">
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      <div className="h-6" />
                    </div>
                  )}

                  {/* ════════════════════════════════════
                      SUMMARY VIEW
                  ════════════════════════════════════ */}
                  {pipActiveView === 'summary' && (
                    <div className="p-5 space-y-6 overflow-y-auto" style={{ maxHeight:'70vh' }}>

                      {/* Score ring */}
                      <div className="rounded-xl border p-4 flex items-center gap-5"
                        style={{ background:'linear-gradient(135deg,rgba(8,145,178,0.05),rgba(6,182,212,0.04))', borderColor:'rgba(8,145,178,0.2)' }}>
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                            <circle cx="22" cy="22" r="17" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                            <circle cx="22" cy="22" r="17" fill="none" stroke={scoreColor} strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${2*Math.PI*17*qcScore/100} ${2*Math.PI*17*(1-qcScore/100)}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black leading-none" style={{ color:scoreColor }}>{qcScore}%</span>
                            <span className="text-[9px] text-slate-400 font-medium">QC</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 mb-1">Piping QC Score</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {passCnt} of {total} checks passed or auto-cleared.
                            {failCnt > 0 && ` ${failCnt} check${failCnt!==1?'s':''} marked as failed.`}
                            {warnCnt > 0 && ` ${warnCnt} check${warnCnt!==1?'s':''} require engineer review.`}
                          </p>
                          <div className="flex gap-4 mt-2">
                            {[['Pass/OK',passCnt,'#22c55e'],['Review',warnCnt,'#f59e0b'],['Failed',failCnt,'#dc2626'],['Pending',pendCnt,'#94a3b8']].map(([l,v,c])=>(
                              <div key={l} className="text-center">
                                <p className="text-base font-black leading-none" style={{color:c}}>{v}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                          <span className="text-base">📋</span> Checks by Category
                        </p>
                        <div className="flex flex-col gap-2">
                          {PIPE_CATEGORIES.map(cat => {
                            const catChecks = PIPE_CHECKS.filter(c => c.category === cat);
                            const catDef    = PIPE_CAT_STYLE[cat] || PIPE_CAT_STYLE['Line Identification'];
                            const catPass   = catChecks.filter(c => ['pass','ok'].includes(effectiveStatus(c))).length;
                            const catFail   = catChecks.filter(c => effectiveStatus(c) === 'fail').length;
                            const catWarn   = catChecks.filter(c => effectiveStatus(c) === 'warn').length;
                            const catPct    = Math.round(catPass / catChecks.length * 100);
                            return (
                              <div key={cat} className="rounded-xl border p-3"
                                style={{ background: catFail>0 ? '#fef2f220' : catWarn>0 ? '#fffbeb40' : '#f0fdf430',
                                         borderColor: catFail>0 ? '#fca5a580' : catWarn>0 ? '#fcd34d80' : '#86efac80' }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold" style={{ color:catDef.color }}>{catDef.icon} {cat}</span>
                                  <div className="flex items-center gap-2">
                                    {catFail > 0 && <span className="text-[9px] font-black text-red-600">{catFail}✗</span>}
                                    {catWarn > 0 && <span className="text-[9px] font-black text-amber-600">{catWarn}⚠</span>}
                                    <span className="text-[9px] font-bold" style={{ color:catFail>0?'#dc2626':catWarn>0?'#f59e0b':'#22c55e' }}>{catPct}%</span>
                                  </div>
                                </div>
                                <div className="w-full rounded-full h-2" style={{ background:'rgba(0,0,0,0.08)' }}>
                                  <div className="h-2 rounded-full transition-all duration-700"
                                    style={{ width:`${catPct}%`, background: catFail>0 ? '#dc2626' : catWarn>0 ? '#f59e0b' : catDef.color }} />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1">{catPass} of {catChecks.length} checks OK</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Severity breakdown */}
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                          <span className="text-base">🔍</span> Failed / Review by Severity
                        </p>
                        {['critical','major','minor','info'].map(sev => {
                          const sevChecks  = PIPE_CHECKS.filter(c => c.severity === sev);
                          const sevIssues  = sevChecks.filter(c => ['fail','warn'].includes(effectiveStatus(c))).length;
                          if (sevChecks.length === 0) return null;
                          return (
                            <div key={sev} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                              <span className="text-[10px] font-black w-14 capitalize" style={{ color:PS_SEV_COLOR[sev] }}>{sev}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${sevIssues/Math.max(1,sevChecks.length)*100}%`, background:`linear-gradient(90deg,${PS_SEV_COLOR[sev]},${PS_SEV_COLOR[sev]}99)` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-16 text-right">{sevIssues} / {sevChecks.length}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reset all overrides */}
                      {Object.keys(pipCheckStates).length > 0 && (
                        <button
                          onClick={() => setPipCheckStates({})}
                          className="w-full py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                          Reset all {Object.keys(pipCheckStates).length} manual override{Object.keys(pipCheckStates).length!==1?'s':''}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ══ Footer ══ */}
                  <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[9px] text-slate-400">
                    <span style={{ color:'#0891b2' }}>
                      {pipActiveView === 'checklist'
                        ? `${total} checks · ${Object.keys(pipCheckStates).length} manual override${Object.keys(pipCheckStates).length!==1?'s':''}`
                        : `QC score: ${qcScore}%`}
                    </span>
                    <span>ASME B31.3 · ISA 5.1 · DGS · AI auto-detection active</span>
                  </div>

                </div>
              );
            })()}
            </div>
            )}
            {/* ─── end PIPING panel ─── */}

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

              // 1. Master serial index: every finding across all drawings (INFO excluded)
              const masterIndex = allDrawings.flatMap((d, di) =>
                (d.issues ?? [])
                  .filter(f => !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase()))
                  .map((f, fi) => ({
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

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PERFORMANCE & ACCURACY PANEL                               */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activePanel === 'performance' && (() => {
              const allDrawings = results?.drawings ?? [];

              // ── Active-drawing marker placement stats ──────────────────
              const tierCounts = {};
              for (const n of overlayNodes) {
                const t = n.tier || 'FH';
                tierCounts[t] = (tierCounts[t] || 0) + 1;
              }
              const totalMarkers  = overlayNodes.length;
              const anchoredCount = overlayNodes.filter(n => n.anchored).length;

              // Weighted placement confidence score (0–100)
              const placementScore = totalMarkers === 0 ? null
                : Math.round(
                    (Object.entries(tierCounts).reduce(
                      (sum, [t, c]) => sum + c * (PERF_TIER_WEIGHT[t] ?? 0.3), 0
                    ) / totalMarkers) * 100
                  );
              const anchorRate = totalMarkers === 0 ? null
                : Math.round((anchoredCount / totalMarkers) * 100);

              // Score quality helper (returns colour + label)
              const scoreQuality = (val, thresholds) => {
                if (val == null) return { color: '#94a3b8', label: 'No data' };
                if (val >= thresholds.high)     return { color: '#10b981', label: 'High' };
                if (val >= thresholds.moderate) return { color: '#f59e0b', label: 'Moderate' };
                return { color: '#ef4444', label: 'Low' };
              };
              const confQuality   = scoreQuality(placementScore, PERF_SCORE_THRESHOLDS);
              const anchorQuality = scoreQuality(anchorRate,     PERF_ANCHOR_THRESHOLDS);

              // ── Document Accuracy Rate ─────────────────────────────────
              // Blends three sub-scores (OCR quality, placement confidence,
              // anchor rate) using PERF_DOC_ACCURACY_WEIGHTS.
              const es = extractionSummary;   // shorthand — already declared above
              const ocrScore = (() => {
                if (!es || es.no_text_detected) return 0;
                const len = es.raw_text_length ?? 0;
                if (len >= PERF_OCR_GOOD_THRESHOLD) return 100;
                return Math.round((len / PERF_OCR_GOOD_THRESHOLD) * 100);
              })();
              const docAccuracyRate = (placementScore == null && anchorRate == null && !es)
                ? null
                : Math.min(100, Math.round(
                    (ocrScore              * PERF_DOC_ACCURACY_WEIGHTS.ocr)      +
                    ((placementScore ?? 0) * PERF_DOC_ACCURACY_WEIGHTS.placement) +
                    ((anchorRate     ?? 0) * PERF_DOC_ACCURACY_WEIGHTS.anchor)
                  ));
              const docAccQuality = scoreQuality(docAccuracyRate, PERF_DOC_ACCURACY_THRESHOLDS);

              // Extraction entity counts for the accuracy breakdown row
              const entityCounts = es ? [
                { label: 'Tags',        val: es.tags        ?? 0, icon: '🏷' },
                { label: 'Instruments', val: es.instruments  ?? 0, icon: '🔬' },
                { label: 'Valves',      val: es.valves       ?? 0, icon: '🔧' },
                { label: 'Equipment',   val: es.equipment    ?? 0, icon: '⚙️' },
                { label: 'Line Sizes',  val: es.line_sizes   ?? 0, icon: '📏' },
                { label: 'Line Tags',   val: es.line_tags    ?? 0, icon: '〰' },
              ] : [];

              // ── All-drawings aggregated findings ───────────────────────
              const allIssues = allDrawings.flatMap(d =>
                (d.issues ?? []).filter(f =>
                  !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase())
                )
              );
              const totalFindings = allIssues.length;

              // Severity breakdown
              const sevCount = {};
              for (const f of allIssues) {
                const s = (f.severity || 'minor').toLowerCase();
                sevCount[s] = (sevCount[s] || 0) + 1;
              }
              const SEV_ORDER  = ['critical', 'major', 'minor'];
              const SEV_COLORS = { critical: '#dc2626', major: '#f97316', minor: '#fbbf24' };

              // Category breakdown
              const catCount = {};
              for (const f of allIssues) {
                const c = CATEGORY_LABELS[f.category] || f.category || 'Unknown';
                catCount[c] = (catCount[c] || 0) + 1;
              }
              const catList = Object.entries(catCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, PERF_TOP_CATS_COUNT);

              // Rule leaderboard
              const ruleCount = {};
              for (const f of allIssues) {
                const r = f.rule_id || '—';
                ruleCount[r] = (ruleCount[r] || 0) + 1;
              }
              const ruleList = Object.entries(ruleCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, PERF_TOP_RULES_COUNT);

              // Per-drawing summary
              const drawingSummary = allDrawings.map(d => {
                const issues = (d.issues ?? []).filter(f =>
                  !HIDDEN_SEVERITIES.has((f.severity || '').toLowerCase())
                );
                const sevs   = issues.map(f => (f.severity || 'minor').toLowerCase());
                const topSev = SEV_ORDER.find(s => sevs.includes(s)) || null;
                return { id: d.drawing_id, count: issues.length, topSev };
              });

              // Bar component (inline helper, purely presentational)
              const Bar = ({ value, max, color, h = '6px' }) => (
                <div style={{ height: h, borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden', flex: 1 }}>
                  <div style={{
                    height: '100%',
                    width:  `${max > 0 ? Math.round((value / max) * 100) : 0}%`,
                    background: color,
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              );

              // Gauge arc (SVG semi-circle) — purely cosmetic
              const GaugeArc = ({ pct, color }) => {
                const r = 36; const circ = Math.PI * r;
                const dash = pct != null ? (pct / 100) * circ : 0;
                return (
                  <svg width="90" height="52" viewBox="0 0 90 52">
                    <path d="M9,46 A36,36 0 0,1 81,46" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                    <path d="M9,46 A36,36 0 0,1 81,46" fill="none" stroke={color}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${dash} ${circ}`}
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                );
              };

              return (
                <div className="space-y-4" style={{ animation: 'panelSlide 0.25s ease-out both' }}>

                  {/* ── Section 0: Document Accuracy Rate (hero) ─────────── */}
                  <div className="rounded-2xl overflow-hidden" style={{
                    ...T.card,
                    border: `1.5px solid ${docAccQuality.color}40`,
                    boxShadow: `0 4px 24px ${docAccQuality.color}18`,
                  }}>
                    <div className="px-5 py-4 flex items-center gap-4"
                      style={{ background: `linear-gradient(135deg,${docAccQuality.color}12,${docAccQuality.color}06)` }}>
                      {/* Big score */}
                      <div className="flex flex-col items-center justify-center shrink-0"
                        style={{ minWidth: '80px' }}>
                        <svg width="80" height="46" viewBox="0 0 80 46">
                          <path d="M7,42 A33,33 0 0,1 73,42" fill="none" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round" />
                          <path d="M7,42 A33,33 0 0,1 73,42" fill="none" stroke={docAccQuality.color}
                            strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={`${docAccuracyRate != null ? (docAccuracyRate / 100) * (Math.PI * 33) : 0} ${Math.PI * 33}`}
                            style={{ transition: 'stroke-dasharray 0.9s ease' }}
                          />
                        </svg>
                        <p className="text-2xl font-black -mt-3" style={{ color: docAccQuality.color }}>
                          {docAccuracyRate != null ? `${docAccuracyRate}%` : '—'}
                        </p>
                      </div>

                      {/* Label + breakdown */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-900">Document Accuracy Rate</p>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${docAccQuality.color}20`, color: docAccQuality.color }}>
                            {docAccQuality.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2.5">
                          Composite score: OCR quality ({PERF_DOC_ACCURACY_WEIGHTS.ocr * 100}%) ·
                          placement confidence ({PERF_DOC_ACCURACY_WEIGHTS.placement * 100}%) ·
                          anchor rate ({PERF_DOC_ACCURACY_WEIGHTS.anchor * 100}%)
                        </p>
                        {/* Sub-score pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'OCR Quality',   val: ocrScore,       note: es?.no_text_detected ? 'No text' : `${es?.raw_text_length ?? 0} chars` },
                            { label: 'Placement',     val: placementScore, note: `${totalMarkers} markers` },
                            { label: 'Anchor Rate',   val: anchorRate,     note: `${anchoredCount}/${totalMarkers} anchored` },
                          ].map(pill => (
                            <div key={pill.label} className="flex flex-col rounded-lg px-2.5 py-1.5 gap-0.5"
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{pill.label}</p>
                              <p className="text-sm font-black text-slate-800">{pill.val != null ? `${pill.val}%` : '—'}</p>
                              <p className="text-[8px] text-slate-400">{pill.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Entity extraction row */}
                    {entityCounts.length > 0 && (
                      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          Extracted Entities — Active Drawing
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entityCounts.map(e => (
                            <div key={e.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                              style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                              <span className="text-sm leading-none">{e.icon}</span>
                              <div>
                                <p className="text-[8px] text-slate-400 font-medium leading-tight">{e.label}</p>
                                <p className="text-xs font-black text-slate-800 leading-tight">{e.val}</p>
                              </div>
                            </div>
                          ))}
                          {es?.no_text_detected && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                              <span className="text-sm">⚠️</span>
                              <p className="text-[9px] font-bold text-red-600">No OCR text detected</p>
                            </div>
                          )}
                          {es?.line_tags_multi_angle > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                              style={{ background: '#f0fdfa', border: '1px solid #5eead4' }}>
                              <span className="text-sm">↔↕</span>
                              <div>
                                <p className="text-[8px] text-teal-600 font-medium leading-tight">Multi-angle</p>
                                <p className="text-xs font-black text-teal-800 leading-tight">{es.line_tags_multi_angle}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Section 1: Score gauges ─────────────────────────── */}
                  <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                      style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Model Performance &amp; Accuracy</h2>
                        <p className="text-xs text-slate-500">
                          Active drawing · {totalMarkers} marker{totalMarkers !== 1 ? 's' : ''} ·&nbsp;
                          {allDrawings.length} drawing{allDrawings.length !== 1 ? 's' : ''} in project
                        </p>
                      </div>
                    </div>

                    {/* Gauge row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                      {[
                        {
                          label: 'Placement Confidence',
                          pct:   placementScore,
                          qual:  confQuality,
                          sub:   placementScore != null ? `${placementScore}% weighted score` : 'Open a drawing',
                        },
                        {
                          label: 'Anchor Rate',
                          pct:   anchorRate,
                          qual:  anchorQuality,
                          sub:   anchorRate != null
                            ? `${anchoredCount} of ${totalMarkers} markers anchored`
                            : 'Open a drawing',
                        },
                        {
                          label: 'Total Findings',
                          pct:   null,
                          qual:  { color: totalFindings === 0 ? '#10b981' : totalFindings > 30 ? '#ef4444' : '#f59e0b', label: '' },
                          sub:   `${allDrawings.length} drawing${allDrawings.length !== 1 ? 's' : ''} analysed`,
                          staticValue: totalFindings,
                        },
                      ].map((g, i) => (
                        <div key={i} className="px-4 py-4 flex flex-col items-center gap-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 text-center">{g.label}</p>
                          {g.staticValue != null ? (
                            <p className="text-3xl font-black mt-1" style={{ color: g.qual.color }}>{g.staticValue}</p>
                          ) : (
                            <div className="relative flex flex-col items-center">
                              <GaugeArc pct={g.pct} color={g.qual.color} />
                              <p className="text-xl font-black -mt-2" style={{ color: g.qual.color }}>
                                {g.pct != null ? `${g.pct}%` : '—'}
                              </p>
                            </div>
                          )}
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-1"
                            style={{ background: `${g.qual.color}18`, color: g.qual.color }}>
                            {g.qual.label}
                          </span>
                          <p className="text-[9px] text-slate-400 text-center mt-0.5">{g.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Section 2: Tier breakdown (active drawing) ─────── */}
                  {totalMarkers > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                      <div className="px-5 py-3 border-b border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Marker Resolution Tiers — Active Drawing
                        </p>
                      </div>
                      <div className="px-5 py-3 space-y-2.5">
                        {Object.entries(tierCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tier, count]) => {
                            const pct   = Math.round((count / totalMarkers) * 100);
                            const color = PERF_TIER_COLOR[tier] || '#94a3b8';
                            const label = PERF_TIER_LABEL[tier] || tier;
                            return (
                              <div key={tier} className="flex items-center gap-2.5">
                                <span className="text-[9px] font-black w-5 text-right shrink-0"
                                  style={{ color }}>{tier}</span>
                                <Bar value={count} max={totalMarkers} color={color} h="7px" />
                                <span className="text-[9px] text-slate-500 w-6 shrink-0">{pct}%</span>
                                <span className="text-[9px] text-slate-400 shrink-0 hidden sm:block">{label}</span>
                                <span className="text-[9px] font-bold text-slate-500 shrink-0">×{count}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── Section 3: Severity & Category distribution ──────── */}
                  {totalFindings > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Severity */}
                      <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity Breakdown</p>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                          {SEV_ORDER.map(sev => {
                            const n = sevCount[sev] || 0;
                            if (n === 0) return null;
                            const pct = Math.round((n / totalFindings) * 100);
                            return (
                              <div key={sev} className="flex items-center gap-2">
                                <span className="w-12 text-[9px] font-bold capitalize shrink-0"
                                  style={{ color: SEV_COLORS[sev] }}>{sev}</span>
                                <Bar value={n} max={totalFindings} color={SEV_COLORS[sev]} h="6px" />
                                <span className="text-[9px] text-slate-500 w-7 text-right shrink-0">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Category */}
                      <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Categories</p>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                          {catList.map(([cat, n]) => {
                            const pct = Math.round((n / totalFindings) * 100);
                            return (
                              <div key={cat} className="flex items-center gap-2">
                                <span className="w-20 text-[9px] font-medium text-slate-600 shrink-0 truncate">{cat}</span>
                                <Bar value={n} max={catList[0]?.[1] || 1} color="#6366f1" h="6px" />
                                <span className="text-[9px] text-slate-500 w-7 text-right shrink-0">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Section 4: Rule leaderboard ──────────────────────── */}
                  {ruleList.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                      <div className="px-5 py-3 border-b border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Triggered Rules</p>
                      </div>
                      <div className="px-5 py-3 space-y-2">
                        {ruleList.map(([rule, cnt], i) => {
                          const pct = Math.round((cnt / totalFindings) * 100);
                          return (
                            <div key={rule} className="flex items-center gap-2.5">
                              <span className="text-[9px] font-black text-slate-300 w-4 shrink-0">{i + 1}</span>
                              <code className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-20 shrink-0 truncate">{rule}</code>
                              <Bar value={cnt} max={ruleList[0]?.[1] || 1} color="#6366f1" h="6px" />
                              <span className="text-[9px] text-slate-500 w-6 text-right shrink-0">{pct}%</span>
                              <span className="text-[9px] font-bold text-slate-600 shrink-0">×{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Section 5: Per-drawing summary table ─────────────── */}
                  {drawingSummary.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ ...T.card }}>
                      <div className="px-5 py-3 border-b border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Per-Drawing Summary</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <th className="px-4 py-2 text-left">#</th>
                              <th className="px-4 py-2 text-left">Drawing</th>
                              <th className="px-4 py-2 text-right">Findings</th>
                              <th className="px-4 py-2 text-center">Top Severity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drawingSummary.map((row, i) => (
                              <tr key={row.id} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                <td className="px-4 py-2 text-slate-400 font-mono text-[9px]">{i + 1}</td>
                                <td className="px-4 py-2 font-mono text-[10px] text-slate-700 max-w-[180px] truncate">{row.id}</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-800">{row.count}</td>
                                <td className="px-4 py-2 text-center">
                                  {row.topSev ? (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                                      style={{ background: `${SEV_COLORS[row.topSev]}20`, color: SEV_COLORS[row.topSev] }}>
                                      {row.topSev}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-300">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {allDrawings.length === 0 && (
                    <div className="rounded-2xl flex flex-col items-center justify-center py-20 gap-3" style={{ ...T.card }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac' }}>
                        <Zap className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No drawings analysed yet</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        Upload and process a P&amp;ID drawing to see model performance and accuracy metrics.
                      </p>
                    </div>
                  )}

                </div>
              );
            })()}
            {/* ─── end PERFORMANCE & ACCURACY panel ─── */}

            </div>

            </div>

            {/* ══ RIGHT ICON RAIL ══ */}
            <div
              className="flex-shrink-0 sticky top-4 self-start"
              style={{ width:`${NAV_RAIL_WIDTH}px`, animation:'railIn 0.4s ease-out both' }}
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
              <div className="flex flex-col gap-1.5">
                {PANELS.map((tab, idx) => {
                  const isActive = activePanel === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePanel(tab.id)}
                      title={tab.label}
                      className="relative w-full flex flex-row items-center gap-2.5 group"
                      style={{
                        borderRadius: '12px',
                        padding: '9px 10px 9px 12px',
                        background: isActive
                          ? `linear-gradient(135deg, ${tab.accent} 0%, ${tab.accent}cc 100%)`
                          : '#ffffff',
                        border: isActive
                          ? `1.5px solid ${tab.accent}`
                          : '1.5px solid #e2e8f0',
                        boxShadow: isActive
                          ? `0 4px 16px ${tab.glow || 'rgba(0,0,0,0.15)'}, 0 1px 4px rgba(0,0,0,0.08)`
                          : '0 1px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                        animation: `navTabIn ${NAV_RAIL_ENTRY_DURATION_MS}ms cubic-bezier(.22,.68,0,1.2) ${idx * NAV_RAIL_ENTRY_DELAY_MS}ms both`,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Hover tint (inactive only) */}
                      {!isActive && (
                        <span
                          aria-hidden="true"
                          className="group-hover:opacity-100"
                          style={{
                            position: 'absolute', inset: 0,
                            borderRadius: '12px',
                            background: `${tab.accent}0d`,
                            opacity: 0,
                            transition: 'opacity 0.18s',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                        background: isActive ? 'rgba(255,255,255,0.22)' : `${tab.accent}18`,
                        transition: 'background 0.2s',
                      }}>
                        <tab.icon
                          cls="w-3.5 h-3.5"
                          style={{
                            color: isActive ? '#ffffff' : tab.accent,
                            flexShrink: 0,
                          }}
                        />
                      </span>

                      {/* Label + badge */}
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 800,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          lineHeight: 1.2, whiteSpace: 'nowrap',
                          color: isActive ? '#ffffff' : '#475569',
                          transition: 'color 0.18s',
                        }}>
                          {tab.label}
                        </span>
                      </span>
                      {tab.badge != null && (
                        <span
                          className={`absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none ${tab.badgeCls || 'bg-slate-200 text-slate-600'}`}
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.28)' : undefined,
                            color:      isActive ? '#ffffff' : undefined,
                            boxShadow:  '0 1px 4px rgba(0,0,0,0.15)',
                          }}
                        >
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
