'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Apple, Carrot, Egg, Fish, Utensils } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, onProgress }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);

  // Add a subtle progress stutter effect on the progress bar
  const progressBarStyle = {
    width: `${progress}%`,
    transition: progress === 0 ? 'none' : 'width 0.3s ease-out',
  };

  // Store the last progress value to avoid multiple reports of the same progress
  const lastReportedProgress = useRef(0);

  // Main effect for progress bar animation
  useEffect(() => {
    // Base speed for the progress bar (faster than before)
    const baseInterval = 20; // milliseconds between updates (was 40)

    // Create an array of points where we'll simulate "processing pauses"
    const pausePoints = [
      Math.floor(Math.random() * 15) + 10, // First pause between 10-25%
      Math.floor(Math.random() * 15) + 35, // Second pause between 35-50%
      Math.floor(Math.random() * 15) + 60, // Third pause between 60-75%
      Math.floor(Math.random() * 10) + 85, // Final pause between 85-95%
    ];

    // Random pause durations between 100-500ms
    const pauseDurations = pausePoints.map(() => Math.floor(Math.random() * 400) + 100);

    let isPaused = false;
    let timer: NodeJS.Timeout;

    const updateProgress = () => {
      setProgress(oldProgress => {
        const newProgress = Math.min(oldProgress + 1, 100);

        // Update step based on progress
        if (newProgress > 25 && newProgress <= 50) {
          setStep(1);
        } else if (newProgress > 50 && newProgress <= 75) {
          setStep(2);
        } else if (newProgress > 75) {
          setStep(3);
        }

        // Call the onProgress callback if provided and progress has changed significantly
        // Only report every 5% to avoid too many state updates
        if (onProgress && newProgress % 5 === 0 && newProgress > lastReportedProgress.current) {
          lastReportedProgress.current = newProgress;
          // Use setTimeout to avoid React state update during render
          setTimeout(() => {
            onProgress(newProgress);
          }, 0);
        }

        // Check if we've hit one of our pause points
        if (!isPaused && pausePoints.includes(newProgress)) {
          isPaused = true;
          const pauseIndex = pausePoints.indexOf(newProgress);
          const pauseDuration = pauseDurations[pauseIndex];

          console.log(`Pausing at ${newProgress}% for ${pauseDuration}ms`);

          // Clear existing timer during the pause
          clearInterval(timer);

          // Resume after pause duration
          setTimeout(() => {
            isPaused = false;
            timer = setInterval(updateProgress, baseInterval);
          }, pauseDuration);
        }

        // Mark as complete when done
        if (newProgress === 100) {
          setTimeout(() => {
            setComplete(true);
            // Call the onComplete callback if provided
            if (onComplete) {
              onComplete();
            }
          }, 500);
          clearInterval(timer);
        }

        return newProgress;
      });
    };

    // Start the initial timer
    timer = setInterval(updateProgress, baseInterval);

    return () => clearInterval(timer);
  }, [onComplete, onProgress]); // Include both callbacks in dependencies

  // Debug effect for completion
  useEffect(() => {
    if (complete && onComplete) {
      console.log("Loading complete, calling onComplete callback");
    }
  }, [complete, onComplete]); // This already has correct dependencies

  const steps = [
    "Initializing AI meal optimization...",
    "Analyzing nutritional parameters...",
    "Optimizing combinations for balance...",
    "Finalizing personalized solutions..."
  ];

  const foodIcons = [
    <Apple key="apple" className="text-white" />,
    <Carrot key="carrot" className="text-white" />,
    <Egg key="egg" className="text-white" />,
    <Fish key="fish" className="text-white" />,
    <Utensils key="utensils" className="text-white" />
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        opacity: complete ? 0 : 1,
        transition: 'opacity 0.7s ease-out',
        pointerEvents: complete ? 'none' : 'auto',
      }}>
      {/* Background div with advanced glassmorphism effect - more see-through */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(69, 176, 140, 0.65) 0%, rgba(25, 120, 100, 0.75) 100%)',
          boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Geometric elements for tech aesthetic */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white opacity-5 blur-md"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-white opacity-5 blur-md"></div>
        <div className="absolute top-1/3 left-1/4 w-20 h-20 rounded-md bg-white opacity-5 blur-md transform rotate-45"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 py-8">
        {/* Font Import */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap');
            * { font-family: 'Montserrat', sans-serif; }
          `}
        </style>

        {/* Chef hat logo with enhanced tech appearance */}
        <div className="mb-8 md:mb-10 relative">
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-white opacity-20 blur-md rounded-full animate-pulse"></div>
              <ChefHat size={48} className="text-white relative z-10 sm:hidden" />
              <ChefHat size={64} className="text-white relative z-10 hidden sm:block" />
            </div>
          </div>
          <div className="h-12 w-12 sm:h-16 sm:w-16"></div>
        </div>

        {/* Loading text with tech styling */}
        <p className="text-white text-lg sm:text-xl font-medium mb-6 md:mb-8 text-center tracking-wide">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-100">
            {steps[step]}
          </span>
        </p>

        {/* Progress bar with enhanced styling */}
        <div className="w-full max-w-md rounded-full p-1 mb-24 md:mb-32"
          style={{
            background: 'rgba(255,255,255,0.15)',
            boxShadow: '0 0 10px rgba(0,0,0,0.1), inset 0 0 5px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
          <div className="bg-transparent rounded-full h-2 sm:h-3 w-full overflow-hidden"
            style={{ backdropFilter: 'blur(4px)' }}>
            <div
              className="h-2 sm:h-3 rounded-full relative overflow-hidden"
              style={{
                ...progressBarStyle,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                boxShadow: '0 0 15px rgba(255,255,255,0.5), 0 0 5px rgba(255,255,255,0.5)'
              }}
            >
              {/* Animated highlight */}
              <div
                className="absolute top-0 right-0 bottom-0 w-20 -mr-10 transform rotate-12 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  animation: 'shimmer 1.5s infinite'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add animation keyframes */}
        <style>
          {`
            @keyframes shimmer {
              0% { transform: translateX(-150%) rotate(12deg); }
              100% { transform: translateX(150%) rotate(12deg); }
            }
          `}
        </style>

        {/* Animated food icons */}
        <div className="flex justify-around w-full absolute bottom-8 md:bottom-12">
          {foodIcons.map((icon, i) => {
            // Responsive sizing for icons
            const IconComponent = icon.type;
            return (
              <div
                key={i}
                className="animate-bounce"
                style={{
                  animationDuration: `${1 + (i * 0.2)}s`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.7
                }}
              >
                <IconComponent className="text-white h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;