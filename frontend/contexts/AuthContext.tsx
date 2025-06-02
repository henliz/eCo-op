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
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName?: string) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName && result.user){
            await updateProfile(result.user, {
                displayName: displayName,
            });
        }

        if (result.user) {
            await sendEmailVerification(result.user);
        }
        await signOut(auth);
    } catch (error) {
        console.error('Signup Error:', error);
        throw error;
    }
  }
    
  async function login(email: string, password: string): Promise<void> {
    try{
        const result = await signInWithEmailAndPassword(auth, email, password);

        if (!result.user.emailVerified){
            await signOut(auth);
            throw new Error("Please verify your email address before logging in.");
        }

    } catch (error) {
        console.error('Login Error:', error);
        throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  async function signInWithGoogle(): Promise<void> {
    try{
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
    } catch (error) {
        console.error('Google Sign-in Error', error);
        throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
  }), [currentUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}