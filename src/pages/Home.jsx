import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Home Page - REJLERS RADAI Landing Page
 * Premium landing page for P&ID Verification Platform
 * Fully responsive for all devices
 */

const Home = () => {
  return (
    <div className="h-screen sm:min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-20 sm:top-40 -left-20 sm:-left-40 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 left-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-2 sm:px-6 py-1 sm:py-4 md:py-6">
        {/* Hero Headline */}
        <div className="max-w-5xl mx-auto text-center mb-1 sm:mb-5">
          {/* Rejlers Branding */}
          <div className="mb-1 sm:mb-4">
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-white mb-0.5">REJLERS</h1>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-0.5">
              <div className="h-0.5 w-6 sm:w-12 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <span className="text-amber-300 text-[10px] sm:text-sm font-bold tracking-wider">ABU DHABI</span>
              <div className="h-0.5 w-6 sm:w-12 bg-gradient-to-r from-orange-500 to-amber-400"></div>
            </div>
            <p className="text-blue-200 text-[9px] sm:text-sm font-medium hidden sm:block">Engineering & Design Excellence Since 1942</p>
          </div>

          <h2 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-3 leading-tight px-1">
            Complete Engineering Solution
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              for Oil & Gas Industry
            </span>
          </h2>
          <p className="text-[10px] sm:text-base md:text-lg text-blue-100 mb-1 sm:mb-3 leading-tight sm:leading-relaxed max-w-4xl mx-auto px-1 hidden sm:block">
            Secure, AI-powered platform for P&ID verification, PFD to P&ID conversion, 
            comment resolution, and complete project control.
          </p>
          <p className="text-xs sm:text-sm text-blue-200 mb-1 sm:mb-5 max-w-3xl mx-auto px-2 hidden sm:block">
            <span className="inline-flex items-center space-x-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">ISO 27001 Certified</span>
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center space-x-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Enterprise-Grade Security</span>
            </span>
          </p>
          
          {/* Abu Dhabi Launch Badge */}
          <div className="hidden sm:inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-5 py-1.5 sm:py-2.5 mb-1 sm:mb-5 text-xs sm:text-sm">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-white font-semibold">Trusted by Leading Oil & Gas Companies in UAE</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto px-2">
            <Link 
              to="/register" 
              className="group w-auto px-3 sm:px-8 py-1.5 sm:py-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base">
            >
              <span>Start Free Trial</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              to="/login" 
              className="group w-auto px-3 sm:px-8 py-1.5 sm:py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-bold rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base">
            >
              <span>Sign In</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-2 sm:mt-5 md:mt-6 px-2">
          {/* Feature 1 - P&ID Verification */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-2 sm:p-5 hover:bg-white/10 hover:border-amber-400/50 transition-all duration-300">
            <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mb-1 sm:mb-2 mx-auto">
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[10px] sm:text-lg font-bold text-white mb-0.5 sm:mb-2 text-center">
              P&ID Verification
            </h3>
            <p className="text-[8px] sm:text-sm text-blue-100 leading-tight sm:leading-relaxed text-center hidden sm:block">
              AI-powered compliance checking against ADNOC, Shell DEP, and international standards with automated issue detection.
            </p>
          </div>

          {/* Feature 2 - PFD to P&ID Conversion */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-2 sm:p-5 hover:bg-white/10 hover:border-cyan-400/50 transition-all duration-300">
            <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-1 sm:mb-2 mx-auto">
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-[10px] sm:text-lg font-bold text-white mb-0.5 sm:mb-2 text-center">
              PFD to P&ID
            </h3>
            <p className="text-[8px] sm:text-sm text-blue-100 leading-tight sm:leading-relaxed text-center hidden sm:block">
              Intelligent conversion from Process Flow Diagrams to detailed P&IDs with automated symbol recognition and placement.
            </p>
          </div>

          {/* Feature 3 - Comment Resolution Sheet */}
          <div className="hidden sm:block group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-5 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">
              Comment Resolution
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Extract and manage PDF comments with Google Sheets integration for seamless collaboration and tracking.
            </p>
          </div>

          {/* Feature 4 - Project Control */}
          <div className="hidden sm:block group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-5 hover:bg-white/10 hover:border-green-400/50 transition-all duration-300">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">
              Project Control
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Complete project lifecycle management with task tracking, milestone monitoring, and team collaboration tools.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="hidden sm:grid max-w-5xl mx-auto mt-3 sm:mt-5 md:mt-6 grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 px-2">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
              99.8%
            </div>
            <div className="text-xs sm:text-sm text-blue-200 font-semibold">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-1 sm:mb-2">
              10x
            </div>
            <div className="text-xs sm:text-sm text-blue-200 font-semibold">Faster Review</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent mb-1 sm:mb-2">
              24/7
            </div>
            <div className="text-xs sm:text-sm text-blue-200 font-semibold">Availability</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent mb-1 sm:mb-2">
              100%
            </div>
            <div className="text-xs sm:text-sm text-blue-200 font-semibold">Compliant</div>
          </div>
        </div>

        {/* Security & Trust Section */}
        <div className="hidden sm:block max-w-6xl mx-auto mt-3 sm:mt-5 px-2">
          <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-5">
            <h3 className="text-base sm:text-lg font-bold text-white text-center mb-2 sm:mb-4">Enterprise-Grade Security & Compliance</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium">ISO 27001</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium">256-bit Encryption</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium">GDPR Compliant</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium">Role-Based Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-2 sm:mt-5 md:mt-6 pt-2 sm:pt-5 border-t border-white/10 px-2">
          <p className="text-blue-200 text-[9px] sm:text-sm mb-1">
            © 2024 REJLERS AB • Engineering Excellence Since 1942
          </p>
          <p className="text-blue-300 text-[9px] sm:text-xs">
            <a href="https://www.rejlers.com/ae/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors">
              www.rejlers.com/ae
            </a>
            <span className="mx-2">•</span>
            Abu Dhabi, United Arab Emirates
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home

