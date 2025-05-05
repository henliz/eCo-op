// components/sections/StoreSelector.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const STORES = [
  { id: 'zehrs',   name: 'Zehrs' },
  { id: 'walmart', name: 'Walmart' },
  { id: 'loblaws', name: 'Loblaws' },
  { id: 'costco',  name: 'Costco' },
  { id: 'freshco', name: 'Freshco' },
];

export default function StoreSelector() {
  const [selected, setSelected] = useState('zehrs');
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto">
        {/* ── Header Bar ── */}
        <div
          onClick={() => setIsOpen(o => !o)}
          className="
            flex items-center justify-between
            mb-10
            bg-[#5BC4B4]
            rounded-lg
            px-6 py-4
            cursor-pointer
          "
        >
          <h2
            className="
              font-bold
              text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl
              leading-snug
              whitespace-normal sm:whitespace-nowrap
            "
          >
            Where are you shopping today?
          </h2>
          <span className="text-2xl leading-none">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>

        {/* ── Smoothly animated collapsible content ── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
              className="mt-8 flex flex-nowrap items-start gap-2 overflow-x-auto"
            >
              {/* ── Graphic & disclaimer ── */}
              <div className="flex-shrink-0 text-center">
                <Image
                  src="/Robo_Chef.png"
                  alt="Friendly chef robot"
                  width={180}
                  height={180}
                  className="mx-auto"
                />
                <p className="mt-2 text-gray-600">More stores coming soon!</p>
              </div>

              {/* ── TWO-COLUMN “pill” buttons, max 4 per col ── */}
              <div className="grid grid-rows-4 grid-flow-col gap-x-1 gap-y-2">
                {STORES.map(store => (
                  <button
                    key={store.id}
                    onClick={() => setSelected(store.id)}
                    className={`
                      px-6 py-3 rounded-full text-center text-lg font-medium
                      transition
                      ${selected === store.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-orange-200 text-gray-800 hover:bg-orange-300'}
                    `}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
