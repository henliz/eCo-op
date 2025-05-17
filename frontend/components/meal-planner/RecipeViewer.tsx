'use client';

import React, { useState } from 'react';
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

  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const decreaseMultiplier = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMultiplierChange) {
      onMultiplierChange(Math.max(0, multiplier - 0.5));
    }
  };

  const increaseMultiplier = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMultiplierChange) {
      onMultiplierChange(multiplier + 0.5);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
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
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <DialogDescription className="text-sm break-all">
            <span className="font-medium">Recipe URL:</span> {url}
          </DialogDescription>
        </DialogHeader>

        {/* Add multiplier controls if recipe is selected */}
        {isSelected && onMultiplierChange && (
          <div className="flex flex-col items-center mb-4">
            <div className="text-sm text-gray-600 mb-2">Recipe Multiplier:</div>
            <div className="flex items-center">
              <button
                onClick={decreaseMultiplier}
                className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-l"
              >
                <Minus size={20}/>
              </button>
              <div
                className="w-16 h-10 flex items-center justify-center font-bold text-lg"
                style={{backgroundColor: '#FFE6D9'}}
              >
                x{multiplier.toFixed(1).replace('.0', '')}
              </div>
              <button
                onClick={increaseMultiplier}
                className="bg-gray-200 hover:bg-gray-400 w-12 h-10 flex items-center justify-center rounded-r"
              >
                <Plus size={20}/>
              </button>
            </div>
          </div>
        )}

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


