
// app/page.tsx
import Header        from '@/components/layout/Header';
import Hero          from '@/components/sections/Hero';
import HowItWorks    from '@/components/sections/HowItWorks';
import FreeListPromo from '@/components/sections/FreeListPromo';
import Features      from '@/components/sections/Features';
import MealPlan      from '@/components/sections/MealPlan';

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />

        {/* guaranteed 10 rem gap */}
        <div className="h-40" />

        <HowItWorks />

        {/* another gap if you want it */}
        <div className="h-40" />
        <FreeListPromo />

        <div className="h-40" />
        <Features />

        <div className="h-40" />
        <MealPlan />
      </main>
    </>
  );
}
