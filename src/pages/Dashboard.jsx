import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchFeatures } from '../store/featureSlice'
import FeatureCard from '../components/FeatureCard'

/**
 * Dashboard Page
 * Protected dashboard for authenticated users
 * Dynamically displays features from registry
 */

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { features, loading } = useSelector((state) => state.features)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch features when component mounts
    dispatch(fetchFeatures())
  }, [dispatch])

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

          <div
            onClick={() => navigate('/projects')}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 border-2 border-purple-400 hover:border-purple-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Project Control
                </h3>
                <p className="text-3xl sm:text-4xl font-bold text-white">NEW</p>
                <p className="text-xs text-purple-100 mt-2">Manage Projects</p>
              </div>
              <svg className="w-12 h-12 text-purple-200 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Features Section */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {features && features.length > 0 ? (
              features
                .filter(feature => feature.category !== 'other')
                .map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))
            ) : (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  No Features Available
                </h2>
                <p className="text-gray-600">
                  Contact your administrator for access to features.
                </p>
              </div>
            )}
          </>
        )}

        <div className="card mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity to display. Upload your first drawing to get started!
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
