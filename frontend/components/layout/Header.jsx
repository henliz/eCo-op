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
            <Link href="/#how-it-works" scroll={true}>How It Works</Link>
            <Link href="/#features" scroll={true}>Features</Link>
            <Link href="/plan" className="header-cta">Try It Free</Link>
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
          <nav className="md:hidden absolute top-full left-0 w-full bg-green-100 shadow-lg z-50">
            <div className="mx-auto max-w-md rounded-lg overflow-hidden mt-2">
              {[
                ['How It Works',  '/#how-it-works'],
                ['Features',      '#features'],
              ].map(([label, href], i) => (
                <Link
                  key={i}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="
                    block w-full
                    px-6 py-6         /* extra vertical padding */
                    text-lg font-medium
                    text-gray-800
                    hover:bg-green-200
                    border-b last:border-0
                    text-center
                  "
                >
                  {label}
                </Link>
              ))}

              {/* Full-width apricot “Try It Free” row */}
              <Link
                href="/meal-planner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  block w-full
                  px-6 py-6         /* match the others */
                  text-lg font-semibold
                  text-white
                  bg-orange-300 hover:bg-orange-400
                  text-center
                "
              >
                Try It Free
              </Link>
            </div>
          </nav>
        )}


      </div>
    </header>
  );
}
