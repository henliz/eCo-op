'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { type AggregatedItem } from '@/stores/usePlannerStores';


interface GroceryTotals {
  mealCost: number;
  futureUseCost: number;
  groceryBill: number;
  totalSavings: number;
}

// Add store information to props
interface StoreInfo {
  name: string;
  location: string;
}

// Add Recipe interface
interface Recipe {
  name: string;
  url: string;
  multiplier?: number;
}

interface GroceryListPrintableProps {
  groceryItems: AggregatedItem[];
  // Commenting out this prop since we're not using it anymore
  // groceryCheckedItems: Set<string>;
  groceryTotals: GroceryTotals;
  // Add optional store prop
  store?: StoreInfo;
  // Add selected recipes
  selectedRecipes?: Recipe[];
}

export function GroceryListPrintable({
  groceryItems,
  // Remove the groceryCheckedItems parameter since we're not using it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groceryTotals, // Need to keep this prop to avoid build errors, but it's not used in this component
  store, // Add the store parameter
  selectedRecipes = [] // Add selected recipes with default empty array
}: GroceryListPrintableProps) {

  // Handle print function
  const handlePrint = () => {
    // Create a new window for the printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print your grocery list.');
      return;
    }

    // Filter items - exclude 'owned' (home), 'ignored', and 'free' items
    const filteredItems = groceryItems.filter(item =>
      !(item.tags?.status === 'owned' || item.tags?.status === 'ignored' || item.source === 'free')
    );

    if (filteredItems.length === 0) {
      alert('No grocery items available to print.');
      printWindow.close();
      return;
    }

    // Group items by category
    const categorizedItems = filteredItems.reduce((acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, AggregatedItem[]>);

    // Sort categories with "Other" at the end
    const sortedCategories = Object.keys(categorizedItems).sort((a, b) => {
      if (a === "Other" || a === "other") return 1;
      if (b === "Other" || b === "other") return -1;
      return a.localeCompare(b);
    });

    // Create the print-optimized HTML content with improved multi-column layout
    let printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>skrimp.ai Grocery List</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              height: 100%;
              overflow: auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.3;
              color: black;
              background: white;
              padding: 0.5cm;
              font-size: 9pt;
              position: relative;
            }
            
            /* Header styles - with store info */
            .header {
              padding-bottom: 3px;
              margin-bottom: 0;
              border-bottom: 1px solid #000;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .title {
              font-size: 14pt;
              font-weight: bold;
            }
            
            .store-info {
              text-align: right;
              font-size: 10pt;
              color: #555;
            }
            
            .store-name {
              font-weight: bold;
            }
            
            /* Sticky controls at bottom */
            .controls-sticky {
              position: fixed;
              bottom: 20px;
              left: 0;
              right: 0;
              display: flex;
              justify-content: center;
              z-index: 100;
            }
            
            .print-button {
              padding: 8px 20px;
              background: #4a90e2;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
              font-size: 10pt;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            /* Main container */
            .main-container {
              position: relative;
              width: 100%;
              height: auto;
            }
            
            /* Items container with multi-column layout */
            .items-container {
              column-count: 3;
              column-gap: 10px;
              margin-top: 5px; /* Small space after header */
              orphans: 3; /* Min number of lines at top of column */
              widows: 3; /* Min number of lines at bottom of column */
            }
            
            /* Category styles */
            .category {
              margin-bottom: 10px;
              page-break-inside: auto; /* Allow breaking across columns/pages - important! */
              break-inside: auto; /* Allow breaking across columns/pages - this is key */
              display: block; /* Better flow control */
              width: 100%;
            }
            
            .category-header {
              background-color: #f0f0f0;
              padding: 4px 6px;
              font-weight: bold;
              font-size: 10pt;
              border-top: 1px solid #ddd;
              border-left: 1px solid #ddd;
              border-right: 1px solid #ddd;
              border-top-left-radius: 4px;
              border-top-right-radius: 4px;
            }
            
            /* Meal planning category styling */
            .meals-planned-category .category-header {
              background-color: #e0e0e0;
              font-weight: bold;
            }
            
            .meals-wrapper {
              background-color: #f5f5f5;
            }
            
            .meal-item {
              background-color: #f5f5f5;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .meal-bullet {
              display: inline-block;
              width: 10px;
              margin-right: 4px;
              margin-top: 3px;
              flex-shrink: 0;
              text-align: center;
            }
            
            /* Items wrapper inside category */
            .items-wrapper {
              border: 1px solid #ddd;
              border-top: none;
              border-bottom-left-radius: 4px;
              border-bottom-right-radius: 4px;
              overflow: hidden;
            }
            
            /* Individual item styles */
            .item {
              padding: 3px 6px;
              border-bottom: 1px solid #eee;
              display: flex;
              align-items: flex-start;
              break-inside: avoid; /* Don't break in the middle of an item */
              page-break-inside: avoid; /* For older browsers */
            }
            
            .item:last-child {
              border-bottom: none;
            }
            
            /* Pantry staple background */
            .pantry-staple {
              background-color: #FDE2E7;
            }
            
            /* In cart item style */
            .item-in-cart {
              background-color: #e6f7ef; /* Light green */
            }
            
            /* Checkbox */
            .checkbox {
              display: inline-block;
              width: 10px;
              height: 10px;
              border: 1px solid #000;
              margin-right: 4px;
              margin-top: 3px;
              flex-shrink: 0;
              font-size: 7pt;
              line-height: 10px;
              text-align: center;
            }
            
            /* Item details */
            .item-details {
              flex-grow: 1;
              font-size: 9pt;
            }
            
            .item-name {
              font-weight: 500;
              display: block;
            }
            
            .item-meta {
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              color: #555;
              margin-top: 1px;
            }
            
            .item-size, .item-section {
              font-size: 8pt;
              color: #666;
            }
            
            .item-price {
              white-space: nowrap;
              text-align: right;
              font-size: 8pt;
            }
            
            /* Status icons */
            .cart-icon {
              display: inline-block;
              width: 8px;
              height: 8px;
              margin-right: 3px;
              vertical-align: middle;
            }
            
            .cart-icon {
              color: #22c55e; /* green */
            }
            
            /* Source indicator */
            .flyer-label {
              color: #3b82f6; /* blue */
              font-size: 8pt;
              margin-left: 4px;
            }
            
            /* Price source display */
            .discount-label {
              color: #22c55e; /* Green for discounts */
              font-size: 7pt;
              font-weight: bold;
              margin-left: 3px;
            }
            
            /* Print info - footer */
            .footer {
              margin-top: 8px;
              font-size: 8pt;
              color: #555;
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 3px;
            }
            
            /* Print specific settings */
            @media print {
              @page {
                size: auto;
                margin: 0.5cm;
              }
              
              html, body {
                height: auto;
                overflow: visible;
              }
              
              body {
                position: static;
              }
              
              .no-print {
                display: none !important;
              }
              
              .main-container {
                display: block;
                position: static;
              }
            }
            
            /* Mobile adjustments */
            @media screen and (max-width: 600px) {
              .items-container {
                column-count: 1;
              }
              
              body {
                font-size: 11pt;
              }
              
              .checkbox {
                width: 12px;
                height: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="main-container">
            <!-- Header with store info -->
            <div class="header">
              <h1 class="title">skrimp.ai grocery list</h1>
              ${store ? `
              <div class="store-info">
                <div class="store-name">${store.name}</div>
                <div class="store-location">${store.location}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- Sticky print button at the bottom of the page -->
            <div class="controls-sticky no-print">
              <button onclick="window.print()" class="print-button">
                Print List
              </button>
            </div>
            
            <div class="items-container">
    `;

    // Add categories and items
    sortedCategories.forEach(category => {
      // Only render categories that have items after filtering
      if (categorizedItems[category].length > 0) {
        printContent += `
          <div class="category">
            <div class="category-header">${category}</div>
            <div class="items-wrapper">
        `;

        // Add items for this category
        categorizedItems[category].forEach(item => {
          const quantityToBuy = Math.ceil(Math.max(0.001, item.neededFraction - 0.05));
          const unitPrice = item.packPrice.toFixed(2);
          const totalPrice = (quantityToBuy * item.packPrice).toFixed(2); // Calculate total price
          const storeSection = item.tags?.storeSection;
          const status = item.tags?.status || 'bought';
          const isInCart = status === 'in_cart';

          // Determine if item is an essential item or pantry staple
          const isEssentialItem = item.tags?.importance === 'core' || item.neededFraction * 100 >= 25;
          const pantryStapleClass = !isEssentialItem ? 'pantry-staple' : '';

          // Source and discount display
          let sourceDisplay = '';
          if (item.source === 'flyer') {
            sourceDisplay = '<span class="flyer-label">flyer</span>';
          }

          // Discount label
          let discountDisplay = '';
          if (item.savingsPercentage && item.savingsPercentage > 0) {
            discountDisplay = `<span class="discount-label">${item.savingsPercentage.toFixed(0)}%↓</span>`;
          }

          printContent += `
            <div class="item ${isInCart ? 'item-in-cart' : ''} ${pantryStapleClass}">
              <div class="checkbox">${isInCart ? '✓' : ''}</div>
              <div class="item-details">
                <span class="item-name">
                  ${item.productName}${sourceDisplay}${discountDisplay}
                </span>
                <div class="item-meta">
                  <span class="item-size">${item.unitSize} ${item.unitType}${storeSection ? ` • ${storeSection}` : ''}</span>
                  <span class="item-price">${quantityToBuy}× $${unitPrice} = $${totalPrice}</span>
                </div>
              </div>
            </div>
          `;
        });

        printContent += `
            </div>
          </div>
        `;
      }
    });

    // Add Meals Planned category if there are selected recipes
    if (selectedRecipes.length > 0) {
      printContent += `
        <div class="category meals-planned-category">
          <div class="category-header">Meals Planned</div>
          <div class="items-wrapper meals-wrapper">
      `;

      // Add recipe items
      selectedRecipes.forEach(recipe => {
        const multiplier = recipe.multiplier && recipe.multiplier > 1
          ? ` (×${recipe.multiplier})`
          : '';

        printContent += `
          <div class="item meal-item">
            <div class="meal-bullet">•</div>
            <div class="item-details">
              <span class="item-name">${recipe.name}${multiplier}</span>
            </div>
          </div>
        `;
      });

      printContent += `
          </div>
        </div>
      `;
    }

    // Close items container and add footer
    printContent += `
            </div><!-- End of items-container -->
            
            <div class="footer">
              ${new Date().toLocaleDateString()} • Printed on ${new Date().toLocaleString()}
            </div>
          </div><!-- End of main-container -->
          
          <script>
            // Set the document title
            document.title = "skrimp.ai grocery list";
            
            // Fix extra blank page in print preview
            window.onload = function() {
              // Set all containers to auto height
              document.body.style.height = 'auto';
              
              // Force layout calculation
              document.body.offsetHeight;
              
              // Timeout before printing
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    // Write to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      className="flex items-center"
      title="Print grocery list"
    >
      <PrinterIcon className="mr-2 h-4 w-4" />
      Print List
    </Button>
  );
}