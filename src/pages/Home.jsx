import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Home Page - REJLERS AIFLOW Landing Page
 * Premium landing page for P&ID Verification Platform
 */

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        {/* Hero Headline */}
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered P&ID Design
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              Verification Platform
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
            Revolutionize your engineering workflow with intelligent automation. 
            Detect compliance issues instantly, generate comprehensive reports, 
            and ensure industry standards compliance.
          </p>
          
          {/* Abu Dhabi Launch Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-12">
            <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-white font-semibold">Now Live in Abu Dhabi, UAE</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="group w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-gray-900 font-bold rounded-xl shadow-2xl hover:shadow-amber-500/50 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <span className="text-lg">Start Free Trial</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              to="/login" 
              className="group w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-bold rounded-xl shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <span className="text-lg">Sign In</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mt-24">
          {/* Feature 1 - Automated Compliance */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-amber-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Automated Compliance
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Instantly verify P&ID drawings against ADNOC, Shell DEP, and international standards. 
              Save weeks of manual review time.
            </p>
          </div>

          {/* Feature 2 - Smart Detection */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              AI-Powered Detection
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Advanced machine learning identifies design anomalies, missing components, 
              and potential safety hazards with 99% accuracy.
            </p>
          </div>

          {/* Feature 3 - Comprehensive Reports */}
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Detailed Reports
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Generate professional audit reports with visual annotations, 
              compliance scores, and actionable recommendations in seconds.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent mb-2">
              99%
            </div>
            <div className="text-blue-200 font-semibold">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-2">
              10x
            </div>
            <div className="text-blue-200 font-semibold">Faster Review</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div className="text-blue-200 font-semibold">Availability</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent mb-2">
              100%
            </div>
            <div className="text-blue-200 font-semibold">Compliant</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-24 pt-12 border-t border-white/10">
          <p className="text-blue-200 text-sm">
            © 2024 REJLERS AB. All rights reserved. • Engineering Excellence Since 1942
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home

