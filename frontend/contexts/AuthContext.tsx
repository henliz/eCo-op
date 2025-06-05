'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserPreferences {
  newFlyerNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  currentUser: User | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string, notifications?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateNotificationPreference: (enabled: boolean) => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserPreferences(userId: string) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserPreferences({
          newFlyerNotifications: data.newFlyerNotifications ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } else {
        // Create default preferences if document doesn't exist
        const defaultPrefs = {
          newFlyerNotifications: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, defaultPrefs);
        setUserPreferences({
          newFlyerNotifications: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Set default preferences on error
      setUserPreferences({
        newFlyerNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async function signup(email: string, password: string, displayName?: string, notifications: boolean = true) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName && result.user){
            await updateProfile(result.user, {
                displayName: displayName,
            });
        }

        // Create user document in Firestore with preferences
        if (result.user) {
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email, // Keep original case from Firebase Auth
                displayName: displayName || '', // Fixed: was creating object instead of string
                newFlyerNotifications: notifications,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await sendEmailVerification(result.user);
        }
        
        await signOut(auth);
    } catch (error: any) {
        console.error('Signup Error:', error);
        
        // Provide specific error messages based on Firebase error codes
        let errorMessage = 'Failed to create account';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/password accounts are not enabled';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
  }
    
  async function login(email: string, password: string): Promise<void> {
    try{
        const result = await signInWithEmailAndPassword(auth, email, password);

        if (!result.user.emailVerified){
            await signOut(auth);
            throw new Error("Please verify your email address before logging in.");
        }

    } catch (error: any) {
        console.error('Login Error:', error);
        
        // Provide specific error messages based on Firebase error codes
        let errorMessage = 'Failed to sign in';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
  }

  function logout() {
    setUserPreferences(null);
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  async function signInWithGoogle(): Promise<void> {
    try{
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        if (result.user) {
            // Check if user document exists, create if not
            const userDocRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: result.user.email, // Keep original case from Firebase Auth
                    displayName: result.user.displayName || '',
                    newFlyerNotifications: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
        }
        
    } catch (error: any) {
        console.error('Google Sign-in Error', error);
        
        // Provide specific error messages
        let errorMessage = 'Failed to sign in with Google';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in was cancelled';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked. Please allow popups and try again';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Sign in was cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
  }

  async function updateNotificationPreference(enabled: boolean): Promise<void> {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        newFlyerNotifications: enabled,
        updatedAt: serverTimestamp(),
      });

      // Update local state immediately for better UX
      setUserPreferences(prev => prev ? {
        ...prev,
        newFlyerNotifications: enabled,
        updatedAt: new Date(), // Use actual Date for local state
      } : null);
    } catch (error: any) {
        console.error('Error updating notification preference:', error);
        throw new Error('Failed to update notification preference. Please try again.');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setCurrentUser(user);
        await loadUserPreferences(user.uid);
      } else {
        setCurrentUser(null);
        setUserPreferences(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    userPreferences,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateNotificationPreference,
  }), [currentUser, userPreferences, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}