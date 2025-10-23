/**
 * RenOS Calendar Intelligence MCP - TypeScript Types
 * Core type definitions for booking validation, customer intelligence, and integrations
 */

import { z } from 'zod';

// ==================== BOOKING TYPES ====================

export interface BookingInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  estimatedHours: number;
  
  serviceType: 'Fast Rengøring' | 'Flytterengøring' | 'Hovedrengøring' | 'Vinduesrengøring' | 'Other';
  location: string;
  notes?: string;
  
  team?: 'Jonas+Rawan' | 'Freelance' | 'Auto'; // Auto = system decides
}

export interface BookingValidationResult {
  valid: boolean;
  confidence: number; // 0-100
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestion?: string;
  requiresManualReview: boolean;
}

export interface ValidationWarning {
  type: 'date_mismatch' | 'weekend_booking' | 'pattern_violation' | 'overtime_risk' | 'high_workload';
  message: string;
  severity: 'low' | 'medium' | 'high';
  data?: Record<string, unknown>;
}

export interface ValidationError {
  type: 'double_booking' | 'invalid_date' | 'invalid_time' | 'missing_customer' | 'weekend_blocked';
  message: string;
  field?: string;
  data?: Record<string, unknown>;
}

// ==================== CUSTOMER INTELLIGENCE TYPES ====================

export interface CustomerIntelligence {
  id: string;
  customerId: string;
  customerName: string;
  
  // Access & logistics
  accessNotes?: string; // "Nøgle under potteplante"
  parkingInstructions?: string;
  specialInstructions?: string;
  
  // Preferences
  preferences: {
    communicationStyle?: 'formal' | 'casual' | 'detailed' | 'brief';
    confirmationRequired?: boolean; // "Magny: bekræft altid ugedag"
    preferredDays?: number[]; // [1] = only Mondays
    preferredTimes?: string[]; // ['08:30', '09:00']
    avoidWeekends?: boolean;
  };
  
  // Fixed schedule patterns (learned)
  fixedSchedule?: {
    dayOfWeek: number; // 1-7 (Monday-Sunday)
    time: string; // HH:MM
    frequency: 'weekly' | 'biweekly' | 'monthly';
    confidence: number; // 0-100
  };
  
  // History & patterns
  totalBookings: number;
  completedBookings: number;
  canceledBookings: number;
  averageJobDuration: number; // in hours
  lastBookingDate?: string;
  
  // Risk assessment
  riskScore: number; // 0-100 (higher = more risky)
  riskFactors: string[];
  
  // Financial
  totalRevenue: number;
  averageBookingValue: number;
  outstandingInvoices: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Quality
  satisfactionScore?: number; // 1-5 stars
  complaints: number;
  praises: number;
  
  createdAt: string;
  lastUpdated: string;
}

// ==================== OVERTIME TRACKING TYPES ====================

export interface OvertimeLog {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  
  estimatedHours: number;
  actualHours?: number;
  overtimeHours?: number;
  
  startTime: string;
  endTime?: string;
  
  alertSentAt?: string;
  alertMethod?: 'voice' | 'sms' | 'email';
  communicationLog: CommunicationEntry[];
  
  customerNotified: boolean;
  customerResponse?: string;
  
  createdAt: string;
}

export interface CommunicationEntry {
  timestamp: string;
  type: 'call' | 'sms' | 'email' | 'in_person';
  direction: 'outgoing' | 'incoming';
  content: string;
  outcome?: string;
}

// ==================== INVOICE TYPES ====================

export interface InvoiceAutomation {
  bookingId: string;
  customerId: string;
  
  status: 'pending' | 'created' | 'sent' | 'paid' | 'failed';
  billyInvoiceId?: string;
  
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  
  createdAt?: string;
  sentAt?: string;
  paidAt?: string;
  
  errors?: string[];
}

export interface InvoiceLineItem {
  productId: string; // Billy product ID (REN-001 etc)
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ==================== VALIDATION LOG TYPES ====================

export interface BookingValidationLog {
  id: string;
  bookingId?: string;
  
  validationType: 'date' | 'conflict' | 'pattern' | 'team' | 'full';
  passed: boolean;
  confidence: number;
  
  input: Partial<BookingInput>;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  
  action: 'approved' | 'rejected' | 'manual_review';
  reviewedBy?: string;
  
  createdAt: string;
}

// ==================== PATTERN LEARNING TYPES ====================

export interface LearnedPattern {
  id: string;
  patternType: 'customer_schedule' | 'job_duration' | 'team_preference' | 'communication_style';
  entityId: string; // customer ID, job type, etc
  
  patternData: Record<string, unknown>;
  confidence: number; // 0-100
  
  occurrences: number; // How many times seen
  lastObserved: string;
  lastValidated?: string;
  
  createdAt: string;
}

// ==================== UNDO SYSTEM TYPES ====================

export interface UndoAction {
  id: string;
  type: 'booking_created' | 'invoice_created' | 'customer_updated' | 'validation_override';
  
  entityId: string;
  entityType: 'booking' | 'invoice' | 'customer' | 'validation';
  
  before: unknown;
  after: unknown;
  
  performedBy: string;
  performedAt: string;
  expiresAt: string; // 5 minutes from performedAt
  
  undoneAt?: string;
  undoneBy?: string;
}

// ==================== GOOGLE CALENDAR TYPES ====================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  
  htmlLink?: string;
  created: string;
  updated: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: CalendarEvent[];
  availableSlots?: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

// ==================== TWILIO VOICE TYPES ====================

export interface VoiceAlert {
  id: string;
  type: 'overtime' | 'double_booking' | 'missing_invoice' | 'critical_error';
  priority: 'urgent' | 'high' | 'medium';
  
  recipient: string; // Phone number
  message: string;
  
  callSid?: string; // Twilio Call SID
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer';
  
  triggeredBy: string; // What triggered the alert
  relatedEntityId?: string; // booking ID, invoice ID, etc
  
  createdAt: string;
  completedAt?: string;
}

// ==================== BILLY MCP INTEGRATION TYPES ====================

export interface BillyInvoiceRequest {
  customerId: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    description: string;
  }>;
  entryDate: string;
  paymentTermsDays: number;
}

export interface BillyInvoiceResponse {
  id: string;
  invoiceNo: string;
  state: 'draft' | 'approved' | 'sent' | 'paid';
  total: number;
  currency: string;
  createdTime: string;
}

// ==================== MCP TOOL SCHEMAS ====================

// Tool 1: validate_booking_date
export const ValidateBookingDateSchema = z.object({
  date: z.string().describe('ISO date string (YYYY-MM-DD)'),
  expectedDayName: z.string().optional().describe('Expected day name for validation (e.g., "mandag")'),
  customerId: z.string().optional().describe('Customer ID to check against fixed patterns'),
});

// Tool 2: check_booking_conflicts
export const CheckBookingConflictsSchema = z.object({
  startTime: z.string().describe('ISO datetime string'),
  endTime: z.string().describe('ISO datetime string'),
  excludeBookingId: z.string().optional().describe('Booking ID to exclude from conflict check'),
});

// Tool 3: auto_create_invoice
export const AutoCreateInvoiceSchema = z.object({
  bookingId: z.string().describe('Booking ID to create invoice for'),
  sendImmediately: z.boolean().default(false).describe('Send invoice immediately after creation'),
});

// Tool 4: track_overtime_risk
export const TrackOvertimeRiskSchema = z.object({
  bookingId: z.string().describe('Booking ID to track'),
  currentDuration: z.number().describe('Current job duration in minutes'),
  estimatedDuration: z.number().describe('Originally estimated duration in minutes'),
});

// Tool 5: get_customer_memory
export const GetCustomerMemorySchema = z.object({
  customerId: z.string().optional().describe('Customer ID'),
  customerName: z.string().optional().describe('Customer name for fuzzy search'),
  includeHistory: z.boolean().default(true).describe('Include booking history'),
});

// ==================== HTTP API TYPES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    googleCalendar: boolean;
    billyMcp: boolean;
    twilio: boolean;
  };
  timestamp: string;
}

