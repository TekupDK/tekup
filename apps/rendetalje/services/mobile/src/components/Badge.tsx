/**
 * 🏷️ Badge Component
 *
 * Small status indicator badge with different variants
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  dot = false,
}) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`], style]}>
      {dot && <View style={[styles.dot, styles[`dot_${variant}`]]} />}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },

  // Variants
  badge_primary: {
    backgroundColor: colors.primary[100],
  },
  badge_success: {
    backgroundColor: colors.success[100],
  },
  badge_warning: {
    backgroundColor: colors.warning[100],
  },
  badge_error: {
    backgroundColor: colors.error[100],
  },
  badge_neutral: {
    backgroundColor: colors.neutral[100],
  },

  // Sizes
  badge_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badge_lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // Dot
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  dot_primary: {
    backgroundColor: colors.primary[500],
  },
  dot_success: {
    backgroundColor: colors.success[500],
  },
  dot_warning: {
    backgroundColor: colors.warning[500],
  },
  dot_error: {
    backgroundColor: colors.error[500],
  },
  dot_neutral: {
    backgroundColor: colors.neutral[500],
  },

  // Text
  text: {
    fontWeight: typography.weights.medium as any,
  },
  text_primary: {
    color: colors.primary[700],
  },
  text_success: {
    color: colors.success[700],
  },
  text_warning: {
    color: colors.warning[700],
  },
  text_error: {
    color: colors.error[700],
  },
  text_neutral: {
    color: colors.neutral[700],
  },

  // Text sizes
  text_sm: {
    fontSize: typography.sizes.xs,
  },
  text_md: {
    fontSize: typography.sizes.sm,
  },
  text_lg: {
    fontSize: typography.sizes.base,
  },
});
