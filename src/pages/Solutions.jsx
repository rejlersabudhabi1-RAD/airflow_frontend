import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  SOLUTION_CATEGORIES,
  SOLUTIONS,
  SOLUTION_STATS,
  SOLUTIONS_CTA,
  REDIRECT_AFTER_LOGIN_KEY,
  getCategoriesWithSolutions,
  searchSolutions,
} from '../config/solutions.config'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  XMarkIcon,
  CpuChipIcon,
  BoltIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'

/* ─── Brand palette ─────────────────────────────────────────────────────────── */
const B = {
  navy:   '#2B3A55',
  navyDk: '#1c2e48',
  accent: '#617AAD',
  green:  '#2AA784',
  teal:   '#0093A3',
  amber:  '#f59e0b',
  orange: '#f97316',
}

/* ─── Keyframe CSS (injected once) ──────────────────────────────────────────── */
const CSS = `
@keyframes solFadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes solSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
@keyframes solGlow    { 0%,100%{opacity:.25} 50%{opacity:.65} }
@keyframes solScan    { 0%{top:-2px} 100%{top:102%} }
@keyframes solFlow    { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes solPulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
`
function InjectCSS() {
  useEffect(() => {
    const id = 'radai-solutions-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = CSS
      document.head.appendChild(s)
    }
    return () => document.getElementById(id)?.remove()
  }, [])
  return null
}

/* ─── Animated number counter ───────────────────────────────────────────────── */
function StatNum({ value }) {
  const [display, setDisplay] = useState('0')
  const ref  = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return
      done.current = true
      const num = parseFloat(String(value).replace(/[^0-9.]/g, ''))
      const suf = String(value).replace(/[0-9.]/g, '')
      const t0  = performance.now()
      const tick = now => {
        const p    = Math.min((now - t0) / 1400, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(num * ease) + suf)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return <span ref={ref}>{display || value}</span>
}

/* ─── Badge component ───────────────────────────────────────────────────────── */
const BADGE_STYLES = {
  AI:   { bg: 'rgba(97,122,173,.22)',  border: 'rgba(97,122,173,.55)', color: '#8fa8d0', text: '🤖 AI'       },
  NEW:  { bg: 'rgba(42,167,132,.22)',  border: 'rgba(42,167,132,.55)', color: '#4fcfab', text: '✦ NEW'       },
  FULL: { bg: 'rgba(245,158,11,.22)',  border: 'rgba(245,158,11,.55)', color: '#f9c33a', text: '⚡ FULL'      },
  New:  { bg: 'rgba(42,167,132,.15)',  border: 'rgba(42,167,132,.40)', color: '#3db89a', text: 'New'         },
  Beta: { bg: 'rgba(167,139,250,.22)', border: 'rgba(167,139,250,.5)', color: '#b89ef9', text: '🧪 Beta'      },
}
function Bdg({ badge }) {
  const s = BADGE_STYLES[badge]
  if (!s) return null
  return (
    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.text}
    </span>
  )
}

/* ─── Per-discipline colour palette ────────────────────────────────────────── */
const CAT_COLORS = {
  process:      { from: '#617AAD', to: '#0093A3', glow: 'rgba(97,122,173,.25)'  },
  piping:       { from: '#f97316', to: '#f59e0b', glow: 'rgba(249,115,22,.25)'  },
  instrument:   { from: '#a78bfa', to: '#617AAD', glow: 'rgba(167,139,250,.22)' },
  electrical:   { from: '#f59e0b', to: '#f97316', glow: 'rgba(245,158,11,.22)'  },
  civil:        { from: '#2AA784', to: '#0093A3', glow: 'rgba(42,167,132,.22)'  },
  mechanical:   { from: '#0093A3', to: '#617AAD', glow: 'rgba(0,147,163,.22)'   },
  digitization: { from: '#a78bfa', to: '#f97316', glow: 'rgba(167,139,250,.2)'  },
  documents:    { from: '#2AA784', to: '#14b8a6', glow: 'rgba(42,167,132,.2)'   },
  finance:      { from: '#f59e0b', to: '#2AA784', glow: 'rgba(245,158,11,.18)'  },
  qhse:         { from: '#ef4444', to: '#f97316', glow: 'rgba(239,68,68,.2)'    },
  _default:     { from: '#617AAD', to: '#0093A3', glow: 'rgba(97,122,173,.2)'   },
}
const gc = cat => CAT_COLORS[cat] || CAT_COLORS._default

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════════ */
const Solutions = () => {
  const { isAuthenticated } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expanded, setExpanded]           = useState(null)

  /* post-login redirect — stores destination before sending to login page */
  const handleGetStarted = path => {
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path)
    navigate('/login')
  }

  const categories     = useMemo(() => getCategoriesWithSolutions(), [])
  const engineeringCats = useMemo(() => categories.filter(c => c.group === 'engineering'), [categories])
  const platformCats    = useMemo(() => categories.filter(c => c.group === 'platform'),    [categories])

  const filteredSolutions = useMemo(() => {
    const list = searchQuery ? searchSolutions(searchQuery) : SOLUTIONS
    return selectedCategory === 'all' ? list : list.filter(s => s.category === selectedCategory)
  }, [searchQuery, selectedCategory])

  /* AI spotlight — top 4 AI tools shown above card grid */
  const aiSpotlight = useMemo(() => SOLUTIONS.filter(s => s.isAI).slice(0, 4), [])

  const showSpotlight = !searchQuery && selectedCategory === 'all'

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen text-white"
      style={{ background: `linear-gradient(160deg,${B.navyDk} 0%,${B.navy} 55%,#243550 100%)` }}>
      <InjectCSS />

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden flex items-center"
        style={{ minHeight: 460, paddingTop: 88, paddingBottom: 64 }}>

        {/* blueprint grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(97,122,173,.06) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(97,122,173,.06) 1px,transparent 1px)`,
          backgroundSize: '56px 56px',
        }} />

        {/* ambient glows */}
        <div className="absolute top-0 left-1/4 w-[520px] h-[520px] rounded-full blur-[130px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(97,122,173,.18),transparent)', animation: 'solGlow 5s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(0,147,163,.14),transparent)', animation: 'solGlow 5s ease-in-out infinite 2.5s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">

            {/* left: headline + live counters */}
            <div style={{ animation: 'solFadeUp .8s ease-out' }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
                style={{ background: 'rgba(97,122,173,.12)', border: '1px solid rgba(97,122,173,.3)', color: B.accent }}>
                <SparklesIcon className="w-4 h-4" />
                AI-Powered Engineering Intelligence
              </div>

              <h1 className="font-black leading-tight mb-4"
                style={{ fontSize: 'clamp(2.2rem,5.5vw,4.2rem)' }}>
                <span style={{
                  background: `linear-gradient(135deg,#fff 0%,#d3daea 50%,${B.accent} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  RADAI Platform
                </span>
                <br />
                <span style={{
                  background: `linear-gradient(135deg,${B.accent},${B.teal})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Solutions
                </span>
              </h1>

              <p className="text-base max-w-xl mb-6"
                style={{ color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>
                The complete AI-powered engineering platform for Oil & Gas — from P&ID quality
                checks and electrical datasheets to invoice automation and QHSE compliance,
                all in one place. Every feature you add here updates this page automatically.
              </p>

              {/* live mini-counters */}
              <div className="flex flex-wrap gap-6">
                {[
                  { v: SOLUTIONS.length,                                      l: 'Features'    },
                  { v: Object.keys(_getCatsByGroup('engineering')).length,    l: 'Disciplines' },
                  { v: SOLUTIONS.filter(s => s.isAI).length,                 l: 'AI Tools'    },
                ].map(({ v, l }) => (
                  <div key={l} className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black" style={{
                      background: `linear-gradient(135deg,${B.accent},${B.teal})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{v}+</span>
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.45)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* right: search */}
            <div className="lg:w-80 w-full" style={{ animation: 'solFadeUp .8s .18s ease-out both' }}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'rgba(255,255,255,.35)' }} />
                <input
                  type="text"
                  placeholder="Search tools, disciplines, modules…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedCategory('all') }}
                  className="w-full pl-12 pr-10 py-3.5 text-sm font-medium rounded-xl focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,.07)',
                    border: '1px solid rgba(255,255,255,.12)',
                    color: '#fff',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XMarkIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,.4)' }} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,.4)' }}>
                  {filteredSolutions.length} result{filteredSolutions.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ STATS STRIP ════════════════ */}
      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SOLUTION_STATS.map((st, i) => (
            <div key={st.id} className="text-center"
              style={{
                borderRadius: 16, border: '1px solid rgba(255,255,255,.08)',
                background: 'rgba(255,255,255,.04)', padding: '20px 16px',
                animation: `solFadeUp .6s ${i * .1}s ease-out both`,
              }}>
              <div className="text-2xl mb-1">{st.icon}</div>
              <div className="text-3xl font-black mb-0.5" style={{
                background: `linear-gradient(135deg,${B.accent},${B.teal})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                <StatNum value={st.value} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5"
                style={{ color: 'rgba(255,255,255,.7)' }}>{st.label}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>{st.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ AI SPOTLIGHT ════════════════ */}
      {showSpotlight && (
        <section className="px-6 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <CpuChipIcon className="w-4 h-4" style={{ color: B.accent }} />
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,.5)' }}>
                AI-Powered Highlights
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {aiSpotlight.map((sol, i) => {
                const cs   = gc(sol.category)
                const Icon = sol.icon
                return (
                  <div key={sol.id}
                    className="relative overflow-hidden cursor-pointer group"
                    onClick={() => isAuthenticated ? navigate(sol.link) : handleGetStarted(sol.link)}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${cs.from}33`,
                      background: `linear-gradient(135deg,${cs.from}18,${cs.to}08)`,
                      padding: 16,
                      animation: `solSlideIn .5s ${i * .08}s ease-out both`,
                      transition: 'all .3s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = cs.from + '66'
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = `0 12px 32px ${cs.glow}`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = cs.from + '33'
                      e.currentTarget.style.transform = ''
                      e.currentTarget.style.boxShadow = ''
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: `linear-gradient(135deg,${cs.from},${cs.to})` }}>
                      {Icon && <Icon className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-xs font-black text-white mb-0.5 leading-tight">{sol.title}</p>
                    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,.42)', lineHeight: 1.4 }}>
                      {sol.disciplineLabel ? `${sol.disciplineLabel} Engineering` : sol.shortDescription.slice(0, 55) + '…'}
                    </p>
                    <div className="flex items-center justify-between">
                      <Bdg badge={sol.badge} />
                      <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity"
                        style={{ color: cs.from }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ CATEGORY FILTER TABS ════════════════ */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto space-y-3">

          {/* All tab */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200"
              style={selectedCategory === 'all'
                ? { background: `linear-gradient(135deg,${B.accent},${B.teal})`, color: '#fff', border: '1px solid transparent' }
                : { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)' }}>
              <Squares2X2Icon className="w-4 h-4" />
              All features
              <span className="opacity-60">({SOLUTIONS.length})</span>
            </button>
          </div>

          {/* Engineering discipline tabs */}
          {engineeringCats.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,.28)' }}>Engineering</p>
              <div className="flex flex-wrap gap-2">
                {engineeringCats.map(cat => {
                  const active = selectedCategory === cat.id
                  const cs     = gc(cat.id)
                  const Icon   = cat.icon
                  const count  = SOLUTIONS.filter(s => s.category === cat.id).length
                  return (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200"
                      style={active
                        ? { background: `linear-gradient(135deg,${cs.from},${cs.to})`, color: '#fff', border: '1px solid transparent', boxShadow: `0 4px 16px ${cs.glow}` }
                        : { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)' }}>
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {cat.title}
                      <span className="opacity-55">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Platform category tabs */}
          {platformCats.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,.28)' }}>Platform</p>
              <div className="flex flex-wrap gap-2">
                {platformCats.map(cat => {
                  const active = selectedCategory === cat.id
                  const cs     = gc(cat.id)
                  const Icon   = cat.icon
                  const count  = SOLUTIONS.filter(s => s.category === cat.id).length
                  return (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200"
                      style={active
                        ? { background: `linear-gradient(135deg,${cs.from},${cs.to})`, color: '#fff', border: '1px solid transparent', boxShadow: `0 4px 16px ${cs.glow}` }
                        : { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)' }}>
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {cat.title}
                      <span className="opacity-55">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ SOLUTION CARDS ════════════════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {filteredSolutions.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No tools found</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>
                Try a different search term or category filter
              </p>
            </div>
          ) : (
            <>
              {/* group header when filtering by category */}
              {selectedCategory !== 'all' && (() => {
                const cat = SOLUTION_CATEGORIES[selectedCategory]
                const cs  = gc(selectedCategory)
                const Icon = cat?.icon
                return cat ? (
                  <div className="flex items-center gap-3 mb-6 pb-4"
                    style={{ borderBottom: `1px solid rgba(255,255,255,.07)` }}>
                    {Icon && (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg,${cs.from},${cs.to})` }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white">{cat.title}</h2>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,.4)' }}>
                        {filteredSolutions.length} feature{filteredSolutions.length !== 1 ? 's' : ''}
                        {cat.description ? ` — ${cat.description}` : ''}
                      </p>
                    </div>
                  </div>
                ) : null
              })()}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSolutions.map((sol, i) => {
                  const Icon   = sol.icon
                  const cs     = gc(sol.category)
                  const isOpen = expanded === sol.id
                  const hasDetails = sol.features && sol.features.length > 0

                  return (
                    <div key={sol.id}
                      className="group relative overflow-hidden flex flex-col"
                      style={{
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,.08)',
                        background: 'rgba(255,255,255,.04)',
                        transition: 'all .35s',
                        animation: `solFadeUp .5s ${(i % 9) * .055}s ease-out both`,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = `${cs.from}55`
                        e.currentTarget.style.transform   = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow   = `0 18px 52px ${cs.glow}`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
                        e.currentTarget.style.transform   = ''
                        e.currentTarget.style.boxShadow   = ''
                      }}>

                      {/* scan line animation on hover */}
                      <div className="absolute left-0 right-0 h-px opacity-0 group-hover:opacity-100 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg,transparent,${cs.from},transparent)`,
                          animation: 'solScan 2.2s linear infinite',
                          transition: 'opacity .3s',
                        }} />

                      {/* ── Card header ── */}
                      <div className="relative p-5"
                        style={{
                          background: `linear-gradient(135deg,${cs.from}22,${cs.to}0d)`,
                          borderBottom: '1px solid rgba(255,255,255,.06)',
                        }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: `linear-gradient(135deg,${cs.from},${cs.to})` }}>
                            {Icon && <Icon className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            {sol.badge ? (
                              <Bdg badge={sol.badge} />
                            ) : sol.isPremium ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(97,122,173,.14)', border: '1px solid rgba(97,122,173,.3)', color: 'rgba(97,122,173,.9)' }}>
                                Module
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <h3 className="text-base font-black text-white mb-0.5 leading-snug">{sol.title}</h3>
                        {sol.disciplineLabel && (
                          <p className="text-xs font-semibold mb-1" style={{ color: cs.from }}>
                            {sol.disciplineLabel} Engineering
                          </p>
                        )}
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.5)' }}>
                          {sol.shortDescription}
                        </p>
                      </div>

                      {/* ── Card body ── */}
                      <div className="p-5 flex flex-col flex-1">

                        {/* discipline + tag chips */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(sol.tags || []).map(tag => (
                            <span key={tag} className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                              style={{ background: `${cs.from}18`, border: `1px solid ${cs.from}40`, color: cs.from }}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* expandable feature list */}
                        {isOpen && hasDetails && (
                          <div className="mb-4 space-y-1.5" style={{ animation: 'solFadeUp .22s ease-out' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2"
                              style={{ color: cs.from }}>Capabilities</p>
                            {sol.features.map(f => (
                              <div key={f} className="flex items-start gap-2 text-xs"
                                style={{ color: 'rgba(255,255,255,.55)' }}>
                                <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                                  style={{ color: cs.from }} />
                                {f}
                              </div>
                            ))}
                            {sol.benefits && sol.benefits.length > 0 && (
                              <>
                                <p className="text-xs font-bold uppercase tracking-wider mt-3 mb-1.5"
                                  style={{ color: cs.to }}>Benefits</p>
                                {sol.benefits.map(b => (
                                  <div key={b} className="flex items-start gap-2 text-xs"
                                    style={{ color: 'rgba(255,255,255,.55)' }}>
                                    <RocketLaunchIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                                      style={{ color: cs.to }} />
                                    {b}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}

                        {/* CTA buttons */}
                        <div className="flex gap-2 mt-auto">
                          {hasDetails && (
                            <button onClick={() => setExpanded(isOpen ? null : sol.id)}
                              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200"
                              style={{
                                background: 'rgba(255,255,255,.07)',
                                border: '1px solid rgba(255,255,255,.1)',
                                color: 'rgba(255,255,255,.65)',
                              }}>
                              {isOpen ? '↑ Less' : '↓ Details'}
                            </button>
                          )}

                          {isAuthenticated ? (
                            <Link to={sol.link}
                              className="group/btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg"
                              style={{
                                background: `linear-gradient(135deg,${cs.from},${cs.to})`,
                                color: '#fff',
                                boxShadow: `0 4px 14px ${cs.glow}`,
                              }}>
                              Open
                              <ArrowRightIcon className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Link>
                          ) : (
                            <button onClick={() => handleGetStarted(sol.link)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-200"
                              style={{
                                background: `linear-gradient(135deg,${cs.from},${cs.to})`,
                                color: '#fff',
                              }}>
                              Get Started
                              <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════ CTA BANNER ════════════════ */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg,${B.navyDk},${B.navy},${B.navyDk})` }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px,rgba(97,122,173,.12) 1px,transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: `radial-gradient(circle,${B.accent}28,transparent)`, animation: 'solPulse 3s ease-in-out infinite' }} />
        <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
          style={{ background: `radial-gradient(circle,${B.teal}20,transparent)`, animation: 'solPulse 3s ease-in-out infinite 1.5s' }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(97,122,173,.12)', border: '1px solid rgba(97,122,173,.3)', color: B.accent }}>
            <RocketLaunchIcon className="w-4 h-4" />
            Start Today
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
            Ready to Transform Your<br />
            <span style={{
              background: `linear-gradient(135deg,${B.accent},${B.teal})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Engineering Workflow?
            </span>
          </h2>
          <p className="text-sm mb-8 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,.42)', lineHeight: 1.75 }}>
            Join engineering teams using RADAI to accelerate projects, eliminate manual errors,
            and deliver consistent, compliant results — across every discipline.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={SOLUTIONS_CTA.primary.link}
              className="group flex items-center justify-center gap-2 font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-300"
              style={{
                background: `linear-gradient(135deg,${B.accent},${B.teal})`,
                color: '#fff',
                boxShadow: '0 0 30px rgba(97,122,173,.35)',
              }}>
              {SOLUTIONS_CTA.primary.text}
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to={SOLUTIONS_CTA.secondary.link}
              className="font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-300"
              style={{
                border: '1px solid rgba(97,122,173,.4)',
                color: 'rgba(255,255,255,.72)',
                backdropFilter: 'blur(8px)',
              }}>
              {SOLUTIONS_CTA.secondary.text}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* internal helper — get categories by group without re-importing internals */
function _getCatsByGroup(group) {
  return Object.fromEntries(
    Object.entries(SOLUTION_CATEGORIES).filter(([, v]) => v.group === group)
  )
}

export default Solutions
