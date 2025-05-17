'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { type AggregatedItem } from './usePlannerStore';

interface GroceryTotals {
  mealCost: number;
  futureUseCost: number;
  groceryBill: number;
  totalSavings: number;
}

interface GroceryListPrintableProps {
  groceryItems: AggregatedItem[];
  groceryCheckedItems: Set<string>;
  groceryTotals: GroceryTotals;
}

export function GroceryListPrintable({
  groceryItems,
  groceryCheckedItems,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groceryTotals // Need to keep this prop to avoid build errors, but it's not used in this component
}: GroceryListPrintableProps) {

  // Handle print function
  const handlePrint = () => {
    // Create a new window for the printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print your grocery list.');
      return;
    }

    // Filter items using the same criteria as the main grocery screen
    // Skip ignored items and items with "free" source
    const filteredItems = groceryItems.filter(item =>
      !(item.tags?.status === 'ignored' || item.source === 'free')
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
          <!-- Hide browser URL/about:blank from headers and footers -->
          <meta name="format-detection" content="telephone=no">
          <meta name="format-detection" content="date=no">
          <meta name="format-detection" content="address=no">
          <meta name="format-detection" content="email=no">
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.3;
              color: black;
              background: white;
              padding: 0.5cm;
              font-size: 9pt;
            }
            
            /* Header styles - without print button */
            .header {
              text-align: center;
              padding-bottom: 3px;
              margin-bottom: 0;
              border-bottom: 1px solid #000;
            }
            
            .title {
              font-size: 14pt;
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
            
            /* Items container with multi-column layout */
            .items-container {
              column-count: 3;
              column-gap: 10px;
              column-fill: auto; /* Fill columns sequentially - important for first page content */
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
            
            /* Checked item style */
            .item-checked {
              background-color: #f3f4f6;
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
            
            /* Status dots */
            .status-icon {
              display: inline-block;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              margin-right: 3px;
              vertical-align: middle;
            }
            
            .status-owned {
              background-color: #3b82f6; /* blue */
            }
            
            .status-ignored {
              background-color: #9ca3af; /* gray */
            }
            
            .status-bought {
              background-color: #22c55e; /* green */
            }
            
            /* Print info */
            .print-info {
              text-align: center;
              margin-top: 15px;
              padding-top: 5px;
              border-top: 1px solid #000;
              font-size: 8pt;
              color: #555;
              column-span: all; /* Make footer span all columns */
            }
            
            /* Print optimization */
            @media print {
              body {
                padding: 0.5cm;
              }
              
              .no-print {
                display: none;
              }
              
              /* Fix for header positioning on first page */
              .header {
                position: static;
              }
              
              /* Ensure backgrounds print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Hide browser-generated headers and footers */
              @page {
                size: auto;
                margin: 0.5cm;
              }
              
              /* Mobile-specific print adjustments */
              @media (max-width: 600px) {
                /* Instead of changing column count, we'll adjust their properties */
                .items-container {
                  column-width: auto !important; /* Let the browser decide column width */
                  column-count: 1 !important; /* Force single column on mobile print */
                  width: 100% !important;
                }
                
                /* Make text slightly larger for readability */
                body {
                  font-size: 10pt !important;
                }
              }
            }
            
            /* Mobile view adjustments */
            @media (max-width: 600px) {
              /* Any mobile-specific styles for the browser view */
              .checkbox {
                width: 12px;
                height: 12px;
              }
            }
          </style>
        </head>
        <body>
          <!-- Simplified header without print button -->
          <div class="header">
            <h1 class="title">skrimp.ai grocery list</h1>
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
          const isChecked = groceryCheckedItems.has(item.packageId);
          const status = item.tags?.status || 'bought';

          // Determine if item is an essential item or pantry staple
          const isEssentialItem = item.tags?.importance === 'core' || item.neededFraction * 100 >= 25;
          const pantryStapleClass = !isEssentialItem ? 'pantry-staple' : '';

          // Get status icon class
          const statusClass = `status-${status}`;

          printContent += `
            <div class="item ${isChecked ? 'item-checked' : ''} ${pantryStapleClass}">
              <div class="checkbox">${isChecked ? '✓' : ''}</div>
              <div class="item-details">
                <span class="item-name">
                  <span class="status-icon ${statusClass}"></span>${item.productName}
                </span>
                <div class="item-meta">
                  <span class="item-size">${item.unitSize}${item.unitType}${storeSection ? ` • ${storeSection}` : ''}</span>
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

    // Add date info (without the total)
    printContent += `
          </div>
          
          <div class="print-info">
            ${new Date().toLocaleDateString()} • Printed on ${new Date().toLocaleString()}
          </div>
          
          <!-- Force immediate flow of content and set document title -->
          <script>
            // Set the document title to remove about:blank
            document.title = "skrimp.ai grocery list";
            
            // Set a timeout to show print dialog after content has loaded
            document.addEventListener('DOMContentLoaded', function() {
              // Force reflow of the page
              document.body.offsetHeight;
              
              // Set a timeout to show print dialog after content has loaded
              setTimeout(function() {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `;

    // Write to the new window and trigger print
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Set the document title immediately after writing
    printWindow.document.title = "skrimp.ai grocery list";
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