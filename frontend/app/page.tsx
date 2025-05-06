
// app/page.tsx
import Header        from '@/components/layout/Header';
import Hero          from '@/components/sections/Hero';
import HowItWorks    from '@/components/sections/HowItWorks';
import FreeListPromo from '@/components/sections/FreeListPromo';
import Features      from '@/components/sections/Features';
import MealPlan      from '@/components/sections/MealPlan';
import EmailSignupBanner from '@/components/sections/EmailSignupBanner';
import AboutandFeedback from '@/components/sections/AboutandFeedback';

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />

        <HowItWorks />

        <FreeListPromo />

        <div className="h-35" aria-hidden="true" />
        <EmailSignupBanner />

        <Features />

        <MealPlan />

        <AboutandFeedback />

      </main>
    </>
  );
}
