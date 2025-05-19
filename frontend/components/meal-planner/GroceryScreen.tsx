'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlannerStore, type AggregatedItem } from './usePlannerStore';
import { GroceryItem } from './GroceryItem';
import { GroceryListPrintable } from './GroceryListPrintable';

/* -------------------------------- types -------------------------------- */
interface GroceryTotals {
  mealCost: number;     // Cost of the portions used in recipes
  futureUseCost: number; // Cost of the unused portions
  groceryBill: number;  // Total cost to purchase all selected items
  totalSavings: number; // Savings on selected items
}

/* ------------------------------- screen -------------------------------- */
export function GroceryScreen() {
  const {
    aggregatedIngredients,
    setIngredientTags,
  } = usePlannerStore();

  // State to track expanded categories - initialize as empty object
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Track currently animating item
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Get grocery items directly from store rather than managing as state
  const groceryItems = Array.from(aggregatedIngredients().values());

  /* ---------------------- split items by categories ---------------------- */
  // Determine if an item is essential or a pantry staple
  const isEssentialItem = (item: AggregatedItem) => {
    if (item.tags?.status === 'ignored') return false;
    return item.tags?.importance === 'core' || item.neededFraction * 100 >= 25;
  };

  // Group items by category
  const categorizedItems = groceryItems.reduce((acc, item) => {
    // Skip ignored items and items with "free" source
    if (item.tags?.status === 'ignored' || item.source === 'free') return acc;

    // Get the category from the item, or use "Other" if not defined
    const category = item.category || "other";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(item);
    return acc;
  }, {} as Record<string, AggregatedItem[]>);

  // Sort items within each category
  Object.keys(categorizedItems).forEach(category => {
    categorizedItems[category].sort(sortLogic());
  });

  // Get sorted category keys with "Other" at the end
  const sortedCategories = Object.keys(categorizedItems).sort((a, b) => {
    // Always put "Other" at the end
    if (a === "other") return 1;
    if (b === "other") return -1;
    // Otherwise sort alphabetically
    return a.localeCompare(b);
  });

  // Initialize expanded state for all categories if not already set
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    sortedCategories.forEach(category => {
      // If category state doesn't exist yet, set it to closed by default
      if (expandedCategories[category] === undefined) {
        initialExpandedState[category] = false;
      }
    });

    if (Object.keys(initialExpandedState).length > 0) {
      setExpandedCategories(prev => ({...prev, ...initialExpandedState}));
    }
  }, [sortedCategories, expandedCategories]);

  /* ------------------------------ totals ----------------------------------- */
  // Simplified to only consider items with 'in_cart' status
  const calculateGroceryTotals = (): GroceryTotals => {
    let mealCost = 0;
    let futureUseCost = 0;
    let groceryBill = 0;
    let totalSavings = 0;

    // Only consider items that are explicitly marked as 'in_cart'
    const selectedItems = groceryItems.filter(item => item.tags?.status === 'in_cart');

    selectedItems.forEach(item => {
      // Quantity to purchase is always rounded up
      const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));

      // Calculate meal cost (portion actually used in recipes)
      const usedCost = item.packPrice * item.neededFraction;
      mealCost += usedCost;

      // Calculate future use cost (portion not used in current recipes)
      const unusedCost = item.packPrice * Math.max(0, quantityToBuy - item.neededFraction);
      futureUseCost += unusedCost;

      // Calculate total grocery bill (full packages purchased)
      const totalItemCost = item.packPrice * quantityToBuy;
      groceryBill += totalItemCost;

      // Calculate savings based on savings percentage
      if (item.savingsPercentage) {
        // If we're saving 20%, then the sale price is 80% of regular price
        // So regularPrice = salePrice / (1 - savingsPercentage/100)
        const salePrice = totalItemCost; // totalItemCost is already using the sale price
        const regularPrice = salePrice / (1 - item.savingsPercentage / 100);
        totalSavings += (regularPrice - salePrice);
      }
    });

    return {
      mealCost,
      futureUseCost,
      groceryBill,
      totalSavings
    };
  };

  const groceryTotals = calculateGroceryTotals();

  /* ----------------------------- handlers ---------------------------------- */
  // Updated to handle animation coordination
  const handleUpdateTags = (packageId: string) => {
    // Set the animating item ID first
    setAnimatingItemId(packageId);
  };

  // Called when checkmark animation completes
  const handleAnimationComplete = (packageId: string) => {
    // Clear the animating state for this item
    if (animatingItemId === packageId) {
      setAnimatingItemId(null);
    }
  };

  const renderItems = (items: AggregatedItem[]) => {
    return items.map((item, index) => {
      // Determine background color based on both status and essentiality
      let bgColor = '';
      const status = item.tags?.status || 'bought';

      // First check status (higher priority)
      if (status === 'owned') {
        bgColor = 'bg-blue-50 border-blue-200';
      } else if (status === 'in_cart') {
        bgColor = 'bg-green-50 border-green-200';
      } else if (status === 'ignored') {
        bgColor = 'bg-gray-50 border-gray-200 opacity-50';
      }
      // If no status background, check if pantry staple
      else if (!isEssentialItem(item)) {
        bgColor = 'bg-[#FDE2E7]';
      }

      return (
        <motion.div
          key={item.packageId}
          // Apply background color and border
          className={`${bgColor} ${index !== 0 ? "border-t border-gray-300" : ""}`}
          layout
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5
          }}
        >
          <GroceryItem
            item={item}
            onUpdateTags={setIngredientTags} // Pass the direct store update function
            isAnimating={animatingItemId === item.packageId}
            onAnimationStart={() => handleUpdateTags(item.packageId)} // Just track animation start
            onAnimationComplete={() => handleAnimationComplete(item.packageId)}
          />
        </motion.div>
      );
    });
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  /* ----------------------------- JSX --------------------------------------- */
  return (
    <div
      className="container mx-0 p-0 !px-0"
      style={{scrollPaddingTop: '80px', scrollPaddingBottom: '200px'}}
    >
      {/* Render each category section */}
      {sortedCategories.map(category => (
        <div key={category} className="rounded-lg border border-gray-200 overflow-hidden mb-1">
          {/* Category header - now clickable */}
          <div
            className="flex justify-between items-center px-2 py-1 bg-gray-200 cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <div className="flex items-center">
              {/* Expand/collapse icon - fixed size and alignment */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 transition-transform duration-200 flex-shrink-0"
                style={{
                  transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)'
                }}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              <span className="text-lg font-bold">{category}</span>
            </div>
            {/* Right-aligned item count - simplified */}
            <span className="text-sm text-gray-600">
              ({
                // Count items that are marked as in_cart or owned
                categorizedItems[category].filter(item =>
                  item.tags?.status === 'in_cart' || item.tags?.status === 'owned'
                ).length
              } of {
                // Total count excluding items marked as 'ignored'
                categorizedItems[category].filter(item =>
                  item.tags?.status !== 'ignored'
                ).length
              })
            </span>
          </div>

          {/* Category items - conditionally rendered based on expanded state */}
          {expandedCategories[category] && (
            <div>
              <AnimatePresence>
                {categorizedItems[category].length ? (
                  renderItems(categorizedItems[category])
                ) : (
                  <div className="p-2 text-center text-gray-500">
                    No items in this category
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      ))}

      {/* Print button - sticky section above the totals bar */}
      <div className="sticky bottom-14 left-0 right-0 w-full py-5 z-30 print:hidden">
        <div className="flex justify-end px-0">
          <GroceryListPrintable
            groceryItems={groceryItems}
            groceryTotals={groceryTotals}
          />
        </div>
      </div>

      {/* Bottom summary bar with enhanced totals */}
      <div
        className="sticky bottom-0 left-0 right-0 w-screen ml-[calc(-50vw+50%)] bg-gray-200 border-t py-2 shadow-lg pb-4 z-10 mt-2">
        <div className="container mx-auto">
          {/* TOTALS header */}
          <div className="text-center mb-1">
            <span className="font-bold text-lg">TOTALS</span>
          </div>

          {/* Enhanced stats row with 4 metrics - ledger style */}
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-4 w-full max-w-2xl">
              <div className="flex flex-col items-center text-center mx-2">
                <span className="text-sm text-gray-600">Deals</span>
                <span className="font-bold text-green-600">${groceryTotals.totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center text-center mx-2">
                <span className="text-sm text-gray-600">Bill</span>
                <span className="font-bold">${groceryTotals.groceryBill.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center text-center mx-2">
                <span className="text-sm text-gray-600">Recipes</span>
                <span className="font-bold">${groceryTotals.mealCost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center text-center mx-2">
                <span className="text-sm text-gray-600">Leftovers</span>
                <span className="font-bold text-amber-600">${groceryTotals.futureUseCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- helpers ---------------------------------- */
// Simplified sortLogic function - no longer needs checked parameter
function sortLogic(): (a: AggregatedItem, b: AggregatedItem) => number {
  return (a, b) => {
    // Updated priority order: in_cart, bought, owned, ignored
    const statusOrder: Record<'in_cart' | 'owned' | 'bought' | 'ignored', number> = {
      in_cart: 2,
      bought: 1,
      owned: 3,
      ignored: 0
    };

    const aStatus = a.tags?.status || 'bought';
    const bStatus = b.tags?.status || 'bought';

    if (aStatus !== bStatus) return statusOrder[aStatus] - statusOrder[bStatus];

    // Sort by cost if status is the same
    return b.lineCost - a.lineCost;
  };
}