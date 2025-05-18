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
import { ExternalLink, X, AlertCircle, Plus, Minus } from 'lucide-react';

interface RecipeViewerProps {
  title: string;
  url: string;
  trigger?: React.ReactNode;
  isSelected?: boolean;
  multiplier?: number;
  onMultiplierChange?: (multiplier: number) => void;
}

export function RecipeViewer({
  title,
  url,
  trigger,
  isSelected = false,
  multiplier = 1,
  onMultiplierChange
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

  // Log for debugging
  console.log(`RecipeViewer ${url}: isSelected=${isSelected}, multiplier=${multiplier}, localMultiplier=${localMultiplier}`);

  // When dialog closes, save the final value back to Zustand
  const handleOpenChange = (open: boolean) => {
    if (isOpen && !open && onMultiplierChange) {
      console.log(`Dialog closing: Updating multiplier from ${multiplier} to ${localMultiplier}`);

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
    console.log(`Decreasing multiplier to ${newValue}`);
    setLocalMultiplier(newValue);
  };

  const increaseMultiplier = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = localMultiplier + 0.5;
    console.log(`Increasing multiplier to ${newValue}`);
    setLocalMultiplier(newValue);
  };

  // Force selection state when dialog is open and multiplier > 0
  useEffect(() => {
    if (isOpen && localMultiplier > 0 && onMultiplierChange && !isSelected) {
      console.log(`Force selection: Recipe ${url} has multiplier ${localMultiplier} but is not selected`);
      onMultiplierChange(localMultiplier);
    }
  }, [isOpen, localMultiplier, isSelected, url, onMultiplierChange]);

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <DialogDescription className="text-sm break-all">
            <span className="font-medium">Recipe URL:</span> {url}
          </DialogDescription>
        </DialogHeader>

        {/* Add multiplier controls - no longer checking isSelected */}
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

        <div className="bg-amber-50 p-4 rounded-md flex flex-col gap-3">
          <div className="flex items-start gap-2 text-amber-700">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              This recipe cannot be displayed directly in our app due to security restrictions on the original website. This is a common protection measure used by most recipe websites.
            </p>
          </div>

          <Button
            onClick={handleOpenNewTab}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            <span>Open Recipe in New Tab</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


