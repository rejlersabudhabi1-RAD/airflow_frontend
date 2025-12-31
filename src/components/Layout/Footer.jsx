import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_VERSION } from '../../config/app.config'

/**
 * Footer Component
 * Smart footer with app information
 */

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container-custom py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            &copy; {currentYear} {APP_NAME}. All rights reserved. v{APP_VERSION}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              to="/privacy-policy"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="https://www.rejlers.com/ae/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
