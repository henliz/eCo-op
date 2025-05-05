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
  /** single recipe to render */
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
      animate={{ scale: isSelected ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onToggle(recipe.url)}
      className="cursor-pointer h-full"
    >
      <Card
        className={`
          transition-colors
          w-86 h-56
          flex flex-col h-full
          ${isSelected
            ? 'bg-orange-300 ring-2 ring-primary'
            : 'bg-teal-100 hover:bg-teal-200'}
        `}
      >
        {/* header + multiplier */}
        <CardHeader className="!pt-2 !px-3 !pb-1">
          <CardTitle className="text-lg leading-snug truncate">
            {recipe.name}
          </CardTitle>
          <div className="bg-gray-100 rounded-md p-1 w-48 mx-auto flex items-center justify-center gap-2 mt-1">
            <button
              onClick={dec}
              disabled={multiplier === 0}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-medium text-center w-6">
              {multiplier}×
            </span>
            <button
              onClick={inc}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200"
            >
              <Plus size={16} />
            </button>
          </div>
        </CardHeader>

        {/* two‑column body: left=details, right=Save */}
        <CardContent className="!p-3 grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="space-y-1 text-sm">
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
          <div className="flex items-center justify-center">
            <p className="text-green-600 font-bold text-lg">
              Save ${(recipe.totalSavings * multiplier).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
