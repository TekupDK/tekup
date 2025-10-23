/**
 * RenOS Calendar Intelligence MCP - Twilio Voice Integration
 * Voice alerts for critical events (overtime, double bookings, missing invoices)
 */

import twilio from 'twilio';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { VoiceAlert } from '../types.js';

let twilioClient: twilio.Twilio | null = null;

/**
 * Initialize Twilio client
 */
export function initTwilio(): twilio.Twilio | null {
  if (twilioClient) return twilioClient;

  if (!config.twilio.isConfigured) {
    logger.warn('Twilio not configured - voice alerts disabled');
    return null;
  }

  try {
    twilioClient = twilio(
      config.twilio.accountSid!,
      config.twilio.authToken!
    );

    logger.info('Twilio client initialized');
    return twilioClient;
  } catch (error) {
    logger.error('Failed to initialize Twilio client', error);
    return null;
  }
}

/**
 * Get Twilio client instance
 */
export function getTwilio(): twilio.Twilio {
  if (!twilioClient) {
    twilioClient = initTwilio();
  }
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  return twilioClient;
}

/**
 * Send voice alert call
 */
export async function sendVoiceAlert(alert: {
  type: VoiceAlert['type'];
  priority: VoiceAlert['priority'];
  message: string;
  recipient?: string;
  relatedEntityId?: string;
}): Promise<VoiceAlert> {
  // Check if voice alerts are enabled
  if (!config.features.voiceAlerts) {
    logger.info('Voice alert skipped (feature disabled)', alert);
    return {
      id: 'dry-run',
      type: alert.type,
      priority: alert.priority,
      recipient: alert.recipient || config.twilio.jonasPhone || '',
      message: alert.message,
      status: 'completed',
      triggeredBy: 'system',
      relatedEntityId: alert.relatedEntityId,
      createdAt: new Date().toISOString(),
    };
  }

  const client = getTwilio();
  const recipient = alert.recipient || config.twilio.jonasPhone;

  if (!recipient) {
    throw new Error('No recipient phone number configured for voice alert');
  }

  // Create TwiML for voice message
  const twiml = `
    <Response>
      <Say voice="alice" language="da-DK">
        ${alert.message}
      </Say>
      <Pause length="2"/>
      <Say voice="alice" language="da-DK">
        Dette er en automatisk besked fra RenOS Calendar Intelligence.
      </Say>
    </Response>
  `.trim();

  try {
    const call = await client.calls.create({
      from: config.twilio.phoneNumber!,
      to: recipient,
      twiml,
    });

    const voiceAlert: VoiceAlert = {
      id: call.sid,
      type: alert.type,
      priority: alert.priority,
      recipient,
      message: alert.message,
      callSid: call.sid,
      status: 'in_progress',
      triggeredBy: 'system',
      relatedEntityId: alert.relatedEntityId,
      createdAt: new Date().toISOString(),
    };

    logger.info('Voice alert sent', {
      callSid: call.sid,
      type: alert.type,
      recipient,
      priority: alert.priority,
    });

    return voiceAlert;
  } catch (error) {
    logger.error('Failed to send voice alert', error, {
      type: alert.type,
      recipient,
    });

    return {
      id: 'failed',
      type: alert.type,
      priority: alert.priority,
      recipient,
      message: alert.message,
      status: 'failed',
      triggeredBy: 'system',
      relatedEntityId: alert.relatedEntityId,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Send overtime alert
 */
export async function sendOvertimeAlert(params: {
  customerName: string;
  currentHours: number;
  estimatedHours: number;
  bookingId: string;
}): Promise<VoiceAlert> {
  const overtimeHours = params.currentHours - params.estimatedHours;
  const message = `
    Overtids-alarm! Kunde ${params.customerName} har nu ${params.currentHours} timer 
    mod forventet ${params.estimatedHours} timer. Det er ${overtimeHours} timer overtid. 
    Ring til kunden nu!
  `.replace(/\s+/g, ' ').trim();

  return sendVoiceAlert({
    type: 'overtime',
    priority: 'urgent',
    message,
    relatedEntityId: params.bookingId,
  });
}

/**
 * Send double booking alert
 */
export async function sendDoubleBookingAlert(params: {
  date: string;
  time: string;
  customerName: string;
}): Promise<VoiceAlert> {
  const message = `
    Kritisk alarm! Dobbeltbooking detekteret den ${params.date} klokken ${params.time}. 
    Kunde ${params.customerName}. Tjek kalenderen straks!
  `.replace(/\s+/g, ' ').trim();

  return sendVoiceAlert({
    type: 'double_booking',
    priority: 'urgent',
    message,
  });
}

/**
 * Send missing invoice alert
 */
export async function sendMissingInvoiceAlert(params: {
  customerName: string;
  bookingDate: string;
  amount: number;
}): Promise<VoiceAlert> {
  const message = `
    Manglende faktura! Kunde ${params.customerName} fra ${params.bookingDate}. 
    Beløb: ${params.amount} kroner. Opret faktura straks!
  `.replace(/\s+/g, ' ').trim();

  return sendVoiceAlert({
    type: 'missing_invoice',
    priority: 'high',
    message,
  });
}

export default {
  initTwilio,
  getTwilio,
  sendVoiceAlert,
  sendOvertimeAlert,
  sendDoubleBookingAlert,
  sendMissingInvoiceAlert,
};

