import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = 'offline_photo_queue';
const MAX_RETRY_ATTEMPTS = 3;

interface OfflinePhoto {
  id: string;
  uri: string;
  agreementId: string;
  evidenceType: 'CHECKOUT' | 'RETURN';
  photoAngle: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number;
  capturedTimestamp: string;
  retryCount: number;
  queuedAt: string;
}

interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

/**
 * Offline Photo Sync Service
 * Stores photos locally when offline and syncs when connectivity is restored
 */
class OfflineSyncService {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;

  /**
   * Start listening for network changes to trigger sync
   */
  startNetworkListener(): void {
    this.unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingPhotos();
      }
    });
  }

  /**
   * Stop network listener
   */
  stopNetworkListener(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  }

  /**
   * Queue a photo for offline storage
   */
  async queuePhoto(photo: Omit<OfflinePhoto, 'retryCount' | 'queuedAt'>): Promise<void> {
    const queue = await this.getQueue();

    const offlinePhoto: OfflinePhoto = {
      ...photo,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
    };

    queue.push(offlinePhoto);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get queued photos
   */
  async getQueue(): Promise<OfflinePhoto[]> {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Get pending count
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Sync all pending photos when online
   */
  async syncPendingPhotos(): Promise<SyncResult> {
    if (this.isSyncing) return { synced: 0, failed: 0, remaining: 0 };

    const online = await this.isOnline();
    if (!online) return { synced: 0, failed: 0, remaining: 0 };

    this.isSyncing = true;
    const queue = await this.getQueue();
    let synced = 0;
    let failed = 0;
    const remaining: OfflinePhoto[] = [];

    for (const photo of queue) {
      try {
        await this.uploadPhoto(photo);
        synced++;
      } catch {
        photo.retryCount++;
        if (photo.retryCount < MAX_RETRY_ATTEMPTS) {
          remaining.push(photo);
        } else {
          failed++;
        }
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    this.isSyncing = false;

    return { synced, failed, remaining: remaining.length };
  }

  /**
   * Upload a single photo to the server
   */
  private async uploadPhoto(photo: OfflinePhoto): Promise<void> {
    const formData = new FormData();
    formData.append('photos', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: `${photo.photoAngle.toLowerCase()}.jpg`,
    } as any);
    formData.append(`photos_latitude`, String(photo.gpsLatitude));
    formData.append(`photos_longitude`, String(photo.gpsLongitude));
    formData.append(`photos_accuracy`, String(photo.gpsAccuracy));
    formData.append(`photos_timestamp`, photo.capturedTimestamp);

    const token = await AsyncStorage.getItem('auth_token');
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.18.15:3000/v1';

    const response = await fetch(
      `${apiUrl}/agreements/${photo.agreementId}/${photo.evidenceType.toLowerCase()}/photo`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

export default new OfflineSyncService();
