/**
 * Tekup Lead Scoring Algorithm
 * Production-ready lead scoring based on email content analysis
 * and business context for rengøring (cleaning) services
 */

export interface LeadScoringFactors {
  urgencyKeywords: string[];
  businessEmail: boolean;
  phoneNumber: boolean;
  budgetMention: boolean;
  locationMention: boolean;
  serviceSpecific: boolean;
  timeframe: 'immediate' | 'within_week' | 'within_month' | 'no_timeframe';
  businessType: 'private' | 'commercial' | 'unknown';
  previousCustomer: boolean;
  emailQuality: 'high' | 'medium' | 'low';
}

export interface LeadScore {
  totalScore: number;
  category: 'hot' | 'warm' | 'cold';
  factors: LeadScoringFactors;
  explanation: string[];
  confidence: number;
  recommendations: string[];
}

// Urgency keywords for cleaning services (Danish)
const URGENCY_KEYWORDS = [
  'akut', 'hurtig', 'i dag', 'asap', 'straks', 'øjeblikkeligt',
  'emergency', 'akut behov', 'haster', 'deadline', 'nu',
  'så hurtigt som muligt', 'inden', 'før', 'deadline'
];

// Budget-related keywords
const BUDGET_KEYWORDS = [
  'budget', 'pris', 'penge', 'betale', 'kostpriser', 'økonomi',
  'investere', 'udgifter', 'billig', 'dyr', 'værd', 'tilbud',
  'kr', 'kroner', 'dkk', 'beløb', 'finansiering'
];

// Location keywords (Denmark focused)
const LOCATION_KEYWORDS = [
  'aarhus', 'københavn', 'odense', 'aalborg', 'esbjerg',
  'randers', 'kolding', 'horsens', 'vejle', 'roskilde',
  'helsingør', 'silkeborg', 'næstved', 'fredericia', 'viborg',
  'køge', 'holstebro', 'taastrup', 'slagelse', 'hillerød'
];

// Service-specific keywords for cleaning
const SERVICE_KEYWORDS = [
  'rengøring', 'cleaning', 'støvsugning', 'moppe', 'vindues',
  'toilet', 'køkken', 'bad', 'gulv', 'tæpper', 'møbler',
  'kontorrengøring', 'erhvervsrengøring', 'privatrengøring',
  'hovedrengøring', 'løbende', 'ugentlig', 'månedlig',
  'specialrengøring', 'flytterengøring', 'byggerengøring'
];

// Commercial indicators
const COMMERCIAL_KEYWORDS = [
  'kontor', 'virksomhed', 'firma', 'aps', 'a/s', 'as', 'company',
  'erhverv', 'business', 'klinik', 'tandlæge', 'læge',
  'restaurant', 'butik', 'showroom', 'lager', 'fabrik'
];

// Timeframe keywords
const IMMEDIATE_TIMEFRAME = ['i dag', 'nu', 'straks', 'øjeblikkeligt'];
const WEEK_TIMEFRAME = ['i morgen', 'næste dag', 'denne uge', 'hurtigst muligt'];
const MONTH_TIMEFRAME = ['næste uge', 'om 14 dage', 'denne måned', 'snart'];

/**
 * Analyzes email content and calculates lead score
 */
export function calculateLeadScore(
  emailContent: string,
  senderEmail: string,
  senderName?: string,
  phone?: string
): LeadScore {
  const content = emailContent.toLowerCase();
  const email = senderEmail.toLowerCase();
  const explanation: string[] = [];
  const recommendations: string[] = [];
  
  let totalScore = 0;

  // 1. Urgency Analysis (0-25 points)
  const urgencyKeywords = URGENCY_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const urgencyScore = Math.min(urgencyKeywords.length * 8, 25);
  totalScore += urgencyScore;
  
  if (urgencyScore > 0) {
    explanation.push(`Urgency detected: "${urgencyKeywords.join(', ')}" (+${urgencyScore} points)`);
    recommendations.push('Respond within 2 hours due to urgency indicators');
  }

  // 2. Business Email Analysis (0-20 points)
  const isBusinessEmail = !email.includes('gmail.com') && 
                         !email.includes('hotmail.com') && 
                         !email.includes('yahoo.com') && 
                         !email.includes('outlook.com');
  const businessEmailScore = isBusinessEmail ? 20 : 0;
  totalScore += businessEmailScore;
  
  if (isBusinessEmail) {
    explanation.push(`Business email domain (+${businessEmailScore} points)`);
  }

  // 3. Phone Number Provided (0-15 points)
  const hasPhoneNumber = !!phone || /\d{8}|\d{2}\s\d{2}\s\d{2}\s\d{2}/.test(content);
  const phoneScore = hasPhoneNumber ? 15 : 0;
  totalScore += phoneScore;
  
  if (hasPhoneNumber) {
    explanation.push(`Phone number provided (+${phoneScore} points)`);
    recommendations.push('Call directly for faster conversion');
  }

  // 4. Budget Mention (0-15 points)
  const budgetKeywords = BUDGET_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const budgetScore = budgetKeywords.length > 0 ? 15 : 0;
  totalScore += budgetScore;
  
  if (budgetScore > 0) {
    explanation.push(`Budget discussion: "${budgetKeywords.join(', ')}" (+${budgetScore} points)`);
  }

  // 5. Location Specificity (0-10 points)
  const locationKeywords = LOCATION_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const locationScore = locationKeywords.length > 0 ? 10 : 0;
  totalScore += locationScore;
  
  if (locationScore > 0) {
    explanation.push(`Specific location: "${locationKeywords.join(', ')}" (+${locationScore} points)`);
  }

  // 6. Service Relevance (0-10 points)
  const serviceKeywords = SERVICE_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const serviceScore = Math.min(serviceKeywords.length * 2, 10);
  totalScore += serviceScore;
  
  if (serviceScore > 0) {
    explanation.push(`Service match: "${serviceKeywords.join(', ')}" (+${serviceScore} points)`);
  }

  // 7. Commercial vs Private (0-5 points)
  const commercialKeywords = COMMERCIAL_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const commercialScore = commercialKeywords.length > 0 ? 5 : 0;
  totalScore += commercialScore;
  
  let businessType: 'private' | 'commercial' | 'unknown' = 'unknown';
  if (commercialScore > 0) {
    businessType = 'commercial';
    explanation.push(`Commercial customer (+${commercialScore} points)`);
  } else if (content.includes('privat') || content.includes('hjem')) {
    businessType = 'private';
  }

  // 8. Timeframe Analysis
  let timeframe: LeadScoringFactors['timeframe'] = 'no_timeframe';
  if (IMMEDIATE_TIMEFRAME.some(kw => content.includes(kw))) {
    timeframe = 'immediate';
    totalScore += 10;
    explanation.push('Immediate timeframe (+10 points)');
    recommendations.push('Contact immediately - same day response needed');
  } else if (WEEK_TIMEFRAME.some(kw => content.includes(kw))) {
    timeframe = 'within_week';
    totalScore += 7;
    explanation.push('Week timeframe (+7 points)');
  } else if (MONTH_TIMEFRAME.some(kw => content.includes(kw))) {
    timeframe = 'within_month';
    totalScore += 3;
    explanation.push('Month timeframe (+3 points)');
  }

  // 9. Email Quality Assessment
  let emailQuality: 'high' | 'medium' | 'low' = 'low';
  if (content.length > 200 && content.split('.').length > 3) {
    emailQuality = 'high';
    totalScore += 5;
    explanation.push('High-quality detailed email (+5 points)');
  } else if (content.length > 50) {
    emailQuality = 'medium';
    totalScore += 2;
  }

  // Determine category
  let category: 'hot' | 'warm' | 'cold';
  if (totalScore >= 70) {
    category = 'hot';
    recommendations.push('Priority lead - respond within 1 hour');
  } else if (totalScore >= 50) {
    category = 'warm';
    recommendations.push('Quality lead - respond within 4 hours');
  } else {
    category = 'cold';
    recommendations.push('Standard follow-up within 24 hours');
  }

  // Calculate confidence based on available data
  const confidence = Math.min(
    (urgencyKeywords.length > 0 ? 25 : 0) +
    (isBusinessEmail ? 20 : 0) +
    (hasPhoneNumber ? 15 : 0) +
    (budgetKeywords.length > 0 ? 15 : 0) +
    (locationKeywords.length > 0 ? 10 : 0) +
    (serviceKeywords.length > 0 ? 10 : 0) +
    (emailQuality === 'high' ? 5 : 0), 
    100
  );

  const factors: LeadScoringFactors = {
    urgencyKeywords,
    businessEmail: isBusinessEmail,
    phoneNumber: hasPhoneNumber,
    budgetMention: budgetKeywords.length > 0,
    locationMention: locationKeywords.length > 0,
    serviceSpecific: serviceKeywords.length > 0,
    timeframe,
    businessType,
    previousCustomer: false, // Would need to check against existing customers
    emailQuality
  };

  return {
    totalScore: Math.min(totalScore, 100),
    category,
    factors,
    explanation,
    confidence,
    recommendations
  };
}

/**
 * Bulk score multiple leads
 */
export function scoreMultipleLeads(leads: Array<{
  id: string;
  emailContent: string;
  senderEmail: string;
  senderName?: string;
  phone?: string;
}>): Array<{ id: string; score: LeadScore }> {
  return leads.map(lead => ({
    id: lead.id,
    score: calculateLeadScore(
      lead.emailContent,
      lead.senderEmail,
      lead.senderName,
      lead.phone
    )
  }));
}

/**
 * Get lead color based on score
 */
export function getLeadStatusColor(score: number): string {
  if (score >= 90) return 'var(--color-lead-hot)'; // Red (90-100): Hot leads
  if (score >= 70) return 'var(--color-lead-warm)'; // Yellow (70-89): Warm leads
  return 'var(--color-lead-cold)'; // Blue (50-69): Cold leads
}

/**
 * Get lead priority text
 */
export function getLeadPriorityText(score: number): string {
  if (score >= 90) return 'Kritisk - Kontakt nu';
  if (score >= 80) return 'Høj prioritet';
  if (score >= 70) return 'Medium prioritet';
  if (score >= 50) return 'Standard opfølgning';
  return 'Lav prioritet';
}