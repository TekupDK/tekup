/**
 * 👤 Profile & Settings Screen
 *
 * User profile and application settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card, Avatar, Input } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage } from '../../services/offline';

export default function ProfileScreen() {
  const { user, logout, enableBiometric, disableBiometric, biometricEnabled } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log ud',
      'Er du sikker på at du vil logge ud?',
      [
        { text: 'Annuller', style: 'cancel' },
        {
          text: 'Log ud',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  const toggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        await enableBiometric();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Succes', 'Biometric login aktiveret');
      } else {
        await disableBiometric();
        Alert.alert('Biometric login deaktiveret');
      }
    } catch (error: any) {
      Alert.alert('Fejl', error.message);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Ryd cache',
      'Dette vil slette alle lokale data. Er du sikker?',
      [
        { text: 'Annuller', style: 'cancel' },
        {
          text: 'Ryd',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await offlineStorage.clearAll();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Cache ryddet', 'Alle lokale data er slettet');
            } catch (error) {
              Alert.alert('Fejl', 'Kunne ikke rydde cache');
            }
          },
        },
      ]
    );
  };

  const syncNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await offlineStorage.syncAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sync fuldført',
        `${result.success} items synkroniseret${
          result.failed > 0 ? `, ${result.failed} fejlede` : ''
        }`
      );
    } catch (error) {
      Alert.alert('Sync fejlede', 'Kunne ikke synkronisere data');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil & Indstillinger</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.name}
              imageUrl={user?.avatar}
              size="xl"
              status="online"
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>24</Text>
              <Text style={styles.profileStatLabel}>Jobs</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>156h</Text>
              <Text style={styles.profileStatLabel}>Timer</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>4.8</Text>
              <Text style={styles.profileStatLabel}>Rating</Text>
            </View>
          </View>

          <Button
            variant="outline"
            onPress={() => router.push('/edit-profile' as any)}
            fullWidth
            icon={<Ionicons name="create-outline" size={20} />}
          >
            Rediger Profil
          </Button>
        </Card>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sikkerhed</Text>

          <Card>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => toggleBiometric(!biometricEnabled)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary[100] }]}>
                  <Ionicons name="finger-print" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Biometric Login</Text>
                  <Text style={styles.settingDescription}>
                    Face ID / Touch ID / Fingerprint
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/change-password' as any)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warning[100] }]}>
                  <Ionicons name="key" size={20} color={colors.warning[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Skift Adgangskode</Text>
                  <Text style={styles.settingDescription}>
                    Opdater din adgangskode
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Indstillinger</Text>

          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.neutral[100] }]}>
                  <Ionicons name="moon" size={20} color={colors.neutral[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Mørk tilstand</Text>
                  <Text style={styles.settingDescription}>
                    Skift til mørkt tema
                  </Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDarkMode(value);
                }}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success[100] }]}>
                  <Ionicons name="notifications" size={20} color={colors.success[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Notifikationer</Text>
                  <Text style={styles.settingDescription}>
                    Push beskeder og alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifications(value);
                }}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary[100] }]}>
                  <Ionicons name="location" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>GPS Tracking</Text>
                  <Text style={styles.settingDescription}>
                    Automatisk lokationsopsamling
                  </Text>
                </View>
              </View>
              <Switch
                value={locationTracking}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocationTracking(value);
                }}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warning[100] }]}>
                  <Ionicons name="cloud-offline" size={20} color={colors.warning[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Offline Mode</Text>
                  <Text style={styles.settingDescription}>
                    Arbejd uden internet
                  </Text>
                </View>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOfflineMode(value);
                }}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>
          </Card>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <Card>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={syncNow}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary[100] }]}>
                  <Ionicons name="sync" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Synkroniser Nu</Text>
                  <Text style={styles.settingDescription}>
                    Upload offline data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={clearCache}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.error[100] }]}>
                  <Ionicons name="trash" size={20} color={colors.error[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Ryd Cache</Text>
                  <Text style={styles.settingDescription}>
                    Slet lokale data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om</Text>

          <Card>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.neutral[100] }]}>
                  <Ionicons name="information-circle" size={20} color={colors.neutral[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Version</Text>
                  <Text style={styles.settingDescription}>
                    1.0.0 (Build 1)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.neutral[100] }]}>
                  <Ionicons name="document-text" size={20} color={colors.neutral[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Privatlivspolitik</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.neutral[100] }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.neutral[500]} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Vilkår & Betingelser</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            variant="danger"
            onPress={handleLogout}
            fullWidth
            icon={<Ionicons name="log-out-outline" size={20} color="#ffffff" />}
          >
            Log ud
          </Button>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
  },

  content: {
    flex: 1,
  },

  profileCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  profileHeader: {
    position: 'relative',
    marginBottom: spacing.md,
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },

  profileName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  profileEmail: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },

  profileStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    width: '100%',
    justifyContent: 'center',
  },

  profileStat: {
    alignItems: 'center',
  },

  profileStatValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },

  profileStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },

  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[900],
    marginBottom: 2,
  },

  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  settingDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: 56,
  },
});
