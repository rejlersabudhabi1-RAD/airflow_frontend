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
    <div className="container-custom py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Dashboard
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Welcome Back!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.username || 'User'}
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Active Tasks
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">0</p>
          </div>
        </div>

        {/* P&ID Analysis Section */}
        <div className="card mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white flex items-center">
                <svg className="h-8 w-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                P&ID Design Verification
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                AI-powered engineering review for oil & gas P&ID drawings
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
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
