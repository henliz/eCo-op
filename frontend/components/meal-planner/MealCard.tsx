// components/meal-planner/MealCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { type Recipe } from './usePlannerStore';
import { Plus, Minus } from 'lucide-react';

interface MealCardProps {
  recipe: Recipe;
  isSelected: boolean;
  multiplier: number;
  onToggle: (url: string) => void;
  onMultiplierChange: (url: string, multiplier: number) => void;
}

export function MealCard({
  recipe,
  isSelected,
  multiplier = 1,
  onToggle,
  onMultiplierChange,
}: MealCardProps) {
  const dec = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMultiplierChange(recipe.url, Math.max(0, multiplier - 1));
  };
  const inc = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMultiplierChange(recipe.url, multiplier + 1);
  };

  return (
    <motion.div
      key={recipe.url}
      initial={false}
      animate={{ scale: isSelected ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onToggle(recipe.url)}
      className="cursor-pointer w-full"
    >
      <Card
        className={`
          transition-colors
          w-full flex flex-col
          min-h-[14rem] max-h-[18rem] overflow-hidden
          ${isSelected
            ? 'bg-teal-100'
            : 'bg-gray-100 hover:bg-gray-200'}
        `}
      >
        {/* Header + multiplier (mobile: stacked; desktop: inline) */}
        <CardHeader className="!pt-1 !pb-1 !px-2 sm:!px-3 flex flex-col md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-sm sm:text-lg font-semibold leading-snug break-words">
            {recipe.name}
          </CardTitle>
          <div className="mt-1 md:mt-0 bg-gray-100 rounded-md px-1 sm:px-2 py-0 flex items-center justify-center gap-1 sm:gap-2 w-full md:w-auto">
            <button
              onClick={dec}
              disabled={multiplier === 0}
              className="w-5 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs sm:text-sm font-medium">{multiplier}×</span>
            <button
              onClick={inc}
              className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-gray-200"
            >
              <Plus size={14} />
            </button>
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent
          className="!p-1 sm:!p-3 flex flex-col sm:grid sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 text-xs sm:text-sm"
          style={{ overflowY: 'auto' }}
        >
          <div className="space-y-0.5">
            <p className="text-gray-500">Servings: {recipe.servings}</p>
            <p>
              Regular:{' '}
              <span className="line-through">
                ${(recipe.regularPrice * multiplier).toFixed(2)}
              </span>
            </p>
            <p>
              Sale:{' '}
              <span className="font-bold">
                ${(recipe.salePrice * multiplier).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="mt-1 sm:mt-0 flex items-center justify-center">
            <p className="text-green-600 font-bold text-sm sm:text-lg">
              Save ${(recipe.totalSavings * multiplier).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
