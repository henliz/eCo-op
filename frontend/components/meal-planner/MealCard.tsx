'use client';

import React from 'react';
import { motion } from 'framer-motion'; // Make sure this import is correct
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Recipe } from './usePlannerStore';
import { Plus, Minus, ExternalLink } from 'lucide-react';
import { RecipeViewer } from './RecipeViewer'; // Add this import

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

  // Calculate savings
  const hasSavings = recipe.totalSavings > 0;

  // Calculate flyer items count
  // We need to ensure the recipe.flyerItemsCount is available in the Recipe type
  const hasFlyerItems = recipe.flyerItemsCount > 0;

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
          w-full flex flex-col gap-0
          min-h-[10rem] max-h-[10rem] overflow-hidden relative
          ${isSelected ? 'bg-teal-100' : 'bg-gray-100 hover:bg-gray-200'}
        `}
      >
        <CardHeader className="!pl-3 !pr-2 !mb-0">
          <CardTitle className="text-sm sm:text-lg font-semibold leading-snug break-words">
            <div className="flex justify-between items-start">
              <span>{recipe.name}</span>
              {recipe.url && (
                <span
                  onClick={(e) => e.stopPropagation()}
                  className="flex shrink-0 ml-1 text-gray-500 hover:text-teal-600"
                >
                  <RecipeViewer
                    title={recipe.name}
                    url={recipe.url}
                    trigger={
                      <ExternalLink size={16} className="cursor-pointer" />
                    }
                  />
                </span>
              )}
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm !ml-1 !mr-3 !mt-2">
              <p className="text-gray-500 !mb-0">
                Servings: {recipe.servings}
              </p>
              <p className="text-gray-500 !mb-0">
                Cost: <span className="font-bold">${recipe.salePrice.toFixed(2)}</span>
              </p>
            </div>
            {/* Savings or Flyer Items display - show one or the other, not both */}
            <div className="flex justify-end text-xs sm:text-sm !mr-3">
              {hasSavings ? (
                <p className="text-green-600 font-bold !mb-0">
                  Deals: ${recipe.totalSavings.toFixed(2)}
                </p>
              ) : hasFlyerItems ? (
                <p className="text-blue-600 font-bold !mb-0">
                  {recipe.flyerItemsCount} flyer items
                </p>
              ) : null}
            </div>
          </CardTitle>
        </CardHeader>

        {/* Fixed bottom multiplier controls */}
        {isSelected && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
            <button
              onClick={dec}
              className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-l"
            >
              <Minus size={20}/>
            </button>
            <div
              className="w-16 h-10 flex items-center justify-center font-bold text-lg"
              style={{backgroundColor: '#FFE6D9'}}
            >
              x{multiplier}
            </div>
            <button
              onClick={inc}
              className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-r"
            >
              <Plus size={20}/>
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
