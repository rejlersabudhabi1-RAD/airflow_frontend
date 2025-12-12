import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/app.config'

/**
 * Home Page
 * Landing page with introduction
 */

const Home = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          A smart application built with Django and ReactJS using modern best practices
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="card">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Fast & Modern
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built with latest technologies for optimal performance
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Secure
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              JWT authentication and industry-standard security practices
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Scalable
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Designed to grow with your needs using Docker & Celery
            </p>
          </div>
        </div>

        <div className="mt-12 space-x-4">
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
