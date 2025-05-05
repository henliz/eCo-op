'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { type AggregatedItem } from './usePlannerStore';

interface GroceryItemProps {
  item: AggregatedItem;
  isChecked: boolean;
  onToggle: (packageId: string) => void;
}

export function GroceryItem({ item, isChecked, onToggle }: GroceryItemProps) {
  const usagePercentage = (item.neededFraction * 100).toFixed(0);

  return (
    <div
      className={`cursor-pointer p-2 border-b last:border-0`}
      onClick={() => onToggle(item.packageId)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">
              {item.productName} <span className="text-gray-500">({item.unitSize}{item.unitType})</span>
            </p>
            <div className="text-xs text-gray-600">
              {usagePercentage}% used
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