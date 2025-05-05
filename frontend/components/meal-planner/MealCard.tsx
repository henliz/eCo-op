'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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
  onMultiplierChange
}: MealCardProps) {
  // Handle increase/decrease in multiplier
  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    if (multiplier > 0) {
      onMultiplierChange(recipe.url, multiplier - 1);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    onMultiplierChange(recipe.url, multiplier + 1);
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'opacity-70'}`}
      onClick={() => onToggle(recipe.url)}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{recipe.name}</CardTitle>

          {/* Multiplier Controls */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
            <button
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200"
              onClick={handleDecrease}
              disabled={multiplier === 0}
            >
              <Minus size={16} className={multiplier === 0 ? "text-gray-400" : ""} />
            </button>

            <span className="text-sm font-medium min-w-[1.5rem] text-center">
              {multiplier}×
            </span>

            <button
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200"
              onClick={handleIncrease}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">
              Servings: {recipe.servings}
            </p>
            <p className="text-sm">
              Regular: <span className="line-through">${(recipe.regularPrice * multiplier).toFixed(2)}</span>
            </p>
            <p className="text-sm">
              Sale: <span className="font-bold">${(recipe.salePrice * multiplier).toFixed(2)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-bold">
              Save ${(recipe.totalSavings * multiplier).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}