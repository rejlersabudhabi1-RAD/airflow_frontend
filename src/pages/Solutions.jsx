import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  SOLUTION_CATEGORIES,
  SOLUTIONS,
  SOLUTION_STATS,
  SOLUTIONS_CTA,
  getCategoriesWithSolutions,
  searchSolutions
} from '../config/solutions.config'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

/* â”€â”€â”€ Rejlers brand palette â”€â”€â”€ */
const B = {
  navy:   '#2B3A55',
  navyDk: '#1c2e48',
  accent: '#617AAD',
  green:  '#2AA784',
  teal:   '#0093A3',
  amber:  '#f59e0b',
  orange: '#f97316',
}

/* â”€â”€â”€ inject keyframes once â”€â”€â”€ */
const CSS = `
@keyframes solFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes solFlow   { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes solPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(97,122,173,0.45)} 50%{box-shadow:0 0 0 8px rgba(97,122,173,0)} }
@keyframes solScan   { 0%{top:-2px} 100%{top:100%} }
`
function InjectCSS() {
  useEffect(() => {
    const id = 'solutions-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS
      document.head.appendChild(s)
    }
    return () => document.getElementById(id)?.remove()
  }, [])
  return null
}

/* â”€â”€â”€ animated stat counter â”€â”€â”€ */
function StatNum({ value }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true
        const num = parseFloat(String(value).replace(/[^0-9.]/g, ''))
        const suf = String(value).replace(/[0-9.]/g, '')
        const t0 = performance.now()
        const tick = (now) => {
          const p = Math.min((now - t0) / 1400, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(num * ease) + suf)
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return <span ref={ref}>{display || value}</span>
}

/* â”€â”€â”€ category accent colours â”€â”€â”€ */
const CAT_STYLE = {
  'ai-automation':      { from: B.accent,  to: B.teal,   glow: 'rgba(97,122,173,0.25)'  },
  'document-management':{ from: B.green,   to: '#14b8a6', glow: 'rgba(42,167,132,0.22)' },
  'engineering':        { from: '#a78bfa', to: B.accent,  glow: 'rgba(167,139,250,0.2)'  },
  'data-analytics':     { from: B.amber,   to: B.orange,  glow: 'rgba(245,158,11,0.22)'  },
}

const Solutions = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expanded, setExpanded]               = useState(null)

  const filteredSolutions = React.useMemo(() => {
    let s = searchQuery ? searchSolutions(searchQuery) : SOLUTIONS
    if (selectedCategory !== 'all') s = s.filter(x => x.category === selectedCategory)
    return s
  }, [searchQuery, selectedCategory])

  const categories = getCategoriesWithSolutions()

  return (
    <div className="min-h-screen text-white" style={{ background:`linear-gradient(160deg,${B.navyDk} 0%,${B.navy} 50%,#243550 100%)` }}>
      <InjectCSS />

      {/* â”€â”€ HERO â”€â”€ */}
      <section className="relative overflow-hidden flex items-center" style={{ minHeight:'420px', paddingTop:'72px', paddingBottom:'72px' }}>
        {/* Blueprint grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:`linear-gradient(rgba(97,122,173,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(97,122,173,0.06) 1px,transparent 1px)`,
          backgroundSize:'56px 56px'
        }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background:'radial-gradient(circle,rgba(97,122,173,0.18),transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background:'radial-gradient(circle,rgba(0,147,163,0.14),transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Title block */}
            <div style={{ animation:'solFadeUp .8s ease-out' }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase" style={{ background:'rgba(97,122,173,0.12)', border:'1px solid rgba(97,122,173,0.3)', color:B.accent }}>
                <SparklesIcon className="w-4 h-4" />
                AI-Powered Engineering Intelligence
              </div>
              <h1 className="font-black leading-none mb-3" style={{ fontSize:'clamp(2.4rem,6vw,4.5rem)' }}>
                <span style={{ background:`linear-gradient(135deg,#fff 0%,#d3daea 50%,${B.accent} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  Intelligent
                </span>{' '}
                <span style={{ background:`linear-gradient(135deg,${B.accent},${B.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  Solutions
                </span>
              </h1>
              <p className="text-base max-w-xl" style={{ color:'rgba(255,255,255,0.5)', lineHeight:'1.7' }}>
                Automate complex engineering workflows, eliminate errors, and accelerate delivery with RADAI's suite of AI-powered tools built for the oil &amp; gas industry.
              </p>
            </div>

            {/* Search */}
            <div className="lg:w-88 w-full" style={{ animation:'solFadeUp .8s .2s ease-out both' }}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color:'rgba(255,255,255,0.35)' }} />
                <input
                  type="text"
                  placeholder="Search solutionsâ€¦"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 text-sm font-medium rounded-xl focus:outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', backdropFilter:'blur(8px)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XMarkIcon className="w-4 h-4" style={{ color:'rgba(255,255,255,0.4)' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS STRIP â”€â”€ */}
      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SOLUTION_STATS.map((st, i) => (
            <div key={st.id} className="group text-center" style={{ borderRadius:'16px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', padding:'20px 16px', animation:`solFadeUp .6s ${i*0.1}s ease-out both` }}>
              <div className="text-2xl mb-1">{st.icon}</div>
              <div className="text-3xl font-black mb-0.5" style={{ background:`linear-gradient(135deg,${B.accent},${B.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                <StatNum value={st.value} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color:'rgba(255,255,255,0.7)' }}>{st.label}</div>
              <div className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>{st.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ CATEGORY FILTER â”€â”€ */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {[{ id:'all', label:'All Solutions', icon: SparklesIcon }, ...Object.values(SOLUTION_CATEGORIES).map(c => ({ id: c.id, label: c.title, icon: c.icon }))].map(cat => {
              const active = selectedCategory === cat.id
              const Icon = cat.icon
              const cs = CAT_STYLE[cat.id]
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300"
                  style={active ? {
                    background: cs ? `linear-gradient(135deg,${cs.from},${cs.to})` : `linear-gradient(135deg,${B.accent},${B.teal})`,
                    color:'#fff', boxShadow: cs ? `0 4px 20px ${cs.glow}` : `0 4px 20px rgba(97,122,173,0.3)`,
                    border:'1px solid transparent'
                  } : {
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.6)'
                  }}>
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ SOLUTION CARDS â”€â”€ */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {filteredSolutions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">ðŸ”</div>
              <h3 className="text-xl font-bold text-white mb-2">No solutions found</h3>
              <p style={{ color:'rgba(255,255,255,0.4)' }}>Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSolutions.map((sol, i) => {
                const Icon = sol.icon
                const cs = CAT_STYLE[sol.category] || { from: B.accent, to: B.teal, glow:'rgba(97,122,173,0.2)' }
                const isOpen = expanded === sol.id
                return (
                  <div key={sol.id} className="group relative overflow-hidden flex flex-col"
                    style={{ borderRadius:'20px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', transition:'all .4s', animation:`solFadeUp .5s ${i*0.06}s ease-out both` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=`${cs.from}55`; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 16px 48px ${cs.glow}` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
                  >
                    {/* Scan line on hover */}
                    <div className="absolute left-0 right-0 h-px opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                      style={{ background:`linear-gradient(90deg,transparent,${cs.from},transparent)`, animation: isOpen ? undefined : 'solScan 2s linear infinite' }} />

                    {/* Header band */}
                    <div className="relative p-5" style={{ background:`linear-gradient(135deg,${cs.from}22,${cs.to}11)`, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background:`linear-gradient(135deg,${cs.from},${cs.to})` }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {sol.isPremium && (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ background:`linear-gradient(135deg,${B.amber},${B.orange})`, color:'#fff' }}>PREMIUM</span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white mb-1">{sol.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color:'rgba(255,255,255,0.55)' }}>{sol.shortDescription}</p>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs leading-relaxed mb-4" style={{ color:'rgba(255,255,255,0.45)' }}>{sol.fullDescription}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {sol.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-0.5 text-xs font-semibold rounded-full" style={{ background:`${cs.from}18`, border:`1px solid ${cs.from}40`, color:cs.from }}>{tag}</span>
                        ))}
                      </div>

                      {/* Expanded details */}
                      {isOpen && (
                        <div className="mb-4 space-y-3" style={{ animation:'solFadeUp .25s ease-out' }}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:cs.from }}>Key Features</p>
                            <ul className="space-y-1">
                              {sol.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-xs" style={{ color:'rgba(255,255,255,0.55)' }}>
                                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:cs.from }} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:cs.to }}>Benefits</p>
                            <ul className="space-y-1">
                              {sol.benefits.map(b => (
                                <li key={b} className="flex items-start gap-2 text-xs" style={{ color:'rgba(255,255,255,0.55)' }}>
                                  <RocketLaunchIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:cs.to }} />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => setExpanded(isOpen ? null : sol.id)}
                          className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200"
                          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)' }}>
                          {isOpen ? 'Less' : 'Details'}
                        </button>
                        {isAuthenticated ? (
                          <Link to={sol.link} className="group/btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-200"
                            style={{ background:`linear-gradient(135deg,${cs.from},${cs.to})`, color:'#fff', boxShadow:`0 4px 14px ${cs.glow}` }}>
                            Try Now
                            <ArrowRightIcon className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        ) : (
                          <Link to="/register" className="flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all duration-200"
                            style={{ background:`linear-gradient(135deg,${cs.from},${cs.to})`, color:'#fff' }}>
                            Get Started
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* â”€â”€ CTA BANNER â”€â”€ */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background:`linear-gradient(135deg,${B.navyDk},${B.navy},${B.navyDk})` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:`radial-gradient(circle at 1px 1px,rgba(97,122,173,0.12) 1px,transparent 0)`, backgroundSize:'32px 32px' }} />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ background:`radial-gradient(circle,${B.accent}28,transparent)` }} />
        <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ background:`radial-gradient(circle,${B.teal}20,transparent)`, animationDelay:'1s' }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase" style={{ background:'rgba(97,122,173,0.12)', border:'1px solid rgba(97,122,173,0.3)', color:B.accent }}>
            <RocketLaunchIcon className="w-4 h-4" />
            Start Today
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
            Ready to Transform Your<br />
            <span style={{ background:`linear-gradient(135deg,${B.accent},${B.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Engineering Workflow?
            </span>
          </h2>
          <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color:'rgba(255,255,255,0.45)', lineHeight:'1.7' }}>
            Join engineering teams using RADAI to accelerate projects, eliminate errors, and deliver exceptional results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={SOLUTIONS_CTA.primary.link} className="group flex items-center justify-center gap-2 font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-300"
              style={{ background:`linear-gradient(135deg,${B.accent},${B.teal})`, color:'#fff', boxShadow:'0 0 30px rgba(97,122,173,0.35)' }}>
              {SOLUTIONS_CTA.primary.text}
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to={SOLUTIONS_CTA.secondary.link} className="font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-300"
              style={{ border:'1px solid rgba(97,122,173,0.4)', color:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)' }}>
              {SOLUTIONS_CTA.secondary.text}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Solutions
