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
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary text-sm"
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
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <Field
                      name="first_name"
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <Field
                      name="last_name"
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Field
                    name="phone_number"
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <Field
                    as="textarea"
                    name="bio"
                    disabled={!isEditing}
                    rows="4"
                    className={`input-field ${!isEditing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
