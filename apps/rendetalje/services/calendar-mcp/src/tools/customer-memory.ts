/**
 * RenOS Calendar Intelligence MCP - Customer Memory Tool
 * Tool 5: get_customer_memory
 * Husker ALT - "Jes = kun mandage", "nøgle under potte", etc.
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { GetCustomerMemorySchema, CustomerIntelligence } from '../types.js';
import { getCustomerIntelligence, searchCustomersByName } from '../integrations/supabase.js';

/**
 * Tool 5: Get Customer Memory
 * Retrieve complete customer intelligence including patterns, preferences, and history
 */
export async function getCustomerMemory(
  input: z.infer<typeof GetCustomerMemorySchema>
): Promise<{
  found: boolean;
  intelligence?: CustomerIntelligence;
  suggestions?: string[];
  message: string;
}> {
  logger.info('Getting customer memory', input);

  try {
    let intelligence: CustomerIntelligence | null = null;

    // Try to get by customer ID first
    if (input.customerId) {
      intelligence = await getCustomerIntelligence(input.customerId);
    }

    // If not found by ID, try fuzzy search by name
    if (!intelligence && input.customerName) {
      const searchResults = await searchCustomersByName(input.customerName);
      
      if (searchResults.length > 0) {
        intelligence = searchResults[0]!; // Take best match
        
        if (searchResults.length > 1) {
          logger.info('Multiple customers found by name', {
            searchName: input.customerName,
            resultCount: searchResults.length,
          });
        }
      }
    }

    if (!intelligence) {
      return {
        found: false,
        message: input.customerId 
          ? `Ingen kunde-intelligence fundet for ID: ${input.customerId}`
          : `Ingen kunde fundet med navn: ${input.customerName}`,
      };
    }

    // Generate helpful suggestions based on intelligence
    const suggestions = generateSuggestions(intelligence);

    logger.info('Customer intelligence retrieved', {
      customerId: intelligence.customerId,
      customerName: intelligence.customerName,
      hasFixedSchedule: !!intelligence.fixedSchedule,
      totalBookings: intelligence.totalBookings,
      riskScore: intelligence.riskScore,
    });

    return {
      found: true,
      intelligence,
      suggestions,
      message: `Kunde-intelligence for ${intelligence.customerName} hentet succesfuldt`,
    };
  } catch (error) {
    logger.error('Failed to get customer memory', error, input);
    
    return {
      found: false,
      message: `Fejl ved hentning af kunde-intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate helpful suggestions based on customer intelligence
 */
function generateSuggestions(intelligence: CustomerIntelligence): string[] {
  const suggestions: string[] = [];

  // Access notes
  if (intelligence.accessNotes) {
    suggestions.push(`📍 Adgang: ${intelligence.accessNotes}`);
  }

  if (intelligence.parkingInstructions) {
    suggestions.push(`🚗 Parkering: ${intelligence.parkingInstructions}`);
  }

  if (intelligence.specialInstructions) {
    suggestions.push(`⚠️ Special: ${intelligence.specialInstructions}`);
  }

  // Fixed schedule
  if (intelligence.fixedSchedule) {
    const dayNames = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    const dayName = dayNames[intelligence.fixedSchedule.dayOfWeek];
    suggestions.push(
      `📅 Fast rytme: ${dayName} kl. ${intelligence.fixedSchedule.time} (${intelligence.fixedSchedule.confidence}% sikker)`
    );
  }

  // Preferred days
  if (intelligence.preferences.preferredDays && intelligence.preferences.preferredDays.length > 0) {
    const dayNames = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
    const preferred = intelligence.preferences.preferredDays.map(d => dayNames[d]).join(', ');
    suggestions.push(`💚 Foretrukne dage: ${preferred}`);
  }

  // Communication style
  if (intelligence.preferences.communicationStyle) {
    suggestions.push(`💬 Kommunikation: ${intelligence.preferences.communicationStyle}`);
  }

  if (intelligence.preferences.confirmationRequired) {
    suggestions.push(`✅ VIGTIGT: Bekræft altid ugedag med denne kunde!`);
  }

  // Weekend preference
  if (intelligence.preferences.avoidWeekends) {
    suggestions.push(`🚫 Undgår weekender - book IKKE lørdag/søndag`);
  }

  // History insights
  if (intelligence.totalBookings > 0) {
    const completionRate = (intelligence.completedBookings / intelligence.totalBookings) * 100;
    suggestions.push(
      `📊 ${intelligence.totalBookings} bookinger, ${completionRate.toFixed(0)}% gennemført`
    );
  }

  if (intelligence.averageJobDuration > 0) {
    suggestions.push(
      `⏱️ Typisk varighed: ${intelligence.averageJobDuration.toFixed(1)} timer`
    );
  }

  // Risk assessment
  if (intelligence.riskScore > 50) {
    suggestions.push(`⚠️ RISIKO-KUNDE (score: ${intelligence.riskScore}) - vær ekstra opmærksom`);
    
    if (intelligence.riskFactors.length > 0) {
      suggestions.push(`Risikofaktorer: ${intelligence.riskFactors.join(', ')}`);
    }
  }

  // Financial
  if (intelligence.outstandingInvoices > 0) {
    suggestions.push(`💰 ${intelligence.outstandingInvoices} ubetalte fakturaer`);
  }

  if (intelligence.paymentHistory === 'poor' || intelligence.paymentHistory === 'fair') {
    suggestions.push(`💳 Betalingshistorik: ${intelligence.paymentHistory} - kræv forudbetaling?`);
  }

  // Quality
  if (intelligence.satisfactionScore) {
    const stars = '⭐'.repeat(Math.round(intelligence.satisfactionScore));
    suggestions.push(`${stars} Tilfredshed: ${intelligence.satisfactionScore}/5`);
  }

  if (intelligence.complaints > 0) {
    suggestions.push(`⚠️ ${intelligence.complaints} klager - håndter med ekstra omhu`);
  }

  if (intelligence.praises > 0) {
    suggestions.push(`👏 ${intelligence.praises} roser - loyal kunde!`);
  }

  // Revenue insights
  if (intelligence.totalRevenue > 0) {
    suggestions.push(
      `💵 Total omsætning: ${intelligence.totalRevenue.toLocaleString('da-DK')} kr (gns. ${intelligence.averageBookingValue.toLocaleString('da-DK')} kr/booking)`
    );
  }

  return suggestions;
}

/**
 * Format customer intelligence for display
 */
export function formatCustomerIntelligence(intelligence: CustomerIntelligence): string {
  const sections = [];

  // Header
  sections.push(`👤 ${intelligence.customerName}`);
  sections.push(`📊 ${intelligence.totalBookings} bookinger | ⭐ ${intelligence.satisfactionScore || 'N/A'}/5`);
  sections.push('');

  // Access & Logistics
  if (intelligence.accessNotes || intelligence.parkingInstructions) {
    sections.push('📍 ADGANG & LOGISTIK:');
    if (intelligence.accessNotes) sections.push(`  ${intelligence.accessNotes}`);
    if (intelligence.parkingInstructions) sections.push(`  ${intelligence.parkingInstructions}`);
    if (intelligence.specialInstructions) sections.push(`  ⚠️ ${intelligence.specialInstructions}`);
    sections.push('');
  }

  // Fixed Schedule
  if (intelligence.fixedSchedule) {
    const dayNames = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    sections.push('📅 FAST RYTME:');
    sections.push(`  ${dayNames[intelligence.fixedSchedule.dayOfWeek]} kl. ${intelligence.fixedSchedule.time}`);
    sections.push(`  Confidence: ${intelligence.fixedSchedule.confidence}%`);
    sections.push('');
  }

  // Preferences
  if (Object.keys(intelligence.preferences).length > 0) {
    sections.push('💚 PRÆFERENCER:');
    if (intelligence.preferences.communicationStyle) {
      sections.push(`  Kommunikation: ${intelligence.preferences.communicationStyle}`);
    }
    if (intelligence.preferences.confirmationRequired) {
      sections.push(`  ✅ BEKRÆFT ALTID UGEDAG!`);
    }
    if (intelligence.preferences.avoidWeekends) {
      sections.push(`  🚫 ALDRIG weekend`);
    }
    sections.push('');
  }

  // Risk Assessment
  if (intelligence.riskScore > 0) {
    sections.push('⚠️ RISIKO-VURDERING:');
    sections.push(`  Score: ${intelligence.riskScore}/100 ${intelligence.riskScore > 50 ? '(HØJ RISIKO!)' : ''}`);
    if (intelligence.riskFactors.length > 0) {
      sections.push(`  Faktorer: ${intelligence.riskFactors.join(', ')}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

export default {
  getCustomerMemory,
  generateSuggestions,
  formatCustomerIntelligence,
};

