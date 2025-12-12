import React from 'react'
import { useSelector } from 'react-redux'

/**
 * Dashboard Page
 * Protected dashboard for authenticated users
 */

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)

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

        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity to display. Start by creating your first project!
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
