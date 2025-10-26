/**
 * Restaurant domain types for RestaurantIQ
 * Inventory, Menu, Staff, and Analytics types
 */

import { 
  UUID, 
  DateTimeString, 
  DateString, 
  CurrencyAmount, 
  Status,
  ProcessingStatus 
} from './core';

// ============================================================================
// INVENTORY MANAGEMENT TYPES
// ============================================================================

export interface InventoryItem {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  name: string;
  description?: string;
  category: InventoryCategory;
  unit: MeasurementUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: CurrencyAmount; // In øre
  supplierInfo?: SupplierInfo;
  nutritionInfo?: NutritionInfo;
  allergens: Allergen[];
  storageRequirements?: StorageRequirements;
  expirationTracking: boolean;
  barcodes: string[];
  tags: string[];
  isActive: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export type InventoryCategory = 
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'spices'
  | 'beverages'
  | 'alcohol'
  | 'cleaning'
  | 'packaging'
  | 'disposables'
  | 'other';

export type MeasurementUnit = 
  | 'kg'       // Kilogram
  | 'g'        // Gram
  | 'l'        // Liter
  | 'ml'       // Milliliter
  | 'stk'      // Pieces (Danish: stykker)
  | 'pk'       // Package (Danish: pakke)
  | 'ds'       // Dozen
  | 'kasse'    // Case (Danish)
  | 'm'        // Meter
  | 'cm';      // Centimeter

export interface SupplierInfo {
  id: UUID;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  deliveryDays: number[]; // 0-6, Sunday-Saturday
  minOrderAmount?: CurrencyAmount;
  leadTime: number; // days
  qualityScore?: number; // 1-5 rating
}

export interface NutritionInfo {
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  saltPer100g?: number;
}

export type Allergen = 
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export interface StorageRequirements {
  temperature?: {
    min: number; // Celsius
    max: number; // Celsius
  };
  humidity?: {
    min: number; // Percentage
    max: number; // Percentage
  };
  location: 'freezer' | 'refrigerator' | 'dry_storage' | 'wine_cellar';
  shelfLife: number; // days
}

export interface InventoryTransaction {
  id: UUID;
  itemId: UUID;
  locationId: UUID;
  transactionType: TransactionType;
  quantity: number;
  costPerUnit: CurrencyAmount;
  totalCost: CurrencyAmount;
  referenceId?: string; // POS transaction, order, etc.
  batchNumber?: string;
  expirationDate?: DateString;
  notes?: string;
  createdBy: UUID;
  createdAt: DateTimeString;
}

export type TransactionType = 
  | 'purchase'    // Buying from supplier
  | 'usage'       // Used in production/service
  | 'waste'       // Thrown away/expired
  | 'adjustment'  // Manual stock adjustment
  | 'transfer'    // Transfer between locations
  | 'return'      // Returned to supplier
  | 'sample';     // Used for sampling/tasting

export interface WasteEntry {
  id: UUID;
  itemId: UUID;
  locationId: UUID;
  quantity: number;
  reason: WasteReason;
  cost: CurrencyAmount;
  notes?: string;
  reportedBy: UUID;
  createdAt: DateTimeString;
}

export type WasteReason = 
  | 'expired'
  | 'spoiled'
  | 'overproduction'
  | 'preparation_error'
  | 'customer_return'
  | 'dropped'
  | 'quality_issue'
  | 'other';

// ============================================================================
// MENU MANAGEMENT TYPES  
// ============================================================================

export interface MenuItem {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  name: string;
  description?: string;
  category: MenuCategory;
  price: CurrencyAmount; // In øre
  cost: CurrencyAmount;  // Calculated from recipe
  marginPercentage: number; // Calculated
  recipe?: Recipe;
  nutritionInfo?: NutritionInfo;
  allergens: Allergen[];
  dietaryInfo: DietaryInfo;
  images: string[]; // URLs
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  preparationTime: number; // minutes
  servingSize?: string;
  calories?: number;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export type MenuCategory = 
  | 'appetizers'      // Forretter
  | 'main_courses'    // Hovedretter
  | 'desserts'        // Desserter
  | 'salads'          // Salater
  | 'soups'           // Supper
  | 'beverages'       // Drikkevarer
  | 'alcohol'         // Alkohol
  | 'coffee_tea'      // Kaffe og te
  | 'sides'           // Tilbehør
  | 'kids_menu'       // Børnemenu
  | 'lunch_specials'  // Frokosttilbud
  | 'seasonal';       // Sæsonvarer

export interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isKeto: boolean;
  isOrganic: boolean;
  isLocallySourced: boolean;
}

export interface Recipe {
  id: UUID;
  menuItemId: UUID;
  name: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  yield: number; // number of portions
  preparationTime: number; // minutes
  cookingTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  equipmentNeeded: string[];
  notes?: string;
  createdBy: UUID;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface RecipeIngredient {
  id: UUID;
  inventoryItemId: UUID;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
  isOptional: boolean;
  alternatives?: UUID[]; // Alternative ingredient IDs
}

export interface MenuAnalytics {
  menuItemId: UUID;
  period: {
    startDate: DateString;
    endDate: DateString;
  };
  metrics: MenuMetrics;
  trends: MenuTrends;
  recommendations: MenuRecommendation[];
}

export interface MenuMetrics {
  totalSales: number;
  revenue: CurrencyAmount;
  totalCost: CurrencyAmount;
  profit: CurrencyAmount;
  marginPercentage: number;
  averageOrderValue: CurrencyAmount;
  popularityRank: number;
  customerRating?: number;
  returnRate: number; // How often customers reorder
}

export interface MenuTrends {
  salesTrend: 'increasing' | 'decreasing' | 'stable';
  profitTrend: 'increasing' | 'decreasing' | 'stable';
  seasonalPattern?: 'spring' | 'summer' | 'autumn' | 'winter';
  dayOfWeekPattern: Record<string, number>; // Mon-Sun sales distribution
  timeOfDayPattern: Record<string, number>; // Hourly sales distribution
}

export interface MenuRecommendation {
  type: 'price_increase' | 'price_decrease' | 'promote' | 'remove' | 'modify_recipe';
  impact: 'high' | 'medium' | 'low';
  description: string;
  expectedRevenue?: CurrencyAmount;
  confidence: number; // 0-1
}

// ============================================================================
// STAFF MANAGEMENT TYPES
// ============================================================================

export interface Employee {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  employeeNumber: string;
  personalInfo: PersonalInfo;
  workInfo: WorkInfo;
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  emergencyContact?: EmergencyContact;
  skills: Skill[];
  availability: StaffAvailability;
  preferences: StaffPreferences;
  isActive: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: DateString;
  nationalId?: string; // Danish CPR number (anonymized)
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  photo?: string; // URL
}

export interface WorkInfo {
  position: Position;
  department: Department;
  employmentType: EmploymentType;
  startDate: DateString;
  endDate?: DateString;
  hourlyRate: CurrencyAmount; // In øre
  contractHours: number; // per week
  probationPeriod?: {
    endDate: DateString;
    status: 'active' | 'completed' | 'extended';
  };
}

export type Position = 
  | 'chef'           // Køkkenchef
  | 'sous_chef'      // Souschef
  | 'cook'           // Kok
  | 'prep_cook'      // Køkkenmedhjælper
  | 'server'         // Tjener
  | 'bartender'      // Bartender
  | 'host'           // Vært
  | 'manager'        // Manager
  | 'assistant_manager' // Assisterende manager
  | 'dishwasher'     // Opvasker
  | 'cleaner'        // Rengøring
  | 'delivery'       // Udbringning
  | 'trainee';       // Lærling/praktikant

export type Department = 
  | 'kitchen'        // Køkken
  | 'service'        // Service/forfront
  | 'bar'            // Bar
  | 'management'     // Ledelse
  | 'cleaning'       // Rengøring
  | 'delivery';      // Levering

export type EmploymentType = 
  | 'full_time'      // Fuldtid
  | 'part_time'      // Deltid
  | 'temporary'      // Vikar
  | 'seasonal'       // Sæsonarbejde
  | 'intern'         // Praktikant
  | 'trainee';       // Lærling

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Skill {
  id: UUID;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'kitchen' | 'service' | 'bar' | 'management' | 'technical' | 'language';
  certificationDate?: DateString;
  expirationDate?: DateString;
}

export interface StaffAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
  vacationDays: VacationPeriod[];
  unavailableDates: DateString[];
}

export interface DayAvailability {
  available: boolean;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  preferredShift?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface VacationPeriod {
  startDate: DateString;
  endDate: DateString;
  type: 'vacation' | 'sick_leave' | 'maternity' | 'paternity' | 'other';
  approved: boolean;
  notes?: string;
}

export interface StaffPreferences {
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
  preferredDepartments: Department[];
  canWorkWeekends: boolean;
  canWorkHolidays: boolean;
  overtimeAvailable: boolean;
  transportMethod: 'bike' | 'car' | 'public_transport' | 'walking';
}

export interface Schedule {
  id: UUID;
  locationId: UUID;
  employeeId: UUID;
  shiftDate: DateString;
  shiftType: ShiftType;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  department: Department;
  position: Position;
  breaks: BreakPeriod[];
  status: ScheduleStatus;
  actualStartTime?: DateTimeString;
  actualEndTime?: DateTimeString;
  notes?: string;
  createdBy: UUID;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export type ShiftType = 
  | 'opening'    // Åbningsvagt
  | 'morning'    // Morgen
  | 'lunch'      // Frokost
  | 'afternoon'  // Eftermiddag
  | 'dinner'     // Middag
  | 'closing'    // Lukkevagt
  | 'split'      // Delt vagt
  | 'double';    // Dobbelt vagt

export type ScheduleStatus = 
  | 'scheduled'  // Planlagt
  | 'confirmed'  // Bekræftet
  | 'completed'  // Gennemført
  | 'no_show'    // Udeblev
  | 'sick'       // Syg
  | 'canceled'   // Aflyst
  | 'modified';  // Ændret

export interface BreakPeriod {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: 'meal' | 'rest' | 'other';
  paid: boolean;
}

export interface TimeEntry {
  id: UUID;
  employeeId: UUID;
  locationId: UUID;
  scheduleId?: UUID;
  clockInTime: DateTimeString;
  clockOutTime?: DateTimeString;
  totalHours?: number;
  regularHours?: number;
  overtimeHours?: number;
  breaks: BreakEntry[];
  status: 'clocked_in' | 'clocked_out' | 'break' | 'missing_out';
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface BreakEntry {
  startTime: DateTimeString;
  endTime?: DateTimeString;
  type: 'meal' | 'rest' | 'other';
  duration?: number; // minutes
}

// ============================================================================
// SALES & ANALYTICS TYPES
// ============================================================================

export interface SalesTransaction {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  posTransactionId?: string;
  transactionDate: DateTimeString;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  subtotal: CurrencyAmount;
  tax: CurrencyAmount;
  tip?: CurrencyAmount;
  discount?: CurrencyAmount;
  total: CurrencyAmount;
  items: SalesItem[];
  customerId?: UUID;
  tableNumber?: number;
  serverId?: UUID;
  status: TransactionStatus;
  refundedAt?: DateTimeString;
  refundAmount?: CurrencyAmount;
  notes?: string;
  createdAt: DateTimeString;
}

export type OrderType = 
  | 'dine_in'    // Spise på stedet
  | 'takeaway'   // Takeaway
  | 'delivery'   // Levering
  | 'catering'   // Catering
  | 'online';    // Online bestilling

export type PaymentMethod = 
  | 'mobilepay'  // MobilePay (primary Danish)
  | 'card'       // Kort
  | 'cash'       // Kontant
  | 'swish'      // Swish
  | 'vipps'      // Vipps
  | 'gift_card'  // Gavekort
  | 'voucher'    // Værdikupon
  | 'credit';    // Kredit

export type TransactionStatus = 
  | 'pending'
  | 'completed'
  | 'canceled'
  | 'refunded'
  | 'failed';

export interface SalesItem {
  menuItemId: UUID;
  name: string;
  quantity: number;
  unitPrice: CurrencyAmount;
  totalPrice: CurrencyAmount;
  modifications?: string[];
  notes?: string;
}

export interface DemandForecast {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  itemId: UUID; // Can be menu item or inventory item
  itemType: 'menu_item' | 'inventory_item';
  forecastDate: DateString;
  forecastPeriod: 'hour' | 'day' | 'week' | 'month';
  predictedQuantity: number;
  confidenceLevel: number; // 0-1
  factors: ForecastFactors;
  actualQuantity?: number; // Filled in after the period
  accuracy?: number; // Calculated after actual data is available
  modelVersion: string;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface ForecastFactors {
  historicalData: {
    weight: number;
    contribution: number;
  };
  weather: {
    temperature: number;
    precipitation: number;
    weight: number;
    contribution: number;
  };
  events: {
    localEvents: string[];
    holidays: string[];
    weight: number;
    contribution: number;
  };
  seasonality: {
    monthlyFactor: number;
    weeklyFactor: number;
    dailyFactor: number;
    weight: number;
    contribution: number;
  };
  trends: {
    shortTerm: number;
    longTerm: number;
    weight: number;
    contribution: number;
  };
}

export interface AnalyticsReport {
  id: UUID;
  tenantId: UUID;
  locationIds: UUID[];
  reportType: ReportType;
  period: {
    startDate: DateString;
    endDate: DateString;
  };
  data: Record<string, any>;
  generatedAt: DateTimeString;
  generatedBy: UUID;
  format: 'json' | 'csv' | 'excel' | 'pdf';
  fileUrl?: string;
  status: ProcessingStatus;
}

export type ReportType = 
  | 'sales_summary'
  | 'inventory_analysis'
  | 'staff_productivity'
  | 'menu_performance'
  | 'waste_analysis'
  | 'profit_loss'
  | 'customer_analytics'
  | 'forecasting_accuracy'
  | 'compliance_report';

// Danish labor law compliance types
export interface ComplianceCheck {
  employeeId: UUID;
  period: {
    startDate: DateString;
    endDate: DateString;
  };
  checks: {
    maxHoursPerWeek: boolean;
    minRestPeriod: boolean;
    maxConsecutiveDays: boolean;
    mandatoryBreaks: boolean;
    overtimeCompliance: boolean;
    nightWorkCompliance: boolean;
    weekendWorkCompliance: boolean;
  };
  violations: ComplianceViolation[];
  status: 'compliant' | 'violations' | 'warnings';
  checkedAt: DateTimeString;
}

export interface ComplianceViolation {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  affectedDates: DateString[];
  suggestedAction: string;
}

// Constants for Danish labor law
export const DANISH_LABOR_CONSTANTS = {
  MAX_HOURS_PER_WEEK: 48,
  MAX_DAILY_HOURS: 10,
  MIN_DAILY_REST: 11, // hours
  MIN_WEEKLY_REST: 35, // hours
  MAX_CONSECUTIVE_WORK_DAYS: 6,
  MANDATORY_BREAK_AFTER_HOURS: 5.5,
  MIN_BREAK_DURATION: 15, // minutes
  OVERTIME_RATE_MULTIPLIER: 1.5,
  NIGHT_WORK_START: 22, // 22:00
  NIGHT_WORK_END: 6,    // 06:00
} as const;
