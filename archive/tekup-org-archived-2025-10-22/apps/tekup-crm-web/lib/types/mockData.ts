// Mock Data for Danish Cleaning Industry
// Realistiske data til demonstration af TekUp.org scheduling system

import { CleaningJob, TeamMember, CleaningJobType, JobStatus, CalendarEvent, Customer } from '../types/scheduling';

// Danske kunder
export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Copenhagen Business Center',
    address: 'Vesterbrogade 123',
    city: 'København V',
    postalCode: '1620',
    phone: '+45 33 12 34 56',
    email: 'kontakt@cbcenter.dk',
    accessInstructions: 'Reception, 2. sal til højre'
  },
  {
    id: 'cust-002', 
    name: 'Nordea Bank Filial',
    address: 'Kongens Nytorv 8',
    city: 'København K',
    postalCode: '1050',
    phone: '+45 70 33 33 33',
    email: 'facility@nordea.dk',
    accessInstructions: 'Medarbejderindgang, kode 1234'
  },
  {
    id: 'cust-003',
    name: 'Aalborg Universitet',
    address: 'Fredrik Bajers Vej 7',
    city: 'Aalborg',
    postalCode: '9220',
    phone: '+45 99 40 99 40',
    email: 'facility@aau.dk'
  },
  {
    id: 'cust-004',
    name: 'Familie Sørensen',
    address: 'Østerbrogade 145, 2. th',
    city: 'København Ø',
    postalCode: '2100',
    phone: '+45 23 45 67 89',
    email: 'lars.soerensen@gmail.com',
    accessInstructions: 'Nøgle i låst nøgleboks ved døren. Kode: 1945'
  },
  {
    id: 'cust-005',
    name: 'TDC NET A/S',
    address: 'Teglholmsgade 1',
    city: 'København S',
    postalCode: '2450',
    phone: '+45 80 40 40 40',
    email: 'facilities@tdcnet.dk',
    accessInstructions: 'Sikkerhedsvagt i reception. Ring på forhånd.'
  }
];

// Danske team medlemmer
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Morten Nielsen',
    role: 'team_leader',
    phone: '+45 20 12 34 56',
    skills: ['basic_cleaning', 'window_cleaning', 'quality_control', 'chemical_handling'],
    hourlyRate: 285,
    availability: {
      monday: [{ start: '08:00', end: '16:00', available: true }],
      tuesday: [{ start: '08:00', end: '16:00', available: true }],
      wednesday: [{ start: '08:00', end: '16:00', available: true }],
      thursday: [{ start: '08:00', end: '16:00', available: true }],
      friday: [{ start: '08:00', end: '15:00', available: true }],
      saturday: [{ start: '09:00', end: '13:00', available: true }],
      sunday: [{ start: '09:00', end: '13:00', available: false }]
    },
    certifications: ['Kemikaliesikkerhed', 'Førstehjælp', 'Arbejdsmiljø']
  },
  {
    id: 'tm-2', 
    name: 'Anna Larsen',
    role: 'cleaner',
    phone: '+45 31 87 65 43',
    skills: ['basic_cleaning', 'carpet_cleaning', 'floor_maintenance'],
    hourlyRate: 245,
    availability: {
      monday: [{ start: '09:00', end: '17:00', available: true }],
      tuesday: [{ start: '09:00', end: '17:00', available: true }],
      wednesday: [{ start: '09:00', end: '17:00', available: true }],
      thursday: [{ start: '09:00', end: '17:00', available: true }],
      friday: [{ start: '09:00', end: '16:00', available: true }],
      saturday: [{ start: '10:00', end: '14:00', available: true }],
      sunday: [{ start: '10:00', end: '14:00', available: false }]
    }
  },
  {
    id: 'tm-3',
    name: 'Peter Andersen', 
    role: 'specialist',
    phone: '+45 42 56 78 90',
    skills: ['window_cleaning', 'pressure_washing', 'specialized_equipment'],
    hourlyRate: 325,
    availability: {
      monday: [{ start: '07:00', end: '15:00', available: true }],
      tuesday: [{ start: '07:00', end: '15:00', available: true }],
      wednesday: [{ start: '07:00', end: '15:00', available: true }],
      thursday: [{ start: '07:00', end: '15:00', available: true }],
      friday: [{ start: '07:00', end: '14:00', available: true }],
      saturday: [{ start: '08:00', end: '12:00', available: true }],
      sunday: [{ start: '08:00', end: '12:00', available: false }]
    },
    certifications: ['Højdearbejde', 'Specialudstyr', 'Sikkerhed på byggepladser']
  },
  {
    id: 'tm-4',
    name: 'Marie Hansen',
    role: 'cleaner', 
    phone: '+45 53 21 09 87',
    skills: ['basic_cleaning', 'carpet_cleaning', 'chemical_handling'],
    hourlyRate: 250,
    availability: {
      monday: [{ start: '10:00', end: '18:00', available: true }],
      tuesday: [{ start: '10:00', end: '18:00', available: true }],
      wednesday: [{ start: '10:00', end: '18:00', available: true }],
      thursday: [{ start: '10:00', end: '18:00', available: true }],
      friday: [{ start: '10:00', end: '17:00', available: true }],
      saturday: [{ start: '11:00', end: '15:00', available: false }],
      sunday: [{ start: '11:00', end: '15:00', available: false }]
    }
  }
];

// Danske virksomheder og privatkunder
export const mockCleaningJobs: CleaningJob[] = [
  {
    id: 'job-1',
    customer: {
      id: 'cust-001',
      name: 'Copenhagen Business Center',
      address: 'Vesterbrogade 123',
      city: 'København V',
      postalCode: '1620',
      phone: '+45 33 12 34 56',
      email: 'kontakt@cbcenter.dk',
      accessInstructions: 'Reception, 2. sal til højre',
      cleaningPreferences: {
        preferredTime: 'evening',
        accessMethod: 'doorman', 
        specialInstructions: ['Ingen støj efter 20:00', 'Laboratorier kræver specialrengøring'],
        allergyNotes: ['Ingen nødder i kantineområder'],
        fragrance: 'none',
        environmentalPreferences: 'eco'
      }
    },
    title: 'Ugeligt kontorrenhold - Hovedkontor',
    description: 'Fuld rengøring af kontorområder, køkkener, toiletter og mødelokaler. Inkl. laboratorie-forrum.',
    jobType: 'kontorrenhold',
    scheduledDate: new Date('2025-09-15T18:00:00'),
    scheduledTime: '18:00',
    estimatedDuration: 240, // 4 timer
    actualDuration: 225,
    status: 'scheduled',
    priority: 'high',
    teamMembers: [mockTeamMembers[0], mockTeamMembers[1]],
    location: {
      address: 'Novo Allé 1',
      city: 'Bagsværd', 
      postalCode: '2880',
      coordinates: { lat: 55.7584, lng: 12.4103 },
      accessInstructions: 'Indgang C, elevator til 3. sal',
      parkingInstructions: 'Besøgsparking i gård, maks 4 timer',
      floor: 3
    },
    recurring: {
      frequency: 'weekly',
      interval: 1,
      weekdays: [1, 3, 5], // mandag, onsdag, fredag
      skipHolidays: true,
      autoConfirm: true
    },
    equipment: [
      { name: 'Støvsuger - industriel', quantity: 2, required: true },
      { name: 'Gulvvasker', quantity: 1, required: true },
      { name: 'Vinduesvaskersæt', quantity: 1, required: false }
    ],
    supplies: [
      { name: 'Øko rengøringsmiddel', quantity: 2, unit: 'liter', cost: 45 },
      { name: 'Mikrofiberklude', quantity: 10, unit: 'stk', cost: 125 },
      { name: 'Affaldsposer', quantity: 1, unit: 'rulle', cost: 35 }
    ],
    specialRequirements: [
      'Miljøvenlige produkter kun',
      'Ingen kemikalier i laboratorieområder',
      'Diskret - aftenmøder kan foregå'
    ],
    cost: {
      basePrice: 2800,
      hourlyRate: 285,
      actualHours: 3.75,
      supplies: 205,
      equipment: 0,
      total: 3005,
      currency: 'DKK',
      invoiced: false
    },
    createdAt: new Date('2025-09-10T10:00:00'),
    updatedAt: new Date('2025-09-14T15:30:00')
  },
  {
    id: 'job-2',
    customer: {
      id: 'cust-002', 
      name: 'Nordea Bank Filial',
      address: 'Kongens Nytorv 8',
      city: 'København K',
      postalCode: '1050',
      phone: '+45 70 33 33 33',
      email: 'facility@nordea.dk',
      accessInstructions: 'Medarbejderindgang, kode 1234',
      cleaningPreferences: {
        preferredTime: 'morning',
        accessMethod: 'keybox',
        specialInstructions: ['Pas på katten Felix', 'Fjern sko ved indgang'],
        petNotes: ['Kat - meget venlig men sky'],
        fragrance: 'light',
        environmentalPreferences: 'standard'
      }
    },
    title: 'Månedlig privatrenhold - 3 værelses',
    description: 'Grundig rengøring af 3-værelses lejlighed. Køkken, bad, stue og 2 soveværelser.',
    jobType: 'privatrenhold',
    scheduledDate: new Date('2025-09-16T09:00:00'),
    scheduledTime: '09:00',
    estimatedDuration: 180, // 3 timer
    status: 'confirmed',
    priority: 'normal',
    teamMembers: [mockTeamMembers[1]],
    location: {
      address: 'Østerbrogade 145, 2. th',
      city: 'København Ø',
      postalCode: '2100',
      coordinates: { lat: 55.7089, lng: 12.5839 },
      floor: 2,
      apartmentNumber: 'th',
      accessInstructions: 'Nøgleboks ved hovedindgang',
      parkingInstructions: 'Parkeringshus på Trianglen, 200m væk'
    },
    recurring: {
      frequency: 'monthly',
      interval: 1,
      weekdays: [2], // tirsdag
      skipHolidays: true,
      autoConfirm: false
    },
    equipment: [
      { name: 'Almindelig støvsuger', quantity: 1, required: true },
      { name: 'Gulvmoppe', quantity: 1, required: true }
    ],
    supplies: [
      { name: 'Badrengøring', quantity: 1, unit: 'liter', cost: 25 },
      { name: 'Kluderengøring', quantity: 0.5, unit: 'liter', cost: 15 },
      { name: 'Gulvrens', quantity: 0.5, unit: 'liter', cost: 20 }
    ],
    specialRequirements: [
      'Kæledyrsvenlige produkter',
      'Ekstra forsigtig omkring dyregrejer'
    ],
    cost: {
      basePrice: 1200,
      hourlyRate: 245,
      supplies: 60,
      equipment: 0,
      total: 1260,
      currency: 'DKK',
      invoiced: false
    },
    createdAt: new Date('2025-09-08T14:20:00'),
    updatedAt: new Date('2025-09-14T09:15:00')
  },
  {
    id: 'job-3',
    customer: {
      id: 'cust-3',
      name: 'TDC NET A/S',
      address: 'Teglholmsgade 1',
      city: 'København S',
      postalCode: '2450',
      phone: '+45 80 40 40 40',
      email: 'facilities@tdcnet.dk',
      accessInstructions: 'Sikkerhedsvagt i reception. Ring på forhånd.',
      cleaningPreferences: {
        preferredTime: 'evening',
        accessMethod: 'present',
        specialInstructions: ['Serverrum kræver specialadgang', 'Lydløst efter 22:00'],
        fragrance: 'none',
        environmentalPreferences: 'eco'
      }
    },
    title: 'Vinduespudsning - Kontorbygning 12 etager',
    description: 'Udvendig vinduespudsning af kontorbygning. Alle vinduer på alle etager.',
    jobType: 'vinduespudsning',
    scheduledDate: new Date('2025-09-17T07:00:00'),
    scheduledTime: '07:00', 
    estimatedDuration: 480, // 8 timer
    status: 'scheduled',
    priority: 'normal',
    teamMembers: [mockTeamMembers[2], mockTeamMembers[3]],
    location: {
      address: 'Teglholmsgade 1',
      city: 'København S',
      postalCode: '2450',
      coordinates: { lat: 55.6456, lng: 12.5681 },
      accessInstructions: 'Indgang via parkeringskælder, elevator til stueetage',
      parkingInstructions: 'Leverandørparkering i kælder niveau -1'
    },
    equipment: [
      { name: 'Vinduesvaskerudstyr - professionelt', quantity: 2, required: true },
      { name: 'Lift/platform', quantity: 1, required: true, notes: 'Lejes eksternt' },
      { name: 'Sikkerhedsudstyr - højde', quantity: 2, required: true }
    ],
    supplies: [
      { name: 'Vinduesvaskemiddel', quantity: 5, unit: 'liter', cost: 150 },
      { name: 'Skrabere', quantity: 4, unit: 'stk', cost: 80 },
      { name: 'Gummiskrabere', quantity: 6, unit: 'stk', cost: 120 }
    ],
    specialRequirements: [
      'Højdearbejde certificering påkrævet',
      'Sikkerhedsudstyr kontrolleret før start',
      'Vejrafhængig - kan udskydes ved vind over 10 m/s'
    ],
    cost: {
      basePrice: 4500,
      hourlyRate: 325,
      supplies: 350,
      equipment: 800, // lift leje
      total: 5650,
      currency: 'DKK',
      invoiced: false
    },
    createdAt: new Date('2025-09-05T11:00:00'),
    updatedAt: new Date('2025-09-14T16:45:00')
  },
  {
    id: 'job-4',
    customer: {
      id: 'cust-4',
      name: 'Restaurant Noma',
      address: 'Refshalevej 96',
      city: 'København K',
      postalCode: '1432',
      phone: '+45 32 96 32 97',
      email: 'info@noma.dk',
      accessInstructions: 'Tjenesteingang på bagside. Ring på før ankomst.',
      cleaningPreferences: {
        preferredTime: 'morning',
        accessMethod: 'present',
        specialInstructions: ['Specialrengøring af køkken efter HACCP', 'Meget høje hygiejnekrav'],
        fragrance: 'none',
        environmentalPreferences: 'organic'
      }
    },
    title: 'Dybrengøring - Køkken og restaurant',
    description: 'Fuld dybrengøring af professionelt køkken og spiseareal. HACCP-certificeret rengøring.',
    jobType: 'dybrengøring',
    scheduledDate: new Date('2025-09-18T04:00:00'),
    scheduledTime: '04:00',
    estimatedDuration: 360, // 6 timer
    status: 'confirmed',
    priority: 'high',
    teamMembers: [mockTeamMembers[0], mockTeamMembers[1], mockTeamMembers[3]],
    location: {
      address: 'Refshalevej 96',
      city: 'København K', 
      postalCode: '1432',
      coordinates: { lat: 55.6998, lng: 12.6112 },
      accessInstructions: 'Tjenesteingang, ring på dørtelefonbellen',
      parkingInstructions: 'Varegård bag bygningen'
    },
    equipment: [
      { name: 'Højtryksrenser - professionel', quantity: 1, required: true },
      { name: 'Damprengjøjer', quantity: 1, required: true },
      { name: 'Fedtaffedbfjerner', quantity: 1, required: true }
    ],
    supplies: [
      { name: 'HACCP-godkendt rengøringsmiddel', quantity: 3, unit: 'liter', cost: 180 },
      { name: 'Desinfektionsmiddel', quantity: 2, unit: 'liter', cost: 95 },
      { name: 'Specialklude - køkken', quantity: 20, unit: 'stk', cost: 200 }
    ],
    specialRequirements: [
      'HACCP-certificering påkrævet',
      'Foodsafe kemikalier kun',
      'Dokumentation af rengøringsproces',
      'Temperaturtjek af køl/frys efter rengøring'
    ],
    cost: {
      basePrice: 6500,
      hourlyRate: 285,
      supplies: 475,
      equipment: 200,
      total: 7175,
      currency: 'DKK',
      invoiced: false
    },
    createdAt: new Date('2025-09-12T09:30:00'),
    updatedAt: new Date('2025-09-14T14:20:00')
  },
  {
    id: 'job-5',
    customer: {
      id: 'cust-5',
      name: 'Byggeentreprenør Hansen ApS',
      address: 'Amager Strandvej 301',
      city: 'København S',
      postalCode: '2300',
      phone: '+45 43 56 78 90',
      email: 'kontor@hansen-byg.dk',
      accessInstructions: 'Byggeplads - kræver sikkerhedsudstyr og indlægningssekering.',
      cleaningPreferences: {
        preferredTime: 'afternoon',
        accessMethod: 'key',
        specialInstructions: ['Byggerenhold efter projekt afslutning', 'Meget støvet og beskidt'],
        fragrance: 'none',
        environmentalPreferences: 'standard'
      }
    },
    title: 'Byggerenhold - Nybyggeri 45 lejligheder',
    description: 'Byggerenh ild efter afsluttet byggeprojekt. Fjernelse af støv, maling rester, lim og byggeaffald.',
    jobType: 'byggerenhold',
    scheduledDate: new Date('2025-09-19T13:00:00'),
    scheduledTime: '13:00',
    estimatedDuration: 600, // 10 timer
    status: 'scheduled',
    priority: 'normal',
    teamMembers: [mockTeamMembers[0], mockTeamMembers[1], mockTeamMembers[2], mockTeamMembers[3]],
    location: {
      address: 'Amager Strandvej 301',
      city: 'København S',
      postalCode: '2300',
      coordinates: { lat: 55.6395, lng: 12.6579 },
      accessInstructions: 'Byggecontainer som kontor, hent nøgler hos byggel leder',
      parkingInstructions: 'Parkning på byggeplads'
    },
    equipment: [
      { name: 'Industristøvsuger', quantity: 4, required: true },
      { name: 'Skraber sæt', quantity: 8, required: true },
      { name: 'Sikkerhedsudstyr', quantity: 4, required: true }
    ],
    supplies: [
      { name: 'Kraftig rengøringsmiddel', quantity: 10, unit: 'liter', cost: 350 },
      { name: 'Skuresvampe', quantity: 50, unit: 'stk', cost: 250 },
      { name: 'Engangsklude', quantity: 5, unit: 'pakke', cost: 175 }
    ],
    specialRequirements: [
      'Sikkerhedsudstyr obligatorisk',
      'Meget hårdt fysisk arbejde',
      'Støvet miljø - åndedrætsværn nødvendigt',
      'Affaldssortering efter byggeaffald regler'
    ],
    cost: {
      basePrice: 12000,
      hourlyRate: 285,
      supplies: 775,
      equipment: 400,
      total: 13175,
      currency: 'DKK',
      invoiced: false
    },
    createdAt: new Date('2025-09-01T16:00:00'),
    updatedAt: new Date('2025-09-14T11:30:00')
  }
];

// Kalender events til visning
export const mockCalendarEvents: CalendarEvent[] = mockCleaningJobs.map(job => ({
  id: `event-${job.id}`,
  title: `${job.jobType} - ${job.customer.name}`,
  start: job.scheduledDate,
  end: new Date(job.scheduledDate.getTime() + job.estimatedDuration * 60000),
  allDay: false,
  job: job,
  type: 'job',
  color: getJobTypeColor(job.jobType),
  editable: job.status !== 'completed'
}));

// Hjælpefunktion til jobtype farver
function getJobTypeColor(jobType: CleaningJobType): string {
  const colors = {
    'kontorrenhold': '#3B82F6',     // blå
    'privatrenhold': '#10B981',     // grøn
    'flytterenhold': '#F59E0B',     // orange
    'byggerenhold': '#EF4444',      // rød
    'vinduespudsning': '#8B5CF6',   // lilla
    'tæpperens': '#06B6D4',         // cyan
    'specialrengøring': '#EC4899',  // pink
    'vedligeholdelse': '#84CC16',   // lime
    'dybrengøring': '#F97316',      // orange-rød
    'akutrengøring': '#DC2626'      // mørk rød
  };
  return colors[jobType] || '#6B7280';
}

// Danske helligdage 2025
export const danishHolidays2025 = [
  new Date('2025-01-01'), // Nytårsdag
  new Date('2025-04-17'), // Skærtorsdag
  new Date('2025-04-18'), // Langfredag  
  new Date('2025-04-21'), // Anden påskedag
  new Date('2025-05-16'), // Store bededag
  new Date('2025-05-29'), // Kristi himmelfart
  new Date('2025-06-09'), // Anden pinsedag
  new Date('2025-12-25'), // Juledag
  new Date('2025-12-26')  // Anden juledag
];

// Utility functions
export const getJobsByDate = (date: Date): CleaningJob[] => {
  return mockCleaningJobs.filter(job => 
    job.scheduledDate.toDateString() === date.toDateString()
  );
};

export const getJobsByTeamMember = (teamMemberId: string): CleaningJob[] => {
  return mockCleaningJobs.filter(job =>
    job.teamMembers.some(member => member.id === teamMemberId)
  );
};

export const getJobsByStatus = (status: JobStatus): CleaningJob[] => {
  return mockCleaningJobs.filter(job => job.status === status);
};

export const getJobsByCustomer = (customerId: string): CleaningJob[] => {
  return mockCleaningJobs.filter(job => job.customer.id === customerId);
};
