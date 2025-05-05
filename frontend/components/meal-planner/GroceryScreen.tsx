'use client';

import React, { useState } from 'react';
import { usePlannerStore, type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { GroceryItem } from './GroceryItem';

// Define a type for grouped items
interface GroupedItems {
  section: string;
  items: AggregatedItem[];
}

export function GroceryScreen() {
  const {
    aggregatedIngredients,
    groceryCheckedItems,
    toggleGroceryItem,
    setIngredientTags
  } = usePlannerStore();

  const [showDiscretionary, setShowDiscretionary] = useState(false);
  const [groupBySection, setGroupBySection] = useState(false);

  // Get aggregated ingredients as an array for easier display
  const groceryItems = Array.from(aggregatedIngredients().values());

  // Separate items into essential and discretionary
  const essentialItems = groceryItems
    .filter(item => {
      // Filter out ignored items
      if (item.tags?.status === 'ignored') return false;

      // Consider an item essential if it's explicitly tagged as core or if its usage is >= 5%
      return item.tags?.importance === 'core' || (item.neededFraction * 100) >= 5;
    })
    .sort((a, b) => {
      // First sort by status: bought items last, owned items in the middle
      const aStatus = a.tags?.status || 'bought';
      const bStatus = b.tags?.status || 'bought';

      if (aStatus !== bStatus) {
        if (aStatus === 'bought') return 1;
        if (bStatus === 'bought') return -1;
        if (aStatus === 'owned') return 1;
        if (bStatus === 'owned') return -1;
      }

      // Then sort by checked status
      const aChecked = groceryCheckedItems.has(a.packageId);
      const bChecked = groceryCheckedItems.has(b.packageId);

      if (aChecked !== bChecked) {
        return aChecked ? 1 : -1;
      }

      // Then by store section if grouping is enabled
      if (groupBySection) {
        const aSection = a.tags?.storeSection || '';
        const bSection = b.tags?.storeSection || '';
        if (aSection !== bSection) {
          return aSection.localeCompare(bSection);
        }
      }

      // Finally by cost
      return b.lineCost - a.lineCost;
    });

  const discretionaryItems = groceryItems
    .filter(item => {
      // Filter out ignored items
      if (item.tags?.status === 'ignored') return false;

      // Consider an item discretionary if it's explicitly tagged as optional or if its usage is < 5%
      return item.tags?.importance === 'optional' || (item.neededFraction * 100) < 5;
    })
    .sort((a, b) => {
      // First sort by status: bought items last, owned items in the middle
      const aStatus = a.tags?.status || 'bought';
      const bStatus = b.tags?.status || 'bought';

      if (aStatus !== bStatus) {
        if (aStatus === 'bought') return 1;
        if (bStatus === 'bought') return -1;
        if (aStatus === 'owned') return 1;
        if (bStatus === 'owned') return -1;
      }

      // Then sort by checked status
      const aChecked = groceryCheckedItems.has(a.packageId);
      const bChecked = groceryCheckedItems.has(b.packageId);

      if (aChecked !== bChecked) {
        return aChecked ? 1 : -1;
      }

      // Then by store section if grouping is enabled
      if (groupBySection) {
        const aSection = a.tags?.storeSection || '';
        const bSection = b.tags?.storeSection || '';
        if (aSection !== bSection) {
          return aSection.localeCompare(bSection);
        }
      }

      // Finally by cost
      return b.lineCost - a.lineCost;
    });

  // Calculate grocery-specific totals
  const groceryTotal = [
    // Essential items with status bought
    ...essentialItems.filter(item => item.tags?.status !== 'owned'),
    // Optional items only count when checked and status is bought
    ...discretionaryItems.filter(item =>
      groceryCheckedItems.has(item.packageId) && item.tags?.status !== 'owned'
    )
  ].reduce((sum, item) => sum + item.lineCost, 0);

  // Calculate count of checked optional items
  const checkedOptionalCount = discretionaryItems.filter(item =>
    groceryCheckedItems.has(item.packageId)
  ).length;

  // Calculate total count for bottom summary (exclude owned items)
  const totalItemCount =
    essentialItems.filter(item => item.tags?.status !== 'owned').length +
    discretionaryItems.filter(item =>
      groceryCheckedItems.has(item.packageId) && item.tags?.status !== 'owned'
    ).length;

  // Handle updating tags for an item
  const handleUpdateTags = (packageId: string, tags: Partial<IngredientTags>) => {
    setIngredientTags(packageId, tags);
  };

  // Group items by store section if enabled
  const getGroupedItems = (items: AggregatedItem[]): GroupedItems[] => {
    if (!groupBySection) return items.map(item => ({ section: '', items: [item] }));

    // Get all unique sections
    const sections = new Set<string>();
    items.forEach(item => {
      const section = item.tags?.storeSection || 'Uncategorized';
      sections.add(section);
    });

    // Return a map of section -> items
    return Array.from(sections).sort().map(section => ({
      section,
      items: items.filter(item => (item.tags?.storeSection || 'Uncategorized') === section)
    }));
  };

  const renderItems = (items: AggregatedItem[]) => {
    if (groupBySection) {
      const groupedItems = getGroupedItems(items);

      return groupedItems.map(group => (
        <div key={group.section} className="mb-2">
          <div className="bg-gray-100 p-2 font-medium text-sm flex items-center">
            <Tag size={14} className="mr-1" />
            {group.section}
          </div>
          {group.items.map(item => (
            <GroceryItem
              key={item.packageId}
              item={item}
              isChecked={groceryCheckedItems.has(item.packageId)}
              onToggle={toggleGroceryItem}
              onUpdateTags={handleUpdateTags}
            />
          ))}
        </div>
      ));
    }

    return items.map(item => (
      <GroceryItem
        key={item.packageId}
        item={item}
        isChecked={groceryCheckedItems.has(item.packageId)}
        onToggle={toggleGroceryItem}
        onUpdateTags={handleUpdateTags}
      />
    ));
  };

  return (
    <div className="container mx-auto p-4" style={{ scrollPaddingTop: '80px', scrollPaddingBottom: '200px' }}>
      <div className="space-y-6" style={{ paddingBottom: '200px' }}>
        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Shopping List</h1>
          <button
            onClick={() => setGroupBySection(!groupBySection)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
              groupBySection ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            <Tag size={16} />
            {groupBySection ? 'Grouped by Section' : 'Group by Section'}
          </button>
        </div>

        <Card>
          <div className="sticky top-16 z-10 bg-white border-b">
            <div className="flex justify-between items-center p-2">
              <span className="text-sm font-medium">Essential Items</span>
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
              renderItems(essentialItems)
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
                      {renderItems(discretionaryItems)}
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
