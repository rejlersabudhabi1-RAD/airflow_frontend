import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import { authService } from '../services/auth.service'
import LoginBranding from '../components/login/LoginBranding'
import LoginForm from '../components/login/LoginForm'
import {
  VALIDATION_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NAVIGATION,
  LOGGING,
  HTTP_STATUS,
  THEME,
  LOGIN_RESPONSIVE,
} from '../config/login.config'

/**
 * Login Page
 * Soft-coded login form with validation
 * All configuration moved to login.config.js
 * Fully responsive for all devices
 */

// Validation schema from configuration
const loginSchema = Yup.object().shape({
  email: Yup.string().email(VALIDATION_CONFIG.email.invalid).required(VALIDATION_CONFIG.email.required),
  password: Yup.string().required(VALIDATION_CONFIG.password.required),
})

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values) => {
    setIsLoading(true)
    dispatch(loginStart())

    try {
      // Logging - controlled by configuration
      if (LOGGING.enabled) {
        console.log(LOGGING.login.attempt, values.email)
        console.log(LOGGING.login.sending)
      }
      
      const startTime = Date.now()
      const userData = await authService.login(values)
      const endTime = Date.now()
      
      if (LOGGING.enabled) {
        console.log(LOGGING.login.success, endTime - startTime, 'ms')
        console.log(LOGGING.login.userData, userData)
      }
      
      dispatch(loginSuccess(userData))
      toast.success(SUCCESS_MESSAGES.login)
      navigate(NAVIGATION.afterLogin)
    } catch (error) {
      // Comprehensive error logging - controlled by configuration
      if (LOGGING.enabled) {
        console.group(LOGGING.login.failed)
        console.error('Error Type:', error.constructor.name)
        console.error('Error Message:', error.message)
        console.error('Is Timeout:', error.isTimeout || false)
        console.error('Is Network Error:', error.isNetworkError || false)
        console.error('HTTP Status:', error.response?.status)
        console.error('Response Data:', error.response?.data)
        console.error('Full Error:', error)
        console.groupEnd()
      }
      
      // Determine user-friendly error message from configuration
      let errorMessage = ERROR_MESSAGES.unexpected.message
      
      if (error.isTimeout) {
        errorMessage = ERROR_MESSAGES.timeout.message
        if (LOGGING.enabled) console.error(ERROR_MESSAGES.timeout.console)
      } else if (error.isNetworkError) {
        errorMessage = ERROR_MESSAGES.network.message
        if (LOGGING.enabled) console.error(ERROR_MESSAGES.network.console)
      } else if (error.response) {
        if (error.response.status === HTTP_STATUS.UNAUTHORIZED) {
          errorMessage = ERROR_MESSAGES.unauthorized.message
        } else if (error.response.status === HTTP_STATUS.FORBIDDEN) {
          errorMessage = ERROR_MESSAGES.forbidden.message
        } else if (error.response.status >= HTTP_STATUS.SERVER_ERROR_START) {
          errorMessage = ERROR_MESSAGES.serverError.message
        } else {
          errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.response?.data?.error ||
                        `❌ Login failed: ${error.response.status}`
        }
      } else {
        errorMessage = error.message || ERROR_MESSAGES.generic.message
      }
      
      dispatch(loginFailure(errorMessage))
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #e3f2f4 30%, #d4ede7 70%, #fce4e5 100%)' }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Technical Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: '#73BDC8' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: '#7FCAB5', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: '#617AAD', animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: '#F6B2BB', animationDelay: '1.5s' }}></div>
      </div>

      <LoginBranding />
      <LoginForm 
        loginSchema={loginSchema}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default Login
