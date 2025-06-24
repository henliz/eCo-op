'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { usePlannerStore } from './usePlannerStore';

/**
 * HouseholdSizeSelector – hydration‑safe bumper‑car stick people 🤼‍♂️
 * -----------------------------------------------------------------
 * Fixes the React hydration mismatch by ensuring **no random values are used
 * during server‑side rendering**. All randomness is deferred to a `useEffect`
 * that runs only in the browser after hydration completes.
 *
 * Added probability distribution:
 * - 75% chance of standing still (no animation)
 * - 25% chance split among all other animations
 */
export function HouseholdSizeSelector() {
  // ─── Store state ───────────────────────────────────────────────────────────
  const normalMealServings     = usePlannerStore(s => s.normalMealServings);
  const setNormalMealServings  = usePlannerStore(s => s.setNormalMealServings);
  const setRecipeMultiplier    = usePlannerStore(s => s.setRecipeMultiplier);
  const meals                  = usePlannerStore(s => s.meals);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const prevSizeRef       = useRef(normalMealServings);
  const initialMountRef   = useRef(true);
  const sliderRef         = useRef<HTMLInputElement>(null);
  const sliderWrapperRef  = useRef<HTMLDivElement>(null);

  // ─── Sync multipliers to household size ────────────────────────────────────
  useEffect(() => {
    if (initialMountRef.current) { initialMountRef.current = false; return; }
    if (prevSizeRef.current === normalMealServings) return;
    prevSizeRef.current = normalMealServings;

    const allMeals = [...meals.breakfast, ...meals.lunch, ...meals.dinner];

    // UPDATED: Use recipe.isSelected instead of selectedMeals
    allMeals.forEach(recipe => {
      if (!recipe.isSelected) return;

      const calc = Math.ceil((normalMealServings / recipe.servings) * 2) / 2;
      if (Math.abs(recipe.multiplier - calc) > 0.01) {
        setRecipeMultiplier(recipe.url, calc);
      }
    });
  }, [normalMealServings, meals, setRecipeMultiplier]);

  // ─── Slider handler ────────────────────────────────────────────────────────
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNormalMealServings(parseInt(e.target.value, 10));
  };

  // ─── Touch event handlers ────────────────────────────────────────────────────
  const updateValueFromTouch = (clientX: number) => {
    if (!sliderWrapperRef.current) return;

    const rect = sliderWrapperRef.current.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, touchX / rect.width));
    const newValue = Math.round(1 + percentage * 11);

    if (newValue !== normalMealServings) {
      setNormalMealServings(newValue);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while interacting with slider
    updateValueFromTouch(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
    updateValueFromTouch(e.touches[0].clientX);
  };

  const sliderPosition = ((normalMealServings - 1) / 11) * 100;

  // ─── Animation helpers ─────────────────────────────────────────────────────
  const animations = [
    'jump', 'hop',
    'somersault', 'somersaultReverse',
    'wave', 'shake', 'spin',
    'bumpRight', 'bumpLeft'
  ] as const;

  // New animation type that includes 'none' for standing still
  type AnimationType = typeof animations[number] | 'none';

  // Modified to apply probabilities
  const getRandomAnimation = (): AnimationType => {
    // 75% chance of standing still
    if (Math.random() < 0.4) {
      return 'none';
    }

    // 25% chance split among all other animations
    return animations[Math.floor(Math.random() * animations.length)];
  };

  // ─── Stick figure component ───────────────────────────────────────────────
  const StickFigure: React.FC<{ index: number }> = ({ index }) => {
    /**
     * IMPORTANT: initialAnim must be **deterministic** so that the markup
     * generated during SSR matches the markup on first render in the browser.
     * We use 'none' as our safe placeholder for everyone, then switch to a
     * probability-based animation on mount.
     */
    const [anim, setAnim] = useState<AnimationType>('none');
    const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial animation setup - runs only once after mount
    useEffect(() => {
      // Set initial animation state after component mounts
      setAnim(getRandomAnimation());
    }, []); // Empty dependency array means this runs only once after mount

    // Handle animation changes and interval setup
    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;

      // Set up event handlers based on current animation state
      if (anim !== 'none') {
        // Only add listeners if currently animated
        const handler = () => {
          setAnim(getRandomAnimation());
        };

        el.addEventListener('animationiteration', handler);
        return () => el.removeEventListener('animationiteration', handler);
      } else {
        // For still figures, periodically check if they should start moving
        const intervalId = setInterval(() => {
          setAnim(getRandomAnimation());
        }, 3000 + (index % 5) * 1000); // Stagger checks by index

        return () => clearInterval(intervalId);
      }
    }, [anim, index]);

    // Only apply animation styles if not 'none'
const animationStyle = (anim === 'none' || !isClient)
  ? {}
  : {
      animation: `${anim} ${0.8 + (index % 5) * 0.15}s ease-in-out ${(index * 0.17) % 1}s infinite`,
      transformOrigin: (anim === 'spin' || anim.startsWith('somersault')) ? '50% 50%' : 'bottom',
    };

    return (
      <div
        ref={wrapperRef}
        className="inline-block mx-0.5"
        style={animationStyle}
      >
        <svg width="16" height="20" viewBox="0 0 16 20" className="text-teal-500">
          <circle cx="8" cy="4" r="3.5" fill="currentColor" />
          <line x1="8" y1="7.5" x2="8" y2="14" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="14" x2="5" y2="19" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="14" x2="11" y2="19" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl py-2 px-5 mb-1 shadow-sm relative">
      {/* Adding relative positioning to the container */}
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">Household Size</h3>
        <div className="bg-teal-100 w-12 h-12 flex items-center justify-center rounded-lg">
          <span className="text-2xl font-bold text-gray-900">{normalMealServings}</span>
        </div>
      </div>

      {/* Figures */}
      <div className="flex justify-center items-center h-12 overflow-hidden mb-1">
        <div className="flex flex-wrap justify-center items-end max-w-full gap-0.5">
          {Array.from({ length: Math.min(normalMealServings, 12) }, (_, i) => (
            <StickFigure key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Slider */}
      <div
        ref={sliderWrapperRef}
        className="relative h-10 w-full mb-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Track background */}
        <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 bg-gray-200 rounded-full" />

        {/* Filled track */}
        <div
          className="absolute h-2 top-1/2 -translate-y-1/2 bg-teal-500 rounded-full transition-all duration-300"
          style={{ width: `${sliderPosition}%` }}
        />

        {/* Handle */}
        <div
          className="absolute w-8 h-8 bg-white rounded-full border-2 border-teal-500 shadow-md flex items-center justify-center z-1 transition-all duration-300"
          style={{ left: `calc(${sliderPosition}% )`, top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Users size={14} className="text-teal-500" />
        </div>

        {/* Invisible input range with increased height */}
        <input
          ref={sliderRef}
          type="range"
          min="1"
          max="12"
          value={normalMealServings}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-2"
        />
      </div>

      {/* Keyframes – unchanged from previous version */}
      <style jsx>{`
        @keyframes jump {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-12px); }
        }
        @keyframes hop {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }
        @keyframes somersault {
          0% { transform: translateY(0) rotateZ(0deg); }
          25% { transform: translateY(-12px) rotateZ(0deg); }
          75% { transform: translateY(-12px) rotateZ(360deg); }
          100%{ transform: translateY(0) rotateZ(360deg); }
        }
        @keyframes somersaultReverse {
          0% { transform: translateY(0) rotateZ(0deg); }
          25% { transform: translateY(-12px) rotateZ(0deg); }
          75% { transform: translateY(-12px) rotateZ(-360deg); }
          100%{ transform: translateY(0) rotateZ(-360deg); }
        }
        @keyframes wave {
          0%,100%{ transform: rotateZ(0deg); }
          50%    { transform: rotateZ(15deg); }
        }
        @keyframes shake {
          0%,100%{ transform: translateX(0); }
          25%    { transform: translateX(-3px); }
          75%    { transform: translateX(3px);  }
        }
        @keyframes spin {
          0%   { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes bumpRight {
          0%,100% { transform: translateY(0) translateX(0); }
          40%     { transform: translateY(-4px) translateX(6px); }
          60%     { transform: translateY(-4px) translateX(6px); }
        }
        @keyframes bumpLeft {
          0%,100% { transform: translateY(0) translateX(0); }
          40%     { transform: translateY(-4px) translateX(-6px); }
          60%     { transform: translateY(-4px) translateX(-6px); }
        }
      `}</style>
    </div>
  );
}
