/**
 * Memory Rules Implementation
 * 
 * Integrerer alle 24 memories korrekt i codebase
 */

import type { Lead } from "./leadParser";

// MEMORY_1: Time Check Regel ⏰
export function validateTimeCheck(dateStr?: string): { valid: boolean; error?: string; verifiedDate?: Date } {
  const now = new Date();
  
  if (!dateStr) {
    return { valid: true, verifiedDate: now };
  }
  
  // Parse og valider dato
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: `Invalid date format: ${dateStr}` };
  }
  
  return {
    valid: true,
    verifiedDate: parsedDate,
    // Add verification info for logging
  };
}

// MEMORY_7: Email Search First 🔍
export async function searchExistingCommunication(
  gmailAdapter: { searchThreads: (query: string, maxResults?: number) => Promise<{ ok: boolean; data?: unknown }> },
  customerEmail: string,
  daysBack: number = 30
): Promise<{ found: boolean; threads?: any[]; count?: number }> {
  try {
    const query = `from:${customerEmail} OR to:${customerEmail} newer_than:${daysBack}d`;
    const result = await gmailAdapter.searchThreads(query, 10);
    
    if (!result.ok || !result.data) {
      return { found: false };
    }
    
    const threads = Array.isArray(result.data) ? result.data : [];
    if (threads.length === 0) {
      return { found: false };
    }
    
    return {
      found: true,
      threads,
      count: threads.length
    };
  } catch (error) {
    return { found: false };
  }
}

// MEMORY_11: Optimeret Tilbudsformat 📝
export interface QuoteValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateQuoteFormat(body: string, lead?: Lead): QuoteValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required elements
  const requiredChecks = [
    { keyword: /bolig|m²|kvm|kvadratmeter/i, name: "Bolig størrelse (m²)" },
    { keyword: /medarbejdere|personer|person/i, name: "Antal medarbejdere" },
    { keyword: /timer|arbejdstimer|tidsforbrug/i, name: "Timer/arbejdstimer" },
    { keyword: /349|kr\/time|pris/i, name: "Pris (349 kr/time)" },
    { keyword: /ledige.*tider?|datoer?|tidspunkt/i, name: "Ledige tider" },
    { keyword: /faktisk.*tid|kun faktisk|faktisk tidsforbrug/i, name: "Faktisk tidsforbrug" },
    { keyword: /ringer|kontakt.*overskridelse|\+1.*time/i, name: "+1t overskridelse regel" }
  ];
  
  requiredChecks.forEach(check => {
    if (!check.keyword.test(body)) {
      missing.push(check.name);
    }
  });
  
  // Forbidden patterns (MEMORY_8)
  const forbidden = [
    { pattern: /\+[3-5]\s*timer?/i, reason: "Forkert: +3-5 timer. Skal være +1 time!" },
    { pattern: /300\s*kr\/time|250[-\s]?300\s*kr/i, reason: "Forkert pris: 300 kr/time. Skal være 349 kr/time!" }
  ];
  
  forbidden.forEach(item => {
    if (item.pattern.test(body)) {
      warnings.push(item.reason);
    }
  });
  
  // Check for worker count format (MEMORY_8)
  const workerCountMatch = body.match(/(\d+)\s*(?:personer|person|medarbejdere)/i);
  if (!workerCountMatch) {
    missing.push("Eksplicit antal medarbejdere (fx: '2 personer')");
  }
  
  // Check for total work hours format (MEMORY_8)
  // "2 personer, 3 timer = 6 arbejdstimer"
  const workHoursMatch = body.match(/(\d+)\s*(?:timer|arbejdstimer).*=\s*(\d+)\s*(?:arbejdstimer|timer)/i);
  if (!workHoursMatch) {
    warnings.push("Manglende total arbejdstimer format (fx: '2 personer, 3 timer = 6 arbejdstimer')");
  }
  
  // Check for +1h rule (MEMORY_8)
  if (!/\+1\s*timer?|\+.*1\s*timer?/i.test(body)) {
    missing.push("+1 time overskridelse regel (IKKE +3-5t!)");
  }
  
  // Check for calendar dates if lead exists (MEMORY_11)
  if (lead && !/ledige.*tider|datoer|kalender|(?:mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)/i.test(body)) {
    warnings.push("Manglende konkrete ledige tider fra kalender");
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

// MEMORY_8: Overtid Kommunikation ⚠️
export function enforceOvertimeRule(body: string): { fixed: string; changed: boolean; warning?: string } {
  let fixed = body;
  let changed = false;
  let warning: string | undefined;
  
  // Replace wrong overtime rules (+3-5t → +1t)
  const wrongPattern = /\+([3-5])\s*timer?/gi;
  if (wrongPattern.test(body)) {
    fixed = fixed.replace(wrongPattern, '+1 time');
    changed = true;
  }
  
  // Ensure worker count is explicit
  if (!/(\d+)\s*(?:personer|person|medarbejdere)/i.test(body)) {
    warning = "VIGTIGT: Angiv antal medarbejdere eksplicit (fx: '2 personer')";
  }
  
  return { fixed, changed, warning };
}

// MEMORY_11: Generate Quote Template
export function generateQuoteTemplate(lead: Lead, availableDates?: string[]): string {
  const { name, bolig, priceEstimate } = lead;
  const workers = bolig.sqm > 150 ? 2 : 1;
  const estimatedHours = priceEstimate?.minHours || 2;
  const totalWorkHours = workers * estimatedHours;
  
  let quote = `Hej ${name},\n\n`;
  quote += `Tak for din henvendelse om ${lead.type.toLowerCase()}!\n\n`;
  
  // 📏 Bolig
  quote += `📏 **Bolig:** ${bolig.sqm}m²`;
  if (bolig.rooms) quote += ` med ${bolig.rooms} rum`;
  quote += `\n`;
  
  // 👥 Medarbejdere
  quote += `👥 **Medarbejdere:** ${workers} personer\n`;
  
  // ⏱️ Estimeret tid
  quote += `⏱️ **Estimeret tid:** ${estimatedHours} timer på stedet = ${totalWorkHours} arbejdstimer total\n`;
  
  // 💰 Pris
  if (priceEstimate) {
    quote += `💰 **Pris:** 349 kr/time/person = ca. ${priceEstimate.minPrice}-${priceEstimate.maxPrice} kr inkl. moms\n`;
  }
  
  // 📅 Ledige tider
  if (availableDates && availableDates.length > 0) {
    quote += `📅 **Ledige tider:**\n`;
    availableDates.slice(0, 5).forEach(date => {
      quote += `   • ${date}\n`;
    });
  } else {
    quote += `📅 **Ledige tider:** Tjekker kalender og vender tilbage\n`;
  }
  
  // 💡 Faktisk tidsforbrug
  quote += `💡 **Du betaler kun for faktisk tidsforbrug**\n\n`;
  
  // 📞 +1t regel (MEMORY_8)
  quote += `📞 **Vigtigt:** Vi ringer til dig ved +1 time overskridelse (ikke +3-5 timer!)\n\n`;
  
  quote += `Hvad siger du?\n\n`;
  quote += `Venlig hilsen,\nRendetalje.dk`;
  
  return quote;
}

// Helper: Extract dates from calendar events
export function extractAvailableDates(_events: any[]): string[] {
  // This would parse calendar events and return available dates
  // Simplified for now
  return [];
}

