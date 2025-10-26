/**
 * Lead Scoring Algorithm for Tekup CRM
 * Based on email analysis and customer behavior patterns
 */

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  hasAttachments?: boolean;
  threadLength?: number;
}

export interface LeadScoringFactors {
  urgencyKeywords: number;
  businessEmail: number;
  phoneNumber: number;
  budgetMentioned: number;
  timeframe: number;
  responseTime: number;
  emailQuality: number;
  companySize: number;
  total: number;
}

export interface ScoringResult {
  score: number;
  factors: LeadScoringFactors;
  status: 'hot' | 'warm' | 'cold';
  urgency: 'high' | 'medium' | 'low';
  reasons: string[];
}

// Urgency keywords with different weights
const URGENCY_KEYWORDS = {
  high: ['akut', 'hurtig', 'i dag', 'asap', 'øjeblikkeligt', 'straks', 'nu'],
  medium: ['snart', 'hurtigt', 'denne uge', 'inden', 'deadline'],
  low: ['planlægger', 'overvejer', 'måske', 'fremtidige']
};

// Budget and business keywords
const BUDGET_KEYWORDS = ['budget', 'pris', 'kostpris', 'betale', 'investere', 'økonomisk'];
const TIMEFRAME_KEYWORDS = {
  immediate: ['i dag', 'i morgen', 'denne uge'],
  shortTerm: ['denne måned', 'snart', 'inden'],
  longTerm: ['næste måned', 'senere', 'fremover']
};

// Business domain indicators
const PERSONAL_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.dk'];

export function calculateLeadScore(email: EmailData): ScoringResult {
  const factors: LeadScoringFactors = {
    urgencyKeywords: 0,
    businessEmail: 0,
    phoneNumber: 0,
    budgetMentioned: 0,
    timeframe: 0,
    responseTime: 0,
    emailQuality: 0,
    companySize: 0,
    total: 0
  };

  const reasons: string[] = [];
  const emailText = `${email.subject} ${email.body}`.toLowerCase();

  // 1. Urgency Keywords Analysis (0-25 points)
  let urgencyScore = 0;
  URGENCY_KEYWORDS.high.forEach(keyword => {
    if (emailText.includes(keyword)) {
      urgencyScore += 25;
      reasons.push(`Høj prioritet: "${keyword}" nævnt`);
    }
  });
  
  URGENCY_KEYWORDS.medium.forEach(keyword => {
    if (emailText.includes(keyword)) {
      urgencyScore += 15;
      reasons.push(`Medium prioritet: "${keyword}" nævnt`);
    }
  });

  URGENCY_KEYWORDS.low.forEach(keyword => {
    if (emailText.includes(keyword)) {
      urgencyScore -= 5; // Negative for low urgency
      reasons.push(`Lav prioritet: "${keyword}" nævnt`);
    }
  });

  factors.urgencyKeywords = Math.min(25, Math.max(0, urgencyScore));

  // 2. Business Email Analysis (0-20 points)
  const domain = email.from.split('@')[1]?.toLowerCase() || '';
  if (!PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    factors.businessEmail = 20;
    reasons.push('Business email domæne');
  } else {
    factors.businessEmail = 5; // Still some points for responding
  }

  // 3. Phone Number Present (0-20 points)
  const phoneRegex = /(?:\+45\s?)?(?:\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|\d{8})/g;
  if (phoneRegex.test(email.body)) {
    factors.phoneNumber = 20;
    reasons.push('Telefonnummer inkluderet');
  }

  // 4. Budget Mentioned (0-15 points)
  let budgetScore = 0;
  BUDGET_KEYWORDS.forEach(keyword => {
    if (emailText.includes(keyword)) {
      budgetScore = 15;
      reasons.push('Budget/pris nævnt');
    }
  });
  factors.budgetMentioned = budgetScore;

  // 5. Timeframe Urgency (0-10 points)
  let timeframeScore = 0;
  TIMEFRAME_KEYWORDS.immediate.forEach(keyword => {
    if (emailText.includes(keyword)) {
      timeframeScore = 10;
      reasons.push('Øjeblikkelig tidsramme');
    }
  });
  
  if (timeframeScore === 0) {
    TIMEFRAME_KEYWORDS.shortTerm.forEach(keyword => {
      if (emailText.includes(keyword)) {
        timeframeScore = 7;
        reasons.push('Kort tidsramme');
      }
    });
  }

  factors.timeframe = timeframeScore;

  // 6. Response Time Quality (0-10 points)
  // This would be calculated based on response patterns in a real system
  const hoursSinceEmail = (Date.now() - email.timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSinceEmail < 1) {
    factors.responseTime = 10;
    reasons.push('Nyligt modtaget email');
  } else if (hoursSinceEmail < 24) {
    factors.responseTime = 7;
  } else {
    factors.responseTime = 3;
  }

  // 7. Email Quality (0-10 points)
  const bodyLength = email.body.length;
  if (bodyLength > 200) {
    factors.emailQuality = 10;
    reasons.push('Detaljeret forespørgsel');
  } else if (bodyLength > 50) {
    factors.emailQuality = 6;
  } else {
    factors.emailQuality = 2;
  }

  // Calculate total score
  factors.total = Math.min(100, 
    factors.urgencyKeywords + 
    factors.businessEmail + 
    factors.phoneNumber + 
    factors.budgetMentioned + 
    factors.timeframe + 
    factors.responseTime + 
    factors.emailQuality + 
    factors.companySize
  );

  // Determine status and urgency
  let status: 'hot' | 'warm' | 'cold';
  let urgency: 'high' | 'medium' | 'low';

  if (factors.total >= 85) {
    status = 'hot';
    urgency = 'high';
  } else if (factors.total >= 65) {
    status = 'warm';
    urgency = factors.urgencyKeywords > 15 ? 'high' : 'medium';
  } else {
    status = 'cold';
    urgency = 'low';
  }

  return {
    score: factors.total,
    factors,
    status,
    urgency,
    reasons
  };
}

// Helper function to get status color
export function getStatusColor(status: 'hot' | 'warm' | 'cold'): string {
  switch (status) {
    case 'hot': return 'text-red-500'; // 🔴 Rød (90-100): Hot leads
    case 'warm': return 'text-yellow-500'; // 🟡 Gul (70-89): Warm leads  
    case 'cold': return 'text-blue-500'; // 🔵 Blå (50-69): Cold leads
    default: return 'text-gray-500';
  }
}

// Helper function to get urgency icon
export function getUrgencyIcon(urgency: 'high' | 'medium' | 'low'): string {
  switch (urgency) {
    case 'high': return '🔥';
    case 'medium': return '⚡';
    case 'low': return '📋';
    default: return '📋';
  }
}

// Batch scoring for multiple emails
export function scoreMultipleLeads(emails: EmailData[]): ScoringResult[] {
  return emails.map(email => calculateLeadScore(email));
}

// Get lead recommendations based on score
export function getLeadRecommendations(score: number): string[] {
  if (score >= 85) {
    return [
      'Kontakt inden for 1 time',
      'Opret personlig email',
      'Planlæg telefonopkald',
      'Prioriter høj opfølgning'
    ];
  } else if (score >= 65) {
    return [
      'Kontakt inden for 4 timer',
      'Send standardiseret svar',
      'Planlæg opfølgning i morgen',
      'Tilføj til nurturing kampagne'
    ];
  } else {
    return [
      'Kontakt inden for 24 timer',
      'Send automatisk svar',
      'Tilføj til månedlig nurturing',
      'Kvalificer yderligere'
    ];
  }
}