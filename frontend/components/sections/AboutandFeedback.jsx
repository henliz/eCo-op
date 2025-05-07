// components/sections/AboutAndFeedback.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  },
};

export default function AboutAndFeedback() {
  return (
    <div className="scroll-mt-10 py-0" id="about">
      {/* --- Our Story --- */}
      <motion.section
        className="pt-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-3xl mx-auto text-center px-4">

          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Hi, I’m Henrietta! I started this because I saw families
            and students struggling with grocery bills—and I knew AI could flip the script.
            Our mission is to deliver budget‑friendly, nutritious meal plans every week
            so you can eat well without the sticker shock.
          </p>
          <img
              src="/Henrietta_Headshot_small.jpg"
              alt="Henrietta, founder of SmartCart"
              className="mx-auto w-24 h-24 rounded-full border-2 border-[#4FD1C5] mb-6"
          />
        </div>
      </motion.section>

      {/* --- Mission & Feedback Invite --- */}
      {/* slight minor delay on this section */}
      <motion.section
          className="py-8"
          initial="hidden"
          whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6">

          {/* Left text column */}
          <div className="md:basis-1/2 space-y-1">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              We’re On A Mission—<br></br>Let’s Build This Together
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Skrimp exists to help families eat well on a budget. Our AI has already
              saved you an average of <span className="font-semibold">$58/week</span>, but
              we want to do even more. Tell us what recipes, features, or local deals
              you’d love to see next week.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeaWg3pAelFtLZTBslhFiI_wxldA6muBfeidd_eTpIYTs5ZQQ/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#4FD1C5] text-white font-medium rounded-full px-6 py-3 hover:bg-[#3bb7a8] transition"
            >
              Feedback Form
            </a>
          </div>  {/* <-- This closing tag was missing */}

          {/* Right image */}
          <div className="md:basis-1/2 flex justify-center">
            <img
              src="/Feedback_img.png"
              alt="We’d love your feedback"
              className="w-full max-w-md rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
