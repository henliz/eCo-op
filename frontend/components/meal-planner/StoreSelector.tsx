'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { usePlannerStore, type Store, parseCoordinates } from './usePlannerStore';
import { StoreCard } from './StoreCard';
import { MapPin, AlertTriangle, Navigation } from 'lucide-react';
import { LocationPermission } from '@/components/location/LocationPermission';
import { locationService } from '@/lib/location';

type ExtendedStore = Store & {
  location_name?: string;
  city?: string;
  postal_code?: string;
  coordinates?: string;
  flyer?: string;
  distance?: number;
};

// The parent page will pass this ref so we can set it when a store is selected
interface StoreSelectorProps {
  shouldNavigateToPlan: React.MutableRefObject<boolean>;
}

export default function StoreSelector({ shouldNavigateToPlan }: StoreSelectorProps) {
  const {
    selectedStore,
    setSelectedStore,
    isLoading,
    error,
    availableStores,
    isStoresLoaded,
    discoverStores,
    userLocation,
    setUserLocation,
  } = usePlannerStore();

  // State for search filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showLocationPrompt, setShowLocationPrompt] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
  }, []);


  // Discover stores on component mount
  useEffect(() => {
    if (!isStoresLoaded && !isLoading) {
      discoverStores();
    }
  }, [isStoresLoaded, isLoading, discoverStores]);

  // Check for existing location on mount
  useEffect(() => {
    const existingLocation = locationService.getStoredLocation();
    if (existingLocation) {
      setUserLocation({
        latitude: existingLocation.latitude,
        longitude: existingLocation.longitude,
        address: existingLocation.address,
        source: existingLocation.source,
      });
      setShowLocationPrompt(false);
      setLocationEnabled(true); // Enable location when loaded from storage
    }
  }, [setUserLocation]);

  const handleStoreSelect = (storeId: string) => {
    console.log("Selected store:", storeId);
    setSelectedStore(storeId);

    // Signal that we should navigate to the Plan tab after loading
    shouldNavigateToPlan.current = true;

    // Add a short delay then explicitly trigger fetchMealData
    setTimeout(() => {
      usePlannerStore.getState().fetchMealData();
    }, 100);
  };

  // Handle location being set
  const handleLocationSet = (location: { latitude: number; longitude: number }) => {
    console.log('🐛 User location coordinates:', location);
    console.log('🐛 User location (Google Maps link):', `https://www.google.com/maps?q=${location.latitude},${location.longitude}`);
    setUserLocation({
      ...location,
      source: 'browser' as const,
    });
    setShowLocationPrompt(false);
    setLocationEnabled(true); // Enable location when first set
  };

  // Calculate distances and sort stores
  const storesWithDistance = useMemo(() => {
    if (!userLocation) {
      return availableStores.map(store => ({ ...store, distance: undefined })) as ExtendedStore[];
    }

    return availableStores.map(store => {
      const extendedStore = store as ExtendedStore;
      let distance: number | undefined = undefined;

      // Try to get store coordinates from various sources
      let storeCoords: { latitude: number; longitude: number } | null = null;

      // Check if store already has location data
      if (extendedStore.lat && extendedStore.lng) {
        storeCoords = {
          latitude: extendedStore.lat,
          longitude: extendedStore.lng,
        };
        console.log(`📍 Using geocoded coordinates for ${extendedStore.name}:`, storeCoords);
      }
      // Check if store already has location data in storeLocation format
      else if (extendedStore.storeLocation) {
        storeCoords = {
          latitude: extendedStore.storeLocation.latitude,
          longitude: extendedStore.storeLocation.longitude,
        };
      }

      // Calculate distance if we have store coordinates
      if (storeCoords) {
        const distanceInfo = locationService.getDistanceToStore(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            source: userLocation.source,
            timestamp: Date.now(),
          },
          storeCoords
        );
        distance = distanceInfo.distance;
      }

      return {
        ...extendedStore,
        distance,
      } as ExtendedStore;
    });
  }, [availableStores, userLocation]);

  useEffect(() => {
    console.log('🐛 DEBUG - userLocation:', userLocation);
    console.log('🐛 DEBUG - storesWithDistance sample:', storesWithDistance.slice(0, 3));

    const storesWithDistanceInfo = storesWithDistance.filter(s => s.distance !== undefined);
    console.log(`🐛 DEBUG - ${storesWithDistanceInfo.length} stores have distance calculations`);

    if (storesWithDistanceInfo.length > 0) {
      console.log('🐛 DEBUG - Stores with distances:', storesWithDistanceInfo.map(s => ({
        name: s.name,
        distance: s.distance
      })));
    }
  }, [userLocation, storesWithDistance]);

  // Sort stores: available first, then by distance OR alphabetically
  const sortedStores = useMemo((): ExtendedStore[] => {
    return [...storesWithDistance]
      .sort((a, b) => {
        // First sort by availability
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }

        // If we have user location AND location is enabled, sort by distance
        if (userLocation && locationEnabled) {
          // Stores with distance first
          if (a.distance !== undefined && b.distance === undefined) return -1;
          if (a.distance === undefined && b.distance !== undefined) return 1;

          // Both have distance - sort by distance
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
        }

        // Always fall back to alphabetical (this will be the primary sort when location is disabled)
        return a.name.localeCompare(b.name);
      })
      .filter(store => {
        if (!searchTerm) return true;

        const extendedStore = store as ExtendedStore;
        const searchLower = searchTerm.toLowerCase();
        return (
          extendedStore.name.toLowerCase().includes(searchLower) ||
          extendedStore.location.toLowerCase().includes(searchLower) ||
          extendedStore.id.toLowerCase().includes(searchLower) ||
          (extendedStore.location_name && extendedStore.location_name.toLowerCase().includes(searchLower)) ||
          (extendedStore.city && extendedStore.city.toLowerCase().includes(searchLower)) ||
          (extendedStore.postal_code && extendedStore.postal_code.toLowerCase().includes(searchLower))
        );
      });
  }, [storesWithDistance, userLocation, locationEnabled, searchTerm]);

  return (
    <div className="bg-white rounded-xl py-2 px-5 mb-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Local Store</h3>
          {userLocation && locationEnabled && (
            <div className="ml-2 flex items-center text-sm text-green-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Location enabled</span>
            </div>
          )}
        </div>

        {/* Location Toggle */}
        {userLocation && (
          <button
            onClick={() => setLocationEnabled(!locationEnabled)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${locationEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {locationEnabled ? 'Distance sorting ON' : 'Distance sorting OFF'}
          </button>
        )}
      </div>

      {/* Location Permission Component */}
      {isClient && !userLocation && showLocationPrompt && (
        <div className="mb-4">
          <LocationPermission
            onLocationSet={handleLocationSet}
            className="border-teal-200 bg-teal-50"
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isStoresLoaded ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Discovering available stores...</p>
        </div>
      ) : (
        <div className="store-columns">
          {/* First card is robot */}
          <div className="store-card bg-teal-50 rounded-[30px] p-4 flex flex-col items-center justify-center">
            <Image
              src="/Robo_Chef.png"
              alt="Friendly chef robot"
              width={150}
              height={150}
              className="mx-auto"
            />
            <div className="mt-3 text-center">
              {isStoresLoaded && (
                <>
                  <p className="text-gray-700 font-medium text-lg">
                    {availableStores.filter(s => s.isAvailable).length} stores available
                  </p>
                  {userLocation && locationEnabled && sortedStores.some(s => s.distance !== undefined) && (
                    <p className="text-sm text-teal-600 mt-1">
                      📍 Sorted by distance from you
                    </p>
                  )}
                  {userLocation && !locationEnabled && (
                    <p className="text-sm text-gray-600 mt-1">
                      📝 Sorted alphabetically
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search input in its own card */}
          <div className="store-card bg-gray-50 rounded-[30px] p-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stores..."
                className="w-full pl-9 pr-9 py-2 rounded-full bg-white border border-gray-200 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Store cards */}
          {sortedStores.map(store => (
            <div key={store.id} className="store-card">
              <StoreCard
                store={store}
                isSelected={selectedStore === store.id}
                disabled={!store.isAvailable}
                onClick={() => store.isAvailable && handleStoreSelect(store.id)}
                showDistance={userLocation !== null && locationEnabled}
              />
            </div>
          ))}

          {/* No results message - only shown when search has no results */}
          {sortedStores.length === 0 && searchTerm && (
            <div className="store-card bg-gray-50 rounded-[30px] p-4 text-center">
              <p className="text-gray-500">No stores match your search for &ldquo;{searchTerm}&rdquo;</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-teal-600 hover:text-teal-800 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Location prompt card */}
          {!userLocation && !showLocationPrompt && (
            <div className="store-card bg-blue-50 rounded-[30px] p-4">
              <div className="text-center">
                <Navigation className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium mb-2">Want stores sorted by distance?</p>
                <button
                  onClick={() => setShowLocationPrompt(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Set your location
                </button>
              </div>
            </div>
          )}

          {/* Re-enable location card */}
          {userLocation && !locationEnabled && (
            <div className="store-card bg-blue-50 rounded-[30px] p-4">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium mb-2">Want to see stores by distance again?</p>
                <button
                  onClick={() => setLocationEnabled(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Enable distance sorting
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isStoresLoaded && availableStores.length === 0 && (
        <div className="text-center p-4 bg-gray-100 rounded-lg mt-4">
          <p className="text-gray-700">No stores with current sales were found. Please check back later.</p>
        </div>
      )}

      {/* Loading indicator for store data */}
      {isLoading && selectedStore && (
        <div className="flex justify-center mt-4 mb-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading meal deals for {availableStores.find(s => s.id === selectedStore)?.name}...</p>
        </div>
      )}

      {/* CSS for column-based layout */}
      <style jsx>{`
        .store-columns {
          column-count: 2; /* Default to 2 columns on mobile */
          column-gap: 12px;
          width: 100%;
        }
        
        .store-card {
          break-inside: avoid;
          margin-bottom: 12px;
          display: inline-block;
          width: 100%;
        }
        
        /* Very small screens: 1 column */
        @media (max-width: 480px) {
          .store-columns {
            column-count: 1;
          }
        }
        
        /* Desktop: 3 columns */
        @media (min-width: 768px) {
          .store-columns {
            column-count: 3;
          }
        }
      `}</style>
    </div>
  );
}
