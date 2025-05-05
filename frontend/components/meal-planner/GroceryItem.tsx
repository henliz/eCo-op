'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Tag } from 'lucide-react';

interface GroceryItemProps {
  item: AggregatedItem;
  isChecked: boolean;
  onToggle: (packageId: string) => void;
  onUpdateTags?: (packageId: string, tags: Partial<IngredientTags>) => void;
}

export function GroceryItem({ item, isChecked, onToggle }: GroceryItemProps) {
  const usagePercentage = (item.neededFraction * 100).toFixed(0);
  const status = item.tags?.status || 'bought';
  const storeSection = item.tags?.storeSection;

  const getStatusStyle = () => {
    switch (status) {
      case 'owned':
        return 'bg-blue-50 border-blue-200';
      case 'ignored':
        return 'bg-gray-50 border-gray-200 opacity-50';
      default:
        return '';
    }
  };

  return (
    <div
      className={`cursor-pointer border-b last:border-0 px-4 pt-2 pb-4 ${getStatusStyle()}`}
      onClick={() => onToggle(item.packageId)}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold truncate">
          {item.productName}
          <span className="text-sm text-gray-500 font-normal ml-1">
            ({item.unitSize}{item.unitType})
          </span>
        </p>

        {storeSection && (
          <span className="text-xs bg-gray-100 py-0.5 px-1.5 rounded text-gray-600 flex items-start gap-0.5">
            <Tag size={12} />
            {storeSection}
          </span>
        )}
      </div>

      {/* Lower section */}
      <div className="flex items-start justify-between gap-4 text-sm">
        <div className="flex items-start gap-2 text-xs text-gray-600 flex-1">
          <span>{usagePercentage}% used</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center min-w-[2rem] font-medium">
            {Math.ceil(item.neededFraction)}×
          </div>
          <div className="text-center min-w-[3rem]">
            ${item.packPrice.toFixed(2)}
          </div>
          <div className="text-center min-w-[3rem] font-medium">
            ${item.lineCost.toFixed(2)}
          </div>
          <div className="text-center min-w-[3rem]">
            {item.savingsPercentage && item.savingsPercentage > 0 ? (
              <span className="text-green-600 font-medium">
                {item.savingsPercentage.toFixed(0)}% off
              </span>
            ) : null}
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
