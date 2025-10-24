/**
 * RenOS Schema Client
 * Tekup Google AI (RenOS) specific database queries
 */

import { prisma } from './index';

export const renos = {
  // ===================================
  // LEAD MANAGEMENT
  // ===================================

  async findLeads(filters?: {
    status?: string;
    priority?: string;
    source?: string;
    estimatedValueMin?: number;
    limit?: number;
  }) {
    return prisma.renosLead.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.source && { source: filters.source }),
        ...(filters?.estimatedValueMin && {
          estimatedValue: { gte: filters.estimatedValueMin },
        }),
      },
      take: filters?.limit || 50,
      orderBy: [
        { priority: 'desc' },
        { estimatedValue: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        customer: true,
        quotes: true,
        bookings: true,
      },
    });
  },

  async createLead(data: {
    source: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    customerId?: string;
  }) {
    return prisma.renosLead.create({
      data,
      include: { customer: true },
    });
  },

  async updateLeadScore(leadId: string, score: number, priority: string, metadata?: any) {
    return prisma.renosLead.update({
      where: { id: leadId },
      data: {
        score,
        priority,
        scoreMetadata: metadata,
        lastScored: new Date(),
      },
    });
  },

  async enrichLead(leadId: string, enrichmentData: {
    companyName?: string;
    industry?: string;
    estimatedSize?: string;
    estimatedValue?: number;
    enrichmentData?: any;
  }) {
    return prisma.renosLead.update({
      where: { id: leadId },
      data: {
        ...enrichmentData,
        lastEnriched: new Date(),
      },
    });
  },

  // ===================================
  // CUSTOMER MANAGEMENT
  // ===================================

  async findCustomer(email: string) {
    return prisma.renosCustomer.findUnique({
      where: { email },
      include: {
        leads: true,
        bookings: true,
        cleaningPlans: true,
      },
    });
  },

  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
  }) {
    return prisma.renosCustomer.create({ data });
  },

  async updateCustomerStats(customerId: string) {
    const [leads, bookings, totalRevenue] = await Promise.all([
      prisma.renosLead.count({ where: { customerId } }),
      prisma.renosBooking.count({ where: { customerId } }),
      prisma.renosInvoice.aggregate({
        where: { customerId, status: 'paid' },
        _sum: { total: true },
      }),
    ]);

    return prisma.renosCustomer.update({
      where: { id: customerId },
      data: {
        totalLeads: leads,
        totalBookings: bookings,
        totalRevenue: totalRevenue._sum.total || 0,
        lastContactAt: new Date(),
      },
    });
  },

  // ===================================
  // BOOKING MANAGEMENT
  // ===================================

  async findBookings(filters?: {
    customerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return prisma.renosBooking.findMany({
      where: {
        ...(filters?.customerId && { customerId: filters.customerId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { scheduledAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { scheduledAt: { lte: filters.endDate } }),
      },
      take: filters?.limit || 100,
      orderBy: { scheduledAt: 'desc' },
      include: {
        customer: true,
        lead: true,
        breaks: true,
      },
    });
  },

  async createBooking(data: {
    customerId?: string;
    leadId?: string;
    serviceType?: string;
    address?: string;
    scheduledAt: Date;
    estimatedDuration?: number;
  }) {
    return prisma.renosBooking.create({
      data: {
        ...data,
        estimatedDuration: data.estimatedDuration || 120,
      },
    });
  },

  async startTimer(bookingId: string) {
    return prisma.renosBooking.update({
      where: { id: bookingId },
      data: {
        actualStartTime: new Date(),
        timerStatus: 'running',
      },
    });
  },

  async stopTimer(bookingId: string) {
    const booking = await prisma.renosBooking.findUnique({
      where: { id: bookingId },
      include: { breaks: true },
    });

    if (!booking?.actualStartTime) {
      throw new Error('Timer not started');
    }

    const now = new Date();
    const totalMinutes = Math.floor(
      (now.getTime() - booking.actualStartTime.getTime()) / (1000 * 60)
    );

    // Subtract break time
    const breakMinutes = booking.breaks.reduce((sum: number, b: any) => {
      if (b.duration) return sum + b.duration;
      return sum;
    }, 0);

    const actualDuration = totalMinutes - breakMinutes;
    const timeVariance = actualDuration - booking.estimatedDuration;
    const efficiencyScore = booking.estimatedDuration / actualDuration;

    return prisma.renosBooking.update({
      where: { id: bookingId },
      data: {
        actualEndTime: now,
        actualDuration,
        timeVariance,
        efficiencyScore,
        timerStatus: 'completed',
        status: 'completed',
      },
    });
  },

  async addBreak(bookingId: string, reason?: string) {
    return prisma.renosBreak.create({
      data: {
        bookingId,
        startTime: new Date(),
        reason,
      },
    });
  },

  async endBreak(breakId: string) {
    const breakRecord = await prisma.renosBreak.findUnique({
      where: { id: breakId },
    });

    if (!breakRecord) throw new Error('Break not found');

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - breakRecord.startTime.getTime()) / (1000 * 60)
    );

    return prisma.renosBreak.update({
      where: { id: breakId },
      data: { endTime, duration },
    });
  },

  // ===================================
  // EMAIL MANAGEMENT
  // ===================================

  async findEmailThreads(customerId?: string, limit = 50) {
    return prisma.renosEmailThread.findMany({
      where: customerId ? { customerId } : {},
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          take: 5,
          orderBy: { sentAt: 'desc' },
        },
        customer: true,
      },
    });
  },

  async createEmailThread(data: {
    gmailThreadId: string;
    subject: string;
    snippet?: string;
    participants: string[];
    customerId?: string;
  }) {
    return prisma.renosEmailThread.create({
      data: {
        ...data,
        lastMessageAt: new Date(),
      },
    });
  },

  async addEmailMessage(data: {
    gmailMessageId?: string;
    gmailThreadId: string;
    threadId?: string;
    from: string;
    to: string[];
    subject?: string;
    body: string;
    direction?: string;
    isAiGenerated?: boolean;
    sentAt: Date;
  }) {
    return prisma.renosEmailMessage.create({ data });
  },

  async createEmailResponse(data: {
    leadId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    aiModel?: string;
  }) {
    return prisma.renosEmailResponse.create({
      data: {
        ...data,
        status: 'pending',
      },
    });
  },

  async approveEmailResponse(responseId: string, gmailThreadId?: string) {
    return prisma.renosEmailResponse.update({
      where: { id: responseId },
      data: {
        status: 'approved',
        gmailThreadId,
      },
    });
  },

  async sendEmailResponse(responseId: string, gmailMessageId: string) {
    return prisma.renosEmailResponse.update({
      where: { id: responseId },
      data: {
        status: 'sent',
        gmailMessageId,
        sentAt: new Date(),
      },
    });
  },

  // ===================================
  // INVOICE MANAGEMENT
  // ===================================

  async createInvoice(data: {
    invoiceNumber: string;
    bookingId?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    dueDate: Date;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const vatAmount = subtotal * 0.25; // 25% Danish VAT
    const total = subtotal + vatAmount;

    return prisma.renosInvoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        bookingId: data.bookingId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        dueDate: data.dueDate,
        subtotal,
        vatRate: 25.0,
        vatAmount,
        total,
        lineItems: {
          create: data.lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: { lineItems: true },
    });
  },

  async markInvoicePaid(
    invoiceId: string,
    paidAmount: number,
    paymentMethod: string,
    paymentRef?: string
  ) {
    return prisma.renosInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidAmount,
        paymentMethod,
        paymentRef,
      },
    });
  },

  // ===================================
  // CLEANING PLANS
  // ===================================

  async findCleaningPlans(customerId?: string, isActive = true) {
    return prisma.renosCleaningPlan.findMany({
      where: {
        ...(customerId && { customerId }),
        isActive,
      },
      include: {
        tasks: {
          orderBy: { sortOrder: 'asc' },
        },
        customer: true,
      },
    });
  },

  async createCleaningPlan(data: {
    customerId: string;
    name: string;
    description?: string;
    serviceType: string;
    frequency?: string;
    estimatedDuration?: number;
    squareMeters?: number;
    address?: string;
    tasks: Array<{
      name: string;
      description?: string;
      category: string;
      estimatedTime?: number;
      isRequired?: boolean;
    }>;
  }) {
    return prisma.renosCleaningPlan.create({
      data: {
        customerId: data.customerId,
        name: data.name,
        description: data.description,
        serviceType: data.serviceType,
        frequency: data.frequency || 'once',
        estimatedDuration: data.estimatedDuration || 120,
        squareMeters: data.squareMeters,
        address: data.address,
        tasks: {
          create: data.tasks.map((task, index) => ({
            name: task.name,
            description: task.description,
            category: task.category,
            estimatedTime: task.estimatedTime || 15,
            isRequired: task.isRequired !== false,
            sortOrder: index,
          })),
        },
      },
      include: { tasks: true },
    });
  },

  // ===================================
  // ANALYTICS
  // ===================================

  async trackMetric(metric: string, value: number, metadata?: any) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return prisma.renosAnalytics.upsert({
      where: {
        date_metric: { date, metric },
      },
      create: { date, metric, value, metadata },
      update: { value, metadata },
    });
  },

  async getMetrics(metric: string, startDate: Date, endDate: Date) {
    return prisma.renosAnalytics.findMany({
      where: {
        metric,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  // ===================================
  // ESCALATIONS
  // ===================================

  async createEscalation(data: {
    leadId: string;
    customerEmail: string;
    customerName?: string;
    threadId: string;
    severity: string;
    conflictScore: number;
    matchedKeywords: string[];
    emailSnippet: string;
  }) {
    return prisma.renosEscalation.create({
      data: {
        ...data,
        escalatedBy: 'system',
      },
    });
  },

  async resolveEscalation(escalationId: string, resolution: string) {
    return prisma.renosEscalation.update({
      where: { id: escalationId },
      data: {
        resolvedAt: new Date(),
        resolution,
      },
    });
  },
};

export default renos;
