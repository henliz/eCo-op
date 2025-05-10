// components/layout/Header.jsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header() {
  /* ------------------------------------------------- */
  const [open, setOpen] = useState(false);
  const [mobile, setMob] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setMob(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const NAV = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About',        href: '#about' },
    {
      label: 'Feedback Form',
      href:  'https://docs.google.com/forms/d/e/1FAIpQLSeaWg3pAelFtLZTBslhFiI_wxldA6muBfeidd_eTpIYTs5ZQQ/viewform?usp=header',
      external: true,
    },
  ];

  /* ------------------------------------------------- */
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
        {/* glass tint (8 % spearmint) */}
        <div
          className="
            absolute inset-0 -z-10 pointer-events-none
            backdrop-blur-md backdrop-saturate-150
            ring-1 ring-inset ring-white/15
          "
          style={{ background: 'rgba(69,176,140,0.7)' }}   /* ← mint */
        />

        {/* nav row */}
        <div className="h-full max-w-screen-xl mx-auto flex items-center justify-between px-4">
          {/* logo + word‑mark */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/SmartCart_White.png"
              alt="SmartCart logo"
              className="h-6 w-15"             /* 24 px cap */
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

            {/* CTA */}
            <Link
              href="/plan"
              className="
                rounded-full bg-[#FDBA74] px-4 py-2 font-semibold text-white
                transition-transform duration-200 ease-out
                hover:scale-105 hover:brightness-110
              "
            >
              Try It Free
            </Link>
          </nav>

          {/* hamburger */}
          <button
            className="md:hidden text-3xl leading-none transition-transform duration-200 hover:scale-110"
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
                px-6 py-6
              "
            >
              Try It Free
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
