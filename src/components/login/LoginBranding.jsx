import React from 'react'
import { BRANDING, PAGE_CONTENT, THEME, LOGIN_RESPONSIVE, ICON } from '../../config/login.config'

/**
 * LoginBranding Component
 * Left side branding panel - Oil & Gas Engineering Industry Design
 * Advanced Industrial Theme with Technical Graphics
 */
const LoginBranding = () => {
  const { company, location } = BRANDING
  const { features } = PAGE_CONTENT
  const { colors, gradients, animations } = THEME

  return (
    <div className={`${LOGIN_RESPONSIVE.branding.wrapper} ${LOGIN_RESPONSIVE.branding.padding} flex-col relative overflow-hidden`} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
      {/* Industrial Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Technical Circuit Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#f59e0b"/>
              <circle cx="150" cy="50" r="2" fill="#06b6d4"/>
              <circle cx="100" cy="150" r="2" fill="#f59e0b"/>
              <line x1="50" y1="50" x2="150" y2="50" stroke="#94a3b8" strokeWidth="0.5"/>
              <line x1="150" y1="50" x2="100" y2="150" stroke="#94a3b8" strokeWidth="0.5"/>
              <line x1="100" y1="150" x2="50" y2="50" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      {/* Animated Gradient Orbs - Oil & Gas Theme */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse" 
             style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse" 
             style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDuration: '6s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-10 blur-3xl animate-pulse" 
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDuration: '5s' }}></div>
      </div>
      
      {/* Main Branding Section */}
      <div className="relative z-10 space-y-6 mb-8">
        {/* Industrial Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30">
          <svg className="w-5 h-5 mr-2 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
          </svg>
          <span className="text-amber-300 font-bold text-sm tracking-wide">Oil & Gas Engineering</span>
        </div>

        {/* Company Header with Technical Accent */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-16 bg-gradient-to-b from-amber-400 via-orange-500 to-cyan-400 rounded-full"></div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {company.name}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <div className="h-px w-12 bg-gradient-to-r from-cyan-400 to-transparent"></div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {company.product}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Technical Separator with Animation */}
        <div className="flex items-center space-x-2 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        {/* Vision Section - Industrial Focus */}
        <div className="space-y-4 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug flex items-center">
            <svg className="w-8 h-8 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {company.tagline}
          </h2>
          
          <p className="text-base leading-relaxed text-white/95 font-light">
            {company.description}
          </p>

          {/* Technical Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-black text-cyan-400">99.9%</div>
              <div className="text-xs text-white/70 font-medium">Uptime</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-2xl font-black text-amber-400">24/7</div>
              <div className="text-xs text-white/70 font-medium">Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-orange-400">AI</div>
              <div className="text-xs text-white/70 font-medium">Powered</div>
            </div>
          </div>
        </div>
        
        {/* Location Badge - Enhanced */}
        <div className="inline-flex items-center px-5 py-3 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#06b6d4' }}>
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="text-white font-bold text-sm">{location.displayText}</div>
            <div className="text-cyan-300 text-xs font-medium">Engineering Excellence</div>
          </div>
        </div>
      </div>

      {/* Feature List - Industrial Cards */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-amber-400 to-transparent"></div>
          <h3 className="text-white font-bold text-sm tracking-wider uppercase">Key Capabilities</h3>
        </div>
        
        {features.map((feature, index) => (
          <div key={index} className="group relative bg-gradient-to-r from-slate-800/60 to-slate-700/40 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:translate-x-1">
            {/* Technical Corner Accent */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0,0 L100,0 L100,100 Z" fill="url(#cornerGradient)" />
                <defs>
                  <linearGradient id="cornerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-base mb-1 flex items-center">
                  {feature.title}
                  <svg className="w-4 h-4 ml-2 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </h4>
                <p className="text-sm leading-relaxed text-white/80">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Technical Footer */}
      <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div>Secure Connection</div>
        </div>
      </div>
    </div>
  )
}

export default LoginBranding
