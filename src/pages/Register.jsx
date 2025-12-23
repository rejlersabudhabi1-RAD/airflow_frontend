import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { authService } from '../services/auth.service'

/**
 * Register Page
 * Smart registration form with validation
 */

const registerSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .required('Username is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  password_confirm: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  first_name: Yup.string(),
  last_name: Yup.string(),
})

const Register = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values) => {
    setIsLoading(true)

    try {
      await authService.register(values)
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">Join REJLERS RADAI Platform</p>
          </div>

          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              password_confirm: '',
              first_name: '',
              last_name: '',
            }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username *
                  </label>
                  <Field
                    name="username"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 transition-all ${errors.username && touched.username ? 'border-red-400 focus:ring-red-100' : 'border-gray-200'}`}
                    placeholder="Choose a username"
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <Field
                    name="email"
                    type="email"
                    className={`input-field ${errors.email && touched.email ? 'border-red-500' : ''}`}
                    placeholder="your@email.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <Field
                      name="first_name"
                      className="input-field"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <Field
                      name="last_name"
                      className="input-field"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <Field
                    name="password"
                    type="password"
                    className={`input-field ${errors.password && touched.password ? 'border-red-500' : ''}`}
                    placeholder="Minimum 8 characters"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <Field
                    name="password_confirm"
                    type="password"
                    className={`input-field ${errors.password_confirm && touched.password_confirm ? 'border-red-500' : ''}`}
                    placeholder="Re-enter your password"
                  />
                  <ErrorMessage
                    name="password_confirm"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </Form>
            )}
          </Formik>

          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
