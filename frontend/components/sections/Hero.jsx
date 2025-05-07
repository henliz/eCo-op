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
      className="hero pt-0 pb-30 px-10 overflow-hidden md:overflow-visible md:py-0"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.4}}
          className="hero-content"
      >
        {/* slow, gentle wipe-on */}
        <motion.h1
            className="relative inline-block"
            initial={{clipPath: 'inset(0 100% 0 0)'}}
            animate={{clipPath: 'inset(0 0% 0 0)'}}
            transition={{duration: 1.0, ease: [0.22, 1, 0.36, 1]}}
        >
          Inflation squeezing your budget? <br></br>
          Keep the meals, lose the cost. <br></br>
          <strong className="font-bold block mt-4">Skrimp it!</strong>

        </motion.h1>

        <motion.p variants={fadeUp} className="mt-10">
          Skrimp uses AI to help Canadians save money on groceries by creating meal plans from this week&rsquo;s local
          deals.
        </motion.p>

        <motion.div variants={fadeUp} className="hero-btns mt-5">
          <Link href="/plan">
            <button className="btn-primary">Try Skrimp Now!</button>
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
