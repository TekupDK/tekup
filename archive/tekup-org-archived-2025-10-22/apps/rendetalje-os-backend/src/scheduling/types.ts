export interface RouteOptimizationRequest {
  teamId: string;
  date: Date;
  jobLocations: JobLocation[];
  preferences?: OptimizationPreferences;
}

export interface JobLocation {
  id: string;
  customerId: string;
  address: string;
  coordinates: Coordinates;
  duration: number;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  distance?: number;
  travelTime?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface OptimizationPreferences {
  minimizeTravel?: boolean;
  minimizeFuel?: boolean;
  balanceWorkload?: boolean;
  prioritizeUrgent?: boolean;
}

export interface OptimizedRoutes {
  teamId: string;
  date: Date;
  routes: OptimizedRoute[];
  optimization: OptimizationSummary;
  compliance: ComplianceCheck;
  generatedAt: Date;
}

export interface OptimizedRoute {
  routeId: string;
  teamMemberId: string;
  jobs: ScheduledJob[];
  totalDistance: number;
  totalTravelTime: number;
  totalWorkTime: number;
  complianceStatus: string;
}

export interface ScheduledJob {
  jobId: string;
  customerId: string;
  address: string;
  estimatedDuration: number;
  scheduledStart: Date;
  scheduledEnd: Date;
  travelTime: number;
  jobType: string;
  priority: string;
}

export interface OptimizationSummary {
  totalDistance: number;
  totalTravelTime: number;
  fuelEstimate: number;
  co2Estimate: number;
  costSavings: number;
  efficiencyGain: number;
}

export interface ComplianceCheck {
  workingTimeCompliant: boolean;
  overtimeHours: number;
  breakScheduleCompliant: boolean;
  weeklyRestCompliant: boolean;
  routes?: Record<string, { status: string }>;
  overallStatus?: string;
  violations?: string[];
  recommendations?: string[];
}

export interface SchedulingRequest {
  teamId: string;
  jobs: JobRequest[];
  period: DateRange;
  constraints?: SchedulingConstraints;
}

export interface JobRequest {
  id: string;
  customerId: string;
  type: string;
  duration: number;
  priority: string;
  preferredTimeSlots?: TimeSlot[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SchedulingConstraints {
  maxDailyHours?: number;
  mandatoryBreaks?: BreakSchedule;
  weeklyRestPeriod?: number;
  maxWeeklyHours?: number;
}

export interface BreakSchedule {
  lunch: { duration: number; after: number };
  coffee: { duration: number; frequency: number };
}

export interface SchedulingResult {
  teamId: string;
  period: DateRange;
  scheduledJobs: ScheduledJobResult[];
  compliance: ComplianceCheck;
  unscheduledJobs: JobRequest[];
}

export interface ScheduledJobResult {
  jobId: string;
  customerId: string;
  assignedMember: string;
  scheduledDate: Date;
  timeSlot: TimeSlot;
  estimatedDuration: number;
  jobType: string;
  priority: string;
  complianceNotes: string[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface TravelMatrix {
  [locationId: string]: {
    [destinationId: string]: {
      distance: number;
      travelTime: number;
      fuelCost: number;
    };
  };
}

export interface WorkingHourLimits {
  dailyMaxHours: number;
  weeklyMaxHours: number;
  mandatoryBreaks: {
    lunch: { afterHours: number; duration: number };
    coffee: { intervalHours: number; duration: number };
  };
  weeklyRestPeriod: number;
}

export interface OptimizationParams {
  locations: JobLocation[];
  travelMatrix: TravelMatrix;
  workingHours: WorkingHourLimits;
  teamCapacity: number;
  vehicleConstraints: any;
  preferences: OptimizationPreferences;
}

export interface OptimizationResult {
  routes: any[];
  totalDistance: number;
  totalTravelTime: number;
  costSavings: number;
  efficiencyGain: number;
}

export interface JobProgressUpdate {
  status: string;
  location?: { lat: number; lon: number };
  notes?: string;
  completionPercentage?: number;
}

export interface TeamAvailability {
  teamId: string;
  period: DateRange;
  members: any[];
}
