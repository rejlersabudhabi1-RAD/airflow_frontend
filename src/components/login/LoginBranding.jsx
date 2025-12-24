import React from 'react'
import { BRANDING, PAGE_CONTENT, THEME } from '../../config/login.config'

/**
 * LoginBranding Component
 * Left side branding panel with animated background
 */
const LoginBranding = () => {
  const { company, location } = BRANDING
  const { features } = PAGE_CONTENT
  const { gradients, animations } = THEME

  return (
    <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${gradients.branding} p-12 flex-col justify-between relative overflow-hidden`}>
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
        <div className="mb-8">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            {company.name}
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`h-1 w-16 bg-gradient-to-r ${gradients.accentLine} rounded-full`}></div>
            <span className="text-amber-300 text-lg font-semibold">{company.product}</span>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
          {company.tagline.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < company.tagline.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>
        <p className="text-blue-200 text-lg mb-6">
          {company.description}
        </p>
        
        <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <svg className="w-5 h-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-medium">{location.displayText}</span>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3 text-blue-100 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-white">{feature.title}</h4>
              <p className="text-sm text-blue-300">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoginBranding
