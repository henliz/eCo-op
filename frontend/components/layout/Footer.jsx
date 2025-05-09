// components/layout/Footer.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  FaInstagram,
  FaTiktok,
  FaLinkedin,
  FaPatreon,
} from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-[#2E2E2E] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* 1. Product / Company */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Company</h4>
          <ul className="space-y-1">
            <li>
              <Link href="/#about" className="hover:underline" scroll={true}>
                About
              </Link>
            </li>
            <li>
              <span className="opacity-60">Careers (coming soon)</span>
            </li>
            <li>
              <span className="opacity-60">
                Blog (coming soon)
              </span>
            </li>
          </ul>
        </div>

        {/* 2. Support / Legal */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Support</h4>
          <ul className="space-y-1">
            <li>
              <Link href="/#contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Social */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Follow Us</h4>
          <p>coming soon...</p>
          <div className="flex items-center space-x-4">

          </div>
        </div>

        {/* 4. Patreon */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Support Our Work</h4>
          <p className="text-sm">
            If you love skrimp and want to help us grow, consider supporting us in the future when we launch a patreon/ko-fi.
          </p>
        </div>
      </div>


      <div className="mt-12 border-t border-white/20 pt-6 text-center text-sm opacity-70">
      {/* Responsible AI pledge */}
        <div className="md:col-span-4 text-center mt-8 text-sm text-gray-400">
          Responsible AI. We’re committed to developing and using AI ethically —augmenting, not replacing, human creativity and expertise, but embracing it— and safeguarding your privacy and trust.
        </div>
        <br></br>
        © {new Date().getFullYear()} skrimp. All rights reserved.
      </div>
    </footer>
  );
}
