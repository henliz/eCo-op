// components/layout/Header.jsx
'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // detect mobile vs desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <header>
      <div className="container">
        <nav className="navbar flex items-center justify-between">
          {/* logo */}
          <Link href="/" className="logo flex items-center gap-2">
            <img 
              src="/SmartCart_White.png" 
              alt="SmartCart logo" 
              className="logo-icon h-8 w-auto" 
            />
            <span className="font-bold text-xl">skrimp</span>
          </Link>
          
          {/* Desktop nav: hidden on mobile, flex from md up */}
          <div className="nav-links hidden md:flex items-center space-x-6">
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/plan" className="hover:underline">Meal Planner</Link>
            <Link href="/meal-planner" className="header-cta">Try It Free</Link>
          </div>
          
          {/* Mobile toggle: only on small screens */}
          <button 
            className="mobile-menu-button md:hidden text-2xl"
            onClick={() => setIsMobileMenuOpen(open => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>
        
        {/* Mobile menu: only when on mobile AND toggled open */}
        {isMobile && isMobileMenuOpen && (
          <div className="mobile-nav-links md:hidden absolute top-full left-0 w-full bg-white shadow-lg flex flex-col z-50">
            <Link 
              href="/how-it-works" 
              className="block w-full px-4 py-3 border-b last:border-0" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="/features" 
              className="block w-full px-4 py-3 border-b last:border-0" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="block w-full px-4 py-3 border-b last:border-0" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="block w-full px-4 py-3 border-b last:border-0" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/plan" 
              className="block w-full px-4 py-3 border-b last:border-0" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Meal Planner
            </Link>
            <Link 
              href="/meal-planner" 
              className="block w-full px-4 py-3 last:border-0 header-cta text-center" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Try It Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
