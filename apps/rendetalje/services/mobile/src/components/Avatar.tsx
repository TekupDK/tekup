/**
 * 👤 Avatar Component
 *
 * User avatar with initials fallback and status indicator
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
  style?: ViewStyle;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const getInitials = (name?: string): string => {
  if (!name) return '?';

  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name,
  size = 'md',
  status,
  style,
}) => {
  const avatarSize = sizeMap[size];
  const statusSize = avatarSize * 0.25;
  const fontSize = avatarSize * 0.4;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={[styles.initials, { fontSize }]}>
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>

      {status && (
        <View
          style={[
            styles.statusIndicator,
            styles[`status_${status}`],
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  avatar: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  image: {
    resizeMode: 'cover',
  },

  initialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  initials: {
    color: colors.primary[600],
    fontWeight: typography.weights.bold as any,
  },

  statusIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  status_online: {
    backgroundColor: colors.success[500],
  },
  status_offline: {
    backgroundColor: colors.neutral[400],
  },
  status_busy: {
    backgroundColor: colors.error[500],
  },
});
