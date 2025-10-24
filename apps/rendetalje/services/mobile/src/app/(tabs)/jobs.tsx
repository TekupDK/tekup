/**
 * 💼 Jobs Tab Screen
 *
 * Complete job list with search, filtering, and sorting
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { jobsApi } from '../../services/api';
import { JobCard, Card, Badge, Button } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Job } from '../../components/JobCard';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type SortType = 'date' | 'priority' | 'distance';

export default function JobsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: allJobs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['jobs', 'all', user?.id],
    queryFn: () => jobsApi.getUpcomingJobs(user?.id),
    enabled: !!user?.id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!allJobs) return [];

    let filtered = allJobs;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.customer.name.toLowerCase().includes(query) ||
          job.customer.address.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const aPriority = a.priority || 'medium';
          const bPriority = b.priority || 'medium';
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        case 'distance':
          return (a.distance || 999) - (b.distance || 999);
        default:
          return 0;
      }
    });

    return sorted;
  }, [allJobs, selectedFilter, searchQuery, sortBy]);

  const handleJobPress = (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/job/${jobId}` as any);
  };

  const handleFilterChange = (filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filter);
  };

  const handleSortChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sortOptions: SortType[] = ['date', 'priority', 'distance'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };

  const getFilterCount = (filter: FilterType): number => {
    if (!allJobs) return 0;
    if (filter === 'all') return allJobs.length;
    return allJobs.filter((job) => job.status === filter).length;
  };

  const getSortLabel = (): string => {
    switch (sortBy) {
      case 'date':
        return 'Dato';
      case 'priority':
        return 'Prioritet';
      case 'distance':
        return 'Afstand';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Jobs</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={handleSortChange}
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary[500]} />
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Søg efter jobs, kunder eller adresse..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              Alle
            </Text>
            <Badge
              variant={selectedFilter === 'all' ? 'primary' : 'neutral'}
              size="sm"
            >
              {getFilterCount('all')}
            </Badge>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'pending' && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange('pending')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'pending' && styles.filterChipTextActive,
              ]}
            >
              Afventer
            </Text>
            <Badge
              variant={selectedFilter === 'pending' ? 'warning' : 'neutral'}
              size="sm"
            >
              {getFilterCount('pending')}
            </Badge>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'in_progress' && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange('in_progress')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'in_progress' && styles.filterChipTextActive,
              ]}
            >
              I gang
            </Text>
            <Badge
              variant={selectedFilter === 'in_progress' ? 'primary' : 'neutral'}
              size="sm"
            >
              {getFilterCount('in_progress')}
            </Badge>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'completed' && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange('completed')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'completed' && styles.filterChipTextActive,
              ]}
            >
              Afsluttet
            </Text>
            <Badge
              variant={selectedFilter === 'completed' ? 'success' : 'neutral'}
              size="sm"
            >
              {getFilterCount('completed')}
            </Badge>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'cancelled' && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange('cancelled')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'cancelled' && styles.filterChipTextActive,
              ]}
            >
              Annulleret
            </Text>
            <Badge
              variant={selectedFilter === 'cancelled' ? 'error' : 'neutral'}
              size="sm"
            >
              {getFilterCount('cancelled')}
            </Badge>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Job List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Card>
            <Text style={styles.loadingText}>Henter jobs...</Text>
          </Card>
        ) : filteredAndSortedJobs.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {filteredAndSortedJobs.length} {filteredAndSortedJobs.length === 1 ? 'job' : 'jobs'}
              </Text>
            </View>
            {filteredAndSortedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => handleJobPress(job.id)}
              />
            ))}
          </>
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Ingen resultater' : 'Ingen jobs'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Prøv at justere dine søgekriterier'
                  : selectedFilter === 'all'
                  ? 'Der er ingen jobs tilgængelige lige nu'
                  : 'Der er ingen jobs med denne status'}
              </Text>
              {searchQuery && (
                <Button
                  variant="outline"
                  onPress={() => setSearchQuery('')}
                  style={{ marginTop: spacing.lg }}
                >
                  Ryd søgning
                </Button>
              )}
            </View>
          </Card>
        )}

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

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
  },

  sortButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.primary[600],
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.neutral[900],
    paddingVertical: spacing.xs,
  },

  filterContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    gap: spacing.xs,
  },

  filterChipActive: {
    backgroundColor: colors.primary[500],
  },

  filterChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[700],
  },

  filterChipTextActive: {
    color: '#ffffff',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  resultsHeader: {
    marginBottom: spacing.md,
  },

  resultsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
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
