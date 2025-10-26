/**
 * Database Configuration for RestaurantIQ
 * Knex.js setup with PostgreSQL and connection pooling
 */

import { knex } from 'knex';
import type { Knex } from 'knex';
import { config } from './env';
import { dbLogger, loggers } from './logger';

// Database configuration
const databaseConfig: Knex.Config = {
  client: 'postgresql',
  connection: config.database.url,
  
  // Connection pool settings
  pool: {
    min: config.database.pool.min,
    max: config.database.pool.max,
    acquireTimeoutMillis: config.database.pool.acquireTimeoutMillis,
    idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false,
    
    // Pool event handlers
    afterCreate: (conn: any, done: (err: Error | null, conn?: any) => void) => {
      // Set Danish timezone for this connection
      conn.query("SET timezone TO 'Europe/Copenhagen'", (err: Error) => {
        if (err) {
          loggers.dbError('Failed to set timezone', undefined, err);
        } else {
          loggers.debug('Database connection established with Danish timezone');
        }
        done(err, conn);
      });
    },
  },

  // Migration settings
  migrations: {
    directory: '../migrations',
    extension: 'ts',
    tableName: 'knex_migrations',
    disableTransactions: false,
    loadExtensions: ['.ts'],
  },

  // Seed settings
  seeds: {
    directory: '../seeders',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },

  // PostgreSQL specific settings
  searchPath: ['public', 'inventory', 'scheduling', 'analytics', 'integrations'],
  
  // Enable query logging in development
  debug: config.features.isDevelopment && config.database.logging.queries,

  // Custom query logging
  log: {
    warn: (message: string) => dbLogger.warn(message),
    error: (message: string) => dbLogger.error(message),
    deprecate: (message: string) => dbLogger.warn(`DEPRECATED: ${message}`),
    debug: (message: string) => {
      if (config.database.logging.queries) {
        dbLogger.debug(message);
      }
    },
  },

  // Compilation settings for TypeScript
  asyncStackTraces: config.features.isDevelopment,
  
  // PostgreSQL-specific optimizations
  acquireConnectionTimeout: 60000,
  useNullAsDefault: false,
};

// Test database configuration
const testDatabaseConfig: Knex.Config = {
  ...databaseConfig,
  connection: config.database.testUrl || config.database.url,
  pool: {
    min: 0,
    max: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  debug: false,
};

// Create database connection
const createDatabase = (isTest: boolean = false): Knex => {
  const dbConfig = isTest ? testDatabaseConfig : databaseConfig;
  const db = knex(dbConfig);

  // Add query timing middleware
  if (config.database.logging.queries || config.database.logging.slowQueries) {
    db.on('query', (query) => {
      const startTime = Date.now();
      
      query.on('end', () => {
        const duration = Date.now() - startTime;
        
        // Log slow queries
        if (config.database.logging.slowQueries && duration > config.database.logging.slowQueryThreshold) {
          loggers.warn(`Slow query detected (${duration}ms)`, {
            sql: query.sql,
            bindings: query.bindings,
            duration,
          });
        }
        
        // Log all queries in development
        if (config.features.isDevelopment && config.database.logging.queries) {
          loggers.dbQuery(query.sql, duration, {
            bindings: query.bindings,
          });
        }
      });
      
      query.on('error', (error) => {
        const duration = Date.now() - startTime;
        loggers.dbError('Database query error', query.sql, error, {
          bindings: query.bindings,
          duration,
        });
      });
    });
  }

  return db;
};

// Main database instance
export const db = createDatabase();

// Test database instance (if needed)
export const testDb = config.features.isTest ? createDatabase(true) : null;

// Health check function
export const healthCheck = async (): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> => {
  const startTime = Date.now();
  
  try {
    await db.raw('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    loggers.debug('Database health check passed', { responseTime });
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    loggers.error('Database health check failed', { error: errorMessage, responseTime });
    
    return {
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
    };
  }
};

// Connection management
export const closeDatabase = async (): Promise<void> => {
  try {
    await db.destroy();
    loggers.info('Database connection closed');
  } catch (error) {
    loggers.error('Error closing database connection', { error });
  }
};

// Transaction helper with logging
export const withTransaction = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>,
  options?: { isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable' }
): Promise<T> => {
  const startTime = Date.now();
  
  return db.transaction(async (trx) => {
    try {
      // Set isolation level if specified
      if (options?.isolationLevel) {
        await trx.raw(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel.toUpperCase()}`);
      }
      
      const result = await callback(trx);
      const duration = Date.now() - startTime;
      
      loggers.debug('Transaction completed successfully', { duration });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggers.error('Transaction failed and rolled back', { duration, error });
      throw error;
    }
  });
};

// Query builder helpers for multi-tenancy
export const tenantQuery = (tableName: string, tenantId: string) => {
  return db(tableName).where('tenant_id', tenantId);
};

export const locationQuery = (tableName: string, tenantId: string, locationId: string) => {
  return db(tableName)
    .where('tenant_id', tenantId)
    .where('location_id', locationId);
};

// Common query patterns
export const queries = {
  // Pagination helper
  paginate: async <T>(
    query: Knex.QueryBuilder,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> => {
    const offset = (page - 1) * limit;
    
    // Clone query for count
    const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
    
    // Execute both queries
    const [data, countResult] = await Promise.all([
      query.offset(offset).limit(limit),
      countQuery,
    ]);
    
    const totalCount = parseInt(countResult?.total as string) || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  // Bulk insert with conflict resolution
  upsert: async (
    tableName: string,
    data: Record<string, any>[],
    conflictColumns: string[],
    updateColumns?: string[]
  ): Promise<any[]> => {
    if (!data.length) return [];
    
    let query = db(tableName).insert(data);
    
    if (conflictColumns.length > 0) {
      const conflictTarget = conflictColumns.join(', ');
      
      if (updateColumns && updateColumns.length > 0) {
        const updateSet = updateColumns
          .map(col => `${col} = EXCLUDED.${col}`)
          .join(', ');
        
        query = query.onConflict(conflictTarget).merge(updateColumns);
      } else {
        query = query.onConflict(conflictTarget).ignore();
      }
    }
    
    return query.returning('*');
  },

  // Soft delete helper
  softDelete: async (tableName: string, id: string, userId?: string): Promise<void> => {
    await db(tableName)
      .where('id', id)
      .update({
        deleted_at: db.fn.now(),
        deleted_by: userId,
        updated_at: db.fn.now(),
      });
  },

  // Restore soft deleted item
  restore: async (tableName: string, id: string, userId?: string): Promise<void> => {
    await db(tableName)
      .where('id', id)
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: db.fn.now(),
        updated_by: userId,
      });
  },
};

// Database schema validation
export const validateSchema = async (): Promise<boolean> => {
  try {
    // Check if required tables exist
    const requiredTables = [
      'tenants',
      'locations', 
      'users',
      'inventory_items',
      'menu_items',
      'employees',
    ];
    
    for (const table of requiredTables) {
      const exists = await db.schema.hasTable(table);
      if (!exists) {
        loggers.error(`Required table '${table}' does not exist`);
        return false;
      }
    }
    
    loggers.info('Database schema validation passed');
    return true;
  } catch (error) {
    loggers.error('Database schema validation failed', { error });
    return false;
  }
};

// Export knex configuration for migrations
export const knexConfig = databaseConfig;

export default db;
