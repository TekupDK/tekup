/**
 * 💼 JobCard Component
 *
 * Beautiful job card with status, customer info, and actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { colors, typography, spacing, borderRadius } from '../theme';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export interface Job {
  id: string;
  title: string;
  description?: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
    address: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledStart: Date;
  scheduledEnd: Date;
  priority?: 'low' | 'medium' | 'high';
  estimatedDuration?: number;
  distance?: number;
}

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const, icon: 'time-outline' },
  in_progress: { label: 'I gang', variant: 'primary' as const, icon: 'play-circle-outline' },
  completed: { label: 'Afsluttet', variant: 'success' as const, icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Annulleret', variant: 'error' as const, icon: 'close-circle-outline' },
};

const priorityConfig = {
  low: { color: colors.neutral[500], icon: 'arrow-down' },
  medium: { color: colors.warning[500], icon: 'remove' },
  high: { color: colors.error[500], icon: 'arrow-up' },
};

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const statusInfo = statusConfig[job.status];
  const priorityInfo = job.priority ? priorityConfig[job.priority] : null;

  return (
    <Card onPress={onPress} style={styles.card}>
      {/* Header with status and priority */}
      <View style={styles.header}>
        <Badge variant={statusInfo.variant} dot>
          {statusInfo.label}
        </Badge>

        <View style={styles.headerRight}>
          {priorityInfo && (
            <Ionicons
              name={priorityInfo.icon as any}
              size={16}
              color={priorityInfo.color}
              style={styles.priorityIcon}
            />
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        </View>
      </View>

      {/* Job title and description */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
        {job.description && (
          <Text style={styles.description} numberOfLines={2}>
            {job.description}
          </Text>
        )}
      </View>

      {/* Customer info */}
      <View style={styles.customer}>
        <Avatar name={job.customer.name} imageUrl={job.customer.avatar} size="sm" />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} numberOfLines={1}>
            {job.customer.name}
          </Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.neutral[500]} />
            <Text style={styles.address} numberOfLines={1}>
              {job.customer.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Time and info */}
      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={16} color={colors.primary[500]} />
          <Text style={styles.timeText}>
            {format(job.scheduledStart, 'HH:mm', { locale: da })} -{' '}
            {format(job.scheduledEnd, 'HH:mm', { locale: da })}
          </Text>
        </View>

        {job.estimatedDuration && (
          <View style={styles.durationInfo}>
            <Ionicons name="hourglass-outline" size={16} color={colors.neutral[500]} />
            <Text style={styles.infoText}>{job.estimatedDuration}h</Text>
          </View>
        )}

        {job.distance && (
          <View style={styles.distanceInfo}>
            <Ionicons name="navigate-outline" size={16} color={colors.neutral[500]} />
            <Text style={styles.infoText}>{job.distance.toFixed(1)} km</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priorityIcon: {
    marginRight: spacing.sm,
  },

  content: {
    marginBottom: spacing.md,
  },

  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  description: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },

  customer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  customerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[900],
    marginBottom: 2,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  address: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginLeft: spacing.xs,
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },

  timeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.primary[700],
    marginLeft: spacing.xs,
  },

  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginLeft: spacing.xs,
  },
});
