// Mock Data Service for RenOS Dashboard
// Provides fallback data when API is not available

export interface MockOverviewStats {
  customers: number;
  leads: number;
  bookings: number;
  quotes: number;
  conversations: number;
  revenue: number;
  customersChange?: number;
  leadsChange?: number;
  bookingsChange?: number;
  quotesChange?: number;
}

export interface MockCacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: string;
}

export interface MockLead {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  externalId?: string | null; // For Leadmail.no integration
  customer?: {
    name: string;
  };
}

export interface MockBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  lead?: {
    name: string;
    customer?: {
      name: string;
    };
  };
}

export const mockOverviewStats: MockOverviewStats = {
  customers: 12,
  leads: 39,
  bookings: 31,
  quotes: 8,
  conversations: 156,
  revenue: 45600,
  customersChange: 15.2,
  leadsChange: 23.8,
  bookingsChange: 8.4,
  quotesChange: 12.1
};

export const mockCacheStats: MockCacheStats = {
  hits: 1247,
  misses: 89,
  size: 156,
  hitRate: "93.3%"
};

export const mockRecentLeads: MockLead[] = [
  {
    id: "1",
    name: "Mathias Nørret",
    email: "math667n@gmail.com",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    customer: { name: "Mathias Nørret" }
  },
  {
    id: "2",
    name: "Anne Sofie Kristensen",
    email: "anne.sofie@email.dk",
    status: "contacted",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    customer: { name: "Anne Sofie Kristensen" }
  },
  {
    id: "3",
    name: "Tommy Callesen",
    email: "tommy.c@gmail.com",
    status: "qualified",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    customer: { name: "Tommy Callesen" }
  },
  {
    id: "4",
    name: "Line Tanderup Nielsen",
    email: "line.tanderup@hotmail.com",
    status: "new",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    customer: { name: "Line Tanderup Nielsen" }
  },
  {
    id: "5",
    name: "Magney Madsen",
    email: "magney.madsen@outlook.dk",
    status: "contacted",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    customer: { name: "Magney Madsen" }
  }
];

export const mockUpcomingBookings: MockBooking[] = [
  {
    id: "1",
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
    status: "scheduled",
    lead: {
      name: "Fast rengøring - Casper Thygesen",
      customer: { name: "Casper Thygesen" }
    }
  },
  {
    id: "2",
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
    status: "scheduled",
    lead: {
      name: "Flytterengøring - Anne Sofie Kristensen",
      customer: { name: "Anne Sofie Kristensen" }
    }
  },
  {
    id: "3",
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // +5 hours
    status: "scheduled",
    lead: {
      name: "Post-renoverings rengøring - Erik Hansen",
      customer: { name: "Erik Hansen" }
    }
  },
  {
    id: "4",
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
    status: "scheduled",
    lead: {
      name: "Ugentlig rengøring - Vindunor",
      customer: { name: "Vindunor" }
    }
  },
  {
    id: "5",
    startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // +5 hours
    status: "scheduled",
    lead: {
      name: "Første rengøring - Juliane Wibroe",
      customer: { name: "Juliane Wibroe" }
    }
  }
];

export const mockRevenueData = [
  { date: "Man", revenue: 3200 },
  { date: "Tir", revenue: 2800 },
  { date: "Ons", revenue: 4100 },
  { date: "Tor", revenue: 3600 },
  { date: "Fre", revenue: 4800 },
  { date: "Lør", revenue: 5200 },
  { date: "Søn", revenue: 2400 }
];

export const mockServiceData = [
  { name: "Fast Rengøring", value: 45, color: "#0ea5e9" },
  { name: "Flytterengøring", value: 25, color: "#10b981" },
  { name: "Post-renovering", value: 15, color: "#f59e0b" },
  { name: "Ugentlig Rengøring", value: 10, color: "#8b5cf6" },
  { name: "Engangsopgaver", value: 5, color: "#ef4444" }
];

// Utility function to simulate API delay
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API service that provides fallback data
export class MockApiService {
  static async getOverviewStats(period: string): Promise<MockOverviewStats> {
    await simulateApiDelay();

    // Simulate different data based on period
    const multiplier = period === '24h' ? 0.3 : period === '7d' ? 1 : period === '30d' ? 3.2 : 8.5;

    return {
      ...mockOverviewStats,
      customers: Math.floor(mockOverviewStats.customers * multiplier),
      leads: Math.floor(mockOverviewStats.leads * multiplier),
      bookings: Math.floor(mockOverviewStats.bookings * multiplier),
      quotes: Math.floor(mockOverviewStats.quotes * multiplier),
      revenue: Math.floor(mockOverviewStats.revenue * multiplier)
    };
  }

  static async getCacheStats(): Promise<MockCacheStats> {
    await simulateApiDelay(200);
    return mockCacheStats;
  }

  static async getRecentLeads(): Promise<MockLead[]> {
    await simulateApiDelay(300);
    return mockRecentLeads;
  }

  static async getUpcomingBookings(): Promise<MockBooking[]> {
    await simulateApiDelay(400);
    return mockUpcomingBookings;
  }

  static async getRevenueData(period: string): Promise<Array<{ date: string; revenue: number }>> {
    await simulateApiDelay(600);

    // Generate different data based on period
    if (period === '24h') {
      return Array.from({ length: 24 }, (_, i) => ({
        date: `${i}:00`,
        revenue: Math.floor(Math.random() * 500 + 100)
      }));
    }

    return mockRevenueData;
  }

  static async getServiceData(): Promise<Array<{ name: string; value: number; color: string }>> {
    await simulateApiDelay(500);
    return mockServiceData;
  }
}
