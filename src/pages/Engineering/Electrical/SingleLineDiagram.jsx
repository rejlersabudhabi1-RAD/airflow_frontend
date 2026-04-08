import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import {
  Upload as UploadIcon, FileText, CheckCircle, AlertTriangle,
  Loader, X, Download, Activity, Shield, Zap, Clock,
  RefreshCw, FolderPlus, Layers, ChevronRight, Edit,
  Trash2, ArrowLeft, BarChart2, Power, Cpu, CircleDot,
  ScanLine, Brain, Award, Filter, Search, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & layout primitives (matching PID style)
// ─────────────────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.06)} }
  @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.04)} }
  @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,35px) scale(1.05)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes orbitA { 0%{transform:rotate(0deg) translateX(52px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(52px) rotate(-360deg)} }
  @keyframes orbitB { 0%{transform:rotate(120deg) translateX(52px) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(52px) rotate(-480deg)} }
  @keyframes orbitC { 0%{transform:rotate(240deg) translateX(52px) rotate(-240deg)} 100%{transform:rotate(600deg) translateX(52px) rotate(-600deg)} }
`;

const T = {
  bg:    'linear-gradient(135deg, #f8faff 0%, #eef2ff 45%, #fef3c7 75%, #fffbeb 100%)',
  blobs: [
    { color:'rgba(59,130,246,0.09)',  size:'520px', top:'-80px',    left:'18%',    anim:'floatA 14s ease-in-out infinite'    },
    { color:'rgba(234,179,8,0.08)',   size:'430px', top:'28%',      right:'-60px', anim:'floatB 17s ease-in-out infinite'    },
    { color:'rgba(245,158,11,0.07)',  size:'380px', bottom:'-60px', left:'32%',    anim:'floatC 12s ease-in-out infinite'    },
    { color:'rgba(6,182,212,0.06)',   size:'300px', top:'62%',      left:'-40px',  anim:'floatA 10s ease-in-out infinite 3s' },
  ],
  card:  { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)' },
  cardH: { boxShadow:'0 10px 30px rgba(0,0,0,0.10),0 2px 8px rgba(0,0,0,0.05)', borderColor:'#93c5fd' },
  panel: { background:'rgba(255,255,255,0.85)', border:'1px solid #e8edf5', backdropFilter:'blur(12px)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  modal: { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
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
      style={{ background:'linear-gradient(90deg,#eab308,#3b82f6,#6366f1,#eab308)', backgroundSize:'200% auto', animation:'gradShift 4s linear infinite' }} />
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
const API_PREFIX = `${API_BASE_URL}/sld-verification`;

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  major:    'bg-orange-100 text-orange-800 border-orange-300',
  minor:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  info:     'bg-blue-100 text-blue-800 border-blue-300',
};

const CATEGORY_LABELS = {
  protection: 'Protection Coordination',
  voltage:    'Voltage Ratings',
  current:    'Current Ratings',
  connections:'Bus Connections',
  earthing:   'Grounding/Earthing',
  labeling:   'Equipment Labeling',
  symbols:    'Symbol Standards',
};

const authHeader = () => {
  const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Processing loader configuration
// ─────────────────────────────────────────────────────────────────────────────
const ANALYSIS_STAGES = [
  { id: 'upload',     label: 'Uploading SLD document',       icon: UploadIcon, durationMs: 3000  },
  { id: 'parse',      label: 'Parsing electrical symbols',   icon: ScanLine,   durationMs: 6000  },
  { id: 'equipment',  label: 'Extracting equipment data',    icon: Cpu,        durationMs: 9000  },
  { id: 'ratings',    label: 'Validating voltage/current',   icon: Zap,        durationMs: 12000 },
  { id: 'protection', label: 'Analyzing protection scheme',  icon: Shield,     durationMs: 15000 },
  { id: 'compliance', label: 'Checking IEC 60617 symbols',   icon: Award,      durationMs: 18000 },
  { id: 'report',     label: 'Generating findings report',   icon: FileText,   durationMs: 22000 },
];

const SLD_FACTS = [
  'IEC 60617 defines standardized electrical symbols used worldwide in SLDs.',
  'A typical substation SLD contains 50+ circuit breakers and protection relays.',
  'Protection coordination ensures upstream breakers don\'t trip before downstream devices.',
  'Voltage transformation ratios must match between transformer symbols and ratings.',
  'Busbar sizing depends on maximum fault current and continuous load capacity.',
  'Grounding schemes (TN, TT, IT) are critical for electrical safety compliance.',
  'Circuit breaker ratings must exceed calculated fault currents with proper margin.',
  'Color coding: Red=Phase A, Yellow=Phase B, Blue=Phase C in many standards.',
  'Current transformer (CT) ratios must match protection relay input requirements.',
  'SLDs show the power flow path but not the physical layout of equipment.',
];

// ─────────────────────────────────────────────────────────────────────────────
// AnalysisLoader
// ─────────────────────────────────────────────────────────────────────────────
const AnalysisLoader = ({ elapsedSec, fileName }) => {
  const [factIdx, setFactIdx] = useState(0);
  const [factKey, setFactKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setFactIdx(i => (i + 1) % SLD_FACTS.length);
      setFactKey(k => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const completedStages = ANALYSIS_STAGES.filter(s => elapsedSec * 1000 >= s.durationMs);
  const activeIdx = Math.min(completedStages.length, ANALYSIS_STAGES.length - 1);

  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  return (
    <div className="mt-5 rounded-2xl overflow-hidden border border-yellow-200"
      style={{ background: 'linear-gradient(135deg,#fef3c7 0%,#eff6ff 50%,#f0f9ff 100%)', animation: 'fadeUp 0.4s ease-out both' }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4 flex-wrap border-b border-yellow-100/60">
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-yellow-600" style={{ animation: 'pulse2 1.4s ease-in-out infinite' }} />
          <span className="text-sm font-bold text-slate-800">Analysing SLD…</span>
          {fileName && <span className="text-xs text-slate-400 truncate max-w-[180px]">{fileName}</span>}
        </div>
        <div className="flex items-center gap-1.5 bg-white/70 border border-yellow-200 rounded-xl px-3 py-1.5 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-yellow-600" />
          <span className="text-sm font-bold text-yellow-700">{mins}:{secs}</span>
        </div>
      </div>

      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center z-10"
                 style={{ background: 'linear-gradient(135deg,#eab308,#3b82f6)', boxShadow: '0 0 24px rgba(234,179,8,0.45)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            {[
              { color: '#ef4444', anim: 'orbitA 2.4s linear infinite' },
              { color: '#eab308', anim: 'orbitB 2.4s linear infinite' },
              { color: '#3b82f6', anim: 'orbitC 2.4s linear infinite' },
            ].map((dot, idx) => (
              <div key={idx} className="absolute w-3 h-3 rounded-full" style={{ background: dot.color, animation: dot.anim }} />
            ))}
          </div>
          <div className="text-center px-4 py-2 bg-white/60 rounded-xl border border-yellow-200/60">
            <div key={factKey} className="text-xs text-slate-700 leading-relaxed" style={{ animation: 'fadeUp 0.5s ease-out both' }}>
              💡 {SLD_FACTS[factIdx]}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {ANALYSIS_STAGES.map((stage, idx) => {
            const isDone = idx < completedStages.length;
            const isActive = idx === activeIdx;
            const StageIcon = stage.icon;
            return (
              <div key={stage.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                isDone ? 'bg-green-50 border-green-200' : isActive ? 'bg-blue-50 border-blue-200' : 'bg-white/50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                  isDone ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-slate-300'
                }`}>
                  {isDone ? <CheckCircle className="w-4 h-4 text-white" /> :
                   isActive ? <Loader className="w-4 h-4 text-white animate-spin" /> :
                   <StageIcon className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-sm font-medium ${isDone ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const SingleLineDiagram = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [documentId, setDocumentId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (processing) {
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    } else {
      setElapsedSec(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [processing]);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(`${API_PREFIX}/projects/`, { headers: authHeader() });
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const { data } = await axios.post(`${API_PREFIX}/projects/`, 
        { project_name: newProjectName, description: newProjectDesc },
        { headers: authHeader() }
      );
      setProjects([data, ...projects]);
      setSelectedProject(data);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (err) {
      setError('Failed to create project');
    }
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (selectedProject) formData.append('project_id', selectedProject.project_id);

    try {
      const { data } = await axios.post(`${API_PREFIX}/upload-sld/`, formData, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' }
      });
      setDocumentId(data.document_id);
      pollStatus(data.document_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploading(false);
      setProcessing(false);
    }
  };

  const pollStatus = async (docId) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_PREFIX}/status/${docId}/`, { headers: authHeader() });
        if (data.status === 'completed') {
          clearInterval(interval);
          fetchResults(docId);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error_message || 'Processing failed');
          setProcessing(false);
          setUploading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Status check failed');
        setProcessing(false);
        setUploading(false);
      }
    }, 2000);
  };

  const fetchResults = async (docId) => {
    try {
      const { data } = await axios.get(`${API_PREFIX}/results/${docId}/`, { headers: authHeader() });
      setResults(data);
      setProcessing(false);
      setUploading(false);
    } catch (err) {
      setError('Failed to fetch results');
      setProcessing(false);
      setUploading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.get(`${API_PREFIX}/export/excel/${documentId}/`, {
        headers: authHeader(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `sld_findings_${documentId}.xlsx`;
      link.click();
    } catch (err) {
      setError('Excel export failed');
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setFile(null);
    setDocumentId(null);
    setExpandedCategories(new Set());
    setSeverityFilter('all');
    setSearchQuery('');
  };

  const groupedFindings = results?.drawings?.reduce((acc, drawing) => {
    drawing.issues?.forEach(issue => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
    });
    return acc;
  }, {}) || {};

  const filteredCategories = Object.entries(groupedFindings).reduce((acc, [cat, findings]) => {
    let filtered = findings;
    if (severityFilter !== 'all') {
      filtered = filtered.filter(f => f.severity === severityFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.issue_observed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.action_required?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {});

  const stats = results?.drawings?.reduce((acc, d) => {
    d.issues?.forEach(issue => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      acc.total++;
    });
    return acc;
  }, { critical: 0, major: 0, minor: 0, info: 0, total: 0 }) || {};

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DarkBg>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 px-1" style={{ animation: 'fadeUp 0.3s ease-out both' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#eab308,#3b82f6)', boxShadow: '0 4px 12px rgba(234,179,8,0.3)' }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SLD Quality Checker</h1>
            <p className="text-sm text-slate-600">
              Automated compliance engine — 25+ electrical verification rules per drawing. 
              Protection, ratings, symbols & IEC 60617 validation.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mb-6 rounded-2xl p-5 border" style={{ ...T.card, animation: 'fadeUp 0.4s ease-out both 0.1s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Protection Coordination</h3>
                <p className="text-xs text-slate-600">Breaker ratings & selectivity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Voltage & Current</h3>
                <p className="text-xs text-slate-600">Rating verification & limits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">IEC 60617 Symbols</h3>
                <p className="text-xs text-slate-600">Standard compliance checks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Equipment Labeling</h3>
                <p className="text-xs text-slate-600">Tags & nomenclature rules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {!selectedProject ? (
          <div className="rounded-2xl p-6 border" style={{ ...T.card, animation: 'fadeUp 0.4s ease-out both 0.1s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Select or Create Project</h2>
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-sm">
                <FolderPlus className="w-4 h-4" />
                New Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, idx) => (
                <div key={project.id} onClick={() => setSelectedProject(project)}
                  className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  style={{ animation: `fadeUp 0.4s ease-out both ${0.1 + idx * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">{project.document_count || 0} docs</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{project.project_name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !results ? (
          <div className="space-y-5">
            {/* Project Header */}
            <div className="rounded-2xl p-5 border flex items-center justify-between" style={{ ...T.panel, animation: 'fadeUp 0.4s ease-out both' }}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedProject.project_name}</h2>
                <p className="text-sm text-slate-600">{selectedProject.description || 'No description'}</p>
              </div>
              <button onClick={() => { setSelectedProject(null); setFile(null); }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-white/60 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Change Project
              </button>
            </div>

            {processing ? (
              <AnalysisLoader elapsedSec={elapsedSec} fileName={file?.name} />
            ) : (
              <div className="rounded-2xl p-8 border" style={{ ...T.card, animation: 'fadeUp 0.4s ease-out both 0.1s' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                         style={{ background: 'linear-gradient(135deg,#dbeafe,#fef3c7)', border: '2px dashed #93c5fd' }}>
                      <UploadIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Upload SLD Drawing</h3>
                    <p className="text-sm text-slate-600">Drop your SLD file here or click to browse</p>
                  </div>

                  <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all"
                       style={{ borderColor: file ? '#10b981' : '#cbd5e1', background: file ? '#ecfdf5' : '#f8fafc' }}
                       onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
                       onDragOver={(e) => e.preventDefault()}>
                    {file ? (
                      <div>
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <p className="font-medium text-slate-900 mb-1">{file.name}</p>
                        <p className="text-sm text-slate-500 mb-3">{(file.size / 1024).toFixed(1)} KB</p>
                        <button onClick={() => handleFileSelect(null)}
                          className="text-sm text-slate-600 hover:text-slate-900 underline">
                          Change file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-700 mb-1">Supported formats</p>
                        <p className="text-sm text-slate-500">PDF, PNG, JPG, DWG</p>
                      </div>
                    )}
                  </div>

                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.dwg"
                    onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />

                  <div className="mt-5 flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-all font-medium">
                      <FileText className="w-5 h-5" />
                      Browse Files
                    </button>
                    {file && (
                      <button onClick={handleUpload}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl">
                        <Zap className="w-5 h-5" />
                        Analyze SLD
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Results Summary */}
            <div className="rounded-2xl p-6 border" style={{ ...T.card, animation: 'fadeUp 0.4s ease-out both' }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Analysis Results</h2>
                  <p className="text-sm text-slate-600">{results.file_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-sm">
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button onClick={resetAnalysis}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-300 transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-600 mt-1">Total Findings</div>
                </div>
                {['critical', 'major', 'minor', 'info'].map(sev => (
                  <div key={sev} className={`rounded-xl p-4 border ${SEVERITY_STYLES[sev]}`}>
                    <div className="text-3xl font-bold">{stats[sev] || 0}</div>
                    <div className="text-xs mt-1 capitalize">{sev}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-5 border flex flex-wrap gap-4 items-center" style={{ ...T.panel, animation: 'fadeUp 0.4s ease-out both 0.1s' }}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter:</span>
                {['all', 'critical', 'major', 'minor', 'info'].map(sev => (
                  <button key={sev} onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      severityFilter === sev ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search findings..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              {Object.keys(filteredCategories).length === 0 ? (
                <div className="rounded-2xl p-12 text-center border" style={{ ...T.card, animation: 'fadeUp 0.4s ease-out both 0.2s' }}>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {severityFilter !== 'all' || searchQuery ? 'No matching findings' : 'All Checks Passed!'}
                  </h3>
                  <p className="text-slate-600">
                    {severityFilter !== 'all' || searchQuery ? 'Try adjusting your filters' : 'Your SLD meets all quality standards'}
                  </p>
                </div>
              ) : (
                Object.entries(filteredCategories).map(([category, findings], idx) => (
                  <div key={category} className="rounded-2xl border overflow-hidden" 
                       style={{ ...T.card, animation: `fadeUp 0.4s ease-out both ${0.2 + idx * 0.05}s` }}>
                    <button onClick={() => {
                      const newExpanded = new Set(expandedCategories);
                      if (newExpanded.has(category)) newExpanded.delete(category);
                      else newExpanded.add(category);
                      setExpandedCategories(newExpanded);
                    }}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        {expandedCategories.has(category) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        <span className="font-semibold text-slate-900">{CATEGORY_LABELS[category] || category}</span>
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(findings.reduce((acc, f) => {
                          acc[f.severity] = (acc[f.severity] || 0) + 1;
                          return acc;
                        }, {})).map(([sev, count]) => (
                          <span key={sev} className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_STYLES[sev]}`}>
                            {count}
                          </span>
                        ))}
                      </div>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="p-4 space-y-3 bg-white">
                        {findings.map((finding, fidx) => (
                          <div key={fidx} className={`rounded-xl p-4 border ${SEVERITY_STYLES[finding.severity]}`}>
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-semibold capitalize">{finding.severity}</span>
                                  {finding.rule_id && <span className="text-xs opacity-60">Rule: {finding.rule_id}</span>}
                                </div>
                                <p className="font-medium text-slate-900 mb-1">{finding.issue_observed}</p>
                                {finding.action_required && (
                                  <p className="text-sm mt-2"><span className="font-medium">→ Action:</span> {finding.action_required}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        <DarkModal show={showCreateModal} onClose={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
          title="Create New Project" subtitle="Set up a new SLD verification project"
          iconEl={<div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><FolderPlus className="w-5 h-5 text-blue-600" /></div>}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
              <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Substation ABC - 33kV SLD"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief description of the project..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateProject} disabled={!newProjectName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                Create Project
              </button>
              <button onClick={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition-all font-medium">
                Cancel
              </button>
            </div>
          </div>
        </DarkModal>
      </div>
    </DarkBg>
  );
};

export default SingleLineDiagram;
