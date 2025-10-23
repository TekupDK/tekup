import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { jobsApi } from '../../services/api';
import { JobCard } from '../../components/JobCard';
import { LocationStatus } from '../../components/LocationStatus';
import { AIFridayWidget } from '../../components/AIFridayWidget';

export default function TodayScreen() {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>
        God morgen, {user?.name?.split(' ')[0]}! 👋
      </Text>
      <Text style={styles.date}>
        {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: da })}
      </Text>
      
      <LocationStatus
        location={location}
        isTracking={isTracking}
        onToggleTracking={toggleLocationTracking}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todaysJobs?.length || 0}</Text>
          <Text style={styles.statLabel}>Jobs i dag</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {todaysJobs?.filter(job => job.status === 'completed').length || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyTitle}>Ingen jobs i dag</Text>
      <Text style={styles.emptySubtitle}>
        Du har ingen planlagte jobs for i dag. Nyd din fridag! 🎉
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={todaysJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => handleJobPress(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <AIFridayWidget context="employee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 100, // Space for AI Friday widget
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});