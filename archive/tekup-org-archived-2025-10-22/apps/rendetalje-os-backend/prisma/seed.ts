import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Rendetalje OS database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rendetalje.dk' },
    update: {},
    create: {
      email: 'admin@rendetalje.dk',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Rendetalje',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date()
    }
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@rendetalje.dk' },
    update: {},
    create: {
      email: 'manager@rendetalje.dk',
      password: await bcrypt.hash('manager123', 12),
      firstName: 'Lars',
      lastName: 'Andersen',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: new Date()
    }
  });

  console.log('✅ Manager user created:', managerUser.email);

  // Create cleaning teams
  const team1 = await prisma.cleaningTeam.upsert({
    where: { id: 'team-1' },
    update: {},
    create: {
      id: 'team-1',
      name: 'Aarhus Center Team',
      description: 'Specialiseret i kontor- og erhvervsrengøring i Aarhus centrum',
      baseLocation: 'Aarhus C',
      operatingHours: {
        monday: { start: '06:00', end: '15:00' },
        tuesday: { start: '06:00', end: '15:00' },
        wednesday: { start: '06:00', end: '15:00' },
        thursday: { start: '06:00', end: '15:00' },
        friday: { start: '06:00', end: '15:00' }
      },
      vehicleInfo: {
        type: 'Mercedes Sprinter',
        licensePlate: 'AB 12 345',
        equipped: true
      }
    }
  });

  const team2 = await prisma.cleaningTeam.upsert({
    where: { id: 'team-2' },
    update: {},
    create: {
      id: 'team-2',
      name: 'Copenhagen Office Team',
      description: 'Specialiseret i store kontorbyggerier og medicinalrengøring',
      baseLocation: 'København',
      operatingHours: {
        monday: { start: '07:00', end: '16:00' },
        tuesday: { start: '07:00', end: '16:00' },
        wednesday: { start: '07:00', end: '16:00' },
        thursday: { start: '07:00', end: '16:00' },
        friday: { start: '07:00', end: '16:00' }
      },
      vehicleInfo: {
        type: 'Ford Transit',
        licensePlate: 'CD 67 890',
        equipped: true
      }
    }
  });

  console.log('✅ Cleaning teams created');

  // Create employees
  const employee1 = await prisma.cleaningEmployee.create({
    data: {
      teamId: team1.id,
      name: 'Maria Hansen',
      cprNumber: '0102901234',
      position: 'Senior Rengøringsassistent',
      startDate: new Date('2024-01-15'),
      specializations: ['Kontor', 'Medicinal', 'Vinduesrengøring'],
      weeklySchedule: {
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '16:00' }
      }
    }
  });

  const employee2 = await prisma.cleaningEmployee.create({
    data: {
      teamId: team1.id,
      name: 'Lars Nielsen',
      cprNumber: '1503851567',
      position: 'Rengøringsassistent',
      startDate: new Date('2024-03-01'),
      specializations: ['Butik', 'Restaurant', 'Grundrengøring'],
      weeklySchedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      }
    }
  });

  const employee3 = await prisma.cleaningEmployee.create({
    data: {
      teamId: team2.id,
      name: 'Anna Sørensen',
      cprNumber: '2408751234',
      position: 'Team Leader',
      startDate: new Date('2023-11-01'),
      specializations: ['Medicinal', 'Højtryk', 'Specialrengøring'],
      weeklySchedule: {
        monday: { start: '07:00', end: '15:00' },
        tuesday: { start: '07:00', end: '15:00' },
        wednesday: { start: '07:00', end: '15:00' },
        thursday: { start: '07:00', end: '15:00' },
        friday: { start: '07:00', end: '15:00' }
      }
    }
  });

  console.log('✅ Employees created');

  // Create employment contracts
  await prisma.employmentContract.create({
    data: {
      employeeId: employee1.id,
      startDate: new Date('2024-01-15'),
      monthlySalary: 32000,
      hourlyRate: 185,
      collectiveAgreement: '3F Rengøring',
      workingHours: 37
    }
  });

  await prisma.employmentContract.create({
    data: {
      employeeId: employee2.id,
      startDate: new Date('2024-03-01'),
      monthlySalary: 28000,
      hourlyRate: 165,
      collectiveAgreement: '3F Rengøring',
      workingHours: 37
    }
  });

  await prisma.employmentContract.create({
    data: {
      employeeId: employee3.id,
      startDate: new Date('2023-11-01'),
      monthlySalary: 38000,
      hourlyRate: 205,
      collectiveAgreement: '3F Rengøring',
      workingHours: 37
    }
  });

  console.log('✅ Employment contracts created');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Novo Nordisk A/S',
      address: 'Bagsværd Hovedgade 99, 2880 Bagsværd',
      coordinates: { lat: 55.7586, lon: 12.4629 },
      phone: '+45 44 44 88 88',
      email: 'facilities@novonordisk.com',
      municipality: 'Gladsaxe',
      customerType: 'OFFICE',
      contractType: 'SUBSCRIPTION'
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Netto Bagsværd',
      address: 'Bagsværd Hovedgade 15, 2880 Bagsværd',
      coordinates: { lat: 55.7576, lon: 12.4619 },
      phone: '+45 87 87 87 87',
      email: 'butik.bagsvaerd@netto.dk',
      municipality: 'Gladsaxe',
      customerType: 'COMMERCIAL',
      contractType: 'RECURRING'
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Madklubben Bagsværd',
      address: 'Bagsværd Hovedgade 45, 2880 Bagsværd',
      coordinates: { lat: 55.7566, lon: 12.4609 },
      phone: '+45 32 32 32 32',
      email: 'bagsvaerd@madklubben.dk',
      municipality: 'Gladsaxe',
      customerType: 'COMMERCIAL',
      contractType: 'RECURRING'
    }
  });

  console.log('✅ Customers created');

  // Create cleaning jobs
  const job1 = await prisma.cleaningJob.create({
    data: {
      customerId: customer1.id,
      address: customer1.address,
      coordinates: customer1.coordinates,
      jobType: 'OFFICE_CLEANING',
      estimatedDuration: 180,
      priority: 'HIGH',
      requirements: ['Medicinsk rengøring', 'Specialudstyr'],
      equipmentNeeded: ['HEPA støvsugere', 'Medicinske rengøringsmidler']
    }
  });

  const job2 = await prisma.cleaningJob.create({
    data: {
      customerId: customer2.id,
      address: customer2.address,
      coordinates: customer2.coordinates,
      jobType: 'RETAIL_CLEANING',
      estimatedDuration: 120,
      priority: 'MEDIUM',
      requirements: ['Gulvbehandling', 'Vinduespudsning'],
      equipmentNeeded: ['Gulvmaskine', 'Vinduespudsningsudstyr']
    }
  });

  const job3 = await prisma.cleaningJob.create({
    data: {
      customerId: customer3.id,
      address: customer3.address,
      coordinates: customer3.coordinates,
      jobType: 'RESTAURANT_CLEANING',
      estimatedDuration: 150,
      priority: 'HIGH',
      requirements: ['Køkkenrengøring', 'Fettøj'],
      equipmentNeeded: ['Höjtryk', 'Fetrens']
    }
  });

  console.log('✅ Cleaning jobs created');

  // Create scheduled jobs for today and tomorrow
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's schedule
  await prisma.scheduledJob.create({
    data: {
      jobId: job1.id,
      customerId: customer1.id,
      teamId: team2.id,
      assignedMemberId: employee3.id,
      scheduledDate: today,
      scheduledStart: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
      scheduledEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      status: 'IN_PROGRESS'
    }
  });

  await prisma.scheduledJob.create({
    data: {
      jobId: job2.id,
      customerId: customer2.id,
      teamId: team1.id,
      assignedMemberId: employee1.id,
      scheduledDate: today,
      scheduledStart: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      scheduledEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
      status: 'SCHEDULED'
    }
  });

  // Tomorrow's schedule
  await prisma.scheduledJob.create({
    data: {
      jobId: job3.id,
      customerId: customer3.id,
      teamId: team1.id,
      assignedMemberId: employee2.id,
      scheduledDate: tomorrow,
      scheduledStart: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 20, 0),
      scheduledEnd: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 22, 30),
      status: 'SCHEDULED'
    }
  });

  console.log('✅ Scheduled jobs created');

  // Add some equipment
  await prisma.equipment.create({
    data: {
      teamId: team1.id,
      name: 'Nilfisk VP300 HEPA Støvsuger',
      type: 'VACUUM',
      model: 'VP300',
      serialNumber: 'VP300-2024-001',
      purchaseDate: new Date('2024-01-15'),
      lastInspection: new Date('2024-12-01'),
      nextInspectionDue: new Date('2025-06-01')
    }
  });

  await prisma.equipment.create({
    data: {
      teamId: team2.id,
      name: 'Kärcher HD 6/15 Höjtrykspenser',
      type: 'VEHICLE',
      model: 'HD 6/15',
      serialNumber: 'HD615-2024-002',
      purchaseDate: new Date('2024-02-01'),
      lastInspection: new Date('2024-11-01'),
      nextInspectionDue: new Date('2025-05-01')
    }
  });

  console.log('✅ Equipment added');

  console.log('🎉 Rendetalje OS database seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@rendetalje.dk / admin123');
  console.log('Manager: manager@rendetalje.dk / manager123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });