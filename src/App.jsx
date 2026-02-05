import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from './config/api.config'
import { FEATURE_FLAGS, ENV } from './config/features.config'
import Layout from './components/Layout/Layout'
import FirstLoginCheck from './components/Auth/FirstLoginCheck'
import ChangePasswordModal from './components/Auth/ChangePasswordModal'
import PasswordExpiryBanner from './components/PasswordExpiryBanner'
import Home from './pages/Home'
import Login from './pages/Login'
import SetupPassword from './pages/SetupPassword'
import ChangePassword from './pages/ChangePassword'
import RequestPasswordReset from './pages/RequestPasswordReset'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import NotificationPanel from './pages/NotificationPanel'
import PIDUpload from './pages/PIDUpload'
import PIDReport from './pages/PIDReport'
import PIDHistory from './pages/PIDHistory'
// Soft-coded PFD Upload - Use different components based on environment
import PFDUploadClassic from './pages/PFDUpload'
import PFDUploadNew from './pages/PFDUploadNew'
const PFDUpload = FEATURE_FLAGS.pfdUploadVersion === 'new' ? PFDUploadNew : PFDUploadClassic
import PFDAnalysisConsole from './pages/PFDAnalysisConsole'
import PFDConvert from './pages/PFDConvert'
import PFDHistory from './pages/PFDHistory'
import PFDFiveStageAnalysis from './pages/PFDFiveStageAnalysis'
import S3PFDBrowser from './pages/S3PFDBrowser'
import S3Management from './pages/S3Management'
import CRSDocuments from './pages/CRSDocuments'
import CRSDocumentsHistory from './pages/CRSDocumentsHistory'
import CRSChainDetail from './pages/CRSChainDetail'
// Soft-coded CRS Multi-Revision - Use Smart component with finish early logic
import CRSMultipleRevisionClassic from './pages/CRSMultipleRevision'
import CRSMultiRevisionSmart from './pages/CRSMultiRevisionSmart'
const CRSMultipleRevision = FEATURE_FLAGS.crsMultiRevisionVersion === 'classic' ? CRSMultipleRevisionClassic : CRSMultiRevisionSmart
import ProjectControl from './pages/ProjectControl'
import GeneralQHSE from './pages/QHSE/GeneralQHSE'
import QHSEInterconnectedDemo from './pages/QHSE/QHSEInterconnectedDemo'
import InvoiceUpload from './pages/Finance/InvoiceUpload'
import InvoiceList from './pages/Finance/InvoiceList'
import InvoiceDetail from './pages/Finance/InvoiceDetail'
import InvoiceApproval from './pages/Finance/InvoiceApproval'
import DeptOfSales from './pages/Finance/DeptOfSales'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import UserDetail from './pages/UserDetail'
import SubscriptionManagement from './pages/SubscriptionManagement'
import SubscriptionPlans from './pages/SubscriptionPlans'
import ContactSupportPage from './pages/ContactSupportPage'
import DocumentationPage from './pages/DocumentationPage'
import Solutions from './pages/Solutions'
import Enquiry from './pages/Enquiry'
import ConsultingService from './pages/ConsultingService'
import PFDConversionService from './pages/PFDConversionService'
import AssetIntegrityService from './pages/AssetIntegrityService'
import DataGovernanceService from './pages/DataGovernanceService'
import SecurityService from './pages/SecurityService'
import About from './pages/About'
import NotFound from './pages/NotFound'
// DesignIQ Components
import DesignIQDashboard from './pages/DesignIQ/DesignIQDashboard'
import DesignIQLists from './pages/DesignIQ/DesignIQLists'
import StressCriticalLineList from './pages/DesignIQ/StressCriticalLineList'
import PFDVerification from './pages/DesignIQ/PFDVerification'
import DesignIQProjectDetail from './pages/DesignIQ/DesignIQProjectDetail'
import DesignIQNewProject from './pages/DesignIQ/DesignIQNewProject'
// Procurement Components
import ProcurementDashboard from './pages/Procurement/ProcurementDashboard'
import VendorManagement from './pages/Procurement/VendorManagement'
import RequisitionManagement from './pages/Procurement/RequisitionManagement'
import OrderManagement from './pages/Procurement/OrderManagement'
import ReceiptManagement from './pages/Procurement/ReceiptManagement'
// Process Datasheet Components
import ProcessDatasheetPage from './pages/ProcessDatasheetPage'
// Report Generator Components
import ReportGenerator from './pages/Admin/ReportGenerator'
import PredictiveInsights from './pages/Admin/PredictiveInsights'
import AdvancedAnalytics from './pages/Admin/AdvancedAnalytics'
// Debug Components
import FeaturesDebug from './pages/FeaturesDebug'

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [userModules, setUserModules] = useState([])
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  // Log environment and component selection
  console.log('🎯 App Environment:', ENV)
  console.log('🎛️ PFD Upload Component:', FEATURE_FLAGS.pfdUploadVersion === 'new' ? 'PFDUploadNew (Ultra Complete)' : 'PFDUpload (Classic)')
  console.log('📋 CRS Multi-Revision Component:', FEATURE_FLAGS.crsMultiRevisionVersion === 'smart' ? 'CRSMultiRevisionSmart (with Finish Early)' : 'CRSMultipleRevision (Classic)')

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
        
        // Check must_change_password flag
        if (data.must_change_password === true) {
          setMustChangePassword(true)
        }
        
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
    
    // Smart admin check: Check nested user object AND roles array
    const userData = user?.user || user
    const hasAdminFlags = userData?.is_staff || userData?.is_superuser
    const hasSuperAdminRole = user?.roles?.some(role => 
      role.code === 'super_admin' || role.name === 'Super Administrator'
    )
    const isAdmin = hasAdminFlags || hasSuperAdminRole
    
    // Super Administrators and Staff have access to all modules
    if (isAdmin) {
      console.log('✅ App: Admin access granted for module:', moduleCode)
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
  
  // Handle password change success
  const handlePasswordChangeSuccess = async () => {
    setMustChangePassword(false)
    // Refresh user data
    try {
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access')
      const apiUrl = `${API_BASE_URL}/rbac/users/me/`
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMustChangePassword(data.must_change_password === true)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  return (
    <>
      {/* Password Expiry Banner - shown globally when password is expiring or expired */}
      {isAuthenticated && <PasswordExpiryBanner />}
      
      {/* Password Change Modal - shown globally when required */}
      {isAuthenticated && mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          isRequired={true}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
      
      <FirstLoginCheck>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            {/* Solutions Page */}
            <Route path="solutions" element={<Solutions />} />
            
            {/* Enquiry Page */}
            <Route path="enquiry" element={<Enquiry />} />
            
            {/* Services */}
          <Route path="services/consulting" element={<ConsultingService />} />
          <Route path="services/pfd-conversion" element={<PFDConversionService />} />
          <Route path="services/asset-integrity" element={<AssetIntegrityService />} />
          <Route path="data-governance" element={<DataGovernanceService />} />
          <Route path="security" element={<SecurityService />} />
          <Route path="about" element={<About />} />
          
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
          path="pricing"
          element={
            <PublicRoute>
              <SubscriptionPlans />
            </PublicRoute>
          }
        />
        
        {/* Password Reset Routes - Public */}
        <Route path="setup-password" element={<SetupPassword />} />
        <Route path="reset-password" element={<SetupPassword />} />
        <Route path="request-password-reset" element={<RequestPasswordReset />} />
        <Route path="forgot-password" element={<RequestPasswordReset />} />
        
        {/* Change Password - Protected Route */}
        <Route 
          path="change-password" 
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } 
        />
        
        {/* Finance Approval - Public Route */}
        <Route path="finance/approve/:token" element={<InvoiceApproval />} />
        
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
          path="features-debug"
          element={
            <ProtectedRoute>
              <FeaturesDebug />
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
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <NotificationPanel />
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
          path="pfd/analyze/:documentId"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <PFDAnalysisConsole />
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
        <Route
          path="pfd/analysis/:id"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <PFDFiveStageAnalysis />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="pfd/s3-management"
          element={
            <ModuleProtectedRoute moduleCode="pfd_to_pid">
              <S3Management />
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
          path="crs/documents/:id"
          element={
            <ModuleProtectedRoute moduleCode="crs_documents">
              <CRSChainDetail />
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
        <Route
          path="finance/sales"
          element={
            <ProtectedRoute>
              <DeptOfSales />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales"
          element={
            <ProtectedRoute>
              <DeptOfSales />
            </ProtectedRoute>
          }
        />

        {/* DesignIQ Routes */}
        <Route
          path="designiq"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <DesignIQDashboard />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="designiq/new"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <DesignIQNewProject />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="designiq/lists"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <DesignIQLists />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="designiq/stress-critical-line-list"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <StressCriticalLineList />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="designiq/pfd-verification"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <PFDVerification />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="designiq/projects/:id"
          element={
            <ModuleProtectedRoute moduleCode="designiq">
              <DesignIQProjectDetail />
            </ModuleProtectedRoute>
          }
        />

        {/* Procurement Routes */}
        <Route
          path="procurement"
          element={
            <ModuleProtectedRoute moduleCode="procurement">
              <ProcurementDashboard />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="procurement/vendors"
          element={
            <ModuleProtectedRoute moduleCode="procurement">
              <VendorManagement />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="procurement/requisitions"
          element={
            <ModuleProtectedRoute moduleCode="procurement">
              <RequisitionManagement />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="procurement/orders"
          element={
            <ModuleProtectedRoute moduleCode="procurement">
              <OrderManagement />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="procurement/receipts"
          element={
            <ModuleProtectedRoute moduleCode="procurement">
              <ReceiptManagement />
            </ModuleProtectedRoute>
          }
        />

        {/* Process Datasheet Routes */}
        <Route
          path="engineering/process/datasheet/*"
          element={
            <ProtectedRoute>
              <ProcessDatasheetPage />
            </ProtectedRoute>
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

        {/* QHSE Routes */}
        <Route
          path="qhse/general/*"
          element={
            <ModuleProtectedRoute moduleCode="qhse">
              <GeneralQHSE />
            </ModuleProtectedRoute>
          }
        />
        <Route
          path="qhse/interconnected-demo/:projectId?"
          element={
            <ModuleProtectedRoute moduleCode="qhse">
              <QHSEInterconnectedDemo />
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
          path="admin/dashboard"
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
        <Route
          path="admin/users/:id"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/subscriptions"
          element={
            <ProtectedRoute>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute>
              <ReportGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports/predictive"
          element={
            <ProtectedRoute>
              <PredictiveInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports/analytics"
          element={
            <ProtectedRoute>
              <AdvancedAnalytics />
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
    </>
  )
}

export default App

