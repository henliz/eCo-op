'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

interface RecommendationCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onRecommend: () => void;
  isLoading?: boolean;
}

const mealTypeConfig = {
  breakfast: {
    iconSrc: '/Robo_Chef.png',
    title: 'Smart Load',
    color: 'text-amber-700',
    gradientFrom: 'from-yellow-200/40',
    gradientVia: 'via-lime-100/30',
    gradientTo: 'to-green-100/40',
    borderColor: 'border-yellow-200/50',
    hoverGradient: 'hover:from-yellow-300/60 hover:via-lime-200/50 hover:to-green-200/60',
    shadowColor: 'shadow-yellow-200/30',
    loadingDots: 'bg-amber-600',
    loadingText: 'text-amber-700'
  },
  lunch: {
    iconSrc: '/Robo_Plan.png',
    title: 'Smart Load',
    color: 'text-teal-700',
    gradientFrom: 'from-emerald-200/40',
    gradientVia: 'via-teal-100/30',
    gradientTo: 'to-cyan-100/40',
    borderColor: 'border-emerald-200/50',
    hoverGradient: 'hover:from-emerald-300/60 hover:via-teal-200/50 hover:to-cyan-200/60',
    shadowColor: 'shadow-emerald-200/30',
    loadingDots: 'bg-teal-600',
    loadingText: 'text-teal-700'
  },
  dinner: {
    iconSrc: '/Robo_Research.png',
    title: 'Smart Load',
    color: 'text-orange-700',
    gradientFrom: 'from-orange-200/40',
    gradientVia: 'via-amber-100/30',
    gradientTo: 'to-yellow-100/40',
    borderColor: 'border-orange-200/50',
    hoverGradient: 'hover:from-orange-300/60 hover:via-amber-200/50 hover:to-yellow-200/60',
    shadowColor: 'shadow-orange-200/30',
    loadingDots: 'bg-orange-600',
    loadingText: 'text-orange-700'
  }
};

export function RecommendationCard({ mealType, onRecommend, isLoading = false }: RecommendationCardProps) {
  const config = mealTypeConfig[mealType];

  return (
    <>
      {/* Force Montserrat Alternates font for this component */}
      <style>{`
        .recommendation-card, .recommendation-card * {
          font-family: "Montserrat Alternates", Arial, sans-serif !important;
        }
      `}</style>

      <div
        className={`
          recommendation-card
          group relative w-full flex flex-col items-center justify-center text-center
          min-h-[10rem] max-h-[10rem] overflow-hidden p-4
          cursor-pointer transition-all duration-500 ease-out
          border border-dashed rounded-xl backdrop-blur-sm
          bg-gradient-to-br ${config.gradientFrom} ${config.gradientVia} ${config.gradientTo}
          ${config.borderColor} ${config.hoverGradient}
          hover:border-solid hover:scale-105 hover:shadow-2xl ${config.shadowColor}
          hover:backdrop-blur-md hover:-translate-y-2
          shadow-lg drop-shadow-md
          ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
        `}
        onClick={isLoading ? undefined : onRecommend}
      >
        {/* Pokemon card holographic shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500 pointer-events-none overflow-hidden">
          {/* Moving shine that loops */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 group-hover:animate-[shine_2s_ease-in-out_infinite]"
            style={{
              animation: 'shine 2s ease-in-out infinite',
              animationDelay: '0.5s'
            }}
          />
          {/* Secondary shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 group-hover:animate-pulse" />
        </div>

        {/* Add the keyframe animation */}
        <style jsx>{`
          @keyframes shine {
            0% { transform: translateX(-100%) skewX(-12deg); }
            50% { transform: translateX(100%) skewX(-12deg); }
            100% { transform: translateX(100%) skewX(-12deg); }
          }
        `}</style>

        {/* Loading overlay with proper color coding */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md z-20 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              {/* Color-coded bouncing dots */}
              <div className="flex space-x-2">
                <div
                  className={`w-3 h-3 rounded-full animate-bounce ${config.loadingDots}`}
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full animate-bounce ${config.loadingDots}`}
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full animate-bounce ${config.loadingDots}`}
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${config.loadingText}`}>
                Loading smart recipes...
              </span>
            </div>
          </div>
        )}

        {/* Icon with sparkles overlay */}
        <div className={`mb-3 relative z-10 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <Image
              src={config.iconSrc}           // '/Robo_Chef.png', '/Robo_Plan.png', '/Robo_Research.png'
              alt={`${mealType} icon`}
              width={60}
              height={60}
              className="w-15 h-15 mx-auto"  // keep your tailwind sizing if desired
              priority={false}
            />
            <Sparkles className="w-4 h-4 absolute -bottom-2 -right-2 bg-white/90 rounded-full p-0.5 group-hover:rotate-12 transition-transform duration-300 backdrop-blur-sm" />
          </div>
        </div>

        {/* Title - Much Bigger */}
        <h3 className={`text-xl sm:text-2xl font-bold mb-1 leading-tight ${config.color} group-hover:scale-105 transition-transform duration-300 relative z-10 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {config.title}
        </h3>

        {/* Call to action button */}
        <div className={`
          relative z-10 px-4 py-2 rounded-full text-xs font-semibold ${config.color}
          bg-white/30 backdrop-blur-sm border border-current/20
          hover:bg-white/50 hover:border-current/40 hover:shadow-lg
          transition-all duration-300 group-hover:scale-105
          -mt-2
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}>
          Recommend best 10 deals →
        </div>
      </div>
    </>
  );
}