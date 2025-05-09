// components/sections/EmailSignupBanner.jsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.2,
      delayChildren: 0.2,
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

export default function EmailSignupBanner() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'success'

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('success');
    e.currentTarget.submit();
  };

  return (
    <motion.section
      className="py-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      <div className="max-w-[1200px] mx-auto px-4 scroll-mt-24" id="contact">
        <motion.div
          className="bg-[#4FD1C5] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6"
          variants={childVariants}
        >
          {/* 1) Image */}
          <div className="flex-shrink-0">
            <img
              src="/CTA_img.png"
              alt="Bag of groceries"
              className="w-40 h-auto rounded-lg"
            />
          </div>

          {/* 2) Headline + copy */}
          <motion.div
            className="flex-1 text-center md:text-left space-y-2"
            variants={childVariants}
          >
            <motion.h2
              className="text-3xl font-bold text-white"
              variants={childVariants}
            >
              Get Next Week’s Meal Plan & Groceries{' '}
              <span aria-hidden="true">🛒</span>
            </motion.h2>
            <p className="text-teal-50">
              Drop your email and we’ll send you a complete, AI‑powered meal plan
              plus a smart grocery list—absolutely free—every Friday.
            </p>
          </motion.div>

          {/* 3) Mailchimp form */}
          <form
            action="https://skimp.us2.list-manage.com/subscribe/post?u=fafb2eb4652611a6402e26e3d&id=7e6bb4de1d"
            method="POST"
            target="mc-iframe"
            noValidate
            className="relative w-full max-w-sm bg-white rounded-lg p-6 shadow-md flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            {/* hidden audience fields */}
            <input type="hidden" name="u" value="fafb2eb4652611a6402e26e3d" />
            <input type="hidden" name="id" value="7e6bb4de1d" />

            {/* honeypot */}
            <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
              <input
                type="text"
                name="b_fafb2eb4652611a6402e26e3d_7e6bb4de1d"
                tabIndex={-1}
                defaultValue=""
              />
            </div>

            {/* email input */}
            <label htmlFor="mce-EMAIL" className="block text-gray-800 font-medium">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="EMAIL"
              id="mce-EMAIL"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
            />

            {/* submit button + in‑flow success message */}
            <div className="relative">
              <motion.button
                type="submit"
                name="subscribe"
                id="mc-embedded-subscribe"
                className="w-full bg-white text-[#4FD1C5] font-semibold rounded-full px-6 py-2 hover:bg-teal-50 transition"
                variants={childVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                scrimp it!!
              </motion.button>

              {status === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute top-full left-0 w-full text-center text-gray-700 text-sm mt-1 pointer-events-none"
                >
                  Subscribed—see you in a week! 🎉
                </motion.p>
              )}
            </div>
          </form>

          {/* hidden iframe */}
          <iframe
            name="mc-iframe"
            style={{ display: 'none' }}
            title="mailchimp-subscribe"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
