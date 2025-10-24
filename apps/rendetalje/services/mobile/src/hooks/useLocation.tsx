/**
 * 📍 useLocation Hook
 *
 * GPS location tracking with background support
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { create } from 'zustand';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  address?: string;
}

interface LocationState {
  location: LocationData | null;
  isTracking: boolean;
  error: string | null;
  permissionGranted: boolean;

  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  requestPermission: () => Promise<boolean>;
  reverseGeocode: (latitude: number, longitude: number) => Promise<string | undefined>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  isTracking: false,
  error: null,
  permissionGranted: false,

  requestPermission: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        set({ error: 'Location permission not granted' });
        return false;
      }

      // Request background permission for tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      set({
        permissionGranted: true,
        error: null,
      });

      return true;
    } catch (error) {
      set({ error: 'Failed to request location permission' });
      return false;
    }
  },

  getCurrentLocation: async () => {
    try {
      const { permissionGranted } = get();

      if (!permissionGranted) {
        const granted = await get().requestPermission();
        if (!granted) return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        altitude: position.coords.altitude ?? undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      };

      // Try to get address
      const address = await get().reverseGeocode(
        locationData.latitude,
        locationData.longitude
      );

      if (address) {
        locationData.address = address;
      }

      set({ location: locationData, error: null });
      return locationData;
    } catch (error) {
      set({ error: 'Failed to get current location' });
      return null;
    }
  },

  startTracking: async () => {
    const { permissionGranted } = get();

    if (!permissionGranted) {
      const granted = await get().requestPermission();
      if (!granted) return;
    }

    set({ isTracking: true, error: null });

    // Start watching location
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        };

        // Optionally get address (cached to avoid too many requests)
        const { location } = get();
        if (!location || getDistance(location, locationData) > 100) {
          const address = await get().reverseGeocode(
            locationData.latitude,
            locationData.longitude
          );
          if (address) {
            locationData.address = address;
          }
        } else {
          locationData.address = location.address;
        }

        set({ location: locationData });
      }
    );
  },

  stopTracking: () => {
    set({ isTracking: false });
    // Note: The watchPositionAsync subscription should be stored and removed here
  },

  reverseGeocode: async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const parts = [
          result.street,
          result.streetNumber,
          result.postalCode,
          result.city,
        ].filter(Boolean);

        return parts.join(', ');
      }

      return undefined;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return undefined;
    }
  },
}));

// Helper function to calculate distance between two points
function getDistance(loc1: LocationData, loc2: LocationData): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Hook export
export const useLocation = () => {
  const store = useLocationStore();

  // Request permission on mount
  useEffect(() => {
    store.requestPermission();
  }, []);

  return {
    location: store.location,
    isTracking: store.isTracking,
    error: store.error,
    permissionGranted: store.permissionGranted,
    startTracking: store.startTracking,
    stopTracking: store.stopTracking,
    getCurrentLocation: store.getCurrentLocation,
    requestPermission: store.requestPermission,
  };
};
