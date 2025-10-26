/**
 * Core types for RestaurantIQ platform
 * These types are shared between frontend and backend
 */

// Base types
export type UUID = string;
export type DateTimeString = string; // ISO 8601 format
export type DateString = string; // YYYY-MM-DD format
export type CurrencyAmount = number; // Always in øre (DKK minor unit)

// Danish specific types
export type DanishLocale = 'da-DK';
export type DanishCurrency = 'DKK';
export type DanishTimeZone = 'Europe/Copenhagen';
export type CVRNumber = string; // Danish CVR (business registration) number

// Multi-tenancy types
export interface Tenant {
  id: UUID;
  name: string;
  domain: string;
  cvrNumber?: CVRNumber;
  settings: TenantSettings;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface TenantSettings {
  locale: DanishLocale;
  currency: DanishCurrency;
  timezone: DanishTimeZone;
  businessHours: BusinessHours;
  features: FeatureFlags;
  branding?: BrandingSettings;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface BrandingSettings {
  primaryColor: string;
  logoUrl?: string;
  customDomain?: string;
}

// Feature flags for tenant-specific functionality
export interface FeatureFlags {
  aiForecasting: boolean;
  advancedScheduling: boolean;
  multiLocation: boolean;
  posIntegration: boolean;
  accountingIntegration: boolean;
  mobilePayIntegration: boolean;
  analyticsReporting: boolean;
  customBranding: boolean;
}

// Location/Restaurant types
export interface Location {
  id: UUID;
  tenantId: UUID;
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  settings: LocationSettings;
  posSystem?: POSSystemConfig;
  isActive: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  region?: string;
  country: 'DK'; // Denmark only for now
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface LocationSettings {
  maxCapacity?: number;
  tableCount?: number;
  kitchenCapacity?: number;
  operatingHours: BusinessHours;
  preferences: LocationPreferences;
}

export interface LocationPreferences {
  defaultTaxRate: number; // Danish MOMS percentage
  autoOrderEnabled: boolean;
  wasteTrackingEnabled: boolean;
  staffOptimizationEnabled: boolean;
  realTimeUpdatesEnabled: boolean;
}

// POS Integration types
export type POSSystemType = 
  | 'lightspeed'
  | 'revel'
  | 'toast'
  | 'square'
  | 'ordrestyring'
  | 'dinero_kasse'
  | 'custom';

export interface POSSystemConfig {
  type: POSSystemType;
  apiKey: string;
  baseUrl?: string;
  webhookSecret?: string;
  settings: Record<string, any>;
  lastSyncAt?: DateTimeString;
  syncEnabled: boolean;
}

// User and authentication types
export type UserRole = 
  | 'super_admin'     // Platform admin
  | 'tenant_admin'    // Restaurant chain admin
  | 'location_manager' // Individual restaurant manager
  | 'shift_manager'   // Shift supervisor
  | 'employee'        // Regular staff member
  | 'readonly';       // View-only access

export interface User {
  id: UUID;
  tenantId: UUID;
  locationIds: UUID[]; // Locations this user has access to
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  profile: UserProfile;
  preferences: UserPreferences;
  lastLoginAt?: DateTimeString;
  isActive: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface UserProfile {
  phone?: string;
  avatar?: string;
  language: DanishLocale;
  timezone: DanishTimeZone;
  employeeNumber?: string;
  department?: string;
  position?: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  theme?: 'light' | 'dark' | 'auto';
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inventory: boolean;
  scheduling: boolean;
  sales: boolean;
  alerts: boolean;
}

export interface DashboardPreferences {
  widgets: string[];
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
}

// Permission system for RBAC
export type Permission = 
  // Inventory permissions
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'inventory:forecast'
  
  // Menu permissions
  | 'menu:read'
  | 'menu:write'
  | 'menu:delete'
  | 'menu:analytics'
  
  // Staff permissions
  | 'staff:read'
  | 'staff:write'
  | 'staff:delete'
  | 'staff:schedule'
  | 'staff:payroll'
  
  // Sales permissions
  | 'sales:read'
  | 'sales:analytics'
  | 'sales:export'
  
  // Reports permissions
  | 'reports:read'
  | 'reports:create'
  | 'reports:export'
  
  // Settings permissions
  | 'settings:read'
  | 'settings:write'
  | 'settings:integrations'
  
  // Admin permissions
  | 'admin:users'
  | 'admin:locations'
  | 'admin:billing'
  | 'admin:system';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: DateTimeString;
}

export interface ResponseMetadata {
  pagination?: PaginationMeta;
  filters?: Record<string, any>;
  sort?: SortMeta;
  totalCount?: number;
  executionTime?: number; // milliseconds
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortMeta {
  field: string;
  order: 'asc' | 'desc';
}

// Common query types
export interface BaseQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface DateRangeQuery {
  startDate?: DateString;
  endDate?: DateString;
}

// Status and state enums
export type Status = 'active' | 'inactive' | 'pending' | 'archived';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'never_synced';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// File upload types
export interface FileUpload {
  id: UUID;
  tenantId: UUID;
  locationId?: UUID;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  uploadedBy: UUID;
  uploadedAt: DateTimeString;
  metadata?: Record<string, any>;
}

export type FileCategory = 
  | 'menu_image'
  | 'receipt'
  | 'invoice'
  | 'employee_photo'
  | 'logo'
  | 'document'
  | 'report';

// Webhook types for integrations
export interface WebhookEvent {
  id: UUID;
  tenantId: UUID;
  locationId?: UUID;
  eventType: string;
  source: string; // POS system, payment gateway, etc.
  payload: Record<string, any>;
  processedAt?: DateTimeString;
  status: ProcessingStatus;
  createdAt: DateTimeString;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: DateTimeString;
  services: ServiceHealth[];
  uptime: number; // seconds
  version: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number; // milliseconds
  error?: string;
}

// Constants
export const SUPPORTED_CURRENCIES = ['DKK'] as const;
export const SUPPORTED_LOCALES = ['da-DK'] as const;
export const SUPPORTED_TIMEZONES = ['Europe/Copenhagen'] as const;

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;

export const DANISH_TAX_RATES = {
  STANDARD: 25, // Standard MOMS rate
  REDUCED: 0,   // No reduced rate for restaurant services
  ZERO: 0       // Zero rate for exports, etc.
} as const;
