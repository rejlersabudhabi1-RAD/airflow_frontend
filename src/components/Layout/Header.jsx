import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toggleTheme } from '../../store/slices/themeSlice'

/**
 * Header Component - REJLERS RADAI
 * Premium navigation header with REJLERS branding
 */

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { mode } = useSelector((state) => state.theme)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleThemeToggle = () => {
    dispatch(toggleTheme())
  }

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl border-b border-white/10">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                REJLERS
              </span>
              <div className="h-6 w-px bg-amber-400"></div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                RADAI
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all transform hover:scale-110"
              aria-label="Toggle theme"
            >
              {mode === 'light' ? '🌙' : '☀️'}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-blue-100 hover:text-amber-300 font-semibold transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin"
                  className="text-blue-100 hover:text-amber-300 font-semibold transition-colors"
                >
                  Admin
                </Link>
                <Link
                  to="/profile"
                  className="text-blue-100 hover:text-amber-300 font-semibold transition-colors"
                >
                  Profile
                </Link>
                <span className="text-blue-200 font-medium">
                  Hello, {user?.username || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-100 hover:text-amber-300 font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header

