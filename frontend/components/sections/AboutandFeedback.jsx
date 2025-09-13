// components/sections/AboutAndFeedback.jsx
// components/sections/AboutAndFeedback.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  },
};

// --- Our Story (moved OUTSIDE the JSX tree) ---
const OurStorySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const recognitions = [
    {
      name: 'Conrad School of Entrepreneurship',
      logo: '/api/placeholder/400/200',
      type: 'Funding & Mentorship',
      description: 'Selected for entrepreneurship program',
      url: 'https://uwaterloo.ca/conrad-school-entrepreneurship-business/news/meet-spring-2025-enterprise-co-op-pitch-winners',
    },
    {
      name: 'Velocity Cornerstone',
      logo: '/api/placeholder/400/200',
      type: 'Accelerator Program',
      description: 'Accepted into startup accelerator',
      url: 'https://www.linkedin.com/posts/henriettavanniekerk_startuplife-founderstory-velocityuw-activity-7341148492960034817-8oAA?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEGBYu8Bh1L_WVl_qnH6ELBnpaBYadMIeYw',
    },
    {
      name: 'Waterloo Small Business Centre',
      logo: '/api/placeholder/400/200',
      type: 'Business Support',
      description: 'Awarded business development support',
      url: 'https://www.waterlooregionsmallbusiness.com',
    },
    {
      name: 'Featured in CambridgeToday',
      logo: '/api/placeholder/400/200',
      type: 'Media Coverage',
      description: 'Featured startup spotlight',
      url: 'https://www.cambridgetoday.ca/local-news/icymi-cambridge-student-creates-ai-tool-to-help-families-save-on-groceries-11174473',
    },
  ];

  const aboutStats = [
    { label: 'Age', value: '20' },
    { label: 'Year at UWaterloo', value: '4th' },
    { label: 'Program', value: 'Design/Tech' },
    { label: 'Coffee consumed', value: '∞' },
    { label: 'Hours coded', value: 'Many...' },
    { label: 'Ramen packets saved', value: '47' },
  ];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % recognitions.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPaused, recognitions.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % recognitions.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + recognitions.length) % recognitions.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const handleCardClick = (url) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFlipCard = (e) => {
    e.stopPropagation();
    setIsFlipped((v) => !v);
  };

  return (
    <div className="pt-8">
      <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-6">Our Story</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-blue-500 mx-auto rounded-full mb-8" />
            </div>
          </div>

          {/* Story Content with Flip Card Photo */}
          <div
            className={`transition-all duration-1000 delay-200 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="grid lg:grid-cols-5 gap-12 items-center mb-16">
              {/* Interactive Flip Card Photo */}
              <div className="lg:col-span-2 flex justify-center lg:justify-start">
                <div className="relative group animate-float" style={{ perspective: '1000px' }}>
                  <div
                      className="relative w-64 h-80 transition-all duration-700 hover:scale-105"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                  >
                    {/* Front of card - Photo */}
                    <div
                        className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-xl"
                        style={{backfaceVisibility: 'hidden'}}
                    >
                      <Image
                          src="/HenriettaFounder.jpg"
                          alt="Henrietta, founder of Skrimp.ai"
                          width={256}          // matches w-64
                          height={320}         // matches h-80
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          priority             // optional: improves LCP for above-the-fold
                      />
                      <div
                          className="absolute inset-0 bg-gradient-to-t from-teal-600/30 to-transparent transition-opacity duration-300 group-hover:from-teal-600/40"/>
                    </div>

                    {/* Back of card - Stats */}
                    <div
                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-xl p-4 flex flex-col justify-center"
                        style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}
                    >
                      <h4 className="text-white text-lg font-bold mb-4 text-center">Quick Stats</h4>
                      <div className="space-y-2">
                        {aboutStats.map((stat, index) => (
                            <div key={index} className="flex justify-between items-center text-white text-sm">
                              <span className="text-white/80">{stat.label}:</span>
                              <span className="font-semibold">{stat.value}</span>
                            </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-white/90 text-xs italic">
                          &quot;Building solutions one bug at a time 🐛&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive flip button */}
                  <button
                      onClick={handleFlipCard}
                      className="absolute -bottom-3 -right-3 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10"
                      type="button"
                  >
                    <div
                        className="w-6 h-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-transform duration-500 hover:rotate-45"
                        style={{transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)'}}
                    />
                  </button>
                </div>
              </div>

              {/* Intro Text */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <p className="text-xl text-slate-700 leading-relaxed mb-6">
                    <strong className="text-teal-600">Meet Skrimp.ai</strong> — where student financial pressure sparked
                    a solution that&apos;s changing how families grocery shop.
                  </p>

                  <p className="text-lg text-slate-600 leading-relaxed mb-6">
                    I&apos;m <strong>Henrietta</strong>, founder of Skrimp.ai and design/tech student at UWaterloo. What
                    started as an Entrepreneurship Co-op project through the Conrad School has evolved into something
                    I&apos;m going all-in on — because the validation has been incredible.
                  </p>

                  <p className="text-lg text-slate-600 leading-relaxed">
                    The insight hit during my second year living off-campus: watching classmates skip meals, parents
                    abandon full grocery carts at checkout, and experiencing firsthand how financial pressure forces
                    impossible trade-offs between nutrition and budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Details - Plain Text */}
          <div
            className={`transition-all duration-1000 delay-300 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="max-w-4xl mx-auto text-center mb-12">
              <p className="text-lg text-slate-600 leading-relaxed">
                Built with AI-powered price analysis across multiple grocery chains, real-time deal aggregation, and
                smart meal planning algorithms optimized for nutritional balance and savings. Early users report average
                savings of $50+ monthly while maintaining complete nutritional requirements.
              </p>
            </div>
          </div>

          {/* The Breakthrough Approach - SPECIAL BOX */}
          <div
            className={`transition-all duration-1000 delay-400 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12 border-l-4 border-teal-400">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">The breakthrough approach:</h3>
              <p className="text-xl text-slate-700 leading-relaxed">
                Skrimp starts with the deepest weekly deals across every local flyer, then reverse-engineers balanced
                meal plans that maximize those savings. The result? A ready-to-shop list with a running &quot;cash you
                kept&quot; counter.
              </p>
            </div>
          </div>

          {/* Impact & Vision - Plain Text */}
          <div
            className={`transition-all duration-1000 delay-500 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="max-w-4xl mx-auto text-center mb-16">
              <p className="text-lg text-slate-600 leading-relaxed">
                The traction speaks for itself, but what drives me is the stories — users sharing how Skrimp gave them
                breathing room they desperately needed. No more grocery store anxiety or impossible trade-offs. Smart
                shopping shouldn&apos;t require a finance degree, and I&apos;m building this for everyone who&apos;s ever
                felt that checkout-line stress.
              </p>
            </div>
          </div>

          {/* Recognition Carousel */}
          <div
            className={`transition-all duration-1000 delay-600 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl font-semibold text-slate-700 mb-2">Recognition &amp; Support</h3>
              <p className="text-slate-600">The traction speaks for itself</p>
            </div>

            <div className="relative max-w-6xl mx-auto overflow-hidden">
              {/* Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-teal-600 hover:shadow-xl transition-all duration-300 z-20"
                type="button"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-teal-600 hover:shadow-xl transition-all duration-300 z-20"
                type="button"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>

              {/* Carousel Track */}
              <div className="flex items-center justify-center gap-6">
                {/* Previous Card */}
                <div className="scale-75 opacity-40 transition-all duration-500">
                  <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ width: '320px', height: '200px' }}>
                    <div
                      className="w-full h-full bg-cover bg-center relative"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(20, 184, 166, 0.85), rgba(37, 99, 235, 0.85)), url(${
                          recognitions[(currentSlide - 1 + recognitions.length) % recognitions.length].logo
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative h-full p-4 flex flex-col justify-end text-white">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-2 self-start">
                          {recognitions[(currentSlide - 1 + recognitions.length) % recognitions.length].type}
                        </span>
                        <h4 className="text-lg font-bold mb-1">
                          {recognitions[(currentSlide - 1 + recognitions.length) % recognitions.length].name}
                        </h4>
                        <p className="text-white/90 text-sm">
                          {recognitions[(currentSlide - 1 + recognitions.length) % recognitions.length].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Card */}
                <div className="scale-100 opacity-100 transition-all duration-500 z-10">
                  <div
                    className="relative overflow-hidden rounded-2xl shadow-2xl group cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => handleCardClick(recognitions[currentSlide].url)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    style={{ width: '400px', height: '240px' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleCardClick(recognitions[currentSlide].url);
                    }}
                    aria-label={`Open ${recognitions[currentSlide].name}`}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center relative"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(20, 184, 166, 0.85), rgba(37, 99, 235, 0.85)), url(${recognitions[currentSlide].logo})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative h-full p-6 flex flex-col justify-end text-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                            {recognitions[currentSlide].type}
                          </span>
                          <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <h4 className="text-xl font-bold mb-2">{recognitions[currentSlide].name}</h4>
                        <p className="text-white/90">{recognitions[currentSlide].description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Card */}
                <div className="scale-75 opacity-40 transition-all duration-500">
                  <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ width: '320px', height: '200px' }}>
                    <div
                      className="w-full h-full bg-cover bg-center relative"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(20, 184, 166, 0.85), rgba(37, 99, 235, 0.85)), url(${
                          recognitions[(currentSlide + 1) % recognitions.length].logo
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative h-full p-4 flex flex-col justify-end text-white">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-2 self-start">
                          {recognitions[(currentSlide + 1) % recognitions.length].type}
                        </span>
                        <h4 className="text-lg font-bold mb-1">
                          {recognitions[(currentSlide + 1) % recognitions.length].name}
                        </h4>
                        <p className="text-white/90 text-sm">
                          {recognitions[(currentSlide + 1) % recognitions.length].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Navigation */}
              <div className="flex justify-center mt-8 gap-3">
                {recognitions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentSlide ? 'bg-teal-500 w-8 h-3' : 'bg-slate-300 hover:bg-slate-400 w-3 h-3'
                    }`}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Page Wrapper ---
export default function AboutAndFeedback() {
  return (
    <div className="scroll-mt-10 py-0" id="about">
      {/* --- Our Story --- */}
      <motion.section
        className="pt-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <OurStorySection />
      </motion.section>

      {/* --- Mission & Feedback Invite --- */}
      <motion.section
        className="py-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Left text column */}
          <div className="md:basis-1/2 space-y-1">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              We&apos;re On A Mission—<br />
              Let&apos;s Build This Together
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Skrimp exists to help families eat well on a budget. Our AI has already saved you an average of{' '}
              <span className="font-semibold">~30%</span> compared to the typical Canadian family&apos;s grocery bill,
              but we want to do even more. <br />
              <br />
              Tell us what recipes, features, or local deals you&apos;d love to see next week.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeaWg3pAelFtLZTBslhFiI_wxldA6muBfeidd_eTpIYTs5ZQQ/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#4FD1C5] text-white font-medium rounded-full px-6 py-3 hover:bg-[#3bb7a8] transition"
            >
              Feedback Form
            </a>
          </div>

          {/* Right image */}
          <div className="md:basis-1/2 flex justify-center">
            <Image
              src="/Feedback_img.png"
              alt="We'd love your feedback"
              width={400}
              height={300}
              className="w-full max-w-md rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
