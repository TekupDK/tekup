/**
 * 🃏 Card Component
 *
 * Beautiful card component with shadow and customizable styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';
import * as Haptics from 'expo-haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  variant?: 'elevated' | 'outlined' | 'filled';
  haptic?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = 'md',
  variant = 'elevated',
  haptic = true,
}) => {
  const containerStyle = [
    styles.card,
    styles[`card_${variant}`],
    { padding: spacing[padding] },
    style,
  ];

  const handlePress = () => {
    if (onPress) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    backgroundColor: '#ffffff',
  },

  card_elevated: {
    ...shadows.md,
  },

  card_outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  card_filled: {
    backgroundColor: colors.neutral[50],
  },
});
