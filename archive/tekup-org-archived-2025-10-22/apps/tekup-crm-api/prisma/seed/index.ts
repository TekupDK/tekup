// Database Seeding for Danish Cleaning Industry
// TekUp.org CRM - Rengøringsbranchen data seeding

import { PrismaClient } from '@prisma/client';
import { DanishBusinessUtils, DANISH_CLEANING_INDUSTRY_STANDARDS } from './danish-business-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Danish cleaning industry...');

  // Create demo tenant
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'Rengøringsfirmaet A/S',
      domain: 'demo.rengoeringsfirmaet.dk',
      cvrNumber: '12345678',
      address: 'Hovedgaden 123',
      city: 'København',
      postalCode: '2100',
      phone: '+45 33 12 34 56',
      email: 'info@rengoeringsfirmaet.dk',
      subscriptionTier: 'enterprise',
      maxUsers: 50,
      maxJobs: 1000
    }
  });

  console.log('✅ Created demo tenant:', demoTenant.name);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'admin@rengoeringsfirmaet.dk',
      name: 'Administrator',
      role: 'TENANT_ADMIN'
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create team members
  const teamMembers = await Promise.all([
    prisma.teamMember.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Morten Nielsen',
        role: 'TEAM_LEADER',
        phone: '+45 20 12 34 56',
        email: 'morten@rengoeringsfirmaet.dk',
        hourlyRate: 350,
        skills: ['BASIC_CLEANING', 'WINDOW_CLEANING', 'QUALITY_CONTROL', 'CHEMICAL_HANDLING'],
        certifications: ['Kemikaliesikkerhed', 'Førstehjælp', 'Arbejdsmiljø'],
        availability: {
          monday: [{ start: '08:00', end: '16:00', available: true }],
          tuesday: [{ start: '08:00', end: '16:00', available: true }],
          wednesday: [{ start: '08:00', end: '16:00', available: true }],
          thursday: [{ start: '08:00', end: '16:00', available: true }],
          friday: [{ start: '08:00', end: '15:00', available: true }],
          saturday: [{ start: '09:00', end: '13:00', available: true }],
          sunday: [{ start: '09:00', end: '13:00', available: false }]
        }
      }
    }),
    prisma.teamMember.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Anna Larsen',
        role: 'CLEANER',
        phone: '+45 31 87 65 43',
        email: 'anna@rengoeringsfirmaet.dk',
        hourlyRate: 250,
        skills: ['BASIC_CLEANING', 'CARPET_CLEANING', 'FLOOR_MAINTENANCE'],
        certifications: ['Førstehjælp'],
        availability: {
          monday: [{ start: '09:00', end: '17:00', available: true }],
          tuesday: [{ start: '09:00', end: '17:00', available: true }],
          wednesday: [{ start: '09:00', end: '17:00', available: true }],
          thursday: [{ start: '09:00', end: '17:00', available: true }],
          friday: [{ start: '09:00', end: '16:00', available: true }],
          saturday: [{ start: '10:00', end: '14:00', available: true }],
          sunday: [{ start: '10:00', end: '14:00', available: false }]
        }
      }
    }),
    prisma.teamMember.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Peter Andersen',
        role: 'SPECIALIST',
        phone: '+45 42 56 78 90',
        email: 'peter@rengoeringsfirmaet.dk',
        hourlyRate: 320,
        skills: ['WINDOW_CLEANING', 'PRESSURE_WASHING', 'SPECIALIZED_EQUIPMENT'],
        certifications: ['Højdearbejde', 'Specialudstyr', 'Sikkerhed på byggepladser'],
        availability: {
          monday: [{ start: '07:00', end: '15:00', available: true }],
          tuesday: [{ start: '07:00', end: '15:00', available: true }],
          wednesday: [{ start: '07:00', end: '15:00', available: true }],
          thursday: [{ start: '07:00', end: '15:00', available: true }],
          friday: [{ start: '07:00', end: '14:00', available: true }],
          saturday: [{ start: '08:00', end: '12:00', available: true }],
          sunday: [{ start: '08:00', end: '12:00', available: false }]
        }
      }
    })
  ]);

  console.log('✅ Created team members:', teamMembers.length);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Copenhagen Business Center',
        segment: 'COMMERCIAL',
        email: 'kontakt@cbcenter.dk',
        phone: '+45 33 12 34 56',
        address: 'Vesterbrogade 123',
        city: 'København V',
        postalCode: '1620',
        cvrNumber: '87654321',
        annualContractValue: 500000,
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2025-12-31'),
        serviceLevel: 'ENTERPRISE',
        cleaningPreferences: {
          preferredTime: 'evening',
          accessMethod: 'doorman',
          specialInstructions: ['Ingen støj efter 20:00', 'Laboratorier kræver specialrengøring'],
          allergyNotes: ['Ingen nødder i kantineområder'],
          fragrance: 'none',
          environmentalPreferences: 'eco'
        },
        accessInstructions: 'Reception, 2. sal til højre'
      }
    }),
    prisma.customer.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Nordea Bank Filial',
        segment: 'COMMERCIAL',
        email: 'facility@nordea.dk',
        phone: '+45 70 33 33 33',
        address: 'Kongens Nytorv 8',
        city: 'København K',
        postalCode: '1050',
        cvrNumber: '12345678',
        annualContractValue: 750000,
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2025-12-31'),
        serviceLevel: 'ENTERPRISE',
        cleaningPreferences: {
          preferredTime: 'morning',
          accessMethod: 'keybox',
          specialInstructions: ['Pas på katten Felix', 'Fjern sko ved indgang'],
          petNotes: ['Kat - meget venlig men sky'],
          fragrance: 'light',
          environmentalPreferences: 'standard'
        },
        accessInstructions: 'Medarbejderindgang, kode 1234'
      }
    }),
    prisma.customer.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Familie Sørensen',
        segment: 'RESIDENTIAL',
        email: 'lars.soerensen@gmail.com',
        phone: '+45 23 45 67 89',
        address: 'Østerbrogade 145, 2. th',
        city: 'København Ø',
        postalCode: '2100',
        annualContractValue: 15000,
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2025-12-31'),
        serviceLevel: 'STANDARD',
        cleaningPreferences: {
          preferredTime: 'morning',
          accessMethod: 'keybox',
          specialInstructions: ['Kæledyrsvenlige produkter', 'Ekstra forsigtig omkring dyregrejer'],
          petNotes: ['Kat - meget venlig men sky'],
          fragrance: 'light',
          environmentalPreferences: 'standard'
        },
        accessInstructions: 'Nøgle i låst nøgleboks ved døren. Kode: 1945'
      }
    })
  ]);

  console.log('✅ Created customers:', customers.length);

  // Create customer locations
  const locations = await Promise.all([
    prisma.customerLocation.create({
      data: {
        customerId: customers[0].id,
        name: 'Hovedkontor',
        address: 'Vesterbrogade 123',
        city: 'København V',
        postalCode: '1620',
        squareMeters: 500,
        cleaningType: 'OFFICE',
        visitFrequency: 'WEEKLY',
        specialRequirements: ['Laboratorie-forrum', 'Miljøvenlige produkter']
      }
    }),
    prisma.customerLocation.create({
      data: {
        customerId: customers[1].id,
        name: 'Bankfilial',
        address: 'Kongens Nytorv 8',
        city: 'København K',
        postalCode: '1050',
        squareMeters: 200,
        cleaningType: 'OFFICE',
        visitFrequency: 'DAILY',
        specialRequirements: ['Sikkerhedsområder', 'Kontanter ikke røre']
      }
    }),
    prisma.customerLocation.create({
      data: {
        customerId: customers[2].id,
        name: 'Lejlighed',
        address: 'Østerbrogade 145, 2. th',
        city: 'København Ø',
        postalCode: '2100',
        squareMeters: 85,
        cleaningType: 'RESIDENTIAL',
        visitFrequency: 'MONTHLY',
        specialRequirements: ['Kæledyrsvenlige produkter', 'Ekstra forsigtig omkring dyregrejer']
      }
    })
  ]);

  console.log('✅ Created customer locations:', locations.length);

  // Create equipment
  const equipment = await Promise.all([
    prisma.equipment.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Støvsuger - industriel',
        category: 'vacuums',
        description: 'Kraftig industristøvsuger til store områder',
        isAvailable: true
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Gulvvasker',
        category: 'floor_cleaning',
        description: 'Professionel gulvvasker til hårde gulve',
        isAvailable: true
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Vinduesvaskersæt',
        category: 'window_cleaning',
        description: 'Komplet vinduesvaskersæt med højdeudstyr',
        isAvailable: true
      }
    })
  ]);

  console.log('✅ Created equipment:', equipment.length);

  // Create supplies
  const supplies = await Promise.all([
    prisma.supply.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Øko rengøringsmiddel',
        category: 'cleaning_agents',
        unit: 'liter',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        costPerUnit: 45.00,
        supplier: 'EcoClean A/S'
      }
    }),
    prisma.supply.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Mikrofiberklude',
        category: 'cloths',
        unit: 'stk',
        currentStock: 200,
        minStock: 50,
        maxStock: 500,
        costPerUnit: 12.50,
        supplier: 'TextilService Danmark'
      }
    }),
    prisma.supply.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Affaldsposer',
        category: 'waste_management',
        unit: 'rulle',
        currentStock: 25,
        minStock: 5,
        maxStock: 50,
        costPerUnit: 35.00,
        supplier: 'MiljøService A/S'
      }
    })
  ]);

  console.log('✅ Created supplies:', supplies.length);

  // Create sample cleaning jobs
  const jobs = await Promise.all([
    prisma.cleaningJob.create({
      data: {
        tenantId: demoTenant.id,
        customerId: customers[0].id,
        locationId: locations[0].id,
        title: 'Ugeligt kontorrenhold - Hovedkontor',
        description: 'Fuld rengøring af kontorområder, køkkener, toiletter og mødelokaler. Inkl. laboratorie-forrum.',
        jobType: 'KONTORRENHOLD',
        status: 'SCHEDULED',
        priority: 'HIGH',
        scheduledDate: new Date('2025-09-15T18:00:00'),
        scheduledTime: '18:00',
        estimatedDuration: 240,
        locationDetails: {
          address: 'Vesterbrogade 123',
          city: 'København V',
          postalCode: '1620',
          coordinates: { lat: 55.6761, lng: 12.5683 },
          accessInstructions: 'Reception, 2. sal til højre',
          parkingInstructions: 'Besøgsparking i gård, maks 4 timer',
          floor: 2
        },
        recurringConfig: {
          frequency: 'weekly',
          interval: 1,
          weekdays: [1, 3, 5], // mandag, onsdag, fredag
          skipHolidays: true,
          autoConfirm: true
        },
        equipmentRequirements: [
          { name: 'Støvsuger - industriel', quantity: 2, required: true },
          { name: 'Gulvvasker', quantity: 1, required: true },
          { name: 'Vinduesvaskersæt', quantity: 1, required: false }
        ],
        supplyRequirements: [
          { name: 'Øko rengøringsmiddel', quantity: 2, unit: 'liter', cost: 45 },
          { name: 'Mikrofiberklude', quantity: 10, unit: 'stk', cost: 125 },
          { name: 'Affaldsposer', quantity: 1, unit: 'rulle', cost: 35 }
        ],
        specialRequirements: [
          'Miljøvenlige produkter kun',
          'Ingen kemikalier i laboratorieområder',
          'Diskret - aftenmøder kan foregå'
        ],
        costDetails: {
          basePrice: 2800,
          hourlyRate: 350,
          supplies: 205,
          equipment: 0,
          total: 3005,
          currency: 'DKK',
          invoiced: false
        }
      }
    }),
    prisma.cleaningJob.create({
      data: {
        tenantId: demoTenant.id,
        customerId: customers[2].id,
        locationId: locations[2].id,
        title: 'Månedlig privatrenhold - 3 værelses',
        description: 'Grundig rengøring af 3-værelses lejlighed. Køkken, bad, stue og 2 soveværelser.',
        jobType: 'PRIVATRENHOLD',
        status: 'CONFIRMED',
        priority: 'NORMAL',
        scheduledDate: new Date('2025-09-16T09:00:00'),
        scheduledTime: '09:00',
        estimatedDuration: 180,
        locationDetails: {
          address: 'Østerbrogade 145, 2. th',
          city: 'København Ø',
          postalCode: '2100',
          coordinates: { lat: 55.7089, lng: 12.5839 },
          floor: 2,
          apartmentNumber: 'th',
          accessInstructions: 'Nøgleboks ved hovedindgang',
          parkingInstructions: 'Parkeringshus på Trianglen, 200m væk'
        },
        recurringConfig: {
          frequency: 'monthly',
          interval: 1,
          weekdays: [2], // tirsdag
          skipHolidays: true,
          autoConfirm: false
        },
        equipmentRequirements: [
          { name: 'Almindelig støvsuger', quantity: 1, required: true },
          { name: 'Gulvmoppe', quantity: 1, required: true }
        ],
        supplyRequirements: [
          { name: 'Badrengøring', quantity: 1, unit: 'liter', cost: 25 },
          { name: 'Kluderengøring', quantity: 0.5, unit: 'liter', cost: 15 },
          { name: 'Gulvrens', quantity: 0.5, unit: 'liter', cost: 20 }
        ],
        specialRequirements: [
          'Kæledyrsvenlige produkter',
          'Ekstra forsigtig omkring dyregrejer'
        ],
        costDetails: {
          basePrice: 1200,
          hourlyRate: 250,
          supplies: 60,
          equipment: 0,
          total: 1260,
          currency: 'DKK',
          invoiced: false
        }
      }
    })
  ]);

  console.log('✅ Created cleaning jobs:', jobs.length);

  // Create job team assignments
  await Promise.all([
    prisma.jobTeamMember.create({
      data: {
        jobId: jobs[0].id,
        teamMemberId: teamMembers[0].id,
        role: 'Team Leader'
      }
    }),
    prisma.jobTeamMember.create({
      data: {
        jobId: jobs[0].id,
        teamMemberId: teamMembers[1].id,
        role: 'Cleaner'
      }
    }),
    prisma.jobTeamMember.create({
      data: {
        jobId: jobs[1].id,
        teamMemberId: teamMembers[1].id,
        role: 'Cleaner'
      }
    })
  ]);

  console.log('✅ Created job team assignments');

  // Create calendar events
  await Promise.all([
    prisma.calendarEvent.create({
      data: {
        jobId: jobs[0].id,
        title: 'Kontorrenhold - Copenhagen Business Center',
        start: jobs[0].scheduledDate,
        end: new Date(jobs[0].scheduledDate.getTime() + jobs[0].estimatedDuration * 60000),
        allDay: false,
        type: 'JOB',
        color: '#3B82F6',
        editable: true
      }
    }),
    prisma.calendarEvent.create({
      data: {
        jobId: jobs[1].id,
        title: 'Privatrenhold - Familie Sørensen',
        start: jobs[1].scheduledDate,
        end: new Date(jobs[1].scheduledDate.getTime() + jobs[1].estimatedDuration * 60000),
        allDay: false,
        type: 'JOB',
        color: '#10B981',
        editable: true
      }
    })
  ]);

  console.log('✅ Created calendar events');

  // Create sample metrics
  await prisma.schedulingMetrics.create({
    data: {
      tenantId: demoTenant.id,
      periodStart: new Date('2025-09-01'),
      periodEnd: new Date('2025-09-30'),
      totalJobs: 45,
      completedJobs: 42,
      cancelledJobs: 2,
      averageJobDuration: 195.5,
      totalRevenue: 125000.00,
      averageJobValue: 2777.78,
      customerSatisfaction: 4.2,
      teamUtilization: 0.85,
      routeEfficiency: 0.78,
      onTimeCompletion: 0.93,
      customerRetention: 0.95
    }
  });

  console.log('✅ Created sample metrics');

  // Create system configuration
  await prisma.systemConfig.create({
    data: {
      tenantId: demoTenant.id,
      key: 'danish_holidays',
      value: {
        holidays: [
          { date: '2025-01-01', name: 'Nytårsdag' },
          { date: '2025-04-17', name: 'Skærtorsdag' },
          { date: '2025-04-18', name: 'Langfredag' },
          { date: '2025-04-21', name: 'Anden påskedag' },
          { date: '2025-05-16', name: 'Store bededag' },
          { date: '2025-05-29', name: 'Kristi himmelfart' },
          { date: '2025-06-09', name: 'Anden pinsedag' },
          { date: '2025-12-25', name: 'Juledag' },
          { date: '2025-12-26', name: 'Anden juledag' }
        ]
      },
      description: 'Danske helligdage for 2025'
    }
  });

  console.log('✅ Created system configuration');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - 1 tenant: ${demoTenant.name}`);
  console.log(`   - 1 admin user: ${adminUser.email}`);
  console.log(`   - ${teamMembers.length} team members`);
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${locations.length} customer locations`);
  console.log(`   - ${equipment.length} equipment items`);
  console.log(`   - ${supplies.length} supply items`);
  console.log(`   - ${jobs.length} cleaning jobs`);
  console.log(`   - 2 calendar events`);
  console.log(`   - 1 metrics record`);
  console.log(`   - 1 system configuration`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
