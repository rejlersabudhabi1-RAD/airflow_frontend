/**
 * FeatureCard Component
 * Dynamically renders feature cards based on registry data
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeatureCard = ({ feature }) => {
  const navigate = useNavigate()
  
  const getGradientClass = () => {
    return feature.colorScheme?.gradient || 'from-blue-500 to-indigo-600'
  }
  
  const getButtonColorClass = () => {
    const primary = feature.colorScheme?.primary || 'blue'
    return `bg-${primary}-600 hover:bg-${primary}-700`
  }

  return (
    <div className={`bg-gradient-to-r ${getGradientClass()} rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 hover:shadow-3xl transition-all duration-300`}>
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white flex items-center">
            <span className="text-4xl mr-3">{feature.icon}</span>
            {feature.name}
            {feature.isNew && (
              <span className="ml-3 px-2 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">
                NEW
              </span>
            )}
          </h2>
          
          <p className="text-white/90 mb-4 text-base sm:text-lg">
            {feature.description}
          </p>
          
          {feature.capabilities && feature.capabilities.length > 0 && (
            <ul className="text-sm text-white/80 space-y-2 mb-6">
              {feature.capabilities.map((capability, index) => (
                <li key={index} className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {capability}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button
          onClick={() => navigate(feature.frontendRoute)}
          className={`ml-6 px-6 py-3 ${getButtonColorClass()} text-white rounded-lg transition-colors font-medium flex items-center shadow-lg whitespace-nowrap`}
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {feature.hasUpload ? 'Upload' : 'Open'}
        </button>
      </div>
    </div>
  )
}

export default FeatureCard
