/**
 * Migration: Create Users Table
 * Creates the users table with role-based access control
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Tenant relationship
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    
    // Basic user info
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20).nullable();
    
    // Profile info
    table.string('avatar_url', 500).nullable();
    table.string('employee_number', 50).nullable();
    table.string('department', 100).nullable();
    table.string('position', 100).nullable();
    table.date('date_of_birth').nullable();
    table.date('hire_date').nullable();
    
    // Danish labor law compliance
    table.string('cpr_number', 11).nullable(); // Danish CPR (encrypted)
    table.jsonb('work_permit_info').nullable(); // For non-EU employees
    table.jsonb('contract_details').nullable(); // Employment contract info
    
    // Role and permissions
    table.enum('role', [
      'super_admin',
      'tenant_admin', 
      'location_manager',
      'shift_manager',
      'employee',
      'readonly'
    ]).notNullable().defaultTo('employee');
    
    table.jsonb('permissions').defaultTo('[]'); // Additional permissions array
    table.jsonb('location_access').defaultTo('[]'); // Location IDs user has access to
    
    // Preferences and settings
    table.string('language', 5).defaultTo('da-DK');
    table.string('timezone', 50).defaultTo('Europe/Copenhagen');
    table.jsonb('notification_preferences').defaultTo(JSON.stringify({
      email: true,
      sms: false,
      push: true,
      inventory: true,
      scheduling: true,
      sales: true,
      alerts: true
    }));
    table.jsonb('dashboard_preferences').defaultTo(JSON.stringify({
      widgets: ['overview', 'sales', 'inventory'],
      layout: 'grid'
    }));
    
    // Authentication and security
    table.string('password_reset_token', 255).nullable();
    table.timestamp('password_reset_expires').nullable();
    table.string('email_verification_token', 255).nullable();
    table.timestamp('email_verified_at').nullable();
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret', 255).nullable();
    table.jsonb('backup_codes').nullable();
    
    // Activity tracking
    table.timestamp('last_login_at').nullable();
    table.string('last_login_ip', 45).nullable();
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until').nullable();
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('terminated_at').nullable();
    table.text('termination_reason').nullable();
    
    // Audit fields
    table.timestamps(true, true);
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.unique(['tenant_id', 'email']); // Email unique per tenant
    table.index(['tenant_id']);
    table.index(['role']);
    table.index(['is_active']);
    table.index(['employee_number']);
    table.index(['email_verification_token']);
    table.index(['password_reset_token']);
    table.index(['last_login_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}
