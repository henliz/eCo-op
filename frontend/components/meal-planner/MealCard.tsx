'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
} from '@/components/ui/card';
import { type Recipe } from './usePlannerStore';
import { Settings } from 'lucide-react';
import { RecipeViewer } from './RecipeViewer';

interface MealCardProps {
  recipe: Recipe & { img?: string };
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
  // Only count as having savings if more than $1
  const hasSavings = recipe.totalSavings > 1.0;
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
          relative
          w-full flex flex-col
          min-h-[10rem] max-h-[10rem] overflow-hidden
          transition-colors
          ${isSelected ? 'bg-teal-100' : 'bg-gray-100 hover:bg-gray-200'}
          ${!isSelected && recipe.img ? 'filter grayscale' : ''}
          ${recipe.img ? 'bg-cover bg-center' : ''}
        `}
        style={recipe.img ? { backgroundImage: `url(${recipe.img})` } : {}}
      >
        {/* darker overlay for unselected cards with images */}
        {recipe.img && !isSelected && (
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none" />
        )}
        {/* lighter overlay for selected cards with images */}
        {recipe.img && isSelected && (
          <div className="absolute inset-0 bg-black opacity-10 pointer-events-none" />
        )}

        {/* Top left: Gear icon and Serves */}
        <div className="absolute top-2 left-2 z-10">
          {recipe.url && (
            <RecipeViewer
              title={recipe.name}
              url={recipe.url}
              isSelected={isSelected}
              multiplier={multiplier}
              onMultiplierChange={(newMultiplier) => onMultiplierChange(recipe.url, newMultiplier)}
              trigger={
                <div
                  className={`flex items-start cursor-pointer ${recipe.img ? "px-1 bg-white/80 rounded" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings size={14} className="text-gray-500 mr-1 mt-0.5" />
                  <p className="text-xs sm:text-sm text-gray-700 !mb-0">
                    Serves: {recipe.servings}
                  </p>
                </div>
              }
            />
          )}
        </div>

        {/* Multiplier display - separate text block, only show if selected and multiplier != 1 */}
        {isSelected && multiplier !== 1 && (
          <div className="absolute top-7 left-2 z-10">
            <p className={`text-xs sm:text-sm font-bold text-red-600 !mb-0 pt-0 ${recipe.img ? "px-1 bg-white/80 rounded" : ""}`}>
              x{multiplier.toFixed(1).replace('.0', '')}
            </p>
          </div>
        )}

        {/* Top right: Cost, Flyer Items, and Deals */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
          {/* Cost - always show, with nowrap to prevent wrapping */}
          <p className={`text-xs sm:text-sm text-gray-700 !mb-0 text-right whitespace-nowrap ${recipe.img ? "px-1 bg-white/80 rounded" : ""}`}>
            Cost: <span className="font-bold">${recipe.salePrice.toFixed(2)}</span>
          </p>

          {/* Flyer Items - show if available */}
          {hasFlyerItems && (
            <p className={`text-xs sm:text-sm text-blue-600 font-bold !mb-0 max-w-[45px] text-right ${recipe.img ? "px-1 bg-white/80 rounded mt-1" : "mt-1"}`}>
              {recipe.flyerItemsCount} flyer items
            </p>
          )}

          {/* Deals - show only if more than $1 */}
          {hasSavings && (
            <p className={`text-xs sm:text-sm text-green-600 font-bold !mb-0 max-w-[45px] text-right ${recipe.img ? "px-1 bg-white/80 rounded mt-1" : "mt-1"}`}>
              deals ${recipe.totalSavings.toFixed(2)}
            </p>
          )}
        </div>

        {/* Bottom: Recipe Name - inline-block to make it fit content but still wrap if needed */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <span className={`inline-block text-xs sm:text-base font-semibold leading-snug break-words ${recipe.img ? "px-1 bg-white/80 rounded" : ""}`}>
            {recipe.name}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}