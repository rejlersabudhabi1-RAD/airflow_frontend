// CRS History Actions Configuration
// Dynamically loaded from backend

export const DEFAULT_HISTORY_CONFIG = {
  upload_actions: {
    download: {
      enabled: true,
      label: 'Download',
      icon: '⬇️',
      color: 'blue',
      description: 'Download original file'
    },
    delete: {
      enabled: true,
      label: 'Delete',
      icon: '🗑️',
      color: 'red',
      description: 'Remove file from storage',
      confirm_message: 'Are you sure you want to delete this file? This action cannot be undone.'
    },
    view_metadata: {
      enabled: true,
      label: 'Details',
      icon: 'ℹ️',
      color: 'gray',
      description: 'View file metadata and information'
    },
    share: {
      enabled: true,
      label: 'Share',
      icon: '🔗',
      color: 'green',
      description: 'Get shareable download link (expires in 1 hour)'
    }
  },
  
  export_actions: {
    download: {
      enabled: true,
      label: 'Re-download',
      icon: '⬇️',
      color: 'green',
      description: 'Download exported file'
    },
    delete: {
      enabled: true,
      label: 'Delete',
      icon: '🗑️',
      color: 'red',
      description: 'Remove export from storage',
      confirm_message: 'Are you sure you want to delete this export? This action cannot be undone.'
    },
    view_metadata: {
      enabled: true,
      label: 'Details',
      icon: 'ℹ️',
      color: 'gray',
      description: 'View export metadata and information'
    },
    share: {
      enabled: true,
      label: 'Share',
      icon: '🔗',
      color: 'blue',
      description: 'Get shareable download link (expires in 1 hour)'
    }
  },
  
  security: {
    allow_delete: true,
    allow_reprocess: true,
    require_confirmation_for_delete: true,
    max_share_link_duration_hours: 1,
    allow_share_links: true
  },
  
  ui_preferences: {
    show_action_menu: true,
    action_menu_type: 'dropdown',
    show_quick_actions: true,
    items_per_page: 50,
    enable_search: true,
    enable_filters: true
  }
};

export const ACTION_COLORS = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  red: 'bg-red-600 hover:bg-red-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  gray: 'bg-gray-600 hover:bg-gray-700 text-white',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
};
