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
      <div className="flex items-center justify-between mx-3">
        {/* Store information - now on the left */}
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

        {/* Logo - now on the right */}
        {logoPath ? (
          <div className="min-w-12 h-12 flex items-center justify-center ml-3 bg-white p-0 rounded overflow-hidden">
            <Image
              src={logoPath}
              alt={`${store.name} logo`}
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="bg-white min-w-12 h-12 flex items-center justify-center ml-3 text-xl font-medium rounded">
            {store.name.substring(0, 1)}
          </div>
        )}
      </div>
    </div>
  );
}