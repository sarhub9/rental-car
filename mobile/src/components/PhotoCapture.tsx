import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

/**
 * PhotoCapture Component
 * Handles photo capture with GPS metadata
 */
const PhotoCapture = ({ photoAngle, onPhotoCapture }) => {
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    try {
      if (!onPhotoCapture) return;
      setCapturing(true);
      await onPhotoCapture(photoAngle);
    } catch (error: any) {
      Alert.alert('Photo Capture Error', error?.message || 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleCapture} disabled={capturing}>
        <Text style={styles.buttonText}>{capturing ? 'Capturing...' : `Capture ${photoAngle}`}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoCapture;
