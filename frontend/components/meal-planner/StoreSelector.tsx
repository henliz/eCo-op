'use client';

import React, { useEffect, useMemo } from 'react';
import { usePlannerStores as usePlannerStore, type Store } from '@/stores';

import { StoreCard } from './StoreCard';
import { MapPin, Navigation, Loader2, AlertCircle, Search, X } from 'lucide-react';
import { locationService } from '@/lib/location';
import { useLocation } from '@/hooks/useLocation';

// 🆕 New store is now primary
//import { useStoreLocationStore } from '@/stores/useStoreLocationStore';
import { useStoreLocationStore } from "@/stores";

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
  // 🔄 PHASE 2: New store is PRIMARY, old store is FALLBACK
  const newStoreLocation = useStoreLocationStore();
  const { clearMealData } = usePlannerStore();

  const selectedStore   = newStoreLocation.selectedStore;
  const availableStores = newStoreLocation.availableStores;
  const isLoading       = newStoreLocation.isLoading;
  const isStoresLoaded  = newStoreLocation.isStoresLoaded;
  const userLocation    = newStoreLocation.userLocation;

  // Location hook for permissions and geocoding (unchanged)
  const {
    location: hookLocation,
    isLoading: locationLoading,
    error: locationError,
    requestLocation,
    geocodeAddress,
    clearError,
  } = useLocation();

  // State (unchanged)
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedChain, setSelectedChain] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'distance'>('name');
  const [showLocationPrompt, setShowLocationPrompt] = React.useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // 🆕 Auto-discover stores using NEW store as primary
  const hasInitiatedDiscovery = React.useRef(false);

  // Extract stable references
  const {
    isStoresLoaded: newIsStoresLoaded,
    isLoading: newIsLoading,
    discoverStores: newDiscoverStores,
  } = newStoreLocation;

  useEffect(() => {
    if (hasInitiatedDiscovery.current) {
      return;
    }
    const run = async () => {
      hasInitiatedDiscovery.current = true;
      if (!newIsStoresLoaded && !newIsLoading) {
        await newDiscoverStores();
      }
    };
    if (!newIsStoresLoaded) run();
  }, [newIsStoresLoaded, newIsLoading, newDiscoverStores]);


  // 🆕 Store selection now uses NEW store as primary
  const handleStoreSelect = (storeId: string) => {
    clearMealData();                    // reset recipes/grocery cache
    newStoreLocation.setSelectedStore(storeId); // idempotent in new store
    shouldNavigateToPlan.current = true;        // let Planner show loading → plan
  };

  // 🔄 Sync hook location with BOTH stores (during transition)
  const { setUserLocation: newSetUserLocation } = newStoreLocation;

  useEffect(() => {
    if (hookLocation) {
      newSetUserLocation(hookLocation);
      setSortBy('distance');
      setShowLocationPrompt(false);
    }
  }, [
    hookLocation,
    newSetUserLocation,
  ]);

  // 🆕 Check for existing location and auto-enable distance sorting (using new store)
  const hasLoadedStoredLocation = React.useRef(false);
  const {
    userLocation: newUserLocation,
    setUserLocation: newSetUserLocationForStored,
  } = newStoreLocation;

  useEffect(() => {
    if (hasLoadedStoredLocation.current) return;

    const existingLocation = locationService.getStoredLocation();
    if (existingLocation && !newUserLocation) {
      hasLoadedStoredLocation.current = true;
      newSetUserLocationForStored({
        latitude: existingLocation.latitude,
        longitude: existingLocation.longitude,
        address: existingLocation.address,
        source: existingLocation.source,
      });
      setSortBy('distance');
    }
  }, [newUserLocation, newSetUserLocationForStored]);

  // Location handlers (unchanged)
  const handleLocationRequest = async () => {
    clearError();
    await requestLocation();
  };

  const handlePostalCodeSubmit = async () => {
    if (!postalCode.trim()) return;
    await geocodeAddress(postalCode);
  };

  // Get unique store chains for dropdown (unchanged)
  const storeChains = useMemo(() => {
    const chains = [...new Set(availableStores.map(store => store.name))].sort();
    return chains;
  }, [availableStores]);

  // Infinite scroll logic for carousel (unchanged)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = carousel;
      const itemWidth = 64 + 12; // 64px width + 12px gap
      const totalItems = storeChains.length + 1; // +1 for "All Stores" button
      const sectionWidth = totalItems * itemWidth;

      // If scrolled to near the end, jump back to the beginning of the second set
      if (scrollLeft >= sectionWidth * 2 - clientWidth) {
        carousel.scrollLeft = sectionWidth;
      }
      // If scrolled to near the beginning, jump to the end of the second set
      else if (scrollLeft <= 0) {
        carousel.scrollLeft = sectionWidth;
      }
    };

    carousel.addEventListener('scroll', handleScroll);

    // Initialize scroll position to the middle section
    requestAnimationFrame(() => {
      carousel.scrollLeft = (storeChains.length + 1) * (64 + 12);
    });

    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [storeChains.length]);

  // Helper function for chain logos (unchanged)
  const getChainLogo = (chain: string) => {
    // Find a store from this chain to get the logo image
    const storeFromChain = availableStores.find(store => store.name === chain);

    if (storeFromChain?.logo) {
      return (
        <div
          className="w-full h-full p-2 bg-white flex items-center justify-center"
          style={{
            backgroundImage: `url(/${storeFromChain.logo})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      );
    }

    // Fallback to colored circle with letter
    return (
      <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white text-xl font-bold">
        {chain.charAt(0)}
      </div>
    );
  };

  // Calculate distances and sort stores (unchanged)
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

  // Filter and sort stores (unchanged)
  const filteredAndSortedStores = useMemo((): ExtendedStore[] => {
    let filtered = [...storesWithDistance];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.location.toLowerCase().includes(searchLower) ||
        store.city?.toLowerCase().includes(searchLower) ||
        store.postal_code?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by chain
    if (selectedChain) {
      filtered = filtered.filter(store => store.name === selectedChain);
    }

    // Sort
    filtered.sort((a, b) => {
      // Always put available stores first
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }

      // Then sort by chosen method
      if (sortBy === 'distance' && userLocation) {
        if (a.distance !== undefined && b.distance === undefined) return -1;
        if (a.distance === undefined && b.distance !== undefined) return 1;
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
      }

      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [storesWithDistance, searchTerm, selectedChain, sortBy, userLocation]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">

      {/* Mobile Header - UNCHANGED */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Find Your Store</h2>
          <div className="text-sm text-gray-500">
            {filteredAndSortedStores.length} stores
          </div>
        </div>

        {/* Hero Search Bar with Location Button - UNCHANGED */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stores, cities, postal codes..."
              className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all bg-gray-50"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* 🆕 Updated Smart Sort/Location Button to use new store */}
          <div className="flex-shrink-0">
            {!userLocation ? (
              <button
                onClick={() => setShowLocationPrompt(!showLocationPrompt)}
                className="h-full flex items-center gap-2 px-4 rounded-xl text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-200 transition-colors hover:bg-blue-200"
              >
                <MapPin className="h-5 w-5" />
                <span className="hidden sm:inline">Near me</span>
              </button>
            ) : (
              <div className="flex h-full">
                <button
                  onClick={() => setSortBy(sortBy === 'name' ? 'distance' : 'name')}
                  className={`flex items-center gap-2 px-4 rounded-l-xl text-sm font-medium transition-colors border-2 border-r-0 ${
                    sortBy === 'distance'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {sortBy === 'distance' ? 'Distance' : 'A-Z'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    // 🆕 Clear location from new store (primary)
                    newStoreLocation.clearUserLocation();
                    setSortBy('name');
                    locationService.clearStoredLocation();
                    setShowLocationPrompt(false);
                  }}
                  className="px-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-r-xl border-2 border-green-200 bg-green-100 transition-colors"
                  title="Clear location"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Store Chain Carousel - UNCHANGED */}
        <div className="mt-4">
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto gap-3 pb-2"
              style={{
                scrollBehavior: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* All Stores Button */}
              <button
                onClick={() => setSelectedChain('')}
                className={`flex-shrink-0 w-16 h-16 rounded-xl transition-colors border-2 ${
                  selectedChain === ''
                    ? 'bg-teal-500 text-white border-teal-500 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  ★
                </div>
              </button>

              {/* Store Chain Buttons - Triple duplication for smooth infinite scrolling */}
              {[...storeChains, ...storeChains, ...storeChains].map((chain, index) => {
                const chainLogo = getChainLogo(chain);
                const isSelected = selectedChain === chain;

                return (
                  <button
                    key={`${chain}-${index}`}
                    onClick={() => setSelectedChain(selectedChain === chain ? '' : chain)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl transition-colors border-2 overflow-hidden ${
                      isSelected
                        ? 'border-teal-500 shadow-lg ring-2 ring-teal-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="w-full h-full bg-white flex items-center justify-center relative">
                      {chainLogo}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scroll Indicators */}
            {storeChains.length > 2 && (
              <>
                <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-white via-white to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-white via-white to-transparent pointer-events-none" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Location Prompt - UNCHANGED */}
      {showLocationPrompt && !userLocation && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Find stores near you</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleLocationRequest}
                disabled={locationLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2 inline" />
                    Use my current location
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Enter postal code (M4B 1B3)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
                <button
                  onClick={handlePostalCodeSubmit}
                  disabled={locationLoading || !postalCode.trim()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

            {locationError && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{locationError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results - UNCHANGED */}
      <div className="p-4">
        {/* Webkit scrollbar hiding */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Results Summary */}
        {searchTerm && (
          <div className="text-sm text-gray-600 mb-3">
            {filteredAndSortedStores.length} result{filteredAndSortedStores.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !isStoresLoaded ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Finding stores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Store cards - Responsive grid */}
            {filteredAndSortedStores.map(store => (
              <StoreCard
                key={store.id}
                store={store}
                isSelected={selectedStore === store.id}
                disabled={!store.isAvailable}
                onClick={() => store.isAvailable && handleStoreSelect(store.id)}
                showDistance={userLocation !== null && sortBy === 'distance'}
              />
            ))}

            {/* No results message */}
            {filteredAndSortedStores.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-3">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500 mb-3">No stores found</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedChain('');
                  }}
                  className="text-teal-600 hover:text-teal-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}