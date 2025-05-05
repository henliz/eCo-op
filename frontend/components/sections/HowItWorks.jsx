// app/components/sections/HowItWorks.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

/* -------------------------------------------------
   Steps data (swap image paths for your own files)
------------------------------------------------- */
const steps = [
  {
    id: 1,
    img: '/Flyer_Graphic.png',
    title: 'Tell Us Your Preferences',
    desc: 'Let us know your dietary preferences, allergies, and favorite stores.',
  },
  {
    id: 2,
    img: '/Robo_Research.png',
    title: 'We Find The Deals',
    desc: 'Our system scans local flyers to find the best sales in your area.',
  },
  {
    id: 3,
    img: '/Robo_Chef.png',
    title: 'Get Your Meal Plan',
    desc: "Receive a customized meal plan based on what's on sale this week.",
  },
];

/* -------------------------------------------------
   Framer‑motion variants
------------------------------------------------- */
const containerVariant = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.5,
      staggerChildren: 0.7,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/* -------------------------------------------------
   Component
------------------------------------------------- */
export default function HowItWorks() {
  return (
    <section id="how-it-works"
      className="scroll-mt-35 py-50">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-extrabold">How It Works</h2>

        <p className="mx-auto mt-6 flex justify-center">
          <span className="max-w-4xl text-lg text-gray-600">
            SmartCart makes grocery shopping easier, faster, and more affordable in just a few simple steps.
          </span>
        </p>

        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-20 grid gap-12 md:grid-cols-3"
        >
          {steps.map(({ id, img, title, desc }) => (
            <motion.div
              key={id}
              variants={itemVariant}
              className="flex flex-col items-center text-center"
            >
              {/* square wrapper enforces identical visual size */}
              <div className="relative mb-6 h-32 w-32">
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>

              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
                {id}
              </div>

              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 max-w-sm text-gray-600">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
