// Enhanced offline storage system for TekUp PWA
export interface StoredData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  expiry?: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorageService {
  private dbName = 'tekup-pwa-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Data store for cached content
        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('type', 'type', { unique: false });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync queue for offline actions
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User preferences and settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  /**
   * Store data with optional expiry
   * @param id
   * @param type
   * @param data
   * @param expiryMinutes
   */
  async storeData(id: string, type: string, data: any, expiryMinutes?: number): Promise<void> {
    if (!this.db) await this.init();

    const storageData: StoredData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : undefined,
      synced: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(storageData);

      request.onsuccess = () => {
        console.log(`Data stored: ${type}/${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve data by ID
   * @param id
   */
  async getData(id: string): Promise<StoredData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredData;
        
        // Check if data has expired
        if (result && result.expiry && Date.now() > result.expiry) {
          this.deleteData(id); // Clean up expired data
          resolve(null);
          return;
        }

        resolve(result || null);
      };

      request.onerror = () => {
        console.error('Failed to retrieve data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all data of a specific type
   * @param type
   */
  async getDataByType(type: string): Promise<StoredData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        const results = request.result as StoredData[];
        
        // Filter out expired data
        const validResults = results.filter(item => {
          if (item.expiry && Date.now() > item.expiry) {
            this.deleteData(item.id); // Clean up expired data
            return false;
          }
          return true;
        });

        resolve(validResults);
      };

      request.onerror = () => {
        console.error('Failed to retrieve data by type:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete data by ID
   * @param id
   */
  async deleteData(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Data deleted: ${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add item to sync queue for when online
   * @param method
   * @param url
   * @param data
   */
  async addToSyncQueue(method: 'POST' | 'PUT' | 'DELETE', url: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    const queueItem: SyncQueueItem = {
      id: `${method}-${url}-${Date.now()}`,
      method,
      url,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(queueItem);

      request.onsuccess = () => {
        console.log('Added to sync queue:', queueItem.id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to add to sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    if (!navigator.onLine) {
      console.log('Offline - skipping sync queue processing');
      return;
    }

    const queueItems = await this.getAllSyncQueueItems();
    console.log(`Processing ${queueItems.length} items in sync queue`);

    for (const item of queueItems) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: item.data ? JSON.stringify(item.data) : undefined,
        });

        if (response.ok) {
          await this.removeSyncQueueItem(item.id);
          console.log(`Synced: ${item.id}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Failed to sync ${item.id}:`, error);
        
        // Increment retry count
        item.retries++;
        
        // Remove if too many retries, otherwise update
        if (item.retries >= 3) {
          console.warn(`Removing ${item.id} after 3 failed retries`);
          await this.removeSyncQueueItem(item.id);
        } else {
          await this.updateSyncQueueItem(item);
        }
      }
    }
  }

  /**
   * Get all sync queue items
   */
  private async getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from sync queue
   * @param id
   */
  private async removeSyncQueueItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update sync queue item (for retry count)
   * @param item
   */
  private async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store user settings
   * @param key
   * @param value
   */
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => {
        console.log(`Setting stored: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get user setting
   * @param key
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        console.error('Failed to retrieve setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    dataItems: number;
    syncQueueItems: number;
    settings: number;
    estimatedSize: string;
  }> {
    if (!this.db) await this.init();

    const [dataItems, syncQueueItems, settings] = await Promise.all([
      this.countItems('data'),
      this.countItems('syncQueue'),
      this.countItems('settings')
    ]);

    // Estimate storage usage (rough calculation)
    let estimatedSize = 'Unknown';
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024) * 100) / 100;
        estimatedSize = `${usedMB} MB`;
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }

    return {
      dataItems,
      syncQueueItems,
      settings,
      estimatedSize
    };
  }

  /**
   * Count items in a store
   * @param storeName
   */
  private async countItems(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all stored data (for debugging/reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    const storeNames = ['data', 'syncQueue', 'settings'];
    
    await Promise.all(storeNames.map(storeName => 
      new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`Cleared ${storeName} store`);
          resolve();
        };

        request.onerror = () => {
          console.error(`Failed to clear ${storeName}:`, request.error);
          reject(request.error);
        };
      })
    ));

    console.log('All offline data cleared');
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();

// Auto-initialize when online
if (typeof window !== 'undefined') {
  // Process sync queue when going online
  window.addEventListener('online', () => {
    console.log('Connection restored - processing sync queue');
    offlineStorage.processSyncQueue();
  });

  // Initialize on load
  offlineStorage.init().catch(console.error);
}