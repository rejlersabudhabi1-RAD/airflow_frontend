import React from 'react'
import { BRANDING, PAGE_CONTENT, THEME } from '../../config/login.config'
import { LOGIN_RESPONSIVE, ICON } from '../../config/responsive.config'

/**
 * LoginBranding Component
 * Left side branding panel with animated background
 * Fully responsive for all devices
 */
const LoginBranding = () => {
  const { company, location } = BRANDING
  const { features } = PAGE_CONTENT
  const { gradients, animations } = THEME

  return (
    <div className={`${LOGIN_RESPONSIVE.branding.wrapper} bg-gradient-to-br ${gradients.branding} ${LOGIN_RESPONSIVE.branding.padding} flex-col justify-between relative overflow-hidden`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        {animations.orbs.map((orb, index) => (
          <div
            key={index}
            className={`absolute ${orb.position} ${orb.size} bg-${orb.color} rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}
            style={{ animationDelay: orb.delay }}
          ></div>
        ))}
      </div>
      
      {/* REJLERS Branding */}
      <div className="relative z-10">
        <div className="mb-6 sm:mb-8">
          <h1 className={`${LOGIN_RESPONSIVE.branding.title} font-black text-white mb-2 tracking-tight`}>
            {company.name}
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`h-1 w-12 sm:w-16 bg-gradient-to-r ${gradients.accentLine} rounded-full`}></div>
            <span className="text-amber-300 text-base sm:text-lg font-semibold">{company.product}</span>
          </div>
        </div>
        
        <h2 className={`${LOGIN_RESPONSIVE.branding.subtitle} font-bold text-white mb-3 sm:mb-4 leading-tight`}>
          {company.tagline.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < company.tagline.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>
        <p className="text-blue-200 text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
          {company.description}
        </p>
        
        <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <svg className={`${ICON.sm} text-amber-400 mr-2`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-medium text-xs sm:text-sm">{location.displayText}</span>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 space-y-3 sm:space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-2 sm:space-x-3 text-blue-100 bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10">
            <svg className={`${ICON.md} text-amber-400 flex-shrink-0 mt-1`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base">{feature.title}</h4>
              <p className="text-xs sm:text-sm text-blue-300">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoginBranding
