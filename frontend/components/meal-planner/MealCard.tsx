'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Recipe } from './usePlannerStore';
import { Plus, Minus, ExternalLink } from 'lucide-react';
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
  const dec = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMultiplierChange(recipe.url, Math.max(0, multiplier - 0.5));
  };
  const inc = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMultiplierChange(recipe.url, multiplier + 0.5);
  };

  const hasSavings = recipe.totalSavings > 0;
  const hasFlyer   = recipe.flyerItemsCount > 0;

  return (
    <motion.div
      layout
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
          bg-gray-100 hover:bg-gray-200
          ${isSelected ? 'bg-teal-100 filter-none opacity-100' : ''}
          ${!isSelected && recipe.img ? 'filter grayscale opacity-60' : ''}
          ${recipe.img ? 'bg-cover bg-center' : ''}
        `}
        style={recipe.img ? { backgroundImage: `url(${recipe.img})` } : {}}
      >
        {/* white overlay to fade image to 80% */}
        {recipe.img && (
          <div className="absolute inset-0 bg-white opacity-20 pointer-events-none" />
        )}

        {/* content wrapper above overlay */}
        <div className="relative z-10 flex flex-col flex-grow">
          <CardHeader className="!pl-3 !pr-2 !pb-1 !pt-3 !mb-0 bg-transparent">
            <CardTitle className="text-sm sm:text-lg font-semibold leading-snug break-words text-black">
              <div className="flex justify-between items-start">
                <span>{recipe.name}</span>
                {recipe.url && (
                  <span
                    onClick={e => e.stopPropagation()}
                    className="flex shrink-0 ml-1 text-gray-500 hover:text-teal-600"
                  >
                    <RecipeViewer
                      title={recipe.name}
                      url={recipe.url}
                      trigger={<ExternalLink size={16} className="cursor-pointer" />}
                    />
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm mt-2 ml-1 mr-3">
                <p className="text-gray-800 mb-0">Servings: {recipe.servings}</p>
                <p className="text-gray-800 mb-0">
                  Cost: <span className="font-bold">${recipe.salePrice.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex justify-end text-xs sm:text-sm mr-3 mt-1">
                {hasSavings ? (
                  <p className="text-green-700 font-bold mb-0">
                    Deals: ${recipe.totalSavings.toFixed(2)}
                  </p>
                ) : hasFlyer ? (
                  <p className="text-blue-700 font-bold mb-0">
                    {recipe.flyerItemsCount} flyer items
                  </p>
                ) : null}
              </div>
            </CardTitle>
          </CardHeader>

          {isSelected && (
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
              <button
                onClick={dec}
                className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-l"
              >
                <Minus size={20} />
              </button>
              <div
                className="w-16 h-10 flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: '#FFE6D9' }}
              >
                x{multiplier.toFixed(1).replace(/\.0$/, '')}
              </div>
              <button
                onClick={inc}
                className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-r"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
