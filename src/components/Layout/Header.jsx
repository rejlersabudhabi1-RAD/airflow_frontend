import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toggleTheme } from '../../store/slices/themeSlice'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { LOGO_CONFIG, getLogoPath } from '../../config/logo.config'

/**
 * Header Component - REJLERS RADAI
 * Premium navigation header with REJLERS branding
 */

const Header = ({ sidebarOpen, setSidebarOpen, showSidebar }) => {
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
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl border-b border-white/10">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showSidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="w-6 h-6 text-white" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur-sm" 
                     style={{ background: 'linear-gradient(135deg, rgba(127, 202, 181, 0.5), rgba(115, 189, 200, 0.5))' }}></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 p-1.5">
                  <img 
                    src={getLogoPath('horizontal')}
                    alt={LOGO_CONFIG.primary.alt}
                    className="h-11 w-auto transition-all group-hover:scale-105"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{display: 'none'}} className="flex items-center h-11 px-2 space-x-2">
                    <span className="text-xl font-black text-slate-900">
                      {LOGO_CONFIG.fallback.text}
                    </span>
                    <div className="h-6 w-px bg-gradient-to-b from-amber-300 to-orange-400"></div>
                    <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                      RADAI
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

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

