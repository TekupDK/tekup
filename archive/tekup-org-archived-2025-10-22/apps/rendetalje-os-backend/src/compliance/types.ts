export interface DateRange {
  start: Date;
  end: Date;
}

export interface ComplianceReport {
  teamId: string;
  period: DateRange;
  overallStatus: string;
  memberCompliance: any;
  violations: string[];
  recommendations: string[];
  danishLawRequirements: any;
  generatedAt: Date;
}

export interface WorkSchedule {
  employeeId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  workDuration: number; // in minutes
}

export interface Break {
  type: 'LUNCH' | 'REST' | 'COFFEE';
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  mandatory: boolean;
  legalBasis: string;
}

export interface BreakSchedule {
  employeeId: string;
  date: Date;
  workStart: Date;
  workEnd: Date;
  totalWorkTime: number; // in minutes
  breaks: Break[];
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT';
  adjustedEndTime: Date;
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
  standardOvertime: number; // 150% rate
  excessOvertime: number;   // 200% rate
}

export interface EmploymentDocumentation {
  employeeInfo: {
    id: string;
    name: string;
    cpr: string;
    startDate: Date;
    position: string;
    collectiveAgreement: string;
  };
  workingTimeRecord: {
    period: DateRange;
    totalHoursWorked: number;
    overtimeHours: number;
    breaksTaken: number;
    daysWorked: number;
  };
  salaryInformation: {
    baseSalary: number;
    hourlyRate: number;
    overtimeCompensation: number;
  };
  complianceStatus: {
    workingTimeCompliant: boolean;
    breakScheduleCompliant: boolean;
    overtimeCompliant: boolean;
    documentationComplete: boolean;
  };
  generatedAt: Date;
}