'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenValid, refreshFirebaseToken, clearAuthStorage, makeAuthenticatedRequest } from '@/contexts/authUtils';

interface UserPreferences {
  newFlyerNotifications: boolean;
  weeklyNotifications: boolean;
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
  weeklyNotifications: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  currentUser: BackendUser | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  accessToken: string | null;
  authError: string | null;
  signup: (email: string, password: string, displayName?: string, notifications?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateNotificationPreference: (preferenceType: 'newFlyerNotifications' | 'weeklyNotifications', enabled: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
  makeAPICall: (endpoint: string, method?: string, body?: any, useAuth?: boolean) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<BackendUser | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthState = () => {
    setCurrentUser(null);
    setUserPreferences(null);
    setAccessToken(null);
    setAuthError(null);
    clearAuthStorage();
  };

  const setUserData = (userData: any, token: string) => {
    setAccessToken(token);
    setCurrentUser(userData);
    setUserPreferences({
      newFlyerNotifications: userData.newFlyerNotifications || false,
      weeklyNotifications: userData.weeklyNotifications || false, // ADD THIS
      createdAt: new Date(userData.createdAt || new Date()),
      updatedAt: new Date(userData.updatedAt || new Date()),
    });
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const makeAPICall = async (endpoint: string, method = 'GET', body?: any, useAuth = false) => {
    let token = accessToken;

    if (useAuth) {
      if (!token || !isTokenValid(token)) {
        console.log('Token invalid, refreshing...');
        const newToken = await refreshFirebaseToken();
        if (!newToken) {
          clearAuthState();
          throw new Error('Authentication expired. Please log in again.');
        }
        token = newToken;
        setAccessToken(newToken);
        localStorage.setItem('accessToken', newToken);
      }
    }

    try {
      return await makeAuthenticatedRequest(endpoint, method, body, useAuth ? (token ?? undefined) : undefined);
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
        clearAuthState();
        throw new Error('Authentication expired. Please log in again.');
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const response = await makeAPICall('/auth/login', 'POST', { email, password });

      if (response.success && response.data) {
        const { accessToken: token, user } = response.data;
        if (!isTokenValid(token)) throw new Error('Invalid token received');
        setUserData(user, token);

        // Redirect to dashboard after successful login
        router.push('/dashboard');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        const idToken = await result.user.getIdToken();
        const response = await makeAPICall('/auth/google-login', 'POST', { idToken });

        if (response.success && response.data) {
          const { accessToken: token, user } = response.data;
          if (!isTokenValid(token)) throw new Error('Invalid token received');
          setUserData(user, token);

          // Redirect to dashboard after successful Google login
          router.push('/dashboard');
        } else {
          throw new Error(response.error || 'Google login failed');
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (accessToken && isTokenValid(accessToken)) {
        await makeAPICall('/auth/logout', 'POST', null, true);
      }
    } catch (error) {
      console.warn('Backend logout failed:', error);
    }

    clearAuthState();

    try {
      const { auth } = await import('@/lib/firebase');
      await auth.signOut();
    } catch (error) {
      console.warn('Firebase logout failed:', error);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!accessToken) return;

    try {
      const response = await makeAPICall('/auth/profile', 'GET', null, true);
      if (response.success && response.data) {
        const userData = response.data;
        setCurrentUser(userData);
        setUserPreferences({
          newFlyerNotifications: userData.newFlyerNotifications || false,
          weeklyNotifications: userData.weeklyNotifications || false, // ADD THIS
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date(userData.updatedAt || new Date()),
        });
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('Authentication')) {
        clearAuthState();
      }
    }
  };

  const signup = async (email: string, password: string, displayName?: string, notifications = true) => {
    try {
      setAuthError(null);
      const response = await makeAPICall('/auth/register', 'POST', {
        email,
        password,
        displayName: displayName || '',
        newFlyerNotifications: notifications,
        weeklyNotifications: false, // ADD DEFAULT VALUE
      });
      if (!response.success) throw new Error(response.error || 'Registration failed');
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthError(null);
      const response = await makeAPICall('/auth/reset-password', 'POST', { email });
      if (!response.success) throw new Error(response.error || 'Failed to send reset email');
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const updateNotificationPreference = async (preferenceType: 'newFlyerNotifications' | 'weeklyNotifications', enabled: boolean) => {
    if (!currentUser || !accessToken) throw new Error('No user logged in');

    try {
      setAuthError(null);

      // Send only the specific preference being updated
      const body = { [preferenceType]: enabled };
      const response = await makeAPICall('/auth/notifications', 'PUT', body, true);

      if (response.success) {
        // Update both state and localStorage
        setUserPreferences(prev => prev ? {
          ...prev,
          [preferenceType]: enabled,
          updatedAt: new Date()
        } : null);

        setCurrentUser(prev => prev ? {
          ...prev,
          [preferenceType]: enabled,
          updatedAt: new Date().toISOString()
        } : null);

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData[preferenceType] = enabled;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        throw new Error(response.error || 'Failed to update notification preference');
      }
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          if (isTokenValid(storedToken)) {
            const user = JSON.parse(storedUser);
            setUserData(user, storedToken);
            await refreshProfile();
          } else {
            const newToken = await refreshFirebaseToken();
            if (newToken) {
              const user = JSON.parse(storedUser);
              setUserData(user, newToken);
              await refreshProfile();
            } else {
              clearAuthState();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    currentUser, userPreferences, loading, accessToken, authError,
    signup, login, logout, resetPassword, signInWithGoogle, updateNotificationPreference, refreshProfile,
    makeAPICall,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
