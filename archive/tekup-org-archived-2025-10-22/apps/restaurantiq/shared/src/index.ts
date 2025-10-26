/**
 * RestaurantIQ Shared Package
 * 
 * This package contains shared types, validation schemas, and utilities
 * for the RestaurantIQ platform, designed for Danish restaurant operations.
 * 
 * @version 1.0.0
 * @author Tekup RestaurantIQ Team
 */

// Export all core types
export * from './types/core';
export * from './types/restaurant';

// Export validation schemas
export * from './schemas/validation';

// Export utilities
export * from './utils';

// Re-export commonly used types for convenience
export type {
  UUID,
  DateTimeString,
  DateString,
  CurrencyAmount,
  DanishLocale,
  DanishCurrency,
  DanishTimeZone,
  CVRNumber,
  
  // Core entities
  Tenant,
  Location,
  User,
  ApiResponse,
  
} from './types/core';

export type {
  // Restaurant entities
  InventoryItem,
  MenuItem,
  Employee,
  SalesTransaction,
  
  // Restaurant-specific enums
  InventoryCategory,
  MeasurementUnit,
  MenuCategory,
  Position,
  Department,
  PaymentMethod,
  OrderType,
} from './types/restaurant';

export type {
  // Validation request types from schemas
  LoginRequest,
  RegisterRequest,
  CreateTenantRequest,
  CreateLocationRequest,
  CreateInventoryItemRequest,
  CreateMenuItemRequest,
  CreateEmployeeRequest,
  CreateSalesTransactionRequest,
} from './schemas/validation';

// Version information
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@restaurantiq/shared';
export const BUILD_DATE = new Date().toISOString();

// Package metadata
export const PACKAGE_INFO = {
  name: PACKAGE_NAME,
  version: VERSION,
  description: 'Shared types and utilities for RestaurantIQ platform',
  buildDate: BUILD_DATE,
  targetMarket: 'Denmark',
  locale: 'da-DK',
  currency: 'DKK',
  timezone: 'Europe/Copenhagen',
} as const;
