import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from './config/api.config'
import Layout from './components/Layout/Layout'
import FirstLoginCheck from './components/Auth/FirstLoginCheck'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SetupPassword from './pages/SetupPassword'
import RequestPasswordReset from './pages/RequestPasswordReset'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import PIDUpload from './pages/PIDUpload'
import PIDReport from './pages/PIDReport'
import PIDHistory from './pages/PIDHistory'
import PFDUpload from './pages/PFDUpload'
import PFDConvert from './pages/PFDConvert'
import PFDHistory from './pages/PFDHistory'
import S3PFDBrowser from './pages/S3PFDBrowser'
import CRSDocuments from './pages/CRSDocuments'
import CRSDocumentsHistory from './pages/CRSDocumentsHistory'
import CRSMultipleRevision from './pages/CRSMultipleRevision'
import ProjectControl from './pages/ProjectControl'
import InvoiceUpload from './pages/Finance/InvoiceUpload'
import InvoiceList from './pages/Finance/InvoiceList'
import InvoiceDetail from './pages/Finance/InvoiceDetail'
import InvoiceApproval from './pages/Finance/InvoiceApproval'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import ContactSupportPage from './pages/ContactSupportPage'
import DocumentationPage from './pages/DocumentationPage'
import NotFound from './pages/NotFound'

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [userModules, setUserModules] = useState([])
  const [modulesLoaded, setModulesLoaded] = useState(false)

  // Fetch user modules on mount
  useEffect(() => {
    const fetchUserModules = async () => {
      if (!isAuthenticated) {
        setModulesLoaded(true)
        return
      }
      
      try {
        const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access')
        const apiUrl = `${API_BASE_URL}/rbac/users/me/`
        console.log('🔐 App: Fetching modules from:', apiUrl)
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          console.error('Failed to fetch modules, status:', response.status)
          setModulesLoaded(true)
          return
        }
        
        const data = await response.json()
        console.log('🔐 App: Full user data:', data)
        
        if (data.modules && Array.isArray(data.modules)) {
          const moduleCodes = data.modules.map(m => m.code)
          setUserModules(moduleCodes)
          console.log('🔐 App: User accessible modules:', moduleCodes)
        } else {
          console.warn('App: No modules found in response')
          setUserModules([])
        }
      } catch (error) {
        console.error('Failed to fetch user modules:', error)
        setUserModules([])
      } finally {
        setModulesLoaded(true)
      }
    }
    
    fetchUserModules()
  }, [isAuthenticated])

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />
  }

  // Module Protected Route wrapper
  const ModuleProtectedRoute = ({ children, moduleCode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    
    // Allow access for admins
    const isAdmin = user?.is_staff || user?.is_superuser
    if (isAdmin) {
      return children
    }
    
    // Check if modules are loaded
    if (!modulesLoaded) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
    
    // Check if user has access to the required module
    if (userModules.includes(moduleCode)) {
      return children
    }
    
    // Access denied
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this feature.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Required module: <span className="font-semibold">{moduleCode}</span>
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Public Route wrapper (redirect if authenticated)
  const PublicRoute = ({ children }) => {
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
  }

  return (
    <FirstLoginCheck>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* Public Routes */}
        <Route
          path="login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        
        {/* Password Reset Routes - Public */}
        <Route path="setup-password" element={<SetupPassword />} />
        <Route path="reset-password" element={<SetupPassword />} />
        
        {/* Finance Approval - Public Route */}
        <Route path="finance/approve/:token" element={<InvoiceApproval />} />
        <Route path="request-password-reset" element={<RequestPasswordReset />} />
        <Route path="forgot-password" element={<RequestPasswordReset />} />
        
        <Route path="terms-of-service" element={<TermsOfService />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        
        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Feature Routes - PID Analysis */}
        <Route
          path="pid/upload"
          element={
            <ModuleProtectedRoute moduleCode="pid_analysis">
              <PIDUpload />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pid/report/:id"
          element={
            <ModuleProtectedRoute moduleCode="pid_analysis">
              <PIDReport />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pid/history"
          element={
            <ModuleProtectedRoute moduleCode="pid_analysis">
              <PIDHistory />
            </ModuleProtectedRoute>
          }
        />
        
        {/* Feature Routes - PFD Converter */}
        <Route
          path="pfd/upload"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <PFDUpload />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pfd/convert/:documentId"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <PFDConvert />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pfd/s3-browser"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <S3PFDBrowser />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pfd/history"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <PFDHistory />
            </ModuleProtectedRoute>
          }
        />
        
        {/* Feature Routes - CRS Documents */}
        <Route
          path="crs/documents"
          element={
            <ModuleProtectedRoute moduleCode="crs_documents">
              <CRSDocuments />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="crs/documents/history"
          element={
            <ModuleProtectedRoute moduleCode="crs_documents">
              <CRSDocumentsHistory />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="crs/multiple-revision"
          element={
            <ModuleProtectedRoute moduleCode="crs_documents">
              <CRSMultipleRevision />
            </ModuleProtectedRoute>
          }
        />


        {/* Feature Routes - Finance Invoice Automation */}
        <Route
          path="finance/upload"
          element={
            <ModuleProtectedRoute moduleCode="finance">
              <InvoiceUpload />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="finance/invoices"
          element={
            <ModuleProtectedRoute moduleCode="finance">
              <InvoiceList />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="finance/invoices/:id"
          element={
            <ModuleProtectedRoute moduleCode="finance">
              <InvoiceDetail />
            </ModuleProtectedRoute>
          }
        />

        {/* Project Control */}
        <Route
          path="projects"
          element={
            <ModuleProtectedRoute moduleCode="project_control">
              <ProjectControl />
            </ModuleProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Contact Support */}
        <Route
          path="support"
          element={
            <ProtectedRoute>
              <ContactSupportPage />
            </ProtectedRoute>
          }
        />

        {/* Documentation */}
        <Route
          path="documentation"
          element={
            <ProtectedRoute>
              <DocumentationPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </FirstLoginCheck>
  )
}

export default App
