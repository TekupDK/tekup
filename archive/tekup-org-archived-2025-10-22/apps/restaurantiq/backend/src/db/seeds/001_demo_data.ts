/**
 * Seed: Demo Data
 * Creates initial demo tenant, user, and location for development
 */

import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('locations').del();
  await knex('users').del();
  await knex('tenants').del();

  // Create demo tenant  
  const [demoTenant] = await knex('tenants').insert({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Demo Restaurant Group',
    subdomain: 'demo',
    email: 'admin@demo-restaurant.dk',
    phone: '+45 12 34 56 78',
    address_street: 'Nyhavn 1',
    address_city: 'København',
    address_postal_code: '1051',
    address_region: 'Region Hovedstaden',
    address_country: 'DK',
    cvr_number: '12345678',
    company_type: 'ApS',
    business_hours: JSON.stringify({
      monday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '12:00', closeTime: '21:00' }
    }),
    status: 'active',
    is_verified: true,
    subscription_plan: 'professional',
    max_locations: 3,
    max_employees: 50,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }).returning('id');

  const tenantId = demoTenant.id || '550e8400-e29b-41d4-a716-446655440000';

  // Create demo admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const [demoUser] = await knex('users').insert({
    id: '550e8400-e29b-41d4-a716-446655440001',
    tenant_id: tenantId,
    email: 'admin@demo-restaurant.dk',
    password_hash: passwordHash,
    first_name: 'Lars',
    last_name: 'Nielsen',
    phone: '+45 12 34 56 78',
    role: 'tenant_admin',
    employee_number: 'EMP001',
    department: 'Management',
    position: 'Restaurant Manager',
    is_active: true,
    is_verified: true,
    email_verified_at: new Date(),
    permissions: JSON.stringify([
      'inventory:read', 'inventory:write', 'inventory:delete',
      'menu:read', 'menu:write', 'menu:delete',
      'staff:read', 'staff:write', 'staff:schedule',
      'sales:read', 'sales:analytics',
      'reports:read', 'reports:create', 'reports:export',
      'settings:read', 'settings:write'
    ])
  }).returning('id');

  const userId = demoUser.id || '550e8400-e29b-41d4-a716-446655440001';

  // Create demo location
  await knex('locations').insert({
    id: '550e8400-e29b-41d4-a716-446655440002',
    tenant_id: tenantId,
    name: 'Demo Restaurant København',
    description: 'Vores flagskibsrestaurant i hjertet af København med autentisk dansk køkken og hyggelig atmosfære.',
    location_code: 'KBH001',
    phone: '+45 33 12 34 56',
    email: 'kbh@demo-restaurant.dk',
    address_street: 'Strøget 15',
    address_city: 'København',
    address_postal_code: '1160',
    address_region: 'Region Hovedstaden',
    address_country: 'DK',
    latitude: 55.6761,
    longitude: 12.5683,
    max_capacity: 80,
    table_count: 20,
    kitchen_capacity: 150,
    floor_area_sqm: 250,
    cuisine_type: 'Danish',
    service_types: JSON.stringify(['dine_in', 'takeaway']),
    accepts_reservations: true,
    has_bar: true,
    has_outdoor_seating: true,
    wheelchair_accessible: true,
    has_parking: false,
    food_authority_id: 'FST123456',
    business_hours: JSON.stringify({
      monday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '12:00', closeTime: '21:00' }
    }),
    kpi_targets: JSON.stringify({
      daily_revenue: 25000, // DKK
      monthly_revenue: 750000, // DKK
      food_cost_percentage: 30,
      labor_cost_percentage: 35,
      customer_satisfaction: 4.5,
      table_turnover: 2.5
    }),
    manager_id: userId,
    status: 'active',
    currently_open: false,
    created_by: userId,
    updated_by: userId
  });

  // Create demo employee
  const empPasswordHash = await bcrypt.hash('employee123', 12);
  await knex('users').insert({
    tenant_id: tenantId,
    email: 'kokken@demo-restaurant.dk',
    password_hash: empPasswordHash,
    first_name: 'Maria',
    last_name: 'Hansen',
    phone: '+45 23 45 67 89',
    role: 'employee',
    employee_number: 'EMP002',
    department: 'Kitchen',
    position: 'Souschef',
    hire_date: '2024-01-15',
    is_active: true,
    is_verified: true,
    email_verified_at: new Date(),
    location_access: JSON.stringify(['550e8400-e29b-41d4-a716-446655440002']),
    permissions: JSON.stringify([
      'inventory:read', 'menu:read', 'sales:read'
    ]),
    created_by: userId,
    updated_by: userId
  });

  // Create demo shift manager
  const managerPasswordHash = await bcrypt.hash('manager123', 12);
  await knex('users').insert({
    tenant_id: tenantId,
    email: 'vagter@demo-restaurant.dk',
    password_hash: managerPasswordHash,
    first_name: 'Michael',
    last_name: 'Andersen',
    phone: '+45 34 56 78 90',
    role: 'shift_manager',
    employee_number: 'EMP003',
    department: 'Service',
    position: 'Vagt Manager',
    hire_date: '2023-06-01',
    is_active: true,
    is_verified: true,
    email_verified_at: new Date(),
    location_access: JSON.stringify(['550e8400-e29b-41d4-a716-446655440002']),
    permissions: JSON.stringify([
      'inventory:read', 'menu:read', 'staff:read', 'staff:schedule',
      'sales:read', 'reports:read'
    ]),
    created_by: userId,
    updated_by: userId
  });

  console.log('✅ Demo data seeded successfully!');
  console.log('🏢 Tenant: demo (http://demo.localhost:4000)');
  console.log('👤 Admin: admin@demo-restaurant.dk / admin123');
  console.log('👤 Employee: kokken@demo-restaurant.dk / employee123');
  console.log('👤 Manager: vagter@demo-restaurant.dk / manager123');
}
