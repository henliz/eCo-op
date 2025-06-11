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

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      setNotificationLoading(true);
      await updateNotificationPreference(enabled);
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const getInitials = (name: string) => {
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
                      w-10 h-10 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm
                      flex items-center justify-center text-white font-bold text-sm
                      hover:from-white/40 hover:to-white/20 transition-all duration-300
                      ring-2 ring-white/30 hover:ring-white/50 shadow-lg hover:shadow-xl
                      hover:scale-105 transform
                    "
                  >
                    {getInitials(currentUser.displayName || currentUser.email)}
                  </button>

                  {/* Modern Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="
                      absolute right-0 top-full mt-3 w-80
                      backdrop-blur-md bg-white/95 border border-white/30 rounded-2xl shadow-2xl
                      z-50 overflow-hidden
                      animate-in slide-in-from-top-2 fade-in-0 duration-300
                    ">
                      {/* Top Accent */}
                      <div className="h-1 bg-gradient-to-r from-[#45B08C] via-[#FDBA74] to-[#45B08C]" />

                      {/* User Info */}
                      <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          {/* Enhanced Avatar */}
                          <div className="
                            w-12 h-12 rounded-full bg-gradient-to-br from-[#45B08C] to-[#3A9B7A]
                            flex items-center justify-center text-white font-bold text-lg
                            shadow-lg ring-2 ring-[#45B08C]/20
                          ">
                            {getInitials(currentUser.displayName || currentUser.email)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-lg truncate" style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}>
                              {currentUser.displayName || 'User'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{currentUser.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notification Toggle */}
                      <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#45B08C]/10 flex items-center justify-center">
                              <span className="text-[#45B08C] text-lg">🔔</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-gray-800 font-semibold block" style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}>
                                New Flyer Notifications
                              </span>
                              <p className="text-xs text-gray-500">
                                Get notified about new deals
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={userPreferences?.newFlyerNotifications ?? false}
                            onCheckedChange={handleNotificationToggle}
                            disabled={!userPreferences || notificationLoading}
                            className="data-[state=checked]:bg-[#45B08C]"
                          />
                        </div>

                        {notificationLoading && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <div className="w-3 h-3 border border-[#45B08C] border-t-transparent rounded-full animate-spin" />
                            <span>Updating preferences...</span>
                          </div>
                        )}
                      </div>

                      {/* Coming Soon Section */}
                      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#45B08C]/5 to-[#FDBA74]/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#45B08C] to-[#FDBA74] flex items-center justify-center">
                            <span className="text-white text-sm">✨</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}>
                              Exciting new member features coming soon!
                            </p>
                            <p className="text-xs text-gray-600">
                              Stay tuned for amazing updates
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sign Out */}
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="
                            w-full text-left px-4 py-3 text-red-600 hover:bg-red-50
                            transition-all duration-200 font-semibold rounded-xl
                            hover:shadow-md transform hover:scale-[1.02]
                          "
                          style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-sm">👋</span>
                            </div>
                            Sign Out
                          </div>
                        </button>
                      </div>

                      {/* Bottom Accent */}
                      <div className="h-1 bg-gradient-to-r from-[#45B08C] via-[#FDBA74] to-[#45B08C]" />
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

        {/* Enhanced Mobile Drawer */}
        {mobile && open && (
          <nav
            className={`
              md:hidden absolute top-14 left-0 w-full shadow-2xl
              transform-gpu transition-all duration-500 ease-out
              ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
            `}
            style={{
              background: 'rgba(69,176,140,0.95)',
              backdropFilter: 'blur(12px)',
              fontFamily: 'Montserrat, system-ui, sans-serif'
            }}
          >
            {/* Mobile Nav Links */}
            {NAV.map(({ label, href, external }) =>
              external ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="
                    block text-center text-lg font-medium text-white
                    px-6 py-5 border-b border-white/20 last:border-0
                    hover:bg-white/10 transition-all duration-200
                    active:bg-white/20 transform active:scale-95
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
                    block text-center text-lg font-medium text-white
                    px-6 py-5 border-b border-white/20 last:border-0
                    hover:bg-white/10 transition-all duration-200
                    active:bg-white/20 transform active:scale-95
                  "
                >
                  {label}
                </Link>
              )
            )}

            {/* Mobile CTA */}
            <Link
              href="/plan"
              onClick={() => setOpen(false)}
              className="
                block text-center text-lg font-bold text-white
                bg-[#FDBA74] hover:bg-[#FDBA74]/90 transition-all duration-200
                px-6 py-5 border-b border-white/20
                active:bg-[#FDBA74]/80 transform active:scale-95
              "
            >
              Try It Free
            </Link>

            {/* Mobile Auth Section */}
            {currentUser ? (
              <>
                {/* Mobile User Info */}
                <div className="px-6 py-5 border-b border-white/20 bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="
                      w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm
                      flex items-center justify-center text-white font-bold text-lg
                      shadow-lg
                    ">
                      {getInitials(currentUser.displayName || currentUser.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-lg truncate">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-sm text-white/80 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Notification Toggle */}
                <div className="px-6 py-5 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white text-lg">🔔</span>
                      </div>
                      <div>
                        <span className="text-sm text-white font-semibold block">
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
                      className="data-[state=checked]:bg-white/30"
                    />
                  </div>
                </div>

                {/* Mobile Coming Soon */}
                <div className="px-6 py-5 border-b border-white/20 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FDBA74] flex items-center justify-center">
                      <span className="text-white text-sm">✨</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Exciting new member features coming soon!
                      </p>
                      <p className="text-xs text-white/80">
                        Stay tuned for updates
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Sign Out */}
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="
                    block w-full text-center text-lg font-semibold text-red-200
                    px-6 py-5
                    hover:bg-red-500/20 transition-all duration-200
                    active:bg-red-500/30 transform active:scale-95
                  "
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">👋</span>
                    Sign Out
                  </div>
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
                  transition-all duration-200 px-6 py-5
                  active:bg-white/20 transform active:scale-95
                "
              >
                Log In
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Enhanced Click Outside */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </>
  );
}