'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const containerVariant = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 1.75,   // wait 1.75s for headline wipe
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
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Hero() {
  return (
    <section
      className="hero pt-4 pb-12 overflow-hidden md:overflow-visible md:py-0"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
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
          When inflation&rsquo;s squeezing your wallet, scrimp on prices, not possibilities…{' '}
          <strong className="font-bold">Skrimp it.</strong>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-6">
          Skrimp uses AI to help Canadians save money on groceries by creating meal plans from this week&rsquo;s local deals.
        </motion.p>

        <motion.div variants={fadeUp} className="hero-btns mt-8">
          <Link href="/plan">
            <button className="btn-primary">Start skrimping today!</button>
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-6">
          <small>
            {/* Optional smaller note */}
          </small>
        </motion.p>
      </motion.div>
    </section>
  );
}
