'use client';

import React from 'react';
import Image from 'next/image';
import { type Store } from '@/stores';

import { format } from 'date-fns';

interface StoreCardProps {
  store: Store & { distance?: number }; // Add distance to the store type
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  showDistance?: boolean;
}

export function StoreCard({
  store,
  onClick,
  isSelected = false,
  disabled = false,
  showDistance = false
}: StoreCardProps) {
  // Use the logo from the store data (from store-index.json)
  // Add validation to ensure it's a valid URL or path
  const getValidLogoPath = (logo: string | undefined): string => {
    if (!logo || logo.trim() === '') return '';

    // Check if it's a valid URL or starts with / for local paths
    try {
      // Try to create a URL - this will throw if invalid
      if (logo.startsWith('http://') || logo.startsWith('https://')) {
        new URL(logo);
        return logo;
      }
      // For local paths, ensure they start with /
      if (logo.startsWith('/')) {
        return logo;
      }
      // If it doesn't start with /, assume it's a filename and prepend /
      return `/${logo}`;
    } catch {
      // Invalid URL, return empty string to fall back to letter
      console.warn(`Invalid logo URL for ${store.name}: ${logo}`);
      return '';
    }
  };

  const logoPath = getValidLogoPath(store.logo);

  // Determine style based on whether it's selected (for store selector)
  const containerClassName = `
    rounded-[30px] p-3 transition relative
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
      {/* Distance badge - top right corner */}
      {showDistance && store.distance !== undefined && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${isSelected
            ? 'bg-white/20 text-white'
            : 'bg-teal-100 text-teal-700'
          }`}>
          {store.distance < 1
            ? `~${Math.round(store.distance * 1000)}m`
            : `~${store.distance.toFixed(1)}km`
          }
        </div>
      )}

      <div className="flex items-center justify-between mx-3">
        {/* Store information - now on the left */}
        <div className="flex-1 mr-3">
          <div className="text-base font-semibold">
            {store.name}
          </div>
          <div className="text-sm">
            {store.location}
          </div>

          {/* Expiration date */}
          {formattedDate && (
            <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-600'
              }`}>
              {new Date(store.validUntil) > new Date()
                ? `Deals expire ${formattedDate}`
                : `Deals ended ${formattedDate}`}
            </div>
          )}
        </div>

        {/* Logo - now on the right */}
        {logoPath ? (
          <div className="min-w-12 h-12 flex items-center justify-center ml-3 bg-white p-0 rounded overflow-hidden flex-shrink-0">
            <Image
              src={logoPath}
              alt={`${store.name} logo`}
              width={48}
              height={48}
              className="object-contain w-auto h-auto"
            />
          </div>
        ) : (
          <div className="bg-white min-w-12 h-12 flex items-center justify-center ml-3 text-xl font-medium rounded flex-shrink-0">
            {store.name.substring(0, 1)}
          </div>
        )}
      </div>

      {/* Special indicators */}
      <div className="flex justify-between items-center mt-2 mx-3">
        {/* Available/Unavailable status */}
        {!store.isAvailable && (
          <div className="text-xs text-red-600 font-medium">
            Currently unavailable
          </div>
        )}
      </div>
    </div>
  );
}
