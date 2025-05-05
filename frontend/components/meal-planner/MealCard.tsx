'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { type Recipe } from './usePlannerStore';

interface MealCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onToggle: (url: string) => void;
}

export function MealCard({ recipe, isSelected, onToggle }: MealCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onToggle(recipe.url)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{recipe.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">
              Servings: {recipe.servings}
            </p>
            <p className="text-sm">
              Regular: <span className="line-through">${recipe.regularPrice.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              Sale: <span className="font-bold">${recipe.salePrice.toFixed(2)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-bold">
              Save ${recipe.totalSavings.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}