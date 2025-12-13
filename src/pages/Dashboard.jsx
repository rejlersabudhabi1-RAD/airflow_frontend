import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

/**
 * Dashboard Page
 * Protected dashboard for authenticated users
 */

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {user?.username || 'User'}!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Total Drawings
                </h3>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600">0</p>
              </div>
              <svg className="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:border-green-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Completed
                </h3>
                <p className="text-3xl sm:text-4xl font-bold text-green-600">0</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-100 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  In Progress
                </h3>
                <p className="text-3xl sm:text-4xl font-bold text-amber-600">0</p>
              </div>
              <svg className="w-12 h-12 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* P&ID Analysis Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white flex items-center">
                <svg className="h-8 w-8 mr-3 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                P&ID Design Verification
              </h2>
              <p className="text-blue-100 mb-4 text-base sm:text-lg">
                AI-powered engineering review for oil & gas P&ID drawings
              </p>
              <ul className="text-sm text-blue-50 space-y-2 mb-6">
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Equipment & instrumentation verification
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Safety systems & PSV isolation compliance
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ADNOC / DEP / API / ISA standard checks
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/pid/upload')}
              className="ml-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center shadow-lg"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload P&ID
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity to display. Upload your first P&ID drawing to get started!
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
