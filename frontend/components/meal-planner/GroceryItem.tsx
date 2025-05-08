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
  // Calculate the correct usage percentage based on how much of the purchased quantity is used
  const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));
  const usagePercentage = ((item.neededFraction / quantityToBuy) * 100).toFixed(0);

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

  // Helper function to determine price source display
  const getPriceSourceDisplay = () => {
    if (item.savingsPercentage && item.savingsPercentage > 0) {
      // Case 1: Show discount percentage when available
      return (
        <span className="text-green-600 font-medium text-center text-xs">
          <strong>{item.savingsPercentage.toFixed(0)}% off</strong>
        </span>
      );
    } else if (item.source === 'flyer') {
      // Case 2: Show "flyer item" when source is flyer but no discount
      return (
        <span className="text-blue-600 font-medium text-center text-xs">
          <strong>flyer</strong>
        </span>
      );
    } else if (item.source === 'database') {
      // Case 3: Show "price est" for database/estimated prices
      return (
        <span className="text-gray-500 font-medium text-center text-xs">
          est
        </span>
      );
    }

    // Default case: no indicator
    return null;
  };

  return (
    <div
      className={`cursor-pointer border-b last:border-0 px-4 pt-3 pb-3 ${getStatusStyle()}`}
      onClick={() => onToggle(item.packageId)}
    >
      {/* Top section with product name, discount and checkbox all on same line */}
      <div className="flex items-center mb-1">
        <div className="flex-1 mr-2">
          <span className="text-base font-semibold">
            {item.productName}
            <span className="text-sm text-gray-500 font-normal ml-1">
              ({item.unitSize}{item.unitType})
            </span>
          </span>
        </div>

        {/* Right aligned elements */}
        <div className="flex items-center gap-2">
          {storeSection && (
            <span className="text-xs bg-gray-100 py-0.5 px-1.5 rounded text-gray-600 flex items-center gap-0.5">
              <Tag size={12} />
              {storeSection}
            </span>
          )}

          {/* Price source indicator (discount %, flyer, or est) */}
          {getPriceSourceDisplay()}

          {/* Checkbox on same line as product name */}
          <div className="flex justify-center">
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => onToggle(item.packageId)}
              className="pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Lower section with usage and price info - all same font/color */}
      <div className="flex items-center justify-between text-sm text-gray-700">
        {/* Usage percentage */}
        <div className="flex-1">
          <span className="text-sm">{usagePercentage}% used in meals</span>
        </div>

        {/* Right-aligned numeric data with consistent width */}
        <div className="flex items-center">
          {/* Quantity */}
          <div className="w-16 text-right font-medium">
            {quantityToBuy}×
          </div>

          {/* Each price */}
          <div className="w-20 text-right">
            ${item.packPrice.toFixed(2)}
          </div>

          {/* Total price */}
          <div className="w-20 text-right font-medium">
            ${(quantityToBuy * item.packPrice).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
