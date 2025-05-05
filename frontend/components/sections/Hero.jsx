// components/sections/Hero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const containerVariant = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 2.5,    // wait 2.5s for headline to finish
      staggerChildren: 0.5,  // half-second between each fade
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.5,        // slower fade
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Hero() {
  return (
    <section className="hero">
      <motion.div
        variants={containerVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="hero-content"
      >
        {/* slow, gentle wipe-on */}
        <motion.h1
          className="relative inline-block"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
        >
          When inflation’s squeezing your wallet, scrimp on prices, not possibilities…
          <strong>Skrimp it.</strong>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-6">
          Skrimp uses AI to help Canadians save money on groceries during the
          cost of living crisis by creating meal plans based on this week's local
          deals and flyers.
        </motion.p>

        <motion.div variants={fadeUp} className="hero-btns mt-8">
          <Link href="/plan">
            <button className="btn-primary">Start skrimping today!</button>
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-6">
          <small>
            <strong>
              We&apos;re coming to these platforms soon, stay tuned for launch day!
            </strong>
          </small>
        </motion.p>

        <motion.div variants={fadeUp} className="download-app mt-6">
          <button className="app-store-btn">
            <span className="app-store-icon">📱</span>
            <div className="app-store-text">
              <small>Download on the</small>
              <strong>App Store</strong>
            </div>
          </button>
          <button className="app-store-btn">
            <span className="app-store-icon">▶️</span>
            <div className="app-store-text">
              <small>GET IT ON</small>
              <strong>Google Play</strong>
            </div>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
