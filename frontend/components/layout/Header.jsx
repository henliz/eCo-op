"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile on component mount and window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      // Initial check
      checkMobile();
      
      // Listen for window resize
      window.addEventListener("resize", checkMobile);
      
      // Cleanup
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  return (
    <header>
      <div className="container">
        <nav className="navbar">
          <Link href="/" className="logo">
            <img 
              src="/SmartCart_White.png" 
              alt="SmartCart logo" 
              className="logo-icon" 
            />
            <div>Smart<span>Cart</span></div>
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="nav-links">
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/meal-planner" className="header-cta">Try It Free</Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-links">
            <Link href="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="/features" onClick={() => setIsMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/meal-planner" onClick={() => setIsMobileMenuOpen(false)}>
              Try It Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}