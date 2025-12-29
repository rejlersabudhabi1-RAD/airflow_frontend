import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'

/**
 * Force Refresh Auth Component
 * This component will clear old auth data and force a fresh login
 */
const ForceRefreshAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleForceRefresh = () => {
    // Clear all localStorage
    localStorage.clear()
    
    // Dispatch logout
    dispatch(logout())
    
    // Navigate to login
    navigate('/login')
    
    // Reload page
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleForceRefresh}
        className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
        title="Force logout and clear cache"
      >
        🔄 Force Refresh Auth
      </button>
    </div>
  )
}

export default ForceRefreshAuth
