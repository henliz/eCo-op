'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

/* ---------------- fade-in variants ---------------- */
const containerVariant = {
  hidden: {},
  show: { transition: { delayChildren: 1.75, staggerChildren: 0.5 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:  { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.22,1,0.36,1] } },
};

/* --------------- 3-line infinite CSS scroll + live highlight -------------- */
function RotatingLines({ lines, duration = 8 }) {
  const containerRef = useRef(null);
  const measureRef   = useRef(null);
  const [lineH, setLineH] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // measure one line's height
  useEffect(() => {
    if (measureRef.current) {
      setLineH(measureRef.current.offsetHeight);
    }
  }, []);

  // on every animation frame, read the CSS transform and compute center index
  useEffect(() => {
    let rafId;
    const n = lines.length;
    function sync() {
      if (containerRef.current && lineH) {
        // read computed transform
        const style = getComputedStyle(containerRef.current);
        const m = style.transform.match(/matrix.*\((.+)\)/);
        if (m) {
          const ty = parseFloat(m[1].split(',')[5]);        // translateY in px
          const raw = (-ty + lineH) / lineH;                // 1 lineH down is center
          const idx = Math.floor(raw) % n;
          setCurrentIndex((idx + n) % n);
        }
      }
      rafId = requestAnimationFrame(sync);
    }
    rafId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafId);
  }, [lineH, lines.length]);

  // duplicate so CSS scroll wraps seamlessly
  const combined = [...lines, ...lines];

  return (
    <div
      className="relative inline-block w-full overflow-hidden"
      style={{
        height: `calc(${lineH}px * 3)`,
        maskImage:       'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-col animate-scroll"
        style={{ animationDuration: `${duration}s` }}
      >
        {combined.map((text,i) => {
          const idx = i % lines.length;
          return (
            <motion.span
              key={i}
              ref={i===0?measureRef:null}
              className="h-[1.2em] flex items-center justify-center whitespace-nowrap text-black"
              animate={{ opacity: idx === currentIndex ? 1 : 0.5 }}
              transition={{ duration: 0.5 }}
            >
              {text}
            </motion.span>
          );
        })}
      </div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes scroll {
          0%,16.6667%        { transform: translateY(0); }
          33.3333%,49.9999%  { transform: translateY(-1.2em); }
          66.6667%,83.3333%  { transform: translateY(-2.4em); }
          100%               { transform: translateY(-3.6em); }
        }
        .animate-scroll {
          animation-name: scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------- HERO ---------------------------- */
export default function Hero() {
  return (
    <section
      className="hero pt-12 pb-24 px-4 sm:px-8 md:px-10 overflow-hidden md:overflow-visible md:pt-0 md:pb-30"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      <motion.div
        variants={containerVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once:true, amount:0.4 }}
        className="hero-content text-center"
      >
        <motion.h1
          className="relative inline-block leading-tight"
          initial={{ clipPath:'inset(0 100% 0 0)' }}
          animate={{ clipPath:'inset(0 0% 0 0)' }}
          transition={{ duration:1, ease:[0.22,1,0.36,1] }}
        >
          <span className="block font-montserratAlt font-extrabold text-3xl md:text-5xl md:mt-8">
            Inflation squeezing your budget?
          </span>
          <span className="block mt-6 mb-4 font-montserratAlt text-xl md:text-3xl">
            <RotatingLines
              lines={[
                'Keep the meals, lose the cost.',
                'Stop skimping on what matters.',
                'Enjoy variety without overspending.'
              ]}
              duration={8}
            />
          </span>
          <strong className="font-bold block mt-4 text-2xl md:text-4xl">
            Skrimp it!
          </strong>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-4 text-base md:text-lg">
          Skrimp uses AI to help Canadians save money on groceries by creating meal plans from this week’s local deals.
        </motion.p>

        <motion.div variants={fadeUp} className="hero-btns mt-6">
          <Link href="/plan">
            <button className="
              px-8 py-4 rounded-full font-semibold text-white
              bg-[#FDBA74]/70 backdrop-blur-sm backdrop-saturate-150
              ring-1 ring-inset ring-white/20 shadow-lg
              transition-transform duration-200 ease-out
              hover:scale-105 hover:bg-[#FDBA74]/90
            ">
              Try Skrimp Now!
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
