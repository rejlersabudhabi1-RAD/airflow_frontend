import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateUser } from '../store/slices/authSlice';
import { 
  User, Mail, Phone, Briefcase, MapPin, FileText, 
  Camera, Upload, X, Check, AlertCircle, Loader, 
  Building2, Calendar, Shield, Edit2, Save
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.config';
import { S3_UPLOAD_CONFIG, validateFile, formatFileSize } from '../config/s3Upload.config';

/**
 * Professional Profile Page with Photo Upload
 * Features:
 * - Profile photo upload to AWS S3
 * - Editable user information
 * - Real-time validation
 * - Professional UI/UX
 * - Activity tracking
 * - Security information
 */

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    location: '',
    department: '',
    job_title: ''
  });
  
  // Fetch full profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      setIsFetchingProfile(true);
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
      const response = await fetch(`${API_BASE_URL}/rbac/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      console.log('[Profile] Fetched data:', data); // Debug log
      setProfileData(data);
      
      // Set form data
      setFormData({
        first_name: data.user?.first_name || '',
        last_name: data.user?.last_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        department: data.department || '',
        job_title: data.job_title || ''
      });
      
      // Set photo preview if exists
      if (data.profile_photo) {
        console.log('[Profile] Setting photo preview:', data.profile_photo); // Debug log
        setPhotoPreview(data.profile_photo);
      }
      
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsFetchingProfile(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileSelect = (file) => {
    // Validate file
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(profileData?.profile_photo || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append photo if selected
      if (selectedFile) {
        formDataToSend.append('profile_photo', selectedFile);
        setUploadProgress(50);
      }
      
      const response = await fetch(`${API_BASE_URL}/rbac/users/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      setUploadProgress(80);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setUploadProgress(100);
      
      // Update Redux store
      dispatch(updateUser(updatedProfile));
      
      // Re-fetch profile to get the complete updated data with photo URL
      await fetchProfile();
      
      setSelectedFile(null);
      setIsEditing(false);
      
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };
  
  const handleCancel = () => {
    // Reset form data
    setFormData({
      first_name: profileData?.user?.first_name || '',
      last_name: profileData?.user?.last_name || '',
      phone: profileData?.phone || '',
      bio: profileData?.bio || '',
      location: profileData?.location || '',
      department: profileData?.department || '',
      job_title: profileData?.job_title || ''
    });
    
    // Reset photo
    setSelectedFile(null);
    setPhotoPreview(profileData?.profile_photo || null);
    setIsEditing(false);
  };
  
  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    const firstName = formData.first_name || user?.first_name || '';
    const lastName = formData.last_name || user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };
  
  // Show loading state while fetching profile
  if (isFetchingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Photo & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Photo Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                {/* Photo Upload Area */}
                <div
                  className={`relative mx-auto w-48 h-48 rounded-full overflow-hidden mb-4 ${
                    isDragging ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold">
                      {getUserInitials()}
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-gray-800" />
                      </button>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={S3_UPLOAD_CONFIG.allowedFileTypes.join(',')}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </button>
                    
                    {selectedFile && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center justify-center space-x-1">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{selectedFile.name}</span>
                        </p>
                        <p className="text-xs">{formatFileSize(selectedFile.size)}</p>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Max {formatFileSize(S3_UPLOAD_CONFIG.maxFileSize)} • JPG, PNG, GIF, WebP
                    </p>
                  </div>
                )}
                
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  {formData.first_name} {formData.last_name}
                </h3>
                <p className="text-gray-600">{formData.job_title || 'No job title'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Account Info</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profileData?.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {profileData?.status || 'Active'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900">
                    {profileData?.created_at 
                      ? new Date(profileData.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Organization</span>
                  <span className="text-gray-900 text-right">
                    {profileData?.organization_name || 'N/A'}
                  </span>
                </div>
                
                {profileData?.employee_id && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Employee ID</span>
                    <span className="text-gray-900">{profileData.employee_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              {/* Form Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Personal Information
                </h2>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Form */}
              <form className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Basic Information</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="John"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span>Contact Information</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="Dubai, UAE"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span>Professional Information</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="Engineering"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Senior Developer"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>About</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows="4"
                      maxLength="500"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Tell us about yourself, your skills, and interests..."
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
