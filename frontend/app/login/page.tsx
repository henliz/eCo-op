'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ModernLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { login, signInWithGoogle, currentUser } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      router.push('/');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is already logged in
  if (currentUser) {
    return null;
  }

  return (
    <>
      {/* Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Montserrat+Alternates:wght@700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          background: 'linear-gradient(135deg, #45B08C 0%, #3A9B7A 50%, #2D8B69 100%)',
          fontFamily: 'Montserrat, system-ui, sans-serif'
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                            radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }} />
        </div>

        {/* Main Container */}
        <div className="w-full max-w-md relative">
          {/* Glass Card */}
          <div className="backdrop-blur-md bg-white/90 border border-white/30 rounded-2xl shadow-2xl p-8 relative overflow-hidden">

            {/* Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FDBA74] via-white to-[#45B08C]" />

            {/* Header Section */}
            <div className="text-center mb-6">
              {/* Mascot */}
              <div className="flex justify-center mb-4">
                <img
                  src="/Robo_Research.png"
                  alt="Skrimp AI mascot"
                  className="h-12 w-auto drop-shadow-lg"
                />
              </div>

              {/* Brand Name */}
              <h1 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Montserrat Alternates, system-ui, sans-serif' }}>
                Welcome to skrimp.ai
              </h1>

              <p className="text-gray-600 text-sm">
                Your AI-powered meal planning assistant
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Main Content */}
            {!showEmailForm ? (
              <div className="space-y-4">
                {/* Google Sign In - Primary Option */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white/90 px-4 text-gray-500 font-medium">or</span>
                  </div>
                </div>

                {/* Email Option */}
                <Button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  variant="outline"
                  disabled={loading}
                  className="w-full h-12 border-2 border-[#45B08C] text-[#45B08C] hover:bg-[#45B08C] hover:text-white transition-all duration-200 font-semibold text-lg"
                >
                  Sign in with Email
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 text-[#45B08C] hover:text-[#3A9B7A] transition-colors font-medium mb-4 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to main options
                </button>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      disabled={loading}
                      className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      disabled={loading}
                      className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full h-12 bg-[#45B08C] hover:bg-[#3A9B7A] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-[#45B08C] hover:text-[#3A9B7A] font-semibold hover:underline transition-all duration-200"
                >
                  Create one now
                </Link>
              </p>
              <p className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-gray-500 hover:text-[#45B08C] hover:underline transition-all duration-200"
                >
                  Forgot your password?
                </Link>
              </p>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#45B08C] via-white to-[#FDBA74]" />
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#FDBA74] rounded-full opacity-70 animate-pulse" />
          <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-white/30 rounded-full backdrop-blur-sm" />
        </div>
      </div>
    </>
  );
}
