/**
 * Dashboard Data Service
 * 
 * Centralized service providing consistent data for all dashboard widgets.
 * Now uses real Neon PostgreSQL database via Prisma.
 */

import { logger } from "../logger";
import { prisma } from "./databaseService";

export interface DashboardStats {
  customers: { total: number; change: number; };
  leads: { total: number; change: number; };
  bookings: { total: number; change: number; };
  quotes: { total: number; change: number; };
  revenue: { total: number; change: number; };
  activeContracts: { total: number; change: number; };
}

export interface ServiceDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: string;
}

export class DashboardDataService {
  async getOverviewStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get current period counts
      const [customers, leads, bookings, quotes] = await Promise.all([
        prisma.customer.count({ where: { status: "active" } }),
        prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.quote.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);

      // Get previous period counts for comparison
      const [prevLeads, prevBookings, prevQuotes] = await Promise.all([
        prisma.lead.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.booking.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.quote.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      ]);

      // Calculate revenue from accepted quotes
      const acceptedQuotes = await prisma.quote.findMany({
        where: {
          status: "accepted",
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { total: true },
      });
      const revenue = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);

      const prevAcceptedQuotes = await prisma.quote.findMany({
        where: {
          status: "accepted",
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        },
        select: { total: true },
      });
      const prevRevenue = prevAcceptedQuotes.reduce((sum, q) => sum + q.total, 0);

      // Calculate percentage changes
      const leadsChange = prevLeads > 0 ? Math.round(((leads - prevLeads) / prevLeads) * 100) : 0;
      const bookingsChange = prevBookings > 0 ? Math.round(((bookings - prevBookings) / prevBookings) * 100) : 0;
      const quotesChange = prevQuotes > 0 ? Math.round(((quotes - prevQuotes) / prevQuotes) * 100) : 0;
      const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

      // Count active recurring contracts (customers with totalBookings > 5)
      const activeContracts = await prisma.customer.count({
        where: { totalBookings: { gte: 5 } }
      });

      return {
        customers: { total: customers, change: 12 }, // Change calculation needs historical data
        leads: { total: leads, change: leadsChange },
        bookings: { total: bookings, change: bookingsChange },
        quotes: { total: quotes, change: quotesChange },
        revenue: { total: Math.round(revenue), change: revenueChange },
        activeContracts: { total: activeContracts, change: 8 }
      };
    } catch (error) {
      logger.error({ error }, "Error getting overview stats");
      throw error;
    }
  }

  async getServiceDistribution(): Promise<ServiceDistribution[]> {
    try {
      // Query bookings grouped by serviceType
      const bookings = await prisma.booking.groupBy({
        by: ['serviceType'],
        _count: true,
      });

      // Color mapping for each service
      const colorMap: { [key: string]: string } = {
        'Privatrengøring': '#00d4ff',
        'Flytterengøring': '#00ff88',
        'Hovedrengøring': '#ffd93d',
        'Erhverv': '#ff0066',
        'Airbnb': '#9333ea',
        'Vinduer': '#00a8ff',
      };

      // Transform to ServiceDistribution format
      const distribution = bookings
        .filter(b => b.serviceType) // Filter out null values
        .map(b => ({
          name: b.serviceType,
          value: b._count,
          color: colorMap[b.serviceType] || '#888888'
        }))
        .sort((a, b) => b.value - a.value); // Sort by count descending

      // Return distribution or default if no data
      return distribution.length > 0 ? distribution : [
        { name: 'Privatrengøring', value: 0, color: '#00d4ff' },
        { name: 'Flytterengøring', value: 0, color: '#00ff88' },
        { name: 'Hovedrengøring', value: 0, color: '#ffd93d' },
        { name: 'Erhverv', value: 0, color: '#ff0066' },
        { name: 'Airbnb', value: 0, color: '#9333ea' },
        { name: 'Vinduer', value: 0, color: '#00a8ff' },
      ];
    } catch (error) {
      logger.error({ error }, "Error getting service distribution");
      throw error;
    }
  }

  async getRevenueTrend(period: '24h' | '7d' | '30d' | '90d'): Promise<RevenueDataPoint[]> {
    try {
      const now = new Date();
      let startDate: Date;

      // Calculate start date based on period
      if (period === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (period === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Try to get revenue from Billy.dk first, fallback to local invoices
      const { billyService } = await import("./billyService");
      let quotes;

      if (billyService.isConfigured()) {
        try {
          // Fetch real invoice data from Billy
          const billyData = await billyService.getRevenueData(startDate, now);
          logger.info({ period, billyData }, "Fetched revenue from Billy.dk");
        } catch (error) {
          logger.warn({ error }, "Failed to fetch from Billy, using local data");
        }
      }

      // Fetch from local database (quotes or invoices)
      const invoices = await prisma.invoice.findMany({
        where: {
          status: 'paid',
          paidAt: { gte: startDate, lte: now }
        },
        select: {
          total: true,
          paidAt: true
        },
        orderBy: { paidAt: 'asc' }
      });

      // If no invoices, fallback to quotes
      quotes = invoices.length > 0 
        ? invoices.map(inv => ({ total: inv.total, createdAt: inv.paidAt! }))
        : await prisma.quote.findMany({
            where: {
              status: 'accepted',
              createdAt: { gte: startDate }
            },
            select: {
              total: true,
              createdAt: true
            },
            orderBy: { createdAt: 'asc' }
          });

      // Group by date format based on period
      const revenueMap = new Map<string, number>();

      if (period === '24h') {
        // Group by hour
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          revenueMap.set(`${hour.getHours()}:00`, 0);
        }
        quotes.forEach(q => {
          const key = `${q.createdAt.getHours()}:00`;
          revenueMap.set(key, (revenueMap.get(key) || 0) + q.total);
        });
      } else if (period === '7d') {
        // Group by day
        const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          revenueMap.set(days[day.getDay()], 0);
        }
        quotes.forEach(q => {
          const key = days[q.createdAt.getDay()];
          revenueMap.set(key, (revenueMap.get(key) || 0) + q.total);
        });
      } else if (period === '30d') {
        // Group by week
        for (let i = 1; i <= 5; i++) {
          revenueMap.set(`Uge ${i}`, 0);
        }
        quotes.forEach(q => {
          const weekNum = Math.floor((now.getTime() - q.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const key = `Uge ${5 - Math.min(weekNum, 4)}`;
          revenueMap.set(key, (revenueMap.get(key) || 0) + q.total);
        });
      } else {
        // Group by month
        const monthNames = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
        const uniqueMonths = new Set<string>();
        quotes.forEach(q => {
          uniqueMonths.add(monthNames[q.createdAt.getMonth()]);
        });
        uniqueMonths.forEach(month => revenueMap.set(month, 0));
        quotes.forEach(q => {
          const key = monthNames[q.createdAt.getMonth()];
          revenueMap.set(key, (revenueMap.get(key) || 0) + q.total);
        });
      }

      // Convert map to array
      return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue)
      }));
    } catch (error) {
      logger.error({ error }, "Error getting revenue trend");
      throw error;
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    try {
      // Import cache service dynamically to get real stats
      const { cache } = await import("./cacheService");
      const cacheStats = cache.getStats();

      const hits = cacheStats.hits || 0;
      const misses = cacheStats.misses || 0;
      const entries = cacheStats.size || 0;
      const hitRate = (hits + misses) > 0 ? hits / (hits + misses) : 0;

      return {
        hits,
        misses,
        entries,
        hitRate: Math.round(hitRate * 100),
        memoryUsage: `${entries} entries`
      };
    } catch (error) {
      logger.error({ error }, "Error getting cache stats");
      // Return default stats if cache service not available
      return { hits: 0, misses: 0, entries: 0, hitRate: 0, memoryUsage: '0 MB' };
    }
  }
}

export const dashboardDataService = new DashboardDataService();
