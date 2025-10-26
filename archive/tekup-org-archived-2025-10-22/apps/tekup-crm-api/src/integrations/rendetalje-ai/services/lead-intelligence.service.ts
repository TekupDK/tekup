import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

export interface LeadData {
  cleaningType: 'weekly' | 'main' | 'move_out' | 'airbnb' | 'commercial' | 'event' | 'after_construction';
  squareMeters?: number;
  rooms?: number;
  bathrooms?: number;
  address?: string;
  desiredDate?: Date;
  customerEmail?: string;
  customerName?: string;
  phoneNumber?: string;
  extras: string[];
  missingCriticalInfo: boolean;
  confidence: number;
  extractedText: {
    original: string;
    normalizedAddress?: string;
    sizeIndicators?: string[];
    urgencyWords?: string[];
    priceReferences?: string[];
  };
}

/**
 * Lead Intelligence Service
 * 
 * Extracts structured data from unstructured email content.
 * Uses pattern matching and NLP to identify:
 * 
 * - Cleaning service type and requirements
 * - Property details (size, rooms, address)
 * - Customer contact information
 * - Desired dates and urgency levels
 * - Special requirements and extras
 * 
 * Designed specifically for Danish cleaning industry patterns and terminology.
 */
@Injectable()
export class LeadIntelligenceService {
  private readonly logger = new Logger(LeadIntelligenceService.name);

  /**
   * Extract lead data from email content
   */
  async extractLeadData(email: { from: string; subject: string; body: string; source: string }): Promise<LeadData> {
    this.logger.debug(`Extracting lead data from ${email.from}`);

    const text = `${email.subject} ${email.body}`.toLowerCase();
    
    const leadData: LeadData = {
      cleaningType: this.detectCleaningType(text),
      squareMeters: this.extractSquareMeters(text),
      rooms: this.extractRooms(text),
      bathrooms: this.extractBathrooms(text),
      address: this.extractAddress(text),
      desiredDate: this.extractDesiredDate(text),
      customerEmail: this.extractCustomerEmail(email),
      customerName: this.extractCustomerName(email),
      phoneNumber: this.extractPhoneNumber(text),
      extras: this.extractExtras(text),
      missingCriticalInfo: false,
      confidence: 0,
      extractedText: {
        original: text,
        normalizedAddress: undefined,
        sizeIndicators: this.findSizeIndicators(text),
        urgencyWords: this.findUrgencyWords(text),
        priceReferences: this.findPriceReferences(text),
      },
    };

    // Determine if critical info is missing
    leadData.missingCriticalInfo = this.hasMissingCriticalInfo(leadData);
    
    // Calculate confidence score
    leadData.confidence = this.calculateConfidence(leadData);

    this.logger.debug(`Extracted: ${leadData.cleaningType}, ${leadData.squareMeters}m², confidence: ${leadData.confidence}%`);
    
    return leadData;
  }

  /**
   * Detect cleaning service type from text
   */
  private detectCleaningType(text: string): LeadData['cleaningType'] {
    // Weekly/regular cleaning patterns
    if (this.containsAny(text, ['ugentlig', 'fast rengøring', 'løbende', 'hver uge', 'regular'])) {
      return 'weekly';
    }

    // Move-out cleaning patterns
    if (this.containsAny(text, ['flyt', 'flytter', 'udflytning', 'fraflytning', 'move out', 'move-out'])) {
      return 'move_out';
    }

    // Airbnb patterns
    if (this.containsAny(text, ['airbnb', 'air bnb', 'udlejning', 'gæster', 'turistudlejning'])) {
      return 'airbnb';
    }

    // Commercial patterns
    if (this.containsAny(text, ['kontor', 'erhverv', 'virksomhed', 'butik', 'klinik', 'office'])) {
      return 'commercial';
    }

    // Event cleaning patterns
    if (this.containsAny(text, ['fest', 'event', 'arrangement', 'party', 'reception'])) {
      return 'event';
    }

    // Construction cleaning patterns
    if (this.containsAny(text, ['byggeri', 'renovation', 'håndværker', 'construction', 'building'])) {
      return 'after_construction';
    }

    // Default to main cleaning (thorough one-time)
    return 'main';
  }

  /**
   * Extract square meters from text
   */
  private extractSquareMeters(text: string): number | undefined {
    // Pattern: number + m2/kvm/sqm
    const patterns = [
      /(\d+(?:,\d+)?)\s*(?:m2|m²|kvm|kvadratmeter|sqm)/gi,
      /(\d+(?:,\d+)?)\s*(?:kvadrat)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const number = parseFloat(match[1].replace(',', '.'));
        if (number > 10 && number < 1000) { // Reasonable range
          return Math.round(number);
        }
      }
    }

    // Fallback: look for room count and estimate
    const rooms = this.extractRooms(text);
    if (rooms) {
      // Rough estimation: 20-40 m² per room in Denmark
      return rooms * 30;
    }

    return undefined;
  }

  /**
   * Extract number of rooms
   */
  private extractRooms(text: string): number | undefined {
    // Patterns for Danish room descriptions
    const patterns = [
      /(\d+)\s*(?:værelse|rum|rooms?)/gi,
      /(\d+)v\b/gi, // "3v" format
      /(\d+)\s*(?:soveværelse|stue)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > 0 && number <= 10) {
          return number;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract number of bathrooms
   */
  private extractBathrooms(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(?:badeværelse|bad|toilet|bathroom)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > 0 && number <= 5) {
          return number;
        }
      }
    }

    // Default assumption for typical Danish homes
    if (this.extractRooms(text)) {
      return 1; // Most homes have at least 1 bathroom
    }

    return undefined;
  }

  /**
   * Extract address from text
   */
  private extractAddress(text: string): string | undefined {
    // Danish address patterns (simplified)
    const patterns = [
      /[A-ZÆØÅ][a-zæøå\s]+[0-9]+(?:[A-Z])?[,\s]+[0-9]{4}\s+[A-ZÆØÅ][a-zæøå\s]+/g, // "Hovedgaden 123, 8000 Aarhus"
      /[A-ZÆØÅ][a-zæøå\s]+[0-9]+[,\s]+[A-ZÆØÅ][a-zæøå\s]+/g, // "Hovedgaden 123, Aarhus"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[0].length > 10) {
        return match[0].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract desired date from text
   */
  private extractDesiredDate(text: string): Date | undefined {
    // Look for urgent indicators first
    if (this.containsAny(text, ['i dag', 'idag', 'asap', 'hurtigst', 'akut'])) {
      return new Date(); // Today
    }

    if (this.containsAny(text, ['i morgen', 'imorgen', 'tomorrow'])) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Look for specific weekdays in Danish
    const weekdays = {
      'mandag': 1, 'tirsdag': 2, 'onsdag': 3, 'torsdag': 4, 'fredag': 5, 'lørdag': 6, 'søndag': 0,
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0,
    };

    for (const [day, dayIndex] of Object.entries(weekdays)) {
      if (text.includes(day)) {
        const nextWeekday = this.getNextWeekday(dayIndex);
        return nextWeekday;
      }
    }

    // Default to next week if no specific date mentioned
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  /**
   * Extract customer email (handle different sources)
   */
  private extractCustomerEmail(email: { from: string; body: string; source: string }): string | undefined {
    // For direct emails, use the from address
    if (email.source === 'direct') {
      return email.from;
    }

    // For lead aggregators, extract customer email from body
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = email.body.match(emailPattern);
    
    if (matches) {
      // Filter out aggregator emails
      const customerEmails = matches.filter(addr => 
        !addr.includes('leadpoint.dk') && 
        !addr.includes('leadmail.no') &&
        !addr.includes('adhelp.dk')
      );
      
      return customerEmails[0];
    }

    return undefined;
  }

  /**
   * Extract customer name from email
   */
  private extractCustomerName(email: { from: string; body: string }): string | undefined {
    // Extract from email display name
    const fromMatch = email.from.match(/^(.+?)\s*<.*>$/);
    if (fromMatch) {
      return fromMatch[1].trim();
    }

    // Look for name patterns in body
    const namePatterns = [
      /navn:?\s*([A-ZÆØÅ][a-zæøå\s]+)/gi,
      /fra:?\s*([A-ZÆØÅ][a-zæøå\s]+)/gi,
      /kontakt:?\s*([A-ZÆØÅ][a-zæøå\s]+)/gi,
    ];

    for (const pattern of namePatterns) {
      const match = email.body.match(pattern);
      if (match && match[1].length > 2) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract phone number from text
   */
  private extractPhoneNumber(text: string): string | undefined {
    // Danish phone number patterns
    const patterns = [
      /(\+45\s?)?([0-9]{2}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2})/g,
      /(\+45\s?)?([0-9]{8})/g,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].replace(/\s/g, '');
      }
    }

    return undefined;
  }

  /**
   * Extract cleaning extras from text
   */
  private extractExtras(text: string): string[] {
    const extras: string[] = [];

    if (this.containsAny(text, ['vinduer', 'windows', 'vindue'])) {
      extras.push('windows');
    }

    if (this.containsAny(text, ['ovn', 'oven', 'komfur'])) {
      extras.push('oven');
    }

    if (this.containsAny(text, ['køleskab', 'fridge', 'refrigerator'])) {
      extras.push('fridge');
    }

    if (this.containsAny(text, ['grundig', 'dyb rengøring', 'deep clean'])) {
      extras.push('deep_clean');
    }

    if (this.containsAny(text, ['have', 'garden', 'terrasse', 'balkon'])) {
      extras.push('garden');
    }

    return extras;
  }

  /**
   * Check if critical information is missing
   */
  private hasMissingCriticalInfo(leadData: LeadData): boolean {
    return !leadData.squareMeters || !leadData.address || !leadData.desiredDate;
  }

  /**
   * Calculate confidence score for extracted data
   */
  private calculateConfidence(leadData: LeadData): number {
    let score = 50; // Base score

    if (leadData.squareMeters) score += 20;
    if (leadData.address) score += 15;
    if (leadData.desiredDate) score += 10;
    if (leadData.customerEmail) score += 10;
    if (leadData.rooms) score += 5;

    // Bonus for complete information
    if (!leadData.missingCriticalInfo) score += 10;

    return Math.min(100, score);
  }

  // Helper methods
  private containsAny(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word.toLowerCase()));
  }

  private findSizeIndicators(text: string): string[] {
    const indicators = ['m2', 'm²', 'kvm', 'kvadratmeter', 'værelse', 'rum'];
    return indicators.filter(indicator => text.includes(indicator));
  }

  private findUrgencyWords(text: string): string[] {
    const urgent = ['asap', 'hurtig', 'akut', 'i dag', 'nu', 'straks'];
    return urgent.filter(word => text.includes(word));
  }

  private findPriceReferences(text: string): string[] {
    const price = ['pris', 'budget', 'cost', 'kr', 'kroner', 'price'];
    return price.filter(word => text.includes(word));
  }

  private getNextWeekday(targetDay: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  }
}