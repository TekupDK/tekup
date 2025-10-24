/**
 * 📍 LocationStatus Component
 *
 * Shows current location with tracking toggle
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import * as Haptics from 'expo-haptics';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface LocationStatusProps {
  location?: Location | null;
  isTracking: boolean;
  onToggleTracking: () => void;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  location,
  isTracking,
  onToggleTracking,
}) => {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleTracking();
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationInfo}>
        <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>
            {isTracking ? 'GPS Tracking Aktiv' : 'GPS Tracking Inaktiv'}
          </Text>
          {location && isTracking && (
            <Text style={styles.addressText} numberOfLines={1}>
              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.toggleButton, isTracking && styles.toggleButtonActive]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isTracking ? 'pause' : 'play'}
          size={20}
          color={isTracking ? '#ffffff' : colors.primary[500]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutral[300],
    marginRight: spacing.md,
  },

  statusDotActive: {
    backgroundColor: colors.success[500],
    shadowColor: colors.success[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  textContainer: {
    flex: 1,
  },

  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[900],
    marginBottom: 2,
  },

  addressText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },

  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },

  toggleButtonActive: {
    backgroundColor: colors.primary[500],
  },
});
