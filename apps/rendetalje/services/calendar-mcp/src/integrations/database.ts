/**
 * RenOS Calendar Intelligence MCP - Prisma Database Integration
 * Replaces Supabase client with centralized Prisma client from @tekup/database
 */

import { PrismaClient } from '@tekup/database';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import {
  CustomerIntelligence,
  BookingValidationLog,
  OvertimeLog,
  LearnedPattern,
  UndoAction,
} from '../types.js';

let prisma: PrismaClient | null = null;

/**
 * Initialize Prisma client
 */
export function initPrisma(): PrismaClient | null {
  if (prisma) return prisma;

  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || config.database?.url
        }
      },
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error']
    });

    logger.info('Prisma client initialized', {
      url: process.env.DATABASE_URL ? 'from env' : 'from config',
    });

    return prisma;
  } catch (error) {
    logger.error('Failed to initialize Prisma client', error);
    return null;
  }
}

/**
 * Get Prisma client instance
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = initPrisma();
  }
  if (!prisma) {
    throw new Error('Prisma client not configured');
  }
  return prisma;
}

// ==================== CUSTOMER INTELLIGENCE ====================

export async function getCustomerIntelligence(
  customerId: string
): Promise<CustomerIntelligence | null> {
  const db = getPrisma();

  try {
    const data = await db.renosCustomerIntelligence.findUnique({
      where: { customerId }
    });

    return data ? {
      id: data.id,
      customerId: data.customerId,
      customerName: data.customerName,
      accessNotes: data.accessNotes || undefined,
      parkingInstructions: data.parkingInstructions || undefined,
      specialInstructions: data.specialInstructions || undefined,
      preferences: data.preferences as any,
      fixedSchedule: data.fixedSchedule as any || undefined,
      totalBookings: data.totalBookings,
      completedBookings: data.completedBookings,
      canceledBookings: data.canceledBookings,
      averageJobDuration: data.averageJobDuration,
      lastBookingDate: data.lastBookingDate?.toISOString(),
      riskScore: data.riskScore,
      riskFactors: data.riskFactors,
      totalRevenue: data.totalRevenue,
      averageBookingValue: data.averageBookingValue,
      outstandingInvoices: data.outstandingInvoices,
      paymentHistory: data.paymentHistory as any,
      satisfactionScore: data.satisfactionScore || undefined,
      complaints: data.complaints,
      praises: data.praises,
      createdAt: data.createdAt.toISOString(),
      lastUpdated: data.lastUpdated.toISOString(),
    } : null;
  } catch (error) {
    logger.error('Failed to get customer intelligence', error, { customerId });
    throw error;
  }
}

export async function upsertCustomerIntelligence(
  intelligence: Partial<CustomerIntelligence>
): Promise<CustomerIntelligence> {
  const db = getPrisma();

  try {
    const updateData: any = {};
    if (intelligence.customerName) updateData.customerName = intelligence.customerName;
    if (intelligence.accessNotes !== undefined) updateData.accessNotes = intelligence.accessNotes;
    if (intelligence.parkingInstructions !== undefined) updateData.parkingInstructions = intelligence.parkingInstructions;
    if (intelligence.specialInstructions !== undefined) updateData.specialInstructions = intelligence.specialInstructions;
    if (intelligence.preferences) updateData.preferences = intelligence.preferences;
    if (intelligence.fixedSchedule !== undefined) updateData.fixedSchedule = intelligence.fixedSchedule;
    if (intelligence.totalBookings !== undefined) updateData.totalBookings = intelligence.totalBookings;
    if (intelligence.completedBookings !== undefined) updateData.completedBookings = intelligence.completedBookings;
    if (intelligence.canceledBookings !== undefined) updateData.canceledBookings = intelligence.canceledBookings;
    if (intelligence.averageJobDuration !== undefined) updateData.averageJobDuration = intelligence.averageJobDuration;
    if (intelligence.lastBookingDate) updateData.lastBookingDate = new Date(intelligence.lastBookingDate);
    if (intelligence.riskScore !== undefined) updateData.riskScore = intelligence.riskScore;
    if (intelligence.riskFactors) updateData.riskFactors = intelligence.riskFactors;
    if (intelligence.totalRevenue !== undefined) updateData.totalRevenue = intelligence.totalRevenue;
    if (intelligence.averageBookingValue !== undefined) updateData.averageBookingValue = intelligence.averageBookingValue;
    if (intelligence.outstandingInvoices !== undefined) updateData.outstandingInvoices = intelligence.outstandingInvoices;
    if (intelligence.paymentHistory) updateData.paymentHistory = intelligence.paymentHistory;
    if (intelligence.satisfactionScore !== undefined) updateData.satisfactionScore = intelligence.satisfactionScore;
    if (intelligence.complaints !== undefined) updateData.complaints = intelligence.complaints;
    if (intelligence.praises !== undefined) updateData.praises = intelligence.praises;

    const data = await db.renosCustomerIntelligence.upsert({
      where: { customerId: intelligence.customerId! },
      update: updateData,
      create: {
        customerId: intelligence.customerId!,
        customerName: intelligence.customerName || 'Unknown',
        ...updateData
      }
    });

    logger.info('Customer intelligence updated', {
      customerId: data.customerId,
      customerName: data.customerName,
    });

    return {
      id: data.id,
      customerId: data.customerId,
      customerName: data.customerName,
      accessNotes: data.accessNotes || undefined,
      parkingInstructions: data.parkingInstructions || undefined,
      specialInstructions: data.specialInstructions || undefined,
      preferences: data.preferences as any,
      fixedSchedule: data.fixedSchedule as any || undefined,
      totalBookings: data.totalBookings,
      completedBookings: data.completedBookings,
      canceledBookings: data.canceledBookings,
      averageJobDuration: data.averageJobDuration,
      lastBookingDate: data.lastBookingDate?.toISOString(),
      riskScore: data.riskScore,
      riskFactors: data.riskFactors,
      totalRevenue: data.totalRevenue,
      averageBookingValue: data.averageBookingValue,
      outstandingInvoices: data.outstandingInvoices,
      paymentHistory: data.paymentHistory as any,
      satisfactionScore: data.satisfactionScore || undefined,
      complaints: data.complaints,
      praises: data.praises,
      createdAt: data.createdAt.toISOString(),
      lastUpdated: data.lastUpdated.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to upsert customer intelligence', error, { customerId: intelligence.customerId });
    throw error;
  }
}

export async function searchCustomersByName(
  name: string
): Promise<CustomerIntelligence[]> {
  const db = getPrisma();

  try {
    const results = await db.renosCustomerIntelligence.findMany({
      where: {
        customerName: {
          contains: name,
          mode: 'insensitive'
        }
      },
      take: 10
    });

    return results.map(data => ({
      id: data.id,
      customerId: data.customerId,
      customerName: data.customerName,
      accessNotes: data.accessNotes || undefined,
      parkingInstructions: data.parkingInstructions || undefined,
      specialInstructions: data.specialInstructions || undefined,
      preferences: data.preferences as any,
      fixedSchedule: data.fixedSchedule as any || undefined,
      totalBookings: data.totalBookings,
      completedBookings: data.completedBookings,
      canceledBookings: data.canceledBookings,
      averageJobDuration: data.averageJobDuration,
      lastBookingDate: data.lastBookingDate?.toISOString(),
      riskScore: data.riskScore,
      riskFactors: data.riskFactors,
      totalRevenue: data.totalRevenue,
      averageBookingValue: data.averageBookingValue,
      outstandingInvoices: data.outstandingInvoices,
      paymentHistory: data.paymentHistory as any,
      satisfactionScore: data.satisfactionScore || undefined,
      complaints: data.complaints,
      praises: data.praises,
      createdAt: data.createdAt.toISOString(),
      lastUpdated: data.lastUpdated.toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to search customers by name', error, { name });
    throw error;
  }
}

// ==================== BOOKING VALIDATION LOGS ====================

export async function logBookingValidation(
  log: Omit<BookingValidationLog, 'id' | 'createdAt'>
): Promise<BookingValidationLog> {
  const db = getPrisma();

  try {
    const data = await db.renosBookingValidation.create({
      data: {
        bookingId: log.bookingId,
        validationType: log.validationType,
        passed: log.passed,
        confidence: log.confidence,
        input: log.input as any,
        warnings: log.warnings as any,
        errors: log.errors as any,
        action: log.action,
        reviewedBy: log.reviewedBy,
      }
    });

    return {
      id: data.id,
      bookingId: data.bookingId || undefined,
      validationType: data.validationType as any,
      passed: data.passed,
      confidence: data.confidence,
      input: data.input as any,
      warnings: data.warnings as any,
      errors: data.errors as any,
      action: data.action as any,
      reviewedBy: data.reviewedBy || undefined,
      createdAt: data.createdAt.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to log booking validation', error, { bookingId: log.bookingId });
    throw error;
  }
}

export async function getValidationHistory(
  bookingId: string
): Promise<BookingValidationLog[]> {
  const db = getPrisma();

  try {
    const results = await db.renosBookingValidation.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });

    return results.map(data => ({
      id: data.id,
      bookingId: data.bookingId || undefined,
      validationType: data.validationType as any,
      passed: data.passed,
      confidence: data.confidence,
      input: data.input as any,
      warnings: data.warnings as any,
      errors: data.errors as any,
      action: data.action as any,
      reviewedBy: data.reviewedBy || undefined,
      createdAt: data.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to get validation history', error, { bookingId });
    throw error;
  }
}

// ==================== OVERTIME LOGS ====================

export async function createOvertimeLog(
  log: Omit<OvertimeLog, 'id' | 'createdAt'>
): Promise<OvertimeLog> {
  const db = getPrisma();

  try {
    const data = await db.renosOvertimeLog.create({
      data: {
        bookingId: log.bookingId,
        customerId: log.customerId,
        customerName: log.customerName,
        estimatedHours: log.estimatedHours,
        actualHours: log.actualHours,
        overtimeHours: log.overtimeHours,
        startTime: log.startTime,
        endTime: log.endTime,
        alertSentAt: log.alertSentAt ? new Date(log.alertSentAt) : undefined,
        alertMethod: log.alertMethod,
        communicationLog: log.communicationLog as any || [],
        customerNotified: log.customerNotified,
        customerResponse: log.customerResponse,
      }
    });

    logger.info('Overtime log created', {
      bookingId: data.bookingId,
      overtimeHours: data.overtimeHours,
    });

    return {
      id: data.id,
      bookingId: data.bookingId,
      customerId: data.customerId,
      customerName: data.customerName,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours || undefined,
      overtimeHours: data.overtimeHours || undefined,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
      alertSentAt: data.alertSentAt?.toISOString(),
      alertMethod: data.alertMethod as any,
      communicationLog: data.communicationLog as any,
      customerNotified: data.customerNotified,
      customerResponse: data.customerResponse || undefined,
      createdAt: data.createdAt.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to create overtime log', error, { bookingId: log.bookingId });
    throw error;
  }
}

export async function updateOvertimeLog(
  id: string,
  updates: Partial<OvertimeLog>
): Promise<OvertimeLog> {
  const db = getPrisma();

  try {
    const updateData: any = {};
    if (updates.actualHours !== undefined) updateData.actualHours = updates.actualHours;
    if (updates.overtimeHours !== undefined) updateData.overtimeHours = updates.overtimeHours;
    if (updates.endTime) updateData.endTime = updates.endTime;
    if (updates.alertSentAt) updateData.alertSentAt = new Date(updates.alertSentAt);
    if (updates.alertMethod) updateData.alertMethod = updates.alertMethod;
    if (updates.communicationLog) updateData.communicationLog = updates.communicationLog;
    if (updates.customerNotified !== undefined) updateData.customerNotified = updates.customerNotified;
    if (updates.customerResponse) updateData.customerResponse = updates.customerResponse;

    const data = await db.renosOvertimeLog.update({
      where: { id },
      data: updateData
    });

    return {
      id: data.id,
      bookingId: data.bookingId,
      customerId: data.customerId,
      customerName: data.customerName,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours || undefined,
      overtimeHours: data.overtimeHours || undefined,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
      alertSentAt: data.alertSentAt?.toISOString(),
      alertMethod: data.alertMethod as any,
      communicationLog: data.communicationLog as any,
      customerNotified: data.customerNotified,
      customerResponse: data.customerResponse || undefined,
      createdAt: data.createdAt.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to update overtime log', error, { id });
    throw error;
  }
}

export async function getOvertimeLog(
  bookingId: string
): Promise<OvertimeLog | null> {
  const db = getPrisma();

  try {
    const data = await db.renosOvertimeLog.findFirst({
      where: { bookingId }
    });

    return data ? {
      id: data.id,
      bookingId: data.bookingId,
      customerId: data.customerId,
      customerName: data.customerName,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours || undefined,
      overtimeHours: data.overtimeHours || undefined,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
      alertSentAt: data.alertSentAt?.toISOString(),
      alertMethod: data.alertMethod as any,
      communicationLog: data.communicationLog as any,
      customerNotified: data.customerNotified,
      customerResponse: data.customerResponse || undefined,
      createdAt: data.createdAt.toISOString(),
    } : null;
  } catch (error) {
    logger.error('Failed to get overtime log', error, { bookingId });
    throw error;
  }
}

// ==================== LEARNED PATTERNS ====================

export async function learnPattern(
  pattern: Omit<LearnedPattern, 'id' | 'createdAt'>
): Promise<LearnedPattern> {
  const db = getPrisma();

  try {
    const data = await db.renosLearnedPattern.create({
      data: {
        patternType: pattern.patternType,
        entityId: pattern.entityId,
        patternData: pattern.patternData as any,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences || 1,
        lastObserved: new Date(pattern.lastObserved),
        lastValidated: pattern.lastValidated ? new Date(pattern.lastValidated) : undefined,
      }
    });

    logger.info('Pattern learned', {
      patternType: data.patternType,
      entityId: data.entityId,
      confidence: data.confidence,
    });

    return {
      id: data.id,
      patternType: data.patternType as any,
      entityId: data.entityId,
      patternData: data.patternData as any,
      confidence: data.confidence,
      occurrences: data.occurrences,
      lastObserved: data.lastObserved.toISOString(),
      lastValidated: data.lastValidated?.toISOString(),
      createdAt: data.createdAt.toISOString(),
    };
  } catch (error) {
    logger.error('Failed to learn pattern', error, {
      patternType: pattern.patternType,
      entityId: pattern.entityId,
    });
    throw error;
  }
}

export async function getPatterns(
  patternType: LearnedPattern['patternType'],
  entityId?: string
): Promise<LearnedPattern[]> {
  const db = getPrisma();

  try {
    const results = await db.renosLearnedPattern.findMany({
      where: {
        patternType,
        ...(entityId && { entityId })
      },
      orderBy: [
        { confidence: 'desc' },
        { lastObserved: 'desc' }
      ]
    });

    return results.map(data => ({
      id: data.id,
      patternType: data.patternType as any,
      entityId: data.entityId,
      patternData: data.patternData as any,
      confidence: data.confidence,
      occurrences: data.occurrences,
      lastObserved: data.lastObserved.toISOString(),
      lastValidated: data.lastValidated?.toISOString(),
      createdAt: data.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to get patterns', error, { patternType, entityId });
    throw error;
  }
}

// ==================== UNDO ACTIONS ====================

export async function saveUndoAction(
  action: UndoAction
): Promise<void> {
  const db = getPrisma();

  try {
    await db.renosUndoAction.create({
      data: {
        id: action.id,
        type: action.type,
        entityType: action.entityType,
        entityId: action.entityId,
        before: action.before as any,
        after: action.after as any,
        performedBy: action.performedBy,
        performedAt: new Date(action.performedAt),
        expiresAt: new Date(action.expiresAt),
        undoneAt: action.undoneAt ? new Date(action.undoneAt) : undefined,
        undoneBy: action.undoneBy,
      }
    });

    logger.info('Undo action saved', { actionId: action.id });
  } catch (error) {
    logger.error('Failed to save undo action', error, { actionId: action.id });
    throw error;
  }
}

export async function getUndoAction(
  actionId: string
): Promise<UndoAction | null> {
  const db = getPrisma();

  try {
    const data = await db.renosUndoAction.findUnique({
      where: { id: actionId }
    });

    return data ? {
      id: data.id,
      type: data.type as any,
      entityType: data.entityType as any,
      entityId: data.entityId,
      before: data.before as any,
      after: data.after as any,
      performedBy: data.performedBy,
      performedAt: data.performedAt.toISOString(),
      expiresAt: data.expiresAt.toISOString(),
      undoneAt: data.undoneAt?.toISOString(),
      undoneBy: data.undoneBy || undefined,
    } : null;
  } catch (error) {
    logger.error('Failed to get undo action', error, { actionId });
    throw error;
  }
}

/**
 * Cleanup expired undo actions (run periodically)
 */
export async function cleanupExpiredUndoActions(): Promise<number> {
  const db = getPrisma();

  try {
    const result = await db.renosUndoAction.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    logger.info('Cleaned up expired undo actions', { count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired undo actions', error);
    throw error;
  }
}

// ==================== HEALTH CHECK ====================

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  database: string;
  timestamp: string;
  error?: string;
}> {
  try {
    const db = getPrisma();
    await db.$queryRaw`SELECT 1`;

    return {
      status: 'healthy',
      database: 'connected (Prisma + Supabase)',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    logger.error('Database health check failed', error);
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Prisma client disconnected');
  }
}

// Export all functions
export default {
  initPrisma,
  getPrisma,
  getCustomerIntelligence,
  upsertCustomerIntelligence,
  searchCustomersByName,
  logBookingValidation,
  getValidationHistory,
  createOvertimeLog,
  updateOvertimeLog,
  getOvertimeLog,
  learnPattern,
  getPatterns,
  saveUndoAction,
  getUndoAction,
  cleanupExpiredUndoActions,
  checkDatabaseHealth,
  disconnectPrisma,
};
