import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const handleTestPress = () => {
    Alert.alert('RendetaljeOS Test', 'Mobile app is working perfectly! 🎉');
  };

  const handleFeaturePress = (feature: string) => {
    Alert.alert('Feature Test', `${feature} is ready for implementation!`);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.title}>RendetaljeOS</Text>
        <Text style={styles.subtitle}>Mobile App - Android Test</Text>
      </View>
      
      {/* Status Cards */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>✅</Text>
          <Text style={styles.statusText}>App Running</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>📱</Text>
          <Text style={styles.statusText}>Android Ready</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>🚀</Text>
          <Text style={styles.statusText}>v1.0.0</Text>
        </View>
      </View>

      {/* Test Button */}
      <TouchableOpacity style={styles.testButton} onPress={handleTestPress}>
        <Text style={styles.testButtonText}>🧪 Test App Functionality</Text>
      </TouchableOpacity>
      
      {/* Feature Preview */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>📋 Planned Features</Text>
        
        <TouchableOpacity 
          style={styles.featureButton} 
          onPress={() => handleFeaturePress('GPS Tracking')}
        >
          <Text style={styles.featureEmoji}>📍</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>GPS Tracking</Text>
            <Text style={styles.featureDesc}>Real-time location for job routing</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureButton} 
          onPress={() => handleFeaturePress('Photo Capture')}
        >
          <Text style={styles.featureEmoji}>📸</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Photo Documentation</Text>
            <Text style={styles.featureDesc}>Before/after job photos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureButton} 
          onPress={() => handleFeaturePress('Time Tracking')}
        >
          <Text style={styles.featureEmoji}>⏰</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Time Tracking</Text>
            <Text style={styles.featureDesc}>Start/stop job timers</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureButton} 
          onPress={() => handleFeaturePress('Offline Mode')}
        >
          <Text style={styles.featureEmoji}>📱</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Offline Functionality</Text>
            <Text style={styles.featureDesc}>Work without internet</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureButton} 
          onPress={() => handleFeaturePress('AI Friday')}
        >
          <Text style={styles.featureEmoji}>🤖</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI Friday Assistant</Text>
            <Text style={styles.featureDesc}>Voice-enabled help system</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📱 Installation Success!</Text>
        <Text style={styles.infoText}>
          RendetaljeOS mobile app is now running on your Android device. 
          This is a test version to verify the installation process.
        </Text>
        <Text style={styles.infoText}>
          🎯 Next: Complete feature implementation and production build.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#2563eb',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  testButton: {
    backgroundColor: '#059669',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  featureButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#64748b',
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 8,
  },
});