/**
 * 📸 Photo Capture Screen
 *
 * Camera screen for before/after job documentation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Button, Card } from '../../components';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { jobsApi } from '../../services/api';
import { offlineStorage } from '../../services/offline';
import * as Haptics from 'expo-haptics';

type PhotoType = 'before' | 'after';

export default function CameraScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [photoType, setPhotoType] = useState<PhotoType>('before');
  const [capturedPhotos, setCapturedPhotos] = useState<{
    before?: string;
    after?: string;
  }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      setCapturedPhotos({
        ...capturedPhotos,
        [photoType]: photo.uri,
      });

      setCurrentPreview(photo.uri);
      setShowPreview(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhotos({
        ...capturedPhotos,
        [photoType]: result.assets[0].uri,
      });

      setCurrentPreview(result.assets[0].uri);
      setShowPreview(true);
    }
  };

  const retakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedPhotos({
      ...capturedPhotos,
      [photoType]: undefined,
    });
    setShowPreview(false);
    setCurrentPreview(null);
  };

  const acceptPhoto = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPreview(false);
    setCurrentPreview(null);
  };

  const uploadPhotos = async () => {
    if (!capturedPhotos.before && !capturedPhotos.after) {
      Alert.alert('Ingen fotos', 'Tag mindst ét foto før upload');
      return;
    }

    setUploading(true);

    try {
      // Upload before photo
      if (capturedPhotos.before) {
        await uploadPhoto(capturedPhotos.before, 'before');
      }

      // Upload after photo
      if (capturedPhotos.after) {
        await uploadPhoto(capturedPhotos.after, 'after');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Succes!',
        'Fotos uploadet',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fejl', 'Kunne ikke uploade fotos. De gemmes offline.');

      // Save offline
      await saveOffline();
    } finally {
      setUploading(false);
    }
  };

  const uploadPhoto = async (uri: string, type: PhotoType) => {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error('File not found');

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to API
    await jobsApi.addJobPhoto(jobId!, {
      uri,
      type,
      data: base64,
      timestamp: Date.now(),
    });
  };

  const saveOffline = async () => {
    const photos = [];

    if (capturedPhotos.before) {
      photos.push({
        id: `${jobId}_before_${Date.now()}`,
        jobId: jobId!,
        uri: capturedPhotos.before,
        type: 'before' as const,
        timestamp: Date.now(),
        synced: 0,
      });
    }

    if (capturedPhotos.after) {
      photos.push({
        id: `${jobId}_after_${Date.now()}`,
        jobId: jobId!,
        uri: capturedPhotos.after,
        type: 'after' as const,
        timestamp: Date.now(),
        synced: 0,
      });
    }

    for (const photo of photos) {
      await offlineStorage.addToSyncQueue({
        id: photo.id,
        type: 'photo_upload',
        data: photo,
        timestamp: Date.now(),
      });
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Anmoder om kamera tilladelse...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.neutral[400]} />
          <Text style={styles.permissionTitle}>Kamera adgang nødvendig</Text>
          <Text style={styles.permissionText}>
            Giv app'en tilladelse til kameraet i indstillinger
          </Text>
          <Button onPress={requestPermissions} style={{ marginTop: spacing.lg }}>
            Anmod om tilladelse
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {photoType === 'before' ? 'Før-billede' : 'Efter-billede'}
        </Text>

        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            setType(
              type === CameraType.back ? CameraType.front : CameraType.back
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons name="camera-reverse" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <Camera ref={cameraRef} style={styles.camera} type={type}>
        <View style={styles.cameraOverlay}>
          {/* Grid lines */}
          <View style={styles.gridContainer}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineVertical]} />
          </View>
        </View>
      </Camera>

      {/* Photo Type Selector */}
      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            photoType === 'before' && styles.typeButtonActive,
          ]}
          onPress={() => {
            setPhotoType('before');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name="image-outline"
            size={20}
            color={photoType === 'before' ? '#ffffff' : colors.neutral[600]}
          />
          <Text
            style={[
              styles.typeButtonText,
              photoType === 'before' && styles.typeButtonTextActive,
            ]}
          >
            Før
          </Text>
          {capturedPhotos.before && (
            <View style={styles.photoIndicator}>
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            photoType === 'after' && styles.typeButtonActive,
          ]}
          onPress={() => {
            setPhotoType('after');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={photoType === 'after' ? '#ffffff' : colors.neutral[600]}
          />
          <Text
            style={[
              styles.typeButtonText,
              photoType === 'after' && styles.typeButtonTextActive,
            ]}
          >
            Efter
          </Text>
          {capturedPhotos.after && (
            <View style={styles.photoIndicator}>
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Gallery button */}
        <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
          <Ionicons name="images" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* Capture button */}
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        {/* Upload button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            (!capturedPhotos.before && !capturedPhotos.after) &&
              styles.controlButtonDisabled,
          ]}
          onPress={uploadPhotos}
          disabled={!capturedPhotos.before && !capturedPhotos.after}
        >
          <Ionicons
            name="cloud-upload"
            size={28}
            color={
              capturedPhotos.before || capturedPhotos.after
                ? '#ffffff'
                : colors.neutral[600]
            }
          />
        </TouchableOpacity>
      </View>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="fade" transparent={true}>
        <View style={styles.previewModal}>
          <View style={styles.previewContainer}>
            {currentPreview && (
              <Image source={{ uri: currentPreview }} style={styles.previewImage} />
            )}

            <View style={styles.previewActions}>
              <Button variant="outline" onPress={retakePhoto} fullWidth>
                Tag igen
              </Button>
              <Button onPress={acceptPhoto} fullWidth>
                Brug billede
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    color: '#ffffff',
  },

  flipButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    flex: 1,
  },

  gridContainer: {
    flex: 1,
  },

  gridLine: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  gridLineVertical: {
    top: 0,
    bottom: 0,
    left: '33.33%',
    width: 1,
    height: '100%',
  },

  typeSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.sm,
    position: 'relative',
  },

  typeButtonActive: {
    backgroundColor: colors.primary[500],
  },

  typeButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as any,
    color: colors.neutral[600],
  },

  typeButtonTextActive: {
    color: '#ffffff',
  },

  photoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  controlButtonDisabled: {
    opacity: 0.5,
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  permissionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  permissionText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
  },

  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewContainer: {
    width: '90%',
    maxHeight: '80%',
  },

  previewImage: {
    width: '100%',
    height: 500,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },

  previewActions: {
    gap: spacing.md,
  },
});
