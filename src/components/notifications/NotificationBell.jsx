import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import notificationService from '../../services/notification.service'
import NotificationDropdown from './NotificationDropdown'

/**
 * NotificationBell Component
 * Displays notification bell icon with unread count badge
 * Shows dropdown with recent notifications on click
 */

const NotificationBell = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  // Fetch unread count on mount and every 60 seconds - only if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[NotificationBell] ⚠️ User not authenticated, skipping fetch')
      return
    }
    
    console.log('[NotificationBell] ✅ User authenticated, starting notification polling')
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000) // Poll every 60 seconds
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications()
    }
  }, [showDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      console.log('[NotificationBell] ✅ Unread count fetched:', count)
      setUnreadCount(count)
    } catch (error) {
      console.error('[NotificationBell] ❌ Failed to fetch unread count:', error)
      if (error.response?.status === 401) {
        console.error('[NotificationBell] ⚠️ User not authenticated')
        setUnreadCount(0)
      }
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      console.log('[NotificationBell] 📥 Fetching notifications...')
      const data = await notificationService.getNotifications({
        ordering: '-created_at',
        page_size: 10
      })
      console.log('[NotificationBell] ✅ Notifications fetched:', data)
      setNotifications(data.results || data)
    } catch (error) {
      console.error('[NotificationBell] ❌ Failed to fetch notifications:', error)
      if (error.response?.status === 401) {
        console.error('[NotificationBell] ⚠️ User not authenticated')
      }
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleBellClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[NotificationBell] Bell clicked, current showDropdown:', showDropdown)
    setShowDropdown(!showDropdown)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  return (
    <div className="relative z-50">
      <button
        ref={bellRef}
        onClick={handleBellClick}
        type="button"
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all transform hover:scale-110 cursor-pointer"
        aria-label="Notifications"
        style={{ pointerEvents: 'auto' }}
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-6 h-6 text-amber-300 animate-pulse" />
        ) : (
          <BellIcon className="w-6 h-6 text-white" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown
          ref={dropdownRef}
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onRefresh={fetchNotifications}
        />
      )}
    </div>
  )
}

export default NotificationBell
