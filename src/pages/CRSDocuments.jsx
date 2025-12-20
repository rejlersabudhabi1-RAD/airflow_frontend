/**
 * CRS Documents Page
 * Document management for Company Required Specifications
 * EXAMPLE: Shows how easy it is to add new features
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CRSDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ department: '', status: '' })
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchDocuments()
    fetchStats()
  }, [filter])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.department) params.append('department', filter.department)
      if (filter.status) params.append('status', filter.status)
      
      const response = await axios.get(`${API_URL}/api/v1/crs/documents/?${params}`)
      setDocuments(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/crs/documents/stats/`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            📑 CRS Document Management
          </h1>
          <p className="text-gray-600">
            Company Required Specifications - Centralized document repository
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Documents</h3>
              <p className="text-3xl font-bold text-emerald-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Approved</h3>
              <p className="text-3xl font-bold text-green-600">{stats.by_status?.approved || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Under Review</h3>
              <p className="text-3xl font-bold text-amber-600">{stats.by_status?.review || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Draft</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.by_status?.draft || 0}</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload New CRS Document</h2>
              <p className="text-emerald-50">
                Add company specifications, standards, and compliance documents
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium flex items-center shadow-lg">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                value={filter.department}
                onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="operations">Operations</option>
                <option value="safety">Safety</option>
                <option value="quality">Quality Assurance</option>
                <option value="procurement">Procurement</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Documents</h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.document_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{doc.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          doc.status === 'review' ? 'bg-amber-100 text-amber-800' :
                          doc.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.version}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No documents found. Upload your first CRS document to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CRSDocuments
