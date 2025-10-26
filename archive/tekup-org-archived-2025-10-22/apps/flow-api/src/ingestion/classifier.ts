import { RawEmailInput, ClassifiedEmail, LeadBrand } from './types.js';

const SUBJECT_LEAD_KEYWORDS = [
  'nyt lead', 'ny lead', 'ny forespørgsel', 'kontaktformular', 'booking', 'forespørgsel',
  'lead', 'inquiry', 'request', 'quote', 'tilbud'
];

const LEAD_DOMAINS = [
  'leadpoint.dk', 'leadmail.no', '3match.dk', 'adhelp.dk', 'notify@leadpoint.io', 'kontakt@leadmail.no'
];

const FOODTRUCK_KEYWORDS = [
  'foodtruck', 'food truck', 'catering', 'mad', 'menu', 'køkken',
  'fest', 'event', 'bryllup', 'firmafest', 'fødselsdag', 'pax',
  'gæster', 'personer', 'budget', 'ftfiesta'
];

const TEKUP_KEYWORDS = [
  'it support', 'backup', 'sikkerhed', 'compliance', 'nis2',
  'copilot', 'microsoft', 'azure', 'server', 'netværk',
  'cybersecurity', 'gdpr', 'it-sikkerhed'
];

const RENDETALJE_KEYWORDS = [
  'rengøring', 'cleaning', 'rengør', 'rengjør', 'vindues',
  'kontor', 'privat', 'erhverv', 'flyt', 'kvadratmeter',
  'm2', 'ugentlig', 'månedlig', 'engangs'
];

function extractDomain(addr: string): string | undefined {
  const m = addr.toLowerCase().match(/@([^>\s]+)/);
  return m?.[1];
}

function detectBrand(input: RawEmailInput, text: string): LeadBrand {
  const { mailbox, from } = input;
  const mailboxLower = mailbox.toLowerCase();
  const fromLower = from.toLowerCase();
  
  // Primary: Mailbox routing (most reliable)
  if (mailboxLower.includes('foodtruck') || mailboxLower.includes('ftfiesta')) {
    return 'foodtruck';
  }
  
  if (mailboxLower.includes('tekup')) {
    return 'tekup';
  }
  
  if (mailboxLower.includes('rendetalje') || mailboxLower.includes('info@rendetalje')) {
    return 'rendetalje';
  }
  
  // Secondary: Content analysis
  const foodtruckScore = FOODTRUCK_KEYWORDS.filter(kw => text.includes(kw)).length;
  const tekupScore = TEKUP_KEYWORDS.filter(kw => text.includes(kw)).length;
  const rendetaljeScore = RENDETALJE_KEYWORDS.filter(kw => text.includes(kw)).length;
  
  // Return brand with highest score
  if (foodtruckScore > tekupScore && foodtruckScore > rendetaljeScore) {
    return 'foodtruck';
  }
  
  if (tekupScore > rendetaljeScore) {
    return 'tekup';
  }
  
  // Default to Rendetalje (most common)
  return 'rendetalje';
}

function detectContentType(text: string, subject: string, from: string): { kind: ClassifiedEmail['kind']; confidence: number; sourceHint?: string } {
  let leadScore = 0;
  let operationsScore = 0;
  let serviceScore = 0;
  let irrelevantScore = 0;
  
  // Lead indicators
  const leadIndicators = [
    // Direct lead sources
    { pattern: /leadpoint|leadmail|3match|adhelp/i, weight: 0.8 },
    { pattern: /nyt.*lead|new.*lead|lead.*inquiry/i, weight: 0.7 },
    
    // Booking/inquiry patterns
    { pattern: /forespørgsel|inquiry|tilbud|quote|booking/i, weight: 0.6 },
    { pattern: /interesseret|interested|vil gerne|would like/i, weight: 0.5 },
    
    // Contact information presence
    { pattern: /navn.*:|name.*:|telefon.*:|phone.*:|email.*:/i, weight: 0.4 },
    
    // Service requests
    { pattern: /rengøring|cleaning|catering|it.*support/i, weight: 0.3 },
    { pattern: /hjælp.*med|help.*with|behov.*for|need.*for/i, weight: 0.3 }
  ];
  
  // Operations indicators
  const operationsIndicators = [
    { pattern: /møde|meeting|intern|internal|team/i, weight: 0.6 },
    { pattern: /planlægning|planning|strategi|strategy/i, weight: 0.5 },
    { pattern: /rapport|report|status|opdatering|update/i, weight: 0.4 },
    { pattern: /koordinering|coordination|samarbejde|collaboration/i, weight: 0.4 }
  ];
  
  // Service/support indicators
  const serviceIndicators = [
    { pattern: /problem|issue|fejl|error|virker.*ikke|not.*working/i, weight: 0.7 },
    { pattern: /support|hjælp|help|assistance|bistand/i, weight: 0.6 },
    { pattern: /hvordan|how.*to|vejledning|guidance/i, weight: 0.5 },
    { pattern: /klage|complaint|utilfreds|dissatisfied/i, weight: 0.5 }
  ];
  
  // Irrelevant indicators
  const irrelevantIndicators = [
    { pattern: /spam|reklame|advertisement|promotion/i, weight: 0.8 },
    { pattern: /newsletter|nyhedsbrev|unsubscribe|afmeld/i, weight: 0.7 },
    { pattern: /automatic.*reply|automatisk.*svar|out.*of.*office/i, weight: 0.9 },
    { pattern: /delivery.*failure|levering.*fejl|bounce/i, weight: 0.8 },
    { pattern: /noreply|no-reply|donotreply/i, weight: 0.6 }
  ];
  
  // Calculate scores
  const fullText = `${text} ${subject.toLowerCase()} ${from.toLowerCase()}`;
  leadScore = calculateScore(fullText, leadIndicators);
  operationsScore = calculateScore(fullText, operationsIndicators);
  serviceScore = calculateScore(fullText, serviceIndicators);
  irrelevantScore = calculateScore(fullText, irrelevantIndicators);
  
  // Additional scoring adjustments
  
  // Boost lead score for known lead sources
  const domain = extractDomain(from);
  if (domain && LEAD_DOMAINS.some(d => domain.includes(d))) {
    leadScore += 0.3;
  }
  
  // Reduce lead score for internal communications
  if (isInternalEmail(from, mailbox)) {
    leadScore *= 0.2;
    operationsScore += 0.3;
  }
  
  // Boost irrelevant score for auto-generated emails
  if (isAutoGenerated(from, subject, text)) {
    irrelevantScore += 0.4;
  }
  
  // Determine classification with confidence
  const scores = {
    lead: leadScore,
    operations: operationsScore,
    service: serviceScore,
    irrelevant: irrelevantScore
  };
  
  const maxScore = Math.max(...Object.values(scores));
  const classification = Object.keys(scores).find(key => scores[key] === maxScore) as ClassifiedEmail['kind'];
  
  // Calculate confidence based on score separation
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const confidence = sortedScores[0] > 0 ? 
    Math.min(1, sortedScores[0] + (sortedScores[0] - (sortedScores[1] || 0)) * 0.5) : 
    0.1;
  
  // Detect source for parser routing
  const sourceHint = detectSource(from.toLowerCase(), subject.toLowerCase(), text);
  
  return { kind: classification, confidence, sourceHint };
}

function detectSource(fromLower: string, subjectLower: string, text: string): string | undefined {
  const sources = [
    { name: 'leadpoint', patterns: [/notify@leadpoint\.io/i, /leadpoint/i, /nyt.*rengøringslead/i] },
    { name: 'leadmail', patterns: [/kontakt@leadmail\.no/i, /leadmail/i, /rengøring\.nu/i] },
    { name: '3match', patterns: [/3match/i, /app\.3match\.dk/i] },
    { name: 'adhelp', patterns: [/sp@adhelp\.dk/i, /adhelp/i, /silas.*printz/i] },
    { name: 'form', patterns: [/website.*form/i, /contact.*form/i, /booking.*form/i] }
  ];
  
  const fullText = `${fromLower} ${subjectLower} ${text}`;
  
  for (const source of sources) {
    if (source.patterns.some(pattern => pattern.test(fullText))) {
      return source.name;
    }
  }
  
  return undefined;
}

function calculateScore(text: string, indicators: Array<{ pattern: RegExp; weight: number }>): number {
  return indicators.reduce((score, indicator) => {
    return indicator.pattern.test(text) ? score + indicator.weight : score;
  }, 0);
}

function isInternalEmail(from: string, mailbox: string): boolean {
  // Extract domain from mailbox
  const mailboxDomain = mailbox.split('@')[1]?.toLowerCase();
  const fromDomain = from.split('@')[1]?.toLowerCase();
  
  if (!mailboxDomain || !fromDomain) return false;
  
  // Same domain = internal
  return mailboxDomain === fromDomain;
}

function isAutoGenerated(from: string, subject: string, text: string): boolean {
  const autoIndicators = [
    /noreply|no-reply|donotreply/i,
    /automatic|automatisk/i,
    /delivery.*status|leveringsstatus/i,
    /out.*of.*office|ikke.*på.*kontoret/i,
    /system.*notification|systemnotifikation/i
  ];
  
  const fullText = `${from} ${subject} ${text}`;
  return autoIndicators.some(pattern => pattern.test(fullText));
}

export function classifyEmail(input: RawEmailInput): ClassifiedEmail {
  const subject = input.subject?.toLowerCase() || '';
  const raw = input.rawText?.toLowerCase() || '';
  const from = input.from || '';
  
  // Detect brand first
  const brand = detectBrand(input, raw);
  
  // Detect content type
  const classification = detectContentType(raw, subject, from);
  
  return {
    kind: classification.kind,
    confidence: classification.confidence,
    brand,
    sourceHint: classification.sourceHint
  };
}
