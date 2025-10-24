/**
 * ⏱️ Time Tracking Screen
 *
 * Visual timer with statistics for job time tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Badge } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { timeTrackingApi } from '../../services/api';
import { offlineStorage } from '../../services/offline';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
}

export default function TimeTrackingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadTimeEntries();
    checkActiveTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = startTime.getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const loadTimeEntries = async () => {
    try {
      const response = await timeTrackingApi.getTimeEntries(jobId);
      const formattedEntries = response.data.map((entry: any) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      }));
      setEntries(formattedEntries);

      // Calculate total time
      const total = formattedEntries.reduce(
        (sum: number, entry: TimeEntry) => sum + (entry.duration || 0),
        0
      );
      setTotalTime(total);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    }
  };

  const checkActiveTimer = async () => {
    try {
      const response = await timeTrackingApi.getActiveTimer();
      if (response.data) {
        setIsRunning(true);
        setStartTime(new Date(response.data.startTime));
        setCurrentEntryId(response.data.id);
      }
    } catch (error) {
      // No active timer
    }
  };

  const startTimer = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const now = new Date();
      setStartTime(now);
      setIsRunning(true);
      setElapsedTime(0);

      const response = await timeTrackingApi.startTimer(jobId!);
      setCurrentEntryId(response.data.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to start timer:', error);
      // Save offline
      await saveOfflineEntry('start');
    }
  };

  const stopTimer = async () => {
    if (!currentEntryId || !startTime) return;

    Alert.alert(
      'Stop timer?',
      `Du har arbejdet i ${formatDuration(elapsedTime)}. Vil du stoppe?`,
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Stop',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              await timeTrackingApi.stopTimer(currentEntryId);

              setIsRunning(false);
              setStartTime(null);
              setCurrentEntryId(null);
              setElapsedTime(0);

              await loadTimeEntries();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to stop timer:', error);
              await saveOfflineEntry('stop');
            }
          },
        },
      ]
    );
  };

  const saveOfflineEntry = async (action: 'start' | 'stop') => {
    await offlineStorage.addToSyncQueue({
      id: `time_${Date.now()}`,
      type: 'time_entry',
      data: {
        jobId: jobId!,
        action,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}t ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm', { locale: da });
  };

  const getTimerDisplay = (): string => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  };

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
        <Text style={styles.headerTitle}>Time Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Display */}
        <Card style={styles.timerCard}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>
              {isRunning ? 'Kører' : 'Stoppet'}
            </Text>
            <Text style={styles.timerDisplay}>{getTimerDisplay()}</Text>

            {startTime && isRunning && (
              <Text style={styles.timerStarted}>
                Startet kl. {formatTime(startTime)}
              </Text>
            )}
          </View>

          {/* Timer Control */}
          <View style={styles.timerControl}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.timerButton, styles.startButton]}
                onPress={startTimer}
              >
                <Ionicons name="play" size={32} color="#ffffff" />
                <Text style={styles.timerButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.timerButton, styles.stopButton]}
                onPress={stopTimer}
              >
                <Ionicons name="stop" size={32} color="#ffffff" />
                <Text style={styles.timerButtonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={colors.primary[500]} />
            <Text style={styles.statValue}>
              {Math.floor(totalTime / 3600)}t {Math.floor((totalTime % 3600) / 60)}m
            </Text>
            <Text style={styles.statLabel}>Total tid</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="list-outline" size={32} color={colors.success[500]} />
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Sessioner</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="calendar-outline" size={32} color={colors.warning[500]} />
            <Text style={styles.statValue}>
              {entries.length > 0
                ? Math.floor(totalTime / entries.length / 60) + 'm'
                : '0m'}
            </Text>
            <Text style={styles.statLabel}>Gennemsnit</Text>
          </Card>
        </View>

        {/* Time Entries List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tids-registreringer</Text>
            <Badge variant="primary">{entries.length}</Badge>
          </View>

          {entries.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={colors.neutral[300]} />
                <Text style={styles.emptyTitle}>Ingen registreringer</Text>
                <Text style={styles.emptySubtitle}>
                  Start timeren for at begynde at tracke din tid
                </Text>
              </View>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTimes}>
                    <View style={styles.entryTime}>
                      <Ionicons
                        name="play-circle-outline"
                        size={16}
                        color={colors.success[500]}
                      />
                      <Text style={styles.entryTimeText}>
                        {formatTime(entry.startTime)}
                      </Text>
                    </View>

                    {entry.endTime && (
                      <>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={colors.neutral[400]}
                        />
                        <View style={styles.entryTime}>
                          <Ionicons
                            name="stop-circle-outline"
                            size={16}
                            color={colors.error[500]}
                          />
                          <Text style={styles.entryTimeText}>
                            {formatTime(entry.endTime)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {entry.duration ? (
                    <Badge variant="primary">
                      {formatDuration(entry.duration)}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Kører</Badge>
                  )}
                </View>

                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
              </Card>
            ))
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

  placeholder: {
    width: 44,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  timerCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },

  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  timerLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  timerDisplay: {
    fontSize: 56,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    fontVariant: ['tabular-nums'],
  },

  timerStarted: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.sm,
  },

  timerControl: {
    alignItems: 'center',
  },

  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    minWidth: 160,
  },

  startButton: {
    backgroundColor: colors.success[500],
  },

  stopButton: {
    backgroundColor: colors.error[500],
  },

  timerButtonText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold as any,
    color: '#ffffff',
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
  },

  section: {
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
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
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
  },

  entryCard: {
    marginBottom: spacing.md,
  },

  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  entryTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  entryTimeText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[900],
    fontWeight: typography.weights.medium as any,
  },

  entryNotes: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
