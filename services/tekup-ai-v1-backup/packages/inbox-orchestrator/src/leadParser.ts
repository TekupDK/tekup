export interface Lead {
  name: string;
  source: 'Rengøring.nu' | 'Rengøring Aarhus' | 'AdHelp' | 'Ukendt';
  type: 'Fast' | 'Flytterengøring' | 'Hovedrengøring' | 'Engangsopgave' | 'Ukendt';
  address: string;
  contact: {
    email: string;
    phone: string;
  };
  bolig: {
    sqm: number;
    rooms?: number;
    type: string;
  };
  status: 'Needs Reply' | 'Tilbud sendt' | 'Afventer svar' | 'Bekræftet';
  statusDetails?: string;
  threadRef: string;
  price?: string;
  // Memory-based fields
  replyStrategy?: 'CREATE_NEW_EMAIL' | 'DIRECT_TO_CUSTOMER' | 'REPLY_DIRECT';
  replyTo?: string;
  priceEstimate?: PriceEstimate;
}

export interface PriceEstimate {
  minHours: number;
  maxHours: number;
  workers: number;
  minPrice: number;
  maxPrice: number;
  formatted: string;
}

export function parseLeadFromThread(thread: any): Lead {
  const messages = thread.messages || [];
  if (messages.length === 0) {
    return {
      name: thread.subject || 'Ukendt',
      source: 'Ukendt',
      type: 'Ukendt',
      address: '',
      contact: { email: '', phone: '' },
      bolig: { sqm: 0, type: 'Ukendt' },
      status: 'Needs Reply',
      threadRef: thread.id,
    };
  }

  const firstMessage = messages[0];
  const fromHeader = firstMessage.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
  const bodyText = extractBodyText(firstMessage);

  // Extract source from sender
  const source = extractSource(fromHeader);

  // Extract name
  const name = extractName(thread.subject || '', bodyText, source);

  // Extract contact details
  const contact = extractContact(bodyText, fromHeader);

  // Extract bolig details
  const bolig = extractBolig(bodyText);

  // Extract type
  const type = extractType(bodyText);

  // Extract address
  const address = extractAddress(bodyText);

  // Extract price
  const price = extractPrice(bodyText);

  // Determine status
  const status = determineStatus(thread, messages);

  const lead: Lead = {
    name,
    source,
    type,
    address,
    contact,
    bolig,
    status: status.status,
    statusDetails: status.details,
    threadRef: thread.id,
    price,
  };

  // Apply memory-based rules
  applyLeadSourceRules(lead);
  lead.priceEstimate = calculatePrice(lead);

  return lead;
}

// MEMORY_4: Lead Source Rules - reply strategy
export function applyLeadSourceRules(lead: Lead): void {
  // Rengøring.nu må ALDRIG svares direkte på (MEMORY_4)
  if (lead.source === 'Rengøring.nu') {
    lead.replyStrategy = 'CREATE_NEW_EMAIL';
    lead.replyTo = lead.contact.email; // NOT leadmail.no, send to customer directly
  }
  // AdHelp: Send ALTID til kundens email
  else if (lead.source === 'AdHelp') {
    lead.replyStrategy = 'DIRECT_TO_CUSTOMER';
    lead.replyTo = lead.contact.email; // NOT mw@adhelp.dk
  }
  // Leadpoint: Kan svares direkte
  else if (lead.source === 'Rengøring Aarhus') {
    lead.replyStrategy = 'REPLY_DIRECT';
    lead.replyTo = undefined; // Reply in thread
  }
}

// MEMORY_23: Price Calculation - 349 kr/t inkl. moms
export function calculatePrice(lead: Lead): PriceEstimate {
  const HOURLY_RATE = 349; // kr/t inkl. moms (MEMORY_23)
  
  // Estimate based on sqm
  let estimatedHours = 0;
  
  if (lead.bolig.sqm < 100) {
    estimatedHours = 2;
  } else if (lead.bolig.sqm < 150) {
    estimatedHours = 3;
  } else if (lead.bolig.sqm < 200) {
    estimatedHours = 4;
  } else {
    estimatedHours = Math.ceil(lead.bolig.sqm / 50);
  }
  
  // 2 workers for larger properties (>150 m²)
  const workers = lead.bolig.sqm > 150 ? 2 : 1;
  
  const minPrice = estimatedHours * workers * HOURLY_RATE;
  const maxPrice = (estimatedHours + 1) * workers * HOURLY_RATE;
  
  return {
    minHours: estimatedHours,
    maxHours: estimatedHours + 1,
    workers,
    minPrice,
    maxPrice,
    formatted: `${minPrice}-${maxPrice} kr (${workers} pers, ${estimatedHours}-${estimatedHours + 1}t)`,
  };
}

function extractSource(from: string): Lead['source'] {
  if (from.includes('leadmail.no') || from.includes('rengøring.nu')) return 'Rengøring.nu';
  if (from.includes('leadpoint.dk') || from.includes('rengøring aarhus')) return 'Rengøring Aarhus';
  if (from.includes('adhelp.dk')) return 'AdHelp';
  return 'Ukendt';
}

function extractName(subject: string, body: string, _source: Lead['source']): string {
  // From subject: "Rene Fly Jensen fra Rengøring.nu" or "Re: Rene Fly Jensen..."
  const subjectMatch = subject.match(/^(?:Re: )?(.+?)\s+fra\s+Rengøring/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  // From body: "Navn: Rene Fly Jensen" or "Navn\nRene Fly Jensen"
  const namePatterns = [
    /Navn[\s:]+([^\n\r]+)/i,
    /Kundenavn[\s:]+([^\n\r]+)/i,
    /Navn\s*:\s*([^\n\r]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = body.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: try to extract from first line
  const firstLine = body.split('\n')[0]?.trim();
  if (firstLine && firstLine.length < 100 && !firstLine.includes('@')) {
    return firstLine;
  }

  return 'Ukendt kunde';
}

function extractContact(body: string, fromHeader: string): Lead['contact'] {
  const email = extractEmail(body, fromHeader);
  const phone = extractPhone(body);

  return { email, phone };
}

function extractEmail(body: string, fromHeader: string): string {
  // From body: "Email: refj@dalgas.com" or "E-mail\nrefj@dalgas.com"
  const emailPatterns = [
    /(?:Email|E-mail|Mail)[\s:]+([^\s\n\r]+@[^\s\n\r]+)/i,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  ];

  for (const pattern of emailPatterns) {
    const match = body.match(pattern);
    if (match) {
      const email = match[1] || match[0];
      // Skip rendetalje emails
      if (!email.includes('rendetalje') && !email.includes('@rendetalje')) {
        return email.trim();
      }
    }
  }

  // Extract from From header if it's a customer email
  if (fromHeader) {
    const emailMatch = fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !emailMatch[1].includes('rendetalje')) {
      return emailMatch[1];
    }
  }

  return '';
}

function extractPhone(body: string): string {
  // Danish phone patterns: "51 13 01 49" or "+45 51 13 01 49" or "4560225479"
  const phonePatterns = [
    /(?:Telefon|Mobil|Telefonnummer|Tlf)[\s:]+([0-9\s\+\-()]+)/i,
    /(\+?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2})/,
    /(\d{8,10})/,
  ];

  for (const pattern of phonePatterns) {
    const match = body.match(pattern);
    if (match) {
      const phone = match[1].replace(/[\s\-()]/g, '');
      // Skip if it's a postal code (4 digits)
      if (phone.length >= 8) {
        return phone;
      }
    }
  }

  return '';
}

function extractBolig(body: string): Lead['bolig'] {
  // "Bolig: 230 m²" or "230m2" or "230 kvadratmeter"
  const sqmPatterns = [
    /(?:Bolig|Størrelse|Areal)[\s:]+(\d+)\s*(?:m²|m2|kvm|kvadratmeter)/i,
    /(\d+)\s*(?:m²|m2|kvm|kvadratmeter)/i,
  ];

  let sqm = 0;
  for (const pattern of sqmPatterns) {
    const match = body.match(pattern);
    if (match) {
      sqm = parseInt(match[1]);
      break;
    }
  }

  // Type bolig
  let type = 'Ukendt';
  if (/villa/i.test(body)) type = 'Villa';
  else if (/lejlighed|apartment/i.test(body)) type = 'Lejlighed';
  else if (/hus|house/i.test(body)) type = 'Hus';
  else if (/rækkehus/i.test(body)) type = 'Rækkehus';

  // Antal rum
  const roomsMatch = body.match(/(\d+)\s*(?:rum|rooms)/i);
  const rooms = roomsMatch ? parseInt(roomsMatch[1]) : undefined;

  return { sqm, type, rooms };
}

function extractType(body: string): Lead['type'] {
  const lowerBody = body.toLowerCase();
  
  if (/fast rengøring|ugentlig|hver uge|weekly/i.test(lowerBody)) return 'Fast';
  if (/flytterengøring|flytter|move/i.test(lowerBody)) return 'Flytterengøring';
  if (/hovedrengøring|grundig/i.test(lowerBody)) return 'Hovedrengøring';
  
  return 'Engangsopgave';
}

function extractAddress(body: string): string {
  // "Adresse: Ahornvej 1, 9310 Hadsten"
  const addressPatterns = [
    /Adresse[\s:]+([^\n\r]+)/i,
    /Address[\s:]+([^\n\r]+)/i,
  ];

  // First try explicit "Adresse:" patterns
  for (const pattern of addressPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      let addr = match[1].trim();
      // Remove email domains that might be parsed as addresses
      addr = addr.replace(/\.com[\s\n]*/gi, '').replace(/@[^\s]+/gi, '');
      // Validate: should contain street keywords or postal code format
      if (addr && !isPhoneNumber(addr) && addr.length > 5 && !/^[a-z0-9]+\.(com|dk|net)$/i.test(addr)) {
        // Clean up: remove leading numbers/email fragments
        addr = addr.replace(/^[\d\s]+/, '').replace(/^[a-z0-9@\.]+[\s\n]+/i, '');
        if (addr.length > 5) {
          return addr;
        }
      }
    }
  }

  // Pattern: "Street + number, zipcode City"
  // Must include street keywords (vej, gade, plads, etc.) to avoid matching phone numbers
  const streetPattern = /([A-Za-zæøåÆØÅ\s]+(?:vej|gade|stræde|plads|alle|boulevard|torv|park|skov|strand)[\s\d]*\d+[A-Za-z]?),?\s*(\d{4})\s+([A-Za-zæøåÆØÅ\s]+)/i;
  const streetMatch = body.match(streetPattern);
  if (streetMatch && streetMatch.length === 4) {
    return `${streetMatch[1]}, ${streetMatch[2]} ${streetMatch[3]}`.trim();
  }

  // Fallback: Any pattern with postal code (4 digits) but validate it's not just numbers
  const fallbackPattern = /([A-Za-zæøåÆØÅ\s]+\d+[A-Za-z]?),?\s*(\d{4})\s+([A-Za-zæøåÆØÅ\s]+)/;
  const fallbackMatch = body.match(fallbackPattern);
  if (fallbackMatch && fallbackMatch.length === 4) {
    const street = fallbackMatch[1].trim();
    // Skip if it looks like a phone number (mostly digits)
    if (!isPhoneNumber(street) && /[A-Za-zæøåÆØÅ]{3,}/.test(street)) {
      return `${street}, ${fallbackMatch[2]} ${fallbackMatch[3]}`.trim();
    }
  }

  return '';
}

function isPhoneNumber(text: string): boolean {
  // Check if text is primarily digits (phone number)
  const digitsOnly = text.replace(/[\s\-+()]/g, '');
  // If >70% digits or matches phone patterns, it's likely a phone number
  if (digitsOnly.length >= 8 && /^\d+$/.test(digitsOnly)) return true;
  if (/^\+?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/.test(text.trim())) return true;
  if (/^\d{8,10}$/.test(digitsOnly)) return true;
  return false;
}

function extractPrice(body: string): string | undefined {
  // "Pris: 2.094-2.792 kr" or "2.500 kr" or "349 kr/time"
  const pricePatterns = [
    /(?:Pris|Price)[\s:]+([\d\.,\-\s]+)\s*kr/i,
    /(\d+(?:[\.,]\d+)?(?:[\-–]\d+(?:[\.,]\d+)?)?)\s*kr/i,
  ];

  for (const pattern of pricePatterns) {
    const match = body.match(pattern);
    if (match) {
      return match[1].trim() + ' kr';
    }
  }

  return undefined;
}

function determineStatus(_thread: any, messages: any[]): { status: Lead['status']; details?: string } {
  if (messages.length === 1) {
    return { status: 'Needs Reply', details: undefined };
  }

  // Find replies from rendetalje
  const rendetaljeEmails = ['info@rendetalje.dk', 'rendetalje'];
  const yourReplies = messages.filter((m: any) => {
    const from = m.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
    return rendetaljeEmails.some(email => from.toLowerCase().includes(email));
  });

  if (yourReplies.length === 0) {
    return { status: 'Needs Reply', details: undefined };
  }

  // Get last reply date
  const lastReply = yourReplies[yourReplies.length - 1];
  const dateHeader = lastReply.payload?.headers?.find((h: any) => h.name === 'Date')?.value;
  if (!dateHeader) {
    return { status: 'Tilbud sendt', details: undefined };
  }

  const replyDate = new Date(dateHeader);
  const now = new Date();
  const isToday = replyDate.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = replyDate.toDateString() === yesterday.toDateString();

  const timeStr = `${String(replyDate.getHours()).padStart(2, '0')}:${String(replyDate.getMinutes()).padStart(2, '0')}`;
  
  let details = '';
  if (isToday) details = `i dag kl. ${timeStr}`;
  else if (isYesterday) details = `i går kl. ${timeStr}`;
  else details = `d. ${replyDate.getDate()}/${replyDate.getMonth() + 1} kl. ${timeStr}`;

  // Check if customer replied after our last reply
  const lastReplyIndex = messages.indexOf(lastReply);
  const customerRepliesAfter = messages.slice(lastReplyIndex + 1).filter((m: any) => {
    const from = m.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
    return !rendetaljeEmails.some(email => from.toLowerCase().includes(email));
  });

  if (customerRepliesAfter.length > 0) {
    return { status: 'Needs Reply', details };
  }

  return { status: 'Tilbud sendt', details };
}

function extractBodyText(message: any): string {
  let text = '';

  // Try to get plain text from payload
  const payload = message.payload;
  if (!payload) return '';

  // If plain text part exists
  if (payload.body?.data) {
    text += Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  // If multipart, look for text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        // Fallback to HTML and strip tags
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        text += stripHtml(html);
      }
    }
  }

  return text;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
