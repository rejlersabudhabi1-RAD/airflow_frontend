import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Upload, FileText, Loader2, Download, RefreshCw, AlertCircle, CheckCircle2, Sparkles, Key, Eye, EyeOff, History, Trash2, Save, BookOpen } from 'lucide-react'

import {
  extractLineTags, listExtractions, getExtraction, deleteExtraction,
  listLegends,
  MODE_OCR, MODE_VISION, VISION_PROVIDERS,
} from '../../../services/pidCheckerV2API'
import LegendSheetsModal from './components/LegendSheetsModal'
import LegendValidationPanel from './components/LegendValidationPanel'

// ═════════════════════════════════════════════════════════════════════
// P&ID Checker V2 — Line-List Extractor
// All strings, colours, and thresholds are soft-coded here.
// ═════════════════════════════════════════════════════════════════════
const PAGE_TITLE = 'P&ID Checker V2'
const PAGE_SUBTITLE = 'Extract composite pipeline line tags from any P&ID or Line-List PDF'
const ACCEPTED_EXTENSIONS = '.pdf'
const MAX_UPLOAD_MB = 25

const THEME_PRIMARY = '#7c3aed'
const THEME_ACCENT = '#ec4899'
const THEME_TEXT = '#0f172a'
const THEME_MUTED = '#64748b'
const THEME_BORDER = '#e2e8f0'
const THEME_BG_SOFT = '#f8fafc'
const THEME_GRADIENT = `linear-gradient(135deg, ${THEME_PRIMARY} 0%, ${THEME_ACCENT} 100%)`

const CSV_HEADER = ['tag', 'size', 'service', 'spec', 'serial', 'service_group']

// BYOK — sessionStorage keys (cleared when the browser tab closes)
const SS_KEY_PROVIDER = 'radai_pidv2_byok_provider'
const SS_KEY_APIKEY   = 'radai_pidv2_byok_apikey'
const SS_KEY_REMEMBER = 'radai_pidv2_byok_remember'


function toCsv(tags) {
  const rows = [CSV_HEADER.join(',')]
  for (const t of tags) {
    rows.push(CSV_HEADER.map((k) => `"${String(t[k] ?? '').replace(/"/g, '""')}"`).join(','))
  }
  return rows.join('\n')
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


export default function PIDCheckerV2() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [result, setResult] = useState(null) // { filename, tags, summary }
  const [error, setError] = useState(null)
  const [forceOcr, setForceOcr] = useState(false)

  // ── Mode + BYOK (Bring Your Own Key) ──────────────────────────────
  const [mode, setMode] = useState(MODE_OCR)
  const [visionProvider, setVisionProvider] = useState(
    () => sessionStorage.getItem(SS_KEY_PROVIDER) || VISION_PROVIDERS[0].id
  )
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(SS_KEY_APIKEY) || '')
  const [showKey, setShowKey] = useState(false)
  const [rememberKey, setRememberKey] = useState(
    () => sessionStorage.getItem(SS_KEY_REMEMBER) === '1'
  )

  // ── History (auto-saved extractions) ──────────────────────────────
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(true)

  // ── Legend Sheets ─────────────────────────────────────────────────
  const LEGEND_SECTION = 'line_list'
  const [legendModalOpen, setLegendModalOpen] = useState(false)
  const [activeLegend, setActiveLegend] = useState(null)
  const [effectiveLegend, setEffectiveLegend] = useState(null) // active OR most-recent

  const refreshActiveLegend = useCallback(async () => {
    try {
      const rows = await listLegends(LEGEND_SECTION)
      const list = rows || []
      const active = list.find(l => l.is_active) || null
      setActiveLegend(active)
      // "Effective" = what the backend will actually compare against.
      // Falls back to the most-recently-updated legend when nothing is active.
      const latest = list.slice().sort((a, b) =>
        String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
      )[0] || null
      setEffectiveLegend(active || latest)
    } catch {
      // silent — auxiliary
    }
  }, [])

  useEffect(() => { refreshActiveLegend() }, [refreshActiveLegend])

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const rows = await listExtractions()
      setHistory(Array.isArray(rows) ? rows : (rows?.results || []))
    } catch (err) {
      // silent — history is auxiliary
      console.warn('[PIDCheckerV2] history fetch failed', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { refreshHistory() }, [refreshHistory])

  const onPickFile = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please choose a PDF file')
      return
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`File exceeds ${MAX_UPLOAD_MB} MB limit`)
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
  }, [])

  const onExtract = useCallback(async () => {
    if (!file) {
      toast.warn('Choose a PDF first')
      return
    }
    if (mode === MODE_VISION && !apiKey.trim()) {
      toast.warn('Paste your AI API key to use Vision mode')
      return
    }
    // Persist / clear BYOK preference (sessionStorage only — cleared on tab close)
    if (mode === MODE_VISION && rememberKey) {
      sessionStorage.setItem(SS_KEY_PROVIDER, visionProvider)
      sessionStorage.setItem(SS_KEY_APIKEY, apiKey)
      sessionStorage.setItem(SS_KEY_REMEMBER, '1')
    } else {
      sessionStorage.removeItem(SS_KEY_APIKEY)
      sessionStorage.removeItem(SS_KEY_REMEMBER)
    }

    setLoading(true)
    setError(null)
    setUploadPct(0)
    try {
      const data = await extractLineTags(file, {
        mode,
        forceOcr,
        provider: visionProvider,
        apiKey: apiKey.trim(),
        onProgress: setUploadPct,
      })
      setResult(data)
      toast.success(`Extracted ${data?.tags?.length ?? 0} line tag(s)`)
      refreshHistory()   // auto-saved on server — refresh the panel
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Extraction failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [file, mode, forceOcr, visionProvider, apiKey, rememberKey, refreshHistory])

  const onReset = useCallback(() => {
    setFile(null)
    setResult(null)
    setError(null)
    setUploadPct(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const onLoadHistory = useCallback(async (extractionId) => {
    try {
      const data = await getExtraction(extractionId)
      // detail endpoint uses `tags` array — shape matches result
      setResult({
        extraction_id: data.extraction_id,
        filename: data.filename,
        mode: data.mode,
        provider: data.provider,
        model: data.model,
        tags: data.tags || [],
        summary: data.summary_json || {},
        created_at: data.created_at,
      })
      setError(null)
      toast.info(`Loaded ${data.tag_count} tag(s) from history`)
    } catch (err) {
      toast.error('Failed to load extraction')
    }
  }, [])

  const onDeleteHistory = useCallback(async (extractionId) => {
    if (!window.confirm('Delete this saved extraction?')) return
    try {
      await deleteExtraction(extractionId)
      // if it was the currently displayed one, clear the results card
      setResult((r) => (r?.extraction_id === extractionId ? null : r))
      refreshHistory()
      toast.success('Extraction deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }, [refreshHistory])

  const onExportCsv = useCallback(() => {
    if (!result?.tags?.length) return
    const base = (result.filename || 'pid').replace(/\.pdf$/i, '')
    downloadBlob(toCsv(result.tags), `${base}_line_tags.csv`, 'text/csv')
  }, [result])

  const onExportJson = useCallback(() => {
    if (!result) return
    const base = (result.filename || 'pid').replace(/\.pdf$/i, '')
    downloadBlob(JSON.stringify(result, null, 2), `${base}_line_tags.json`, 'application/json')
  }, [result])

  const grouped = useMemo(() => {
    const tags = result?.tags || []
    if (!tags.length) return []
    const map = new Map()
    for (const t of tags) {
      const g = t.service_group || t.service || 'Other'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(t)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [result])

  return (
    <div style={{ minHeight: '100vh', background: THEME_BG_SOFT, padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: THEME_TEXT }}>
                {PAGE_TITLE}
              </h1>
              <p style={{ margin: '4px 0 0', color: THEME_MUTED, fontSize: 14 }}>
                {PAGE_SUBTITLE}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLegendModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: THEME_GRADIENT, color: '#fff', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.30)',
              }}
            >
              <BookOpen size={16} /> Legend Sheets
            </button>
          </div>

          {/* Active-legend banner */}
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${activeLegend ? '#a7f3d0' : (effectiveLegend ? '#fcd34d' : THEME_BORDER)}`,
            background: activeLegend ? '#ecfdf5' : (effectiveLegend ? '#fffbeb' : '#fff'),
            fontSize: 12,
          }}>
            <BookOpen size={13} color={activeLegend ? '#047857' : (effectiveLegend ? '#b45309' : THEME_MUTED)} />
            {activeLegend ? (
              <>
                <span style={{ color: '#047857', fontWeight: 600 }}>Active legend:</span>
                <span style={{ color: THEME_TEXT }}>{activeLegend.name}</span>
              </>
            ) : effectiveLegend ? (
              <>
                <span style={{ color: '#b45309', fontWeight: 600 }}>Using (not activated):</span>
                <span style={{ color: THEME_TEXT }}>{effectiveLegend.name}</span>
                <span style={{ color: THEME_MUTED }}>— open Legend Sheets to activate it.</span>
              </>
            ) : (
              <>
                <span style={{ color: THEME_MUTED }}>
                  No legend defined — the built-in default pattern will be used.
                </span>
              </>
            )}
            <button
              onClick={() => setLegendModalOpen(true)}
              style={{
                marginLeft: 'auto', padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${THEME_BORDER}`, background: '#fff',
                color: THEME_TEXT, fontSize: 11, cursor: 'pointer',
              }}
            >
              Manage
            </button>
          </div>

          <div style={{ height: 3, marginTop: 12, borderRadius: 3, background: THEME_GRADIENT }} />
        </div>

        {/* ── Upload card ───────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: `1px solid ${THEME_BORDER}`, borderRadius: 12,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8, border: `1px solid ${THEME_BORDER}`,
                background: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 500, color: THEME_TEXT,
              }}
            >
              <Upload size={16} /> {file ? 'Change file' : 'Choose PDF'}
            </button>
            <input
              ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS}
              onChange={onPickFile} style={{ display: 'none' }}
            />

            {file && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME_TEXT, fontSize: 14 }}>
                <FileText size={16} color={THEME_PRIMARY} />
                <span style={{ fontWeight: 500 }}>{file.name}</span>
                <span style={{ color: THEME_MUTED }}>
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          {/* ── Mode selector ─────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { id: MODE_OCR,    label: 'OCR (offline)',        icon: <FileText size={14} /> },
              { id: MODE_VISION, label: 'AI Vision (BYOK)',     icon: <Sparkles size={14} /> },
            ].map((m) => {
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8,
                    border: `1px solid ${active ? THEME_PRIMARY : THEME_BORDER}`,
                    background: active ? THEME_PRIMARY : '#fff',
                    color: active ? '#fff' : THEME_TEXT,
                    fontSize: 13, fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {m.icon} {m.label}
                </button>
              )
            })}
            {mode === MODE_OCR && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: THEME_MUTED, marginLeft: 'auto' }}>
                <input
                  type="checkbox" checked={forceOcr}
                  onChange={(e) => setForceOcr(e.target.checked)}
                  disabled={loading}
                />
                Force OCR (skip embedded-text fast path)
              </label>
            )}
          </div>

          {/* ── BYOK Vision panel ────────────────────────────────── */}
          {mode === MODE_VISION && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              border: `1px dashed ${THEME_PRIMARY}`, background: '#faf5ff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sparkles size={16} color={THEME_PRIMARY} />
                <span style={{ fontWeight: 600, color: THEME_TEXT, fontSize: 14 }}>
                  Bring Your Own Key — AI Vision Extraction
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: THEME_MUTED,
                  padding: '2px 8px', borderRadius: 999, background: '#fff',
                  border: `1px solid ${THEME_BORDER}`,
                }}>
                  Key is used per-request only — never stored server-side
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 10, alignItems: 'center' }}>
                <select
                  value={visionProvider}
                  onChange={(e) => setVisionProvider(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: '9px 10px', borderRadius: 8, fontSize: 13,
                    border: `1px solid ${THEME_BORDER}`, background: '#fff', color: THEME_TEXT,
                  }}
                >
                  {VISION_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>

                <div style={{ position: 'relative' }}>
                  <Key size={14} style={{
                    position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)',
                    color: THEME_MUTED,
                  }} />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`${VISION_PROVIDERS.find(p => p.id === visionProvider)?.keyPrefix || ''}...`}
                    disabled={loading}
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '9px 40px 9px 32px',
                      borderRadius: 8, fontSize: 13, boxSizing: 'border-box',
                      border: `1px solid ${THEME_BORDER}`, color: THEME_TEXT,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowKey(v => !v)}
                    style={{
                      position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: THEME_MUTED,
                      display: 'flex', alignItems: 'center', padding: 4,
                    }}
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: THEME_MUTED, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox" checked={rememberKey}
                    onChange={(e) => setRememberKey(e.target.checked)}
                    disabled={loading}
                  />
                  Remember for this session
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              type="button" onClick={onExtract} disabled={!file || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: (!file || loading) ? '#cbd5e1' : THEME_GRADIENT,
                color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                boxShadow: (!file || loading) ? 'none' : `0 4px 12px rgba(124,58,237,0.35)`,
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Extracting…</>
                : <>Extract Line Tags</>}
            </button>
            {(file || result) && !loading && (
              <button
                type="button" onClick={onReset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 8, border: `1px solid ${THEME_BORDER}`,
                  background: '#fff', color: THEME_TEXT, cursor: 'pointer', fontSize: 14,
                }}
              >
                <RefreshCw size={14} /> Reset
              </button>
            )}
          </div>

          {loading && uploadPct > 0 && uploadPct < 100 && (
            <div style={{ marginTop: 12, height: 6, background: THEME_BORDER, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadPct}%`, background: THEME_GRADIENT }} />
            </div>
          )}
          {loading && uploadPct >= 100 && (
            <p style={{ marginTop: 12, color: THEME_MUTED, fontSize: 13 }}>
              Upload complete — server is running {mode === MODE_VISION ? 'AI Vision extraction (overview + 4 zoomed tiles per page for maximum recall)' : 'OCR'}.
              This can take {mode === MODE_VISION ? '1–2 minutes' : 'a few minutes'} for a large P&ID.
            </p>
          )}
        </div>

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: 14, borderRadius: 10, border: '1px solid #fecaca',
            background: '#fef2f2', color: '#b91c1c', marginBottom: 20, fontSize: 14,
          }}>
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        {result && (
          <div style={{
            background: '#fff', border: `1px solid ${THEME_BORDER}`, borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <div style={{ fontSize: 16, fontWeight: 600, color: THEME_TEXT }}>
                {result.summary?.total ?? 0} unique line tags
              </div>
              <div style={{ color: THEME_MUTED, fontSize: 13 }}>
                from <span style={{ fontWeight: 500 }}>{result.filename}</span>
              </div>
              {result.mode === MODE_VISION && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999, fontSize: 11,
                  background: '#faf5ff', color: THEME_PRIMARY,
                  border: `1px solid ${THEME_PRIMARY}`,
                }}>
                  <Sparkles size={11} /> {result.model || 'AI Vision'}
                </span>
              )}
              {result.extraction_id && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999, fontSize: 11,
                  background: '#ecfdf5', color: '#047857',
                  border: '1px solid #a7f3d0',
                }}>
                  <Save size={11} /> Saved
                </span>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  type="button" onClick={onExportCsv} disabled={!result.tags?.length}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME_BORDER}`,
                    background: '#fff', color: THEME_TEXT, fontSize: 13, cursor: 'pointer',
                  }}
                ><Download size={14} /> CSV</button>
                <button
                  type="button" onClick={onExportJson}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME_BORDER}`,
                    background: '#fff', color: THEME_TEXT, fontSize: 13, cursor: 'pointer',
                  }}
                ><Download size={14} /> JSON</button>
              </div>
            </div>

            {grouped.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: THEME_MUTED }}>
                No line tags matched. Try enabling <em>Force OCR</em>.
              </div>
            )}

            {grouped.map(([group, tags]) => (
              <div key={group} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  paddingBottom: 6, borderBottom: `2px solid ${THEME_PRIMARY}`,
                }}>
                  <span style={{ fontWeight: 600, color: THEME_TEXT }}>{group}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 12,
                    background: THEME_BG_SOFT, color: THEME_MUTED,
                  }}>{tags.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {tags.map((t) => (
                    <div key={t.tag} style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${THEME_BORDER}`, background: THEME_BG_SOFT,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 13, color: THEME_TEXT,
                    }}>
                      {t.tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Legend Compliance Check ──────────────────────────────── */}
        {result?.tags?.length > 0 && (
          <LegendValidationPanel
            tags={result.tags}
            activeLegend={activeLegend || effectiveLegend}
            provider={visionProvider}
            apiKey={apiKey}
            section={LEGEND_SECTION}
          />
        )}

        {/* ── History ──────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: `1px solid ${THEME_BORDER}`, borderRadius: 12,
          padding: 20, marginTop: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: historyOpen ? 14 : 0 }}>
            <History size={18} color={THEME_PRIMARY} />
            <div style={{ fontSize: 15, fontWeight: 600, color: THEME_TEXT }}>
              Saved extractions
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 12,
              background: THEME_BG_SOFT, color: THEME_MUTED,
            }}>
              {history.length}
            </span>
            <button
              type="button" onClick={refreshHistory} disabled={historyLoading}
              title="Refresh"
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8,
                border: `1px solid ${THEME_BORDER}`, background: '#fff', color: THEME_TEXT,
                fontSize: 12, cursor: historyLoading ? 'wait' : 'pointer',
              }}
            >
              {historyLoading
                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <RefreshCw size={12} />}
              Refresh
            </button>
            <button
              type="button" onClick={() => setHistoryOpen(v => !v)}
              style={{
                padding: '6px 10px', borderRadius: 8,
                border: `1px solid ${THEME_BORDER}`, background: '#fff', color: THEME_TEXT,
                fontSize: 12, cursor: 'pointer',
              }}
            >
              {historyOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {historyOpen && (
            history.length === 0
              ? (
                <div style={{ padding: 12, textAlign: 'center', color: THEME_MUTED, fontSize: 13 }}>
                  No saved extractions yet — run one and it will appear here automatically.
                </div>
              )
              : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {history.map((h) => {
                    const active = result?.extraction_id === h.extraction_id
                    const when = h.created_at ? new Date(h.created_at).toLocaleString() : ''
                    return (
                      <div key={h.extraction_id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10,
                        border: `1px solid ${active ? THEME_PRIMARY : THEME_BORDER}`,
                        background: active ? '#faf5ff' : '#fff',
                      }}>
                        {h.mode === MODE_VISION
                          ? <Sparkles size={14} color={THEME_PRIMARY} />
                          : <FileText size={14} color={THEME_MUTED} />}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 500, color: THEME_TEXT,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {h.filename}
                          </div>
                          <div style={{ fontSize: 11, color: THEME_MUTED, marginTop: 2 }}>
                            {when} · {h.tag_count} tags · {h.mode === MODE_VISION ? (h.model || 'AI Vision') : 'OCR'}
                          </div>
                        </div>
                        <button
                          type="button" onClick={() => onLoadHistory(h.extraction_id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 8,
                            border: `1px solid ${THEME_BORDER}`, background: '#fff', color: THEME_TEXT,
                            fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          <Save size={12} /> Load
                        </button>
                        <button
                          type="button" onClick={() => onDeleteHistory(h.extraction_id)}
                          title="Delete"
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: 6, borderRadius: 8,
                            border: `1px solid ${THEME_BORDER}`, background: '#fff', color: '#b91c1c',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
          )}
        </div>
      </div>

      {/* keyframes for loader spin */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Legend Sheets modal */}
      <LegendSheetsModal
        open={legendModalOpen}
        section={LEGEND_SECTION}
        onClose={() => { setLegendModalOpen(false); refreshActiveLegend() }}
        onActiveChange={(a) => setActiveLegend(a)}
      />
    </div>
  )
}
