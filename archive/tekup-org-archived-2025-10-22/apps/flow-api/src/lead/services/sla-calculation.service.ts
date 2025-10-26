import { Injectable } from '@nestjs/common';
import { SeverityLevelDto } from '../dto/compliance.dto.js';

@Injectable()
export class SlaCalculationService {
  
  /**
   * Calculate SLA deadline based on compliance severity level
   * @param severity - The severity level of the compliance finding
   * @param baseTime - Base time to calculate from (defaults to now)
   * @returns Date object representing the SLA deadline
   */
  calculateSlaDeadline(severity: SeverityLevelDto, baseTime: Date = new Date()): Date {
    const deadline = new Date(baseTime);
    
    switch (severity) {
      case SeverityLevelDto.CRITICAL:
        // Critical: 4 hours
        deadline.setHours(deadline.getHours() + 4);
        break;
      case SeverityLevelDto.HIGH:
        // High: 24 hours
        deadline.setHours(deadline.getHours() + 24);
        break;
      case SeverityLevelDto.MEDIUM:
        // Medium: 72 hours (3 days)
        deadline.setHours(deadline.getHours() + 72);
        break;
      case SeverityLevelDto.LOW:
        // Low: 1 week
        deadline.setDate(deadline.getDate() + 7);
        break;
      default:
        // Default to medium severity
        deadline.setHours(deadline.getHours() + 72);
    }
    
    return deadline;
  }

  /**
   * Estimate effort required based on severity and quick fix availability
   * @param severity - The severity level
   * @param hasQuickFix - Whether a quick fix is available
   * @returns Human-readable effort estimation
   */
  estimateEffort(severity: SeverityLevelDto, hasQuickFix: boolean): string {
    if (hasQuickFix) {
      return severity === SeverityLevelDto.CRITICAL || severity === SeverityLevelDto.HIGH 
        ? '15-30 minutes' 
        : '5-15 minutes';
    }

    switch (severity) {
      case SeverityLevelDto.CRITICAL:
        return '2-4 hours';
      case SeverityLevelDto.HIGH:
        return '1-2 hours';
      case SeverityLevelDto.MEDIUM:
        return '30 minutes - 1 hour';
      case SeverityLevelDto.LOW:
        return '15-30 minutes';
      default:
        return '30 minutes - 1 hour';
    }
  }

  /**
   * Check if a compliance finding is automatically actionable
   * @param severity - The severity level
   * @param hasQuickFix - Whether a quick fix is available
   * @returns Whether the finding can be automatically acted upon
   */
  isAutoActionable(severity: SeverityLevelDto, hasQuickFix: boolean): boolean {
    // Auto-actionable if it's low/medium severity AND has a quick fix
    return hasQuickFix && (severity === SeverityLevelDto.LOW || severity === SeverityLevelDto.MEDIUM);
  }

  /**
   * Check if SLA deadline is approaching (within 25% of total time)
   * @param slaDeadline - The SLA deadline
   * @param createdAt - When the finding was created
   * @param currentTime - Current time (defaults to now)
   * @returns Whether SLA is approaching
   */
  isSlaApproaching(slaDeadline: Date, createdAt: Date, currentTime: Date = new Date()): boolean {
    const totalTime = slaDeadline.getTime() - createdAt.getTime();
    const elapsed = currentTime.getTime() - createdAt.getTime();
    const remaining = slaDeadline.getTime() - currentTime.getTime();
    
    // SLA is approaching if 75% of time has elapsed or less than 25% remains
    return elapsed >= (totalTime * 0.75) || remaining <= (totalTime * 0.25);
  }

  /**
   * Check if SLA deadline has been breached
   * @param slaDeadline - The SLA deadline
   * @param currentTime - Current time (defaults to now)
   * @returns Whether SLA has been breached
   */
  isSlaBreached(slaDeadline: Date, currentTime: Date = new Date()): boolean {
    return currentTime > slaDeadline;
  }
}