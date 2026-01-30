/**
 * FeatureCard Component
 * Modern card design with enhanced UX
 * Supports scalability for future features
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeatureCard = ({ feature }) => {
  const navigate = useNavigate()
  
  const getGradientClass = () => {
    return feature.colorScheme?.gradient || 'from-blue-500 to-indigo-600'
  }
  
  const getCategoryBadgeColor = () => {
    const category = feature.category || 'other'
    const colors = {
      'engineering': 'bg-blue-100 text-blue-700 border-blue-200',
      'document_management': 'bg-green-100 text-green-700 border-green-200',
      'project_control': 'bg-purple-100 text-purple-700 border-purple-200',
      'finance': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'sales': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'quality_assurance': 'bg-amber-100 text-amber-700 border-amber-200',
      'procurement': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'other': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[category] || colors.other
  }

  const getCategoryName = () => {
    const category = feature.category || 'other'
    const names = {
      'engineering': 'Process Engineering',
      'document_management': 'Document Management',
      'project_control': 'Project Control',
      'finance': 'Finance',
      'sales': 'Sales',
      'quality_assurance': 'QHSE',
      'procurement': 'Procurement',
      'other': 'Other'
    }
    return names[category] || 'Other'
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Gradient accent bar */}
      <div className={`h-2 bg-gradient-to-r ${getGradientClass()}`}></div>
      
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left section - Icon and content */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              {/* Feature Icon */}
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradientClass()} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon || '🚀'}
              </div>
              
              <div className="flex-1">
                {/* Title and badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feature.name}
                  </h3>
                  {feature.isNew && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                      NEW
                    </span>
                  )}
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryBadgeColor()}`}>
                    {getCategoryName()}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
            
            {/* Capabilities List */}
            {feature.capabilities && feature.capabilities.length > 0 && (
              <div className="mt-4 space-y-2">
                {feature.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 leading-relaxed">{capability}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right section - Action button */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4">
            <button
              onClick={() => navigate(feature.frontendRoute)}
              className={`group/btn relative px-8 py-4 bg-gradient-to-r ${getGradientClass()} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 whitespace-nowrap`}
            >
              <span>{feature.hasUpload ? 'Upload File' : 'Open Feature'}</span>
              <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            {/* Stats or metadata */}
            <div className="flex lg:flex-col gap-4 lg:gap-2 text-center lg:text-right">
              <div className="px-4 py-2 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 font-medium">Status</div>
                <div className="text-sm font-bold text-green-600 flex items-center justify-center lg:justify-end gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}

export default FeatureCard
