// components/layout/Header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mobile, setMob] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  const { currentUser, userPreferences, logout, updateNotificationPreference } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setMob(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationToggle = async (enabled) => {
    try {
      setNotificationLoading(true);
      await updateNotificationPreference(enabled);
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NAV = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '#about' },
    {
      label: 'Feedback Form',
      href: 'https://docs.google.com/forms/d/e/1FAIpQLSeaWg3pAelFtLZTBslhFiI_wxldA6muBfeidd_eTpIYTs5ZQQ/viewform?usp=header',
      external: true,
    },
  ];

  return (
    <>
      {/* fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Montserrat+Alternates:wght@700&display=swap"
        rel="stylesheet"
      />

      <header
        className="sticky top-0 z-50 h-14 w-full font-montserrat relative isolate"
        style={{ background: 'transparent' }}
      >
        {/* glass tint (8 % spearmint) */}
        <div
          className="
            absolute inset-0 -z-10 pointer-events-none
            backdrop-blur-md backdrop-saturate-150
            ring-1 ring-inset ring-white/15
          "
          style={{ background: 'rgba(69,176,140,0.65)' }}
        />

        {/* nav row */}
        <div className="h-full max-w-screen-xl mx-auto flex items-center justify-between px-4">
          {/* logo + word‑mark */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/SmartCart_White.png"
              alt="SmartCart logo"
              className="h-6 w-15"
            />
            <span className="font-montserratAlt font-bold text-lg tracking-tight whitespace-nowrap text-white">
              skrimp.ai
            </span>
          </Link>

          {/* desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(({ label, href, external }) =>
              external ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    relative text-white/90
                    after:absolute after:left-0 after:-bottom-1 after:h-0.5
                    after:w-0 after:bg-white/80 after:transition-[width] after:duration-300
                    hover:after:w-full hover:text-white transition-colors duration-200
                  "
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  scroll
                  className="
                    relative text-white/90
                    after:absolute after:left-0 after:-bottom-1 after:h-0.5
                    after:w-0 after:bg-white/80 after:transition-[width] after:duration-300
                    hover:after:w-full hover:text-white transition-colors duration-200
                  "
                >
                  {label}
                </Link>
              )
            )}

            {/* CTA and Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/plan"
                className="
                  rounded-full bg-[#FDBA74] px-4 py-2 font-semibold text-white
                  transition-transform duration-200 ease-out
                  hover:scale-105 hover:brightness-110
                "
              >
                Try It Free
              </Link>

              {/* Login/Profile Button */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="
                      w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm
                      flex items-center justify-center text-white font-semibold text-sm
                      hover:bg-white/30 transition-colors duration-200
                      ring-2 ring-white/30 hover:ring-white/50
                    "
                  >
                    {getInitials(currentUser.displayName || currentUser.email)}
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="
                      absolute right-0 top-full mt-2 w-72 py-2
                      bg-white rounded-lg shadow-xl border border-gray-200
                      z-50
                    ">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">
                          {currentUser.displayName || 'User'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{currentUser.email}</p>
                        {currentUser.emailVerified ? (
                          <p className="text-xs text-green-600 mt-1">✓ Email verified</p>
                        ) : (
                          <p className="text-xs text-orange-600 mt-1">⚠ Email not verified</p>
                        )}
                      </div>

                      {/* Account Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Member since:</span>
                            <p className="text-gray-700 font-medium">
                              {userPreferences?.createdAt.toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Account ID:</span>
                            <p className="text-gray-700 font-mono">#{currentUser.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notification Toggle */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">🔔</span>
                            <div>
                              <span className="text-sm text-gray-700 font-medium">
                                New Flyer Notifications
                              </span>
                              <p className="text-xs text-gray-500">
                                Get notified about new deals and flyers
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userPreferences?.newFlyerNotifications ?? false}
                            onCheckedChange={handleNotificationToggle}
                            disabled={!userPreferences || notificationLoading}
                          />
                        </div>
                        {userPreferences && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last updated: {userPreferences.updatedAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="
                            block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50
                            transition-colors duration-150 font-medium
                          "
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="
                    rounded-full border-2 border-white/30 px-4 py-2 font-semibold text-white
                    transition-all duration-200 ease-out
                    hover:border-white/60 hover:bg-white/10
                  "
                >
                  Log In
                </button>
              )}
            </div>
          </nav>

          {/* hamburger */}
          <button
            className="md:hidden text-3xl leading-none transition-transform duration-200 hover:scale-110 text-white"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* mobile drawer */}
        {mobile && open && (
          <nav
            className={`
              md:hidden absolute top-14 left-0 w-full shadow-xl
              transform-gpu transition-[opacity,transform] duration-300 ease-out
              ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
            `}
            style={{ background: 'rgba(69,176,140,0.92)', backdropFilter: 'blur(8px)' }}
          >
            {NAV.map(({ label, href, external }) =>
              external ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="
                    block text-center text-lg font-medium text-gray-900
                    px-6 py-6 border-b last:border-0
                    hover:bg-white/10 transition-colors
                  "
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="
                    block text-center text-lg font-medium text-gray-900
                    px-6 py-6 border-b last:border-0
                    hover:bg-white/10 transition-colors
                  "
                >
                  {label}
                </Link>
              )
            )}
            
            <Link
              href="/plan"
              onClick={() => setOpen(false)}
              className="
                block text-center text-lg font-semibold text-white
                bg-[#FDBA74] hover:bg-[#FDBA74]/90 transition-colors
                px-6 py-6 border-b
              "
            >
              Try It Free
            </Link>

            {/* Mobile Auth Section */}
            {currentUser ? (
              <>
                <div className="px-6 py-4 border-b border-white/20">
                  <p className="font-semibold text-white">
                    {currentUser.displayName || 'User'}
                  </p>
                  <p className="text-sm text-white/80">{currentUser.email}</p>
                  <p className="text-xs text-white/60 mt-1">
                    Account #{currentUser.id} • Member since {userPreferences?.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Mobile Notification Toggle */}
                <div className="px-6 py-4 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white">🔔</span>
                      <div>
                        <span className="text-sm text-white font-medium">
                          New Flyer Notifications
                        </span>
                        <p className="text-xs text-white/80">
                          Get notified about deals
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={userPreferences?.newFlyerNotifications ?? false}
                      onCheckedChange={handleNotificationToggle}
                      disabled={!userPreferences || notificationLoading}
                    />
                  </div>
                  {userPreferences && (
                    <p className="text-xs text-white/60 mt-2">
                      Last updated: {userPreferences.updatedAt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="
                    block w-full text-center text-lg font-medium text-red-200
                    px-6 py-6
                    hover:bg-red-500/20 transition-colors
                  "
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleLogin();
                  setOpen(false);
                }}
                className="
                  block w-full text-center text-lg font-semibold text-white
                  border-2 border-white/30 hover:border-white/60 hover:bg-white/10
                  transition-colors px-6 py-6
                "
              >
                Log In
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </>
  );
}