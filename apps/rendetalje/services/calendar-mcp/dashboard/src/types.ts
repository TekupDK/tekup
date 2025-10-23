export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceType: string;
  date: string;
  startTime: string;
  endTime: string;
  estimatedHours: number;
  team: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalAmount?: number;
  profit?: number;
  location: string;
}

export interface Alert {
  id: string;
  type: 'overtime' | 'conflict' | 'missing_invoice' | 'pattern_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  actionable: boolean;
  bookingId?: string;
}

export interface Invoice {
  bookingId: string;
  customerName: string;
  completedAt: string;
  amount: number;
}

