// components/sections/AboutAndFeedback.jsx
'use client';

import React from 'react';
import Image from 'next/image';
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
          <Image
              src="/Henrietta_Headshot_small.jpg"
              alt="Henrietta, founder of SmartCart"
              width={96}
              height={96}
              className="mx-auto w-24 h-24 rounded-full border-2 border-[#4FD1C5] mb-6"
          />
          <p className="text-gray-700 leading-relaxed">
            Hi, I&apos;m Henrietta—full‑time student, part‑time coupon hunter, and now the founder of Skrimp.ai.
            Between tuition hikes and rent that keeps climbing, I watched classmates skip meals and parents in the checkout line put groceries back on the shelf.
            Those moments hit hard, because I was making the same trade‑offs. So I cracked open my laptop (instead of another pack of instant noodles) and built
            an AI that scours every flyer in town, hunts the deepest weekly discounts, and turns them into balanced meals you can actually look forward to.
            </p>
            <p>
            Here&apos;s the magic: Skrimp starts with the deals → AI &apos;magics&apos; you a meal plan that maximise those savings → builds a ready‑to‑shop list, complete with a running &quot;cash you kept&quot; counter.
            Early testers are shaving $50‑plus off grocery bills—without sacrificing nutrition or flavour.
            I&apos;m still pulling all‑nighters for exams, but I&apos;m just as committed to helping you keep more money in your pocket and good food on your table.
            Join me while we flip the script on grocery prices together.
            </p>
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
              We&apos;re On A Mission—<br></br>Let&apos;s Build This Together
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Skrimp exists to help families eat well on a budget. Our AI has already
              saved you an average of <span className="font-semibold">~30%</span> compared to the typical Canadian family&apos;s grocery bill, but
              we want to do even more. <br></br><br></br>Tell us what recipes, features, or local deals
              you&apos;d love to see next week.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeaWg3pAelFtLZTBslhFiI_wxldA6muBfeidd_eTpIYTs5ZQQ/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#4FD1C5] text-white font-medium rounded-full px-6 py-3 hover:bg-[#3bb7a8] transition"
            >
              Feedback Form
            </a>
          </div>

          {/* Right image */}
          <div className="md:basis-1/2 flex justify-center">
            <Image
              src="/Feedback_img.png"
              alt="We'd love your feedback"
              width={400}
              height={300}
              className="w-full max-w-md rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}