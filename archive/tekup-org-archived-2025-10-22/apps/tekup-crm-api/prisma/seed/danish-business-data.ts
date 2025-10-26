// Danish Business Logic and Data for Cleaning Industry
// TekUp.org CRM - Rengøringsbranchen specific data

export const DANISH_POSTAL_CODES = {
  // Major cities and their postal code ranges
  COPENHAGEN: {
    ranges: [
      { start: 1000, end: 2450 }, // København K, V, Ø, S, NV, N
      { start: 2500, end: 2750 }, // Valby, Vanløse, Brønshøj, etc.
    ],
    name: 'København'
  },
  AARHUS: {
    ranges: [
      { start: 8000, end: 8270 }, // Århus C, N, V, Ø, S
    ],
    name: 'Århus'
  },
  ODENSE: {
    ranges: [
      { start: 5000, end: 5290 }, // Odense C, N, S, V, Ø
    ],
    name: 'Odense'
  },
  AALBORG: {
    ranges: [
      { start: 9000, end: 9220 }, // Aalborg
    ],
    name: 'Aalborg'
  },
  ESBJERG: {
    ranges: [
      { start: 6700, end: 6715 }, // Esbjerg
    ],
    name: 'Esbjerg'
  },
  RANDERS: {
    ranges: [
      { start: 8900, end: 8963 }, // Randers
    ],
    name: 'Randers'
  },
  KOLDING: {
    ranges: [
      { start: 6000, end: 6092 }, // Kolding
    ],
    name: 'Kolding'
  },
  HORSENS: {
    ranges: [
      { start: 8700, end: 8700 }, // Horsens
    ],
    name: 'Horsens'
  },
  VEJLE: {
    ranges: [
      { start: 7100, end: 7100 }, // Vejle
    ],
    name: 'Vejle'
  },
  ROSKILDE: {
    ranges: [
      { start: 4000, end: 4000 }, // Roskilde
    ],
    name: 'Roskilde'
  }
};

export const DANISH_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'Nytårsdag', type: 'national' },
  { date: '2025-04-17', name: 'Skærtorsdag', type: 'religious' },
  { date: '2025-04-18', name: 'Langfredag', type: 'religious' },
  { date: '2025-04-21', name: 'Anden påskedag', type: 'religious' },
  { date: '2025-05-16', name: 'Store bededag', type: 'religious' },
  { date: '2025-05-29', name: 'Kristi himmelfart', type: 'religious' },
  { date: '2025-06-09', name: 'Anden pinsedag', type: 'religious' },
  { date: '2025-12-25', name: 'Juledag', type: 'national' },
  { date: '2025-12-26', name: 'Anden juledag', type: 'national' }
];

export const DANISH_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Nytårsdag', type: 'national' },
  { date: '2026-04-02', name: 'Skærtorsdag', type: 'religious' },
  { date: '2026-04-03', name: 'Langfredag', type: 'religious' },
  { date: '2026-04-06', name: 'Anden påskedag', type: 'religious' },
  { date: '2026-05-01', name: 'Store bededag', type: 'religious' },
  { date: '2026-05-14', name: 'Kristi himmelfart', type: 'religious' },
  { date: '2026-05-25', name: 'Anden pinsedag', type: 'religious' },
  { date: '2026-12-25', name: 'Juledag', type: 'national' },
  { date: '2026-12-26', name: 'Anden juledag', type: 'national' }
];

export const DANISH_CLEANING_INDUSTRY_STANDARDS = {
  // Standard working hours for cleaning industry
  WORKING_HOURS: {
    MORNING: { start: '06:00', end: '14:00' },
    AFTERNOON: { start: '14:00', end: '22:00' },
    EVENING: { start: '18:00', end: '02:00' },
    NIGHT: { start: '22:00', end: '06:00' }
  },
  
  // Standard job durations in minutes
  JOB_DURATIONS: {
    KONTORRENHOLD: { min: 120, max: 480, standard: 240 }, // 2-8 hours, standard 4
    PRIVATRENHOLD: { min: 90, max: 300, standard: 180 },  // 1.5-5 hours, standard 3
    FLYTTERENHOLD: { min: 240, max: 720, standard: 480 }, // 4-12 hours, standard 8
    BYGGERENHOLD: { min: 300, max: 1200, standard: 600 }, // 5-20 hours, standard 10
    VINDUESPUDSNING: { min: 60, max: 480, standard: 240 }, // 1-8 hours, standard 4
    TÆPPERENS: { min: 120, max: 360, standard: 240 },     // 2-6 hours, standard 4
    SPECIALRENGØRING: { min: 180, max: 600, standard: 360 }, // 3-10 hours, standard 6
    VEDLIGEHOLDELSE: { min: 60, max: 240, standard: 120 },  // 1-4 hours, standard 2
    DYBRENGØRING: { min: 240, max: 720, standard: 480 },   // 4-12 hours, standard 8
    AKUTRENGØRING: { min: 60, max: 480, standard: 180 }    // 1-8 hours, standard 3
  },
  
  // Standard hourly rates (DKK) by role
  HOURLY_RATES: {
    TRAINEE: { min: 180, max: 220, standard: 200 },
    CLEANER: { min: 220, max: 280, standard: 250 },
    SPECIALIST: { min: 280, max: 350, standard: 320 },
    TEAM_LEADER: { min: 300, max: 400, standard: 350 }
  },
  
  // Danish cleaning industry certifications
  CERTIFICATIONS: [
    'Kemikaliesikkerhed',
    'Førstehjælp',
    'Arbejdsmiljø',
    'Højdearbejde',
    'Specialudstyr',
    'Sikkerhed på byggepladser',
    'HACCP-certificering',
    'Foodsafe',
    'Miljøvenlig rengøring',
    'Kæledyrsvenlige produkter'
  ],
  
  // Common Danish cleaning supplies and equipment
  SUPPLIES: [
    { name: 'Øko rengøringsmiddel', unit: 'liter', category: 'cleaning_agents' },
    { name: 'Mikrofiberklude', unit: 'stk', category: 'cloths' },
    { name: 'Affaldsposer', unit: 'rulle', category: 'waste_management' },
    { name: 'Badrengøring', unit: 'liter', category: 'bathroom_cleaning' },
    { name: 'Kluderengøring', unit: 'liter', category: 'cleaning_agents' },
    { name: 'Gulvrens', unit: 'liter', category: 'floor_cleaning' },
    { name: 'Vinduesvaskemiddel', unit: 'liter', category: 'window_cleaning' },
    { name: 'HACCP-godkendt rengøringsmiddel', unit: 'liter', category: 'food_safe' },
    { name: 'Desinfektionsmiddel', unit: 'liter', category: 'disinfectants' },
    { name: 'Specialklude - køkken', unit: 'stk', category: 'kitchen_supplies' }
  ],
  
  EQUIPMENT: [
    { name: 'Støvsuger - industriel', category: 'vacuums' },
    { name: 'Gulvvasker', category: 'floor_cleaning' },
    { name: 'Vinduesvaskersæt', category: 'window_cleaning' },
    { name: 'Højtryksrenser - professionel', category: 'pressure_cleaning' },
    { name: 'Damprengjøjer', category: 'steam_cleaning' },
    { name: 'Fedtaffedbfjerner', category: 'grease_removal' },
    { name: 'Industristøvsuger', category: 'industrial_vacuums' },
    { name: 'Skraber sæt', category: 'scraping_tools' },
    { name: 'Sikkerhedsudstyr', category: 'safety_equipment' }
  ]
};

export const DANISH_ADDRESS_VALIDATION = {
  // Common Danish street types
  STREET_TYPES: [
    'gade', 'vej', 'alle', 'plads', 'torv', 'stræde', 'brygge', 'kaj',
    'boulevard', 'promenade', 'stien', 'passage', 'gang', 'kvarter'
  ],
  
  // Danish city name patterns
  CITY_PATTERNS: [
    /^[A-ZÆØÅ][a-zæøå]+(\s[A-ZÆØÅ][a-zæøå]+)*$/
  ],
  
  // Postal code validation
  POSTAL_CODE_PATTERN: /^[0-9]{4}$/,
  
  // Phone number patterns
  PHONE_PATTERNS: [
    /^\+45\s?[0-9]{8}$/, // +45 12345678
    /^[0-9]{8}$/,        // 12345678
    /^[0-9]{2}\s[0-9]{2}\s[0-9]{2}\s[0-9]{2}$/ // 12 34 56 78
  ]
};

export const DANISH_BUSINESS_RULES = {
  // Minimum job duration between jobs (travel time)
  MIN_TRAVEL_TIME: 15, // minutes
  
  // Maximum jobs per day per team member
  MAX_JOBS_PER_DAY: 8,
  
  // Maximum working hours per day
  MAX_HOURS_PER_DAY: 10,
  
  // Minimum break time between jobs
  MIN_BREAK_TIME: 30, // minutes
  
  // Danish business hours
  BUSINESS_HOURS: {
    MONDAY: { start: '08:00', end: '18:00' },
    TUESDAY: { start: '08:00', end: '18:00' },
    WEDNESDAY: { start: '08:00', end: '18:00' },
    THURSDAY: { start: '08:00', end: '18:00' },
    FRIDAY: { start: '08:00', end: '16:00' },
    SATURDAY: { start: '09:00', end: '15:00' },
    SUNDAY: { start: '10:00', end: '14:00' }
  },
  
  // Danish cleaning industry specific rules
  CLEANING_RULES: {
    // Minimum time between jobs for equipment cleaning
    EQUIPMENT_CLEANING_TIME: 15, // minutes
    
    // Required certifications for specific job types
    REQUIRED_CERTIFICATIONS: {
      VINDUESPUDSNING: ['Højdearbejde', 'Specialudstyr'],
      BYGGERENHOLD: ['Sikkerhed på byggepladser', 'Arbejdsmiljø'],
      SPECIALRENGØRING: ['HACCP-certificering', 'Foodsafe'],
      DYBRENGØRING: ['Kemikaliesikkerhed', 'Miljøvenlig rengøring']
    },
    
    // Weather-dependent job types
    WEATHER_DEPENDENT: ['VINDUESPUDSNING', 'PRESSURE_WASHING'],
    
    // Maximum wind speed for window cleaning (m/s)
    MAX_WIND_SPEED_WINDOW_CLEANING: 10
  }
};

// Utility functions for Danish business logic
export const DanishBusinessUtils = {
  // Validate Danish postal code
  isValidPostalCode: (postalCode: string): boolean => {
    return DANISH_ADDRESS_VALIDATION.POSTAL_CODE_PATTERN.test(postalCode);
  },
  
  // Get city name from postal code
  getCityFromPostalCode: (postalCode: string): string | null => {
    const code = parseInt(postalCode);
    for (const [cityName, cityData] of Object.entries(DANISH_POSTAL_CODES)) {
      for (const range of cityData.ranges) {
        if (code >= range.start && code <= range.end) {
          return cityData.name;
        }
      }
    }
    return null;
  },
  
  // Check if date is Danish holiday
  isDanishHoliday: (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    const holidays = year === 2025 ? DANISH_HOLIDAYS_2025 : DANISH_HOLIDAYS_2026;
    return holidays.some(holiday => holiday.date === dateStr);
  },
  
  // Get standard job duration for job type
  getStandardJobDuration: (jobType: string): number => {
    const durations = DANISH_CLEANING_INDUSTRY_STANDARDS.JOB_DURATIONS;
    return durations[jobType as keyof typeof durations]?.standard || 180;
  },
  
  // Get standard hourly rate for role
  getStandardHourlyRate: (role: string): number => {
    const rates = DANISH_CLEANING_INDUSTRY_STANDARDS.HOURLY_RATES;
    return rates[role as keyof typeof rates]?.standard || 250;
  },
  
  // Validate Danish phone number
  isValidDanishPhone: (phone: string): boolean => {
    return DANISH_ADDRESS_VALIDATION.PHONE_PATTERNS.some(pattern => pattern.test(phone));
  },
  
  // Format Danish phone number
  formatDanishPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `+45 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    }
    return phone;
  }
};
