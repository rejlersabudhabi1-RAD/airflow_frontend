import React, { useState } from 'react'
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
import { REJLERS_COLORS } from '../config/theme.config'
import { 
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

/**
 * Solutions Page Component
 * Smart, soft-coded design showcasing all RADAI solutions
 */

const Solutions = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedSolution, setExpandedSolution] = useState(null)

  // Filter solutions based on search and category
  const filteredSolutions = React.useMemo(() => {
    let solutions = searchQuery ? searchSolutions(searchQuery) : SOLUTIONS
    
    if (selectedCategory !== 'all') {
      solutions = solutions.filter(s => s.category === selectedCategory)
    }
    
    return solutions
  }, [searchQuery, selectedCategory])

  const categories = getCategoriesWithSolutions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <SparklesIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-semibold">AI-Powered Engineering Solutions</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                Engineering Workflow
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
              Discover intelligent solutions that automate complex engineering tasks,
              reduce errors, and accelerate project delivery
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search solutions... (e.g., 'PFD', 'Document Control', 'AI')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-gray-900 text-lg font-medium shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {SOLUTION_STATS.map((stat) => (
              <div 
                key={stat.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              All Solutions
            </button>
            {Object.values(SOLUTION_CATEGORIES).map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.title}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredSolutions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No solutions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSolutions.map((solution) => {
                const Icon = solution.icon
                const category = SOLUTION_CATEGORIES[Object.keys(SOLUTION_CATEGORIES).find(
                  key => SOLUTION_CATEGORIES[key].id === solution.category
                )]
                const isExpanded = expandedSolution === solution.id
                
                return (
                  <div
                    key={solution.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className={`p-6 bg-gradient-to-r ${category.color}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/90 rounded-xl shadow-lg">
                          <Icon className="w-8 h-8 text-gray-900" />
                        </div>
                        {solution.isPremium && (
                          <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-black rounded-full">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">
                        {solution.title}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {solution.shortDescription}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        {solution.fullDescription}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {solution.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="space-y-4 mb-4 animate-fade-in">
                          {/* Features */}
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <SparklesIcon className="w-5 h-5 text-blue-600" />
                              Key Features
                            </h4>
                            <ul className="space-y-1">
                              {solution.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Benefits */}
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <RocketLaunchIcon className="w-5 h-5 text-purple-600" />
                              Benefits
                            </h4>
                            <ul className="space-y-1">
                              {solution.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <CheckCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setExpandedSolution(isExpanded ? null : solution.id)}
                          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {isExpanded ? 'Show Less' : 'Learn More'}
                        </button>
                        {isAuthenticated ? (
                          <Link
                            to={solution.link}
                            className={`flex-1 px-4 py-2 bg-gradient-to-r ${category.color} text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group`}
                          >
                            Try Now
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : (
                          <Link
                            to="/register"
                            className={`flex-1 px-4 py-2 bg-gradient-to-r ${category.color} text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                          >
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

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Ready to Transform Your Engineering Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join hundreds of engineering teams using RADAI to accelerate projects,
            reduce errors, and deliver exceptional results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={SOLUTIONS_CTA.primary.link}
              className="px-8 py-4 bg-white text-blue-600 font-black rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl hover:shadow-white/30 flex items-center gap-2"
            >
              {SOLUTIONS_CTA.primary.text}
              <RocketLaunchIcon className="w-5 h-5" />
            </Link>
            <Link
              to={SOLUTIONS_CTA.secondary.link}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold rounded-xl hover:bg-white/20 transition-all transform hover:scale-105"
            >
              {SOLUTIONS_CTA.secondary.text}
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-blue-200">
            {SOLUTIONS_CTA.primary.description}
          </p>
        </div>
      </section>

      {/* Styles for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Solutions
