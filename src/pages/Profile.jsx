import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { updateUser } from '../store/slices/authSlice'
import { userService } from '../services/user.service'

/**
 * Profile Page
 * User profile with editable information
 */

const profileSchema = Yup.object().shape({
  first_name: Yup.string(),
  last_name: Yup.string(),
  phone_number: Yup.string(),
  bio: Yup.string(),
})

const Profile = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values) => {
    setIsLoading(true)

    try {
      const updatedUser = await userService.updateProfile(values)
      dispatch(updateUser(updatedUser))
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl sm:max-w-3xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Profile
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 w-full sm:w-auto"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <Formik
            initialValues={{
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
              phone_number: user?.phone_number || '',
              bio: user?.bio || '',
            }}
            validationSchema={profileSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {() => (
              <Form className="space-y-3 sm:space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <Field
                      name="first_name"
                      disabled={!isEditing}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-200' : 'border-gray-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <Field
                      name="last_name"
                      disabled={!isEditing}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-200' : 'border-gray-200'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Field
                    name="phone_number"
                    disabled={!isEditing}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-200' : 'border-gray-200'}`}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <Field
                    as="textarea"
                    name="bio"
                    disabled={!isEditing}
                    rows="4"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-200' : 'border-gray-200'}`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  )
}

export default Profile
