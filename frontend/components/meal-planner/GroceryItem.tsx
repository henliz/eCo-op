'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Tag, ShoppingCart, Home, X } from 'lucide-react';

interface GroceryItemProps {
  item: AggregatedItem;
  isChecked: boolean;
  onToggle: (packageId: string) => void;
  onUpdateTags?: (packageId: string, tags: Partial<IngredientTags>) => void;
}

export function GroceryItem({ item, isChecked, onToggle, onUpdateTags }: GroceryItemProps) {
  const usagePercentage = (item.neededFraction * 100).toFixed(0);

  // Get status with default fallback
  const status = item.tags?.status || 'bought';
  const importance = item.tags?.importance || 'core';
  const storeSection = item.tags?.storeSection;

  // Style based on status
  const getStatusStyle = () => {
    switch (status) {
      case 'owned':
        return 'bg-blue-50 border-blue-200';
      case 'ignored':
        return 'bg-gray-50 border-gray-200 opacity-50';
      default: // bought
        return '';
    }
  };

  // Style based on importance
  const getImportanceStyle = () => {
    return importance === 'optional' ? 'italic' : 'font-medium';
  };

  const handleStatusChange = (newStatus: 'bought' | 'owned' | 'ignored') => {
    if (onUpdateTags) {
      onUpdateTags(item.packageId, { status: newStatus });
    }
  };

  const handleImportanceToggle = () => {
    if (onUpdateTags) {
      const newImportance = importance === 'core' ? 'optional' : 'core';
      onUpdateTags(item.packageId, { importance: newImportance });
    }
  };

  return (
    <div
      className={`cursor-pointer p-2 border-b last:border-0 ${getStatusStyle()}`}
      onClick={() => onToggle(item.packageId)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`text-sm ${getImportanceStyle()}`}>
                {item.productName} <span className="text-gray-500">({item.unitSize}{item.unitType})</span>
              </p>

              {/* Store section tag if available */}
              {storeSection && (
                <span className="text-xs bg-gray-100 py-0.5 px-1.5 rounded text-gray-600 flex items-center gap-0.5">
                  <Tag size={12} />
                  {storeSection}
                </span>
              )}
            </div>

            <div className="text-xs text-gray-600 flex items-center gap-4">
              <span>{usagePercentage}% used</span>

              {/* Status indicator buttons - only show if onUpdateTags is provided */}
              {onUpdateTags && (
                <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                  <button
                    className={`p-1 rounded-md ${status === 'bought' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                    onClick={() => handleStatusChange('bought')}
                    title="Need to buy"
                  >
                    <ShoppingCart size={14} className={status === 'bought' ? 'text-green-600' : 'text-gray-500'} />
                  </button>

                  <button
                    className={`p-1 rounded-md ${status === 'owned' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => handleStatusChange('owned')}
                    title="Already own"
                  >
                    <Home size={14} className={status === 'owned' ? 'text-blue-600' : 'text-gray-500'} />
                  </button>

                  <button
                    className={`p-1 rounded-md ${status === 'ignored' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    onClick={() => handleStatusChange('ignored')}
                    title="Skip this item"
                  >
                    <X size={14} className={status === 'ignored' ? 'text-gray-600' : 'text-gray-500'} />
                  </button>

                  <button
                    className={`ml-1 p-1 rounded-md ${importance === 'optional' ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                    onClick={handleImportanceToggle}
                    title={importance === 'core' ? 'Mark as optional' : 'Mark as core ingredient'}
                  >
                    <Tag size={14} className={importance === 'optional' ? 'text-yellow-600' : 'text-gray-500'} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm ml-4">
          <div className="text-center min-w-[2rem]">
            <span className="font-medium">
              {Math.ceil(item.neededFraction)}×
            </span>
          </div>
          <div className="text-center min-w-[3rem]">
            <span>
              ${item.packPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-center min-w-[3rem]">
            <span className="font-medium">
              ${item.lineCost.toFixed(2)}
            </span>
          </div>
          <div className="text-center min-w-[3rem]">
            {item.savingsPercentage && item.savingsPercentage > 0 ? (
              <span className="text-green-600 font-medium">
                {item.savingsPercentage.toFixed(0)}% off
              </span>
            ) : (
              <span></span>
            )}
          </div>
          <div className="min-w-[1.5rem] flex justify-center">
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => {}}
              className="pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}