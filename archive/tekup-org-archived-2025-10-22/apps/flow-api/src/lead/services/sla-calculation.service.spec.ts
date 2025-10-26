import { SlaCalculationService } from './sla-calculation.service.js';
import { SeverityLevelDto } from '../dto/compliance.dto.js';

describe('SlaCalculationService', () => {
  let service: SlaCalculationService;

  beforeEach(() => {
    service = new SlaCalculationService();
  });

  describe('calculateSlaDeadline', () => {
    it('should calculate SLA deadline for critical severity (4 hours)', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z');
      const deadline = service.calculateSlaDeadline(SeverityLevelDto.CRITICAL, baseTime);
      
      expect(deadline.getTime()).toBe(new Date('2023-01-01T14:00:00Z').getTime());
    });

    it('should calculate SLA deadline for high severity (24 hours)', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z');
      const deadline = service.calculateSlaDeadline(SeverityLevelDto.HIGH, baseTime);
      
      expect(deadline.getTime()).toBe(new Date('2023-01-02T10:00:00Z').getTime());
    });

    it('should calculate SLA deadline for medium severity (72 hours)', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z');
      const deadline = service.calculateSlaDeadline(SeverityLevelDto.MEDIUM, baseTime);
      
      expect(deadline.getTime()).toBe(new Date('2023-01-04T10:00:00Z').getTime());
    });

    it('should calculate SLA deadline for low severity (1 week)', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z');
      const deadline = service.calculateSlaDeadline(SeverityLevelDto.LOW, baseTime);
      
      expect(deadline.getTime()).toBe(new Date('2023-01-08T10:00:00Z').getTime());
    });

    it('should default to medium severity for unknown severity levels', () => {
      const baseTime = new Date('2023-01-01T10:00:00Z');
      const deadline = service.calculateSlaDeadline('unknown' as any, baseTime);
      
      expect(deadline.getTime()).toBe(new Date('2023-01-04T10:00:00Z').getTime());
    });
  });

  describe('estimateEffort', () => {
    it('should estimate effort for critical severity with quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.CRITICAL, true);
      expect(effort).toBe('15-30 minutes');
    });

    it('should estimate effort for high severity with quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.HIGH, true);
      expect(effort).toBe('15-30 minutes');
    });

    it('should estimate effort for medium severity with quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.MEDIUM, true);
      expect(effort).toBe('5-15 minutes');
    });

    it('should estimate effort for low severity with quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.LOW, true);
      expect(effort).toBe('5-15 minutes');
    });

    it('should estimate effort for critical severity without quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.CRITICAL, false);
      expect(effort).toBe('2-4 hours');
    });

    it('should estimate effort for high severity without quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.HIGH, false);
      expect(effort).toBe('1-2 hours');
    });

    it('should estimate effort for medium severity without quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.MEDIUM, false);
      expect(effort).toBe('30 minutes - 1 hour');
    });

    it('should estimate effort for low severity without quick fix', () => {
      const effort = service.estimateEffort(SeverityLevelDto.LOW, false);
      expect(effort).toBe('15-30 minutes');
    });
  });

  describe('isAutoActionable', () => {
    it('should return true for low severity with quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.LOW, true)).toBe(true);
    });

    it('should return true for medium severity with quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.MEDIUM, true)).toBe(true);
    });

    it('should return false for high severity with quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.HIGH, true)).toBe(false);
    });

    it('should return false for critical severity with quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.CRITICAL, true)).toBe(false);
    });

    it('should return false for low severity without quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.LOW, false)).toBe(false);
    });

    it('should return false for medium severity without quick fix', () => {
      expect(service.isAutoActionable(SeverityLevelDto.MEDIUM, false)).toBe(false);
    });
  });

  describe('isSlaApproaching', () => {
    it('should return true when 75% of SLA time has elapsed', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z');
      const slaDeadline = new Date('2023-01-01T14:00:00Z'); // 4 hours
      const currentTime = new Date('2023-01-01T13:00:00Z'); // 3 hours later (75%)
      
      expect(service.isSlaApproaching(slaDeadline, createdAt, currentTime)).toBe(true);
    });

    it('should return true when less than 25% of time remains', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z');
      const slaDeadline = new Date('2023-01-01T14:00:00Z'); // 4 hours
      const currentTime = new Date('2023-01-01T13:30:00Z'); // 3.5 hours later (12.5% remains)
      
      expect(service.isSlaApproaching(slaDeadline, createdAt, currentTime)).toBe(true);
    });

    it('should return false when more than 25% of time remains and less than 75% has elapsed', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z');
      const slaDeadline = new Date('2023-01-01T14:00:00Z'); // 4 hours
      const currentTime = new Date('2023-01-01T12:00:00Z'); // 2 hours later (50% elapsed, 50% remains)
      
      expect(service.isSlaApproaching(slaDeadline, createdAt, currentTime)).toBe(false);
    });
  });

  describe('isSlaBreached', () => {
    it('should return true when current time is after SLA deadline', () => {
      const slaDeadline = new Date('2023-01-01T10:00:00Z');
      const currentTime = new Date('2023-01-01T11:00:00Z');
      
      expect(service.isSlaBreached(slaDeadline, currentTime)).toBe(true);
    });

    it('should return false when current time is before SLA deadline', () => {
      const slaDeadline = new Date('2023-01-01T10:00:00Z');
      const currentTime = new Date('2023-01-01T09:00:00Z');
      
      expect(service.isSlaBreached(slaDeadline, currentTime)).toBe(false);
    });

    it('should return false when current time equals SLA deadline', () => {
      const slaDeadline = new Date('2023-01-01T10:00:00Z');
      const currentTime = new Date('2023-01-01T10:00:00Z');
      
      expect(service.isSlaBreached(slaDeadline, currentTime)).toBe(false);
    });
  });
});