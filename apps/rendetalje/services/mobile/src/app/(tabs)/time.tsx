/**
 * ⏱️ Time Tracking Tab Screen
 *
 * Overview of all time entries with statistics and quick actions
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { timeTrackingApi } from '../../services/api';
import { Card, Badge, Button } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import * as Haptics from 'expo-haptics';

type PeriodType = 'today' | 'week' | 'month' | 'all';

interface TimeEntry {
  id: string;
  jobId: string;
  jobTitle?: string;
  customerName?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
  status?: 'active' | 'completed';
}

export default function TimeTrackingTabScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: timeEntries,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['time-entries', 'all', user?.id],
    queryFn: async () => {
      const response = await timeTrackingApi.getTimeEntries();
      // Transform data to match interface
      return response.data.map((entry: any) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: activeTimer } = useQuery({
    queryKey: ['time-tracking', 'active'],
    queryFn: () => timeTrackingApi.getActiveTimer(),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter entries by period
  const filteredEntries = useMemo(() => {
    if (!timeEntries) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedPeriod) {
      case 'today':
        return timeEntries.filter((entry) => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= today;
        });

      case 'week':
        const weekStart = startOfWeek(now, { locale: da });
        const weekEnd = endOfWeek(now, { locale: da });
        return timeEntries.filter((entry) =>
          isWithinInterval(new Date(entry.startTime), { start: weekStart, end: weekEnd })
        );

      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return timeEntries.filter((entry) =>
          isWithinInterval(new Date(entry.startTime), { start: monthStart, end: monthEnd })
        );

      case 'all':
      default:
        return timeEntries;
    }
  }, [timeEntries, selectedPeriod]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!filteredEntries) {
      return {
        totalHours: 0,
        totalMinutes: 0,
        totalSessions: 0,
        averageSession: 0,
        longestSession: 0,
      };
    }

    const totalSeconds = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSessions = filteredEntries.length;
    const averageSession = totalSessions > 0 ? Math.floor(totalSeconds / totalSessions / 60) : 0;
    const longestSession = Math.max(...filteredEntries.map((e) => e.duration || 0), 0);

    return {
      totalHours,
      totalMinutes,
      totalSessions,
      averageSession,
      longestSession: Math.floor(longestSession / 60),
    };
  }, [filteredEntries]);

  const handlePeriodChange = (period: PeriodType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };

  const handleStartTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to home screen or show job picker
    router.push('/(tabs)/home' as any);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}t ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm', { locale: da });
  };

  const formatDate = (date: Date): string => {
    return format(date, 'EEE, d. MMM', { locale: da });
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'today':
        return 'I dag';
      case 'week':
        return 'Denne uge';
      case 'month':
        return 'Denne måned';
      case 'all':
        return 'Alle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time Tracking</Text>

        {/* Period Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodContainer}
        >
          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'today' && styles.periodChipActive,
            ]}
            onPress={() => handlePeriodChange('today')}
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'today' && styles.periodChipTextActive,
              ]}
            >
              I dag
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'week' && styles.periodChipActive,
            ]}
            onPress={() => handlePeriodChange('week')}
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'week' && styles.periodChipTextActive,
              ]}
            >
              Uge
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'month' && styles.periodChipActive,
            ]}
            onPress={() => handlePeriodChange('month')}
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'month' && styles.periodChipTextActive,
              ]}
            >
              Måned
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'all' && styles.periodChipActive,
            ]}
            onPress={() => handlePeriodChange('all')}
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'all' && styles.periodChipTextActive,
              ]}
            >
              Alle
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Timer Banner */}
        {activeTimer?.data && (
          <Card style={styles.activeTimerBanner}>
            <View style={styles.activeTimerHeader}>
              <View style={styles.activeTimerInfo}>
                <View style={styles.activeIndicator} />
                <Text style={styles.activeTimerTitle}>Timer kører</Text>
              </View>
              <Badge variant="primary">Aktiv</Badge>
            </View>
            <Text style={styles.activeTimerJob}>
              {activeTimer.data.jobTitle || 'Ukendt job'}
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push(`/time-tracking/${activeTimer.data.jobId}` as any)}
              icon={<Ionicons name="time" size={16} color="#ffffff" />}
            >
              Se timer
            </Button>
          </Card>
        )}

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={colors.primary[500]} />
            <Text style={styles.statValue}>
              {statistics.totalHours}t {statistics.totalMinutes}m
            </Text>
            <Text style={styles.statLabel}>Total tid</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="list-outline" size={32} color={colors.success[500]} />
            <Text style={styles.statValue}>{statistics.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessioner</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={32} color={colors.warning[500]} />
            <Text style={styles.statValue}>{statistics.averageSession}m</Text>
            <Text style={styles.statLabel}>Gennemsnit</Text>
          </Card>
        </View>

        {/* Quick Action */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleStartTimer}
          fullWidth
          icon={<Ionicons name="play-circle" size={24} color="#ffffff" />}
          style={styles.startButton}
        >
          Start ny timer
        </Button>

        {/* Time Entries List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getPeriodLabel()} - {filteredEntries.length} {filteredEntries.length === 1 ? 'session' : 'sessioner'}
            </Text>
          </View>

          {isLoading ? (
            <Card>
              <Text style={styles.loadingText}>Henter time registreringer...</Text>
            </Card>
          ) : filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryJobTitle}>
                      {entry.jobTitle || 'Ukendt job'}
                    </Text>
                    {entry.customerName && (
                      <View style={styles.entryCustomer}>
                        <Ionicons name="person-outline" size={14} color={colors.neutral[500]} />
                        <Text style={styles.entryCustomerText}>{entry.customerName}</Text>
                      </View>
                    )}
                  </View>
                  {entry.duration ? (
                    <Badge variant="primary">{formatDuration(entry.duration)}</Badge>
                  ) : (
                    <Badge variant="warning">Kører</Badge>
                  )}
                </View>

                <View style={styles.entryDetails}>
                  <View style={styles.entryTime}>
                    <Ionicons name="calendar-outline" size={16} color={colors.neutral[500]} />
                    <Text style={styles.entryTimeText}>{formatDate(entry.startTime)}</Text>
                  </View>

                  <View style={styles.entryTime}>
                    <Ionicons name="time-outline" size={16} color={colors.neutral[500]} />
                    <Text style={styles.entryTimeText}>
                      {formatTime(entry.startTime)}
                      {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                    </Text>
                  </View>
                </View>

                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}

                <TouchableOpacity
                  style={styles.viewJobButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/job/${entry.jobId}` as any);
                  }}
                >
                  <Text style={styles.viewJobButtonText}>Se job</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color={colors.neutral[300]} />
                <Text style={styles.emptyTitle}>Ingen registreringer</Text>
                <Text style={styles.emptySubtitle}>
                  Start en timer for at begynde at tracke din tid
                </Text>
                <Button
                  variant="outline"
                  onPress={handleStartTimer}
                  style={{ marginTop: spacing.lg }}
                  icon={<Ionicons name="play-circle-outline" size={20} />}
                >
                  Start timer
                </Button>
              </View>
            </Card>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  header: {
    backgroundColor: '#ffffff',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  periodContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  periodChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },

  periodChipActive: {
    backgroundColor: colors.primary[500],
  },

  periodChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[700],
  },

  periodChipTextActive: {
    color: '#ffffff',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  activeTimerBanner: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
  },

  activeTimerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  activeTimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error[500],
  },

  activeTimerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.primary[700],
  },

  activeTimerJob: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  startButton: {
    marginBottom: spacing.lg,
  },

  section: {
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
  },

  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  entryCard: {
    marginBottom: spacing.md,
  },

  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  entryInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  entryJobTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  entryCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  entryCustomerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  entryDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },

  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  entryTimeText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  entryNotes: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  viewJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  viewJobButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.primary[500],
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },

  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[700],
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },

  emptySubtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
  },
});
