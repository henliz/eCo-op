import React from 'react';
import { BookOpen, Plus } from 'lucide-react';

interface CustomRecipeCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onCustomSelect?: () => void;
  isComingSoon?: boolean; // Keep for backward compatibility, but default to false
}

const mealTypeConfig = {
  breakfast: {
    title: 'Self Serve',
    color: 'text-amber-700',
    gradientFrom: 'from-yellow-200/40',
    gradientVia: 'via-lime-100/30',
    gradientTo: 'to-green-100/40',
    borderColor: 'border-yellow-200/50',
    hoverGradient: 'hover:from-yellow-300/60 hover:via-lime-200/50 hover:to-green-200/60',
    shadowColor: 'shadow-yellow-200/30'
  },
  lunch: {
    title: 'Self Serve',
    color: 'text-teal-700',
    gradientFrom: 'from-emerald-200/40',
    gradientVia: 'via-teal-100/30',
    gradientTo: 'to-cyan-100/40',
    borderColor: 'border-emerald-200/50',
    hoverGradient: 'hover:from-emerald-300/60 hover:via-teal-200/50 hover:to-cyan-200/60',
    shadowColor: 'shadow-emerald-200/30'
  },
  dinner: {
    title: 'Self Serve',
    color: 'text-orange-700',
    gradientFrom: 'from-orange-200/40',
    gradientVia: 'via-amber-100/30',
    gradientTo: 'to-yellow-100/40',
    borderColor: 'border-orange-200/50',
    hoverGradient: 'hover:from-orange-300/60 hover:via-amber-200/50 hover:to-yellow-200/60',
    shadowColor: 'shadow-orange-200/30'
  }
};

export function CustomRecipeCard({ mealType, onCustomSelect, isComingSoon = false }: CustomRecipeCardProps) {
  const config = mealTypeConfig[mealType];

  return (
    <>
      {/* Force Montserrat Alternates font for this component */}
      <style>{`
        .custom-recipe-card, .custom-recipe-card * {
          font-family: "Montserrat Alternates", Arial, sans-serif !important;
        }
      `}</style>

      <div
        className={`
          custom-recipe-card
          group relative w-full flex flex-col items-center justify-center text-center
          min-h-[10rem] max-h-[10rem] overflow-hidden p-4
          cursor-pointer transition-all duration-500 ease-out
          border border-dashed rounded-xl backdrop-blur-sm
          bg-gradient-to-br ${config.gradientFrom} ${config.gradientVia} ${config.gradientTo}
          ${config.borderColor} ${config.hoverGradient}
          hover:border-solid hover:scale-105 hover:shadow-2xl ${config.shadowColor}
          hover:backdrop-blur-md hover:-translate-y-2
          shadow-lg drop-shadow-md
          ${isComingSoon ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        onClick={isComingSoon ? undefined : onCustomSelect}
      >
        {/* Holographic shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 group-hover:animate-[shine_2s_ease-in-out_infinite]"
            style={{
              animation: 'shine 2s ease-in-out infinite',
              animationDelay: '0.5s'
            }}
          />
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

        {/* Coming Soon Badge - only show if explicitly set */}
        {isComingSoon && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
              Coming Soon
            </span>
          </div>
        )}

        {/* Icon with Plus overlay */}
        <div className={`${config.color} mb-3 relative z-10`}>
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            <BookOpen className="w-8 h-8 mx-auto" />
            <Plus className="w-4 h-4 absolute -bottom-2 -right-2 bg-white/90 rounded-full p-0.5 group-hover:rotate-12 transition-transform duration-300 backdrop-blur-sm" />
          </div>
        </div>

        {/* Title - Much Bigger */}
        <h3 className={`text-xl sm:text-2xl font-bold mb-3 leading-tight ${config.color} group-hover:scale-105 transition-transform duration-300 relative z-10`}>
          {config.title}
        </h3>

        {/* Call to action button */}
        <div className={`
          relative z-10 px-4 py-2 rounded-full text-xs font-semibold ${config.color}
          bg-white/30 backdrop-blur-sm border border-current/20
          hover:bg-white/50 hover:border-current/40 hover:shadow-lg
          transition-all duration-300 group-hover:scale-105
        `}>
          {isComingSoon ? 'Feature in development' : 'See all recipes →'}
        </div>
      </div>
    </>
  );
}