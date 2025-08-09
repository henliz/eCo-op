'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
//import { usePlannerStore, type Store } from '../meal-planner/usePlannerStore';
import { usePlannerStores as usePlannerStore, type Store, getPlannerStores } from '@/stores/usePlannerStores';

import { StoreCard } from '../meal-planner/StoreCard';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { locationService } from '@/lib/location';
import { useLocation } from '@/hooks/useLocation';

type ExtendedStore = Store & {
  location_name?: string;
  city?: string;
  postal_code?: string;
  coordinates?: string;
  flyer?: string;
  distance?: number;
};

interface StoreSelectorProps {
  shouldNavigateToPlan: React.MutableRefObject<boolean>;
}

export default function StoreSelector({ shouldNavigateToPlan }: StoreSelectorProps) {
  const {
    selectedStore,
    setSelectedStore,
    isLoading,
    availableStores,
    isStoresLoaded,
    discoverStores,
    userLocation,
    setUserLocation,
  } = usePlannerStore();

  // Location hook for permissions and geocoding
  const {
    location: hookLocation,
    isLoading: locationLoading,
    error: locationError,
    isPermissionDenied,
    hasAskedPermission,
    requestLocation,
    geocodeAddress,
    clearError,
  } = useLocation();

  // State for search filter and location UI
  const [searchTerm, setSearchTerm] = React.useState('');
  const [locationEnabled, setLocationEnabled] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [addressInput, setAddressInput] = React.useState('');
  const [showLocationUI, setShowLocationUI] = React.useState(false);

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
      setLocationEnabled(true);
    } else {
      // Show location UI if no existing location
      setShowLocationUI(true);
    }
  }, [setUserLocation]);

  // Sync hook location with store location
  useEffect(() => {
    if (hookLocation) {
      setUserLocation({
        latitude: hookLocation.latitude,
        longitude: hookLocation.longitude,
        address: hookLocation.address,
        source: hookLocation.source,
      });
      setLocationEnabled(true);
      setShowLocationUI(false);
    }
  }, [hookLocation, setUserLocation]);

  const handleStoreSelect = (storeId: string) => {
    console.log("Selected store:", storeId);
    setSelectedStore(storeId);
    shouldNavigateToPlan.current = true;
    setTimeout(() => {
      //usePlannerStore.getState().fetchMealData();
      getPlannerStores().fetchMealData();
    }, 100);
  };

  const handleLocationRequest = async () => {
    clearError();
    await requestLocation();
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await geocodeAddress(addressInput);
  };

  // Calculate distances and sort stores
  const storesWithDistance = useMemo(() => {
    if (!userLocation) {
      return availableStores.map(store => ({ ...store, distance: undefined })) as ExtendedStore[];
    }

    return availableStores.map(store => {
      const extendedStore = store as ExtendedStore;
      let distance: number | undefined = undefined;
      let storeCoords: { latitude: number; longitude: number } | null = null;

      if (extendedStore.lat && extendedStore.lng) {
        storeCoords = {
          latitude: extendedStore.lat,
          longitude: extendedStore.lng,
        };
      } else if (extendedStore.storeLocation) {
        storeCoords = {
          latitude: extendedStore.storeLocation.latitude,
          longitude: extendedStore.storeLocation.longitude,
        };
      }

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

  // Sort stores
  const sortedStores = useMemo((): ExtendedStore[] => {
    return [...storesWithDistance]
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }

        if (userLocation && locationEnabled) {
          if (a.distance !== undefined && b.distance === undefined) return -1;
          if (a.distance === undefined && b.distance !== undefined) return 1;
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
        }

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
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              locationEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {locationEnabled ? 'Distance sorting ON' : 'Distance sorting OFF'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && !isStoresLoaded ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Discovering available stores...</p>
        </div>
      ) : (
        <div className="store-columns">
          {/* Enhanced Robot Chef Card with Search & Location Integration */}
          <div className="store-card bg-teal-50 rounded-[30px] p-4 flex flex-col items-center justify-center">
            <Image
              src="/Robo_Chef.png"
              alt="Friendly chef robot"
              width={150}
              height={150}
              className="mx-auto"
            />

            <div className="mt-3 text-center w-full">
              {isStoresLoaded ? (
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
              ) : (
                <p className="text-gray-600">Finding stores...</p>
              )}

              {/* Location UI Integration - Primary Option */}
              {isClient && !userLocation && showLocationUI && (
                <div className="mt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      Find stores near you!
                    </p>
                  </div>

                  {locationError && (
                    <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{locationError}</p>
                    </div>
                  )}

                  {/* Primary: Browser location - Less aggressive styling */}
                  {!isPermissionDenied && (
                    <button
                      onClick={handleLocationRequest}
                      disabled={locationLoading}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2 inline" />
                          Use My Location
                        </>
                      )}
                    </button>
                  )}

                  {/* Fallback: Manual entry */}
                  {(isPermissionDenied || hasAskedPermission) && (
                    <form onSubmit={handleAddressSubmit} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter postal code (M4B 1B3)"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={locationLoading || !addressInput.trim()}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {locationLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2 inline" />
                            Set Location
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="text-xs text-gray-500 text-center">
                    <p>🔒 Stored for this session only</p>
                  </div>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-teal-50 px-2 text-gray-500">
                        Or search manually
                      </span>
                    </div>
                  </div>

                  {/* Search Bar - Secondary Option */}
                  <div className="w-full">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type store name, city, or postal code..."
                        className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 transition-all"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {searchTerm ? (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-gray-400 hover:text-gray-600 p-1"
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
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
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
                        )}
                      </div>
                    </div>
                    {searchTerm && (
                      <p className="text-xs text-gray-600 mt-1">
                        Showing {sortedStores.length} result{sortedStores.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowLocationUI(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Skip for now
                  </button>
                </div>
              )}

              {/* Search Bar - When Location UI is Hidden */}
              {(!showLocationUI || userLocation) && (
                <div className="mt-4 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Search Stores
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type store name, city, or postal code..."
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border-2 border-teal-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all shadow-sm"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {searchTerm ? (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-gray-400 hover:text-gray-600 p-1"
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
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-teal-400"
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
                      )}
                    </div>
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-gray-600 mt-1">
                      Showing {sortedStores.length} result{sortedStores.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Show location prompt if hidden and no location */}
              {!userLocation && !showLocationUI && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowLocationUI(true)}
                    className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                  >
                    📍 Set location for distance sorting
                  </button>
                </div>
              )}

              {/* Re-enable distance sorting */}
              {userLocation && !locationEnabled && (
                <div className="mt-4">
                  <button
                    onClick={() => setLocationEnabled(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    📍 Enable distance sorting
                  </button>
                </div>
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

          {/* No results message */}
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
          column-count: 2;
          column-gap: 12px;
          width: 100%;
        }

        .store-card {
          break-inside: avoid;
          margin-bottom: 12px;
          display: inline-block;
          width: 100%;
        }

        @media (max-width: 480px) {
          .store-columns {
            column-count: 1;
          }
        }

        @media (min-width: 768px) {
          .store-columns {
            column-count: 3;
          }
        }
      `}</style>
    </div>
  );
}
