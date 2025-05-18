'use client';

import React from 'react';
import { type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Tag, Home, ShoppingCart, ArrowDown } from 'lucide-react';

interface GroceryItemProps {
  item: AggregatedItem;
  onToggle: (packageId: string) => void;
  onUpdateTags?: (packageId: string, tags: Partial<IngredientTags>) => void;
}

export function GroceryItem({ item, onToggle, onUpdateTags }: GroceryItemProps) {
  // Calculate the correct usage percentage based on how much of the purchased quantity is used
  const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));

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

  // Helper function to determine price source display
  const getPriceSourceDisplay = () => {
    if (item.savingsPercentage && item.savingsPercentage > 0) {
      // Case 1: Show discount percentage with downward arrow
      return (
        <span className="text-green-600 font-medium flex items-center whitespace-nowrap">
          <ArrowDown size={16} className="ml-0.5" />
          <strong>{item.savingsPercentage.toFixed(0)}%</strong>

        </span>
      );
    } else if (item.source === 'flyer') {
      // Case 2: Show "flyer item" when source is flyer but no discount
      return (
        <span className="text-blue-600 font-medium whitespace-nowrap">
          <strong>flyer</strong>
        </span>
      );
    } else if (item.source === 'database') {
      // Case 3: Show "price est" for database/estimated prices
      return (
        <span className="text-gray-500 font-medium whitespace-nowrap">
          estimate
        </span>
      );
    }

    // Default case: no indicator
    return null;
  };

  return (
    <div
      className="px-4 py-0"
      onClick={() => onToggle(item.packageId)}
    >
      {/* Top row - Product information with consistent text styling */}
      <div className="flex flex-wrap justify-between items-center mb-0 mt-1">
        {/* Left side - Product name and unit */}
        <div className="text-base flex flex-wrap items-center">
          <span className="font-semibold mr-1">{item.productName}</span>

          {/* Section tag if available */}
          {storeSection && (
            <span className="ml-2 bg-gray-100 py-0.5 px-1.5 rounded text-gray-600 inline-flex items-center whitespace-nowrap">
              <Tag size={12} className="mr-1" />
              {storeSection}
            </span>
          )}
        </div>

        {/* Right side - Flyer/savings indicator */}
        {getPriceSourceDisplay() && (
          <div className="ml-auto mt-1 md:mt-0">
            {getPriceSourceDisplay()}
          </div>
        )}
      </div>

      {/* Bottom row - Icons and centered pricing */}
      <div className="flex items-center">
        {/* Left side - Home icon */}
        <button
          onClick={handleHomeClick}
          className={`w-10 h-10 flex items-center justify-center rounded-full mb-0.5yar
          ${status === 'owned' ? 'bg-blue-200 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <Home size={20} />
        </button>

        {/* Middle - Centered pricing information */}
        <div className="flex-1 text-sm text-gray-700 text-center mx-2">
          <span className="whitespace-nowrap">{quantityToBuy} × {item.unitSize} {item.unitType} @ ${item.packPrice.toFixed(2)} = <span className="font-bold">${(quantityToBuy * item.packPrice).toFixed(2)}</span></span>
        </div>

        {/* Right side - Shopping Cart icon */}
        <button
          onClick={handleCartClick}
          className={`w-10 h-10 flex items-center justify-center rounded-full mb-0.5
          ${status === 'in_cart' ? 'bg-green-200 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <ShoppingCart size={20} />
        </button>
      </div>
    </div>
  );
}