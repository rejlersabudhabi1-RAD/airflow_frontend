import React from 'react'
import { Link } from 'react-router-dom'
import { REJLERS_COLORS, BRAND_TEXT } from '../config/theme.config'
import { LOGO_CONFIG, getLogoPath, getLogoSize } from '../config/logo.config'
import { FOOTER_CONFIG } from '../config/footer.config'

/**
 * Home Page - REJLERS RADAI Landing Page
 * Official Rejlers Brand Guidelines 2024
 * Responsive, accessible, and dynamic design
 * Core logic preserved - UI updated with brand colors
 */

const Home = () => {
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.neutral.white}, ${REJLERS_COLORS.primary.complement}, ${REJLERS_COLORS.secondary.turbine.complement})` }}>
      {/* Navigation Bar - Light and Airy */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo Section - Clear and Prominent */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="relative group">
                {/* Glow effect on hover */}
                <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur-sm" 
                     style={{ background: `linear-gradient(135deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}></div>
                
                {/* Logo container with shadow */}
                <div className="relative bg-white rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 p-2">
                  <img 
                    src={getLogoPath()}
                    alt={LOGO_CONFIG.primary.alt}
                    className="h-10 lg:h-12 w-auto transition-all group-hover:scale-105"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback with better styling */}
                  <div style={{display: 'none'}} className="flex items-center h-10 lg:h-12 px-3">
                    <img 
                      src={LOGO_CONFIG.fallback.image}
                      alt={LOGO_CONFIG.primary.alt}
                      className="h-full w-auto"
                    />
                  </div>
                </div>
              </div>
              
              {/* RADAI Product Branding */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-[#00a896] to-[#73bdc8] bg-clip-text text-transparent">
                    RADAI
                  </div>
                  <span className="px-2 py-0.5 text-[10px] lg:text-xs font-bold text-white rounded-full" style={{ background: `linear-gradient(135deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}>
                    AI-POWERED
                  </span>
                </div>
                <div className="text-[10px] lg:text-xs font-medium text-gray-600">
                  by Rejlers Engineering Solutions
                </div>
              </div>
            </div>
            
            {/* Navigation Links - Modern Style */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <a href="#features" className="transition-colors font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.neutral.gray600 }} onMouseEnter={(e) => e.target.style.color = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.target.style.color = REJLERS_COLORS.neutral.gray600}>
                Solutions
              </a>
              <a href="#about" className="transition-colors font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.neutral.gray600 }} onMouseEnter={(e) => e.target.style.color = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.target.style.color = REJLERS_COLORS.neutral.gray600}>
                About
              </a>
              <Link 
                to="/login" 
                className="group relative px-5 lg:px-7 py-2 lg:py-2.5 text-white text-sm lg:text-base font-bold rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{ background: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent})` }}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Sign In</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern and Light with AI Effects */}
      <section className="pt-20 lg:pt-24 pb-12 lg:pb-16 relative overflow-hidden">
        {/* Advanced Animated Background with AI Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${REJLERS_COLORS.secondary.green.base} 1px, transparent 1px), linear-gradient(90deg, ${REJLERS_COLORS.secondary.green.base} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            animation: 'grid-flow 20s linear infinite'
          }}></div>
        </div>
        
        {/* AI Particles - Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 lg:w-96 lg:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: REJLERS_COLORS.secondary.turbine.base, animation: 'pulse 3s ease-in-out infinite' }}></div>
        <div className="absolute top-40 right-10 w-72 h-72 lg:w-96 lg:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: REJLERS_COLORS.primary.accent, animationDelay: '1s', animation: 'pulse 3s ease-in-out infinite 1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 lg:w-80 lg:h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ backgroundColor: REJLERS_COLORS.secondary.green.complement, animationDelay: '2s', animation: 'pulse 3s ease-in-out infinite 2s' }}></div>
        
        {/* Floating AI Icons */}
        <div className="absolute top-32 right-32 animate-bounce opacity-20" style={{ animationDuration: '3s' }}>
          <div className="w-16 h-16 rounded-2xl rotate-12" style={{ background: `linear-gradient(135deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}></div>
        </div>
        <div className="absolute bottom-40 left-24 animate-bounce opacity-20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="w-20 h-20 rounded-full" style={{ background: `linear-gradient(135deg, ${REJLERS_COLORS.secondary.passion.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* AI-Powered Badge - Glowing Effect */}
            <div className="mb-4 lg:mb-6 animate-fade-in">
              <div className="inline-flex items-center mb-3 lg:mb-4 px-4 lg:px-6 py-1.5 lg:py-2 rounded-full border backdrop-blur-sm animate-glow" style={{ 
                background: `linear-gradient(to right, ${REJLERS_COLORS.neutral.white}90, ${REJLERS_COLORS.secondary.green.complement}50)`,
                borderColor: REJLERS_COLORS.secondary.green.accent
              }}>
                <div className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: REJLERS_COLORS.secondary.green.accent }}></div>
                <span className="text-xs lg:text-sm font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.accent}, ${REJLERS_COLORS.secondary.turbine.accent})` }}>
                  🤖 Powered by Advanced AI • Engineering Excellence {BRAND_TEXT.founded}
                </span>
                <div className="w-1.5 h-1.5 rounded-full ml-1.5 animate-pulse" style={{ backgroundColor: REJLERS_COLORS.secondary.turbine.accent, animationDelay: '0.5s' }}></div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 lg:mb-5 animate-slide-up">
                <span className="bg-clip-text text-transparent animate-gradient" style={{ 
                  backgroundImage: `linear-gradient(90deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent}, ${REJLERS_COLORS.secondary.turbine.base}, ${REJLERS_COLORS.secondary.green.base})`,
                  backgroundSize: '200% auto',
                  animation: 'gradient 3s linear infinite'
                }}>
                  RADAI
                </span>
                <br />
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(90deg, ${REJLERS_COLORS.primary.base}, ${REJLERS_COLORS.primary.accent}, ${REJLERS_COLORS.secondary.turbine.base})`,
                  backgroundSize: '200% auto'
                }}>
                  AI-Powered Engineering Intelligence
                </span>
              </h1>
              
              {/* Animated Divider */}
              <div className="flex items-center justify-center space-x-1.5 lg:space-x-2 mb-4 lg:mb-6">
                <div className="h-0.5 w-10 rounded-full animate-pulse" style={{ background: `linear-gradient(to right, transparent, ${REJLERS_COLORS.secondary.green.base})` }}></div>
                <div className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: REJLERS_COLORS.secondary.green.accent }}></div>
                <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: REJLERS_COLORS.secondary.green.base }}></div>
                <div className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: REJLERS_COLORS.secondary.turbine.accent, animationDelay: '0.5s' }}></div>
                <div className="h-0.5 w-10 rounded-full animate-pulse" style={{ background: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.base}, transparent)`, animationDelay: '0.3s' }}></div>
              </div>
            </div>

            {/* Value Proposition - AI-Enhanced Typography */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 leading-tight animate-slide-up" style={{ color: REJLERS_COLORS.primary.base, animationDelay: '0.3s' }}>
              <span className="relative">
                Revolutionizing Engineering Workflows
                <span className="absolute -top-3 -right-3 text-xl animate-bounce" style={{ animationDuration: '2s' }}>⚡</span>
              </span>
              <span className="block mt-2 text-lg sm:text-xl md:text-2xl text-gray-600">
                for Oil & Gas Industry by <span className="font-bold bg-clip-text text-transparent" style={{ 
                  backgroundImage: `linear-gradient(90deg, ${REJLERS_COLORS.secondary.green.accent}, ${REJLERS_COLORS.secondary.turbine.base})`
                }}>Rejlers Engineering Solutions</span>
              </span>
            </h2>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 lg:mb-8 leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
              Transform your engineering workflows with <span className="font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}>intelligent P&ID verification</span>, 
              automated compliance checking, and seamless collaboration.
            </p>

            {/* CTA Buttons - AI-Enhanced with Glow Effects */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center items-center mb-8 lg:mb-10 animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <Link 
                to="/register" 
                className="group relative px-6 lg:px-8 py-3 lg:py-3.5 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 w-full sm:w-auto animate-glow"
                style={{ 
                  background: `linear-gradient(90deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent}, ${REJLERS_COLORS.secondary.turbine.base}, ${REJLERS_COLORS.secondary.green.base})`,
                  backgroundSize: '200% auto',
                  animation: 'gradient 3s linear infinite, glow 2s ease-in-out infinite'
                }}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center space-x-1.5 lg:space-x-2">
                  <span className="text-sm lg:text-base">🚀 Get Started Free</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              
              <a 
                href="#features" 
                className="group px-6 lg:px-8 py-3 lg:py-3.5 bg-white font-bold rounded-xl border transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-1.5 lg:space-x-2 w-full sm:w-auto"
                style={{ color: REJLERS_COLORS.primary.base, borderColor: REJLERS_COLORS.secondary.green.base }}
              >
                <span className="text-sm lg:text-base">▶️ Watch Demo</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.turbine.base})` }}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                </div>
              </a>
            </div>

            {/* Trust Badges - Modern Pill Design */}
            <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-3">
              <div className="px-3 lg:px-4 py-2 lg:py-2.5 bg-white rounded-full shadow-sm border border-gray-100 flex items-center space-x-1.5">
                <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-bold text-gray-700 text-xs lg:text-sm">ISO 27001</span>
              </div>
              
              <div className="px-3 lg:px-4 py-2 lg:py-2.5 bg-white rounded-full shadow-sm border border-gray-100 flex items-center space-x-1.5">
                <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-bold text-gray-700 text-xs lg:text-sm">Enterprise Security</span>
              </div>
              
              <div className="px-3 lg:px-4 py-2 lg:py-2.5 bg-white rounded-full shadow-sm border border-gray-100 flex items-center space-x-1.5">
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent})` }}>
                  <span className="text-white font-bold text-[10px] lg:text-xs">80+</span>
                </div>
                <span className="font-bold text-gray-700 text-xs lg:text-sm">Years Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Card Design */}
      <section id="features" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 lg:mb-5">
              Intelligent Engineering Solutions
            </h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive AI-powered tools designed for modern engineering workflows
            </p>
          </div>

          {/* Features Grid - Light and Modern */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-blue-100 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300" style={{ borderColor: REJLERS_COLORS.neutral.gray200 }} onMouseEnter={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.neutral.gray200}>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-4 lg:mb-5 group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.secondary.green.base}, ${REJLERS_COLORS.secondary.green.accent})` }}>
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-3.5">
                  P&ID Verification
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4">
                  AI-powered compliance checking against ADNOC, Shell DEP, and international standards.
                </p>
                <div className="flex items-center font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.secondary.green.base }}>
                  <span>Learn more</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300" style={{ borderColor: REJLERS_COLORS.neutral.gray200 }} onMouseEnter={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.neutral.gray200}>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-4 lg:mb-5 group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.primary.accent}, ${REJLERS_COLORS.secondary.turbine.accent})` }}>
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-3.5">
                  PFD to P&ID Conversion
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4">
                  Intelligent conversion with automated symbol recognition and smart placement.
                </p>
                <div className="flex items-center font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.secondary.green.base }}>
                  <span>Learn more</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300" style={{ borderColor: REJLERS_COLORS.neutral.gray200 }} onMouseEnter={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.neutral.gray200}>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-4 lg:mb-5 group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.secondary.passion.base}, ${REJLERS_COLORS.secondary.passion.accent})` }}>
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-3.5">
                  Comment Resolution
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4">
                  Extract and manage comments with real-time collaboration and tracking.
                </p>
                <div className="flex items-center font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.secondary.green.base }}>
                  <span>Learn more</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-teal-100 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300" style={{ borderColor: REJLERS_COLORS.neutral.gray200 }} onMouseEnter={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.secondary.green.base} onMouseLeave={(e) => e.currentTarget.style.borderColor = REJLERS_COLORS.neutral.gray200}>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-4 lg:mb-5 group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(to bottom right, ${REJLERS_COLORS.secondary.turbine.base}, ${REJLERS_COLORS.secondary.turbine.accent})` }}>
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-3.5">
                  Project Control
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4">
                  Complete lifecycle management with task tracking and team collaboration.
                </p>
                <div className="flex items-center font-semibold text-sm lg:text-base" style={{ color: REJLERS_COLORS.secondary.green.base }}>
                  <span>Learn more</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Modern Gradient Cards */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00a896] to-teal-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 lg:p-6 text-center">
                <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#00a896] to-teal-600 bg-clip-text text-transparent mb-1.5">
                  99.8%
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-700">Accuracy Rate</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 lg:p-6 text-center">
                <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1.5">
                  10x
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-700">Faster Reviews</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 lg:p-6 text-center">
                <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1.5">
                  24/7
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-700">Availability</div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-5 lg:p-6 text-center">
                <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-1.5">
                  100%
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-700">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Gradient */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-[#00a896] via-teal-500 to-blue-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-sm md:text-base text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
            Join industry leaders in the UAE who trust Rejlers for engineering excellence
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-8 py-3.5 bg-white text-[#00a896] text-base font-bold rounded-full hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <span>Start Your Free Trial Today</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer - Clean and Light */}
      <footer className={`${FOOTER_CONFIG.styling.bgColor} ${FOOTER_CONFIG.styling.textColor} py-10 lg:py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-[#00a896]">{FOOTER_CONFIG.contact.title}</h3>
              <div className="space-y-2 text-gray-300 text-sm leading-relaxed">
                <p className="font-semibold text-white">{FOOTER_CONFIG.contact.company}</p>
                <p>{FOOTER_CONFIG.contact.address.building}</p>
                <p>{FOOTER_CONFIG.contact.address.street}</p>
                <p>{FOOTER_CONFIG.contact.address.city}</p>
                <p className="mt-4">
                  <a 
                    href={`tel:${FOOTER_CONFIG.contact.phone.link}`}
                    className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors flex items-center space-x-2`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{FOOTER_CONFIG.contact.phone.display}</span>
                  </a>
                </p>
                <p>
                  <a 
                    href={FOOTER_CONFIG.contact.email.link}
                    className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors flex items-center space-x-2`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>{FOOTER_CONFIG.contact.email.display}</span>
                  </a>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[#00a896]">{FOOTER_CONFIG.quickLinks.title}</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                {FOOTER_CONFIG.quickLinks.links.map((link, index) => (
                  <li key={index}>
                    {link.external ? (
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors`}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link 
                        to={link.url}
                        className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors`}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Our Services - Oil & Gas Industry */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[#00a896]">{FOOTER_CONFIG.services.title}</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                {FOOTER_CONFIG.services.items.map((service, index) => (
                  <li key={index}>
                    <Link 
                      to={service.url}
                      className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors block`}
                      title={service.description}
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Security & Compliance */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[#00a896]">{FOOTER_CONFIG.compliance.title}</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                {FOOTER_CONFIG.compliance.links.map((link, index) => (
                  <li key={index}>
                    {link.external ? (
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors flex items-center space-x-2`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </a>
                    ) : (
                      <Link 
                        to={link.url}
                        className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors flex items-center space-x-2`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`border-t ${FOOTER_CONFIG.styling.borderColor} pt-6 text-center text-gray-400 text-xs lg:text-sm`}>
            <p className="mb-3">{FOOTER_CONFIG.bottomBar.copyright}</p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {FOOTER_CONFIG.bottomBar.links.map((link, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>•</span>}
                  {link.external ? (
                    <a 
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      to={link.url}
                      className={`${FOOTER_CONFIG.styling.hoverColor} transition-colors`}
                    >
                      {link.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home

