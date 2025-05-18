'use client';

import React, { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { usePlannerStore } from './usePlannerStore';

export function HouseholdSizeSelector() {
  // Access just what we need from the store
  const normalMealServings = usePlannerStore(state => state.normalMealServings);
  const setNormalMealServings = usePlannerStore(state => state.setNormalMealServings);

  // Get recipes and multipliers
  const selectedMeals = usePlannerStore(state => state.selectedMeals);
  const recipeMultipliers = usePlannerStore(state => state.recipeMultipliers);
  const setRecipeMultiplier = usePlannerStore(state => state.setRecipeMultiplier);
  const meals = usePlannerStore(state => state.meals);

  // Track animation frame for cleanup
  const animationRef = useRef<number | null>(null);

  // Track current time for animation
  const timeRef = useRef<number>(0);

  // Use a ref to track previous household size to avoid unnecessary updates
  const prevSizeRef = useRef(normalMealServings);

  // Flag to prevent updates on initial mount
  const initialMountRef = useRef(true);

  // Track if slider is being dragged
  const sliderRef = useRef<HTMLInputElement>(null);

  // Animation loop for jumping figures
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!timeRef.current) {
        timeRef.current = timestamp;
      }

      // Just update the timestamp
      timeRef.current = timestamp;

      // Request next frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Effect to update recipe multipliers when household size changes
  useEffect(() => {
    // Skip the effect on initial mount
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    // Only run this effect if the household size has actually changed
    if (prevSizeRef.current === normalMealServings) {
      return;
    }

    // Update the previous size ref
    prevSizeRef.current = normalMealServings;

    // Get all selected recipes
    const allMeals = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner
    ];

    // Only update recipes that need updating to avoid infinite loops
    Array.from(selectedMeals).forEach(url => {
      const recipe = allMeals.find(r => r.url === url);
      if (recipe) {
        // Calculate what the multiplier should be based on household size
        const calculatedMultiplier = Math.ceil(normalMealServings / recipe.servings * 2) / 2;
        const currentMultiplier = recipeMultipliers[url] || 0;

        // Only update if the calculated multiplier is different from current
        if (Math.abs(calculatedMultiplier - currentMultiplier) > 0.01) {
          setRecipeMultiplier(url, calculatedMultiplier);
        }
      }
    });
  }, [normalMealServings, meals, selectedMeals, recipeMultipliers, setRecipeMultiplier]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setNormalMealServings(value);
  };

  // Calculate the position percentage for the slider
  const sliderPosition = ((normalMealServings - 1) / 11) * 100;

  // Generate stick figures based on current value
  const renderStickFigures = () => {
    const figures = [];

    // Create stick figure SVG with jumping animation
    const StickFigure = ({ index }: { index: number }) => {
      // Create a random animation duration between 0.6s and 1.2s
      const animationDuration = 0.6 + (index % 5) * 0.15;

      // Create a random animation delay between 0s and 1s
      const animationDelay = (index * 0.2) % 1;

      return (
        <div
          className="inline-block mx-1"
          style={{
            animation: `jump ${animationDuration}s ease-in-out ${animationDelay}s infinite alternate`,
            transformOrigin: 'bottom',
          }}
        >
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            className="text-teal-500"
          >
            <circle cx="8" cy="4" r="3.5" fill="currentColor" />
            <line x1="8" y1="7.5" x2="8" y2="14" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="14" x2="5" y2="19" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="14" x2="11" y2="19" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      );
    };

    // Limit the number of figures to avoid overcrowding
    const maxVisible = Math.min(normalMealServings, 12);

    // Create figures with jumping animation
    for (let i = 0; i < maxVisible; i++) {
      figures.push(<StickFigure key={i} index={i} />);
    }

    return figures;
  };

  return (
    <div className="bg-white rounded-xl py-2 px-5 mb-1 shadow-sm">
      {/* Header with title and value display */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Household Size</h3>
        </div>

        {/* Value display in top right */}
        <div className="bg-teal-100 w-12 h-12 flex items-center justify-center rounded-lg">
          <span className="text-2xl font-bold text-gray-900">{normalMealServings}</span>
        </div>
      </div>

      {/* Stick figures container - taller to accommodate jumping figures */}
      <div className="flex justify-center items-center h-10 overflow-hidden mb-0 transition-all duration-300">
        <div className="flex flex-wrap justify-center items-end max-w-full gap-0.5">
          {renderStickFigures()}
        </div>
      </div>

      {/* Compact full-width slider */}
      <div className="relative h-4 w-full mb-2">
        {/* Slider track background */}
        <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 bg-gray-200 rounded-full"></div>

        {/* Slider filled portion */}
        <div
          className="absolute h-2 top-1/2 -translate-y-1/2 bg-teal-500 rounded-full transition-width duration-300 ease-out"
          style={{ width: `${sliderPosition}%` }}
        ></div>

        {/* Slider thumb */}
        <div
          className="absolute w-8 h-8 bg-white rounded-full border-2 border-teal-500 shadow-md flex items-center justify-center z-20 transition-all duration-300 ease-out"
          style={{
            left: `calc(${sliderPosition}%)`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Users size={14} className="text-teal-500" />
        </div>

        {/* Hidden range input for functionality */}
        <input
          ref={sliderRef}
          type="range"
          min="1"
          max="12"
          value={normalMealServings}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
        />
      </div>

      {/* CSS for jumping animation */}
      <style jsx>{`
        @keyframes jump {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}