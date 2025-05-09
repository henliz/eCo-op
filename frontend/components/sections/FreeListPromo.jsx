// components/sections/FreeListPromo.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function FreeListPromo() {
  return (
    /* top‑level section:
       ▸  my‑40  = 10 rem top+bottom gap so it never hugs the hero
       ▸  container centers it like your other sections
       ▸  z‑20 lifts it above the hero background */
    <section className="relative z-20 container mx-auto my-20">
      <Card className="overflow-hidden shadow-lg">
        {/* gap‑8 adds breathing room between the image and the copy */}
        <div className="flex flex-col gap-8 md:flex-row">
          {/* ── Left: perfectly square image (50 % width on desktop) ── */}
          <div className="relative w-full aspect-square md:w-1/2">
            <Image
              src="/Savings_Dude.png"
              alt="Man shopping for affordable groceries"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>

          {/* ── Right: headline, copy, CTA ── */}
          <CardContent className="flex w-full flex-col justify-center gap-1 px-8 md:w-1/2">
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900">
              Your Free Grocery List
            </h2>

            <p className="text-lg text-gray-700">
              Most families spend $350/week on groceries according to Canada’s Food Price Report.<small><br></br><br></br></small>
              Skrimp families spend only ~
              <span className="font-semibold text-emerald-600">$250</span>
              . </p> <p className="text-lg text-gray-700">
              Stop skimping. Start Skrimping. Your free list is waiting.
            </p>

            <Link
              href="/plan"
              className="header-cta self-start inline-block"
            >
              Get Your Free Grocery List
            </Link>


          </CardContent>
        </div>
      </Card>
    </section>
  );
}
