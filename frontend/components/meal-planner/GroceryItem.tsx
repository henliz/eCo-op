'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AggregatedItem, type IngredientTags } from './usePlannerStore';
import { Tag, Home, ShoppingCart, ArrowDown, Check } from 'lucide-react';

interface GroceryItemProps {
  item: AggregatedItem;
  onUpdateTags: (packageId: string, tags: Partial<IngredientTags>) => void;
  isAnimating?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

export function GroceryItem({
  item,
  onUpdateTags,
  isAnimating = false,
  onAnimationStart,
  onAnimationComplete
}: GroceryItemProps) {
  // Calculate the correct usage percentage based on how much of the purchased quantity is used
  const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));

  const status = item.tags?.status || 'bought';
  const storeSection = item.tags?.storeSection;

  // Check if the item is "handled" (either owned or in cart)
  const isHandled = status === 'owned' || status === 'in_cart';

  // State to track animation status
  const [showCheckmarkAnimation, setShowCheckmarkAnimation] = useState(false);
  // Track which button was clicked for correct checkmark color
  const [lastClickedButton, setLastClickedButton] = useState<'home' | 'cart' | null>(null);

  // Update animation state when props change
  useEffect(() => {
    if (isAnimating) {
      setShowCheckmarkAnimation(true);
    }
  }, [isAnimating]);

  // Handle animation end
  const handleAnimationEnd = () => {
    setShowCheckmarkAnimation(false);
    setLastClickedButton(null);
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  // Handle status toggle for "owned" and "bought" states
  const handleHomeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (onUpdateTags) {
      // If already owned, set to default state (bought) without animation
      if (status === 'owned') {
        onUpdateTags(item.packageId, { status: 'bought' });
      } else {
        // Set to owned with animation
        if (onAnimationStart) {
          onAnimationStart();
        }

        // Track which button was clicked
        setLastClickedButton('home');

        // Start animation
        setShowCheckmarkAnimation(true);

        // Apply change after a delay to show animation first
        setTimeout(() => {
          onUpdateTags(item.packageId, { status: 'owned' });

          // End animation after another delay
          setTimeout(() => {
            handleAnimationEnd();
          }, 500);
        }, 300);
      }
    }
  };

  // Handle status toggle for "bought in cart" state
  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (onUpdateTags) {
      // If already marked as in cart, set to default state without animation
      if (status === 'in_cart') {
        onUpdateTags(item.packageId, { status: 'bought' });
      } else {
        // Set to in_cart with animation
        if (onAnimationStart) {
          onAnimationStart();
        }

        // Track which button was clicked
        setLastClickedButton('cart');

        // Start animation
        setShowCheckmarkAnimation(true);

        // Apply change after a delay to show animation first
        setTimeout(() => {
          onUpdateTags(item.packageId, { status: 'in_cart' });

          // End animation after another delay
          setTimeout(() => {
            handleAnimationEnd();
          }, 500);
        }, 300);
      }
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
      className="px-4 py-2 relative"
      // Removed onClick handler
    >
      {/* Content container with relative positioning */}
      <div className="relative">
        {/* Top row - Product information with consistent text styling */}
        <div className="flex flex-wrap justify-between items-center mb-1">
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
          {/* Left side - Home icon with improved button styling */}
          <button
            onClick={handleHomeClick}
            className={`w-10 h-10 flex items-center justify-center rounded-full border shadow-sm transition-all duration-200
            ${status === 'owned' 
              ? 'bg-blue-200 text-blue-600 border-blue-300 shadow-blue-100' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 hover:shadow-md active:bg-gray-300 border-gray-300'}`}
            title="I have this at home"
          >
            <Home size={20} />
          </button>

          {/* Middle - Centered pricing information */}
          <div className="flex-1 text-sm text-gray-700 text-center mx-2">
            <span className="whitespace-nowrap">{quantityToBuy} × {item.unitSize} {item.unitType} @ ${item.packPrice.toFixed(2)} = <span className="font-bold">${(quantityToBuy * item.packPrice).toFixed(2)}</span></span>
          </div>

          {/* Right side - Shopping Cart icon with improved button styling */}
          <button
            onClick={handleCartClick}
            className={`w-10 h-10 flex items-center justify-center rounded-full border shadow-sm transition-all duration-200
            ${status === 'in_cart' 
              ? 'bg-green-200 text-green-600 border-green-300 shadow-green-100' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 hover:shadow-md active:bg-gray-300 border-gray-300'}`}
            title="Add to cart"
          >
            <ShoppingCart size={20} />
          </button>
        </div>

        {/* Check mark overlay - with animation */}
        <AnimatePresence>
          {(isHandled || showCheckmarkAnimation) && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{pointerEvents: 'none', zIndex: 5}} // Lower z-index to respect page hierarchy
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.3
              }}
            >
              <motion.div
                className="rounded-full shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px'
                }}
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check
                  size={40}
                  color={
                    // During animation, use the button color that was clicked
                    showCheckmarkAnimation
                      ? (lastClickedButton === 'home' ? '#2563EB' : '#10B981')
                      // When not animating, use the current status color
                      : (status === 'owned' ? '#2563EB' : '#10B981')
                  }
                  strokeWidth={3}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay to slightly fade the content when handled */}
      <AnimatePresence>
        {(isHandled || showCheckmarkAnimation) && (
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              pointerEvents: 'none',
              zIndex: 2 // Lower z-index to respect page hierarchy
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}