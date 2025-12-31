import React from 'react'
import { BRANDING, PAGE_CONTENT, THEME, LOGIN_RESPONSIVE, ICON } from '../../config/login.config'

/**
 * LoginBranding Component
 * Left side branding panel - Official Rejlers Brand Guidelines 2024
 * Professional & Corporate Design
 */
const LoginBranding = () => {
  const { company, location } = BRANDING
  const { features } = PAGE_CONTENT
  const { colors, gradients, animations } = THEME

  return (
    <div className={`${LOGIN_RESPONSIVE.branding.wrapper} ${LOGIN_RESPONSIVE.branding.padding} flex-col relative overflow-hidden`} style={{ background: gradients.branding }}>
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: colors.secondaryAccent }}></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: colors.primaryAccent }}></div>
      </div>
      
      {/* Main Branding Section */}
      <div className="relative z-10 space-y-5 mb-6">
        {/* Company Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-wide">
            {company.name}
          </h1>
          <div className="flex items-center space-x-3">
            <div className="h-0.5 w-12 rounded" style={{ backgroundColor: colors.secondaryAccent }}></div>
            <span className="text-lg sm:text-xl font-bold" style={{ color: colors.secondaryAccent }}>
              {company.product}
            </span>
          </div>
        </div>
        
        {/* Vision Section */}
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            {company.tagline}
          </h2>
          
          <p className="text-sm sm:text-base leading-relaxed text-white/90">
            {company.description}
          </p>
        </div>
        
        {/* Location Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.secondaryAccent }}>
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-semibold text-sm">{location.displayText}</span>
        </div>
      </div>

      {/* Feature List */}
      <div className="relative z-10 space-y-2.5">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-2.5 bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.secondaryAccent }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
              <p className="text-xs leading-relaxed text-white/80">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoginBranding
