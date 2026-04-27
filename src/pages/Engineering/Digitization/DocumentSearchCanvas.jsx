/**
 * DocumentSearchCanvas
 * --------------------------------------------------------------------------
 * Search across every bulk-batch metadata record AND visualise where the
 * matched value lives inside the source PDF — analogous to the P&ID QC
 * overlay markers, but driven from the stored PDF on demand (no schema
 * change, no precomputed coordinates).
 *
 * Soft-coded surface in `SEARCH_CFG`:
 *   • endpoints  : 3 backend routes (search / locate / page-image)
 *   • debounceMs : input debounce
 *   • overlay    : marker box appearance
 *   • columns    : result-row columns
 *
 * Pure additive component — no external feature is touched.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import { getApiBaseUrl } from '../../../config/environment.config';

// ---------------------------------------------------------------------------
// Soft-coded configuration
// ---------------------------------------------------------------------------
const SEARCH_CFG = {
  endpoints: {
    search:    '/non-teff/search/',
    locate:    (batchId, itemId) => `/non-teff/batch/${batchId}/items/${itemId}/locate/`,
    pageImage: (batchId, itemId, page) => `/non-teff/batch/${batchId}/items/${itemId}/page/${page}/image/`,
  },
  // Debounce keystrokes before firing /search.
  debounceMs: 350,
  // Minimum chars before search is triggered.
  minQueryLen: 2,
  // Max results displayed in the left list.
  maxResults: 200,
  // Overlay rectangle styling (mirrors PIDVerification DUP_HIGHLIGHT_*).
  overlay: {
    borderColor: '#dc2626',
    fillColor:   'rgba(220, 38, 38, 0.18)',
    borderWidth: 2,
    pulseMs:     1800,
    activeBorder:'#7c3aed',
    activeFill:  'rgba(124, 58, 237, 0.22)',
  },
  columns: [
    { key: 'file_name',     label: 'Document',      flex: 1.4 },
    { key: 'matched_field', label: 'Field',         flex: 0.8 },
    { key: 'matched_value', label: 'Match',         flex: 1.2 },
    { key: 'status',        label: 'Status',        flex: 0.6 },
  ],
  statusColors: {
    ready:      { bg: 'rgba(5,150,105,0.12)',  fg: '#047857' },
    extracting: { bg: 'rgba(8,145,178,0.12)',  fg: '#0e7490' },
    failed:     { bg: 'rgba(220,38,38,0.10)',  fg: '#b91c1c' },
    uploaded:   { bg: 'rgba(124,58,237,0.10)', fg: '#6d28d9' },
    pending:    { bg: 'rgba(107,114,128,0.10)',fg: '#374151' },
  },
};

// Pulse keyframe is local to this component to avoid global CSS pollution.
const SEARCH_KEYFRAMES = `
  @keyframes dscPulse {
    0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.55); }
    70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
    100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
  }
  @keyframes dscSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------
const StatusPill = ({ status }) => {
  const palette = SEARCH_CFG.statusColors[status] || SEARCH_CFG.statusColors.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: palette.bg, color: palette.fg,
      textTransform: 'uppercase', letterSpacing: 0.4,
    }}>{status}</span>
  );
};

const Spinner = () => (
  <ArrowPathIcon style={{ width: 16, height: 16, animation: 'dscSpin 1s linear infinite' }} />
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DocumentSearchCanvas = ({ preselect = null } = {}) => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');

  const [selected, setSelected] = useState(null);     // active result row
  const [locateData, setLocateData] = useState(null); // /locate/ payload
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageImageUrl, setPageImageUrl] = useState(null);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // ── Auto-select when parent passes a preselect target (row-click bridge) ─
  useEffect(() => {
    if (!preselect || !preselect.batch_id || !preselect.item_id) return;
    // Build a synthetic "search result" so the canvas pipeline triggers.
    const synthetic = {
      kind: 'batch',
      batch_id: preselect.batch_id,
      item_id:  preselect.item_id,
      file_name: preselect.file_name || '',
      matched_field: 'tag',
      matched_value: preselect.query || preselect.file_name || '',
      status: 'ready',
      batch_name: '',
      fields: preselect.fields || {},
    };
    setSelected(synthetic);
    if (preselect.query) setQuery(preselect.query);
  }, [preselect?.batch_id, preselect?.item_id, preselect?.query]);  // eslint-disable-line

  // ── Debounce input ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), SEARCH_CFG.debounceMs);
    return () => clearTimeout(t);
  }, [query]);

  // ── Run search whenever debounced query changes ─────────────────────────
  useEffect(() => {
    if (debounced.length < SEARCH_CFG.minQueryLen) {
      setResults([]); setSearchError(null); return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    apiClient
      .get(SEARCH_CFG.endpoints.search, {
        params: { q: debounced, batch_id: batchFilter || undefined },
      })
      .then((res) => {
        if (cancelled) return;
        setResults(res.data?.results || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setSearchError(e?.response?.data?.error || e.message || 'Search failed.');
        setResults([]);
      })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debounced, batchFilter]);

  // ── Group matches by page for nav ───────────────────────────────────────
  const matchesByPage = useMemo(() => {
    const map = new Map();
    (locateData?.matches || []).forEach((m, i) => {
      if (!map.has(m.page)) map.set(m.page, []);
      map.get(m.page).push({ ...m, _idx: i });
    });
    return map;
  }, [locateData]);

  const pagesWithHits = useMemo(
    () => Array.from(matchesByPage.keys()).sort((a, b) => a - b),
    [matchesByPage],
  );

  // ── Run /locate/ when a row is selected ─────────────────────────────────
  useEffect(() => {
    if (!selected || selected.kind !== 'batch') {
      setLocateData(null); setPageImageUrl(null); return;
    }
    let cancelled = false;
    setLocating(true);
    setLocateError(null);
    setLocateData(null);
    setPageImageUrl(null);
    setActiveMatchIdx(0);
    apiClient
      .get(SEARCH_CFG.endpoints.locate(selected.batch_id, selected.item_id), {
        params: { q: selected.matched_value || debounced },
      })
      .then((res) => {
        if (cancelled) return;
        setLocateData(res.data || { matches: [], page_count: 0 });
        const firstPage = (res.data?.matches?.[0]?.page) || 1;
        setActivePage(firstPage);
      })
      .catch((e) => {
        if (cancelled) return;
        setLocateError(e?.response?.data?.error || e.message || 'Locate failed.');
      })
      .finally(() => { if (!cancelled) setLocating(false); });
    return () => { cancelled = true; };
  }, [selected, debounced]);

  // ── Build page image URL (auth header lives on apiClient → use baseUrl) ─
  useEffect(() => {
    if (!selected || selected.kind !== 'batch' || !activePage) {
      setPageImageUrl(null); return;
    }
    let cancelled = false;
    // Fetch the binary so axios injects auth headers, then create blob URL.
    apiClient
      .get(SEARCH_CFG.endpoints.pageImage(selected.batch_id, selected.item_id, activePage), {
        responseType: 'blob',
      })
      .then((res) => {
        if (cancelled) return;
        const url = URL.createObjectURL(res.data);
        setPageImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPageImageUrl(null);
      });
    return () => { cancelled = true; };
  }, [selected, activePage]);

  // Cleanup blob URLs on unmount.
  useEffect(() => () => { if (pageImageUrl) URL.revokeObjectURL(pageImageUrl); }, []); // eslint-disable-line

  // ── Image natural size for overlay scaling (we render scaled-to-fit) ───
  const handleImgLoad = useCallback(() => {
    if (imgRef.current) {
      setImgSize({
        w: imgRef.current.clientWidth,
        h: imgRef.current.clientHeight,
      });
    }
  }, []);

  const matchesOnActivePage = matchesByPage.get(activePage) || [];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      gap: 16,
      minHeight: 600,
      background: 'rgba(255,255,255,0.78)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(5,150,105,0.18)',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0 10px 40px -16px rgba(15,23,42,0.18)',
    }}>
      <style>{SEARCH_KEYFRAMES}</style>

      {/* ── Left pane: search + result list ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 600 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <MagnifyingGlassIcon style={{
            width: 18, height: 18,
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#6b7280',
          }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tag, doc number, equipment, line…"
            style={{
              width: '100%', padding: '10px 36px 10px 38px',
              borderRadius: 10,
              border: '1px solid rgba(5,150,105,0.25)',
              fontSize: 14, outline: 'none',
              background: 'white',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: '#6b7280', padding: 4,
              }}
              title="Clear"
            >
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: '#374151', marginBottom: 10,
        }}>
          {searching ? <><Spinner /><span>Searching…</span></>
            : <span>{results.length} match{results.length === 1 ? '' : 'es'}</span>}
          {searchError && <span style={{ color: '#b91c1c' }}>· {searchError}</span>}
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10,
          background: 'white',
        }}>
          {results.length === 0 && !searching && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              {debounced.length < SEARCH_CFG.minQueryLen
                ? 'Type at least 2 characters to search'
                : 'No documents matched'}
            </div>
          )}
          {results.map((r, i) => {
            const id = r.kind === 'batch' ? `${r.batch_id}:${r.item_id}` : `${r.kind}:${r.job_id}:${r.row_index}`;
            const isSel = selected && (selected.kind === 'batch'
              ? selected.batch_id === r.batch_id && selected.item_id === r.item_id
              : selected.job_id === r.job_id && selected.row_index === r.row_index);
            return (
              <button
                key={id + i}
                onClick={() => setSelected(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  background: isSel ? 'rgba(124,58,237,0.08)' : 'transparent',
                  cursor: r.kind === 'batch' ? 'pointer' : 'not-allowed',
                  opacity: r.kind === 'batch' ? 1 : 0.55,
                }}
                disabled={r.kind !== 'batch'}
                title={r.kind === 'batch' ? 'Click to locate on canvas' : 'Single-file jobs are not visualisable yet'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <DocumentTextIcon style={{ width: 14, height: 14, color: '#0891b2' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a',
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.file_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#374151', marginBottom: 4 }}>
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>{r.matched_field}</span>
                  <span style={{ color: '#0f172a' }}>{r.matched_value}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{r.batch_name}</span>
                  <StatusPill status={r.status} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right pane: canvas ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 600 }}>
        {!selected && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(5,150,105,0.04), rgba(124,58,237,0.04))',
            border: '1px dashed rgba(5,150,105,0.25)', borderRadius: 12,
            color: '#6b7280', fontSize: 14, padding: 32, textAlign: 'center',
          }}>
            <div>
              <MapPinIcon style={{ width: 36, height: 36, color: '#0891b2', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Search and select a document</div>
              <div style={{ marginTop: 4 }}>The canvas will highlight the location of the matched value inside the source PDF.</div>
            </div>
          </div>
        )}

        {selected && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selected.file_name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Locating <span style={{ color: '#7c3aed', fontWeight: 600 }}>"{selected.matched_value}"</span>
                  {locateData?.page_count ? ` · ${locateData.matches?.length || 0} hit(s) across ${pagesWithHits.length} page(s)` : ''}
                </div>
              </div>

              {/* Page nav */}
              {pagesWithHits.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => {
                      const i = pagesWithHits.indexOf(activePage);
                      if (i > 0) setActivePage(pagesWithHits[i - 1]);
                    }}
                    disabled={pagesWithHits.indexOf(activePage) <= 0}
                    style={navBtn}
                    title="Previous page"
                  ><ChevronLeftIcon style={{ width: 16, height: 16 }} /></button>
                  <span style={{ fontSize: 12, color: '#374151', padding: '0 8px', fontWeight: 600 }}>
                    Pg {activePage} / {locateData?.page_count || '?'}
                  </span>
                  <button
                    onClick={() => {
                      const i = pagesWithHits.indexOf(activePage);
                      if (i >= 0 && i < pagesWithHits.length - 1) setActivePage(pagesWithHits[i + 1]);
                    }}
                    disabled={pagesWithHits.indexOf(activePage) >= pagesWithHits.length - 1}
                    style={navBtn}
                    title="Next page"
                  ><ChevronRightIcon style={{ width: 16, height: 16 }} /></button>
                </div>
              )}
            </div>

            {/* Canvas area */}
            <div style={{
              flex: 1, position: 'relative', overflow: 'auto',
              background: '#f1f5f9', borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.06)',
              minHeight: 500,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: 16,
            }}>
              {locating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 13 }}>
                  <Spinner /> Locating in PDF…
                </div>
              )}
              {locateError && !locating && (
                <div style={{ color: '#b91c1c', fontSize: 13, padding: 24 }}>{locateError}</div>
              )}
              {!locating && !locateError && locateData && (locateData.matches?.length === 0) && (
                <div style={{ color: '#6b7280', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  No visual location found in this PDF.<br />
                  <span style={{ fontSize: 11 }}>The value may be in a non-text layer (image-only PDF / CAD).</span>
                </div>
              )}

              {!locating && pageImageUrl && (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    ref={imgRef}
                    src={pageImageUrl}
                    alt={`Page ${activePage}`}
                    onLoad={handleImgLoad}
                    style={{ display: 'block', maxWidth: '100%', height: 'auto', userSelect: 'none' }}
                  />
                  {/* Overlay rectangles for all matches on the active page */}
                  {imgSize.w > 0 && matchesOnActivePage.map((m, i) => {
                    const isActive = m._idx === activeMatchIdx;
                    return (
                      <div
                        key={i}
                        onClick={() => setActiveMatchIdx(m._idx)}
                        style={{
                          position: 'absolute',
                          left:   `${m.rect_pct.x * 100}%`,
                          top:    `${m.rect_pct.y * 100}%`,
                          width:  `${m.rect_pct.w * 100}%`,
                          height: `${m.rect_pct.h * 100}%`,
                          border: `${SEARCH_CFG.overlay.borderWidth}px solid ${
                            isActive ? SEARCH_CFG.overlay.activeBorder : SEARCH_CFG.overlay.borderColor
                          }`,
                          background: isActive ? SEARCH_CFG.overlay.activeFill : SEARCH_CFG.overlay.fillColor,
                          borderRadius: 3,
                          cursor: 'pointer',
                          animation: isActive ? `dscPulse ${SEARCH_CFG.overlay.pulseMs}ms ease-out infinite` : 'none',
                          boxSizing: 'border-box',
                        }}
                        title={`Match #${m._idx + 1} (page ${m.page})`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const navBtn = {
  width: 28, height: 28,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid rgba(5,150,105,0.25)',
  borderRadius: 8,
  background: 'white',
  cursor: 'pointer',
};

export default DocumentSearchCanvas;
