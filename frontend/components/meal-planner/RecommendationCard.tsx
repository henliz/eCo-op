'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ChefHat, Coffee, Utensils } from 'lucide-react';

interface RecommendationCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onRecommend: () => void;
  isLoading?: boolean;
}

const mealTypeConfig = {
  breakfast: {
    icon: Coffee,
    title: 'Recommend 10 Breakfasts',
    description: 'Get personalized breakfast recommendations based on your store and preferences',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100'
  },
  lunch: {
    icon: Utensils,
    title: 'Recommend 10 Lunches',
    description: 'Discover lunch options perfect for your household size and budget',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  dinner: {
    icon: ChefHat,
    title: 'Recommend 10 Dinners',
    description: 'Find delicious dinner recipes with current deals and savings',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100'
  }
};

export function RecommendationCard({ mealType, onRecommend, isLoading = false }: RecommendationCardProps) {
  const config = mealTypeConfig[mealType];
  const Icon = config.icon;

  return (
    <Card
      className={`
        relative w-full flex flex-col items-center justify-center text-center 
        min-h-[10rem] max-h-[10rem] overflow-hidden 
        cursor-pointer transition-all duration-200
        border-2 border-dashed 
        ${config.bgColor} ${config.borderColor} ${config.hoverColor}
        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
      onClick={isLoading ? undefined : onRecommend}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
            <span className="text-xs text-gray-600">Loading...</span>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`${config.color} mb-3`}>
        <Icon className="w-8 h-8 mx-auto" />
      </div>

      {/* Title */}
      <h3 className={`text-sm sm:text-base font-semibold mb-2 leading-snug ${config.color}`}>
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-snug px-2">
        {config.description}
      </p>

      {/* Call to action hint */}
      <div className={`mt-2 text-xs font-medium ${config.color}`}>
        Click to get recommendations →
      </div>
    </Card>
  );
}