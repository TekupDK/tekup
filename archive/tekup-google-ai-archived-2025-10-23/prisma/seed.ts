/**
 * Prisma Seed Script for Rendetalje.dk
 * 
 * Tilføjer realistiske test data til Neon database:
 * - Kunder med kontakt information
 * - Leads med forskellige status
 * - Bookings med service types
 * - Quotes (tilbud) med priser
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starter database seeding...');

  // 1. OPRET KUNDER
  console.log('\n📊 Opretter kunder...');

  const customer1 = await prisma.customer.upsert({
    where: { email: 'lars.nielsen@example.com' },
    update: {},
    create: {
      name: 'Lars Nielsen',
      email: 'lars.nielsen@example.com',
      phone: '+45 12 34 56 78',
      address: 'Hovedgade 123, 2100 København Ø',
      status: 'active',
      totalLeads: 3,
      totalBookings: 12,
      totalRevenue: 45600,
      lastContactAt: new Date('2024-09-28'),
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'maria.andersen@example.com' },
    update: {},
    create: {
      name: 'Maria Andersen',
      email: 'maria.andersen@example.com',
      phone: '+45 87 65 43 21',
      address: 'Strandvej 45, 8000 Aarhus C',
      companyName: 'Andersen Consulting',
      status: 'active',
      totalLeads: 2,
      totalBookings: 8,
      totalRevenue: 32400,
      lastContactAt: new Date('2024-09-25'),
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: 'peter.sorensen@example.com' },
    update: {},
    create: {
      name: 'Peter Sørensen',
      email: 'peter.sorensen@example.com',
      phone: '+45 23 45 67 89',
      address: 'Byvej 78, 5000 Odense C',
      status: 'inactive',
      totalLeads: 1,
      totalBookings: 3,
      totalRevenue: 12800,
      lastContactAt: new Date('2024-08-15'),
    },
  });

  const customer4 = await prisma.customer.upsert({
    where: { email: 'anne.christensen@example.com' },
    update: {},
    create: {
      name: 'Anne Christensen',
      email: 'anne.christensen@example.com',
      phone: '+45 34 56 78 90',
      address: 'Parkvej 12, 9000 Aalborg',
      companyName: 'Christensen Properties',
      status: 'active',
      totalLeads: 4,
      totalBookings: 15,
      totalRevenue: 67200,
      lastContactAt: new Date('2024-09-30'),
    },
  });

  console.log(`✅ Oprettet ${[customer1, customer2, customer3, customer4].length} kunder`);

  // 2. OPRET LEADS
  console.log('\n📋 Opretter leads...');

  const lead1 = await prisma.lead.create({
    data: {
      customerId: customer1.id,
      name: 'Lars Nielsen',
      email: 'lars.nielsen@example.com',
      phone: '+45 12 34 56 78',
      address: 'Hovedgade 123, 2100 København Ø',
      taskType: 'Privatrengøring',
      squareMeters: 120,
      rooms: 4,
      status: 'contacted',
      source: 'Website',
      preferredDates: ['2024-10-05', '2024-10-06'],
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      customerId: customer2.id,
      name: 'Maria Andersen',
      email: 'maria.andersen@example.com',
      phone: '+45 87 65 43 21',
      address: 'Strandvej 45, 8000 Aarhus C',
      taskType: 'Erhverv',
      squareMeters: 350,
      status: 'quoted',
      source: 'Referral',
      preferredDates: ['2024-10-10'],
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Thomas Hansen',
      email: 'thomas.hansen@example.com',
      phone: '+45 11 22 33 44',
      address: 'Industrivej 56, 2600 Glostrup',
      taskType: 'Flytterengøring',
      squareMeters: 85,
      rooms: 3,
      status: 'new',
      source: 'Google Ads',
      preferredDates: ['2024-10-15'],
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Susanne Larsen',
      email: 'susanne.larsen@example.com',
      phone: '+45 55 66 77 88',
      address: 'Søvej 23, 8200 Aarhus N',
      taskType: 'Hovedrengøring',
      squareMeters: 140,
      rooms: 5,
      status: 'quoted',
      source: 'Social Media',
      preferredDates: ['2024-10-12', '2024-10-13'],
    },
  });

  console.log(`✅ Oprettet ${[lead1, lead2, lead3, lead4].length} leads`);

  // 3. OPRET QUOTES (TILBUD)
  console.log('\n💰 Opretter tilbud...');

  const quote1 = await prisma.quote.create({
    data: {
      leadId: lead1.id,
      hourlyRate: 350,
      estimatedHours: 4,
      subtotal: 1400,
      vatRate: 0.25,
      total: 1750,
      status: 'accepted',
      validUntil: new Date('2024-10-10'),
      notes: 'Standard privatrengøring - 4 værelser',
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      leadId: lead2.id,
      hourlyRate: 450,
      estimatedHours: 12,
      subtotal: 5400,
      vatRate: 0.25,
      total: 6750,
      status: 'accepted',
      validUntil: new Date('2024-10-15'),
      notes: 'Erhvervsrengøring - stort kontor',
    },
  });

  const quote3 = await prisma.quote.create({
    data: {
      leadId: lead3.id,
      hourlyRate: 400,
      estimatedHours: 6,
      subtotal: 2400,
      vatRate: 0.25,
      total: 3000,
      status: 'sent',
      validUntil: new Date('2024-10-20'),
      notes: 'Flytterengøring - 3 værelser',
    },
  });

  const quote4 = await prisma.quote.create({
    data: {
      leadId: lead4.id,
      hourlyRate: 380,
      estimatedHours: 8,
      subtotal: 3040,
      vatRate: 0.25,
      total: 3800,
      status: 'accepted',
      validUntil: new Date('2024-10-18'),
      notes: 'Hovedrengøring - stort hus',
    },
  });

  console.log(`✅ Oprettet ${[quote1, quote2, quote3, quote4].length} tilbud`);

  // 4. OPRET BOOKINGS
  console.log('\n📅 Opretter bookinger...');

  const booking1 = await prisma.booking.create({
    data: {
      leadId: lead1.id,
      quoteId: quote1.id,
      serviceType: 'Privatrengøring',
      startTime: new Date('2024-10-05T09:00:00'),
      endTime: new Date('2024-10-05T13:00:00'),
      status: 'confirmed',
      notes: 'Husk at medbringe ekstra støvsugere',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      leadId: lead2.id,
      quoteId: quote2.id,
      serviceType: 'Erhverv',
      startTime: new Date('2024-10-10T18:00:00'),
      endTime: new Date('2024-10-11T06:00:00'),
      status: 'confirmed',
      notes: 'Nattevagt - kontor rengøring',
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      leadId: lead4.id,
      quoteId: quote4.id,
      serviceType: 'Hovedrengøring',
      startTime: new Date('2024-10-12T08:00:00'),
      endTime: new Date('2024-10-12T16:00:00'),
      status: 'pending',
      notes: 'Stort hus - husk ekstra mandskab',
    },
  });

  // Flere historiske bookings for at vise trends
  const booking4 = await prisma.booking.create({
    data: {
      leadId: lead1.id,
      serviceType: 'Privatrengøring',
      startTime: new Date('2024-09-20T10:00:00'),
      endTime: new Date('2024-09-20T14:00:00'),
      status: 'completed',
      notes: 'Afsluttet uden problemer',
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      leadId: lead2.id,
      serviceType: 'Erhverv',
      startTime: new Date('2024-09-25T19:00:00'),
      endTime: new Date('2024-09-26T03:00:00'),
      status: 'completed',
    },
  });

  const booking6 = await prisma.booking.create({
    data: {
      leadId: lead1.id,
      serviceType: 'Vinduer',
      startTime: new Date('2024-09-28T09:00:00'),
      endTime: new Date('2024-09-28T12:00:00'),
      status: 'completed',
    },
  });

  // Flere bookings for service distribution
  await prisma.booking.createMany({
    data: [
      {
        leadId: lead1.id,
        serviceType: 'Privatrengøring',
        startTime: new Date('2024-09-15T09:00:00'),
        endTime: new Date('2024-09-15T13:00:00'),
        status: 'completed',
      },
      {
        leadId: lead2.id,
        serviceType: 'Flytterengøring',
        startTime: new Date('2024-09-18T10:00:00'),
        endTime: new Date('2024-09-18T16:00:00'),
        status: 'completed',
      },
      {
        leadId: lead1.id,
        serviceType: 'Airbnb',
        startTime: new Date('2024-09-22T14:00:00'),
        endTime: new Date('2024-09-22T17:00:00'),
        status: 'completed',
      },
    ],
  });

  console.log(`✅ Oprettet 9 bookinger`);

  // 5. OPDATER KUNDE STATISTIK
  console.log('\n🔄 Opdaterer kunde statistik...');

  await prisma.customer.update({
    where: { id: customer1.id },
    data: {
      totalLeads: 1,
      totalBookings: 4,
      totalRevenue: 7000,
    },
  });

  await prisma.customer.update({
    where: { id: customer2.id },
    data: {
      totalLeads: 1,
      totalBookings: 2,
      totalRevenue: 6750,
    },
  });

  console.log('✅ Kunde statistik opdateret');

  console.log('\n🎉 Database seeding færdig!');
  console.log('\n📊 Oversigt:');
  console.log(`   - 4 Kunder`);
  console.log(`   - 4 Leads`);
  console.log(`   - 4 Tilbud`);
  console.log(`   - 9 Bookinger`);
  console.log(`\n✨ Dashboard skulle nu vise rigtige tal!`);
}

main()
  .catch((e) => {
    console.error('❌ Fejl under seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
