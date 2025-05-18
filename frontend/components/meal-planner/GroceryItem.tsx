'use client';

import React from 'react';
import { type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Tag, Home, ShoppingCart } from 'lucide-react';

interface GroceryItemProps {
  item: AggregatedItem;
  onToggle: (packageId: string) => void;
  onUpdateTags?: (packageId: string, tags: Partial<IngredientTags>) => void;
}

export function GroceryItem({ item, onToggle, onUpdateTags }: GroceryItemProps) {
  // Calculate the correct usage percentage based on how much of the purchased quantity is used
  const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));
  const usagePercentage = ((item.neededFraction / quantityToBuy) * 100).toFixed(0);

  const status = item.tags?.status || 'bought';
  const storeSection = item.tags?.storeSection;

  // Handle status toggle for "owned" and "bought" states
  const handleHomeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (onUpdateTags) {
      // If already owned, set to default state (bought)
      // If in another state, set to owned
      const newStatus = status === 'owned' ? 'bought' : 'owned';
      onUpdateTags(item.packageId, { status: newStatus });
    }
  };

  // Handle status toggle for "bought in cart" state
  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (onUpdateTags) {
      // If already marked as in cart, set to default state
      // If in another state, set to in cart
      const newStatus = status === 'in_cart' ? 'bought' : 'in_cart';
      onUpdateTags(item.packageId, { status: newStatus });
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'owned':
        return 'bg-blue-50 border-blue-200';
      case 'in_cart':
        return 'bg-green-50 border-green-200';
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
      {/* Top section with product name, discount and action buttons */}
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

          {/* Status action buttons */}
          <button
            onClick={handleHomeClick}
            className={`w-8 h-8 flex items-center justify-center rounded-full 
            ${status === 'owned' ? 'bg-blue-200 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Home size={16} />
          </button>

          <button
            onClick={handleCartClick}
            className={`w-8 h-8 flex items-center justify-center rounded-full 
            ${status === 'in_cart' ? 'bg-green-200 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>

      {/* Lower section with usage and price info - all same font/color */}
      <div className="flex items-center justify-between text-sm text-gray-700">
        {/* Usage percentage */}
        <div className="flex-1">
          <span className="text-sm font-normal">{usagePercentage}% used in recipes</span>
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