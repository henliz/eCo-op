'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Navigation } from 'lucide-react';
import { type Store } from './usePlannerStore';
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

  // Format distance display
  const distanceDisplay = () => {
    if (!showDistance || store.distance === undefined) return null;

    return (
      <div className={`flex items-center text-xs mt-1 ${isSelected ? 'text-white/90' : 'text-teal-600'
        }`}>
        <MapPin className="h-3 w-3 mr-1" />
        <span className="font-medium">
          {store.distance < 1
            ? `~${Math.round(store.distance * 1000)}m away`
            : `~${store.distance.toFixed(1)}km away`
          }
        </span>
      </div>
    );
  };

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

          {/* Distance display - below location */}
          {distanceDisplay()}

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
              width={100}
              height={100}
              className="object-contain"
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
        {/* Closest store indicator */}
        {showDistance && store.distance !== undefined && store.distance <= 2 && (
          <div className={`flex items-center text-xs ${isSelected ? 'text-white' : 'text-green-600'
            }`}>
            <Navigation className="h-3 w-3 mr-1" />
            <span className="font-medium">Closest to you</span>
          </div>
        )}

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