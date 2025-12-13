import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import { authService } from '../services/auth.service'

/**
 * Login Page
 * Smart login form with validation
 */

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
})

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values) => {
    setIsLoading(true)
    dispatch(loginStart())

    try {
      const userData = await authService.login(values)
      dispatch(loginSuccess(userData))
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.detail || 'Login failed'))
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Side - Branding with Abu Dhabi Theme */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Pattern - Abu Dhabi Skyline Inspired */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        {/* REJLERS Branding */}
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
              REJLERS
            </h1>
            <div className="flex items-center space-x-2">
              <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
              <span className="text-amber-300 text-lg font-semibold">AIFLOW</span>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            AI-Powered P&ID<br />Design Verification
          </h2>
          <p className="text-blue-200 text-lg mb-6">
            Intelligent engineering review for Process & Instrumentation Diagrams
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <svg className="w-5 h-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-white font-medium">Launching in Abu Dhabi, UAE</span>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-start space-x-3 text-blue-100 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-white">Automated Compliance Check</h4>
              <p className="text-sm text-blue-300">Verify P&ID standards instantly with AI</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-blue-100 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-white">Smart Issue Detection</h4>
              <p className="text-sm text-blue-300">Identify design flaws before construction</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-blue-100 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-white">Detailed Reports</h4>
              <p className="text-sm text-blue-300">Comprehensive analysis in seconds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Modern Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-1">REJLERS</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-1 w-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
              <span className="text-amber-600 text-base font-semibold">AIFLOW</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your P&ID verification dashboard
            </p>
          </div>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <Field
                      name="email"
                      type="email"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all ${
                        errors.email && touched.email ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="your.email@rejlers.ae"
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-600 text-sm mt-2 flex items-center font-medium"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <Field
                      name="password"
                      type="password"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all ${
                        errors.password && touched.password ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="••••••••••"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-600 text-sm mt-2 flex items-center font-medium"
                  />
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-medium">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </Form>
            )}

          </Formik>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-600 font-medium">New to AIFLOW?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 font-bold text-blue-600 hover:text-indigo-600 transition-colors group"
              >
                <span>Create an account</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Enterprise-grade security • 256-bit encryption</span>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              © 2024 REJLERS AB. All rights reserved. • Abu Dhabi, UAE
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
