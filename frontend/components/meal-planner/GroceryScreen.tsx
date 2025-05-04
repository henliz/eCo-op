'use client';

import React from 'react';
import { usePlannerStore, type AggregatedItem } from './usePlannerStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export function GroceryScreen() {
  const { aggregatedIngredients, groceryCheckedItems, toggleGroceryItem } = usePlannerStore();

  // Get aggregated ingredients as an array for easier display
  const groceryItems = Array.from(aggregatedIngredients().values());

  // Calculate grocery-specific totals (Qty × Each for purchase)
  const groceryTotal = groceryItems
    .filter(item => !groceryCheckedItems.has(item.packageId))
    .reduce((sum, item) => sum + item.lineCost, 0);

  const GroceryItem = ({ item }: { item: AggregatedItem }) => {
    const isChecked = groceryCheckedItems.has(item.packageId);
    const usagePercentage = (item.neededFraction * 100).toFixed(0);

    return (
      <div
        className={`flex items-center justify-between p-2 border-b last:border-0 ${isChecked ? 'opacity-50' : ''}`}
        onClick={() => toggleGroceryItem(item.packageId)}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => toggleGroceryItem(item.packageId)}
            className="cursor-pointer"
          />
          <div className="min-w-0">
            <p className={`font-medium text-sm ${isChecked ? 'line-through' : ''}`}>
              {item.productName} <span className="text-gray-500">({item.unitSize}{item.unitType})</span>
            </p>
            <div className="text-xs text-gray-600">
              {usagePercentage}% used
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center min-w-[2rem]">
            <span className={`font-medium ${isChecked ? 'line-through' : ''}`}>
              {Math.ceil(item.neededFraction)}×
            </span>
          </div>
          <div className="text-center min-w-[3rem]">
            <span className={`${isChecked ? 'line-through' : ''}`}>
              ${item.packPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-center min-w-[3rem]">
            <span className={`font-medium ${isChecked ? 'line-through' : ''}`}>
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
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Shopping List</span>
              <div className="flex items-center gap-4 text-sm font-normal text-gray-500">
                <span className="min-w-[2rem] text-center">Qty</span>
                <span className="min-w-[3rem] text-center">Each</span>
                <span className="min-w-[3rem] text-center">Total</span>
                <span className="min-w-[3rem] text-center"></span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groceryItems.length > 0 ? (
              groceryItems.map(item => (
                <GroceryItem key={item.packageId} item={item} />
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">
                Select some meals to generate your shopping list
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">
            <p className="text-gray-500">
              {groceryItems.filter(item => !groceryCheckedItems.has(item.packageId)).length} items
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg">
              Total: <span className="font-bold">${groceryTotal.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
