import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import HowItWorks from '@/components/sections/HowItWorks';
import MealPlan from '@/components/sections/MealPlan';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <MealPlan />
        {/* Other sections will be added in subsequent steps */}
      </main>
    </>
  );
}