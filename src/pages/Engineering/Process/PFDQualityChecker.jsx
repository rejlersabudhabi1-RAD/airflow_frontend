import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api.config';
import CrossRecommendationPanel from '../../../components/recommendations/CrossRecommendationPanel';
import {
  Upload as UploadIcon, FileText, CheckCircle, AlertTriangle,
  Loader, X, Download, Activity, Shield, GitBranch, Cpu, Clock,
  RefreshCw, FolderPlus, Package, Layers, ChevronRight, Edit,
  Trash2, ArrowLeft, BarChart2, Save,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Theme constants — teal / cyan palette
// ─────────────────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.06)} }
  @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.04)} }
  @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,35px) scale(1.05)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
`;

const T = {
  bg:    'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 45%, #f0f9ff 75%, #f0fdfa 100%)',
  blobs: [
    { color:'rgba(20,184,166,0.09)',  size:'520px', top:'-80px',    left:'18%',    anim:'floatA 14s ease-in-out infinite'    },
    { color:'rgba(6,182,212,0.07)',   size:'430px', top:'28%',      right:'-60px', anim:'floatB 17s ease-in-out infinite'    },
    { color:'rgba(16,185,129,0.07)',  size:'380px', bottom:'-60px', left:'32%',    anim:'floatC 12s ease-in-out infinite'    },
    { color:'rgba(14,165,233,0.06)',  size:'300px', top:'62%',      left:'-40px',  anim:'floatA 10s ease-in-out infinite 3s' },
  ],
  card:  { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)' },
  cardH: { boxShadow:'0 10px 30px rgba(0,0,0,0.10),0 2px 8px rgba(0,0,0,0.05)', borderColor:'#5eead4' },
  panel: { background:'rgba(255,255,255,0.85)', border:'1px solid #d1fae5', backdropFilter:'blur(12px)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  modal: { background:'#ffffff', border:'1px solid #e2e8f0', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  input: { background:'#f8fafc', border:'1px solid #e2e8f0' },
  accent: 'linear-gradient(135deg,#0d9488,#0891b2)',
  accentShadow: '0 4px 14px rgba(8,145,178,0.35)',
  gradBar: 'linear-gradient(90deg,#14b8a6,#0891b2,#10b981,#14b8a6)',
};

const DarkBg = ({ children }) => (
  <div className="min-h-screen relative overflow-hidden" style={{ background: T.bg }}>
    <style>{KEYFRAMES}</style>
    <div className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage:'radial-gradient(circle, rgba(20,184,166,0.055) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
    {T.blobs.map((b, i) => (
      <div key={i} className="absolute rounded-full pointer-events-none"
        style={{ width:b.size, height:b.size, top:b.top, bottom:b.bottom, left:b.left, right:b.right,
          background:`radial-gradient(circle, ${b.color} 0%, transparent 70%)`, animation:b.anim }} />
    ))}
    <div className="absolute inset-x-0 top-0 h-1 pointer-events-none"
      style={{ background:T.gradBar, backgroundSize:'200% auto', animation:'gradShift 4s linear infinite' }} />
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
const API_PREFIX = `${API_BASE_URL}/pfd-quality`;

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  major:    'bg-orange-100 text-orange-800 border-orange-300',
  minor:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  info:     'bg-teal-100 text-teal-800 border-teal-300',
};

const CATEGORY_LABELS = {
  equipment:   'Equipment Tagging',
  stream:      'Stream Numbers',
  control:     'Control Elements',
  title_block: 'Title Block',
  safety:      'Safety Devices',
  utility:     'Utilities',
  notes:       'Notes & HOLDs',
};

const authHeader = () => {
  const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const PFDQualityChecker = () => {

  // ── Project management state ──────────────────────────────────────────────
  const [projects,          setProjects]         = useState([]);
  const [loadingProjects,   setLoadingProjects]  = useState(true);
  const [selectedProject,   setSelectedProject]  = useState(null);
  const [showCreateModal,   setShowCreateModal]  = useState(false);
  const [newProjectName,    setNewProjectName]   = useState('');
  const [newProjectDesc,    setNewProjectDesc]   = useState('');
  const [creatingProject,   setCreatingProject]  = useState(false);
  const [showEditModal,     setShowEditModal]    = useState(false);
  const [editingProject,    setEditingProject]   = useState(null);
  const [editName,          setEditName]         = useState('');
  const [editDesc,          setEditDesc]         = useState('');
  const [updatingProject,   setUpdatingProject]  = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm]= useState(false);
  const [deletingProject,   setDeletingProject]  = useState(null);
  const [isDeleting,        setIsDeleting]       = useState(false);
  const [message,           setMessage]          = useState({ type: '', text: '' });

  // ── Upload / verification state ───────────────────────────────────────────
  const [file,          setFile]          = useState(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [polling,       setPolling]       = useState(false);
  const [documentId,    setDocumentId]    = useState(null);
  const [docStatus,     setDocStatus]     = useState(null);
  const [results,       setResults]       = useState(null);
  const [error,         setError]         = useState('');
  const [activeDrawing, setActiveDrawing] = useState(null);
  const pollRef = useRef(null);

  // ── Engineer review overrides ─────────────────────────────────────────────
  const [overrides,       setOverrides]       = useState({});
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overridesSaved,  setOverridesSaved]  = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadingPdf,  setDownloadingPdf]  = useState(false);

  // ── History (documents in project) ───────────────────────────────────────
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchProjects(); }, []);

  // ── Project API ───────────────────────────────────────────────────────────
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.get(`${API_PREFIX}/projects/`, { headers: authHeader() });
      setProjects(res.data || []);
    } catch {
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
    } catch {
      // non-fatal
    } finally {
      setLoadingHistory(false);
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
    } catch {
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
    } catch {
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
  };

  const handleBackToProjects = () => {
    clearInterval(pollRef.current);
    setSelectedProject(null);
    setHistory([]);
    resetUpload();
    setResults(null);
    setMessage({ type:'', text:'' });
  };

  // ── Upload / verification API ─────────────────────────────────────────────
  const handleFileChange = (e) => { setFile(e.target.files[0] || null); setError(''); };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(''); }
  }, []);

  const handleUpload = async () => {
    if (!file) { setError('Please select a PFD file first.'); return; }
    setError(''); setUploading(true); setResults(null); setDocStatus(null); setDocumentId(null);

    const fd = new FormData();
    fd.append('file', file);
    if (selectedProject) fd.append('project_id', selectedProject.project_id);

    try {
      const res = await axios.post(`${API_PREFIX}/upload-pfd/`, fd, {
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
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_PREFIX}/status/${docId}/`, { headers: authHeader(), timeout: 15000 });
        const s = res.data.status;
        setDocStatus(s);
        if (s === 'completed') {
          clearInterval(pollRef.current); setPolling(false);
          await fetchResults(docId);
          if (selectedProject) fetchHistory(selectedProject.project_id);
        } else if (s === 'failed') {
          clearInterval(pollRef.current); setPolling(false);
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
    } catch {
      setError('Failed to load results.');
    }
  };

  const resetUpload = () => {
    clearInterval(pollRef.current);
    setFile(null); setDocumentId(null); setDocStatus(null);
    setError(''); setPolling(false); setActiveDrawing(null);
    setOverrides({}); setOverridesSaved(false);
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
    } catch {
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
      a.download = `pfdq_findings_${safeName}.xlsx`;
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
      a.download = `pfdq_report_${safeName}.pdf`;
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
  const getVal = (f, field) => overrides[f.id]?.[field] ?? f[field];
  const pendingCount  = Object.keys(overrides).length;
  const allIssues     = results?.drawings?.flatMap(d => d.issues ?? []) ?? [];
  const totalIssues   = results?.total_issues ?? allIssues.length;
  const criticalCount = allIssues.filter(f => getVal(f, 'severity') === 'critical').length;
  const majorCount    = allIssues.filter(f => getVal(f, 'severity') === 'major').length;

  // ─────────────────────────────────────────────────────────────────────────
  // Flash banner
  // ─────────────────────────────────────────────────────────────────────────
  const FlashBanner = () => message.text ? (
    <div className={`mb-5 p-4 rounded-xl border flex items-center gap-3 ${
      message.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-700'
      : message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-cyan-50 border-cyan-200 text-cyan-700'
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
              <div className="w-1 h-7 rounded-full" style={{ background:'linear-gradient(180deg,#0d9488,#0891b2)' }} />
              <span className="text-teal-600 text-xs font-bold tracking-[0.3em] uppercase">AIFlow · Engineering Suite</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              PFD QC {/* SOFT-CODED: renamed from 'PFD Quality Checker' */}
              <span className="block" style={{ background:'linear-gradient(90deg,#0d9488,#0891b2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Rule Engine
              </span>
            </h1>
            <p className="text-slate-500 max-w-xl text-sm sm:text-base">
              Deterministic 12-rule PFD quality checks — equipment tags, stream numbers, title block, safety devices &amp; more.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon:'🔧', label:'Equipment Tagging',  cls:'bg-teal-50 border-teal-200 text-teal-700'   },
                { icon:'🌊', label:'Stream Numbers',      cls:'bg-cyan-50 border-cyan-200 text-cyan-700'   },
                { icon:'📋', label:'Title Block',         cls:'bg-sky-50 border-sky-200 text-sky-700'      },
                { icon:'🛡️', label:'Safety Devices',     cls:'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { icon:'⚙️', label:'Control Elements',   cls:'bg-teal-50 border-teal-200 text-teal-700'   },
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
              {projects.length > 0
                ? `${projects.length} project${projects.length !== 1 ? 's' : ''} — select one to upload a PFD drawing`
                : 'Create your first project to get started'}
            </p>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-all text-sm text-white hover:-translate-y-px"
              style={{ background: T.accent, boxShadow: T.accentShadow }}>
              <FolderPlus className="w-4 h-4" />New Project
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-2 border-teal-100 rounded-full" />
                <div className="absolute inset-0 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Loading projects…</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={T.card}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-teal-50 border border-teal-100">
                <Package className="w-10 h-10 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Projects Yet</h3>
              <p className="text-slate-500 text-sm mb-6">Create a project to start uploading and checking PFD drawings</p>
              <button onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-white hover:-translate-y-px transition-all"
                style={{ background: T.accent, boxShadow: T.accentShadow }}>
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
                    style={{ background: T.accent }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      <Layers className="w-5 h-5 text-teal-600" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors line-clamp-1">{p.project_name}</h3>
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
            title="Create New Project" subtitle="Set up a folder for your PFD quality drawings"
            iconEl={<div className="w-9 h-9 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center"><FolderPlus className="w-4 h-4 text-teal-600" /></div>}>
            <form onSubmit={handleCreateProject} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Project Name *</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g., ADNOC Trunkline PFD Review"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-400/40 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all" style={T.input} required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief project description…" rows="3"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-400/40 text-slate-900 placeholder-slate-400 text-sm resize-none outline-none transition-all" style={T.input} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={creatingProject}
                  className="flex-1 px-4 py-2.5 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-px"
                  style={{ background: T.accent }}>
                  {creatingProject ? <><Loader className="w-4 h-4 animate-spin" />Creating…</> : <><CheckCircle className="w-4 h-4" />Create Project</>}
                </button>
              </div>
            </form>
          </DarkModal>

          {/* Edit modal */}
          <DarkModal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project"
            iconEl={<div className="w-9 h-9 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center justify-center"><Edit className="w-4 h-4 text-cyan-600" /></div>}>
            <form onSubmit={handleUpdateProject} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Project Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-400/40 text-slate-900 text-sm outline-none transition-all" style={T.input} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows="3"
                  className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-400/40 text-slate-900 text-sm resize-none outline-none transition-all" style={T.input} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={updatingProject}
                  className="flex-1 px-4 py-2.5 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-px"
                  style={{ background: T.accent }}>
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
            style={{ background:'linear-gradient(135deg,#f0fdfa,#ecfeff)', borderColor:'#99f6e4' }}>
            <Layers className="w-4 h-4 text-teal-600" />
            <span className="text-teal-700 font-semibold text-sm truncate max-w-[200px]">{selectedProject.project_name}</span>
          </div>
          <button onClick={() => fetchHistory(selectedProject.project_id)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all text-sm shadow-sm">
            <BarChart2 className="w-4 h-4" />History
          </button>
        </div>

        {/* Sub-header */}
        <div className="mb-6" style={{ animation:'fadeUp 0.5s ease-out 0.1s both' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full" style={{ background: T.accent }} />
            <span className="text-teal-600 text-xs font-bold tracking-widest uppercase">PFD Quality Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">PFD QC</h1> {/* SOFT-CODED: renamed from 'PFD Quality Checker' */}
          <p className="text-slate-500 text-sm mt-1">Upload your PFD PDF — deterministic rule engine performs 12 engineering compliance checks</p>
        </div>

        <FlashBanner />

        {/* Upload card */}
        {!results && (
          <div className="rounded-2xl p-5 sm:p-6 mb-5" style={{ ...T.panel, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">PFD Drawing (PDF) *</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pfdq-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
                dragOver ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-200/60'
                : file    ? 'border-teal-400 bg-teal-50'
                :            'border-slate-300 hover:border-teal-400 bg-white hover:bg-teal-50/40'
              }`}>
              <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                dragOver ? 'bg-cyan-100 animate-bounce' : file ? 'bg-teal-50 border border-teal-200' : 'bg-teal-50 border border-teal-200'
              }`}>
                {file ? <FileText className="w-7 h-7 text-teal-500" /> : <UploadIcon className={`w-7 h-7 ${dragOver ? 'text-cyan-500' : 'text-teal-500'}`} />}
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                {file ? file.name : dragOver ? 'Drop your PFD here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-400">{file ? `${(file.size/1024/1024).toFixed(2)} MB` : 'PDF, PNG, JPG, TIFF · Max 50 MB'}</p>
              <input id="pfdq-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif" className="hidden" onChange={handleFileChange} />
            </div>

            {file && (
              <div className="mt-3 flex items-center gap-2 bg-white border border-teal-200 rounded-xl px-4 py-2.5">
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-800 truncate flex-1">{file.name}</span>
                <button onClick={e => { e.stopPropagation(); setFile(null); }} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
              style={uploading || !file ? undefined : { background: T.accent, boxShadow: T.accentShadow }}>
              {uploading ? <><Loader className="w-4 h-4 animate-spin" />Uploading…</> : <><Cpu className="w-4 h-4" />Run PFD Quality Check</>}
            </button>

            {polling && (
              <div className="mt-5 rounded-2xl p-5 space-y-3 border border-teal-200" style={{ background:'linear-gradient(135deg,#f0fdfa,#ecfeff)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-800">Analysing PFD drawing…</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-teal-100">
                  <div className="h-full rounded-full animate-pulse"
                    style={{ width:'60%', background: T.accent, boxShadow:'0 0 8px rgba(13,148,136,0.5)' }} />
                </div>
                <p className="text-xs text-slate-400 text-center">Checking equipment tags, streams, title block &amp; safety — polling every 3 s</p>
              </div>
            )}
            {docStatus === 'processing' && !polling && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-teal-600 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <Clock className="w-4 h-4" />Still processing — please wait…
              </div>
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
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Drawings</p><p className="font-bold text-2xl text-teal-600">{results.drawings?.length ?? 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Issues</p><p className={`font-bold text-2xl ${totalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalIssues}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Critical</p><p className="font-bold text-2xl text-red-700">{criticalCount}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Major</p><p className="font-bold text-2xl text-orange-600">{majorCount}</p></div>
                <div className="ml-auto flex gap-2 flex-wrap">
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

            <CrossRecommendationPanel
              sourceType="pfd"
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
                      activeDrawing === d.drawing_id ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                    }`}
                    style={activeDrawing === d.drawing_id ? { background: T.accent } : undefined}>
                    {d.drawing_id}<span className={`ml-1.5 text-xs font-semibold ${activeDrawing === d.drawing_id ? 'text-teal-100' : 'text-slate-400'}`}>({d.issue_count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Findings table */}
            {activeDrawingData && (
              <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{activeDrawing}</h2>
                      <p className="text-xs text-slate-500">{activeDrawingData.issues?.length ?? 0} findings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overridesSaved && pendingCount === 0 && (
                      <span className="text-xs text-teal-600 flex items-center gap-1.5">
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
                          style={{ background: T.accent }}>
                          {savingOverrides ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {savingOverrides ? 'Saving…' : 'Save Review'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-24">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-20">Rule</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Issue Observed</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Action Required</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(activeDrawingData.issues ?? []).length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle className="w-8 h-8 text-teal-400" />
                              <p className="text-sm font-semibold text-slate-700">No issues detected</p>
                              <p className="text-xs text-slate-400">This drawing passed all 12 PFD quality rules</p>
                            </div>
                          </td>
                        </tr>
                      ) : (activeDrawingData.issues ?? []).map((f, i) => (
                        <tr key={f.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/30`}>
                          <td className="px-4 py-3 text-xs text-slate-400 font-mono">{f.sl_no}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium capitalize">
                              {CATEGORY_LABELS[f.category] ?? f.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{f.rule_id}</td>
                          <td className="px-4 py-3 text-xs text-slate-700 max-w-[220px]">
                            <p className="line-clamp-3">{f.issue_observed}</p>
                            {f.evidence && <p className="text-slate-400 mt-1 italic text-[11px] line-clamp-2">{f.evidence}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">
                            <p className="line-clamp-3">{f.action_required}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={getVal(f, 'severity')}
                              onChange={e => handleOverrideChange(f.id, 'severity', e.target.value)}
                              className={`text-xs px-2.5 py-1 rounded-full border font-semibold cursor-pointer focus:outline-none ${SEVERITY_STYLES[getVal(f, 'severity')]}`}>
                              <option value="critical">Critical</option>
                              <option value="major">Major</option>
                              <option value="minor">Minor</option>
                              <option value="info">Info</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={getVal(f, 'status')}
                              onChange={e => handleOverrideChange(f.id, 'status', e.target.value)}
                              className="text-xs px-2.5 py-1 rounded-full border font-semibold cursor-pointer focus:outline-none bg-slate-50 text-slate-700 border-slate-200">
                              <option value="open">Open</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent history */}
            {history.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ ...T.card, animation:'fadeUp 0.5s ease-out 0.25s both' }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Uploads</h3>
                  {loadingHistory && <Loader className="w-3.5 h-3.5 text-slate-400 animate-spin ml-auto" />}
                </div>
                <div className="divide-y divide-slate-50">
                  {history.slice(0, 5).map(doc => (
                    <div key={doc.document_id}
                      className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => { setDocumentId(doc.document_id); fetchResults(doc.document_id); }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{doc.file_name}</p>
                          <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          doc.status === 'completed' ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : doc.status === 'failed'  ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>{doc.status}</span>
                        {doc.total_issues !== undefined && (
                          <span className="text-xs text-slate-400">{doc.total_issues} issues</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DarkBg>
  );
};

export default PFDQualityChecker;
