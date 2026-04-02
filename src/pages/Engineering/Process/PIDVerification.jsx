import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import CrossRecommendationPanel from '../../../components/recommendations/CrossRecommendationPanel';
import {
  Upload as UploadIcon, FileText, CheckCircle, AlertTriangle,
  Loader, X, Download, Activity, Shield, GitBranch, Cpu, Clock,
  RefreshCw, FolderPlus, Package, Layers, ChevronRight, Edit,
  Trash2, ArrowLeft, BarChart2, Save, Zap, Tag, Link, Sliders,
  Ruler, ScanLine, Brain, CircleDot,
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

// Soft-coded: categories excluded from the report view.
// Extend this set to suppress additional categories without touching rule logic.
const HIDDEN_CATEGORIES = new Set(['notes']);

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

    // Extract all NPS sizes contained in an evidence string.
    // e.g. 'SUCTION KOD 6" 4"-BD-4860-033842-X-N ...' -> ['6"', '4"']
    const extractNpsKeys = (str) => {
      const keys = [];
      const re = /\b(\d+(?:\.\d+)?)[""\u201c\u201d]/g;
      let m;
      while ((m = re.exec(str)) !== null) { keys.push(m[1] + '"'); }
      return keys;
    };

    // Resolve the best real position for a finding.
    // Priority: exact key match > NPS extracted from evidence string > null.
    const resolveReal = (nk, rawKey) => {
      let r = realPositions[nk] ?? realPositions[rawKey] ?? null;
      if (r) return r;
      for (const nps of extractNpsKeys(nk)) {
        r = realPositions[nps] ?? realPositions[normKey(nps)] ?? null;
        if (r) return r;
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

      if (real?.all?.length > 0) {
        // Multi-instance: one dot per body occurrence (one per pipe on drawing).
        real.all.forEach((pt, idx) => {
          nodes.push({
            ...x,
            key: real.all.length > 1 ? `${nk}#${idx}` : nk,
            left: Math.min(95, Math.max(5, pt.x_pct)),
            top:  Math.min(95, Math.max(5, pt.y_pct)),
            anchored: true,
          });
        });
      } else if (real) {
        nodes.push({
          ...x,
          left: Math.min(95, Math.max(5, real.x_pct)),
          top:  Math.min(95, Math.max(5, real.y_pct)),
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

  const overlayNodes = buildOverlayNodes(activeDrawingData?.issues || []);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-6">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3" style={{ animation:'fadeUp 0.4s ease-out both' }}>
          <button onClick={handleBackToProjects}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all text-sm shadow-sm">
            <ArrowLeft className="w-4 h-4" />Projects
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
            style={{ background:'linear-gradient(135deg,#eff6ff,#eef2ff)', borderColor:'#bfdbfe' }}>
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm truncate max-w-[200px]">{selectedProject.project_name}</span>
          </div>
          <button onClick={() => fetchHistory(selectedProject.project_id)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all text-sm shadow-sm">
            <BarChart2 className="w-4 h-4" />History
          </button>
        </div>

        {/* Sub-header */}
        <div className="mb-6" style={{ animation:'fadeUp 0.5s ease-out 0.1s both' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full" style={{ background:'linear-gradient(180deg,#3b82f6,#6366f1)' }} />
            <span className="text-blue-600 text-xs font-bold tracking-widest uppercase">P&amp;ID Quality Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Design Verification Upload</h1>
          <p className="text-slate-500 text-sm mt-1">Upload your P&amp;ID PDF — deterministic rule engine performs 20+ engineering compliance checks</p>
        </div>

        <FlashBanner />

        {/* Upload card */}
        {!results && (
          <div className="rounded-2xl p-5 sm:p-6 mb-5" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">P&amp;ID Drawing (PDF) *</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pidv-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
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
              <div className="mt-3 flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-4 py-2.5">
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-800 truncate flex-1">{file.name}</span>
                <button onClick={e => { e.stopPropagation(); setFile(null); }} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Legend Knowledge</p>
                  <p className="text-sm text-slate-700">Upload legends sheet once, then reuse for future recognition runs.</p>
                </div>
                <div className="text-xs text-slate-500">
                  Instrument prefixes: <span className="font-semibold text-slate-700">{legendKnowledge?.instrument_prefixes?.length ?? 0}</span>
                  {' · '}
                  Valve prefixes: <span className="font-semibold text-slate-700">{legendKnowledge?.valve_prefixes?.length ?? 0}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setLegendFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />
                <button
                  onClick={handleBuildLegend}
                  disabled={buildingLegend || !legendFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                  style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
                >
                  {buildingLegend ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  {buildingLegend ? 'Building…' : 'Build Legend Knowledge'}
                </button>
              </div>
              {legendKnowledge?.sources?.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Sources: {legendKnowledge.sources.join(', ')}
                </p>
              )}
            </div>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button onClick={handleUpload} disabled={uploading || !file}
              className={`mt-5 w-full py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
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

        {/* Results panel */}
        {results && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-2xl p-5" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.1s both' }}>
              <div className="flex flex-wrap items-center gap-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: totalIssues > 0 ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                           border: `1px solid ${totalIssues > 0 ? '#fca5a5' : '#86efac'}` }}>
                  {totalIssues > 0 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">File</p>
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{results.file_name}</p>
                </div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Drawings</p><p className="font-bold text-2xl text-blue-600">{results.drawings?.length ?? 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Issues</p><p className={`font-bold text-2xl ${totalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalIssues}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Critical</p><p className="font-bold text-2xl text-red-700">{criticalCount}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Major</p><p className="font-bold text-2xl text-orange-600">{majorCount}</p></div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  <button onClick={runAccuracyCompare} disabled={runningCompare}
                    className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)', boxShadow:'0 4px 14px rgba(13,148,136,0.35)' }}>
                    {runningCompare ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {runningCompare ? 'Comparing…' : 'Compare Accuracy'}
                  </button>
                  <button onClick={downloadExcel} disabled={downloadingXlsx}
                    className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background:'linear-gradient(135deg,#059669,#10b981)', boxShadow:'0 4px 14px rgba(16,185,129,0.35)' }}>
                    {downloadingXlsx ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloadingXlsx ? 'Generating…' : 'Excel'}
                  </button>
                  <button onClick={downloadPDF} disabled={downloadingPdf}
                    className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow:'0 4px 14px rgba(239,68,68,0.35)' }}>
                    {downloadingPdf ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloadingPdf ? 'Generating…' : 'PDF'}
                  </button>
                  <button onClick={() => { resetUpload(); setResults(null); }}
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all">
                    <RefreshCw className="w-4 h-4" />New Upload
                  </button>
                </div>
              </div>
            </div>

            {comparison && (
              <div className="rounded-2xl p-5" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.12s both' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Legend-Backed Accuracy Comparison</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="font-semibold text-slate-700 mb-2">Before (Defaults)</p>
                    <p className="text-slate-500">Instruments: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.instruments ?? 0}</span></p>
                    <p className="text-slate-500">Valves: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.valves ?? 0}</span></p>
                    <p className="text-slate-500">Line sizes: <span className="text-slate-800 font-semibold">{comparison?.before_defaults_only?.summary?.line_sizes ?? 0}</span></p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="font-semibold text-emerald-700 mb-2">After (Legend-Backed)</p>
                    <p className="text-emerald-700">Instruments: <span className="font-bold">{comparison?.after_legend_backed?.summary?.instruments ?? 0}</span></p>
                    <p className="text-emerald-700">Valves: <span className="font-bold">{comparison?.after_legend_backed?.summary?.valves ?? 0}</span></p>
                    <p className="text-emerald-700">Line sizes: <span className="font-bold">{comparison?.after_legend_backed?.summary?.line_sizes ?? 0}</span></p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="font-semibold text-blue-700 mb-2">Delta (After - Before)</p>
                    <p className="text-blue-700">Instruments: <span className="font-bold">{comparison?.delta_after_minus_before?.instruments ?? 0}</span></p>
                    <p className="text-blue-700">Valves: <span className="font-bold">{comparison?.delta_after_minus_before?.valves ?? 0}</span></p>
                    <p className="text-blue-700">Line sizes: <span className="font-bold">{comparison?.delta_after_minus_before?.line_sizes ?? 0}</span></p>
                  </div>
                </div>
              </div>
            )}

            <CrossRecommendationPanel
              sourceType="pid"
              documentId={documentId || results?.document_id}
              projectId={selectedProject?.project_id || results?.project_id}
              fileName={results?.file_name}
            />

            {/* Drawing tabs */}
            {results.drawings?.length > 1 && (
              <div className="flex gap-2 flex-wrap" style={{ animation:'fadeUp 0.5s ease-out 0.15s both' }}>
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

            {results.drawings?.length === 0 && (
              <div className="rounded-2xl p-6 border" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">No drawing pages detected</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Processing completed, but this file produced zero segmented drawings. Try re-uploading as PNG/JPG
                      or use a PDF export with visible vector/text content.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Findings table */}
            {activeDrawingData && (
              <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{activeDrawing}</h2>
                      <p className="text-xs text-slate-500">{activeDrawingData.issues?.length ?? 0} findings</p>
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
                    </div>
                    {extractionSummary.no_text_detected && (
                      <p className="mt-2 text-xs text-amber-600">No OCR text was detected on this page. The source may be low-contrast scan/title sheet.</p>
                    )}
                  </div>
                )}
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

                    {/* ── Drawing + overlay ── */}
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
                        /*
                          KEY FIX: scroll wrapper handles height capping.
                          The inner div + img have no objectFit/maxHeight so the
                          rendered image always fills exactly 100% of its element
                          width with its natural aspect ratio.  The overlay div
                          (absolute inset-0) therefore covers the exact same pixel
                          area as the image — no letterboxing offset.
                        */
                        <div className="overflow-auto" style={{ maxHeight: '72vh' }}>
                          <div className="relative w-full" style={{ lineHeight: 0 }}>
                            <img
                              src={drawingImageUrl}
                              alt={activeDrawing}
                              draggable={false}
                              className="w-full block"
                              style={{ height: 'auto', background: '#f8fafc', userSelect: 'none' }}
                            />
                            {/* Overlay wrapper — inset-0 matches the image exactly */}
                            <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                              {visibleOverlayNodes.map((n) => {
                                const isFocused = focusedFindingId === n.finding.id;
                                const colorCls = n.band === 'high'
                                  ? 'bg-red-500 border-red-600'
                                  : n.band === 'medium'
                                    ? 'bg-amber-500 border-amber-600'
                                    : 'bg-sky-500 border-sky-600';
                                const anchorStyle = n.anchored
                                  ? {}
                                  : { outline: '2px dashed rgba(100,116,139,0.7)', outlineOffset: '3px' };
                                return (
                                  <button
                                    key={n.key}
                                    onClick={() => jumpToFinding(n.finding.id)}
                                    title={`${n.key} · ${n.finding.issue_observed}`}
                                    className={`absolute rounded-full border-2 transition-all ${colorCls} ${isFocused ? 'scale-150 ring-4 ring-white/80 z-20' : 'hover:scale-125 z-10'}`}
                                    style={{
                                      left: `${n.left}%`,
                                      top:  `${n.top}%`,
                                      width: '16px',
                                      height: '16px',
                                      transform: 'translate(-50%, -50%)',
                                      pointerEvents: 'all',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                      ...anchorStyle,
                                    }}
                                  />
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600" style={{ pointerEvents: 'none' }}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />High</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />Medium</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />Low</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500">Dashed = heuristic</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                                ) : filteredIssues.map(f => (
                                  <tr id={`finding-row-${f.id}`} key={f.id}
                                    className={`hover:bg-slate-50/70 transition-colors ${focusedFindingId === f.id ? 'bg-indigo-50/60' : ''}`}>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{f.sl_no}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                                        {CATEGORY_LABELS[f.category] || f.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.rule_id}</td>
                                    <td className="px-4 py-3 text-slate-800 text-xs max-w-xs">{f.issue_observed}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{f.action_required}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[120px] truncate" title={f.evidence}>{f.evidence}</td>
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
                                ))}
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
          </div>
        )}

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
