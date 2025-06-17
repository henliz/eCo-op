'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ModernSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const { signup, signInWithGoogle, currentUser } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      router.push('/');
    } catch (error: unknown) {
      console.error('Google sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up with Google';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (!displayName.trim()) {
      return setError('Please enter your full name');
    }

    try {
      setError('');
      setLoading(true);

      // Set notifications to true by default (behind the scenes)
      await signup(email, password, displayName.trim(), true);

      setShowVerificationMessage(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');

    } catch (error: unknown) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is already logged in
  if (currentUser) {
    return null;
  }

  // Verification success message
  if (showVerificationMessage) {
    return (
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

        {/* Success Card */}
        <div className="w-full max-w-md relative">
          <div className="backdrop-blur-md bg-white/90 border border-white/30 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FDBA74] via-white to-[#45B08C]" />

            {/* Success Content */}
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Montserrat Alternates, system-ui, sans-serif' }}>
                Check Your Email!
              </h1>

              <Alert className="border-green-200 bg-green-50 mb-6">
                <AlertDescription className="text-green-800 text-center">
                  <strong>Account created successfully!</strong><br />
                  {"We've sent a verification email to your inbox. Please click the link to verify your account."}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {"Don't see the email? Check your spam folder."}
                </p>

                <Button
                  onClick={() => setShowVerificationMessage(false)}
                  variant="outline"
                  className="w-full border-2 border-[#45B08C] text-[#45B08C] hover:bg-[#45B08C] hover:text-white transition-all duration-200"
                >
                  Back to Sign Up
                </Button>

                <p className="text-sm text-gray-600">
                  Already verified?{' '}
                  <Link href="/login" className="text-[#45B08C] hover:text-[#3A9B7A] font-semibold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#45B08C] via-white to-[#FDBA74]" />
          </div>
        </div>
      </div>
    );
  }

  return (
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
              <Image
                src="/Robo_Research.png"
                alt="Skrimp AI mascot"
                width={48}
                height={48}
                className="drop-shadow-lg"
              />
            </div>

            {/* Brand Name */}
            <h1 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Montserrat Alternates, system-ui, sans-serif' }}>
              Join skrimp.ai
            </h1>

            <p className="text-gray-600 text-sm">
              Start saving on groceries with AI
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
              {/* Google Sign Up - Primary Option */}
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Creating account...
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
                Sign up with Email
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
                  setConfirmPassword('');
                  setDisplayName('');
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
                  <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    disabled={loading}
                    className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                    autoComplete="name"
                  />
                </div>

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
                    placeholder="Create a password"
                    disabled={loading}
                    className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword || !displayName.trim()}
                  className="w-full h-12 bg-[#45B08C] hover:bg-[#3A9B7A] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#45B08C] hover:text-[#3A9B7A] font-semibold hover:underline transition-all duration-200"
              >
                Sign in
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
  );
}
