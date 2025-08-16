import React from 'react';
import { BookOpen, Plus } from 'lucide-react';

interface CustomRecipeCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onCustomSelect?: () => void;
  isComingSoon?: boolean; // Keep for backward compatibility, but default to false
}

const mealTypeConfig = {
  breakfast: {
    title: 'Add Custom Breakfasts',
    description: 'Browse priced breakfast recipes from your selected store',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100'
  },
  lunch: {
    title: 'Add Custom Lunches',
    description: 'Browse priced lunch recipes from your selected store',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  dinner: {
    title: 'Add Custom Dinners',
    description: 'Browse priced dinner recipes from your selected store',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100'
  }
};

export function CustomRecipeCard({ mealType, onCustomSelect, isComingSoon = false }: CustomRecipeCardProps) {
  const config = mealTypeConfig[mealType];

  return (
    <div
      className={`
        relative w-full flex flex-col items-center justify-center text-center 
        min-h-[10rem] max-h-[10rem] overflow-hidden 
        border-2 border-dashed rounded-lg
        transition-all duration-200
        ${config.bgColor} ${config.borderColor}
        ${isComingSoon ? 'opacity-60 cursor-not-allowed' : `cursor-pointer ${config.hoverColor}`}
      `}
      onClick={isComingSoon ? undefined : onCustomSelect}
    >
      {/* Coming Soon Badge - only show if explicitly set */}
      {isComingSoon && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
            Coming Soon
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`${config.color} mb-3`}>
        <div className="relative">
          <BookOpen className="w-8 h-8 mx-auto" />
          <Plus className="w-4 h-4 absolute -bottom-1 -right-1 bg-white rounded-full" />
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-sm sm:text-base font-semibold mb-2 leading-snug ${config.color}`}>
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-snug px-2">
        {isComingSoon
          ? 'Browse our complete recipe library and add your favorites to your meal plan'
          : config.description
        }
      </p>

      {/* Call to action hint */}
      <div className={`mt-2 text-xs font-medium ${config.color}`}>
        {isComingSoon ? 'Feature in development' : 'Click to browse recipes →'}
      </div>
    </div>
  );
}