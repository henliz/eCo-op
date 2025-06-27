'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserPreferences {
  newFlyerNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BackendUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
  newFlyerNotifications: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  currentUser: BackendUser | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  accessToken: string | null;
  signup: (email: string, password: string, displayName?: string, notifications?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateNotificationPreference: (enabled: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context){
    throw new Error('useAuth must be within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<BackendUser | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to make API calls to your backend
  async function makeAPICall(endpoint: string, method = 'GET', body?: any, useAuth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (useAuth && accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
      credentials: 'include'
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error: any) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  }

  async function refreshProfile() {
    if (!accessToken) return;
    
    try {
      const response = await makeAPICall('/auth/profile', 'GET', null, true);
      
      if (response.success && response.data) {
        const userData = response.data;
        setCurrentUser(userData);
        setUserPreferences({
          newFlyerNotifications: userData.newFlyerNotifications || false,
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date(userData.updatedAt || new Date()),
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // If profile fetch fails, user might be logged out
      logout();
    }
  }

  async function signup(email: string, password: string, displayName?: string, notifications: boolean = true) {
    try {
      const response = await makeAPICall('/auth/register', 'POST', {
        email,
        password,
        displayName: displayName || '',
        newFlyerNotifications: notifications,
      });

      if (response.success) {
        console.log('Registration successful:', response.data);
        // Note: User needs to verify email before they can sign in
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Signup Error:', error);
      
      let errorMessage = 'Failed to create account';
      if (error.message.includes('email-already-in-use') || error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password is too weak (minimum 6 characters)';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
    
  async function login(email: string, password: string): Promise<void> {
    try {
      const response = await makeAPICall('/auth/login', 'POST', {
        email,
        password,
      });

      if (response.success && response.data) {
        console.log('Login successful:', response.data);
        
        // Store access token and user data
        setAccessToken(response.data.accessToken);
        setCurrentUser(response.data.user);
        setUserPreferences({
          newFlyerNotifications: response.data.user.newFlyerNotifications || false,
          createdAt: new Date(response.data.user.createdAt || new Date()),
          updatedAt: new Date(response.data.user.updatedAt || new Date()),
        });

        // Store in localStorage for persistence
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      
      let errorMessage = 'Failed to sign in';
      if (error.message.includes('user-not-found') || error.message.includes('No account found')) {
        errorMessage = 'No account found with this email address';
      } else if (error.message.includes('wrong-password') || error.message.includes('Incorrect password')) {
        errorMessage = 'Incorrect password';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.message.includes('user-disabled')) {
        errorMessage = 'This account has been disabled';
      } else if (error.message.includes('verify your email')) {
        errorMessage = 'Please verify your email address before logging in';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async function logout() {
    try {
      if (accessToken) {
        await makeAPICall('/auth/logout', 'POST', null, true);
      }
    } catch (error) {
      console.error('Backend logout failed:', error);
    }
    
    // Clear local state and storage
    setCurrentUser(null);
    setUserPreferences(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  async function resetPassword(email: string) {
    try {
      const response = await makeAPICall('/auth/reset-password', 'POST', { email });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  // Replace your signInWithGoogle function in AuthContext with this:

async function signInWithGoogle(): Promise<void> {
  try {
    console.log('🚀 Starting Google sign-in...');
    
    // Initialize Firebase Auth for Google sign-in
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('📱 Opening Google popup...');
    const result = await signInWithPopup(auth, provider);
    
    if (result.user) {
      console.log('✅ Google popup successful, user:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
      // Get the ID token and send to backend
      console.log('🔑 Getting ID token...');
      const idToken = await result.user.getIdToken();
      console.log('📝 ID token received, length:', idToken.length);
      
      console.log('🌐 Sending to backend...');
      const response = await makeAPICall('/auth/google-login', 'POST', {
        idToken: idToken
      });

      console.log('📨 Backend response:', response);

      // Check if backend response indicates success
      if (response.success && response.data) {
        console.log('🎉 Google login successful:', response.data);
        
        // Store access token and user data
        setAccessToken(response.data.accessToken);
        setCurrentUser(response.data.user);
        setUserPreferences({
          newFlyerNotifications: response.data.user.newFlyerNotifications || false,
          createdAt: new Date(response.data.user.createdAt || new Date()),
          updatedAt: new Date(response.data.user.updatedAt || new Date()),
        });

        // Store in localStorage for persistence
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Backend returned success: false
        console.error('❌ Backend rejected Google login:', response);
        let errorMessage = 'Google sign-in failed';
        
        if (response.message) {
          errorMessage = response.message;
        } else if (response.error === 'GOOGLE_LOGIN_FAILED') {
          errorMessage = 'Google authentication failed. Please try again.';
        }
        
        throw new Error(errorMessage);
      }
    }
  } catch (error: any) {
    console.error('💥 Google Sign-in Error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    let errorMessage = 'Failed to sign in with Google';
    
    // Handle Firebase popup errors
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign in was cancelled';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup was blocked. Please allow popups and try again';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign in was cancelled';
    } 
    // Handle network/API errors
    else if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    // Handle backend authentication errors
    else if (error.message.includes('Google authentication failed') || 
             error.message.includes('Google sign-in failed')) {
      errorMessage = error.message;
    }
    // Generic error handling
    else if (error.message && !error.message.includes('GOOGLE_LOGIN_FAILED')) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

  async function updateNotificationPreference(enabled: boolean): Promise<void> {
    if (!currentUser || !accessToken) {
      throw new Error('No user logged in');
    }

    try {
      const response = await makeAPICall('/auth/notifications', 'PUT', {
        newFlyerNotifications: enabled,
      }, true);

      if (response.success) {
        console.log('Notification preference updated:', response);
        
        // Update local state immediately for better UX
        setUserPreferences(prev => prev ? {
          ...prev,
          newFlyerNotifications: enabled,
          updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
        } : null);

        // Update current user state
        setCurrentUser(prev => prev ? {
          ...prev,
          newFlyerNotifications: enabled,
          updatedAt: response.updatedAt || new Date().toISOString(),
        } : null);

        // Update localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.newFlyerNotifications = enabled;
          userData.updatedAt = response.updatedAt || new Date().toISOString();
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        throw new Error(response.error || 'Failed to update notification preference');
      }
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      throw new Error(error.message || 'Failed to update notification preference. Please try again.');
    }
  }

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          setAccessToken(storedToken);
          setCurrentUser(user);
          setUserPreferences({
            newFlyerNotifications: user.newFlyerNotifications || false,
            createdAt: new Date(user.createdAt || new Date()),
            updatedAt: new Date(user.updatedAt || new Date()),
          });
          
          // Refresh profile to ensure data is current
          refreshProfile();
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    userPreferences,
    loading,
    accessToken,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateNotificationPreference,
    refreshProfile,
  }), [currentUser, userPreferences, loading, accessToken]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}