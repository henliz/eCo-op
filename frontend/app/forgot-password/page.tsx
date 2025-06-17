'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ModernForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Removed unused router variable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return setError('Please enter your email address');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address');
    }

    try {
      setError('');
      setLoading(true);

      // Replace with your actual backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.skrimp.ai';

      const response = await fetch(`${backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSuccess(false);
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  // Success state - email sent
  if (success) {
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

              <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Montserrat Alternates, system-ui, sans-serif' }}>
                Check Your Email
              </h1>

              <p className="text-gray-600 text-sm mb-6">
                {"We've sent a password reset link to"}<br />
                <strong className="text-gray-800">{email}</strong>
              </p>

              <Alert className="border-blue-200 bg-blue-50 mb-6 text-left">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <AlertDescription className="text-blue-800 text-sm">
                  Click the link in the email to reset your password. The link will expire in 1 hour for security.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-2 border-[#45B08C] text-[#45B08C] hover:bg-[#45B08C] hover:text-white transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#45B08C] border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Resend Email'
                  )}
                </Button>

                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Sign In
                  </Button>
                </Link>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
                <p className="font-medium">{"Didn't receive the email?"}</p>
                <div className="space-y-1">
                  <p>• Check your spam/junk folder</p>
                  <p>• Make sure you entered the correct email</p>
                  <p>• Try the resend button above</p>
                </div>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#45B08C] via-white to-[#FDBA74]" />
          </div>
        </div>
      </div>
    );
  }

  // Main form state
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
                src="/Robo_Plan.png"
                alt="Skrimp AI mascot"
                width={48}
                height={48}
                className="drop-shadow-lg"
              />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Montserrat Alternates, system-ui, sans-serif' }}>
              Reset Your Password
            </h1>

            <p className="text-gray-600 text-sm">
              {"Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your email address"
                disabled={loading}
                autoFocus
                className="h-12 border-2 border-gray-200 focus:border-[#45B08C] focus:ring-2 focus:ring-[#45B08C]/20 rounded-xl text-lg"
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-12 bg-[#45B08C] hover:bg-[#3A9B7A] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Sign In
              </Button>
            </Link>

            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-[#45B08C] hover:text-[#3A9B7A] font-semibold hover:underline transition-all duration-200"
              >
                Sign in here
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