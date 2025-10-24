/**
 * 🌍 Geocoding Service
 *
 * Convert addresses to coordinates and vice versa
 */

import axios from 'axios';

// Google Maps Geocoding API key from environment
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Convert address to coordinates (forward geocoding)
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    // If Google Maps API key is not configured, use fallback mock data
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, using mock data');
      return getMockGeocodingResult(address);
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY,
          language: 'da',
          region: 'dk',
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;

      // Extract address components
      const addressComponents = result.address_components;
      const city = addressComponents.find((c: any) =>
        c.types.includes('locality') || c.types.includes('postal_town')
      )?.long_name;
      const postalCode = addressComponents.find((c: any) =>
        c.types.includes('postal_code')
      )?.long_name;
      const country = addressComponents.find((c: any) =>
        c.types.includes('country')
      )?.long_name;

      return {
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
        formattedAddress: result.formatted_address,
        city,
        postalCode,
        country,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return getMockGeocodingResult(address);
  }
};

/**
 * Convert coordinates to address (reverse geocoding)
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    // If Google Maps API key is not configured, use fallback
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, using coordinates');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_MAPS_API_KEY,
          language: 'da',
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  from: Coordinates,
  to: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Batch geocode multiple addresses
 */
export const batchGeocodeAddresses = async (
  addresses: string[]
): Promise<Map<string, GeocodingResult | null>> => {
  const results = new Map<string, GeocodingResult | null>();

  // Use Promise.allSettled to handle failures gracefully
  const promises = addresses.map(async (address) => {
    const result = await geocodeAddress(address);
    results.set(address, result);
  });

  await Promise.allSettled(promises);

  return results;
};

/**
 * Mock geocoding result for development/fallback
 * Uses Copenhagen area coordinates with random offsets
 */
const getMockGeocodingResult = (address: string): GeocodingResult => {
  // Copenhagen center coordinates
  const baseLat = 55.6761;
  const baseLng = 12.5683;

  // Add random offset (up to ~10km radius)
  const randomOffset = () => (Math.random() - 0.5) * 0.2;

  return {
    coordinates: {
      latitude: baseLat + randomOffset(),
      longitude: baseLng + randomOffset(),
    },
    formattedAddress: address,
    city: 'København',
    postalCode: '1000',
    country: 'Danmark',
  };
};

/**
 * Check if coordinates are within Denmark bounds
 */
export const isWithinDenmark = (coordinates: Coordinates): boolean => {
  // Approximate Denmark bounds
  const danmarkBounds = {
    north: 57.75,
    south: 54.55,
    east: 15.2,
    west: 8.0,
  };

  return (
    coordinates.latitude >= danmarkBounds.south &&
    coordinates.latitude <= danmarkBounds.north &&
    coordinates.longitude >= danmarkBounds.west &&
    coordinates.longitude <= danmarkBounds.east
  );
};

/**
 * Get coordinates for common Danish cities (fallback)
 */
export const getCityCoordinates = (cityName: string): Coordinates | null => {
  const danishCities: Record<string, Coordinates> = {
    københavn: { latitude: 55.6761, longitude: 12.5683 },
    aarhus: { latitude: 56.1629, longitude: 10.2039 },
    odense: { latitude: 55.4038, longitude: 10.4024 },
    aalborg: { latitude: 57.0488, longitude: 9.9217 },
    esbjerg: { latitude: 55.4760, longitude: 8.4600 },
    randers: { latitude: 56.4607, longitude: 10.0369 },
    kolding: { latitude: 55.4904, longitude: 9.4723 },
    horsens: { latitude: 55.8607, longitude: 9.8501 },
    vejle: { latitude: 55.7091, longitude: 9.5357 },
    roskilde: { latitude: 55.6415, longitude: 12.0803 },
    herning: { latitude: 56.1363, longitude: 8.9766 },
    helsingør: { latitude: 56.0361, longitude: 12.6136 },
    silkeborg: { latitude: 56.1697, longitude: 9.5451 },
    næstved: { latitude: 55.2297, longitude: 11.7611 },
    fredericia: { latitude: 55.5657, longitude: 9.7524 },
  };

  const normalized = cityName.toLowerCase().trim();
  return danishCities[normalized] || null;
};

export default {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  batchGeocodeAddresses,
  isWithinDenmark,
  getCityCoordinates,
};
