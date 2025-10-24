/**
 * 🏠 Home Screen
 *
 * Main dashboard with today's jobs and quick actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { jobsApi } from '../../services/api';
import {
  Card,
  JobCard,
  LocationStatus,
  AIFridayWidget,
  Avatar,
  Badge,
  Button,
} from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, isTracking, startTracking, stopTracking } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: todaysJobs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['jobs', 'today', user?.id],
    queryFn: () => jobsApi.getTodaysJobs(user?.id),
    enabled: !!user?.id,
  });

  const completedJobs = todaysJobs?.filter((job) => job.status === 'completed') || [];
  const activeJobs = todaysJobs?.filter((job) => job.status !== 'completed') || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/job/${jobId}` as any);
  };

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              name={user?.name}
              size="lg"
              imageUrl={user?.avatar}
              status="online"
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>
                God morgen! 👋
              </Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications' as any);
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.neutral[700]} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Date */}
        <Text style={styles.date}>
          {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: da })}
        </Text>

        {/* Location Status */}
        <LocationStatus
          location={location}
          isTracking={isTracking}
          onToggleTracking={toggleLocationTracking}
        />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} variant="elevated">
            <View style={styles.statIcon}>
              <Ionicons name="briefcase-outline" size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.statNumber}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Aktive jobs</Text>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: colors.success[100] }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success[500]} />
            </View>
            <Text style={styles.statNumber}>{completedJobs.length}</Text>
            <Text style={styles.statLabel}>Afsluttet</Text>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.statIcon, { backgroundColor: colors.warning[100] }]}>
              <Ionicons name="time-outline" size={24} color={colors.warning[500]} />
            </View>
            <Text style={styles.statNumber}>
              {todaysJobs?.reduce((sum, job) => sum + (job.estimatedDuration || 0), 0) || 0}h
            </Text>
            <Text style={styles.statLabel}>Estimeret tid</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hurtige handlinger</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Start first active job
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success[100] }]}>
                <Ionicons name="play-circle" size={28} color={colors.success[500]} />
              </View>
              <Text style={styles.quickActionText}>Start job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/camera' as any);
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="camera" size={28} color={colors.primary[500]} />
              </View>
              <Text style={styles.quickActionText}>Tag foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/route' as any);
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warning[100] }]}>
                <Ionicons name="navigate" size={28} color={colors.warning[500]} />
              </View>
              <Text style={styles.quickActionText}>Rute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/reports' as any);
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.error[100] }]}>
                <Ionicons name="document-text" size={28} color={colors.error[500]} />
              </View>
              <Text style={styles.quickActionText}>Rapport</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I dag's opgaver</Text>
            {todaysJobs && todaysJobs.length > 0 && (
              <Badge variant="primary">{todaysJobs.length}</Badge>
            )}
          </View>

          {isLoading ? (
            <Card>
              <Text style={styles.loadingText}>Henter jobs...</Text>
            </Card>
          ) : todaysJobs && todaysJobs.length > 0 ? (
            todaysJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
            ))
          ) : (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.neutral[300]} />
                <Text style={styles.emptyTitle}>Ingen jobs i dag</Text>
                <Text style={styles.emptySubtitle}>
                  Du har ingen planlagte jobs for i dag. Nyd din fridag! 🎉
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* AI Friday Widget */}
      <AIFridayWidget context="employee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing['2xl'],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    marginLeft: spacing.md,
  },

  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  userName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
  },

  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold as any,
    color: '#ffffff',
  },

  date: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  statNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickAction: {
    alignItems: 'center',
    flex: 1,
  },

  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  quickActionText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    textAlign: 'center',
  },

  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },

  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[700],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
});
