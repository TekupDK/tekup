// Customer management types tailored for the Danish cleaning industry
// Mirrors Tekup Lead Platform domain language for customer lifecycle tracking

export type CustomerSegment = 'commercial' | 'residential' | 'public' | 'hospitality';
export type ContractStatus = 'active' | 'onboarding' | 'expiring_soon' | 'at_risk';
export type SatisfactionLevel = 'promoter' | 'passive' | 'detractor';

export interface CleaningCustomerProfile {
  id: string;
  name: string;
  segment: CustomerSegment;
  contractStatus: ContractStatus;
  tenantId: string;
  annualContractValue: number; // in DKK
  contractStart: string; // ISO date
  contractEnd: string; // ISO date
  primaryContact: CustomerContact;
  locations: CustomerLocation[];
  serviceLevel: 'standard' | 'premium' | 'enterprise';
  hasGreenCertification: boolean;
  satisfactionScore: number; // 0-100 Tekup Pulse index
  satisfactionLevel: SatisfactionLevel;
  churnRisk: number; // 0-1 probability for analytics
  upsellPotential: 'low' | 'medium' | 'high';
  preferredProducts: string[];
  integrationsEnabled: CustomerIntegrations;
  automationPlaybooks: AutomationPlaybookSummary[];
  lastInteraction: string; // ISO date
  nextFollowUp: string; // ISO date
}

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  role: string;
  availability?: string;
}

export interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  squareMeters: number;
  cleaningType: 'office' | 'industrial' | 'hospitality' | 'residential';
  visitFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  specialRequirements?: string[];
}

export interface CustomerIntegrations {
  economics: boolean;
  calendar: boolean;
  email: boolean;
  qualityApp: boolean;
  agentScope: boolean;
}

export interface AutomationPlaybookSummary {
  id: string;
  name: string;
  status: 'active' | 'paused';
  kpi: string;
  lastRun: string; // ISO date
  successRate: number;
}

export interface ServiceHistoryEntry {
  id: string;
  customerId: string;
  locationId: string;
  date: string; // ISO date
  jobType: string;
  team: string[];
  durationMinutes: number;
  tasksCompleted: number;
  issuesFound: number;
  followUpRequired: boolean;
  customerFeedback?: {
    score: number; // 1-5
    comment?: string;
  };
}

export interface FeedbackInsight {
  id: string;
  customerId: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
  promoterShare: number;
  passiveShare: number;
  detractorShare: number;
  themes: FeedbackTheme[];
}

export interface FeedbackTheme {
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  frequency: number;
  sampleQuote: string;
}

export interface RevenueProjection {
  customerId: string;
  trailingTwelveMonths: number;
  forecastNextQuarter: number;
  churnRisk: number;
  upsellOpportunities: number;
}
