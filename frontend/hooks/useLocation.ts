// frontend/hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import { locationService, type UserLocation } from '@/lib/location';

export interface LocationState {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  isPermissionDenied: boolean;
  hasAskedPermission: boolean;
}

export interface LocationActions {
  requestLocation: () => Promise<void>;
  geocodeAddress: (address: string) => Promise<void>;
  clearLocation: () => void;
  clearError: () => void;
}

export function useLocation(): LocationState & LocationActions {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    isPermissionDenied: false,
    hasAskedPermission: false,
  });

  // Check for stored location on mount
  useEffect(() => {
    const storedLocation = locationService.getStoredLocation();
    if (storedLocation) {
      setState(prev => ({
        ...prev,
        location: storedLocation,
        hasAskedPermission: true,
      }));
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isPermissionDenied: false,
      hasAskedPermission: true,
    }));

    try {
      const location = await locationService.getBrowserLocation();
      setState(prev => ({
        ...prev,
        location,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const isPermissionError = error instanceof GeolocationPositionError && 
        error.code === GeolocationPositionError.PERMISSION_DENIED;

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: isPermissionError 
          ? 'Location access denied. Please enter your postal code instead.'
          : 'Failed to get your location. Please try entering your postal code.',
        isPermissionDenied: isPermissionError,
      }));
    }
  }, []);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please enter a valid address or postal code',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const location = await locationService.geocodeAddress(address);
      setState(prev => ({
        ...prev,
        location,
        isLoading: false,
        error: null,
        hasAskedPermission: true,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to find location',
      }));
    }
  }, []);

  const clearLocation = useCallback(() => {
    locationService.clearStoredLocation();
    setState({
      location: null,
      isLoading: false,
      error: null,
      isPermissionDenied: false,
      hasAskedPermission: false,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    requestLocation,
    geocodeAddress,
    clearLocation,
    clearError,
  };
}