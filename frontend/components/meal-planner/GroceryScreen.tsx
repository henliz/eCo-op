'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlannerStores as usePlannerStore, type AggregatedItem, getPlannerStores } from '@/stores/usePlannerStores';

import { GroceryItem } from './GroceryItem';
import { GroceryListPrintable } from './GroceryListPrintable';
import { StoreCard } from './StoreCard'; // Import the StoreCard component

// Based on the project structure in eCo-op.json
// - frontend/components/icons/CategoryIcons
// - frontend/components/meal-planner/GroceryScreen.tsx
import CategoryIcons from '../icons/CategoryIcons';

// In case the above import fails, try another approach
// let CategoryIcons;
// try {
//   // Using dynamic import() is not possible in this context, so we'll use a try/catch pattern
//   CategoryIcons = require('../../icons/CategoryIcons').default;
//   console.log('CategoryIcons import succeeded:', CategoryIcons);
// } catch (error) {
//   console.error('CategoryIcons import failed:', error.message);
//   CategoryIcons = null;
// }

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
    selectedStore,
    availableStores,
  } = usePlannerStore();

  // State to track expanded categories - initialize as empty object
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Track currently animating item
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Get grocery items directly from store rather than managing as state
  const groceryItems = Array.from(aggregatedIngredients().values());

  // Get selected store information
  const selectedStoreInfo = availableStores.find(store => store.id === selectedStore);

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

  // Function to get an appropriate icon for a category
  const getCategoryIcon = (category: string) => {
    // Try to use imported CategoryIcons
    if (CategoryIcons && typeof CategoryIcons === 'object') {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '');

      try {
        // Type-safe check if the key exists in CategoryIcons
        if (categoryKey in CategoryIcons && typeof CategoryIcons[categoryKey as keyof typeof CategoryIcons] === 'function') {
          const Icon = CategoryIcons[categoryKey as keyof typeof CategoryIcons];
          return <Icon className="w-5 h-5" />;
        }

        // Fall back to default or 'other' icon from CategoryIcons
        if ('other' in CategoryIcons && typeof CategoryIcons.other === 'function') {
          return <CategoryIcons.other className="w-5 h-5" />;
        }
      } catch {
        // Silently fail and use fallback
      }
    }

    // Fallback to built-in SVG icons
    return getFallbackIcon(category);
  };

  // Fallback icons if CategoryIcons can't be imported
  const getFallbackIcon = (category: string) => {
    const categoryLower = category.toLowerCase();

    // Define a mapping of category to icon color and path
    // Using more recognizable icons for each grocery category
    const iconMap: {[key: string]: {color: string, path: string, viewBox?: string}} = {
      produce: {
        color: '#4CAF50',
        path: 'M8.3 11.5c-.6 0-1-.5-1-1 0-.6.4-1 1-1h1.7V7.8c0-.6.4-1 1-1 .5 0 1 .4 1 1v1.7h1.7c.6 0 1 .4 1 1 0 .5-.4 1-1 1H12v1.7c0 .6-.5 1-1 1-.6 0-1-.4-1-1v-1.7H8.3zm8.7 1c0-2.8-2.2-5-5-5s-5 2.2-5 5c0 1.5.7 2.9 1.7 3.8L7.5 21h9L15.3 16.3c1-.9 1.7-2.3 1.7-3.8zM9.5 7c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5S9.5 8.4 9.5 7zm-3-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm13 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM12 2c.6 0 1 .4 1 1v1c0 .6-.4 1-1 1s-1-.4-1-1V3c0-.6.4-1 1-1z',
        viewBox: '0 0 24 24'
      },
      fruits: {
        color: '#E91E63',
        path: 'M7 10a5 5 0 015-5c1 0 1.9.3 2.7.7.3-.7.8-1.4 1.3-1.9.8-.9 1.8-1.6 2.8-2.2C15 .6 12.6 0 10 0 4.5 0 0 4.5 0 10c0 2.6.6 5 1.6 7.2.6-1 1.3-2 2.2-2.8.5-.5 1.2-1 1.9-1.3-.4-.8-.7-1.7-.7-2.7V10zm10 0c0 .5-.1 1-.3 1.4.8.5 1.5 1 2.1 1.6 1.4 1.5 2.5 3.5 3 5.7C24.3 16.7 25 13.5 25 10c0-5.5-4.5-10-10-10-3.5 0-6.7.7-8.8 3.2 2.1.5 4.2 1.6 5.7 3 .6.6 1.1 1.3 1.6 2.1.4-.2.9-.3 1.4-.3h.1z M16.3 13.1c-2.4 2.4-4.2 5.3-4.9 8-1.5 5.7.4 7.7 5.7 7.7 5.6 0 7.3-2.5 5.7-7.7-.7-2.7-2.5-5.6-4.9-8l-.8-.8-.8.8z',
        viewBox: '0 0 25 30'
      },
      vegetables: {
        color: '#8BC34A',
        path: 'M7 17.85c0-3.47 2.68-6.3 6.01-6.3 3.5 0 5.99 2.83 5.99 6.3M7 6.69C7 5.97 7.59 5.4 8.32 5.4h7.36c.73 0 1.32.57 1.32 1.29M12 2v7.1m-9 5.3h18',
        viewBox: '0 0 24 24'
      },
      meat: {
        color: '#FF5722',
        path: 'M20.16 12.73c-.27-.2-.55-.37-.86-.5l.18-.47c.48-1.34.07-3.22-1.12-5.26a9.9 9.9 0 0 0-2.32-2.7A9.88 9.88 0 0 0 12.34 2L11.88 2l-.46.1c-1.47.32-2.68 1.15-3.4 2.33a5.27 5.27 0 0 0-.94 3.53c.1.61.36 1.03.65 1.38 0 .18-.01.37-.01.56l.15 6.9a4.26 4.26 0 0 0 4.4 4.2h2.72A4.26 4.26 0 0 0 19.35 17l.18-2.2v-.04l.01-.05v-.04l.01-.05v-.05l.01-.04v-.05l.01-.04v-.05l.01-.04v-.05l.01-.05v-.04l.02-.18.09-1.11.13-1.58c.15-.28.24-.6.26-.94.05-.63-.08-1.22-.35-1.69zM16.13 6a1.5 1.5 0 1 1 2.12-2.12A1.5 1.5 0 0 1 16.13 6z',
        viewBox: '0 0 24 24'
      },
      dairy: {
        color: '#03A9F4',
        path: 'M12 5h8v2h-1l-2 13H7L5 7H4V5h8zm-1 3h-.8L9 17h6l-1.2-9H11zm-3.33 2l-.67-2H7.5l.67 2H7.67zm3.33 0l-.67-2h-1.5l.67 2h1.5zm3.33 0l-.67-2h-1.5l.67 2h1.5z',
        viewBox: '0 0 24 24'
      },
      bakery: {
        color: '#FFC107',
        path: 'M12 5C7.8 5 4.4 8.4 4.4 12.6c0 4.1 3.4 7.5 7.6 7.5 4.1 0 7.6-3.4 7.6-7.5 0-4.2-3.5-7.6-7.6-7.6zm0 2c2.2 0 4.1 1.3 5 3.2-1.1.4-2.3.6-3.5.6-1.3 0-2.6-.1-3.8-.5.9-2 2.8-3.3 4.9-3.3h.4zm.4 7.2c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5.7-1.5 1.5.7 1.5 1.5 1.5zm3.5-9.5c0 .6.4 1 1 1s1-.4 1-1-.4-1-1-1-1 .4-1 1zM5 4.7c0 .6.4 1 1 1s1-.4 1-1-.4-1-1-1-1 .4-1 1z',
        viewBox: '0 0 24 24'
      },
      pantry: {
        color: '#795548',
        path: 'M20 2H4C3 2 2 2.9 2 4v3h20V4c0-1.1-1-2-2-2zM4 22h16c1 0 2-.9 2-2V10H2v10c0 1.1 1 2 2 2zM12 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
        viewBox: '0 0 24 24'
      },
      frozen: {
        color: '#00BCD4',
        path: 'M12 2.5l2 2h3l1 2 2 1v3l2 2-2 2v3l-2 1-1 2h-3l-2 2-2-2H7l-1-2-2-1v-3L2 12l2-2V7l2-1 1-2h3l2-2zm0 4L9 9.5 6 10l3 .5L12 14l3-3.5 3-.5-3-.5L12 6.5z',
        viewBox: '0 0 24 24'
      },
      seafood: {
        color: '#1565C0',
        path: 'M19 16.9c0-1.5-2.2-2.7-3.9-3.6-.3.9-.5 1.8-.5 2.9 0 1.5 1.1 2.8 2.6 2.8 1-.1 1.8-.9 1.8-2.1zM5 16.9c0 1.2.8 2 1.8 2 1.5 0 2.6-1.3 2.6-2.8 0-1-.2-2-.5-2.9-1.7.9-3.9 2.1-3.9 3.7zm12.2-6.5c.9-.4 1.8-.5 2.8-.5 1.5 0 2 .8 2 1.8 0 1.5-1.3 2.6-2.8 2.6-1 0-2-.2-2.9-.5.4-.8.7-1.9.9-3.4zm-8.2-4c1.2 0 2.1.8 2.1 1.8 0 1.5-1.3 2.6-2.8 2.6-1 0-2-.2-2.9-.5.9-1.7 2.1-3.9 3.6-3.9zm14-4.4C21 1 20.2 0 18.6 0c-3.6 0-6.4 4.6-7.3 7.2-.3 1-.6 3.3-.6 4.2 0 .9.3 3.2.6 4.2.7 2.3 2.9 5.9 5.8 6.6.7.2 1.5.2 2.2 0 2.9-.7 5.1-4.3 5.8-6.6.3-1 .6-3.3.6-4.2 0-.9-.3-3.2-.6-4.2-.7-2.1-2.4-5-4.4-6.2zM4.8 5.5c.9-1.7 2.1-3.9 3.6-3.9 1.2 0 2.1.8 2.1 1.8 0 1.5-1.3 2.6-2.8 2.6-1 0-2-.2-2.9-.5zM1.3 6.8C-.2 7.5-1.5 11 2.1 11.9c.7.2 1.5.2 2.2 0 2.9-.7 5.1-4.3 5.8-6.6.3-1 .6-3.3.6-4.2 0-.9-.3-3.2-.6-4.2C9.3-5.7 3.8.8 1.9 3.8c-.7 1-.6 2.3-.6 3z',
        viewBox: '0 0 24 20'
      },
      beverages: {
        color: '#7B1FA2',
        path: 'M7 21v-2h10v2H7zm4-8h2v4h-2v-4zm3-10h-6l-2 3h10l-2-3zM5 6v8c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4V6H5z',
        viewBox: '0 0 24 24'
      },
      condiments: {
        color: '#FF9800',
        path: 'M9 10v8l3 3 3-3v-8H9zm3-9L8 5v3h8V5l-4-4zm-1 11.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S12.3 11 11.5 11 10 11.7 10 12.5z',
        viewBox: '0 0 24 24'
      },
      spices: {
        color: '#FF5722',
        path: 'M5.5 22v-4s2 .2 3 0c1.8-.4 2.5-1.5 2.5-3.5 0-3.4-2.8-3.7-3-3.7V2c3.5 0 8 1.7 8 6.5 0 4.7-3.8 6.5-8 6.5V22h-2.5zM16 6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm0 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z',
        viewBox: '0 0 24 24'
      },
      other: {
        color: '#607D8B',
        path: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h12V4H6zm1 1h10v2H7V5zm0 3h10v2H7V8zm0 3h7v2H7v-2z',
        viewBox: '0 0 24 24'
      }
    };

    // Check if we have an icon for this category, otherwise use 'other'
    const iconConfig = iconMap[categoryLower] || iconMap.other;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox={iconConfig.viewBox || "0 0 24 24"}
        fill="none"
        stroke={iconConfig.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d={iconConfig.path} />
      </svg>
    );
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
      {/* Store information card */}
      {selectedStore && selectedStoreInfo && (
        <div className="mb-3">
          <StoreCard
            store={selectedStoreInfo}
          />
        </div>
      )}

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

              {/* Category icon */}
              <span className="mr-2">
                {getCategoryIcon(category)}
              </span>

              <span className="text-lg font-bold">{category}</span>
            </div>
            {/* Right-aligned item count - updated to show "X needed" or "done" */}
            <span className="text-sm">
              {(() => {
                // Count items that are marked as in_cart or owned
                const handledCount = categorizedItems[category].filter(item =>
                  item.tags?.status === 'in_cart' || item.tags?.status === 'owned'
                ).length;

                // Total count excluding items marked as 'ignored'
                const totalCount = categorizedItems[category].filter(item =>
                  item.tags?.status !== 'ignored'
                ).length;

                // Calculate how many are still needed
                const neededCount = totalCount - handledCount;

                if (neededCount === 0) {
                  return (
                    <span className="text-green-600 font-semibold flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      done
                    </span>
                  );
                } else {
                  return (
                    <span className="text-gray-600">
                      <strong>{neededCount}</strong> needed
                    </span>
                  );
                }
              })()}
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
            store={selectedStoreInfo ? {
              name: selectedStoreInfo.name,
              location: selectedStoreInfo.location
            } : undefined}
            //selectedRecipes={usePlannerStore.getState().selectedRecipes()}
            selectedRecipes={getPlannerStores().selectedRecipes()}
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
