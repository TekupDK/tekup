/**
 * 💾 Offline Storage Service
 *
 * SQLite-based offline storage with automatic sync
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

// Open database
const db = SQLite.openDatabase('rendetalje.db');

// Storage keys
const SYNC_QUEUE_KEY = '@sync_queue';
const LAST_SYNC_KEY = '@last_sync';

export interface SyncItem {
  id: string;
  type: 'job_update' | 'time_entry' | 'photo_upload' | 'location_track';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorageService {
  private syncInProgress = false;
  private maxRetries = 3;

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Jobs table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS jobs (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              customer_id TEXT,
              customer_name TEXT,
              customer_address TEXT,
              customer_avatar TEXT,
              status TEXT NOT NULL,
              scheduled_start INTEGER NOT NULL,
              scheduled_end INTEGER NOT NULL,
              priority TEXT,
              estimated_duration INTEGER,
              distance REAL,
              synced INTEGER DEFAULT 0,
              updated_at INTEGER NOT NULL
            );
          `);

          // Time entries table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS time_entries (
              id TEXT PRIMARY KEY,
              job_id TEXT NOT NULL,
              start_time INTEGER NOT NULL,
              end_time INTEGER,
              duration INTEGER,
              notes TEXT,
              synced INTEGER DEFAULT 0,
              created_at INTEGER NOT NULL
            );
          `);

          // Photos table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS photos (
              id TEXT PRIMARY KEY,
              job_id TEXT NOT NULL,
              uri TEXT NOT NULL,
              type TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              synced INTEGER DEFAULT 0
            );
          `);

          // Location tracks table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS location_tracks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              latitude REAL NOT NULL,
              longitude REAL NOT NULL,
              accuracy REAL,
              timestamp INTEGER NOT NULL,
              synced INTEGER DEFAULT 0
            );
          `);

          // Sync queue table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              data TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              retries INTEGER DEFAULT 0
            );
          `);
        },
        reject,
        resolve
      );
    });
  }

  /**
   * Save job to local storage
   */
  async saveJob(job: any): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO jobs
            (id, title, description, customer_id, customer_name, customer_address,
             customer_avatar, status, scheduled_start, scheduled_end, priority,
             estimated_duration, distance, synced, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              job.id,
              job.title,
              job.description || null,
              job.customer.id,
              job.customer.name,
              job.customer.address,
              job.customer.avatar || null,
              job.status,
              new Date(job.scheduledStart).getTime(),
              new Date(job.scheduledEnd).getTime(),
              job.priority || null,
              job.estimatedDuration || null,
              job.distance || null,
              1, // synced
              Date.now(),
            ]
          );
        },
        reject,
        resolve
      );
    });
  }

  /**
   * Get all jobs from local storage
   */
  async getJobs(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM jobs ORDER BY scheduled_start ASC',
          [],
          (_, { rows }) => {
            const jobs = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              jobs.push({
                id: row.id,
                title: row.title,
                description: row.description,
                customer: {
                  id: row.customer_id,
                  name: row.customer_name,
                  address: row.customer_address,
                  avatar: row.customer_avatar,
                },
                status: row.status,
                scheduledStart: new Date(row.scheduled_start),
                scheduledEnd: new Date(row.scheduled_end),
                priority: row.priority,
                estimatedDuration: row.estimated_duration,
                distance: row.distance,
              });
            }
            resolve(jobs);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: Omit<SyncItem, 'retries'>): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO sync_queue (id, type, data, timestamp, retries)
             VALUES (?, ?, ?, ?, 0)`,
            [item.id, item.type, JSON.stringify(item.data), item.timestamp]
          );
        },
        reject,
        resolve
      );
    });
  }

  /**
   * Get all items from sync queue
   */
  async getSyncQueue(): Promise<SyncItem[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM sync_queue WHERE retries < ? ORDER BY timestamp ASC',
          [this.maxRetries],
          (_, { rows }) => {
            const items: SyncItem[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              items.push({
                id: row.id,
                type: row.type,
                data: JSON.parse(row.data),
                timestamp: row.timestamp,
                retries: row.retries,
              });
            }
            resolve(items);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
        },
        reject,
        resolve
      );
    });
  }

  /**
   * Increment retry count for sync item
   */
  async incrementRetry(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'UPDATE sync_queue SET retries = retries + 1 WHERE id = ?',
            [id]
          );
        },
        reject,
        resolve
      );
    });
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.getSyncQueue();

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await this.incrementRetry(item.id);
          failedCount++;
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } finally {
      this.syncInProgress = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'job_update':
        await apiClient.patch(`/jobs/${item.data.id}/status`, {
          status: item.data.status,
        });
        break;

      case 'time_entry':
        await apiClient.post('/time-tracking/entries', item.data);
        break;

      case 'photo_upload':
        await apiClient.post(`/jobs/${item.data.jobId}/photos`, item.data);
        break;

      case 'location_track':
        await apiClient.post('/location/track', item.data);
        break;

      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * Clear all local data
   */
  async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql('DELETE FROM jobs');
          tx.executeSql('DELETE FROM time_entries');
          tx.executeSql('DELETE FROM photos');
          tx.executeSql('DELETE FROM location_tracks');
          tx.executeSql('DELETE FROM sync_queue');
        },
        reject,
        async () => {
          await AsyncStorage.removeItem(LAST_SYNC_KEY);
          resolve();
        }
      );
    });
  }
}

export const offlineStorage = new OfflineStorageService();
