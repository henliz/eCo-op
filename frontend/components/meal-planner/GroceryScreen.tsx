'use client';

import React, { useState } from 'react';
import { usePlannerStore } from './usePlannerStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GroceryItem } from './GroceryItem';

export function GroceryScreen() {
  const { aggregatedIngredients, groceryCheckedItems, toggleGroceryItem } = usePlannerStore();
  const [showDiscretionary, setShowDiscretionary] = useState(false);

  // Get aggregated ingredients as an array for easier display
  const groceryItems = Array.from(aggregatedIngredients().values());

  // Separate items into essential and discretionary
  const essentialItems = groceryItems
    .filter(item => (item.neededFraction * 100) >= 5)
    .sort((a, b) => {
      const aChecked = groceryCheckedItems.has(a.packageId);
      const bChecked = groceryCheckedItems.has(b.packageId);

      // Sort by unchecked first, then by total cost descending
      if (aChecked !== bChecked) {
        return aChecked ? 1 : -1;
      }
      return b.lineCost - a.lineCost;
    });

  const discretionaryItems = groceryItems
    .filter(item => (item.neededFraction * 100) < 5)
    .sort((a, b) => {
      const aChecked = groceryCheckedItems.has(a.packageId);
      const bChecked = groceryCheckedItems.has(b.packageId);

      // Sort by unchecked first, then by total cost descending
      if (aChecked !== bChecked) {
        return aChecked ? 1 : -1;
      }
      return b.lineCost - a.lineCost;
    });

  // Calculate grocery-specific totals
  const groceryTotal = [
    // Essential items always count
    ...essentialItems,
    // Optional items only count when checked
    ...discretionaryItems.filter(item => groceryCheckedItems.has(item.packageId))
  ].reduce((sum, item) => sum + item.lineCost, 0);

  // Calculate count of checked optional items
  const checkedOptionalCount = discretionaryItems.filter(item =>
    groceryCheckedItems.has(item.packageId)
  ).length;

  // Calculate total count for bottom summary
  const totalItemCount = essentialItems.length + checkedOptionalCount;

  return (
    <div className="container mx-auto p-4" style={{ scrollPaddingTop: '80px', scrollPaddingBottom: '200px' }}>
      <div className="space-y-6" style={{ paddingBottom: '200px' }}>
        <Card>
          <div className="sticky top-16 z-10 bg-white border-b">
            <div className="flex justify-between items-center p-2">
              <span className="text-sm font-medium">Shopping List</span>
              <div className="flex items-center gap-4 text-xs font-normal text-gray-500">
                <span className="min-w-[2rem] text-center">Qty</span>
                <span className="min-w-[3rem] text-center">Each</span>
                <span className="min-w-[3rem] text-center">Total</span>
                <span className="min-w-[3rem] text-center"></span>
                <span className="min-w-[1.5rem] text-center"></span>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            {essentialItems.length > 0 ? (
              essentialItems.map(item => (
                <GroceryItem
                  key={item.packageId}
                  item={item}
                  isChecked={groceryCheckedItems.has(item.packageId)}
                  onToggle={toggleGroceryItem}
                />
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">
                Select some meals to generate your shopping list
              </p>
            )}
          </CardContent>
        </Card>

        {discretionaryItems.length > 0 && (
          <Card>
            <CardHeader className="py-2">
              <CardTitle>
                <Collapsible open={showDiscretionary} onOpenChange={setShowDiscretionary}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Optional Items</span>
                        <span className="text-sm font-normal text-gray-500">
                          ({checkedOptionalCount}/{discretionaryItems.length} selected)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-sm font-normal text-gray-500">
                          <span className="min-w-[2rem] text-center">Qty</span>
                          <span className="min-w-[3rem] text-center">Each</span>
                          <span className="min-w-[3rem] text-center">Total</span>
                          <span className="min-w-[3rem] text-center"></span>
                          <span className="min-w-[1.5rem] text-center"></span>
                        </div>
                        <div className="ml-2">
                          {showDiscretionary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-0">
                      {discretionaryItems.map(item => (
                        <GroceryItem
                          key={item.packageId}
                          item={item}
                          isChecked={groceryCheckedItems.has(item.packageId)}
                          onToggle={toggleGroceryItem}
                        />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Bottom summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">
            <p className="text-gray-500">
              {totalItemCount} items to buy
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