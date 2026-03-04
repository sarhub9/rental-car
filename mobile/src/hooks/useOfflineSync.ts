import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import driverTaskApiService from '../services/driver-task-api.service';

interface QueuedEvidence {
  taskId: string;
  formData: any; // Serialized form data
  type: 'evidence' | 'signature' | 'damage';
  createdAt: string;
}

interface UseOfflineSyncResult {
  pendingCount: number;
  isSyncing: boolean;
  queueEvidence: (taskId: string, formData: any, type: 'evidence' | 'signature' | 'damage') => Promise<void>;
  syncNow: () => Promise<void>;
}

const QUEUE_KEY = 'offline_evidence_queue';

/**
 * useOfflineSync hook
 * AsyncStorage-based queue for photos captured offline.
 * Auto-syncs on connectivity restore via NetInfo listener.
 */
export const useOfflineSync = (): UseOfflineSyncResult => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const loadQueueCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: QueuedEvidence[] = stored ? JSON.parse(stored) : [];
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const queueEvidence = useCallback(async (
    taskId: string,
    formData: any,
    type: 'evidence' | 'signature' | 'damage'
  ) => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: QueuedEvidence[] = stored ? JSON.parse(stored) : [];

      queue.push({
        taskId,
        formData,
        type,
        createdAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setPendingCount(queue.length);
    } catch (error) {
      console.warn('Failed to queue evidence:', error);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: QueuedEvidence[] = stored ? JSON.parse(stored) : [];

      if (queue.length === 0) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      const remaining: QueuedEvidence[] = [];

      for (const item of queue) {
        try {
          switch (item.type) {
            case 'evidence':
              await driverTaskApiService.uploadEvidence(item.taskId, item.formData);
              break;
            case 'signature':
              await driverTaskApiService.uploadSignature(item.taskId, item.formData);
              break;
            case 'damage':
              await driverTaskApiService.addDamage(item.taskId, item.formData);
              break;
          }
        } catch {
          remaining.push(item);
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      setPendingCount(remaining.length);
    } catch (error) {
      console.warn('Offline sync error:', error);
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, []);

  // Load queue count on mount
  useEffect(() => {
    loadQueueCount();
  }, [loadQueueCount]);

  // Listen for connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && pendingCount > 0) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, [pendingCount, syncNow]);

  return {
    pendingCount,
    isSyncing,
    queueEvidence,
    syncNow,
  };
};

export default useOfflineSync;
