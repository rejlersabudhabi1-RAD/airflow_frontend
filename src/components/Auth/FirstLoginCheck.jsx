import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import FirstLoginPasswordReset from './FirstLoginPasswordReset';
import { API_BASE_URL } from '../../config/api.config';
import { STORAGE_KEYS } from '../../config/app.config';

/**
 * First Login Check Component
 * Automatically checks if user needs to reset password after authentication
 * Soft-coded with proper error handling
 */
const FirstLoginCheck = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!isAuthenticated || checked) {
        return;
      }

      setChecking(true);

      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        
        if (!token) {
          setChecked(true);
          setChecking(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/users/check-first-login/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('[FirstLoginCheck] Response:', response.data);

        if (response.data.must_reset_password) {
          setMustResetPassword(true);
        }
        
        setChecked(true);
      } catch (error) {
        console.error('[FirstLoginCheck] Error:', error);
        // Don't block app if check fails
        setChecked(true);
      } finally {
        setChecking(false);
      }
    };

    checkFirstLogin();
  }, [isAuthenticated, checked]);

  // Show loading while checking
  if (checking) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show first login password reset modal if needed
  if (mustResetPassword && isAuthenticated) {
    return (
      <>
        {children}
        <FirstLoginPasswordReset
          user={user}
          onSuccess={() => {
            setMustResetPassword(false);
            setChecked(true);
          }}
        />
      </>
    );
  }

  return children;
};

export default FirstLoginCheck;
