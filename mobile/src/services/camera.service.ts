import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Camera Service
 * Handles photo capture with GPS metadata (Expo version)
 */
class CameraService {
  private lastKnownLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
  } | null = null;

  /**
   * Request camera permission
   */
  async requestCameraPermission() {
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    return cameraResult.granted;
  }

  /**
   * Request location permission (best-effort)
   */
  async requestLocationPermission() {
    const locationResult = await Location.requestForegroundPermissionsAsync();
    return locationResult.granted;
  }

  formatLocationError(error: any) {
    const message = error?.message || 'Unable to get current location';
    if (message.includes('unsatisfied device settings')) {
      return 'Location settings are off. Please enable device location (High Accuracy) and try again.';
    }
    if (message.includes('denied')) {
      return 'Location permission denied. Please allow location access and try again.';
    }
    if (message.includes('disabled')) {
      return 'Location service is disabled. Please turn on device location and try again.';
    }
    return message;
  }

  /**
   * Capture photo with GPS metadata
   */
  async capturePhoto() {
    try {
      // Camera must be granted to proceed.
      const hasCameraPermission = await this.requestCameraPermission();
      if (!hasCameraPermission) {
        throw new Error('Camera permission denied');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        exif: true,
      });

      if (result.canceled) {
        return null;
      }

      const photo = result.assets[0];

      // Location is best-effort after camera capture.
      const hasLocationPermission = await this.requestLocationPermission();
      if (!hasLocationPermission && this.lastKnownLocation) {
        return {
          uri: photo.uri,
          fileName: photo.fileName || `photo_${Date.now()}.jpg`,
          fileSize: photo.fileSize,
          type: photo.mimeType || 'image/jpeg',
          width: photo.width,
          height: photo.height,
          gpsLatitude: this.lastKnownLocation.latitude,
          gpsLongitude: this.lastKnownLocation.longitude,
          gpsAccuracy: this.lastKnownLocation.accuracy,
          capturedTimestamp: new Date().toISOString(),
        };
      }

      if (!hasLocationPermission) {
        throw new Error('Location permission denied. Please allow location to capture evidence photos.');
      }

      let location;
      try {
        location = await this.getCurrentLocation();
      } catch (locationError: any) {
        if (this.lastKnownLocation) {
          location = this.lastKnownLocation;
        } else {
          throw new Error(this.formatLocationError(locationError));
        }
      }

      return {
        uri: photo.uri,
        fileName: photo.fileName || `photo_${Date.now()}.jpg`,
        fileSize: photo.fileSize,
        type: photo.mimeType || 'image/jpeg',
        width: photo.width,
        height: photo.height,
        gpsLatitude: location.latitude,
        gpsLongitude: location.longitude,
        gpsAccuracy: location.accuracy,
        capturedTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Photo capture error:', error);
      throw error;
    }
  }

  /**
   * Get current GPS location
   */
  async getCurrentLocation() {
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // continue and try position APIs below
      }
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error('Location services are disabled');
    }

    let location;
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch {
      location = await Location.getLastKnownPositionAsync({});
    }

    if (!location) {
      throw new Error('Unable to get current location');
    }

    const normalized = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      timestamp: location.timestamp,
    };
    this.lastKnownLocation = normalized;
    return normalized;
  }

  /**
   * Validate GPS accuracy
   */
  validateGpsAccuracy(accuracy: number | null | undefined, threshold = 100) {
    if (accuracy === null || accuracy === undefined || Number.isNaN(accuracy)) {
      return true;
    }
    return accuracy <= threshold;
  }
}

export default new CameraService();
