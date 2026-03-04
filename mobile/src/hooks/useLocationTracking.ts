import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import driverTaskApiService from '../services/driver-task-api.service';

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  speed_kmh?: number;
  recorded_at: string;
}

interface UseLocationTrackingResult {
  isTracking: boolean;
  lastLocation: LocationPoint | null;
  startTracking: (taskId: string) => void;
  stopTracking: () => void;
}

const BATCH_INTERVAL_MS = 30000; // 30 seconds
const MAX_BUFFER_SIZE = 10;
const OFFLINE_QUEUE_PREFIX = 'location_queue_';

/**
 * useLocationTracking hook (Expo version)
 * Provides background GPS tracking during active driver tasks.
 * Buffers updates and posts batch every 30s. Queues offline.
 */
export const useLocationTracking = (): UseLocationTrackingResult => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationPoint | null>(null);

  const taskIdRef = useRef<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const bufferRef = useRef<LocationPoint[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const netInfoUnsubRef = useRef<(() => void) | null>(null);

  const flushBuffer = useCallback(async () => {
    if (bufferRef.current.length === 0 || !taskIdRef.current) return;

    const updates = [...bufferRef.current];
    bufferRef.current = [];

    try {
      await driverTaskApiService.submitLocation(taskIdRef.current, updates);
    } catch {
      // Store in offline queue
      try {
        const key = `${OFFLINE_QUEUE_PREFIX}${taskIdRef.current}`;
        const existing = await AsyncStorage.getItem(key);
        const queue: LocationPoint[] = existing ? JSON.parse(existing) : [];
        queue.push(...updates);
        await AsyncStorage.setItem(key, JSON.stringify(queue));
      } catch {
        // Silently fail - don't lose location data
      }
    }
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    if (!taskIdRef.current) return;

    const key = `${OFFLINE_QUEUE_PREFIX}${taskIdRef.current}`;
    try {
      const existing = await AsyncStorage.getItem(key);
      if (!existing) return;

      const queue: LocationPoint[] = JSON.parse(existing);
      if (queue.length === 0) return;

      for (let i = 0; i < queue.length; i += 50) {
        const batch = queue.slice(i, i + 50);
        await driverTaskApiService.submitLocation(taskIdRef.current!, batch);
      }

      await AsyncStorage.removeItem(key);
    } catch {
      // Will retry on next connectivity change
    }
  }, []);

  const startTracking = useCallback(async (taskId: string) => {
    if (isTracking) return;

    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      console.warn('Location permission not granted');
      return;
    }

    taskIdRef.current = taskId;
    setIsTracking(true);

    // Start watching position
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 10000,
      },
      (location) => {
        const point: LocationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy_meters: location.coords.accuracy ?? undefined,
          speed_kmh: location.coords.speed
            ? location.coords.speed * 3.6
            : undefined,
          recorded_at: new Date(location.timestamp).toISOString(),
        };

        setLastLocation(point);
        bufferRef.current.push(point);

        if (bufferRef.current.length >= MAX_BUFFER_SIZE) {
          flushBuffer();
        }
      }
    );

    // Set up periodic flush
    intervalRef.current = setInterval(flushBuffer, BATCH_INTERVAL_MS);

    // Listen for connectivity changes to flush offline queue
    netInfoUnsubRef.current = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushOfflineQueue();
      }
    });
  }, [isTracking, flushBuffer, flushOfflineQueue]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (netInfoUnsubRef.current) {
      netInfoUnsubRef.current();
      netInfoUnsubRef.current = null;
    }

    // Flush remaining buffer
    flushBuffer();

    taskIdRef.current = null;
    setIsTracking(false);
  }, [flushBuffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (netInfoUnsubRef.current) {
        netInfoUnsubRef.current();
      }
    };
  }, []);

  return {
    isTracking,
    lastLocation,
    startTracking,
    stopTracking,
  };
};

export default useLocationTracking;
