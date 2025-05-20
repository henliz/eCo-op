'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePlannerStore, type Store } from './usePlannerStore';
import { StoreCard } from './StoreCard';
import { MapPin, AlertTriangle, ChevronDown } from 'lucide-react';

// The parent page will pass this ref so we can set it when a store is selected
interface StoreSelectorProps {
  shouldNavigateToPlan: React.MutableRefObject<boolean>;
}

// Interface for user's coordinates
interface Coordinates {
  latitude: number;
  longitude: number;
}

// Sorting options enum
type SortOption = 'alphabetical' | 'distance';

// Function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

// Geocode store address to get coordinates
const geocodeStore = async (store: Store): Promise<[number, number] | null> => {
  try {
    const addressParts = store.location.split(',');
    
    // Simulate coordinates based on store name and location
    // We need geocode for actual coords
    const simulatedCoordinates = {
      'Walmart': [43.8563, -79.0403],
      'Zehrs': [43.8939, -78.9420],
      'Food Basics': [43.8771, -79.0265],
      'Farm Boy': [43.9026, -79.0103],
      'FreshCo': [43.8488, -79.0519],
      'NoFrills': [43.8704, -79.0356],
      'Metro': [43.8620, -79.0222],
      'Sobeys': [43.8841, -79.0341]
    };
    
    // Get coordinates by store name or provide random nearby coordinates
    return (
      simulatedCoordinates[store.name as keyof typeof simulatedCoordinates] ??
      [43.85 + Math.random() * 0.05, -79.03 + Math.random() * 0.05]
    ) as [number, number];

  } catch (error) {
    console.error(`Error geocoding store ${store.name}:`, error);
    return null;
  }
};

export default function StoreSelector({ shouldNavigateToPlan }: StoreSelectorProps) {
  const {
    selectedStore,
    setSelectedStore,
    isLoading,
    error,
    availableStores,
    isStoresLoaded,
    discoverStores
  } = usePlannerStore();

  // State for search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for user location
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [storesWithDistance, setStoresWithDistance] = useState<(Store & { distance?: number, coordinates?: [number, number] })[]>([]);
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  
  // New state for sort method
  const [sortMethod, setSortMethod] = useState<SortOption>('alphabetical');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Request user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Get user's location
const getUserLocation = () => {
  setIsProcessingLocation(true);
  setLocationError(null);
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Only set location as enabled if we actually get coordinates
        if (position && position.coords && position.coords.latitude && position.coords.longitude) {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setLocationEnabled(true);
          setLocationError(null);
          
          // If sorting by distance was previously selected, we can now apply it
          if (sortMethod === 'distance') {
            // Keep distance sorting active
          } else {
            // Leave current sort method unchanged
          }
        } else {
          // We got a position object but no valid coordinates
          setLocationError('Unable to get precise location. Please try again.');
          setLocationEnabled(false);
          setUserLocation(null);
        }
        setIsProcessingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        // Clear user location data
        setUserLocation(null);
        
        let errorMessage = 'Unable to get your location. Please try again later.';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied by your browser. Please enable location in your browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable. Please check your device settings.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setLocationError(errorMessage);
        setLocationEnabled(false);
        
        // Reset sort method to alphabetical if we were trying to sort by distance
        if (sortMethod === 'distance') {
          setSortMethod('alphabetical');
        }
        
        setIsProcessingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  } else {
    setLocationError('Geolocation is not supported by your browser.');
    setLocationEnabled(false);
    setSortMethod('alphabetical'); // Force alphabetical sort when geolocation not supported
    setIsProcessingLocation(false);
  }
};

  // Toggle location permissions
const toggleLocationPermission = async () => {
  if (locationEnabled) {
    // User wants to disable location
    setLocationEnabled(false);
    setUserLocation(null);
    // If we're disabling location and currently sorting by distance, revert to alphabetical
    if (sortMethod === 'distance') {
      setSortMethod('alphabetical');
    }
    setLocationError('Location disabled in app. Your browser may still have location permission.');
  } else {
    // User wants to enable location - check browser permission first
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'denied') {
        // Browser has explicitly denied permission
        setLocationError('Location is blocked by your browser. Please enable location in your browser settings and try again.');
      } else {
        // Permission is granted or prompt will appear - attempt to get location
        getUserLocation();
      }
    } catch (err) {
      // Permissions API not available, fall back to direct geolocation request
      getUserLocation();
    }
  }
};

  // Handle sort method change
  const changeSortMethod = async (method: SortOption) => {
    // If switching to distance sorting
    if (method === 'distance') {
      if (locationEnabled && userLocation) {
        // We already have location enabled and coordinates, just change sort method
        setSortMethod(method);
      } else {
        // We need to enable location first
        try {
          // Check browser permission state
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
          if (permissionStatus.state === 'denied') {
            // Browser has explicitly denied - show error and don't change sort method
            setLocationError('Location is blocked by your browser. Please enable location in your browser settings to sort by distance.');
          } else {
            // Attempt to get location
            setIsProcessingLocation(true);
            
            // Try to get location - this will show the browser permission dialog if needed
            navigator.geolocation.getCurrentPosition(
              (position) => {
                // Success - we can now enable distance sorting
                if (position && position.coords) {
                  setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  });
                  setLocationEnabled(true);
                  setLocationError(null);
                  setSortMethod(method);
                }
                setIsProcessingLocation(false);
              },
              (error) => {
                // Error - show appropriate message and don't change sort method
                setIsProcessingLocation(false);
                
                let errorMessage = 'Unable to access location. Please try again.';
                
                if (error.code === 1) { // PERMISSION_DENIED
                  errorMessage = 'Location permission denied by your browser. Please enable location in browser settings to sort by distance.';
                }
                
                setLocationError(errorMessage);
              }
            );
          }
        } catch (err) {
          // Permissions API not available, fall back to direct geolocation request
          getUserLocation();
          
          // Only change sort method if we successfully get location
          if (locationEnabled && userLocation) {
            setSortMethod(method);
          }
        }
      }
    } else {
      // For alphabetical sorting, just change it directly
      setSortMethod(method);
    }
    
    setIsSortDropdownOpen(false);
  };

  // Discover stores on component mount
  useEffect(() => {
    if (!isStoresLoaded && !isLoading) {
      discoverStores();
    }
  }, [isStoresLoaded, isLoading, discoverStores]);

  // Process stores with geocoding and distance calculation
  useEffect(() => {
    const processStores = async () => {
      if (availableStores.length > 0) {
        const processedStores = await Promise.all(
          availableStores.map(async (store) => {
            const storeWithLocation = { ...store };
            
            // Get store coordinates
            const coordinates = await geocodeStore(store);
            
            if (coordinates && userLocation && locationEnabled) {
              // Calculate distance
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coordinates[0],
                coordinates[1]
              );
              
              return {
                ...storeWithLocation,
                coordinates,
                distance
              };
            }
            
            return storeWithLocation;
          })
        );
        
        setStoresWithDistance(processedStores);
      }
    };
    
    processStores();
  }, [availableStores, userLocation, locationEnabled]);

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

  // Sort and filter stores
  const filteredStores = (() => {
    let stores = [...storesWithDistance];
    
    // Sort stores based on availability first
    stores.sort((a, b) => {
      // Availability is always highest priority
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      
      // Apply selected sort method
      if (sortMethod === 'distance' && locationEnabled && userLocation && 
          a.distance !== undefined && b.distance !== undefined) {
        // Only sort by distance if:
        // 1. Distance sort is selected
        // 2. Location is enabled
        // 3. We have actual user coordinates
        // 4. Both stores have distance values
        return a.distance - b.distance;
      } else {
        // Default/alphabetical sorting
        return a.name.localeCompare(b.name);
      }
    });
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      stores = stores.filter(store => (
        store.name.toLowerCase().includes(searchLower) ||
        store.location.toLowerCase().includes(searchLower) ||
        store.id.toLowerCase().includes(searchLower) ||
        (store.filename && store.filename.toLowerCase().includes(searchLower))
      ));
    }
    
    return stores;
  })();

  return (
    <div className="bg-white rounded-xl py-2 px-5 mb-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Local Store</h3>
        </div>
      </div>

      {/* Location and sorting controls */}
      <div className="flex items-center justify-between mb-3">
        {/* Location permission button */}
        <button
          onClick={toggleLocationPermission}
          className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            locationEnabled 
              ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          disabled={isProcessingLocation}
        >
          <MapPin size={16} className={`mr-1.5 ${isProcessingLocation ? 'animate-pulse' : ''}`} />
          {isProcessingLocation 
            ? 'Getting location...' 
            : locationEnabled 
              ? 'Location enabled' 
              : 'Enable location'
          }
        </button>
        
        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Sort: {sortMethod === 'alphabetical' ? 'A-Z' : 'By distance'}
            <ChevronDown size={16} className="ml-1.5" />
          </button>
          
          {isSortDropdownOpen && (
            <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => changeSortMethod('alphabetical')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    sortMethod === 'alphabetical' 
                      ? 'text-teal-700 bg-teal-50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Alphabetical (A-Z)
                </button>
                <button
                  onClick={() => changeSortMethod('distance')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    sortMethod === 'distance' 
                      ? 'text-teal-700 bg-teal-50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${!locationEnabled || !userLocation ? 'opacity-50' : ''}`}
                  disabled={!locationEnabled || !userLocation}
                >
                  By distance
                  {(!locationEnabled || !userLocation) && (
                    <span className="ml-1 text-xs text-gray-500">(enable location first)</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Location error message */}
      {locationError && (
        <div className="text-amber-600 text-sm flex items-center mb-3">
          <AlertTriangle size={16} className="mr-1.5" />
          {locationError}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
          {error}
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
                <p className="text-gray-700 font-medium text-lg">
                  {availableStores.filter(s => s.isAvailable).length} stores available
                </p>
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
          {filteredStores.map(store => (
            <div key={store.id} className="store-card">
              <StoreCard
                store={store}
                isSelected={selectedStore === store.id}
                disabled={!store.isAvailable}
                onClick={() => store.isAvailable && handleStoreSelect(store.id)}
              />
            </div>
          ))}

          {/* No results message - only shown when search has no results */}
          {filteredStores.length === 0 && searchTerm && (
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

          {/* "Don't see your store" card - always visible */}
          <div className="store-card bg-blue-50 rounded-[30px]">
            <p className="text-gray-700 font-medium px-6 pt-4 pb-2">
              Don&apos;t see your store? Email us at <a href="mailto:info@skrimp.ai" className="text-blue-600 hover:underline">info@skrimp.ai</a> to get it added!
            </p>
          </div>
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