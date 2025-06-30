// frontend/lib/location.ts
export interface UserLocation {
    latitude: number;
    longitude: number;
    address?: string;
    source: 'browser' | 'postal' | 'address';
    timestamp: number;
}

export interface DistanceInfo {
    distance: number; // in km
    duration?: string; // estimated travel time if available
}

// Haversine formula for calculating distance between two pointsg
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Session storage keys
const LOCATION_STORAGE_KEY = 'skrimp_user_location';

export class LocationService {
    private static instance: LocationService;

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    // Get stored location from session storage
    getStoredLocation(): UserLocation | null {
        try {
            const stored = sessionStorage.getItem(LOCATION_STORAGE_KEY);
            if (!stored) return null;

            const location = JSON.parse(stored) as UserLocation;

            // Check if location is from current session (less than 24 hours old)
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (now - location.timestamp > maxAge) {
                this.clearStoredLocation();
                return null;
            }

            return location;
        } catch (error) {
            console.warn('Failed to get stored location:', error);
            return null;
        }
    }

    // Store location in session storage
    storeLocation(location: UserLocation): void {
        try {
            sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
        } catch (error) {
            console.warn('Failed to store location:', error);
        }
    }

    // Clear stored location
    clearStoredLocation(): void {
        try {
            sessionStorage.removeItem(LOCATION_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear stored location:', error);
        }
    }

    // Get user location via browser geolocation
    async getBrowserLocation(): Promise<UserLocation> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const options: PositionOptions = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds
                maximumAge: 300000 // 5 minutes
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: UserLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        source: 'browser',
                        timestamp: Date.now()
                    };

                    this.storeLocation(location);
                    resolve(location);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    reject(error);
                },
                options
            );
        });
    }

    // Geocode postal code or address using Geocodio API
    async geocodeAddress(address: string): Promise<UserLocation> {
        // Debug environment variables
        console.log('=== Environment Debug ===');
        console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GEOCODIO_API_KEY);
        console.log('API Key length:', process.env.NEXT_PUBLIC_GEOCODIO_API_KEY?.length);
        console.log('API Key preview:', process.env.NEXT_PUBLIC_GEOCODIO_API_KEY?.substring(0, 8) + '...');

        // Simple postal code pattern for Canada (M4B 1B3 format)
        const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

        // If it looks like a Canadian postal code, add Canada to the query
        let searchQuery = address.trim();
        if (canadianPostalRegex.test(searchQuery)) {
            searchQuery += ', Canada';
        } else if (!searchQuery.toLowerCase().includes('canada') && !searchQuery.toLowerCase().includes('ontario')) {
            // Add Ontario context for your target area
            searchQuery += ', Ontario, Canada';
        }

        try {
            // Using Geocodio API (free tier: 2500 requests/day, $0.50/1000 after)
            // FIXED: Use NEXT_PUBLIC_GEOCODIO_API_KEY instead of GEOCODIO_API_KEY
            const apiKey = process.env.NEXT_PUBLIC_GEOCODIO_API_KEY;

            if (!apiKey) {
                throw new Error('Geocodio API key not found. Make sure NEXT_PUBLIC_GEOCODIO_API_KEY is set in your .env.local file.');
            }

            const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&limit=1`;

            console.log('=== Geocoding Debug ===');
            console.log('Search query:', searchQuery);
            console.log('Using API key:', apiKey.substring(0, 8) + '...');

            const response = await fetch(url);

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response body:', errorText);
                throw new Error(`Geocoding failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Geocoding success:', data);

            if (!data.results || data.results.length === 0) {
                throw new Error('No location found for this address');
            }

            const result = data.results[0];
            const location: UserLocation = {
                latitude: result.location.lat,
                longitude: result.location.lng,
                address: result.formatted_address,
                source: 'address',
                timestamp: Date.now()
            };

            this.storeLocation(location);
            return location;
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    // Get distance to store (requires store to have coordinates)
    getDistanceToStore(userLocation: UserLocation, storeLocation: { latitude: number; longitude: number }): DistanceInfo {
        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            storeLocation.latitude,
            storeLocation.longitude
        );

        return {
            distance,
            duration: this.estimateTravelTime(distance)
        };
    }

    // Simple travel time estimation (driving)
    private estimateTravelTime(distanceKm: number): string {
        // Rough estimation: 50km/h average speed in urban areas
        const hours = distanceKm / 50;

        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes} min`;
        } else {
            const wholeHours = Math.floor(hours);
            const minutes = Math.round((hours - wholeHours) * 60);
            return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
        }
    }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
