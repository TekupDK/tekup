/**
 * CRM Schema Client
 * Customer Relationship Management database queries
 */

import { prisma } from './index';

export const crm = {
  // ===================================
  // CONTACT MANAGEMENT
  // ===================================

  async findContacts(filters?: {
    status?: string;
    companyId?: string;
    owner?: string;
    limit?: number;
  }) {
    return prisma.crmContact.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.companyId && { companyId: filters.companyId }),
        ...(filters?.owner && { owner: filters.owner }),
      },
      take: filters?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        deals: true,
      },
    });
  },

  async findContactByEmail(email: string) {
    return prisma.crmContact.findUnique({
      where: { email },
      include: {
        company: true,
        deals: true,
        activities: { take: 10, orderBy: { occurredAt: 'desc' } },
      },
    });
  },

  async createContact(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyId?: string;
    title?: string;
    owner?: string;
    source?: string;
  }) {
    return prisma.crmContact.create({
      data,
      include: { company: true },
    });
  },

  async updateContact(id: string, data: any) {
    return prisma.crmContact.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // ===================================
  // COMPANY MANAGEMENT
  // ===================================

  async findCompanies(filters?: {
    status?: string;
    industry?: string;
    owner?: string;
    limit?: number;
  }) {
    return prisma.crmCompany.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.industry && { industry: filters.industry }),
        ...(filters?.owner && { owner: filters.owner }),
      },
      take: filters?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: true,
        deals: true,
      },
    });
  },

  async createCompany(data: {
    name: string;
    website?: string;
    industry?: string;
    owner?: string;
  }) {
    return prisma.crmCompany.create({ data });
  },

  // ===================================
  // DEAL MANAGEMENT
  // ===================================

  async findDeals(filters?: {
    stage?: string;
    status?: string;
    owner?: string;
    limit?: number;
  }) {
    return prisma.crmDeal.findMany({
      where: {
        ...(filters?.stage && { stage: filters.stage }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.owner && { owner: filters.owner }),
      },
      take: filters?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        company: true,
        products: true,
      },
    });
  },

  async createDeal(data: {
    title: string;
    value: number;
    owner: string;
    contactId?: string;
    companyId?: string;
    stage?: string;
    expectedCloseDate?: Date;
  }) {
    return prisma.crmDeal.create({
      data: {
        ...data,
        stage: data.stage || 'qualification',
      },
      include: {
        contact: true,
        company: true,
      },
    });
  },

  async moveDealToStage(dealId: string, stage: string) {
    return prisma.crmDeal.update({
      where: { id: dealId },
      data: { stage, updatedAt: new Date() },
    });
  },

  async closeDeal(dealId: string, won: boolean, reason?: string) {
    return prisma.crmDeal.update({
      where: { id: dealId },
      data: {
        status: won ? 'won' : 'lost',
        actualCloseDate: new Date(),
        lostReason: won ? null : reason,
      },
    });
  },

  async addProductToDeal(data: {
    dealId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }) {
    const total = data.quantity * data.unitPrice * (1 - (data.discount || 0) / 100);
    
    return prisma.crmDealProduct.create({
      data: {
        ...data,
        discount: data.discount || 0,
        total,
      },
    });
  },

  // ===================================
  // ACTIVITY TRACKING
  // ===================================

  async logActivity(data: {
    type: string;
    subject?: string;
    description?: string;
    contactId?: string;
    companyId?: string;
    dealId?: string;
    owner: string;
    durationMinutes?: number;
    outcome?: string;
  }) {
    return prisma.crmActivity.create({ data });
  },

  async getActivities(filters?: {
    contactId?: string;
    companyId?: string;
    dealId?: string;
    owner?: string;
    limit?: number;
  }) {
    return prisma.crmActivity.findMany({
      where: {
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.companyId && { companyId: filters.companyId }),
        ...(filters?.dealId && { dealId: filters.dealId }),
        ...(filters?.owner && { owner: filters.owner }),
      },
      take: filters?.limit || 50,
      orderBy: { occurredAt: 'desc' },
      include: {
        contact: true,
        company: true,
        deal: true,
      },
    });
  },

  // ===================================
  // EMAIL TRACKING
  // ===================================

  async logEmail(data: {
    subject: string;
    body: string;
    from: string;
    to: string[];
    direction: string;
    contactId?: string;
    status?: string;
  }) {
    return prisma.crmEmail.create({
      data: {
        ...data,
        sentAt: data.direction === 'outbound' ? new Date() : undefined,
      },
    });
  },

  async markEmailOpened(emailId: string) {
    return prisma.crmEmail.update({
      where: { id: emailId },
      data: {
        status: 'opened',
        openedAt: new Date(),
      },
    });
  },

  // ===================================
  // TASK MANAGEMENT
  // ===================================

  async createTask(data: {
    title: string;
    description?: string;
    assignedTo: string;
    contactId?: string;
    dueDate?: Date;
    priority?: string;
  }) {
    return prisma.crmTask.create({ data });
  },

  async getTasks(filters?: {
    assignedTo?: string;
    contactId?: string;
    status?: string;
    limit?: number;
  }) {
    return prisma.crmTask.findMany({
      where: {
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.status && { status: filters.status }),
      },
      take: filters?.limit || 50,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      include: { contact: true },
    });
  },

  async completeTask(taskId: string) {
    return prisma.crmTask.update({
      where: { id: taskId },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
    });
  },

  // ===================================
  // ANALYTICS
  // ===================================

  async trackMetric(metric: string, value: number, metadata?: any) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return prisma.crmMetric.upsert({
      where: {
        date_metric: { date, metric },
      },
      create: { date, metric, value, metadata },
      update: { value, metadata },
    });
  },

  async getMetrics(metric: string, startDate: Date, endDate: Date) {
    return prisma.crmMetric.findMany({
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

  async getPipelineMetrics(owner?: string) {
    const deals = await prisma.crmDeal.findMany({
      where: owner ? { owner } : {},
      select: {
        stage: true,
        value: true,
        status: true,
      },
    });

    const metrics = {
      totalValue: 0,
      byStage: {} as Record<string, { count: number; value: number }>,
      byStatus: {} as Record<string, { count: number; value: number }>,
    };

    deals.forEach((deal) => {
      metrics.totalValue += deal.value;

      if (!metrics.byStage[deal.stage]) {
        metrics.byStage[deal.stage] = { count: 0, value: 0 };
      }
      metrics.byStage[deal.stage].count++;
      metrics.byStage[deal.stage].value += deal.value;

      if (!metrics.byStatus[deal.status]) {
        metrics.byStatus[deal.status] = { count: 0, value: 0 };
      }
      metrics.byStatus[deal.status].count++;
      metrics.byStatus[deal.status].value += deal.value;
    });

    return metrics;
  },
};

export default crm;
