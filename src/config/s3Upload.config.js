/**
 * AWS S3 Upload Configuration
 * Soft-coded configuration for profile photo uploads
 */

export const S3_UPLOAD_CONFIG = {
  // Upload settings
  maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
  allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  
  // Image processing
  imageCompression: {
    enabled: true,
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8
  },
  
  // Upload paths
  paths: {
    profilePhotos: 'profile_photos/',
    documents: 'documents/',
    temp: 'temp/'
  },
  
  // Error messages
  messages: {
    fileTooLarge: 'File size must be less than 5MB',
    invalidFileType: 'Only JPG, PNG, GIF, and WebP images are allowed',
    uploadFailed: 'Failed to upload file. Please try again.',
    uploadSuccess: 'File uploaded successfully',
    processingError: 'Error processing image. Please try another file.'
  },
  
  // UI settings
  ui: {
    showPreview: true,
    showProgress: true,
    dragAndDropEnabled: true,
    previewMaxWidth: '200px',
    previewMaxHeight: '200px'
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file) => {
  const errors = [];
  
  // Check file size
  if (file.size > S3_UPLOAD_CONFIG.maxFileSize) {
    errors.push(S3_UPLOAD_CONFIG.messages.fileTooLarge);
  }
  
  // Check file type
  if (!S3_UPLOAD_CONFIG.allowedFileTypes.includes(file.type)) {
    errors.push(S3_UPLOAD_CONFIG.messages.invalidFileType);
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!S3_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    errors.push(S3_UPLOAD_CONFIG.messages.invalidFileType);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension icon
 */
export const getFileIcon = (fileName) => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  const iconMap = {
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.webp': '🖼️',
    '.pdf': '📄',
    '.doc': '📝',
    '.docx': '📝',
    '.xls': '📊',
    '.xlsx': '📊',
    '.txt': '📄'
  };
  
  return iconMap[extension] || '📎';
};

export default S3_UPLOAD_CONFIG;
