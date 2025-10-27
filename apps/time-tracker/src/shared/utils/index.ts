import { format } from 'date-fns';

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
  }).format(amount);
}

// Date formatting
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd. MMM yyyy', { locale: undefined });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd. MMM yyyy HH:mm', { locale: undefined });
}

export function formatMonthYear(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMMM yyyy', { locale: undefined });
}

// Number formatting
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}t`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Calculate profit margin
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

// Calculate hourly rate
export function calculateHourlyRate(revenue: number, hours: number): number {
  if (hours === 0) return 0;
  return revenue / hours;
}

// Team utilities
export function isFBTeam(team: string): boolean {
  return team === 'FB' || team.includes('FB') || team.includes('Team 2');
}

export function getTeamDisplayName(team: string): string {
  switch (team) {
    case 'Jonas+Rawan':
      return 'Jonas + Rawan';
    case 'FB':
      return 'FB Rengøring';
    case 'Mixed':
      return 'Mixed Team';
    default:
      return team;
  }
}

// Job type utilities
export function getJobTypeDisplayName(type: string): string {
  switch (type) {
    case 'Fast':
      return 'Fast Rengøring';
    case 'Flyt':
      return 'Flytterengøring';
    case 'Hoved':
      return 'Hovedrengøring';
    case 'Post-reno':
      return 'Post-Renovering';
    default:
      return type;
  }
}

// Status utilities
export function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'planned':
      return 'Planlagt';
    case 'completed':
      return 'Udført';
    case 'invoiced':
      return 'Faktureret';
    case 'paid':
      return 'Betalt';
    default:
      return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'planned':
      return 'text-yellow-600 bg-yellow-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'invoiced':
      return 'text-blue-600 bg-blue-100';
    case 'paid':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+45|45)?[2-9]\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Calendar utilities
export function parseCalendarEventDescription(description: string): {
  hours?: number;
  price?: number;
  team?: string;
  type?: string;
  notes?: string;
} {
  const result: any = {};

  // Extract hours
  const hoursMatch = description.match(/(\d+(?:,\d+)?)\s*timer?/i);
  if (hoursMatch) {
    result.hours = parseFloat(hoursMatch[1].replace(',', '.'));
  }

  // Extract price
  const priceMatch = description.match(/(\d+(?:\.\d+)?)\s*kr/i);
  if (priceMatch) {
    result.price = parseInt(priceMatch[1].replace('.', ''));
  }

  // Extract team
  if (description.includes('FB') || description.includes('Team 2')) {
    result.team = 'FB';
  } else if (description.includes('Jonas') || description.includes('Rawan')) {
    result.team = 'Jonas+Rawan';
  }

  // Extract type
  if (description.includes('FLYT')) {
    result.type = 'Flyt';
  } else if (description.includes('HOVED')) {
    result.type = 'Hoved';
  } else if (description.includes('FAST')) {
    result.type = 'Fast';
  }

  // Extract notes (everything after the structured data)
  const notesMatch = description.match(/(?:note|bemærkning|kommentar):\s*(.+)/i);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
  }

  return result;
}

// Generate calendar event title
export function generateCalendarEventTitle(
  customer: string,
  type: string,
  index?: number
): string {
  const emoji = getJobTypeEmoji(type);
  const number = index ? ` #${index}` : '';
  return `${emoji} ${type.toUpperCase()} #${Math.floor(Math.random() * 1000)} - ${customer}`;
}

function getJobTypeEmoji(type: string): string {
  switch (type) {
    case 'Fast':
      return '🏠';
    case 'Flyt':
      return '🚛';
    case 'Hoved':
      return '✨';
    case 'Post-reno':
      return '🔨';
    default:
      return '🏠';
  }
}

// Calculate FB settlement
export function calculateFBSettlement(jobs: any[]): {
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  jobs: any[];
} {
  const fbJobs = jobs.filter(job => isFBTeam(job.team));
  const totalHours = fbJobs.reduce((sum, job) => sum + job.hoursWorked, 0);
  const hourlyRate = 90; // Fixed rate for FB Rengøring
  const totalAmount = totalHours * hourlyRate;

  return {
    totalHours,
    hourlyRate,
    totalAmount,
    jobs: fbJobs,
  };
}

// Generate monthly report
export function generateMonthlyReport(
  jobs: any[],
  month: string
): {
  month: string;
  totalJobs: number;
  totalHours: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgHourlyRate: number;
  fbSettlement: any;
  teamBreakdown: any;
} {
  const totalJobs = jobs.length;
  const totalHours = jobs.reduce((sum, job) => sum + job.hoursWorked, 0);
  const totalRevenue = jobs.reduce((sum, job) => sum + job.revenue, 0);
  const totalCost = jobs.reduce((sum, job) => sum + job.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

  const fbSettlement = calculateFBSettlement(jobs);

  const teamBreakdown = {
    'Jonas+Rawan': jobs.filter(job => job.team === 'Jonas+Rawan').length,
    'FB': jobs.filter(job => job.team === 'FB').length,
    'Mixed': jobs.filter(job => job.team === 'Mixed').length,
  };

  return {
    month,
    totalJobs,
    totalHours,
    totalRevenue,
    totalCost,
    totalProfit,
    avgHourlyRate,
    fbSettlement,
    teamBreakdown,
  };
}