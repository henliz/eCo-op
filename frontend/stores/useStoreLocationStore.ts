"use client";
import { create } from 'zustand';

// --- RUNTIME SANITY CHECK (dev only) ---------------------------------
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Count how many times this module has been evaluated in the browser
  // @ts-ignore
  window.__slsLoads = (window.__slsLoads ?? 0) + 1;
  // @ts-ignore
  if (window.__slsLoads > 1) {
    console.warn('[StoreLocationStore] loaded more than once — check import paths');
  }
}
// ---------------------------------------------------------------------

// --- INSTANCE PROBE (dev only) --------------------------------------
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // @ts-ignore
  window.__slsUUID = window.__slsUUID || Math.random().toString(36).slice(2);
  // @ts-ignore
  console.log("[StoreLocationStore] instance:", window.__slsUUID, performance.getEntriesByType?.("navigation")?.[0]?.type);
}
// ---------------

// Import types from your existing code
export interface Store {
  id: string;
  name: string;
  location: string;
  validUntil: Date;
  filename: string;
  isAvailable: boolean;
  logo?: string;
  lat?: number;
  lng?: number;
  storeLocation?: StoreLocation;
  distance?: number;
  geocoded_address?: string;
  geocoded_at?: string;
}

export interface StoreLocation {
  latitude: number;
  longitude: number;
  address: string;
  postalCode?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  source: 'browser' | 'postal' | 'address';
}

interface StoreIndexItem {
  id: string;
  name: string;
  location: string;
  filename: string;
  validUntil: string;
  logo?: string;
  location_name?: string;
  city?: string;
  postal_code?: string;
  coordinates?: string;
  flyer?: string;
  lat?: number;
  lng?: number;
  geocoded_address?: string;
  geocoded_at?: string;
}

interface StoreLocationState {
  // Store data
  availableStores: Store[];
  selectedStore: string | null;
  isStoresLoaded: boolean;

  // Location data
  userLocation: UserLocation | null;
  locationError: string | null;
  isLocationLoading: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions - Store management
  setSelectedStore: (storeId: string | null) => void;
  discoverStores: () => Promise<void>;
  refreshStores: () => Promise<void>;

  // Actions - Location management
  setUserLocation: (location: UserLocation | null) => void;
  clearUserLocation: () => void;
  setLocationError: (error: string | null) => void;
  setLocationLoading: (loading: boolean) => void;
  geocodeStoreAddress: (storeId: string, address: string) => Promise<void>;

  // Query methods
  getSelectedStore: () => Store | null;
  getAvailableStores: () => Store[];
  getNearbyStores: (maxDistance?: number) => Store[];
  getStoreById: (storeId: string) => Store | null;
}

// Utility function from your existing code
export function parseCoordinates(coordString: string): { latitude: number; longitude: number } | null {
  if (!coordString) return null;

  // Format 1: "lat,lng" (43.7182,-79.3762)
  const commaFormat = coordString.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (commaFormat) {
    return {
      latitude: parseFloat(commaFormat[1]),
      longitude: parseFloat(commaFormat[2])
    };
  }

  // Format 2: "lat lng" (43.7182 -79.3762)
  const spaceFormat = coordString.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);
  if (spaceFormat) {
    return {
      latitude: parseFloat(spaceFormat[1]),
      longitude: parseFloat(spaceFormat[2])
    };
  }

  return null;
}

// Distance calculation utility
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const useStoreLocationStore = create<StoreLocationState>((set, get) => ({
  // Initial state
  availableStores: [],
  selectedStore: null,
  isStoresLoaded: false,
  userLocation: null,
  locationError: null,
  isLocationLoading: false,
  isLoading: false,
  error: null,


  // Store management actions
  //setSelectedStore: (storeId) => {
  //  console.log('[StoreLocationStore] setSelectedStore called with:', storeId);
  //  console.log('[StoreLocationStore] Current selectedStore before change:', get().selectedStore);

  //  const state = get();

  //  if (storeId) {
  //    const store = state.availableStores.find(s => s.id === storeId);
  //    if (!store || !store.isAvailable) {
  //      console.log('[StoreLocationStore] Store not found or unavailable:', storeId);
  //      set({ error: 'Selected store is not available' });
  //      return;
  //    }
  //  }

  //  set({
  //    selectedStore: storeId,
  //    error: null
  //  });

  //  console.log('[StoreLocationStore] selectedStore after change:', get().selectedStore);
  //},

  setSelectedStore: (storeId) => {
    if (storeId === null) {
      // Trace who called this
      // eslint-disable-next-line no-new
      new Error("[StoreLocationStore] setSelectedStore(null) called").stack
        ?.split("\n")
        .slice(0, 8)
        .forEach((l) => console.warn(l));
    }

    const state = get();

    if (storeId) {
      const store = state.availableStores.find((s) => s.id === storeId);
      if (!store || !store.isAvailable) {
        set({ error: "Selected store is not available" });
        return;
      }
    }

    set({ selectedStore: storeId, error: null });
  },
  discoverStores: async () => {
    const logMessage = (msg: string) => console.log(`[StoreLocationStore] ${msg}`);
    logMessage('Discovering available stores...');

    set({ isLoading: true, error: null });

    try {
      logMessage('Fetching store index from API...');

      const response = await fetch('https://api.skrimp.ai/meal-plans/stores/index');

      if (!response.ok) {
        throw new Error(`Failed to load store index: ${response.status} ${response.statusText}`);
      }

      const apiResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Invalid API response format');
      }

      const indexData = apiResponse.data;
      const storesArray = indexData.stores || [];

      if (!Array.isArray(storesArray)) {
        throw new Error('Store index data is not in the expected format');
      }

      logMessage(`Found ${storesArray.length} stores`);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Process stores
      const stores: Store[] = storesArray.map((storeInfo: StoreIndexItem) => {
        const validUntil = new Date(storeInfo.validUntil);
        const isAvailable = true; // Keep all stores available for now

        // Parse coordinates
        let lat = storeInfo.lat;
        let lng = storeInfo.lng;

        if (!lat || !lng) {
          const coords = parseCoordinates(storeInfo.coordinates || '');
          if (coords) {
            lat = coords.latitude;
            lng = coords.longitude;
          }
        }

        return {
          id: storeInfo.id,
          name: storeInfo.name,
          location: storeInfo.location,
          filename: storeInfo.filename,
          validUntil,
          isAvailable,
          logo: storeInfo.logo,
          lat,
          lng,
          geocoded_address: storeInfo.geocoded_address,
          geocoded_at: storeInfo.geocoded_at,
        };
      });

      // Sort by name
      stores.sort((a, b) => a.name.localeCompare(b.name));

      const availableCount = stores.filter(s => s.isAvailable).length;
      logMessage(`Successfully processed ${stores.length} stores (${availableCount} available)`);

      set({
        availableStores: stores,
        isLoading: false,
        isStoresLoaded: true,
        error: null,
      });

    } catch (err) {
      console.error("Error discovering stores:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover stores';

      set({
        isLoading: false,
        error: errorMessage,
        isStoresLoaded: false,
        availableStores: [],
      });
    }
  },

  refreshStores: async () => {
    // Force refresh by clearing the loaded flag and re-discovering
    set({ isStoresLoaded: false });
    await get().discoverStores();
  },

  // Location management actions
  setUserLocation: (location) => {
    set({
      userLocation: location,
      locationError: null
    });

    // Update store distances if we have both location and stores
    if (location) {
      const state = get();
      const updatedStores = state.availableStores.map(store => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            store.lat,
            store.lng
          );
          return { ...store, distance };
        }
        return store;
      });

      set({ availableStores: updatedStores });
    }
  },

  clearUserLocation: () => {
    set({
      userLocation: null,
      locationError: null,
      isLocationLoading: false,
    });
  },

  setLocationError: (error) => {
    set({
      locationError: error,
      isLocationLoading: false
    });
  },

  setLocationLoading: (loading) => {
    set({ isLocationLoading: loading });
  },

  geocodeStoreAddress: async (storeId, address) => {
    const state = get();
    const store = state.availableStores.find(s => s.id === storeId);
    if (!store) return;

    try {
      // Note: You'll need to implement your geocoding logic here
      // This is a placeholder that matches your existing pattern
      console.log(`[StoreLocationStore] Geocoding address for ${storeId}: ${address}`);

      // TODO: Implement actual geocoding
      // const response = await fetch(`your-geocoding-endpoint`);
      // Update store with location data

    } catch (error) {
      console.error('Failed to geocode store address:', error);
    }
  },

  // Query methods
  getSelectedStore: () => {
    const state = get();
    const result = state.availableStores.find(s => s.id === state.selectedStore) || null;
    console.log('[StoreLocationStore] getSelectedStore called:', {
      selectedStoreId: state.selectedStore,
      availableStoresCount: state.availableStores.length,
      resultFound: !!result,
      resultId: result?.id || 'null'
    });
    return result;
  },

  getAvailableStores: () => {
    return get().availableStores.filter(s => s.isAvailable);
  },

  getNearbyStores: (maxDistance = 50) => {
    const state = get();
    return state.availableStores
      .filter(s => s.isAvailable && s.distance !== undefined && s.distance <= maxDistance)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  },

  getStoreById: (storeId) => {
    return get().availableStores.find(s => s.id === storeId) || null;
  },
}));