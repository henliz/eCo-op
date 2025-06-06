// frontend/components/location/LocationPermission.tsx
'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from '@/hooks/useLocation';

interface LocationPermissionProps {
  onLocationSet?: (location: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function LocationPermission({ onLocationSet, className }: LocationPermissionProps) {
  const [addressInput, setAddressInput] = useState('');
  const {
    location,
    isLoading,
    error,
    isPermissionDenied,
    hasAskedPermission,
    requestLocation,
    geocodeAddress,
    clearError,
  } = useLocation();

  // Notify parent when location is set
  React.useEffect(() => {
    if (location && onLocationSet) {
      onLocationSet({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location, onLocationSet]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await geocodeAddress(addressInput);
  };

  const handleLocationRequest = async () => {
    clearError();
    await requestLocation();
  };

  // If we have a location, show success state
  if (location) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Location set successfully
                </p>
                {location.address && (
                  <p className="text-xs text-green-600">{location.address}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-teal-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            Find Stores Near You
          </h3>
          <p className="text-sm text-gray-600">
            We'll show you the closest grocery stores with current deals
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Primary option: Browser location */}
        {!isPermissionDenied && (
          <div className="space-y-2">
            <Button
              onClick={handleLocationRequest}
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Current Location
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              We'll use your device's location to find nearby stores
            </p>
          </div>
        )}

        {/* Fallback option: Manual address entry */}
        {(isPermissionDenied || hasAskedPermission) && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {isPermissionDenied ? 'Enter manually' : 'Or enter manually'}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-3">
              <div>
                <Input
                  type="text"
                  placeholder="Enter postal code or address (e.g., M4B 1B3)"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Canadian postal codes work best (e.g., M4B 1B3)
                </p>
              </div>
              
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || !addressInput.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Set Location
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🔒 Your location is only stored for this browsing session</p>
          <p>We use this to calculate distances to stores near you</p>
        </div>
      </CardContent>
    </Card>
  );
}