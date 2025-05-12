'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ----------------------------- RotatingLines ----------------------------- */
function RotatingLines({ lines, pause = 2000, animDur = 600 }) {
  const containerRef = useRef(null);
  const spansRef     = useRef([]);
  const [lineH, setLineH] = useState(0);
  const [items, setItems] = useState([
    lines[lines.length - 1],
    ...lines,
    lines[0],
  ]);

  // measure one line’s height (including padding, line-height, etc)
  const measure = useCallback(() => {
    const el = spansRef.current[1];
    if (el) setLineH(el.offsetHeight);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (!lineH) return;
    const c = containerRef.current;
    let animTimeout, cycleTimeout;

    // center the first real item
    c.style.transform = `translateY(-${lineH}px)`;
    spansRef.current.forEach((el, i) =>
      el.classList.toggle('featured', i === 2)
    );

    function runCycle() {
      // prep transitions
      c.style.transition = `transform ${animDur}ms ease-in-out`;
      spansRef.current.forEach((el) => {
        el.style.transition = `
          opacity   ${animDur}ms ease-in-out,
          transform ${animDur}ms ease-in-out
        `;
      });

      // swap featured classes
      spansRef.current[2].classList.remove('featured');
      spansRef.current[3].classList.add('featured');

      // slide up
      c.style.transform = `translateY(-${2 * lineH}px)`;

      // after slide, rotate & snap
      animTimeout = setTimeout(() => {
        setItems((old) => {
          const [first, ...rest] = old;
          return [...rest, first];
        });
        c.style.transition = 'none';
        spansRef.current.forEach((el) => (el.style.transition = 'none'));
        c.style.transform = `translateY(-${lineH}px)`;
        spansRef.current.forEach((el, i) =>
          el.classList.toggle('featured', i === 2)
        );
      }, animDur);

      // schedule next
      cycleTimeout = setTimeout(runCycle, pause + animDur);
    }

    cycleTimeout = setTimeout(runCycle, pause);
    return () => {
      clearTimeout(animTimeout);
      clearTimeout(cycleTimeout);
    };
  }, [lineH, pause, animDur]);

  return (
    <div
      className="relative inline-block w-full overflow-visible"
      style={{
        height: lineH ? `${lineH * 3}px` : 'auto',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
    >
      <div ref={containerRef} className="flex flex-col">
        {items.map((text, i) => (
          <span
            key={i}
            ref={(el) => (spansRef.current[i] = el)}
            className={`
              h-[1.2em] flex items-center justify-center whitespace-nowrap
              font-montserratAlt font-semibold text-xl md:text-3xl text-black
              opacity-20 transform scale-100
            `}
          >
            {text}
          </span>
        ))}
      </div>
      <style jsx>{`
        .featured {
          opacity: 1 !important;
          transform: scale(1.2) !important;
        }
      `}</style>
    </div>
  );
}
/* ------------------------------------------------------------------------ */

/* ---------------------------------- HERO --------------------------------- */
export default function Hero() {
  const lines = [
    'Keep the meals, lose the cost.',
    'Stop skimping on what matters.',
    'Enjoy variety without overspending.',
    'Big flavours, smaller bills.',
    'Feed your family, not your receipt.',
    'We fixed the “what’s for dinner” fight.',
    'No fine print—just fine feasts.',
    'Turn pantry panic into plan.',
    'From snackless nights to smart bites.',
    'Grocery drama? Declined.',
  ];

  return (
    <section
      className="hero pt-12 pb-24 px-4 sm:px-8 md:px-10 overflow-visible"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      <div className="flex flex-col items-center space-y-6 text-center">
        <h1 className="font-extrabold text-3xl md:text-5xl text-black">
          Inflation squeezing your budget?
        </h1>

        <div className="mb-4 self-stretch">
          <RotatingLines lines={lines} pause={2000} animDur={600} />
        </div>

        <strong className="font-bold text-2xl md:text-4xl text-black">
          Skrimp it!
        </strong>

        <p className="text-base md:text-lg max-w-xl">
          Skrimp uses AI to help Canadians save money on groceries by creating meal
          plans from this week’s local deals.
        </p>

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
      </div>
    </section>
  );
}
