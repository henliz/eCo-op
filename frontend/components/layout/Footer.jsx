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
              <Link href="/#features" className="hover:underline" scroll={true}>
                Features
              </Link>
            </li>
            <li>
              <span className="opacity-60">Careers (coming soon)</span>
            </li>
            <li>
              <Link href="/blog" className="hover:underline">
                Blog
              </Link>
            </li>
          </ul>
        </div>

        {/* 2. Support / Legal */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Support</h4>
          <ul className="space-y-1">
            <li>
              <Link href="/contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Social */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Follow Us</h4>
          <div className="flex items-center space-x-4">
            <a
              href="https://instagram.com/yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
              aria-label="Instagram"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="https://tiktok.com/@yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
              aria-label="TikTok"
            >
              <FaTiktok size={20} />
            </a>
            <a
              href="https://linkedin.com/company/yourcompany"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>

        {/* 4. Patreon */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Support Our Work</h4>
          <p className="text-sm">
            If you love skrimp and want to help us grow, consider supporting us on Patreon.
          </p>
          <a
            href="https://patreon.com/yourpage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-[#FF424D] px-4 py-2 rounded-full hover:bg-[#e03e46] transition"
          >
            <FaPatreon size={18} className="mr-2" />
            Become a Patron
          </a>
        </div>
      </div>


      <div className="mt-12 border-t border-white/20 pt-6 text-center text-sm opacity-70">
      {/* Responsible AI pledge */}
        <div className="md:col-span-4 text-center mt-8 text-sm text-gray-400">
          ✨ Responsible AI. We’re committed to developing and using AI ethically —augmenting, not replacing, human creativity and expertise, but embracing it— and safeguarding your privacy and trust.
        </div>
        <br></br>
        © {new Date().getFullYear()} skrimp. All rights reserved.
      </div>
    </footer>
  );
}
