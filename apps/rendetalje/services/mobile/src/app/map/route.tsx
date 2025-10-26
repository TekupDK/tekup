/**
 * 🗺️ GPS Map Screen
 *
 * Interactive map with route optimization for today's jobs
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { jobsApi, locationApi } from '../../services/api';
import { Button, Card, Badge, Avatar } from '../../components';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import * as Haptics from 'expo-haptics';
import { Job } from '../../components/JobCard';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.1;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface RoutePoint {
  latitude: number;
  longitude: number;
  jobId?: string;
  order?: number;
}

export default function MapRouteScreen() {
  const { user } = useAuth();
  const { location, isTracking, startTracking } = useLocation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const mapRef = useRef<MapView>(null);

  const { data: todaysJobs, isLoading } = useQuery({
    queryKey: ['jobs', 'today', user?.id],
    queryFn: () => jobsApi.getTodaysJobs(user?.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }
  }, []);

  useEffect(() => {
    if (location && todaysJobs) {
      centerMapOnCurrentLocation();
    }
  }, [location, todaysJobs]);

  const centerMapOnCurrentLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  const optimizeRoute = async () => {
    if (!todaysJobs || todaysJobs.length === 0) return;

    setOptimizing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const jobIds = todaysJobs
        .filter((job) => job.status !== 'completed')
        .map((job) => job.id);

      const response = await locationApi.optimizeRoute(jobIds);
      const optimizedRoute = response.data;

      // Create route points from optimized order
      const points: RoutePoint[] = [];

      // Add current location as starting point
      if (location) {
        points.push({
          latitude: location.latitude,
          longitude: location.longitude,
          order: 0,
        });
      }

      // Add job locations in optimized order
      optimizedRoute.forEach((jobId: string, index: number) => {
        const job = todaysJobs.find((j) => j.id === jobId);
        if (job && job.customer.address) {
          // In real app, geocode address to coordinates
          // For now, use mock coordinates
          points.push({
            latitude: 55.6761 + Math.random() * 0.1,
            longitude: 12.5683 + Math.random() * 0.1,
            jobId: job.id,
            order: index + 1,
          });
        }
      });

      setRoutePoints(points);

      // Fit map to show all points
      if (mapRef.current && points.length > 0) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Route optimization failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleMarkerPress = (job: Job) => {
    setSelectedJob(job);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToJob = (jobId: string) => {
    // In real app, open navigation app
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/job/${jobId}` as any);
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return colors.success[500];
      case 'in_progress':
        return colors.primary[500];
      default:
        return colors.warning[500];
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ruteplanlægning</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 55.6761,
          longitude: location?.longitude || 12.5683,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={false}
      >
        {/* Job markers */}
        {todaysJobs?.map((job) => (
          <Marker
            key={job.id}
            coordinate={{
              // In real app, geocode address
              latitude: 55.6761 + Math.random() * 0.1,
              longitude: 12.5683 + Math.random() * 0.1,
            }}
            title={job.customer.name}
            description={job.title}
            pinColor={getMarkerColor(job.status)}
            onPress={() => handleMarkerPress(job)}
          >
            <View
              style={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(job.status) },
              ]}
            >
              <Ionicons name="business" size={16} color="#ffffff" />
            </View>
          </Marker>
        ))}

        {/* Route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={colors.primary[500]}
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerMapOnCurrentLocation}
        >
          <Ionicons name="locate" size={24} color={colors.primary[500]} />
        </TouchableOpacity>

        <Button
          onPress={optimizeRoute}
          loading={optimizing}
          icon={<Ionicons name="git-network-outline" size={20} color="#ffffff" />}
        >
          Optimer rute
        </Button>
      </View>

      {/* Job list bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jobsScroll}
        >
          {todaysJobs?.map((job, index) => (
            <Card
              key={job.id}
              style={[
                styles.jobCard,
                selectedJob?.id === job.id && styles.jobCardSelected,
              ]}
              onPress={() => handleMarkerPress(job)}
            >
              <View style={styles.jobCardHeader}>
                <Avatar name={job.customer.name} size="sm" />
                <View style={styles.jobCardInfo}>
                  <Text style={styles.jobCardName} numberOfLines={1}>
                    {job.customer.name}
                  </Text>
                  <Text style={styles.jobCardAddress} numberOfLines={1}>
                    {job.customer.address}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardFooter}>
                <Badge
                  variant={
                    job.status === 'completed'
                      ? 'success'
                      : job.status === 'in_progress'
                      ? 'primary'
                      : 'warning'
                  }
                  size="sm"
                >
                  {job.status === 'completed'
                    ? 'Afsluttet'
                    : job.status === 'in_progress'
                    ? 'I gang'
                    : 'Pending'}
                </Badge>

                {job.distance && (
                  <View style={styles.distance}>
                    <Ionicons
                      name="navigate-outline"
                      size={12}
                      color={colors.neutral[500]}
                    />
                    <Text style={styles.distanceText}>
                      {job.distance.toFixed(1)} km
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => navigateToJob(job.id)}
              >
                <Ionicons name="navigate" size={16} color={colors.primary[500]} />
                <Text style={styles.navigateButtonText}>Naviger</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    zIndex: 10,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
  },

  placeholder: {
    width: 44,
  },

  map: {
    flex: 1,
  },

  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },

  controls: {
    position: 'absolute',
    top: 100,
    right: spacing.md,
    gap: spacing.md,
  },

  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    ...shadows.xl,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  jobsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },

  jobCard: {
    width: 280,
    padding: spacing.md,
  },

  jobCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },

  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  jobCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  jobCardName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
  },

  jobCardAddress: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  distanceText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.md,
  },

  navigateButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.primary[500],
  },
});
