// Job Scheduling Types for Danish Cleaning Industry
// TekUp.org CRM - Rengøringsbranchen specifik scheduling system

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  accessInstructions?: string;
  cleaningPreferences?: CleaningPreferences;
}

export interface CleaningJob {
  id: string;
  customer: Customer;
  title: string;
  description?: string;
  jobType: CleaningJobType;
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration: number; // minutter
  actualDuration?: number; // minutter
  status: JobStatus;
  priority: JobPriority;
  teamMembers: TeamMember[];
  location: JobLocation;
  recurring?: RecurringConfig;
  equipment?: EquipmentRequirement[];
  supplies?: SupplyRequirement[];
  specialRequirements?: string[];
  photos?: JobPhoto[];
  notes?: JobNote[];
  qualityCheck?: QualityCheck;
  customer_signature?: string;
  cost: JobCost;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CleaningPreferences {
  preferredTime: 'morning' | 'afternoon' | 'evening';
  accessMethod: 'key' | 'present' | 'keybox' | 'doorman';
  specialInstructions: string[];
  allergyNotes?: string[];
  petNotes?: string[];
  fragrance: 'none' | 'light' | 'strong';
  environmentalPreferences: 'standard' | 'eco' | 'organic';
}

export type CleaningJobType = 
  | 'kontorrenhold'           // Office cleaning
  | 'privatrenhold'           // Residential cleaning  
  | 'flytterenhold'           // Move-out cleaning
  | 'byggerenhold'            // Construction cleaning
  | 'vinduespudsning'         // Window cleaning
  | 'tæpperens'              // Carpet cleaning
  | 'specialrengøring'        // Special cleaning
  | 'vedligeholdelse'        // Maintenance cleaning
  | 'dybrengøring'           // Deep cleaning
  | 'akutrengøring';         // Emergency cleaning

export type JobStatus = 
  | 'scheduled'     // Planlagt
  | 'confirmed'     // Bekræftet
  | 'in_progress'   // I gang
  | 'paused'        // Pauseret
  | 'completed'     // Færdig
  | 'cancelled'     // Aflyst
  | 'no_show'       // Ikke mødt op
  | 'rescheduled';  // Omplanlagt

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TeamMember {
  id: string;
  name: string;
  role: 'team_leader' | 'cleaner' | 'specialist' | 'trainee';
  phone: string;
  skills: CleaningSkill[];
  hourlyRate: number;
  availability: TeamAvailability;
  certifications?: string[];
}

export type CleaningSkill = 
  | 'basic_cleaning'
  | 'window_cleaning'
  | 'carpet_cleaning'
  | 'pressure_washing'
  | 'floor_maintenance'
  | 'specialized_equipment'
  | 'chemical_handling'
  | 'quality_control';

export interface TeamAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
  available: boolean;
}

export interface JobLocation {
  address: string;
  city: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  accessInstructions?: string;
  parkingInstructions?: string;
  floor?: number;
  apartmentNumber?: string;
  buildingCode?: string;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  interval: number; // hver X uge/måned
  endDate?: Date;
  totalOccurrences?: number;
  weekdays?: number[]; // 0=søndag, 1=mandag, etc.
  skipHolidays: boolean;
  autoConfirm: boolean;
}

export interface EquipmentRequirement {
  name: string;
  quantity: number;
  required: boolean;
  notes?: string;
}

export interface SupplyRequirement {
  name: string;
  quantity: number;
  unit: string; // 'stk', 'liter', 'kg'
  cost?: number;
  supplier?: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  caption?: string;
  type: 'before' | 'during' | 'after' | 'issue' | 'completed';
  uploadedAt: Date;
  uploadedBy: string;
}

export interface JobNote {
  id: string;
  text: string;
  type: 'general' | 'issue' | 'customer' | 'internal';
  createdAt: Date;
  createdBy: string;
}

export interface QualityCheck {
  overallRating: number; // 1-5
  areas: QualityArea[];
  customerFeedback?: string;
  issues?: QualityIssue[];
  followUpRequired: boolean;
  completedBy: string;
  completedAt: Date;
}

export interface QualityArea {
  name: string; // 'Toiletter', 'Køkken', 'Kontorer'
  rating: number; // 1-5
  notes?: string;
  photos?: string[];
}

export interface QualityIssue {
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolutionNotes?: string;
  reportedAt: Date;
}

export interface JobCost {
  basePrice: number;
  hourlyRate?: number;
  actualHours?: number;
  supplies?: number;
  equipment?: number;
  total: number;
  currency: 'DKK';
  invoiced: boolean;
  paidAt?: Date;
}

// Route optimization types
export interface Route {
  id: string;
  date: Date;
  teamMember: TeamMember;
  jobs: CleaningJob[];
  estimatedDuration: number; // total minutter
  estimatedDistance: number; // km
  estimatedCost: number; // benzin + løn
  status: 'planned' | 'active' | 'completed';
  startLocation?: JobLocation;
  endLocation?: JobLocation;
}

export interface RouteOptimization {
  originalRoute: Route;
  optimizedRoute: Route;
  savings: {
    time: number; // minutter sparet
    distance: number; // km sparet  
    cost: number; // DKK sparet
  };
  algorithm: 'shortest_distance' | 'shortest_time' | 'balanced';
}

// Calendar and scheduling types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  job?: CleaningJob;
  type: 'job' | 'break' | 'travel' | 'meeting' | 'vacation';
  color?: string;
  editable: boolean;
}

export interface SchedulingConstraints {
  maxJobsPerDay: number;
  maxHoursPerDay: number;
  minimumBreakTime: number; // minutter
  maxTravelTime: number; // minutter mellem jobs
  workingHours: {
    start: string; // "08:00"
    end: string;   // "18:00"
  };
  workingDays: number[]; // 1-7 (mandag-søndag)
  holidayHandling: 'skip' | 'reschedule' | 'allow';
}

// Dashboard metrics
export interface SchedulingMetrics {
  period: {
    start: Date;
    end: Date;
  };
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  averageJobDuration: number;
  totalRevenue: number;
  customerSatisfaction: number;
  teamUtilization: number;
  routeEfficiency: number;
}