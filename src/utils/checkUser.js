// Debugging utility to check user data
export const checkUserData = () => {
  const userData = localStorage.getItem('radai_user_data')
  if (userData) {
    const user = JSON.parse(userData)
    console.log('=== USER DATA DEBUG ===')
    console.log('Username:', user.username)
    console.log('is_staff:', user.is_staff)
    console.log('is_superuser:', user.is_superuser)
    console.log('Full user object:', user)
    console.log('=====================')
    return user
  }
  console.log('No user data found in localStorage')
  return null
}

// Clear all auth data and force re-login
export const clearAuthData = () => {
  localStorage.removeItem('radai_access_token')
  localStorage.removeItem('radai_refresh_token')
  localStorage.removeItem('radai_user_data')
  console.log('Auth data cleared. Please refresh and login again.')
}
