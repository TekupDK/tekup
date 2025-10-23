/**
 * Tekup Database - Type Exports
 */

export * from '@prisma/client';

// Additional custom types
export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: string;
  error?: string;
}

export interface MigrationStatus {
  pending: number;
  applied: number;
  failed: number;
}
