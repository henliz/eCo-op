// components/sections/StoreSelector.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const STORES = [
  { id: 'zehrs',   name: 'Zehrs' },
  { id: 'walmart', name: 'Walmart' },
  { id: 'loblaws', name: 'Loblaws' },
  { id: 'costco',  name: 'Costco' },
];

export default function StoreSelector() {
  const [selected, setSelected] = useState('zehrs');
  const [isOpen, setIsOpen]     = useState(true);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto">

        {/* ── Header Bar ── */}
        <div
          className="
            flex items-center justify-between
            mb-8             /* space below header */
            bg-[#2DA399]
            rounded-lg
            px-6 py-4        /* horizontal + vertical padding */
          "
        >
          {/* smaller on mobile, scales up at breakpoints */}
          <h2
            className="
              font-bold
              text-sm         /* ~14px on <640px */
              sm:text-base    /* ~16px on ≥640px */
              md:text-lg      /* ~18px on ≥768px */
              lg:text-xl      /* ~20px on ≥1024px */
              xl:text-2xl     /* ~24px on ≥1280px */
              leading-snug
            "
          >
            Where are you shopping today?
          </h2>

          <button
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            onClick={() => setIsOpen(o => !o)}
            className="ml-4 text-2xl leading-none hover:text-gray-600"
          >
            {isOpen ? '▼' : '▲'}
          </button>
        </div>

        {/* ── Collapsible Content ── */}
        {isOpen && (
          <div className="mt-6 flex flex-nowrap items-start gap-12 overflow-x-auto">
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

            {/* ── Vertical pills ── */}
            <div className="flex flex-col gap-4">
            <small><br></br></small>
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
          </div>
        )}
      </div>
    </section>
  );
}
