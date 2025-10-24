/**
 * 🔐 Login Screen
 *
 * Beautiful login with biometric authentication
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const {
    login,
    loginWithBiometric,
    isLoading,
    biometricEnabled,
    checkBiometricSupport,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const supported = await checkBiometricSupport();
    setBiometricSupported(supported);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fejl', 'Udfyld venligst email og adgangskode');
      return;
    }

    try {
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login fejlede', error.message || 'Kunne ikke logge ind');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Biometric login fejlede', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.title}>RendetaljeOS</Text>
          <Text style={styles.subtitle}>Log ind for at fortsætte</Text>
        </View>

        {/* Biometric Quick Login */}
        {biometricEnabled && biometricSupported && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={48} color={colors.primary[500]} />
            <Text style={styles.biometricText}>Log ind med biometrics</Text>
          </TouchableOpacity>
        )}

        {biometricEnabled && biometricSupported && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>eller</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Login Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="din@email.dk"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.neutral[400]} />}
          />

          <Input
            label="Adgangskode"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.neutral[400]} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Glemt adgangskode', 'Kontakt din administrator');
            }}
          >
            <Text style={styles.forgotPasswordText}>Glemt adgangskode?</Text>
          </TouchableOpacity>

          <Button
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            size="lg"
          >
            Log ind
          </Button>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.featureText}>GPS tracking</Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.featureText}>Foto dokumentation</Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.featureText}>Time tracking</Text>
          </View>
        </View>

        {/* Help */}
        <View style={styles.help}>
          <Text style={styles.helpText}>Brug for hjælp?</Text>
          <TouchableOpacity onPress={() => Alert.alert('Support', 'Kontakt support@rendetalje.dk')}>
            <Text style={styles.helpLink}>Kontakt support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    marginTop: spacing['2xl'],
  },

  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  logoText: {
    fontSize: 40,
    fontWeight: typography.weights.bold as any,
    color: '#ffffff',
  },

  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
  },

  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },

  biometricText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.primary[700],
    marginTop: spacing.sm,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },

  dividerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginHorizontal: spacing.md,
  },

  form: {
    marginBottom: spacing.xl,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },

  forgotPasswordText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.medium as any,
  },

  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing.lg,
  },

  feature: {
    alignItems: 'center',
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  featureText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  help: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  helpText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },

  helpLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.semibold as any,
  },
});