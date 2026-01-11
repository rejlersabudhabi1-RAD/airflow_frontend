import { authService } from '../../frontend/src/services/auth.service'
import { STORAGE_KEYS } from '../../frontend/src/config/app.config'

/**
 * Auth Service Tests
 */

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('returns true when token exists', () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'fake-token')
      expect(authService.isAuthenticated()).toBe(true)
    })
  })

  describe('getUserData', () => {
    it('returns null when no user data exists', () => {
      expect(authService.getUserData()).toBeNull()
    })

    it('returns user data when it exists', () => {
      const userData = { id: 1, email: 'test@example.com' }
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      expect(authService.getUserData()).toEqual(userData)
    })
  })

  describe('logout', () => {
    it('removes all auth tokens and data', () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'fake-token')
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'fake-refresh')
      localStorage.setItem(STORAGE_KEYS.USER_DATA, '{}')

      authService.logout()

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.USER_DATA)).toBeNull()
    })
  })
})
