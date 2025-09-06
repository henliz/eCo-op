"use client";
import { create } from 'zustand';


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
  // Internal: guards duplicate loads
  _discovering: boolean;

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
  _discovering: false,

  setSelectedStore: (storeId) => {
    const { selectedStore, availableStores } = get();
    // Idempotent: no-op if unchanged
    if (selectedStore === storeId) return;
    if (storeId) {
      const exists = availableStores.some(s => s.id === storeId && s.isAvailable);
      if (!exists) { set({ error: "Selected store is not available" }); return; }
    }
    set({ selectedStore: storeId, error: null });
  },

  discoverStores: async () => {
    // de-dupe in-flight calls or skip if already loaded
    const { _discovering, isStoresLoaded } = get();
    if (_discovering || isStoresLoaded) return;
    set({ _discovering: true, isLoading: true, error: null });

    try {

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

      // Process stores
      const stores: Store[] = storesArray.map((storeInfo: StoreIndexItem) => {
        const validUntil = new Date(storeInfo.validUntil);
        const isAvailable = true; // Keep all stores available for now

        // Parse coordinates
        let lat = storeInfo.lat;
        let lng = storeInfo.lng;

        if (lat == null || lng == null) {
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

      set({
        availableStores: stores,
        isLoading: false,
        isStoresLoaded: true,
        error: null,
        _discovering: false,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover stores';

      set({
        isLoading: false,
        error: errorMessage,
        isStoresLoaded: false,
        availableStores: [],
        _discovering: false,
      });
    }
  },

  refreshStores: async () => {
    // Force refresh by clearing the loaded flag and re-discovering
    set({ isStoresLoaded: false, isLoading: true, error: null });
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

      // TODO: Implement actual geocoding
      // const response = await fetch(`your-geocoding-endpoint`);
      // Update store with location data

    } catch (error) {
      // swallow; optional: set({ locationError: 'Failed to geocode' })
    }
  },

  // Query methods
  getSelectedStore: () => {
    const state = get();
    return state.availableStores.find(s => s.id === state.selectedStore) || null;
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

export const selectIsStoresLoaded = (s: StoreLocationState) => s.isStoresLoaded;
export const selectSelectedStoreId = (s: StoreLocationState) => s.selectedStore;
export const selectAvailableStores = (s: StoreLocationState) => s.availableStores;
export const selectSelectedStore = (s: StoreLocationState) =>
  s.availableStores.find(st => st.id === s.selectedStore) ?? null;
