'use client';

import React from 'react';
import Image from 'next/image';
import { type Store } from './usePlannerStore';
import { format } from 'date-fns';

interface StoreCardProps {
  store: Store;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function StoreCard({
  store,
  onClick,
  isSelected = false,
  disabled = false
}: StoreCardProps) {
  // Get logo filename from store name
  const getLogoFileName = (storeName: string): string => {
    const logoMap: Record<string, string> = {
      'Walmart': 'Walmart_Logo.png',
      'Zehrs': 'Zehrs_Logo.png',
      'Food Basics': 'FoodBasics_Logo.png',
      'Farm Boy': 'FarmBoy_Logo.png',
      'FreshCo': 'FreshCo_Logo.png',
      'NoFrills': 'NoFrills_Logo.png',
      'Metro': 'Metro_Logo.png',
      'Sobeys': 'Sobeys_Logo.png'
    };
    return logoMap[storeName] || '';
  };

  // Get logo path
  const logoFileName = getLogoFileName(store.name);
  const logoPath = logoFileName ? `/${logoFileName}` : '';

  // Determine style based on whether it's selected (for store selector)
  const containerClassName = `
    rounded-[30px] p-3 transition
    ${isSelected
      ? 'bg-[#5BC4B4] text-white'
      : !disabled 
        ? 'bg-orange-200 text-gray-800 hover:bg-orange-300'
        : 'bg-gray-200 text-gray-500'
    }
    ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
  `;

  // Format expiration date if available
  const formattedDate = store.validUntil ?
    format(new Date(store.validUntil), 'MMM d, yyyy') : '';

  return (
    <div
      className={containerClassName}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center">
        {/* Logo */}
        {logoPath ? (
          <div className="min-w-12 h-12 flex items-center justify-center mr-3 bg-white p-1 rounded overflow-hidden">
            <Image
              src={logoPath}
              alt={`${store.name} logo`}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="bg-white min-w-12 h-12 flex items-center justify-center mr-3 text-xl font-medium rounded">
            {store.name.substring(0, 1)}
          </div>
        )}

        {/* Store information */}
        <div>
          <div className="text-base font-semibold">
            {store.name}
          </div>
          <div className="text-sm">
            {store.location}
          </div>
          {formattedDate && (
            <div className="text-xs mt-0.5">
              {new Date(store.validUntil) > new Date()
                ? `Deals expire ${formattedDate}`
                : `Deals ended ${formattedDate}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}