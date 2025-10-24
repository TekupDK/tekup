/**
 * 💼 Job Details Screen
 *
 * Complete job view with all details and actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button, Card, Badge, Avatar } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { jobsApi } from '../../services/api';
import { Job } from '../../components/JobCard';
import * as Haptics from 'expo-haptics';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: Job['status']) =>
      jobsApi.updateJobStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleUpdateStatus = (status: Job['status']) => {
    const statusLabels = {
      pending: 'Pending',
      in_progress: 'I gang',
      completed: 'Afsluttet',
      cancelled: 'Annulleret',
    };

    Alert.alert(
      'Opdater status',
      `Vil du ændre status til "${statusLabels[status]}"?`,
      [
        { text: 'Annuller', style: 'cancel' },
        {
          text: 'Ja',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            updateStatusMutation.mutate(status);
          },
        },
      ]
    );
  };

  const callCustomer = () => {
    if (job?.customer.phone) {
      Linking.openURL(`tel:${job.customer.phone}`);
    }
  };

  const openNavigation = () => {
    if (job?.customer.address) {
      const address = encodeURIComponent(job.customer.address);
      Linking.openURL(`https://maps.google.com/?q=${address}`);
    }
  };

  const toggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading || !job) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <Text>Indlæser...</Text>
        </View>
      </View>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: 'time-outline' },
    in_progress: {
      label: 'I gang',
      variant: 'primary' as const,
      icon: 'play-circle-outline',
    },
    completed: {
      label: 'Afsluttet',
      variant: 'success' as const,
      icon: 'checkmark-circle-outline',
    },
    cancelled: {
      label: 'Annulleret',
      variant: 'error' as const,
      icon: 'close-circle-outline',
    },
  };

  const currentStatus = statusConfig[job.status];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Detaljer</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: colors[currentStatus.variant][50] }]}>
          <Ionicons
            name={currentStatus.icon as any}
            size={32}
            color={colors[currentStatus.variant][500]}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusText, { color: colors[currentStatus.variant][700] }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>

        {/* Job Title */}
        <View style={styles.section}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          {job.description && (
            <Text style={styles.jobDescription}>{job.description}</Text>
          )}
        </View>

        {/* Customer Info */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Kunde</Text>
          </View>

          <View style={styles.customerInfo}>
            <Avatar name={job.customer.name} imageUrl={job.customer.avatar} size="md" />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.customerContact}>
                <Ionicons name="location-outline" size={16} color={colors.neutral[500]} />
                <Text style={styles.customerAddress}>{job.customer.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <Button
              variant="outline"
              size="md"
              icon={<Ionicons name="call-outline" size={20} />}
              onPress={callCustomer}
              style={{ flex: 1 }}
            >
              Ring
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Ionicons name="navigate-outline" size={20} />}
              onPress={openNavigation}
              style={{ flex: 1 }}
            >
              Naviger
            </Button>
          </View>
        </Card>

        {/* Schedule */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Tidsplan</Text>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Dato</Text>
              <Text style={styles.scheduleValue}>
                {format(job.scheduledStart, 'EEEE, d. MMMM', { locale: da })}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Start</Text>
              <Text style={styles.scheduleValue}>
                {format(job.scheduledStart, 'HH:mm')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Slut</Text>
              <Text style={styles.scheduleValue}>
                {format(job.scheduledEnd, 'HH:mm')}
              </Text>
            </View>
            {job.estimatedDuration && (
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Varighed</Text>
                <Text style={styles.scheduleValue}>{job.estimatedDuration}t</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Handlinger</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/time-tracking/${job.id}` as any)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="time" size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/camera/${job.id}` as any)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.success[100] }]}>
                <Ionicons name="camera" size={24} color={colors.success[500]} />
              </View>
              <Text style={styles.actionButtonText}>Fotos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/map/route' as any)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.warning[100] }]}>
                <Ionicons name="map" size={24} color={colors.warning[500]} />
              </View>
              <Text style={styles.actionButtonText}>Rute</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, { backgroundColor: colors.error[100] }]}>
                <Ionicons name="document-text" size={24} color={colors.error[500]} />
              </View>
              <Text style={styles.actionButtonText}>Rapport</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Status Actions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-network" size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Opdater Status</Text>
          </View>

          <View style={styles.statusActions}>
            {job.status !== 'in_progress' && (
              <Button
                variant="primary"
                size="md"
                icon={<Ionicons name="play-circle" size={20} color="#ffffff" />}
                onPress={() => handleUpdateStatus('in_progress')}
                fullWidth
              >
                Start Job
              </Button>
            )}

            {job.status === 'in_progress' && (
              <Button
                variant="primary"
                size="md"
                icon={<Ionicons name="checkmark-circle" size={20} color="#ffffff" />}
                onPress={() => handleUpdateStatus('completed')}
                fullWidth
              >
                Marker som Afsluttet
              </Button>
            )}

            {job.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="md"
                icon={<Ionicons name="close-circle-outline" size={20} />}
                onPress={() => handleUpdateStatus('cancelled')}
                fullWidth
              >
                Annuller
              </Button>
            )}
          </View>
        </Card>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
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

  moreButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },

  statusInfo: {
    flex: 1,
  },

  statusLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },

  statusText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
  },

  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
  },

  jobTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },

  jobDescription: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
  },

  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  customerDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },

  customerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  customerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  customerAddress: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    flex: 1,
  },

  contactButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  scheduleItem: {
    flex: 1,
  },

  scheduleLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },

  scheduleValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[900],
  },

  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  actionButton: {
    alignItems: 'center',
    minWidth: 70,
  },

  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  actionButtonText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
  },

  statusActions: {
    gap: spacing.md,
  },
});
