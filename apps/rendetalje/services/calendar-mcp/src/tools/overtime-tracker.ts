/**
 * RenOS Calendar Intelligence MCP - Overtime Tracker Tool
 * Tool 4: track_overtime_risk
 * Live alerts efter +1 time overtid - stopper Vinni/Kate situationer!
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { TrackOvertimeRiskSchema, OvertimeLog, CommunicationEntry } from '../types.js';
import { createOvertimeLog, updateOvertimeLog, getOvertimeLog } from '../integrations/database.js';
import { sendOvertimeAlert } from '../integrations/twilio-voice.js';
import config from '../config.js';

/**
 * Tool 4: Track Overtime Risk
 * Monitor job duration and send alerts when overtime threshold is exceeded
 */
export async function trackOvertimeRisk(
  input: z.infer<typeof TrackOvertimeRiskSchema>
): Promise<{
  status: 'ok' | 'warning' | 'alert';
  overtimeMinutes: number;
  alertSent: boolean;
  message: string;
  log?: OvertimeLog;
}> {
  logger.info('Tracking overtime risk', input);

  const overtimeMinutes = input.currentDuration - input.estimatedDuration;
  const overtimeHours = overtimeMinutes / 60;

  // Check if we've exceeded the alert threshold
  const exceedsThreshold = overtimeMinutes >= config.business.overtimeAlertThresholdMinutes;

  // Get or create overtime log
  let overtimeLog = await getOvertimeLog(input.bookingId);

  if (!overtimeLog) {
    // Create new overtime log
    overtimeLog = await createOvertimeLog({
      bookingId: input.bookingId,
      customerId: 'placeholder', // TODO: Get from booking
      customerName: 'Placeholder Customer', // TODO: Get from booking
      estimatedHours: input.estimatedDuration / 60,
      actualHours: input.currentDuration / 60,
      overtimeHours: overtimeHours > 0 ? overtimeHours : undefined,
      startTime: new Date().toISOString(),
      customerNotified: false,
      communicationLog: [],
    });
  }

  let alertSent = false;
  let status: 'ok' | 'warning' | 'alert' = 'ok';
  let message = `Job på plan: ${input.currentDuration} minutter af ${input.estimatedDuration} minutter`;

  if (exceedsThreshold) {
    status = 'alert';
    message = `OVERTIDS-ALARM! ${overtimeMinutes} minutter overtid (${overtimeHours.toFixed(1)} timer)`;

    // Only send alert if not already sent
    if (!overtimeLog.alertSentAt) {
      try {
        const voiceAlert = await sendOvertimeAlert({
          customerName: overtimeLog.customerName,
          currentHours: input.currentDuration / 60,
          estimatedHours: input.estimatedDuration / 60,
          bookingId: input.bookingId,
        });

        // Update log with alert info
        const commEntry: CommunicationEntry = {
          timestamp: new Date().toISOString(),
          type: 'call',
          direction: 'outgoing',
          content: `Voice alert sent: ${voiceAlert.message}`,
          outcome: voiceAlert.status === 'completed' ? 'success' : 'failed',
        };

        overtimeLog = await updateOvertimeLog(overtimeLog.id, {
          alertSentAt: new Date().toISOString(),
          alertMethod: 'voice',
          communicationLog: [...overtimeLog.communicationLog, commEntry],
          actualHours: input.currentDuration / 60,
          overtimeHours,
        });

        alertSent = true;

        logger.warn('Overtime alert sent via voice call', {
          bookingId: input.bookingId,
          overtimeMinutes,
          callStatus: voiceAlert.status,
        });
      } catch (error) {
        logger.error('Failed to send overtime alert', error, {
          bookingId: input.bookingId,
        });
      }
    } else {
      logger.info('Overtime alert already sent for this booking', {
        bookingId: input.bookingId,
        alertSentAt: overtimeLog.alertSentAt,
      });
      alertSent = true; // Consider it sent since we already alerted once
    }
  } else if (overtimeMinutes > 0) {
    status = 'warning';
    message = `Overtid begyndt: ${overtimeMinutes} minutter over estimat (threshold: ${config.business.overtimeAlertThresholdMinutes} min)`;
  }

  // Update log with current status
  if (overtimeLog) {
    await updateOvertimeLog(overtimeLog.id, {
      actualHours: input.currentDuration / 60,
      overtimeHours: overtimeHours > 0 ? overtimeHours : undefined,
    });
  }

  logger.info('Overtime tracking complete', {
    bookingId: input.bookingId,
    status,
    overtimeMinutes,
    alertSent,
  });

  return {
    status,
    overtimeMinutes,
    alertSent,
    message,
    log: overtimeLog,
  };
}

/**
 * Log customer communication about overtime
 */
export async function logOvertimeCommunication(params: {
  bookingId: string;
  type: CommunicationEntry['type'];
  direction: CommunicationEntry['direction'];
  content: string;
  outcome?: string;
}): Promise<void> {
  const log = await getOvertimeLog(params.bookingId);
  
  if (!log) {
    logger.warn('Cannot log communication - no overtime log exists', {
      bookingId: params.bookingId,
    });
    return;
  }

  const entry: CommunicationEntry = {
    timestamp: new Date().toISOString(),
    type: params.type,
    direction: params.direction,
    content: params.content,
    outcome: params.outcome,
  };

  await updateOvertimeLog(log.id, {
    communicationLog: [...log.communicationLog, entry],
    customerNotified: true,
    customerResponse: params.direction === 'incoming' ? params.content : log.customerResponse,
  });

  logger.info('Overtime communication logged', {
    bookingId: params.bookingId,
    type: params.type,
  });
}

export default {
  trackOvertimeRisk,
  logOvertimeCommunication,
};

