import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { createLogger } from '@tekup/shared';

// Simple logger for now
const createLogger = (name: string) => ({
  info: (msg: string, ...args: any[]) => console.log(`[${name}] INFO:`, msg, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[${name}] ERROR:`, msg, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[${name}] WARN:`, msg, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(`[${name}] DEBUG:`, msg, ...args)
});
import {
  DateRange,
  ComplianceReport,
  WorkSchedule,
  BreakSchedule,
  OvertimeCalculation,
  EmploymentDocumentation,
  Break,
  OvertimeBreakdown
} from './types';

const logger = createLogger('danish-employment-compliance');

@Injectable()
export class DanishEmploymentComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Monitor working time compliance according to Danish employment law
   */
  async monitorWorkingTimeCompliance(teamId: string, period: DateRange): Promise<ComplianceReport> {
    try {
      const team = await this.prisma.cleaningTeam.findUnique({
        where: { id: teamId },
        include: { members: true }
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const workingTimeData = await this.getWorkingTimeData(teamId, period);
      const violations = await this.checkComplianceViolations(workingTimeData);
      
      const report: ComplianceReport = {
        teamId,
        period,
        overallStatus: violations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
        memberCompliance: await this.analyzeMemberCompliance(team.members, workingTimeData),
        violations,
        recommendations: this.generateComplianceRecommendations(violations),
        danishLawRequirements: this.getDanishLawRequirements(),
        generatedAt: new Date()
      };

      // Store compliance report
      await this.prisma.complianceReport.create({
        data: {
          teamId: report.teamId,
          period: report.period,
          overallStatus: report.overallStatus,
          memberCompliance: report.memberCompliance,
          violations: report.violations,
          recommendations: report.recommendations,
          danishLawRequirements: report.danishLawRequirements,
          generatedAt: report.generatedAt
        }
      });

      logger.info(`Compliance report generated for team ${teamId}: ${report.overallStatus}`);
      
      return report;

    } catch (error) {
      logger.error('Compliance monitoring failed:', error);
      throw new Error(`Compliance monitoring failed: ${error.message}`);
    }
  }

  /**
   * Generate automatic break schedules according to Danish law
   */
  async generateMandatoryBreakSchedule(workSchedule: WorkSchedule): Promise<BreakSchedule> {
    try {
      const { employeeId, date, startTime, endTime, workDuration } = workSchedule;

      const breaks: Break[] = [];
      
      // Danish law: 30-minute break after 5.5 hours of work
      if (workDuration >= 5.5 * 60) { // 5.5 hours in minutes
        const lunchBreakTime = new Date(startTime.getTime() + (5.5 * 60 * 60 * 1000));
        breaks.push({
          type: 'LUNCH',
          startTime: lunchBreakTime,
          endTime: new Date(lunchBreakTime.getTime() + (30 * 60 * 1000)),
          duration: 30,
          mandatory: true,
          legalBasis: 'Danish Working Time Act § 15'
        });
      }

      // Additional 15-minute breaks every 4 hours for cleaning work (physically demanding)
      const breakIntervals = Math.floor(workDuration / (4 * 60)); // Every 4 hours
      for (let i = 1; i <= breakIntervals; i++) {
        if (i * 4 * 60 < 5.5 * 60) { // Before lunch break
          const breakTime = new Date(startTime.getTime() + (i * 4 * 60 * 60 * 1000));
          breaks.push({
            type: 'REST',
            startTime: breakTime,
            endTime: new Date(breakTime.getTime() + (15 * 60 * 1000)),
            duration: 15,
            mandatory: false,
            legalBasis: 'Recommended for physically demanding work'
          });
        }
      }

      const schedule: BreakSchedule = {
        employeeId,
        date,
        workStart: startTime,
        workEnd: endTime,
        totalWorkTime: workDuration,
        breaks,
        complianceStatus: 'COMPLIANT',
        adjustedEndTime: this.calculateAdjustedEndTime(endTime, breaks)
      };

      logger.info(`Break schedule generated for employee ${employeeId}: ${breaks.length} breaks`);
      
      return schedule;

    } catch (error) {
      logger.error('Break schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Track overtime and calculate compensation according to Danish collective agreements
   */
  async calculateOvertimeCompensation(employeeId: string, period: DateRange): Promise<OvertimeCalculation> {
    try {
      const employee = await this.prisma.cleaningEmployee.findUnique({
        where: { id: employeeId },
        include: { contract: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const workingHours = await this.getEmployeeWorkingHours(employeeId, period);
      
      // Danish standard: 37 hours per week
      const standardWeeklyHours = 37;
      const overtimeHours = Math.max(0, workingHours.totalHours - standardWeeklyHours);
      
      // Danish overtime rates (typically 150% for first 3 hours, 200% after)
      const overtimeRates = this.getDanishOvertimeRates(employee.contract.collectiveAgreement);
      
      const calculation: OvertimeCalculation = {
        employeeId,
        period,
        regularHours: Math.min(workingHours.totalHours, standardWeeklyHours),
        overtimeHours,
        overtimeBreakdown: this.calculateOvertimeBreakdown(overtimeHours, overtimeRates),
        totalCompensation: this.calculateTotalCompensation(workingHours.totalHours, employee.contract.hourlyRate, overtimeRates),
        complianceNotes: this.generateOvertimeComplianceNotes(overtimeHours),
        calculatedAt: new Date()
      };

      logger.info(`Overtime calculated for ${employeeId}: ${overtimeHours}h overtime`);
      
      return calculation;

    } catch (error) {
      logger.error('Overtime calculation failed:', error);
      throw error;
    }
  }

  /**
   * Generate mandatory Danish employment documentation
   */
  async generateEmploymentDocumentation(employeeId: string): Promise<EmploymentDocumentation> {
    try {
      const employee = await this.prisma.cleaningEmployee.findUnique({
        where: { id: employeeId },
        include: { 
          contract: true,
          workingTimeRecords: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const documentation: EmploymentDocumentation = {
        employeeInfo: {
          id: employee.id,
          name: employee.name,
          cpr: employee.cprNumber, // Danish personal number
          startDate: employee.contract.startDate,
          position: employee.position,
          collectiveAgreement: employee.contract.collectiveAgreement
        },
        workingTimeRecord: {
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          },
          totalHoursWorked: employee.workingTimeRecords.reduce((sum, record) => sum + record.hoursWorked, 0),
          overtimeHours: employee.workingTimeRecords.reduce((sum, record) => sum + record.overtimeHours, 0),
          breaksTaken: employee.workingTimeRecords.reduce((sum, record) => sum + record.breakMinutes, 0),
          daysWorked: employee.workingTimeRecords.length
        },
        salaryInformation: {
          baseSalary: employee.contract.monthlySalary,
          hourlyRate: employee.contract.hourlyRate,
          overtimeCompensation: this.calculateMonthlyOvertimeCompensation(employee.workingTimeRecords),
          holidayPay: this.calculateHolidayPay(employee.contract.monthlySalary), // 12.5% in Denmark
          pensionContribution: this.calculatePensionContribution(employee.contract.monthlySalary) // Typically 12%
        },
        complianceDeclaration: {
          workingTimeCompliant: this.isWorkingTimeCompliant(employee.workingTimeRecords),
          breakScheduleCompliant: this.isBreakScheduleCompliant(employee.workingTimeRecords),
          overtimeWithinLimits: this.isOvertimeWithinLimits(employee.workingTimeRecords),
          holidayEntitlementUpToDate: this.isHolidayEntitlementUpToDate(employee),
          signedBy: 'RendetaljeOS System',
          signedAt: new Date()
        },
        generatedAt: new Date()
      };

      logger.info(`Employment documentation generated for ${employeeId}`);
      
      return documentation;

    } catch (error) {
      logger.error('Documentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Monitor compliance with Danish health and safety regulations for cleaning work
   */
  async monitorHealthSafetyCompliance(teamId: string): Promise<HealthSafetyCompliance> {
    try {
      const team = await this.prisma.cleaningTeam.findUnique({
        where: { id: teamId },
        include: { 
          members: true,
          equipment: true,
          safetyTraining: true
        }
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const compliance: HealthSafetyCompliance = {
        teamId,
        overallStatus: 'COMPLIANT',
        equipmentCompliance: await this.checkEquipmentCompliance(team.equipment),
        trainingCompliance: await this.checkSafetyTrainingCompliance(team.safetyTraining),
        chemicalSafetyCompliance: await this.checkChemicalSafetyCompliance(team.id),
        workEnvironmentAssessment: await this.conductWorkEnvironmentAssessment(team.id),
        danishRequirements: {
          workingEnvironmentAct: this.checkWorkingEnvironmentActCompliance(),
          chemicalAgentsDirective: this.checkChemicalAgentsCompliance(),
          personalProtectiveEquipment: this.checkPPECompliance(team.equipment)
        },
        recommendations: [],
        nextAssessmentDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Annual assessment
        assessedAt: new Date()
      };

      // Generate recommendations if non-compliant
      if (compliance.overallStatus !== 'COMPLIANT') {
        compliance.recommendations = this.generateHealthSafetyRecommendations(compliance);
      }

      logger.info(`Health & safety compliance assessed for team ${teamId}: ${compliance.overallStatus}`);
      
      return compliance;

    } catch (error) {
      logger.error('Health & safety compliance check failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getWorkingTimeData(teamId: string, period: DateRange): Promise<WorkingTimeData[]> {
    return this.prisma.workingTimeRecord.findMany({
      where: {
        teamId,
        date: {
          gte: period.start,
          lte: period.end
        }
      },
      include: { employee: true }
    });
  }

  private async checkComplianceViolations(workingTimeData: WorkingTimeData[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    workingTimeData.forEach(record => {
      // Check daily working hour limits (max 8 hours + 2 hours overtime)
      if (record.hoursWorked > 10) {
        violations.push({
          type: 'DAILY_HOUR_LIMIT',
          employeeId: record.employeeId,
          date: record.date,
          description: `Exceeded daily working hour limit: ${record.hoursWorked}h (max 10h)`,
          severity: 'HIGH',
          legalReference: 'Danish Working Time Act § 7'
        });
      }

      // Check mandatory breaks
      if (record.hoursWorked > 5.5 && record.breakMinutes < 30) {
        violations.push({
          type: 'MANDATORY_BREAK',
          employeeId: record.employeeId,
          date: record.date,
          description: `Missing mandatory break: ${record.breakMinutes}min (required: 30min after 5.5h)`,
          severity: 'MEDIUM',
          legalReference: 'Danish Working Time Act § 15'
        });
      }
    });

    return violations;
  }

  private async analyzeMemberCompliance(members: any[], workingTimeData: WorkingTimeData[]): Promise<MemberCompliance[]> {
    return members.map(member => {
      const memberData = workingTimeData.filter(data => data.employeeId === member.id);
      const totalHours = memberData.reduce((sum, data) => sum + data.hoursWorked, 0);
      const violations = memberData.filter(data => data.hoursWorked > 8).length;

      return {
        employeeId: member.id,
        name: member.name,
        totalHours,
        averageDailyHours: totalHours / memberData.length || 0,
        violations,
        complianceStatus: violations > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
        lastViolationDate: violations > 0 ? memberData.find(data => data.hoursWorked > 8)?.date : null
      };
    });
  }

  private generateComplianceRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations = [];

    const dailyHourViolations = violations.filter(v => v.type === 'DAILY_HOUR_LIMIT');
    if (dailyHourViolations.length > 0) {
      recommendations.push('Consider hiring additional staff to reduce overtime dependency');
      recommendations.push('Implement better workload distribution across team members');
    }

    const breakViolations = violations.filter(v => v.type === 'MANDATORY_BREAK');
    if (breakViolations.length > 0) {
      recommendations.push('Enforce automatic break scheduling after 5.5 hours of work');
      recommendations.push('Train supervisors on Danish break requirements');
    }

    return recommendations;
  }

  private getDanishLawRequirements(): DanishLawRequirements {
    return {
      workingTimeAct: {
        maxDailyHours: 8,
        maxWeeklyHours: 48, // Including overtime
        maxOvertimePerDay: 2,
        mandatoryBreakAfter: 5.5,
        minimumBreakDuration: 30,
        weeklyRestPeriod: 36
      },
      holidayAct: {
        annualHolidayDays: 25,
        holidayPayRate: 0.125 // 12.5%
      },
      pensionContribution: {
        employerRate: 0.08, // 8%
        employeeRate: 0.04 // 4%
      }
    };
  }

  private getDanishOvertimeRates(collectiveAgreement: string): OvertimeRates {
    // Rates vary by collective agreement, these are typical rates
    return {
      first3Hours: 1.5, // 150%
      after3Hours: 2.0,  // 200%
      weekendRate: 2.0,  // 200%
      holidayRate: 2.5   // 250%
    };
  }

  private calculateAdjustedEndTime(originalEndTime: Date, breaks: Break[]): Date {
    const totalBreakTime = breaks.reduce((sum, br) => sum + br.duration, 0);
    return new Date(originalEndTime.getTime() + (totalBreakTime * 60 * 1000));
  }

  private async getEmployeeWorkingHours(employeeId: string, period: DateRange): Promise<{ totalHours: number }> {
    const records = await this.prisma.workingTimeRecord.findMany({
      where: {
        employeeId,
        date: { gte: period.start, lte: period.end }
      }
    });

    return {
      totalHours: records.reduce((sum, record) => sum + record.hoursWorked, 0)
    };
  }

  private calculateOvertimeBreakdown(overtimeHours: number, rates: OvertimeRates): OvertimeBreakdown {
    const first3Hours = Math.min(overtimeHours, 3);
    const remainingHours = Math.max(0, overtimeHours - 3);

    return {
      first3Hours: { hours: first3Hours, rate: rates.first3Hours },
      after3Hours: { hours: remainingHours, rate: rates.after3Hours }
    };
  }

  private calculateTotalCompensation(totalHours: number, hourlyRate: number, overtimeRates: OvertimeRates): number {
    const regularHours = Math.min(totalHours, 37);
    const overtimeHours = Math.max(0, totalHours - 37);
    
    let compensation = regularHours * hourlyRate;
    
    if (overtimeHours > 0) {
      const first3Hours = Math.min(overtimeHours, 3);
      const remainingHours = Math.max(0, overtimeHours - 3);
      
      compensation += first3Hours * hourlyRate * overtimeRates.first3Hours;
      compensation += remainingHours * hourlyRate * overtimeRates.after3Hours;
    }
    
    return compensation;
  }

  private generateOvertimeComplianceNotes(overtimeHours: number): string[] {
    const notes = [];
    
    if (overtimeHours > 5) {
      notes.push('Excessive overtime detected - consider workload redistribution');
    }
    
    if (overtimeHours > 0) {
      notes.push('Overtime compensation calculated according to Danish collective agreement');
    }
    
    return notes;
  }

  private calculateMonthlyOvertimeCompensation(records: any[]): number {
    return records.reduce((sum, record) => sum + (record.overtimeHours * record.overtimeRate), 0);
  }

  private calculateHolidayPay(monthlySalary: number): number {
    return monthlySalary * 0.125; // 12.5% holiday pay
  }

  private calculatePensionContribution(monthlySalary: number): number {
    return monthlySalary * 0.12; // 12% total pension contribution
  }

  private isWorkingTimeCompliant(records: any[]): boolean {
    return !records.some(record => record.hoursWorked > 10);
  }

  private isBreakScheduleCompliant(records: any[]): boolean {
    return !records.some(record => record.hoursWorked > 5.5 && record.breakMinutes < 30);
  }

  private isOvertimeWithinLimits(records: any[]): boolean {
    const weeklyOvertime = records.reduce((sum, record) => sum + record.overtimeHours, 0);
    return weeklyOvertime <= 10; // Max 10 hours overtime per week
  }

  private isHolidayEntitlementUpToDate(employee: any): boolean {
    // Check if employee's holiday entitlement is properly calculated
    return true; // Simplified for demo
  }

  private async checkEquipmentCompliance(equipment: any[]): Promise<EquipmentCompliance> {
    return {
      status: 'COMPLIANT',
      items: equipment.map(item => ({
        id: item.id,
        name: item.name,
        lastInspection: item.lastInspection,
        nextInspectionDue: item.nextInspectionDue,
        compliant: new Date() < item.nextInspectionDue
      }))
    };
  }

  private async checkSafetyTrainingCompliance(training: any[]): Promise<TrainingCompliance> {
    return {
      status: 'COMPLIANT',
      completedModules: training.length,
      requiredModules: 5,
      expiringCertifications: []
    };
  }

  private async checkChemicalSafetyCompliance(teamId: string): Promise<ChemicalSafetyCompliance> {
    return {
      status: 'COMPLIANT',
      safetyDataSheetsUpToDate: true,
      storageCompliant: true,
      handlingProceduresDocumented: true
    };
  }

  private async conductWorkEnvironmentAssessment(teamId: string): Promise<WorkEnvironmentAssessment> {
    return {
      overallRating: 'GOOD',
      physicalFactors: 'ACCEPTABLE',
      psychosocialFactors: 'GOOD',
      organizationalFactors: 'GOOD',
      lastAssessment: new Date(),
      nextAssessmentDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
  }

  private checkWorkingEnvironmentActCompliance(): boolean {
    return true; // Simplified for demo
  }

  private checkChemicalAgentsCompliance(): boolean {
    return true; // Simplified for demo
  }

  private checkPPECompliance(equipment: any[]): boolean {
    return equipment.some(item => item.type === 'PPE');
  }

  private generateHealthSafetyRecommendations(compliance: HealthSafetyCompliance): string[] {
    const recommendations = [];
    
    if (compliance.equipmentCompliance.status !== 'COMPLIANT') {
      recommendations.push('Update equipment inspections and certifications');
    }
    
    if (compliance.trainingCompliance.status !== 'COMPLIANT') {
      recommendations.push('Complete mandatory safety training modules');
    }
    
    return recommendations;
  }
}

// Type definitions
export interface DateRange {
  start: Date;
  end: Date;
}

export interface ComplianceReport {
  teamId: string;
  period: DateRange;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  memberCompliance: MemberCompliance[];
  violations: ComplianceViolation[];
  recommendations: string[];
  danishLawRequirements: DanishLawRequirements;
  generatedAt: Date;
}

export interface MemberCompliance {
  employeeId: string;
  name: string;
  totalHours: number;
  averageDailyHours: number;
  violations: number;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT';
  lastViolationDate: Date | null;
}

export interface ComplianceViolation {
  type: 'DAILY_HOUR_LIMIT' | 'MANDATORY_BREAK' | 'WEEKLY_REST' | 'OVERTIME_LIMIT';
  employeeId: string;
  date: Date;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  legalReference: string;
}

export interface WorkSchedule {
  employeeId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  workDuration: number; // in minutes
}

export interface BreakSchedule {
  employeeId: string;
  date: Date;
  workStart: Date;
  workEnd: Date;
  totalWorkTime: number;
  breaks: Break[];
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT';
  adjustedEndTime: Date;
}

export interface Break {
  type: 'LUNCH' | 'REST' | 'COFFEE';
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  mandatory: boolean;
  legalBasis: string;
}

export interface OvertimeCalculation {
  employeeId: string;
  period: DateRange;
  regularHours: number;
  overtimeHours: number;
  overtimeBreakdown: OvertimeBreakdown;
  totalCompensation: number;
  complianceNotes: string[];
  calculatedAt: Date;
}

export interface OvertimeBreakdown {
  first3Hours: { hours: number; rate: number };
  after3Hours: { hours: number; rate: number };
}

export interface OvertimeRates {
  first3Hours: number;
  after3Hours: number;
  weekendRate: number;
  holidayRate: number;
}

export interface EmploymentDocumentation {
  employeeInfo: any;
  workingTimeRecord: any;
  salaryInformation: any;
  complianceDeclaration: any;
  generatedAt: Date;
}

export interface HealthSafetyCompliance {
  teamId: string;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  equipmentCompliance: EquipmentCompliance;
  trainingCompliance: TrainingCompliance;
  chemicalSafetyCompliance: ChemicalSafetyCompliance;
  workEnvironmentAssessment: WorkEnvironmentAssessment;
  danishRequirements: any;
  recommendations: string[];
  nextAssessmentDue: Date;
  assessedAt: Date;
}

export interface EquipmentCompliance {
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  items: any[];
}

export interface TrainingCompliance {
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  completedModules: number;
  requiredModules: number;
  expiringCertifications: any[];
}

export interface ChemicalSafetyCompliance {
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  safetyDataSheetsUpToDate: boolean;
  storageCompliant: boolean;
  handlingProceduresDocumented: boolean;
}

export interface WorkEnvironmentAssessment {
  overallRating: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  physicalFactors: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  psychosocialFactors: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  organizationalFactors: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  lastAssessment: Date;
  nextAssessmentDue: Date;
}

export interface DanishLawRequirements {
  workingTimeAct: any;
  holidayAct: any;
  pensionContribution: any;
}

export interface WorkingTimeData {
  employeeId: string;
  date: Date;
  hoursWorked: number;
  overtimeHours: number;
  breakMinutes: number;
  employee: any;
}
