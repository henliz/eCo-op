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
import { ExternalLink, X, AlertCircle } from 'lucide-react';

interface RecipeViewerProps {
  title: string;
  url: string;
  trigger?: React.ReactNode;
}

export function RecipeViewer({ title, url, trigger }: RecipeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
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


