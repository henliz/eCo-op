'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus, Minus, X } from 'lucide-react';

interface RecipeViewerProps {
  title: string;
  url: string;
  trigger?: React.ReactNode;
  isSelected?: boolean;
  multiplier?: number;
  onMultiplierChange?: (multiplier: number) => void;
  ingredients?: string[]; // New prop for ingredients list
}

export function RecipeViewer({
  title,
  url,
  trigger,
  isSelected = false,
  multiplier = 1,
  onMultiplierChange,
  ingredients = [] // Default to empty array
}: RecipeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Local multiplier state that is only used while the dialog is open
  const [localMultiplier, setLocalMultiplier] = useState(multiplier);

  // Keep track of the initial multiplier value when opening
  const initialMultiplier = useRef(multiplier);

  // Update local multiplier when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalMultiplier(multiplier);
      initialMultiplier.current = multiplier;
    }
  }, [isOpen, multiplier]);

  // When dialog closes, save the final value back to Zustand
  const handleOpenChange = (open: boolean) => {
    if (isOpen && !open && onMultiplierChange) {
      // Make sure we're not accidentally setting it to 0
      if (localMultiplier > 0 || initialMultiplier.current !== localMultiplier) {
        onMultiplierChange(localMultiplier);
      }
    }
    setIsOpen(open);
  };

  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const decreaseMultiplier = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = Math.max(0, localMultiplier - 0.5);
    setLocalMultiplier(newValue);
  };

  const increaseMultiplier = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = localMultiplier + 0.5;
    setLocalMultiplier(newValue);
  };

  // Force selection state when dialog is open and multiplier > 0
  useEffect(() => {
    if (isOpen && localMultiplier > 0 && onMultiplierChange && !isSelected) {
      onMultiplierChange(localMultiplier);
    }
  }, [isOpen, localMultiplier, isSelected, url, onMultiplierChange]);

  // Split ingredients into two columns
  const halfLength = Math.ceil(ingredients.length / 2);
  const leftColumnIngredients = ingredients.slice(0, halfLength);
  const rightColumnIngredients = ingredients.slice(halfLength);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-teal-600 hover:text-teal-800"
          >
            <ExternalLink size={16} />
            <span>View Recipe</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {/* Sticky close button - always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(false)}
          className="absolute top-2 right-2 z-50 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <X size={18} />
        </Button>

        <DialogHeader className="flex flex-col gap-2 pt-2 pr-10">
          <div className="flex flex-row items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm break-all">
            <span className="font-medium">Recipe URL:</span> {url}
          </DialogDescription>
        </DialogHeader>

        {/* Multiplier controls */}
        <div className="flex flex-col items-center mb-4">
          <div className="text-sm text-gray-600 mb-2">Recipe Multiplier:</div>
          <div className="flex items-center">
            <button
              onClick={decreaseMultiplier}
              className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-l"
              type="button"
            >
              <Minus size={20}/>
            </button>
            <div
              className="w-16 h-10 flex items-center justify-center font-bold text-lg"
              style={{backgroundColor: '#FFE6D9'}}
            >
              x{localMultiplier.toFixed(1).replace('.0', '')}
            </div>
            <button
              onClick={increaseMultiplier}
              className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-r"
              type="button"
            >
              <Plus size={20}/>
            </button>
          </div>
        </div>

        {/* Ingredients List Section - 2 columns */}
        {ingredients.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Ingredients:</h3>
            <div className="flex flex-row gap-4">
              {/* Left column */}
              <div className="flex-1">
                <ul className="list-disc pl-5 space-y-1">
                  {leftColumnIngredients.map((ingredient, index) => (
                    <li key={index} className="text-sm text-gray-600">{ingredient}</li>
                  ))}
                </ul>
              </div>

              {/* Right column - only show if there are ingredients for it */}
              {rightColumnIngredients.length > 0 && (
                <div className="flex-1">
                  <ul className="list-disc pl-5 space-y-1">
                    {rightColumnIngredients.map((ingredient, index) => (
                      <li key={index + halfLength} className="text-sm text-gray-600">{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        <Button
          onClick={handleOpenNewTab}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2"
        >
          <ExternalLink size={18} />
          <span>Open Recipe in New Tab</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}



