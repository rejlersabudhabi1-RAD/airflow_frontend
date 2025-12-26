import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import PIDUpload from './pages/PIDUpload'
import PIDReport from './pages/PIDReport'
import PFDUpload from './pages/PFDUpload'
import PFDConvert from './pages/PFDConvert'
import S3PFDBrowser from './pages/S3PFDBrowser'
import CRSDocuments from './pages/CRSDocuments'
import CRSDocumentsHistory from './pages/CRSDocumentsHistory'
import ProjectControl from './pages/ProjectControl'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import NotFound from './pages/NotFound'

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />
  }

  // Public Route wrapper (redirect if authenticated)
  const PublicRoute = ({ children }) => {
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="home" element={<Home />} />
        
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
            <ProtectedRoute>
              <PIDUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="pid/report/:id"
          element={
            <ProtectedRoute>
              <PIDReport />
            </ProtectedRoute>
          }
        />
        
        {/* Feature Routes - PFD Converter */}
        <Route
          path="pfd/upload"
          element={
            <ProtectedRoute>
              <PFDUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="pfd/convert/:documentId"
          element={
            <ProtectedRoute>
              <PFDConvert />
            </ProtectedRoute>
          }
        />
        <Route
          path="pfd/s3-browser"
          element={
            <ProtectedRoute>
              <S3PFDBrowser />
            </ProtectedRoute>
          }
        />
        
        {/* Feature Routes - CRS Documents */}
        <Route
          path="crs/documents"
          element={
            <ProtectedRoute>
              <CRSDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="crs/documents/history"
          element={
            <ProtectedRoute>
              <CRSDocumentsHistory />
            </ProtectedRoute>
          }
        />

        {/* Project Control */}
        <Route
          path="projects"
          element={
            <ProtectedRoute>
              <ProjectControl />
            </ProtectedRoute>
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

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
